import { Router, Response, Request } from 'express';
import { supabaseAdmin } from '../lib/supabase';
import { EmailService } from '../services/email-service';

const router = Router();

// POST /api/auth/public/forgot-password
// Generates a token_hash link and sends a recovery email
router.post('/forgot-password', async (req: Request, res: Response) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        // 1. Generate a recovery link (type: 'recovery')
        // Using generateLink avoids PKCE and gives us a token_hash
        const { data, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
            type: 'recovery',
            email,
            options: {
                // Point to our frontend confirmation page (as backup redirect, though we'll bypass it)
                redirectTo: `${process.env.FRONTEND_URL || 'https://dashboard.thefusionfunded.com'}/auth/confirm?next=/reset-password`
            }
        });

        if (linkError) {
            console.error('[Public Auth] Generate Link Error:', linkError);
            return res.status(400).json({ error: linkError.message });
        }

        const { properties, user } = data;
        const actionLink = properties.action_link;
        
        console.log('[Public Auth] Action Link:', actionLink);
        console.log('[Public Auth] Properties:', JSON.stringify(properties, null, 2));

        // Parse the token_hash from the action_link
        const urlObj = new URL(actionLink);
        let tokenHash = urlObj.searchParams.get('token_hash');

        // Fallback 1: Check fragment
        if (!tokenHash && urlObj.hash) {
            const hashParams = new URLSearchParams(urlObj.hash.substring(1));
            tokenHash = hashParams.get('token_hash');
        }

        // Fallback 2: Check hashed_token property directly
        if (!tokenHash && (properties as any).hashed_token) {
            tokenHash = (properties as any).hashed_token;
        }

        // Fallback 3: Check email_otp (sometimes it's the same or can be used as token_hash)
        if (!tokenHash && (properties as any).email_otp) {
            tokenHash = (properties as any).email_otp;
        }

        if (!tokenHash) {
            console.error('[Public Auth] Failed to extract token_hash from action_link. Full Link:', actionLink);
            // If all else fails, check if there's a 'code' and use it (last resort, though likely still PKCE-bound)
            const code = urlObj.searchParams.get('code');
            if (code) {
                console.warn('[Public Auth] Found code instead of token_hash. Sending code link.');
                const frontendUrl = process.env.FRONTEND_URL || 'https://dashboard.thefusionfunded.com';
                const codeRecoveryUrl = `${frontendUrl}/auth/confirm?code=${code}&next=/reset-password`;
                await EmailService.sendEmail(email, 'Reset Your Password - Fusion Funded', `Reset here: ${codeRecoveryUrl}`, `Reset here: ${codeRecoveryUrl}`);
                return res.json({ success: true, message: 'Recovery email sent (code flow)' });
            }

            return res.status(500).json({ error: 'Internal server error: token generation failed' });
        }

        // Build a DIRECT link to our frontend confirmation page
        // This bypasses the Supabase verify endpoint entirely, ensuring no PKCE conversion happens.
        const frontendUrl = process.env.FRONTEND_URL || 'https://dashboard.thefusionfunded.com';
        const directRecoveryUrl = `${frontendUrl}/auth/confirm?token_hash=${tokenHash}&type=recovery&next=/reset-password`;

        // 2. Send the email using our EmailService
        const name = user?.user_metadata?.full_name || 'Trader';
        const subject = 'Reset Your Password - Fusion Funded';
        
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                <h2 style="color: #333; border-bottom: 2px solid #0d47a1; padding-bottom: 10px; margin-bottom: 20px;">
                    Password Reset Request
                </h2>
                <div style="color: #444; font-size: 15px; line-height: 1.6;">
                    <p>Hi ${name},</p>
                    <p>We received a request to reset your password. Click the button below to choose a new one:</p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${directRecoveryUrl}" style="background-color: #0d47a1; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                            Reset Password
                        </a>
                    </div>
                    
                    <p>If the button doesn't work, copy and paste this link into your browser:</p>
                    <p style="font-size: 12px; color: #666; word-break: break-all;">${directRecoveryUrl}</p>
                    
                    <p>If you didn't request a password reset, you can safely ignore this email.</p>
                </div>

                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #888; text-align: center;">
                    <p>Sent by <strong>Fusion Funded</strong></p>
                </div>
            </div>
        `;

        await EmailService.sendEmail(email, subject, html, `Reset your password here: ${directRecoveryUrl}`);

        res.json({ success: true, message: 'Recovery email sent' });

    } catch (error: any) {
        console.error('[Public Auth] Forgot Password error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
