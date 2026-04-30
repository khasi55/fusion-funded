import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { createMT5Account } from '../lib/mt5-bridge';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Missing Supabase credentials");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log('🚀 Starting Demo Account Creation...');

    // 1. Get or Create User
    console.log('📡 Fetching profile for khasireddy3@gmail.com...');
    let { data: profile, error: pError } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .eq('email', 'khasireddy3@gmail.com')
        .single();

    if (pError) {
        console.error('❌ Error fetching admin profile:', pError.message);
    }

    if (!profile) {
        console.log('⚠️ admin@fusionfunded.com not found, picking first available user...');
        const { data: firstProfile, error: fError } = await supabase
            .from('profiles')
            .select('id, email, full_name')
            .limit(1)
            .single();
        
        if (fError) {
            console.error('❌ Error fetching first profile:', fError.message);
        }
        profile = firstProfile;
    }

    if (!profile) {
        console.error("❌ No user profile found.");
        process.exit(1);
    }

    console.log(`👤 Assigned to: ${profile.email} (${profile.id})`);

    // 2. Groups to iterate
    const groups = ['AUS\\Live\\7401\\grp2', 'AUS\\Live\\7401\\grp3', 'AUS\\Live\\7401\\grp4'];
    const accountSize = 100000;

    for (const mt5Group of groups) {
        console.log(`\n🔌 Calling Bridge to create account in group: ${mt5Group}...`);
        
        try {
            const mt5Data = await createMT5Account({
                name: profile.full_name || 'Trader',
                email: profile.email,
                group: mt5Group,
                leverage: 100,
                balance: accountSize,
                callback_url: `${process.env.BACKEND_URL || 'https://api.fusionfunded.co'}/api/mt5/trades/webhook`
            }) as any;

            console.log(`✅ Bridge Response for ${mt5Group}:`, JSON.stringify(mt5Data, null, 2));

            const mt5Login = mt5Data.login;
            const masterPassword = mt5Data.password;
            const investorPassword = mt5Data.investor_password;

            // 3. Insert into DB
            console.log(`📝 Inserting challenge record for Login: ${mt5Login}...`);
            
            const { data: challenge, error: challengeError } = await supabase
                .from('challenges')
                .insert({
                    user_id: profile.id,
                    initial_balance: accountSize,
                    current_balance: accountSize,
                    current_equity: accountSize,
                    start_of_day_equity: accountSize,
                    login: mt5Login,
                    master_password: masterPassword,
                    investor_password: investorPassword,
                    server: 'OCEAN MARKET LIMITED',
                    platform: 'MT5',
                    group: mt5Group,
                    leverage: 100,
                    status: 'active',
                    challenge_type: 'Phase 1',
                    metadata: {
                        plan_type: 'Demo Account',
                        assigned_via: 'script_manual',
                        is_test: true,
                        created_at: new Date().toISOString()
                    }
                })
                .select()
                .single();

            if (challengeError) {
                console.error(`❌ DB Error for ${mt5Login}:`, challengeError.message);
            } else {
                console.log(`✨ SUCCESS! Account ${challenge.login} Created in ${mt5Group}`);
            }

        } catch (error: any) {
            console.error(`❌ Failed to create account in ${mt5Group}:`, error.message);
            if (error.cause) console.error('Cause:', error.cause);
        }
    }
}

run();
