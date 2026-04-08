'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { createBrowserClient } from '@supabase/ssr'
import { Loader2, CheckCircle, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react'
import AuthCard from '@/components/auth/AuthCard'
import { motion } from 'framer-motion'

function ConfirmContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    
    // EXTREMELY IMPORTANT: Disable detectSessionInUrl so Supabase doesn't try 
    // to auto-exchange 'code' (which fails without a verifier cookie).
    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { auth: { detectSessionInUrl: false } }
    )
    
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    const [params, setParams] = useState<{
        code?: string | null;
        token_hash?: string | null;
        type?: string | null;
        next: string;
    }>({ next: '/' });

    useEffect(() => {
        const next = searchParams.get('next') || '/';
        
        // 1. Try Query Params
        let code = searchParams.get('code');
        let token_hash = searchParams.get('token_hash');
        let type = searchParams.get('type');

        // 2. Try Hash Params (Supabase often uses fragments)
        if (!code && !token_hash && typeof window !== 'undefined') {
            const hashParams = new URLSearchParams(window.location.hash.substring(1));
            code = hashParams.get('code') || hashParams.get('access_token');
            token_hash = hashParams.get('token_hash');
            type = hashParams.get('type');
        }

        // 3. PRIORITY: If we have token_hash, IGNORE code to avoid PKCE pitfalls
        if (token_hash) {
            code = null;
        }

        console.log("🔍 [Auth Confirm] Resolved Params Content:", { 
            hasCode: !!code, 
            hasTokenHash: !!token_hash, 
            tokenHashPreview: token_hash ? `${token_hash.substring(0, 10)}...` : null,
            type, 
            next 
        });
        setParams({ code, token_hash, type, next });
    }, [searchParams]);

    const handleConfirm = async () => {
        setLoading(true)
        setError(null)

        try {
            const { code, token_hash, type, next } = params;

            if (code) {
                // PKCE or Access Token Flow
                const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
                if (exchangeError) throw exchangeError
                
                console.log("✅ [Auth Confirm] Code exchanged successfully")
                router.push(next)
            } else if (token_hash && type) {
                // OTP / Magic Link Flow
                const { error: verifyError } = await supabase.auth.verifyOtp({
                    token_hash,
                    type: type as any,
                })
                if (verifyError) throw verifyError

                console.log("✅ [Auth Confirm] OTP verified successfully")
                router.push(next)
            } else {
                throw new Error("Invalid or missing authentication parameters.")
            }
        } catch (err: any) {
            console.error("❌ [Auth Confirm] Error:", err)
            setError(err.message || "Failed to verify link. It may have expired or already been used.")
        } finally {
            setLoading(false)
        }
    }

    // Auto-verify if it's already used or if we want to be faster? 
    // No, the whole point is to wait for user interaction to avoid scanners.

    return (
        <AuthCard
            title="Verify Your Email"
            subtitle="Click the button below to securely sign in"
            error={error}
        >
            <div className="space-y-6 text-center py-4">
                <div className="w-16 h-16 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-2">
                    <ShieldCheck className="w-8 h-8 text-blue-400" />
                </div>
                
                <p className="text-sm text-slate-400 px-2 leading-relaxed">
                    To protect your account, we need to confirm you are opening this link in your browser.
                </p>

                <button
                    onClick={handleConfirm}
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-2xl transition-all transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-xl shadow-blue-900/20 h-[56px]"
                >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                        <div className="flex items-center gap-2">
                            <span>Confirm & Continue</span>
                            <ArrowRight className="w-5 h-5" />
                        </div>
                    )}
                </button>
                
                {error && (
                    <div className="mt-4">
                        <p className="text-xs text-slate-500">
                            If this link expired, please request a new one from the login page.
                        </p>
                    </div>
                )}
            </div>
        </AuthCard>
    )
}

export default function AuthConfirmPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-[#050617] p-4 relative overflow-hidden">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-600/10 rounded-full blur-[120px] pointer-events-none" />
            
            <Suspense fallback={
                <div className="flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                </div>
            }>
                <ConfirmContent />
            </Suspense>
        </div>
    )
}
