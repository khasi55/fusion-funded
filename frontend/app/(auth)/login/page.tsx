'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { Loader2, Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react'
import AuthCard from '@/components/auth/AuthCard'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()
    const supabase = createClient()

    // Prefetch dashboard for instant transition
    useEffect(() => {
        router.prefetch('/dashboard')

        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            if (session) {
                router.replace('/dashboard')
            }
        }

        checkSession()
    }, [router, supabase])

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            if (error) {
                throw error
            }

            if (data.session) {
                // Initialize backend session via httpOnly cookie
                const isBrowser = typeof window !== 'undefined';
                const backendUrl = isBrowser ? "" : (process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001');
                await fetch(`${backendUrl}/api/auth/session`, {
                    method: 'POST',
                    credentials: 'include', // ESSENTIAL for cross-site cookies
                    headers: {
                        'Authorization': `Bearer ${data.session.access_token}`
                    }
                }).catch(err => console.error('Session init failed:', err));
            }

            // Force a hard navigation to ensure fresh state
            window.location.href = '/dashboard'
        } catch (err: any) {
            setError(err.message)
            setLoading(false)
        }
    }

    return (
        <AuthCard
            title="Welcome Back"
            subtitle="Sign in to your trading account"
            footerText="Don't have an account?"
            footerLinkText="Sign up"
            footerLinkHref="/signup"
            error={error}
        >
            <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1" htmlFor="email">Email Address</label>
                    <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-blue-400 transition-colors pointer-events-none" />
                        <input
                            id="email"
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-12 py-4 text-white focus:outline-none focus:border-blue-500/50 focus:bg-white/[0.08] transition-all placeholder:text-slate-600 font-medium text-sm"
                            placeholder="trader@fusionfunded.com"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between ml-1">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest" htmlFor="password">Password</label>
                        <Link href="/forgot-password" title="Recover Password" className="text-xs text-blue-400 hover:text-blue-300 transition-colors font-bold tracking-wide">
                            Forgot Password?
                        </Link>
                    </div>
                    <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-blue-400 transition-colors pointer-events-none" />
                        <input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-12 py-4 text-white focus:outline-none focus:border-blue-500/50 focus:bg-white/[0.08] transition-all placeholder:text-slate-600 font-medium text-sm"
                            placeholder="••••••••"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors p-1"
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-2xl transition-all transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-xl shadow-blue-900/20 mt-4 h-[56px]"
                >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                        <div className="flex items-center gap-2">
                            <span>Sign In</span>
                            <ArrowRight className="w-5 h-5" />
                        </div>
                    )}
                </button>
            </form>
        </AuthCard>
    )
}
