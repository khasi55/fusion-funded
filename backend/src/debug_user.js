
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUser(email) {
    console.log(`🔍 Checking user: ${email}...`);
    
    // 1. Profile
    const { data: profile, error: pError } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .eq('email', email)
        .single();
    
    if (pError) {
        console.error('❌ Error fetching profile:', pError.message);
        return;
    }
    console.log('👤 Profile:', profile);

    // 2. Orders
    const { data: orders, error: oError } = await supabase
        .from('payment_orders')
        .select('order_id, status, amount, is_account_created, created_at')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });
    
    if (oError) {
        console.error('❌ Error fetching orders:', oError.message);
    } else {
        console.log('\n📦 Orders:', JSON.stringify(orders, null, 2));
    }

    // 3. Challenges
    const { data: challenges, error: cError } = await supabase
        .from('challenges')
        .select('id, login, challenge_type, group, status, created_at')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });
    
    if (cError) {
        console.error('❌ Error fetching challenges:', cError.message);
    } else {
        console.log('\n🏆 Challenges:', JSON.stringify(challenges, null, 2));
    }
}

const email = process.argv[2] || 'crosstechsolutions.ltd@gmail.com';
checkUser(email);
