
import { supabase, supabaseAdmin } from '../lib/supabase';
import { createMT5Account } from '../lib/mt5-bridge';
import { EmailService } from './email-service';
import { AffiliateService } from './affiliate-service';
import fs from 'fs';

export class PaymentService {
    /**
     * Finalize an order: Mark as paid and create MT5 account
     */
    static async finalizeOrder(orderId: string, paymentData: {
        paymentId?: string;
        paymentMethod?: string;
        amount?: number;
        status?: string;
        metadata?: any;
    }) {
        console.log(`[PaymentService] Finalizing order ${orderId}...`);

        // 1. Fetch the order
        const { data: order, error: fetchError } = await supabaseAdmin
            .from('payment_orders')
            .select('*, account_types(*)')
            .eq('order_id', orderId)
            .single();

        if (fetchError || !order) {
            throw new Error(`Order ${orderId} not found`);
        }

        if (order.status === 'paid' && order.is_account_created) {
            console.log(`[PaymentService] Order ${orderId} already finalized.`);
            return order;
        }

        // 2. Update status to 'paid' (Atomic check: only if not already paid)
        console.log(`[PaymentService] Marking order ${orderId} as paid...`);
        const { data: updatedOrder, error: updateError } = await supabaseAdmin
            .from('payment_orders')
            .update({
                status: 'paid',
                payment_id: paymentData.paymentId || order.payment_id,
                payment_method: paymentData.paymentMethod || order.payment_method || 'gateway',
                paid_at: new Date().toISOString(),
                metadata: { ...(order.metadata || {}), ...(paymentData.metadata || {}) }
            })
            .eq('order_id', orderId)
            .neq('status', 'paid') // Prevent double-marking as paid
            .select()
            .single();

        if (updateError) {
            // If it failed because another process already marked it as paid, we should fetch it again
            console.warn(`[PaymentService] Order ${orderId} update failed or already paid. Re-fetching...`);
            const { data: reFetchedOrder } = await supabaseAdmin
                .from('payment_orders')
                .select('*, account_types(*)')
                .eq('order_id', orderId)
                .single();
            
            if (reFetchedOrder && reFetchedOrder.status === 'paid' && reFetchedOrder.is_account_created) {
                console.log(`[PaymentService] Order ${orderId} was finalized by another process.`);
                return reFetchedOrder;
            }
            
            // If it's still not finalized (is_account_created is false), we might want to continue or wait.
            // But for simplicity, if we couldn't update it ourselves, we let the other process finish.
            if (reFetchedOrder && reFetchedOrder.status === 'paid' && !reFetchedOrder.is_account_created) {
               console.log(`[PaymentService] Order ${orderId} is being finalized by another process. Waiting...`);
               // Optional: Wait a bit and re-fetch, but for now we'll just return it and let the client poll
               return reFetchedOrder;
            }

            throw new Error(`Failed to update order status: ${updateError.message}`);
        }

        // 3. Resolve user_id if guest checkout
        let userId = updatedOrder.user_id;
        if (!userId) {
            userId = await this.resolveGuestUser(updatedOrder);
            if (userId) {
                await supabaseAdmin.from('payment_orders').update({ user_id: userId }).eq('order_id', orderId);
                updatedOrder.user_id = userId;
            } else {
                throw new Error(`Could not resolve user for order ${orderId}`);
            }
        }

        // 4. Create MT5 Account & Challenge
        const result = await this.issueAccount(updatedOrder);

        // 5. Affiliate Commission
        try {
            await AffiliateService.processCommission(updatedOrder.user_id, updatedOrder.amount, updatedOrder.order_id);
        } catch (affError) {
            console.error('[PaymentService] Affiliate commission error:', affError);
        }

        // 6. BOGO Logic
        try {
            await this.handleBOGO(updatedOrder);
        } catch (bogoError) {
            console.error('[PaymentService] BOGO error:', bogoError);
        }

        return {
            ...updatedOrder,
            ...result
        };
    }

    private static async handleBOGO(order: any) {
        let isBOGO = false;
        if (order.metadata && (order.metadata.coupon_type === 'bogo' || (order.metadata.coupon_type === undefined && order.coupon_code && order.coupon_code.toUpperCase().includes('BOGO')))) {
            isBOGO = true;
        }

        if (!isBOGO && order.coupon_code) {
            const { data: coupon } = await supabaseAdmin
                .from('discount_coupons')
                .select('id, discount_type')
                .ilike('code', order.coupon_code.trim())
                .maybeSingle();

            if (coupon && coupon.discount_type === 'bogo') {
                isBOGO = true;
            }
        }

        if (!isBOGO) return;

        // Check if BOGO account already exists
        const { data: existingBOGO } = await supabaseAdmin
            .from('challenges')
            .select('id')
            .contains('metadata', { parent_order_id: order.order_id, is_bogo_free: true })
            .maybeSingle();

        if (existingBOGO) return;

        console.log(`[PaymentService] Processing BOGO for order ${order.order_id}`);
        // Clone the order but mark it as BOGO free
        const bogoOrder = {
            ...order,
            metadata: {
                ...(order.metadata || {}),
                is_bogo_free: true,
                parent_order_id: order.order_id
            }
        };

        await this.issueAccount(bogoOrder);
    }

    private static async resolveGuestUser(order: any): Promise<string | null> {
        const customerEmail = order.metadata?.customerEmail || order.metadata?.email;
        if (!customerEmail) return null;

        // Try to find existing profile
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .ilike('email', customerEmail)
            .maybeSingle();

        if (profile) return profile.id;

        // Create new user (Simplified for now - webhooks.ts has more robust logic if needed)
        try {
            const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
                email: customerEmail,
                password: Math.random().toString(36).slice(-12) + 'Aa1!',
                email_confirm: true
            });

            if (createError) throw createError;

            const fullName = order.metadata?.customerName || customerEmail.split('@')[0];
            await supabaseAdmin.from('profiles').upsert({
                id: newUser.user.id,
                email: customerEmail,
                full_name: fullName
            });

            return newUser.user.id;
        } catch (err) {
            console.error('[PaymentService] Failed to create guest user:', err);
            return null;
        }
    }

    private static async issueAccount(order: any) {
        // Idempotency: Double check if account already issued for this order
        if (!order.metadata?.is_bogo_free && order.is_account_created) {
            console.warn(`[PaymentService] Order ${order.order_id} already has an account (${order.login}). Skipping issueAccount.`);
            return { challengeId: order.challenge_id, login: order.login };
        }

        // Additional safeguard: check challenges table for this order_id in metadata
        const { data: existingChallenge } = await supabaseAdmin
            .from('challenges')
            .select('id, login')
            .contains('metadata', { order_id: order.order_id })
            .maybeSingle();
        
        if (existingChallenge && !order.metadata?.is_bogo_free) {
            console.warn(`[PaymentService] Found existing challenge for order ${order.order_id}: ${existingChallenge.login}. Skipping.`);
            return { challengeId: existingChallenge.id, login: existingChallenge.login };
        }

        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('full_name, email')
            .eq('id', order.user_id)
            .maybeSingle();

        const fullName = profile?.full_name || 'Trader';
        const email = profile?.email || 'noemail@thefusionfunded.com';

        // MT5 Group Resolution (Enforced: only this group exists in current setup)
        // MT5 Group Resolution
        let mt5Group = order.metadata?.group || 'AUS\\Live\\7401\\grp3';
        let leverage = 100;

        console.log(`[PaymentService] Creating MT5 account for ${email} in group ${mt5Group} with size ${order.account_size}...`);

        // Create MT5 Account
        const mt5Data = await createMT5Account({
            name: fullName,
            email: email,
            group: mt5Group,
            leverage: leverage,
            balance: order.account_size,
            callback_url: `${process.env.BACKEND_URL || process.env.FRONTEND_URL}/api/webhooks/mt5`
        }) as any;
        
        console.log(`[PaymentService] MT5 account created successfully: ${mt5Data?.login}`);

        // Resolve Challenge Type
        const challengeType = this.mapChallengeType(order);

        // Create Challenge Record
        const { data: challenge, error: challengeError } = await supabaseAdmin
            .from('challenges')
            .insert({
                user_id: order.user_id,
                challenge_type: challengeType,
                initial_balance: order.account_size,
                current_balance: order.account_size,
                current_equity: order.account_size,
                start_of_day_equity: order.account_size,
                status: 'active',
                login: mt5Data.login,
                master_password: mt5Data.password,
                investor_password: mt5Data.investor_password || '',
                server: mt5Data.server || 'ALFX Limited',
                platform: order.platform,
                leverage: leverage,
                group: mt5Group,
                metadata: {
                    ...(order.metadata || {}),
                    order_id: order.order_id,
                    plan: 'HFT Phase 1',
                    model: 'HFT'
                }
            })
            .select()
            .single();

        if (challengeError) throw challengeError;

        // Update Order
        await supabaseAdmin.from('payment_orders').update({
            challenge_id: challenge.id,
            is_account_created: true,
            login: mt5Data.login,
            master_password: mt5Data.password,
            investor_password: mt5Data.investor_password,
            server: mt5Data.server
        }).eq('order_id', order.order_id);

        // Send Email
        if (email) {
            await EmailService.sendAccountCredentials(
                email,
                fullName,
                String(mt5Data.login),
                mt5Data.password,
                mt5Data.server || 'ALFX Limited',
                mt5Data.investor_password
            ).catch(e => console.error('Failed to send credentials email:', e));
        }

        return { challengeId: challenge.id, login: mt5Data.login };
    }

    private static mapChallengeType(order: any): string {
        let model = (order.model || '').toLowerCase();
        let type = (order.metadata?.type || '').toLowerCase();

        if (!type && order.metadata?.account_type) {
            const at = order.metadata.account_type.toLowerCase();
            if (at.includes('instant')) type = 'instant';
            else if (at.includes('1-step')) type = '1-step';
            else if (at.includes('2-step')) type = '2-step';
        }

        if (model && type) {
            const normalizedType = type.replace('-', '_').replace(' ', '_');
            // Use specific HFT challenge types (requires DB constraint update)
            if (model.includes('hft')) {
                if (normalizedType.includes('phase1') || normalizedType.includes('phase_1')) return 'hft2_phase1';
                if (normalizedType.includes('funded')) return 'hft2_funded';
                return 'hft2_phase1';
            }
            return normalizedType === '2_step' ? `${model}_2_step_phase_1` : `${model}_${normalizedType}`;
        }

        const rawName = (order.account_type_name || '').toLowerCase();
        if (rawName.includes('lite')) {
            if (rawName.includes('instant')) return 'lite_instant';
            if (rawName.includes('1-step')) return 'lite_1_step';
            if (rawName.includes('2-step')) return 'lite_2_step_phase_1';
        }
        return 'evaluation';
    }
}
