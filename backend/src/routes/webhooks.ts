import { Router, Response, Request } from 'express';
import { supabase, supabaseAdmin } from '../lib/supabase';
import { createMT5Account } from '../lib/mt5-bridge';
import { EmailService } from '../services/email-service';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { paymentGatewayRegistry } from '../services/payment-gateways';
import { PaymentService } from '../services/payment-service';

const router = Router();

router.post('/mt5', async (req: Request, res: Response) => {
    // Security Check: Verify Shared Secret
    const authorizedSecret = process.env.MT5_WEBHOOK_SECRET;
    const receivedSecret = req.headers['x-mt5-secret'] || req.headers['x-webhook-secret'];

    if (authorizedSecret && authorizedSecret !== 'your_mt5_webhook_secret_here' && receivedSecret !== authorizedSecret) {
        console.warn(`🛑 Blocked unauthorized MT5 webhook attempt from ${req.ip}`);
        res.status(403).json({ error: 'Unauthorized: Invalid MT5 Secret' });
        return;
    }
    try {
        const { login, trades, event } = req.body;

        // Use a more relaxed check: allow payload if it has trades OR a status event
        if (!login || (!trades && !event)) {
            res.status(400).json({ error: 'Missing login or trades/event' });
            return;
        }

        // PHASE 4 EVENT-DRIVEN ARCHITECTURE
        // Instead of processing everything here (slow), we publish the event to Redis.
        // The Worker will handle DB upsert and Risk Checks.

        const { getRedis } = await import('../lib/redis');

        const eventData = {
            login,
            trades: trades || [], // Fallback to empty array if status update
            event: event || 'trade_update', // Default to trade_update
            timestamp: Date.now(),
            ...req.body // Pass through all bridge metadata (equity, balance, reason, etc.)
        };

        // Publish to 'events:trade_update' channel
        await getRedis().publish('events:trade_update', JSON.stringify(eventData));

        // Respond immediately (High Performance)
        res.json({ success: true, queued: true });

    } catch (error: any) {
        console.error('Webhook error:', error);
        res.status(500).json({ error: error.message });
    }
});

const verifyPaymentSecret = (req: Request): boolean => {
    // 🛡️ Global Security Check: Use for unknown gateways or as a baseline
    const webhookSecret = process.env.PAYMENT_WEBHOOK_SECRET;
    if (!webhookSecret) {
        console.warn('⚠️ No PAYMENT_WEBHOOK_SECRET configured. Security is degraded.');
        return process.env.NODE_ENV === 'development'; // Allow only in dev if secret is missing
    }

    const signature = req.headers['x-payment-signature'] || req.headers['x-hub-signature-256'];
    if (!signature) return false;

    try {
        const hmac = crypto.createHmac('sha256', webhookSecret);
        const bodyStr = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
        const expected = hmac.update(bodyStr).digest('hex');
        
        // Handle 'sha256=' prefix if present (common in webhooks)
        const received = String(signature).replace('sha256=', '');
        
        const receivedBuf = Buffer.from(received);
        const expectedBuf = Buffer.from(expected);
        
        if (receivedBuf.length !== expectedBuf.length) return false;
        
        return crypto.timingSafeEqual(receivedBuf, expectedBuf);
    } catch (e) {
        return false;
    }
};

router.post('/payment', async (req: Request, res: Response) => {
    // 🛡️ Log Entry
    const logEntry = `[${new Date().toISOString()}] POST /api/webhooks/payment - RAW - From: ${req.ip}\n`;
    fs.appendFileSync('backend_request_debug.log', logEntry);

    // Ensure we have a body
    if (!req.body || Object.keys(req.body).length === 0) {
        console.warn('[Webhook] Received empty body on /payment');
    }

    await handlePaymentWebhook(req, res);
});

/**
 * Payment Redirection Handler (GET)
 * User arrives here after checkout
 */
router.get('/payment', async (req: Request, res: Response) => {
    // For GET redirects, we usually just want to send them to the frontend
    // We SHOULD NOT process the order here unless signed.

    // Check if signed (unlikely for standard redirects)
    if (verifyPaymentSecret(req)) {
        await handlePaymentWebhook(req, res);
    } else {
        // Safe Fallback: Redirect to Frontend "Processing" or "Success" page
        // The Frontend will poll for the "is_account_created" status from the API

        const internalOrderId = req.query.reference_id as string ||
            req.query.reference as string ||
            req.query.orderId as string ||
            req.query.orderID as string ||
            req.query.orderid as string;
        const statusParam = req.query.status as string;
        // Use consistent Frontend URL logic
        const frontendUrl = process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://app.fusionfunded.com';

        if (internalOrderId) {
            if (statusParam === 'failed') {
                return res.redirect(`${frontendUrl}/payment/failed?orderId=${internalOrderId}`);
            }
            return res.redirect(`${frontendUrl}/payment/success?orderId=${internalOrderId}&check_status=true`);
        }
        return res.redirect(`${frontendUrl}/dashboard`);
    }
});

/**
 * Cregis Webhook Handler
 */
router.post('/cregis', async (req: Request, res: Response) => {
    // DEBUG: Log Headers to diagnose Content-Type mismatch
    console.log('[Webhook] Cregis Headers:', JSON.stringify(req.headers));

    // FORCE PARSE: If body is empty, try to read stream (handling text/plain or other types)
    if (!req.body || Object.keys(req.body).length === 0) {
        try {
            const rawBody = await new Promise<string>((resolve, reject) => {
                let data = '';
                req.setEncoding('utf8');
                req.on('data', chunk => data += chunk);
                req.on('end', () => resolve(data));
                req.on('error', err => reject(err));
            });

            if (rawBody) {
                console.log('[Webhook] Cregis Raw Body Captured:', rawBody);
                try {
                    req.body = JSON.parse(rawBody);
                } catch (e) {
                    console.warn('[Webhook] Failed to JSON parse raw body:', e);
                    // attempt query string parse if JSON fails?
                    // req.body = require('querystring').parse(rawBody);
                }
            } else {
                console.warn('[Webhook] Cregis Body is truly empty.');
            }
        } catch (e) {
            console.error('[Webhook] Error reading stream:', e);
        }
    }

    console.log('[Webhook] Cregis Event (Parsed):', JSON.stringify(req.body));

    // Verify Cregis Signature
    try {
        const { paymentGatewayRegistry } = await import('../services/payment-gateways');
        const cregis = paymentGatewayRegistry.getGateway('cregis');
        
        if (cregis) {
            const isValid = await cregis.verifyWebhook(req.headers, req.body);
            if (isValid) {
                console.log('[Webhook] Cregis signature status verified.');
                req.body.verified_by_preprocessor = true;
            }
        } else {
            console.error('[Webhook] Cregis gateway not found in registry');
            return res.status(500).json({ error: 'Gateway not found' });
        }
    } catch (verError) {
        console.error('[Webhook] Cregis verification error:', verError);
        return res.status(500).json({ error: 'Internal Error: Cregis Verification' });
    }

    // Adapt Cregis payload to internal structure expected by handlePaymentWebhook
    // Cregis sends: third_party_id (OrderId), status (1=success), amount

    // Mutate req.body to match what handlePaymentWebhook looks for
    if (req.body) {
        // Flatten nested 'data' object if present (Cregis V2 structure)
        if (req.body.data) {
            let data = req.body.data;

            // Fix: Cregis sends 'data' as a JSON string, not an object
            if (typeof data === 'string') {
                try {
                    console.log('[Webhook] Cregis: Parsing stringified data field');
                    data = JSON.parse(data);
                } catch (e) {
                    console.warn('[Webhook] Failed to parse Cregis data string:', e);
                }
            }

            if (typeof data === 'object') {
                console.log('[Webhook] Cregis: Flattening nested data object');
                req.body.order_id = data.order_id || req.body.order_id;
                req.body.amount = data.order_amount || data.amount || req.body.amount;
                // Map status from data if present
                if (data.status) req.body.status = data.status;
                // Map transaction ID
                req.body.transaction_id = data.cregis_id || data.payment_id;
            }
        }

        req.body.reference_id = req.body.third_party_id || req.body.order_id;

        const rawStatus = String(req.body.status || '').toLowerCase();
        req.body.status = (req.body.status == 1 || rawStatus === 'paid' || rawStatus === 'success' || req.body.payment_status === 'paid' || rawStatus === 'paid_over' || req.body.event_type === 'paid_over') ? 'success' : 'failed';

        req.body.gateway = 'cregis';
        req.body.transaction_id = req.body.transaction_id || req.body.order_id || req.body.payment_id; // Cregis Order ID

        // Map amount if needed (cregis might send 'order_amount' or 'amount')
        if (!req.body.amount && req.body.order_amount) req.body.amount = req.body.order_amount;
    }

    await handlePaymentWebhook(req, res);
});

async function handlePaymentWebhook(req: Request, res: Response) {
    try {
        // Merge query and body params for robust payload checking (gateways like SharkPay send 'gateway' in query)
        const body = { ...req.body, ...req.query };
        
        // 🔍 DEEP DEBUG: Log the parsed body and query to see why gateway is missing
        console.log(`[Webhook Debug] Raw Query:`, JSON.stringify(req.query));
        console.log(`[Webhook Debug] Raw Body:`, JSON.stringify(req.body));
        console.log(`[Webhook Debug] Merged Payload Keys:`, Object.keys(body));

        // Helper to find value in object (case-insensitive and deep scan for EPay)
        const getPayloadValue = (obj: any, keys: string[]) => {
            if (!obj || typeof obj !== 'object') return null;
            for (const key of keys) {
                // 1. Direct match
                if (obj[key] !== undefined && obj[key] !== null) return obj[key];
                // 2. Case-insensitive match
                for (const k in obj) {
                    if (k.toLowerCase() === key.toLowerCase() && obj[k] !== undefined && obj[k] !== null) return obj[k];
                }
            }
            return null;
        };

        const userAgent = String(req.headers['user-agent'] || '').toLowerCase();
        const gatewayName = getPayloadValue(body, ['gateway']) || 
                           (userAgent.includes('fusionfunded-callback') ? 'fusionpay' : 
                           (body.mid ? 'epay' : 'unknown'));
        
        const internalOrderId = getPayloadValue(body, ['reference_id', 'reference', 'orderid', 'orderId', 'internalOrderId', 'order_id']);
        const status = getPayloadValue(body, ['status', 'transt', 'transactionStatus']);
        const amount = getPayloadValue(body, ['amount', 'tranmt', 'receive_amount', 'orderAmount']);

        // 🛡️ SIGNATURE VERIFICATION
        let gateway;
        try {
            gateway = paymentGatewayRegistry.getGateway(gatewayName);
            console.log(`[Webhook Debug] Gateway identified: ${gatewayName}, Instance found: ${!!gateway}`);
        } catch (registryError) {
            console.error('[Webhook Error] Failed to retrieve gateway from registry:', registryError);
            return res.status(500).json({ error: 'Internal Error: Gateway Registry Failure' });
        }
        
        // Skip verification if already done by a pre-processor (like Cregis)
        if (body.verified_by_preprocessor) {
            console.log(`[Webhook] Skipping secondary verification for ${gatewayName} (already verified)`);
        } else if (gateway) {
            try {
                const isValid = await gateway.verifyWebhook(req.headers, body);
                if (!isValid) {
                    console.error(`🛑 [Webhook] Unauthorized ${gatewayName} webhook attempt for order ${internalOrderId} from ${req.ip}`);
                    return res.status(401).json({ error: 'Unauthorized: Invalid Signature' });
                }
                console.log(`✅ [Webhook] ${gatewayName} signature verified for order ${internalOrderId}`);
            } catch (verifyError) {
                console.error(`[Webhook Error] Verification failed for ${gatewayName}:`, verifyError);
                return res.status(500).json({ error: 'Internal Error: Verification Logic Failure' });
            }
        } else {
            console.warn(`⚠️ [Webhook] Unknown gateway ${gatewayName}. Proceeding with baseline verification.`);
            try {
                if (!verifyPaymentSecret(req)) {
                   console.error(`🛑 [Webhook] Global signature verification failed for unknown gateway ${gatewayName}`);
                   return res.status(401).json({ error: 'Unauthorized: Invalid Global Signature' });
                }
            } catch (globalVerifyError) {
                console.error('[Webhook Error] Global verification failed:', globalVerifyError);
                return res.status(500).json({ error: 'Internal Error: Global Verification Failure' });
            }
        }

        // Use consistent Frontend URL logic
        const frontendUrl = process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://app.fusionfunded.com';

        if (!internalOrderId) {
            console.error('❌ Missing order ID in webhook. BodyKeys:', Object.keys(body), 'Body:', body);
            if (req.method === 'GET') return res.redirect(`${frontendUrl}/dashboard`);
            return res.status(400).json({ error: 'Missing order ID' });
        }

        // 1. Log webhook for audit
        await supabaseAdmin.from('webhook_logs').insert({
            event_type: body.event || body.event_type || 'unknown',
            gateway: gatewayName,
            order_id: internalOrderId,
            gateway_order_id: body.transactionid || body.transaction_id || body.orderId || body.orderid || body.cregis_id,
            amount: amount,
            status: status || 'unknown',
            utr: body.utr,
            request_body: body,
        });

        // 2. Fetch existing order to preserve metadata
        const { data: existingOrder, error: fetchError } = await supabaseAdmin
            .from('payment_orders')
            .select('*')
            .eq('order_id', internalOrderId)
            .single();

        if (fetchError || !existingOrder) {
            console.error(`❌ [Payment] Order not found for ${internalOrderId}`);
            if (req.method === 'GET') return res.redirect(`${frontendUrl}/dashboard`);
            return res.status(404).json({ error: 'Order not found' });
        }

        // 3. Determine Success
        const statusLower = String(status || '').toLowerCase();
        const isSuccess =
            statusLower === 'success' ||
            statusLower === 'paid' ||
            statusLower === 'paid_over' ||
            statusLower === 'verified' ||
            statusLower === 'purchased' ||
            statusLower === 'payment accepted' ||
            body.event === 'payment.success';

        if (!isSuccess) {
            console.log('⚠️ Payment not successful:', status);

            // Preserve existing metadata during update
            await supabaseAdmin.from('payment_orders')
                .update({ 
                    status: 'failed', 
                    metadata: { 
                        ...(existingOrder.metadata || {}), 
                        ...body, 
                        failure_reason: status 
                    } 
                })
                .eq('order_id', internalOrderId);

            if (req.method === 'GET') {
                return res.redirect(`${frontendUrl}/payment/failed?orderId=${internalOrderId}`);
            }
            return res.json({ message: 'Payment not successful' });
        }

        // 3. Status Update (Atomic)

        // Fetch order already handled above

            // 🛡️ SECURITY FIX: Currency-Aware Underpayment Validation
        let receivedAmount = Number(amount);
        const expectedAmount = Number(existingOrder.amount);
        const orderCurrency = (existingOrder.currency || 'USD').toUpperCase();
        
        // Convert received amount to USD if gateway is FusionPay (which sends INR)
        if (gatewayName === 'fusionpay' && orderCurrency === 'USD') {
            const USD_TO_INR = 98; // Sync with fusionpay.ts (formerly sharkpay.ts)
            receivedAmount = receivedAmount / USD_TO_INR;
            console.log(`[Webhook API] Converted FusionPay INR ${amount} to USD ${receivedAmount.toFixed(2)}`);
        }

        if (isNaN(receivedAmount) || isNaN(expectedAmount) || (receivedAmount < (expectedAmount - 0.5))) {
            console.warn(`⚠️ Underpayment detected for ${internalOrderId}. Paid: ${receivedAmount.toFixed(2)} ${orderCurrency}, Expected: ${expectedAmount} ${orderCurrency}`);

            await supabaseAdmin.from('payment_orders').update({
                status: 'partial_paid',
                payment_id: body.paymentId || body.transaction_id || body.utr,
                payment_method: body.paymentMethod || 'gateway',
                metadata: { ...existingOrder.metadata, received_amount: receivedAmount, raw_webhook_amount: amount, gateway_currency: gatewayName === 'sharkpay' ? 'INR' : orderCurrency }
            }).eq('order_id', internalOrderId);

            return res.json({ message: 'Payment partial, account not created' });
        }

        // 3. Status Update (Atomic) via PaymentService
        try {
            await PaymentService.finalizeOrder(internalOrderId, {
                paymentId: body.paymentId || body.transaction_id || body.utr,
                paymentMethod: body.paymentMethod || 'gateway',
                amount: receivedAmount,
                metadata: { ...existingOrder.metadata, ...body }
            });
        } catch (finalizeError: any) {
            console.error(`❌ [Payment] Finalization error for ${internalOrderId}:`, finalizeError.message);
            // Even if finalization fails (e.g. MT5 down), we've marked as paid in the first step usually?
            // Actually PaymentService.finalizeOrder is atomic-ish.
            return res.status(500).json({ error: 'Order finalization failed' });
        }

        res.json({ success: true, message: 'Process completed' });

    } catch (error: any) {
        console.error('❌ Payment Webhook Error:', error);
        try {
            fs.appendFileSync('debug_webhook_error.log', `[WEBHOOK ERROR] ${new Date().toISOString()} - ${error.message} - Stack: ${error.stack}\n`);
        } catch (e) {}
        fs.appendFileSync('backend_request_debug.log', `[WEBHOOK ERROR] ${new Date().toISOString()} - ${error.message} - Stack: ${error.stack}\n`);
        if (req.method === 'GET') {
            return res.redirect(`${process.env.FRONTEND_URL}/payment/failed`);
        }
        res.status(500).json({ error: 'Internal processing error' });
    }
}

export default router;
