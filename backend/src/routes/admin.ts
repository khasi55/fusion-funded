import { Router, Response, Request } from 'express';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { supabase } from '../lib/supabase';
import { createMT5Account, disableMT5Account } from '../lib/mt5-bridge';
import { EmailService } from '../services/email-service';
import { AuditLogger } from '../lib/audit-logger';
import { AutomationService } from '../services/automation-service';

const router = Router();

router.post('/upgrade-account', authenticate, requireRole(['super_admin', 'admin', 'risk_admin']), async (req: AuthRequest, res: Response) => {
    try {
        const { accountId, nextType, nextGroup } = req.body;

        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        if (!accountId) {
            return res.status(400).json({ error: 'Account ID is required' });
        }

        // Use AutomationService for the core logic
        const result = await AutomationService.upgradeAccount(accountId, {
            nextType,
            nextGroup,
            isAutomated: false,
            adminEmail: req.user.email
        });

        res.json({
            message: 'Account upgraded successfully',
            ...result
        });

    } catch (error: any) {
        console.error('Upgrade error:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
});

router.post('/breach-account', authenticate, requireRole(['super_admin', 'admin', 'risk_admin']), async (req: AuthRequest, res: Response) => {
    try {
        const { accountId, reason, comment } = req.body;

        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        if (!accountId) {
            return res.status(400).json({ error: 'Account ID is required' });
        }

        // Fetch the account
        const { data: account, error: fetchError } = await supabase
            .from('challenges')
            .select('*')
            .eq('id', accountId)
            .single();

        if (fetchError || !account) {
            return res.status(404).json({ error: 'Account not found' });
        }

        // 1. Update status in Supabase
        const { error: updateError } = await supabase
            .from('challenges')
            .update({
                status: 'breached',
                updated_at: new Date().toISOString()
            })
            .eq('id', accountId);

        if (updateError) {
            throw new Error(`Failed to update account status: ${updateError.message}`);
        }

        // 2. Disable MT5 account
        if (account.login) {
            disableMT5Account(account.login).catch(err => {
                console.error(`❌ Bridge failed to disable account ${account.login}:`, err.message);
            });
        }

        // 3. Send Email
        const { data: profile } = await supabase
            .from('profiles')
            .select('email, full_name')
            .eq('id', account.user_id)
            .single();

        if (profile?.email) {
            EmailService.sendBreachNotification(
                profile.email,
                profile.full_name || 'Trader',
                String(account.login),
                reason || 'Manual Breach',
                'Account has been manually breached by administrator.',
                comment
            ).catch(err => console.error("Async Email Error in Breach:", err));
        }

        AuditLogger.warn(req.user.email, `Manually breached account ${account.login}`, { accountId, reason, comment, category: 'Account' });

        res.json({ success: true, message: 'Account breached successfully' });

    } catch (error: any) {
        console.error('Breach error:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

router.post('/reject-account', authenticate, requireRole(['super_admin', 'admin', 'risk_admin']), async (req: AuthRequest, res: Response) => {
    try {
        const { accountId, reason, comment } = req.body;

        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        if (!accountId) {
            return res.status(400).json({ error: 'Account ID is required' });
        }

        // Fetch the account
        const { data: account, error: fetchError } = await supabase
            .from('challenges')
            .select('*')
            .eq('id', accountId)
            .single();

        if (fetchError || !account) {
            return res.status(404).json({ error: 'Account not found' });
        }

        // 1. Update status in Supabase
        const { error: updateError } = await supabase
            .from('challenges')
            .update({
                status: 'disabled', // Rejection of a pass leads to terminal 'disabled' state
                updated_at: new Date().toISOString()
            })
            .eq('id', accountId);

        if (updateError) {
            throw new Error(`Failed to update account status: ${updateError.message}`);
        }

        // 2. Disable MT5 account
        if (account.login) {
            disableMT5Account(account.login).catch(err => {
                console.error(`❌ Bridge failed to disable account ${account.login}:`, err.message);
            });
        }

        // 3. Send Email
        const { data: profile } = await supabase
            .from('profiles')
            .select('email, full_name')
            .eq('id', account.user_id)
            .single();

        if (profile?.email) {
            EmailService.sendRejectNotification(
                profile.email,
                profile.full_name || 'Trader',
                String(account.login),
                reason || 'Upgrade Rejected',
                comment
            ).catch(err => console.error("Async Email Error in Reject:", err));
        }

        AuditLogger.warn(req.user.email, `Rejected upgrade for account ${account.login}`, { accountId, reason, comment, category: 'Account' });

        res.json({ success: true, message: 'Account upgrade rejected successfully' });

    } catch (error: any) {
        console.error('Reject error:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

export default router;
