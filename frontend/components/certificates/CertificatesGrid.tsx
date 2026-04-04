"use client";

import { useState, useRef } from "react";
import { format } from "date-fns";
import { Award, CheckCircle2, Eye, X, Download, Calendar, ShieldCheck, Trophy, Sparkles } from "lucide-react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import CertificateRenderer, { CertificateRendererRef } from "@/components/certificates/CertificateRenderer";

interface Certificate {
    id: string;
    user_id: string;
    challenge_id: string;
    type: 'pass' | 'payout';
    certificate_number: string;
    full_name: string;
    amount: number | string;
    issued_at: string;
    metadata: any;
    challenges?: {
        mt5_login: string;
        challenge_type: string;
    }
}

interface LegacyPayout {
    id: string;
    amount: string;
    created_at: string;
    processed_at: string | null;
    status: string;
    transaction_id?: string;
}

interface UserProfile {
    display_name?: string;
    first_name?: string;
    last_name?: string;
    full_name?: string;
}

interface CertificatesGridProps {
    certificates: Certificate[];
    legacyPayouts: LegacyPayout[];
    profile: UserProfile | null;
}

// Animation Variants
const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 50 } }
};

export default function CertificatesGrid({ certificates, legacyPayouts, profile }: CertificatesGridProps) {
    const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);
    const downloadRef = useRef<CertificateRendererRef>(null);

    // Map legacy payouts to certificate format if they don't exist in certificates table yet
    const normalizedCertificates: Certificate[] = [
        ...certificates,
        ...legacyPayouts
            .filter(lp => !certificates.some(c => c.metadata?.payout_id === lp.id || c.metadata?.transaction_id === lp.transaction_id))
            .map(lp => ({
                id: lp.id,
                user_id: '', 
                challenge_id: '',
                type: 'payout' as const,
                certificate_number: lp.transaction_id || `FF-PAY-${lp.id.slice(0, 8).toUpperCase()}`,
                full_name: profile?.full_name || profile?.display_name || 'Valued Trader',
                amount: lp.amount,
                issued_at: lp.processed_at || lp.created_at,
                metadata: { transaction_id: lp.transaction_id }
            }))
    ].sort((a, b) => new Date(b.issued_at).getTime() - new Date(a.issued_at).getTime());

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2 mb-10">
                <div className="flex items-center gap-3">
                    <div className="w-1.5 h-8 bg-blue-600 rounded-full shadow-[0_0_10px_rgba(37,99,235,0.5)]" />
                    <h2 className="text-4xl font-extrabold text-white tracking-tight">
                        Trading Hall of Fame
                    </h2>
                </div>
                <p className="text-gray-400 text-base font-medium max-w-2xl">
                    Official, high-resolution certificates recognizing your proficiency and success at Fusion Funded.
                </p>
            </div>

            {/* Grid of Certificates */}
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
                {normalizedCertificates.map((cert) => (
                    <motion.div
                        key={cert.id}
                        variants={itemVariants}
                        layoutId={cert.id}
                        onClick={() => setSelectedCert(cert)}
                        whileHover={{ y: -8, scale: 1.02 }}
                        className="cursor-pointer group relative aspect-[1.4] rounded-2xl overflow-hidden shadow-2xl transition-all duration-500 bg-[#050923] ring-1 ring-white/10 hover:ring-blue-500/50"
                    >
                        {/* Premium Certificate Preview */}
                        <div className="absolute inset-x-0 inset-y-0 p-8 flex flex-col items-center justify-center text-center">
                            {/* Animated Background */}
                            <div className={`absolute inset-0 transition-opacity duration-700 ${
                                cert.type === 'pass' 
                                ? "bg-gradient-to-br from-[#050923] via-[#0A2351] to-[#050923]" 
                                : "bg-gradient-to-br from-[#050923] via-[#1A1A40] to-[#050923]"
                            }`} />

                            {/* Content */}
                            <div className="relative z-10 flex flex-col items-center w-full h-full">
                                {cert.type === 'pass' ? (
                                    <Trophy className="text-yellow-500 mb-4 drop-shadow-[0_0_15px_rgba(234,179,8,0.5)]" size={36} />
                                ) : (
                                    <Sparkles className="text-blue-500 mb-4 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]" size={36} />
                                )}

                                <h3 className="text-white font-serif text-xl tracking-[0.3em] uppercase mb-1 opacity-90">
                                    Certificate
                                </h3>
                                <p className={`text-[10px] uppercase font-black tracking-[0.4em] mb-6 ${
                                    cert.type === 'pass' ? "text-yellow-400/60" : "text-blue-400/60"
                                }`}>
                                    {cert.type === 'pass' ? "Challenge Passed" : "Official Payout"}
                                </p>

                                <div className="mb-auto py-2">
                                    <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-gray-400 font-sans tracking-tight">
                                        ${Number(cert.amount).toLocaleString()}
                                    </h1>
                                </div>

                                <div className="mt-auto space-y-2">
                                    <div className="text-white font-serif italic text-sm opacity-80">
                                        Presented to <span className="font-semibold text-white opacity-100">{cert.full_name}</span>
                                    </div>

                                    <div className="flex items-center gap-3 text-[10px] font-bold tracking-widest text-slate-500 uppercase">
                                        <span>{format(new Date(cert.issued_at), "MMM dd, yyyy")}</span>
                                        <span className="w-1 h-1 bg-slate-700 rounded-full" />
                                        <span>#{cert.certificate_number?.slice(-6) || cert.id.slice(0, 6)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Hover Reveal */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col items-center justify-end pb-8">
                            <span className="bg-white text-blue-900 px-6 py-2.5 rounded-full font-black text-xs uppercase tracking-widest flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-all duration-500 shadow-xl">
                                <Eye size={16} /> View Achievement
                            </span>
                        </div>
                    </motion.div>
                ))}
            </motion.div>

            {/* Empty State */}
            {normalizedCertificates.length === 0 && (
                <div className="text-center py-24 bg-[#0B0F17]/50 rounded-3xl border border-dashed border-white/10">
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Award className="text-gray-500" size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-1">No Certificates Yet</h3>
                    <p className="text-gray-400 text-sm max-w-sm mx-auto">
                        Your trading achievements will be displayed here once you pass a challenge or receive a payout.
                    </p>
                </div>
            )}

            {/* Modal */}
            <AnimatePresence>
                {selectedCert && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedCert(null)}
                            className="absolute inset-0 bg-black/95 backdrop-blur-xl cursor-pointer"
                        />

                        <motion.div
                            layoutId={selectedCert.id}
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="relative w-full max-w-5xl bg-[#0B0F17] rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/10 flex flex-col"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between px-6 py-4 bg-[#0F1623] border-b border-white/5">
                                <h3 className="text-white font-semibold flex items-center gap-2">
                                    <ShieldCheck className="text-blue-500" size={18} />
                                    Official Achievement Certificate
                                </h3>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => downloadRef.current?.download()}
                                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg flex items-center gap-2 transition-colors"
                                    >
                                        <Download size={16} />
                                        Save as Image
                                    </button>
                                    <button
                                        onClick={() => setSelectedCert(null)}
                                        className="p-2 text-gray-400 hover:text-white transition-colors"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                            </div>

                            <div className="p-8 md:p-12 bg-[#05080F] flex items-center justify-center overflow-auto max-h-[85vh]">
                                <div className="w-full max-w-4xl shadow-2xl">
                                    <CertificateRenderer
                                        ref={downloadRef}
                                        name={selectedCert.full_name}
                                        amount={Number(selectedCert.amount)}
                                        date={selectedCert.issued_at}
                                        identifier={selectedCert.certificate_number || selectedCert.id}
                                        type={selectedCert.type}
                                    />
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
