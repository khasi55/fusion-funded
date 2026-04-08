import { supabase } from './backend/src/lib/supabase';
async function list() {
    const commonTables = [
        'profiles', 'challenges', 'payout_requests', 'kyc_requests', 
        'affiliate_earnings', 'referrals', 'user_referrals', 
        'affiliate_withdrawals', 'payment_orders', 'notifications',
        'risk_violations', 'daily_stats', 'trades', 'trade_consistency_snapshot'
    ];
    for (const t of commonTables) {
        try {
            const { error } = await supabase.from(t).select('count', { count: 'exact', head: true });
            console.log(`Table ${t}: ${error ? 'Error ' + error.message : 'Exists'}`);
        } catch (e: any) {
            console.log(`Table ${t}: Exception ${e.message}`);
        }
    }
}
list();
