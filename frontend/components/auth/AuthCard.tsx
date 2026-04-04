'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ChevronLeft } from 'lucide-react'

interface AuthCardProps {
    children: React.ReactNode
    title: string
    subtitle?: string
    footerText?: string
    footerLinkText?: string
    footerLinkHref?: string
    error?: string | null
    className?: string
    backButton?: boolean
}

export default function AuthCard({
    children,
    title,
    subtitle,
    footerText,
    footerLinkText,
    footerLinkHref,
    error,
    className,
    backButton
}: AuthCardProps) {
    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-[#050617] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#0a1129] via-[#050617] to-[#050617] p-4 sm:p-6 overflow-hidden relative">
            {/* Background decorative elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-600/10 rounded-full blur-[120px] pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md relative z-10"
            >
                {/* Logo */}
                <Link href="/dashboard" className="flex items-center justify-center gap-3 mb-8 group">
                    <div className="relative w-12 h-12 shrink-0 overflow-hidden rounded-2xl bg-blue-500/10 border border-white/10 flex items-center justify-center shadow-2xl group-hover:border-blue-500/30 transition-all duration-300">
                        <Image
                            src="/tff-diamond.jpg"
                            alt="Fusion Funded"
                            fill
                            className="object-contain scale-[1.3] group-hover:scale-[1.4] transition-transform duration-500"
                            priority
                        />
                    </div>
                    <span className="text-2xl font-bold text-white tracking-tight group-hover:text-blue-400 transition-colors">
                        Fusion Funded
                    </span>
                </Link>

                {/* Card */}
                <div className="bg-[#0a0c21]/40 backdrop-blur-3xl rounded-[2.5rem] shadow-2xl border border-white/10 p-8 sm:p-10 relative overflow-hidden">
                    {/* Inner highlight */}
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                    
                    {backButton && (
                        <Link href="/" className="absolute top-6 left-6 text-slate-400 hover:text-white transition-colors">
                            <ChevronLeft size={24} />
                        </Link>
                    )}

                    <div className="mb-8 text-center">
                        <h2 className="text-2xl sm:text-4xl font-bold text-white tracking-tight mb-2">{title}</h2>
                        {subtitle && <p className="text-slate-400 text-sm font-medium">{subtitle}</p>}
                    </div>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400 text-sm font-medium"
                        >
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shrink-0" />
                            {error}
                        </motion.div>
                    )}

                    {children}

                    {(footerText && footerLinkText && footerLinkHref) && (
                        <div className="mt-8 text-center text-sm text-slate-500 font-medium">
                            {footerText}{' '}
                            <Link
                                href={footerLinkHref}
                                className="text-blue-400 hover:text-blue-300 font-bold transition-colors ml-1"
                            >
                                {footerLinkText}
                            </Link>
                        </div>
                    )}
                </div>

                <p className="mt-8 text-center text-xs text-slate-600 font-medium tracking-wide">
                    © 2026 Fusion Funded. All rights reserved.
                </p>
            </motion.div>
        </div>
    )
}
