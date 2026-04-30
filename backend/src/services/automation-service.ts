import { supabase, supabaseAdmin } from '../lib/supabase';
import { createMT5Account, disableMT5Account } from '../lib/mt5-bridge';
import { EmailService } from './email-service';
import { AuditLogger } from '../lib/audit-logger';

export class AutomationService {
    /**
     * Automatically handles the transition for accounts that meet certain criteria.
     * Specifically handles grp3 (Phase 1) -> grp4 (Funded).
     */
    static async handleAutomatedUpgrade(login: number) {
        console.log(`🤖 [AutomationService] Checking automated upgrade for account ${login}...`);

        try {
            const { data: account, error: fetchError } = await supabase
                .from('challenges')
                .select('*')
                .eq('login', login)
                .single();

            if (fetchError || !account) return;
            
            if (account.status !== 'active') {
                console.log(`ℹ️ [AutomationService] Account ${login} is already ${account.status}. Skipping upgrade.`);
                return;
            }

            // Specific Rule: grp2/grp3 (Phase 1) -> grp4 (Funded)
            const currentGroup = (account.group || '').toUpperCase();
            if (currentGroup.includes('GRP2') || currentGroup.includes('GRP3')) {
                return this.upgradeAccount(account.id, {
                    nextType: 'hft2_funded',
                    nextGroup: 'AUS\\Live\\7401\\grp4',
                    isAutomated: true
                });
            }

            // Add other automated rules here if needed...

        } catch (error: any) {
            console.error(`❌ [Automation] Automated upgrade failed for ${login}:`, error.message);
        }
    }

    /**
     * Core logic to upgrade an account. Used by both automated rules and manual admin actions.
     */
    static async upgradeAccount(challengeId: string, options: { 
        nextType?: string, 
        nextGroup?: string, 
        isAutomated?: boolean,
        adminEmail?: string 
    } = {}) {
        const { nextType: customType, nextGroup: customGroup, isAutomated = false, adminEmail = 'SYSTEM' } = options;
        
        try {
            // 1. Fetch current account
            const { data: account, error: fetchError } = await supabase
                .from('challenges')
                .select('*')
                .eq('id', challengeId)
                .single();

            if (fetchError || !account) throw new Error('Account not found');

            if (account.status !== 'active' && account.status !== 'passed') {
                return { success: false, message: `Account ${account.login} is in state: ${account.status}. Must be active or passed to upgrade.` };
            }

            // 2. Determine upgrade path if not provided
            let nextType = customType;
            let mt5Group = customGroup;

            if (!nextType || !mt5Group) {
                const currentType = (account.challenge_type || '').toLowerCase();
                const currentGroupStr = (account.group || '').toUpperCase();

                // Specific mapping for grp2/grp3 -> grp4
                if (currentGroupStr.includes('GRP2') || currentGroupStr.includes('GRP3')) {
                    nextType = nextType || 'hft2_funded';
                    mt5Group = mt5Group || 'AUS\\Live\\7401\\grp4';
                } else if (currentGroupStr.includes('GRP4')) {
                    // Already funded? No further upgrade for now
                    return { success: false, message: 'Account is already in Funded group' };
                } else {
                    // Default logic
                    mt5Group = mt5Group || 'AUS\\Live\\7401\\grp4';
                    nextType = nextType || 'hft2_funded';
                }
            }

            console.log(`🚀 [Automation] Upgrading ${account.login} to ${mt5Group} (${nextType})...`);

            // 3. Get user profile
            const { data: userRecord } = await supabaseAdmin.auth.admin.getUserById(account.user_id);
            const profile = {
                email: userRecord?.user?.email,
                full_name: userRecord?.user?.user_metadata?.full_name || 'Trader'
            };

            // 4. Create new MT5 account
            const mt5Data = await createMT5Account({
                name: profile.full_name || 'Trader',
                email: profile.email || 'noemail@thefusionfunded.com',
                group: mt5Group,
                leverage: account.leverage || 100,
                balance: account.initial_balance,
            }) as any;

            if (!mt5Data || !mt5Data.login) throw new Error('MT5 bridge failed to create account');

            const newLogin = mt5Data.login;
            const newPassword = mt5Data.password;
            const newInvestorPassword = mt5Data.investor_password || '';
            const newServer = mt5Data.server || 'OCEAN MARKET LIMITED';

            // 5. Insert new challenge
            const { data: newChallenge, error: createError } = await supabase
                .from('challenges')
                .insert({
                    user_id: account.user_id,
                    challenge_type: nextType,
                    initial_balance: account.initial_balance,
                    current_balance: account.initial_balance,
                    current_equity: account.initial_balance,
                    start_of_day_equity: account.initial_balance,
                    login: newLogin,
                    master_password: newPassword,
                    investor_password: newInvestorPassword,
                    server: newServer,
                    group: mt5Group,
                    leverage: account.leverage || 100,
                    status: 'active',
                    metadata: {
                        ...(account.metadata || {}),
                        upgraded_from: account.id,
                        upgraded_from_login: account.login,
                        is_automated: isAutomated,
                        upgraded_at: new Date().toISOString()
                    }
                })
                .select()
                .single();

            if (createError) throw createError;

            // 6. Disable old account
            disableMT5Account(account.login).catch(err => {
                console.error(`❌ [Automation] Failed to disable old account ${account.login}:`, err.message);
            });

            // 7. Update old challenge status
            await supabase
                .from('challenges')
                .update({
                    status: 'passed',
                    upgraded_to: newChallenge.id,
                    updated_at: new Date().toISOString()
                })
                .eq('id', account.id);

            // 8. Email credentials
            if (profile.email) {
                const isFunded = nextType.toLowerCase().includes('funded') || mt5Group.toLowerCase().includes('grp4');
                
                if (isFunded) {
                    EmailService.sendFundedAccountCredentials(
                        profile.email,
                        profile.full_name,
                        String(newLogin),
                        newPassword,
                        newServer,
                        newInvestorPassword
                    ).catch(err => console.error(`❌ [Automation] Funded Email failed for ${newLogin}:`, err.message));

                    // Send the capital allocation certificate automatically!
                    EmailService.sendPassCertificate(
                        profile.email,
                        profile.full_name || 'Trader',
                        String(newLogin),
                        Number(account.initial_balance)
                    ).catch(err => console.error(`❌ [Automation] Pass Certificate Email failed for ${newLogin}:`, err.message));

                } else {
                    EmailService.sendAccountCredentials(
                        profile.email,
                        profile.full_name,
                        String(newLogin),
                        newPassword,
                        newServer,
                        newInvestorPassword
                    ).catch(err => console.error(`❌ [Automation] Email failed for ${newLogin}:`, err.message));
                }
            }


            // 9. Audit Log
            AuditLogger.info(adminEmail, `Account Upgrade: ${account.login} -> ${newLogin}`, {
                oldId: account.id,
                newId: newChallenge.id,
                isAutomated
            });

            return { success: true, newLogin, nextPhase: nextType };

        } catch (error: any) {
            console.error(`❌ [Automation] Upgrade failed for ${challengeId}:`, error.message);
            throw error;
        }
    }
}
