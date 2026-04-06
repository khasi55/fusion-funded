import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';

export const dynamic = 'force-dynamic';

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        if (!id) {
            return NextResponse.json({ error: 'Missing user ID' }, { status: 400 });
        }

        const supabase = createAdminClient();

        // 1. Delete from Supabase Auth
        // This will often trigger a cascade delete in the profiles table if RLS/Triggers are set up
        const { error: authError } = await supabase.auth.admin.deleteUser(id);

        if (authError) {
            console.error('Admin Delete User Auth Error:', authError);
            return NextResponse.json({ error: authError.message }, { status: 500 });
        }

        // 2. Ensuring the profile is also gone (manual cleanup if no cascade)
        await supabase.from('profiles').delete().eq('id', id);

        return NextResponse.json({ success: true, message: 'User deleted successfully' });

    } catch (error: any) {
        console.error('Admin Delete User Route Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
