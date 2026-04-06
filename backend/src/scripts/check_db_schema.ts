import { supabaseAdmin } from '../lib/supabase';

async function check() {
    const { data: cols, error: colError } = await supabaseAdmin.rpc('get_table_columns_info', {
        table_name_input: 'wallet_addresses'
    });

    if (colError) {
        console.log("RPC Error (expected if not defined):", colError.message);
        
        // Alternatively query postgres if we can connect, but let's just insert a dummy.
        const dummyId = "00000000-0000-0000-0000-000000000000";
        console.log("Attempting test insert with USDT_BEP20...");
        const { error } = await supabaseAdmin.from('wallet_addresses').insert({
            user_id: dummyId,
            wallet_address: "test",
            wallet_type: "USDT_BEP20"
        });
        
        if (error) {
            console.log("Error inserting:", error);
            if (error.code === '22P02' || error.message.includes('enum')) {
                console.log("Verdict: It is restricted by an ENUM or constraint!");
            } else if (error.code === '23503') {
                console.log("Verdict: Foreign key constraint error (expected since user 00000 doesn't exist). But it DID NOT fail on ENUM.");
                console.log("It means USDT_BEP20 is perfectly fine to store as text!");
            }
        }
    } else {
        console.log("Columns:", cols);
    }
}
check();
