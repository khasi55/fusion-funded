
import { Router, Response } from 'express';
import { authenticate, AuthRequest, requireRole } from '../middleware/auth';
import { PaymentService } from '../services/payment-service';
import { supabaseAdmin } from '../lib/supabase';

const router = Router();

/**
 * POST /api/admin/orders/:orderId/approve
 * Manually approve a pending_approval order (Manual Crypto)
 */
router.post('/:orderId/approve', authenticate, requireRole(['super_admin', 'payouts_admin', 'admin']), async (req: AuthRequest, res: Response) => {
    try {
        const { orderId } = req.params;
        const { transactionId, note, proofUrl } = req.body;

        console.log(`[Admin API] Approving order ${orderId} by ${req.user.email}`);

        // 1. Get current order status
        const { data: order, error: fetchError } = await supabaseAdmin
            .from('payment_orders')
            .select('status, payment_gateway')
            .eq('order_id', orderId)
            .single();

        if (fetchError || !order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        if (order.status === 'paid') {
            return res.status(400).json({ error: 'Order is already paid' });
        }

        // 2. Finalize using PaymentService
        const result = await PaymentService.finalizeOrder(orderId, {
            paymentId: transactionId || `MANUAL-APPV-${Date.now()}`,
            paymentMethod: 'manual_crypto',
            metadata: {
                approved_by: req.user.email,
                approval_note: note,
                proof_url: proofUrl,
                manual_approval: true
            }
        });

        res.json({
            success: true,
            message: 'Order approved and account issued successfully',
            data: result
        });
    } catch (error: any) {
        console.error('[Admin API] Approval failed:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
});

/**
 * POST /api/admin/orders/:orderId/deny
 * Manually deny a pending_approval order
 */
router.post('/:orderId/deny', authenticate, requireRole(['super_admin', 'payouts_admin', 'admin']), async (req: AuthRequest, res: Response) => {
    try {
        const { orderId } = req.params;
        const { reason } = req.body;

        console.log(`[Admin API] Denying order ${orderId} by ${req.user.email}`);

        const { data: order, error: fetchError } = await supabaseAdmin
            .from('payment_orders')
            .select('status, metadata')
            .eq('order_id', orderId)
            .single();

        if (fetchError || !order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        if (order.status !== 'pending') {
            return res.status(400).json({ error: 'Only pending orders can be denied' });
        }

        const updatedMetadata = {
            ...(order.metadata || {}),
            denied_by: req.user.email,
            denial_reason: reason,
            denied_at: new Date().toISOString()
        };

        const { error: updateError } = await supabaseAdmin
            .from('payment_orders')
            .update({
                status: 'failed',
                metadata: updatedMetadata
            })
            .eq('order_id', orderId);

        if (updateError) {
            throw updateError;
        }

        res.json({
            success: true,
            message: 'Order denied successfully'
        });
    } catch (error: any) {
        console.error('[Admin API] Deny failed:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
});

export default router;
