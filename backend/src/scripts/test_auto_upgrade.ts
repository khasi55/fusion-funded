import { supabase } from '../lib/supabase';
import { AutomationService } from '../services/automation-service';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function testAutoUpgrade() {
    console.log('🧪 Starting Auto-Upgrade Simulation...');

    let { data: account, error: fetchErr } = await supabase
        .from('challenges')
        .select('*')
        .eq('login', 900909506876)
        .maybeSingle();

    if (fetchErr) console.error('Fetch Error grp3:', fetchErr.message);

    if (!account) {
        console.log('⚠️ No active grp3 account found. Please create one first or use an existing login.');
        
        console.log('🛠️ Picking a random account and temporarily setting it to grp3 for test...');
        const { data: anyAccount, error: anyErr } = await supabase.from('challenges').select('*').limit(1).maybeSingle();
        
        if (anyErr) console.error('Fetch Error any:', anyErr.message);
        
        if (!anyAccount) {
            console.error('❌ No accounts found in DB at all.');
            return;
        }
        account = anyAccount;
        await supabase.from('challenges').update({ group: 'AUS\\Live\\7401\\grp3', status: 'active' }).eq('id', account.id);
        console.log(`✅ Temporarily moved account ${account.login} to AUS\\Live\\7401\\grp3 for testing.`);
    }

    console.log(`👤 Testing with Account: ${account.login} (Group: ${account.group})`);

    // 2. Trigger the Automation Service manually
    // We simulate the profit target being met.
    console.log(`🚀 Triggering AutomationService.handleAutomatedUpgrade(${account.login})...`);
    
    try {
        await AutomationService.handleAutomatedUpgrade(account.login);
        
        console.log('\n🔍 Verifying results...');
        
        // Check old account status
        const { data: oldAcc } = await supabase.from('challenges').select('status, upgraded_to').eq('id', account.id).single();
        console.log(`Old Account Status: ${oldAcc?.status} (Expected: passed)`);
        console.log(`Upgraded To (ID): ${oldAcc?.upgraded_to}`);

        if (oldAcc?.upgraded_to) {
            // Check new account
            const { data: newAcc } = await supabase.from('challenges').select('*').eq('id', oldAcc.upgraded_to).single();
            console.log(`New Account Login: ${newAcc?.login}`);
            console.log(`New Account Group: ${newAcc?.group} (Expected: ...grp4)`);
            console.log(`New Account Status: ${newAcc?.status} (Expected: active)`);
            
            if (newAcc?.group === 'AUS\\Live\\7401\\grp4') {
                console.log('\n✨ SIMULATION SUCCESSFUL!');
            } else {
                console.log('\n❌ SIMULATION FAILED: New account group is incorrect.');
            }
        } else {
            console.log('\n❌ SIMULATION FAILED: Old account was not upgraded.');
        }

    } catch (error: any) {
        console.error('❌ Simulation Error:', error.message);
    }
}

testAutoUpgrade();
