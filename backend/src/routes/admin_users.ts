import { Router, Response } from 'express';
import { authenticate, AuthRequest, requireRole } from '../middleware/auth';
import { AuditLogger } from '../lib/audit-logger';
import { supabase } from '../lib/supabase';

const router = Router();

// POST /api/admin/users/update-email
router.post('/update-email', authenticate, requireRole(['super_admin']), async (req: AuthRequest, res: Response) => {
    try {
        const { userId, newEmail } = req.body;

        if (!userId || !newEmail) {
            return res.status(400).json({ error: 'Missing userId or newEmail' });
        }

        // Fetch user email for logging
        const { data: userToUpdate } = await supabase.from('profiles').select('email').eq('id', userId).single();
        const userEmail = userToUpdate?.email || userId;

        AuditLogger.info(req.user?.email || 'admin', `Updated user email for ${userEmail} to ${newEmail}`, { userId, newEmail, category: 'User' });

        // 1. Update in Supabase Auth
        const { data: user, error: authError } = await supabase.auth.admin.updateUserById(
            userId,
            { email: newEmail, email_confirm: true }
        );

        if (authError) {
            console.error('Showstopper: Auth update failed', authError);
            return res.status(500).json({ error: 'Auth Update Failed: ' + authError.message });
        }

        // 2. Update in Profiles Table
        const { error: dbError } = await supabase
            .from('profiles')
            .update({ email: newEmail })
            .eq('id', userId);

        if (dbError) {
            console.error('Warning: Profile update failed', dbError);
            return res.status(500).json({ error: 'Profile Update Failed: ' + dbError.message });
        }

        res.json({ success: true, message: 'Email updated successfully', user });

    } catch (error: any) {
        console.error('Admin Update Email Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/admin/users/create - Create a new user manually
router.post('/create', authenticate, requireRole(['super_admin']), async (req: AuthRequest, res: Response) => {
    try {
        const { email, password, full_name, country, phone } = req.body;

        if (!email || !password || !full_name) {
            return res.status(400).json({ error: 'Missing required fields: email, password, full_name' });
        }

        AuditLogger.info(req.user?.email || 'admin', `Created new user: ${email}`, { email, category: 'User' });

        // 1. Create User in Supabase Auth
        const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true, // Auto-confirm email since admin created it
            user_metadata: { full_name, country, phone }
        });

        if (authError) {
            console.error('Showstopper: Auth creation failed', authError);
            return res.status(400).json({ error: 'Auth Creation Failed: ' + authError.message });
        }

        if (!authUser.user) {
            return res.status(500).json({ error: 'User created but no user object returned' });
        }

        // 2. Create Profile in Public Table (if not auto-created by triggers)
        const profileData = {
            id: authUser.user.id,
            email,
            full_name,
            country,
            phone,
            phone_number: phone, // Backward compatibility
            role: 'user' // Default role
        };

        const { error: dbError } = await supabase
            .from('profiles')
            .upsert(profileData);

        if (dbError) {
            console.error('Warning: Profile creation/update failed', dbError);
        }

        res.json({ success: true, message: 'User created successfully', user: authUser.user });

    } catch (error: any) {
        console.error('Admin Create User Error:', error);
        res.status(500).json({ error: 'Internal server error: ' + error.message });
    }
});

// GET /api/admin/users/search - Search users for dropdown (limit 50)
router.get('/search', authenticate, requireRole(['super_admin', 'admin', 'sub_admin']), async (req: AuthRequest, res: Response) => {
    try {
        const query = req.query.q as string || '';

        let dbQuery = supabase
            .from('profiles')
            .select('id, full_name, email, referral_code')
            .limit(100);

        const hasReferral = req.query.hasReferral === 'true';

        if (hasReferral) {
            dbQuery = dbQuery.not('referral_code', 'is', null);
        }

        if (query) {
            dbQuery = dbQuery.or(`full_name.ilike.%${query}%,email.ilike.%${query}%`);
        }

        const { data, error } = await dbQuery;

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        res.json({ users: data });

    } catch (error: any) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/admin/users/update - Update user details
router.post('/update', authenticate, requireRole(['super_admin', 'admin', 'sub_admin']), async (req: AuthRequest, res: Response) => {
    try {
        const { userId, full_name, country, phone } = req.body;

        if (!userId) {
            return res.status(400).json({ error: 'Missing required field: userId' });
        }

        // Fetch user email for logging
        const { data: targetProfile } = await supabase.from('profiles').select('email').eq('id', userId).single();
        const targetEmail = targetProfile?.email || userId;

        AuditLogger.info(req.user?.email || 'admin', `Updated details for user ${targetEmail}`, { userId, category: 'User' });

        // 1. Update Profile in Public Table
        const { error: dbError } = await supabase
            .from('profiles')
            .update({ full_name, country, phone, phone_number: phone })
            .eq('id', userId);

        if (dbError) {
            console.error('Update Profile Failed:', dbError);
            return res.status(500).json({ error: 'Profile Update Failed: ' + dbError.message });
        }

        // 2. Update Supabase Auth Metadata (Best effort)
        const { error: authError } = await supabase.auth.admin.updateUserById(
            userId,
            { user_metadata: { full_name, country, phone } }
        );

        if (authError) {
            console.warn('Auth Metadata Update Failed (Non-critical):', authError);
        }

        res.json({ success: true, message: 'User updated successfully' });

    } catch (error: any) {
        console.error('Admin Update User Error:', error);
        res.status(500).json({ error: 'Internal server error: ' + error.message });
    }
});

// POST /api/admin/users/update-password - Reset user password
router.post('/update-password', authenticate, requireRole(['super_admin']), async (req: AuthRequest, res: Response) => {
    try {
        const { userId, newPassword } = req.body;

        if (!userId || !newPassword) {
            return res.status(400).json({ error: 'Missing required fields: userId, newPassword' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters long' });
        }

        // Fetch user email for logging
        const { data: targetProfile } = await supabase.from('profiles').select('email').eq('id', userId).single();
        const targetEmail = targetProfile?.email || userId;

        AuditLogger.info(req.user?.email || 'admin', `Reset password for user ${targetEmail}`, { userId, category: 'User' });

        // Update Supabase Auth password
        const { error: authError } = await supabase.auth.admin.updateUserById(
            userId,
            { password: newPassword }
        );

        if (authError) {
            console.error('Password Reset Failed:', authError);
            return res.status(500).json({ error: 'Password Reset Failed: ' + authError.message });
        }

        res.json({ success: true, message: 'Password updated successfully' });

    } catch (error: any) {
        console.error('Admin Reset Password Error:', error);
        res.status(500).json({ error: 'Internal server error: ' + error.message });
    }
});

// DELETE /api/admin/users/:userId - Delete a user
router.delete('/:userId', authenticate, requireRole(['super_admin']), async (req: AuthRequest, res: Response) => {
    try {
        const { userId } = req.params;

        if (!userId) {
            return res.status(400).json({ error: 'Missing userId' });
        }

        // Fetch user email for logging
        const { data: targetProfile } = await supabase.from('profiles').select('email').eq('id', userId).single();
        const targetEmail = targetProfile?.email || userId;

        AuditLogger.info(req.user?.email || 'admin', `Deleted user ${targetEmail}`, { userId, category: 'User' });

        // List of tables that usually have foreign keys to user_id/profiles.id
        const dependentTables = [
            'notifications',
            'certificates',
            'payout_requests',
            'kyc_requests',
            'challenges',
            'challenges_evaluation', // Added
            'challenges_rapid',      // Added
            'payment_orders',
            'bank_details',
            'wallet_addresses',
            'affiliate_withdrawals',
            'affiliate_earnings',
            'risk_violations',
            'daily_stats',
            'trades',
            'trade_consistency_snapshot',
            'coupon_usage'           // Added
        ];

        // 1. Special case: remove self-referencing referral links in profiles
        try {
            await supabase
                .from('profiles')
                .update({ referred_by: null })
                .eq('referred_by', userId);
        } catch (err) {
            console.warn('Profile self-reference cleanup note:', err);
        }

        // 2. Special case: remove resolved_by references in risk_violations
        try {
            await supabase
                .from('risk_violations')
                .update({ resolved_by: null })
                .eq('resolved_by', userId);
        } catch (err) {
            console.warn('Risk violations resolved_by cleanup note:', err);
        }

        // 3. Clear all dependent records
        for (const table of dependentTables) {
            try {
                // Determine the correct user ID column
                let column = 'user_id';
                
                // Special handling for affiliate_earnings (deleting where user is referrer OR referred)
                if (table === 'affiliate_earnings') {
                    await supabase.from(table).delete().eq('referrer_id', userId);
                    await supabase.from(table).delete().eq('referred_user_id', userId);
                    continue;
                }

                const { error: delError } = await supabase
                    .from(table)
                    .delete()
                    .eq(column, userId);
                
                if (delError && delError.code !== '42P01') { // Ignore table not found
                    console.warn(`Note: Could not clear ${table}:`, delError.message);
                }
            } catch (err) {
                console.warn(`Cleanup error for ${table}:`, err);
            }
        }

        // 4. Delete from Supabase Auth (this cascades to profiles if RLS is set up, but we'll manually check)
        const { error: authError } = await supabase.auth.admin.deleteUser(userId);

        if (authError) {
            console.error('Delete Auth User Failed:', authError);
            return res.status(500).json({ error: 'Auth Deletion Failed: ' + authError.message });
        }

        // 3. Ensure profile is gone (if no cascade)
        await supabase.from('profiles').delete().eq('id', userId);

        res.json({ success: true, message: `User ${targetEmail} and all related records deleted successfully` });

    } catch (error: any) {
        console.error('Admin Delete User Error:', error);
        res.status(500).json({ error: 'Internal server error: ' + error.message });
    }
});

export default router;
