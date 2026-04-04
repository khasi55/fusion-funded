
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import bcrypt from 'bcrypt';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createAdmin(email: string, password: string, fullName: string) {
    console.log(`🚀 Creating Super Admin: ${email}...`);

    try {
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        const { data, error } = await supabase
            .from('admin_users')
            .upsert({
                email,
                password: hashedPassword,
                full_name: fullName,
                role: 'super_admin',
                permissions: ['*'], // Full access
                is_two_factor_enabled: false,
                is_webauthn_enabled: false
            }, { onConflict: 'email' })
            .select()
            .single();

        if (error) {
            console.error('❌ Error creating admin:', error);
            return;
        }

        console.log('✅ Admin user created/updated successfully!');
        console.log('User ID:', data.id);
        console.log('Email:', data.email);
        console.log('Role:', data.role);
    } catch (err) {
        console.error('❌ Unexpected error:', err);
    }
}

// GET ARGUMENTS FROM COMMAND LINE or use defaults
const email = process.argv[2] || 'admin@sharkfunded.com';
const password = process.argv[3] || 'Sharkfunded123!';
const fullName = process.argv[4] || 'Super Admin';

createAdmin(email, password, fullName);
