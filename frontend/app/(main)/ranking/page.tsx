"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, ArrowUp, ArrowDown, Crown, Loader2, Medal, TrendingUp, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

interface Trader {
    rank: number;
    name: string;
    dayChange: number;
    totalProfit: number;
    return: number;
    country: string;
    accountSize: string;
    avatar: string;
    isMe?: boolean;
}

const filters = ["All", "5k", "10k", "25k", "50k", "100k"];

export default function RankingPage() {
    const [activeFilter, setActiveFilter] = useState("All");
    const [traders, setTraders] = useState<Trader[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRanking();
    }, [activeFilter]);

    const fetchRanking = async () => {
        try {
            setLoading(true);
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
            const res = await fetch(`${backendUrl}/api/ranking?accountSize=${activeFilter}`);
            if (res.ok) {
                const data = await res.json();
                setTraders(data);
            }
        } catch (error) {
            console.error("Failed to fetch ranking:", error);
        } finally {
            setLoading(false);
        }
    };

    const topThree = traders.slice(0, 3);
    const restOfList = traders.slice(3);

    return (
        <div className="min-h-screen bg-[#070b14] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#0ea5e9]/20 via-[#070b14] to-[#070b14] font-sans text-white pb-20">
            <div className="max-w-7xl mx-auto px-4 md:px-8 pt-12">

                {/* Header & Filter Bar */}
                <div className="flex flex-col md:flex-row justify-between items-end gap-8 mb-16">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-3 bg-[#0ea5e9] rounded-2xl shadow-lg shadow-[#0ea5e9]/20 text-white border border-white/10">
                                <Trophy size={28} className="fill-current" />
                            </div>
                            <h1 className="text-4xl font-black tracking-tight text-white">Leaderboard</h1>
                        </div>
                        <p className="text-gray-400 font-medium text-lg ml-1">
                            Celebrating the top performing traders in our ecosystem.
                        </p>
                    </div>

                    <div className="flex bg-black/40 backdrop-blur-xl p-1.5 rounded-2xl shadow-sm border border-white/10 overflow-x-auto max-w-full">
                        {filters.map((filter) => (
                            <button
                                key={filter}
                                onClick={() => setActiveFilter(filter)}
                                className={cn(
                                    "px-6 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap",
                                    activeFilter === filter
                                        ? "bg-[#0ea5e9] text-white shadow-[0_0_15px_rgba(14,165,233,0.5)]"
                                        : "text-slate-400 hover:text-white hover:bg-white/5"
                                )}
                            >
                                {filter}
                            </button>
                        ))}
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-32">
                        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
                    </div>
                ) : (
                    <>
                        {/* Podium (Top 3) */}
                        {traders.length >= 1 && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end mb-16">
                                {/* Rank 2 */}
                                <div className="order-2 md:order-1">
                                    {topThree[1] && (
                                        <PodiumCard
                                            trader={topThree[1]}
                                            rank={2}
                                            accentColor="text-slate-400"
                                            ringColor="ring-slate-200"
                                            delay={0.1}
                                        />
                                    )}
                                </div>

                                {/* Rank 1 (Center, Largest) */}
                                <div className="order-1 md:order-2 -translate-y-4 md:-translate-y-8 z-10">
                                    {topThree[0] && (
                                        <PodiumCard
                                            trader={topThree[0]}
                                            rank={1}
                                            accentColor="text-yellow-500"
                                            ringColor="ring-yellow-100"
                                            isWinner
                                            delay={0}
                                        />
                                    )}
                                </div>

                                {/* Rank 3 */}
                                <div className="order-3">
                                    {topThree[2] && (
                                        <PodiumCard
                                            trader={topThree[2]}
                                            rank={3}
                                            accentColor="text-orange-700"
                                            ringColor="ring-orange-100"
                                            delay={0.2}
                                        />
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Ranking List */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="bg-black/40 backdrop-blur-xl rounded-3xl shadow-2xl shadow-blue-900/10 border border-white/10 overflow-hidden"
                        >
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-white/5 text-slate-400 text-[11px] uppercase tracking-wider font-bold border-b border-white/10">
                                            <th className="px-8 py-6 w-24 text-center">Rank</th>
                                            <th className="px-8 py-6">Trader</th>
                                            <th className="px-8 py-6">Account</th>
                                            <th className="px-8 py-6 text-right">Day Change</th>
                                            <th className="px-8 py-6 text-right">Total Profit</th>
                                            <th className="px-8 py-6 text-right">Return</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {traders.length > 3 ? (
                                            restOfList.map((trader, idx) => (
                                                <tr
                                                    key={trader.rank}
                                                    className={cn(
                                                        "group hover:bg-[#0ea5e9]/10 transition-colors duration-200",
                                                        trader.isMe ? "bg-[#0ea5e9]/20" : ""
                                                    )}
                                                >
                                                    <td className="px-8 py-6 text-center">
                                                        <span className={cn(
                                                            "font-bold text-lg",
                                                            trader.rank <= 10 ? "text-white" : "text-slate-500"
                                                        )}>
                                                            #{trader.rank}
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 rounded-full bg-slate-800 ring-2 ring-white/10 shadow-sm overflow-hidden border border-[#0ea5e9]/30">
                                                                <img src={trader.avatar} alt={trader.name} className="w-full h-full object-cover" />
                                                            </div>
                                                            <div>
                                                                <div className="font-bold text-white text-sm flex items-center gap-2">
                                                                    {trader.name}
                                                                    {trader.isMe && <span className="text-[10px] bg-[#0ea5e9]/20 text-[#0ea5e9] px-2 py-0.5 rounded-full border border-[#0ea5e9]/20">YOU</span>}
                                                                </div>
                                                                <div className="text-xs text-gray-400 font-medium">{trader.country}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-white/5 text-slate-300 font-bold text-xs border border-white/10">
                                                            {trader.accountSize}
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-6 text-right">
                                                        <span className={cn(
                                                            "inline-flex items-center gap-1 font-bold text-sm",
                                                            trader.dayChange >= 0 ? "text-emerald-600" : "text-rose-500"
                                                        )}>
                                                            {trader.dayChange >= 0 ? <ArrowUp size={14} strokeWidth={3} /> : <ArrowDown size={14} strokeWidth={3} />}
                                                            ${Math.abs(trader.dayChange).toLocaleString()}
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-6 text-right">
                                                        <span className="font-bold text-white tabular-nums">
                                                            ${trader.totalProfit.toLocaleString()}
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-6 text-right">
                                                        <span className={cn(
                                                            "inline-block font-black text-sm px-3 py-1 rounded-full",
                                                            trader.return > 0 ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/20" : "bg-white/5 text-slate-400 border border-white/10"
                                                        )}>
                                                            {trader.return}%
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            !loading && (
                                                <tr>
                                                    <td colSpan={6} className="px-8 py-20 text-center text-slate-400">
                                                        Only the top 3 legends have made it so far.
                                                    </td>
                                                </tr>
                                            )
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </motion.div>
                    </>
                )}
            </div>
        </div>
    );
}

// Sub-component for clean podium cards
function PodiumCard({ trader, rank, accentColor, ringColor, isWinner = false, delay }: { trader: Trader, rank: number, accentColor: string, ringColor: string, isWinner?: boolean, delay: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, type: "spring" }}
            className={cn(
                "relative bg-black/40 backdrop-blur-xl rounded-[32px] p-8 text-center flex flex-col items-center border border-white/10",
                isWinner ? "shadow-2xl shadow-yellow-500/20 min-h-[420px] ring-1 ring-[#0ea5e9]/50" : "shadow-xl shadow-blue-900/10 min-h-[360px]"
            )}
        >
            {/* Rank Badge */}
            <div className={cn(
                "absolute -top-5 w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl shadow-lg border-2 border-[#0ea5e9]/30",
                rank === 1 ? "bg-gradient-to-br from-yellow-400 to-amber-600 text-white shadow-yellow-500/30 font-black" :
                    rank === 2 ? "bg-white/10 text-white border-white/20 backdrop-blur-md" :
                        "bg-white/10 text-white border-orange-500/30 backdrop-blur-md"
            )}>
                {rank}
            </div>

            {isWinner && <Crown size={40} className="text-yellow-400 absolute -top-16 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]" fill="currentColor" />}

            {/* Avatar */}
            <div className={cn(
                "rounded-full p-1.5 mb-6 shadow-[0_0_20px_rgba(14,165,233,0.3)]",
                isWinner ? "w-32 h-32 bg-gradient-to-br from-yellow-300 to-amber-500" : "w-24 h-24 bg-gradient-to-br from-[#0ea5e9] to-[#0369a1]"
            )}>
                <div className="w-full h-full rounded-full overflow-hidden border-4 border-[#070b14] bg-slate-900">
                    <img src={trader.avatar} alt={trader.name} className="w-full h-full object-cover" />
                </div>
            </div>

            {/* Info */}
            <h3 className="text-2xl font-black text-white tracking-tight mb-1">
                {trader.name}
            </h3>
            <p className="text-[#0ea5e9] font-bold text-xs uppercase tracking-widest mb-8 text-opacity-80">
                {trader.accountSize} Account
            </p>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 w-full mt-auto">
                <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                    <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">Profit</p>
                    <p className="text-lg font-black text-white">${trader.totalProfit.toLocaleString()}</p>
                </div>
                <div className={cn("rounded-2xl p-4 border bg-opacity-10", isWinner ? "bg-yellow-500/10 border-yellow-500/30" : "bg-[#0ea5e9]/10 border-[#0ea5e9]/30")}>
                    <p className={cn("text-[10px] font-bold uppercase tracking-wider mb-1", isWinner ? "text-yellow-400" : "text-[#0ea5e9]")}>Return</p>
                    <p className={cn("text-lg font-black", isWinner ? "text-yellow-400" : "text-[#0ea5e9]")}>{trader.return}%</p>
                </div>
            </div>
        </motion.div>
    )
}
