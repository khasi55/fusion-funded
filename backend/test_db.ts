import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, './.env') });
import { supabase } from './src/lib/supabase';

async function checkSchema() {
    const { data, error } = await supabase.from('certificates').select('*').limit(1);
    if (data && data.length > 0) {
        console.log("Columns:", Object.keys(data[0]));
    } else {
        console.log("Data empty or error", data, error);
    }
}
checkSchema();
