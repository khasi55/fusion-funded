
import { supabase, supabaseAdmin } from '../lib/supabase';
import fs from 'fs';

export class AffiliateService {
    static async processCommission(userId: string, amount: number, orderId: string) {
        const logFile = '/tmp/debug_hooks.log';
        const log = (msg: string) => {
            try {
                fs.appendFileSync(logFile, `${new Date().toISOString()} - ${msg}\n`);
            } catch (e) { }
        };

        log(`🚀 START processCommission: User ${userId}, Order ${orderId}, Amount ${amount}`);

        // 0. Check if commission already exists for this order to avoid duplicates
        const { data: existingComm } = await supabaseAdmin
            .from('affiliate_earnings')
            .select('id')
            .contains('metadata', { order_id: orderId })
            .maybeSingle();

        if (existingComm) {
            log(`ℹ️ Commission already exists for order ${orderId}. Skipping duplicate.`);
            return;
        }

        const { data: orderData } = await supabaseAdmin
            .from('payment_orders')
            .select('metadata, coupon_code')
            .eq('order_id', orderId)
            .maybeSingle();

        let referrerId = orderData?.metadata?.affiliate_id;

        // Fallback: Check Coupon Code
        if (!referrerId && orderData?.coupon_code) {
            const { data: coupon } = await supabaseAdmin
                .from('discount_coupons')
                .select('affiliate_id')
                .ilike('code', orderData.coupon_code.trim())
                .maybeSingle();

            if (coupon?.affiliate_id) {
                referrerId = coupon.affiliate_id;
                log(`✅ Found referrer from coupon: ${referrerId}`);
            }
        }

        if (!referrerId) {
            // Fallback to profile referral
            const { data: profile } = await supabaseAdmin
                .from('profiles')
                .select('referred_by')
                .eq('id', userId)
                .maybeSingle();

            referrerId = profile?.referred_by;
        }

        if (!referrerId) {
            log(`ℹ️ No referrer for user ${userId}`);
            return;
        }

        log(`✅ Referrer found: ${referrerId}`);

        // 2. Calculate Commission
        let commissionRate = 0.07; // System Default

        if (orderData?.metadata?.commission_rate !== undefined && orderData?.metadata?.commission_rate !== null) {
            commissionRate = Number(orderData.metadata.commission_rate) / 100;
        } else if (orderData?.coupon_code) {
            const { data: coupon } = await supabase
                .from('discount_coupons')
                .select('commission_rate')
                .ilike('code', orderData.coupon_code.trim())
                .maybeSingle();

            if (coupon?.commission_rate !== undefined && coupon?.commission_rate !== null) {
                commissionRate = Number(coupon.commission_rate) / 100;
            }
        }

        if (commissionRate === 0.07) {
            const { data: affiliate } = await supabase
                .from('profiles')
                .select('affiliate_percentage')
                .eq('id', referrerId)
                .maybeSingle();

            if (affiliate?.affiliate_percentage !== undefined && affiliate?.affiliate_percentage !== null) {
                commissionRate = Number(affiliate.affiliate_percentage) / 100;
            }
        }

        const commissionAmount = Number((amount * commissionRate).toFixed(2));
        if (commissionAmount <= 0) return;

        // 3. Insert Earnings Record
        await supabaseAdmin.from('affiliate_earnings').insert({
            referrer_id: referrerId,
            referred_user_id: userId,
            amount: commissionAmount,
            commission_type: 'purchase',
            status: 'pending',
            metadata: {
                order_id: orderId,
                order_amount: amount,
                rate: commissionRate,
                is_custom_rate: commissionRate !== 0.07
            }
        });

        // 4. Update Profile Totals
        await supabaseAdmin.rpc('increment_affiliate_commission', {
            p_user_id: referrerId,
            p_amount: commissionAmount
        });
    }
}
