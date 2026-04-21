import { Mail, Phone, UserRound, Info } from "lucide-react";
import { motion } from "framer-motion";

export default function AccountManagerCard() {
    return (
        <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#050505]/80 backdrop-blur-md border border-white/10 rounded-xl p-3 flex flex-col gap-2.5 shadow-lg relative overflow-hidden w-full sm:w-auto"
        >
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-5 relative z-10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 font-bold border border-blue-500/30 shrink-0 shadow-inner">
                        <UserRound size={18} />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-blue-400/90 text-[10px] font-bold uppercase tracking-wider mb-0.5">Account Manager</span>
                        <span className="text-white font-bold text-sm leading-none">Naman</span>
                    </div>
                </div>
                
                <div className="hidden sm:block w-px h-8 bg-white/10"></div>
                
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
                    <a href="mailto:info@thefusionfunded.com" className="flex items-center gap-2 text-xs text-gray-300 hover:text-white transition-all group">
                        <div className="w-7 h-7 rounded-md bg-white/5 flex items-center justify-center group-hover:bg-blue-500/20 group-hover:text-blue-400 transition-colors shrink-0 outline outline-1 outline-white/5 group-hover:outline-blue-500/30">
                            <Mail size={14} />
                        </div>
                        <span className="font-medium">info@thefusionfunded.com</span>
                    </a>
                    <a href="https://wa.me/4475754486654" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-gray-300 hover:text-white transition-all group">
                        <div className="w-7 h-7 rounded-md bg-white/5 flex items-center justify-center group-hover:bg-green-500/20 group-hover:text-green-400 transition-colors shrink-0 outline outline-1 outline-white/5 group-hover:outline-green-500/30">
                            <Phone size={14} />
                        </div>
                        <span className="font-medium">+44 7575 4486654</span>
                    </a>
                </div>
            </div>

            <div className="flex items-center gap-2 bg-blue-500/5 px-2.5 py-1.5 rounded-lg border border-blue-500/10 relative z-10 w-full">
                <Info size={12} className="text-blue-400 shrink-0" />
                <p className="text-[10px] text-gray-400 font-medium tracking-wide">You can contact your account manager for any additional info or support.</p>
            </div>
        </motion.div>
    );
}
