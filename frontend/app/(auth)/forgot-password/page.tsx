'use client'

import { createClient } from '@/utils/supabase/client'
import { useState } from 'react'
import Link from 'next/link'
import { Loader2, Mail, CheckCircle, ArrowLeft, ArrowRight } from 'lucide-react'
import AuthCard from '@/components/auth/AuthCard'
import { motion } from 'framer-motion'

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    const supabase = createClient()

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        setSuccess(false)

        try {
            const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/auth/confirm?next=/reset-password`,
            })

            if (resetError) {
                throw resetError
            }

            setSuccess(true)
        } catch (err: any) {
            console.error("Forgot Password Error:", err)
            setError(err.message || 'Failed to send reset email')
        } finally {
            setLoading(false)
        }
    }

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#050617] p-4 relative overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-600/10 rounded-full blur-[120px] pointer-events-none" />
                
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full max-w-md bg-[#0a0c21]/40 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-10 shadow-2xl text-center relative z-10"
                >
                    <div className="w-20 h-20 bg-blue-500/10 border border-blue-500/20 rounded-3xl flex items-center justify-center mx-auto mb-8">
                        <CheckCircle className="w-10 h-10 text-blue-400" />
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-4 tracking-tight">Check your email</h2>
                    <p className="text-slate-400 mb-10 leading-relaxed font-medium">
                        We've sent a password reset link to <span className="text-white font-bold">{email}</span>.
                        Please check your inbox to reset your password.
                    </p>
                    <Link
                        href="/login"
                        className="inline-flex items-center justify-center gap-2 w-full bg-white/5 hover:bg-white/10 text-white font-bold py-4 rounded-2xl transition-all border border-white/10 shadow-xl"
                    >
                        <ArrowLeft className="w-5 h-5 mr-1" />
                        Back to Login
                    </Link>
                </motion.div>
            </div>
        )
    }

    return (
        <AuthCard
            title="Reset Password"
            subtitle="Enter your email to receive instructions"
            footerText="Remember your password?"
            footerLinkText="Log in"
            footerLinkHref="/login"
            error={error}
        >
            <form onSubmit={handleResetPassword} className="space-y-6">
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

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-2xl transition-all transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-xl shadow-blue-900/20 mt-4 h-[56px]"
                >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                        <div className="flex items-center gap-2">
                            <span>Send Reset Link</span>
                            <ArrowRight className="w-5 h-5" />
                        </div>
                    )}
                </button>
            </form>
        </AuthCard>
    )
}
