"use client";

import { useAccount } from "@/contexts/AccountContext";
import { motion } from "framer-motion";
import { Sparkles, Download, CheckCircle, AlertCircle } from "lucide-react";
import { useState } from "react";
import { fetchFromBackend } from "@/lib/backend-api";

export default function ZenvesttPage() {
    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-start pt-12 pb-8 px-8 text-center space-y-12 max-w-4xl mx-auto">

            {/* Link to Zenvestt.com at Top */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full flex justify-center"
            >
                <a 
                    href="https://www.zenvestt.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-600/20 to-blue-600/20 hover:from-purple-600/40 hover:to-blue-600/40 border border-purple-500/30 text-white font-bold rounded-2xl shadow-[0_0_30px_rgba(147,51,234,0.15)] hover:shadow-[0_0_40px_rgba(147,51,234,0.3)] transition-all active:scale-95 text-base sm:text-lg backdrop-blur-md group"
                >
                    <span>Visit www.zenvestt.com</span>
                    <Sparkles className="w-5 h-5 group-hover:animate-pulse text-purple-400" />
                </a>
            </motion.div>

            {/* Hero Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="space-y-6"
            >
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-600 font-medium text-sm">
                    <Sparkles className="w-4 h-4" />
                    <span>Coming Soon</span>
                </div>

                <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white">
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600">
                        Zenvest
                    </span>
                    <br />
                    Journaling Trading.
                </h1>

                <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
                    We are crafting the ultimate ecosystem for professional traders.
                    Prepare for institutional-grade analytics, automated journal syncing, and
                    AI-driven performance insights.
                </p>
            </motion.div>

            {/* Feature Highlights */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full pt-12"
            >
                {[
                    { title: "Advanced Analytics", desc: "Deep dive into your trading behavior with precision metrics." },
                    { title: "Seamless Sync", desc: "Real-time trade synchronization across all your accounts." },
                    { title: "AI Insights", desc: "Actionable feedback to refine your strategy and boost profitability." }
                ].map((item, i) => (
                    <div key={i} className="p-6 rounded-2xl bg-[#050923] border border-white/10 shadow-sm hover:shadow-md transition-shadow">
                        <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                        <p className="text-sm text-gray-400">{item.desc}</p>
                    </div>
                ))}
            </motion.div>

            {/* Remove from here */}

        </div>
    );
}
