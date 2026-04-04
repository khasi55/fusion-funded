import { createClient } from "@/utils/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { Award } from "lucide-react";
import CertificatesGrid from "@/components/certificates/CertificatesGrid";

export default async function CertificatesPage() {
    const supabase = await createClient();

    // 1. Get Current User
    const { data: { user } } = await supabase.auth.getUser();
    console.log('CertificatesPage - Authenticated User:', user?.id, user?.email);

    // 2. Fetch User Profile
    let profile: any = null;
    if (user) {
        const { data: profileData } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single();
        profile = profileData;
    }

    // 3. Fetch certificates specifically for this user
    let certificates = [];
    if (user) {
        // We use the service role bypass here for now as requested, but standard logic should return
        const adminClient = createSupabaseClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );
        const { data: adminCerts } = await adminClient
            .from("certificates")
            .select(`
                *,
                challenges (
                    mt5_login,
                    challenge_type
                )
            `)
            .eq("user_id", user.id)
            .order("issued_at", { ascending: false });
        
        certificates = adminCerts || [];
    }

    // 4. Fetch legacy approved/processed payouts
    const { data: legacyPayouts } = await supabase
        .from("payout_requests")
        .select("*")
        .in("status", ["approved", "processed"])
        .order("created_at", { ascending: false });

    return (
        <div className="space-y-12 max-w-6xl mx-auto p-6 min-h-screen font-sans">
            <CertificatesGrid
                certificates={certificates}
                legacyPayouts={legacyPayouts || []}
                profile={profile}
            />
        </div>
    );
}
