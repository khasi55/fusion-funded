"use client";

import { motion } from "framer-motion";
import { Download, Monitor, Smartphone, Terminal } from "lucide-react";

export default function PlatformsPage() {
    return (
        <div className="flex h-screen overflow-hidden bg-transparent text-white relative">
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-800">
                <div className="p-4 md:p-8 max-w-[1200px] mx-auto min-h-full pb-24">
                    {/* Header */}
                    <div className="mb-12 mt-4 text-center">
                        <motion.h1 
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-4"
                        >
                            Trading Platforms
                        </motion.h1>
                        <motion.p 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-gray-400 text-lg max-w-2xl mx-auto"
                        >
                            Download our premium trading platforms for desktop and mobile devices. Start trading anywhere, anytime.
                        </motion.p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                        {/* Windows EXE */}
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2 }}
                            className="bg-[#050505] border border-white/10 rounded-3xl p-8 flex flex-col relative overflow-hidden group hover:border-blue-500/30 transition-all duration-300 shadow-xl"
                        >
                            {/* Decorative Glow */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 blur-[50px] rounded-full group-hover:bg-blue-500/30 transition-colors pointer-events-none" />
                            
                            <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6 border border-blue-500/20 shadow-inner">
                                <Monitor className="w-8 h-8 text-blue-400" />
                            </div>
                            
                            <h2 className="text-2xl font-bold text-white mb-3">Fusion Funded Desktop</h2>
                            <p className="text-gray-400 mb-8 flex-1 leading-relaxed text-sm">
                                Our powerful, custom trading terminal for Windows. Execute trades with lightning-fast precision, advanced charting, and integrated risk management.
                            </p>
                            
                            <a 
                                href="/downloads/fusionfunded.exe?v=1.1" 
                                download="fusionfunded.exe"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full flex items-center justify-center gap-3 bg-white/5 hover:bg-blue-600 border border-white/10 hover:border-blue-500 text-white font-bold py-4 rounded-xl uppercase tracking-[0.1em] text-xs transition-all active:scale-[0.98] group-hover:shadow-[0_0_20px_rgba(37,99,235,0.2)]"
                            >
                                <Download size={16} strokeWidth={2.5} />
                                <span>Download for Windows</span>
                            </a>
                        </motion.div>

                        {/* Android APK */}
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.3 }}
                            className="bg-[#050505] border border-white/10 rounded-3xl p-8 flex flex-col relative overflow-hidden group hover:border-green-500/30 transition-all duration-300 shadow-xl"
                        >
                            {/* Decorative Glow */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/20 blur-[50px] rounded-full group-hover:bg-green-500/30 transition-colors pointer-events-none" />
                            
                            <div className="w-16 h-16 bg-green-500/10 rounded-2xl flex items-center justify-center mb-6 border border-green-500/20 shadow-inner">
                                <Smartphone className="w-8 h-8 text-green-400" />
                            </div>
                            
                            <h2 className="text-2xl font-bold text-white mb-3">MetaTrader 5 Pro</h2>
                            <p className="text-gray-400 mb-8 flex-1 leading-relaxed text-sm">
                                The industry-standard trading platform optimized for Android. Never miss a market move with our custom-configured mobile terminal.
                            </p>
                            
                            <a 
                                href="/downloads/meta5pro.apk?v=1.1" 
                                download="meta5pro.apk"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full flex items-center justify-center gap-3 bg-white/5 hover:bg-green-600 border border-white/10 hover:border-green-500 text-white font-bold py-4 rounded-xl uppercase tracking-[0.1em] text-xs transition-all active:scale-[0.98] group-hover:shadow-[0_0_20px_rgba(34,197,94,0.2)]"
                            >
                                <Download size={16} strokeWidth={2.5} />
                                <span>Download for Android</span>
                            </a>
                        </motion.div>
                    </div>

                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="mt-12 max-w-4xl mx-auto bg-blue-500/5 border border-blue-500/20 rounded-2xl p-6 md:p-8 flex gap-5 items-start backdrop-blur-sm"
                    >
                        <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shrink-0">
                            <Terminal className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                            <h3 className="text-blue-400 font-bold mb-3 uppercase tracking-wider text-sm">Installation Instructions</h3>
                            <div className="space-y-4">
                                <p className="text-sm text-gray-400 leading-relaxed">
                                    <span className="font-bold text-white mr-2">Windows:</span> Run the downloaded <code className="bg-black/50 border border-white/10 px-1.5 py-0.5 rounded text-blue-300 font-mono text-xs">.exe</code> file. If prompted by Windows Defender or SmartScreen, click "More info" and then "Run anyway" as this is a custom trading terminal.
                                </p>
                                <p className="text-sm text-gray-400 leading-relaxed">
                                    <span className="font-bold text-white mr-2">Android:</span> After downloading the <code className="bg-black/50 border border-white/10 px-1.5 py-0.5 rounded text-green-300 font-mono text-xs">.apk</code>, you may need to go to your phone's Settings &gt; Security and enable "Install from unknown sources" to allow the installation of custom apps.
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
