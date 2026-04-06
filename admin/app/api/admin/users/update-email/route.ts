import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const { userId, newEmail } = await request.json();

        if (!userId || !newEmail) {
            return NextResponse.json({ error: 'Missing userId or newEmail' }, { status: 400 });
        }

        const supabase = createAdminClient();

        // 1. Update in Supabase Auth
        const { data: user, error: authError } = await supabase.auth.admin.updateUserById(
            userId,
            { email: newEmail, email_confirm: true }
        );

        if (authError) {
            console.error('Admin Update Email Auth Error:', authError);
            return NextResponse.json({ error: 'Auth Update Failed: ' + authError.message }, { status: 500 });
        }

        // 2. Update in Profiles Table
        const { error: dbError } = await supabase
            .from('profiles')
            .update({ email: newEmail })
            .eq('id', userId);

        if (dbError) {
            console.error('Admin Update Email DB Error:', dbError);
            return NextResponse.json({ error: 'Profile Update Failed: ' + dbError.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: 'Email updated successfully', user });

    } catch (error: any) {
        console.error('Admin Update Email Route Error:', error);
        return NextResponse.json({ error: 'Internal server error: ' + error.message }, { status: 500 });
    }
}
