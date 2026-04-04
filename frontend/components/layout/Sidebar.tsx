
"use client";

import Image from "next/image";
import {
    LayoutGrid,
    LayoutDashboard,
    Trophy,
    UserCheck,
    Gift,
    Medal,
    BarChart2,
    Globe,
    Wallet,
    Users,
    Settings,
    LogOut,
    ChevronLeft,
    Swords,
    Sparkles
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const menuItems: { icon: any, label: string, href: string }[] = [
    { icon: LayoutGrid, label: "Overview", href: "/overview" },
    { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
    { icon: Trophy, label: "Challenges", href: "/challenges" },
    { icon: Swords, label: "Competitions", href: "/competitions" },
    { icon: UserCheck, label: "KYC", href: "/kyc" },
    // { icon: Gift, label: "Rewards", href: "/rewards" },
    { icon: Medal, label: "Certificates", href: "/certificates" },
    { icon: BarChart2, label: "Ranking", href: "/ranking" },
    { icon: Globe, label: "Economic Calendar", href: "/economics" },
    { icon: Wallet, label: "Payouts", href: "/payouts" },
    { icon: Users, label: "Affiliate", href: "/affiliate" },
    { icon: Sparkles, label: "Zenvestt", href: "/zenvestt" },
    { icon: Settings, label: "Settings", href: "/settings" },
];

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
    const pathname = usePathname();
    const router = useRouter();
    // Default to open on desktop matching the image design which is a fixed sidebar
    const [isCollapsed, setIsCollapsed] = useState(false);

    const isFirstRender = useRef(true);
    const [currentDate, setCurrentDate] = useState<string>("");

    useEffect(() => {
        const dateOptions: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        setCurrentDate(new Date().toLocaleDateString('en-US', dateOptions));
    }, []);

    // Close on route change on mobile
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        onClose();
    }, [pathname]);

    return (
        <>
            {/* Mobile Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 md:hidden"
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <motion.aside
                initial={false}
                animate={{
                    width: isCollapsed ? "80px" : "260px"
                }}
                className={cn(
                    "fixed z-50 flex flex-col overflow-hidden",
                    // Mobile: full height, no roundness (standard drawer)
                    "inset-y-0 left-0 h-screen w-[260px]",
                    // Desktop: floating, rounded, shorter height
                    "md:relative md:h-[calc(100vh-2rem)] md:m-4 md:rounded-3xl md:w-auto",
                    "bg-black/20 backdrop-blur-3xl border-r border-white/5 md:border border-white/10 shadow-2xl",
                    isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
                )}
            >
                {/* Background Overlay */}
                <div className="absolute inset-0 z-0 pointer-events-none mix-blend-screen opacity-50 hidden">
                    <Image
                        src="/sidebar-overlay.png"
                        alt=""
                        fill
                        sizes="260px"
                        className="object-cover object-top"
                        priority
                    />
                </div>

                {/* Pattern Overlay */}
                <div className="absolute inset-0 z-0 pointer-events-none opacity-100 hidden">
                    <Image
                        src="/sidebar-pattern.svg"
                        alt=""
                        fill
                        className="object-cover object-top"
                        priority
                    />
                </div>

                {/* Logo Area */}
                <div className={cn(
                    "h-28 flex items-center mb-4 mt-2 relative z-10",
                    isCollapsed ? "justify-center px-2" : "px-5"
                )}>
                    <Link href="/dashboard" className="flex items-center w-full relative h-[85px]">
                        <div className={cn(
                            "relative shrink-0 transition-all duration-300 rounded-md", 
                            isCollapsed ? "w-12 h-12 overflow-hidden mx-auto" : "w-full h-full"
                        )}>
                            <Image
                                src="/tff-logo-black.png"
                                alt="Fusion Funded"
                                fill
                                className={cn(
                                    isCollapsed ? "object-cover object-left scale-[1.6] origin-left" : "object-contain object-left scale-[1.15] origin-left"
                                )}
                                priority
                            />
                        </div>
                    </Link>
                </div>

                {/* Date Area */}
                {!isCollapsed && currentDate && (
                    <div className="px-8 mt-2 mb-6 text-center bg-white/5 mx-4 py-2 rounded-lg border border-white/5">
                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{currentDate}</p>
                    </div>
                )}
                {isCollapsed && currentDate && (
                    <div className="flex justify-center mt-2 mb-6">
                        <div className="w-6 h-px bg-white/10" />
                    </div>
                )}

                {/* Content Area */}
                <div className="flex-1 flex flex-col min-h-0 relative z-10">

                    {/* Navigation */}
                    <div className="flex-1 overflow-y-auto px-4 space-y-2 scrollbar-hide">
                        {!isCollapsed && (
                            <div className="px-4 mb-3">
                                <span className="text-xs font-medium text-gray-500/80">Menu</span>
                            </div>
                        )}

                        {menuItems.map((item) => {
                            const isActive = pathname === item.href;

                            return (
                                <Link key={item.href} href={item.href}>
                                    <div
                                        className={cn(
                                            "relative flex items-center gap-3.5 px-4 py-3.5 rounded-xl transition-all duration-200 group",
                                            isCollapsed ? "justify-center px-2" : "",
                                            isActive
                                                ? "text-white bg-[#0ea5e9] shadow-[0_0_15px_rgba(14,165,233,0.4)]"
                                                : "text-gray-400 hover:text-white hover:bg-white/5"
                                        )}
                                    >

                                        <item.icon
                                            size={20}
                                            strokeWidth={isActive ? 2.5 : 1.5}
                                            className={cn(
                                                "relative z-10 shrink-0 transition-colors",
                                                isActive ? "text-white" : "text-gray-400 group-hover:text-white"
                                            )}
                                        />

                                        {!isCollapsed && (
                                            <span className={cn(
                                                "relative z-10 text-[14px] tracking-wide transition-colors",
                                                isActive ? "text-white font-semibold" : "text-gray-400 font-medium group-hover:text-white"
                                            )}>
                                                {item.label}
                                            </span>
                                        )}
                                    </div>
                                </Link>
                            );
                        })}
                    </div>

                    {/* Footer / Discord Button */}
                    <div className="p-6 mt-auto">
                        <a
                            href="https://discord.com/invite/aGnhzaZeCJ"
                            target="_blank"
                            rel="noopener noreferrer"
                            className={cn(
                                "flex items-center justify-center w-full bg-[#0ea5e9] hover:bg-[#0284c7] text-white transition-all duration-300 shadow-[0_0_15px_rgba(14,165,233,0.4)]",
                                isCollapsed ? "p-3 rounded-xl" : "py-3.5 px-4 rounded-xl gap-3"
                            )}
                        >
                            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 00.0306-.0533c3.9268 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 00.0307.0533c.12.0991.246.1981.3724.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.419-2.1568 2.419zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.419-2.1568 2.419z" />
                            </svg>
                            {!isCollapsed && "Join Discord"}
                        </a>
                    </div>
                </div>
            </motion.aside>
        </>
    );
}
