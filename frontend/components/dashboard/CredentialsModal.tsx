import Image from "next/image";
import { useState } from "react";
import { X, Copy, Check, Eye, EyeOff, Server, Shield, Key, RefreshCw, Loader2, Save } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { fetchFromBackend } from "@/lib/backend-api";

interface CredentialsModalProps {
    isOpen: boolean;
    onClose: () => void;
    account: {
        login: number;
        password?: string;
        server?: string;
        account_type?: string;
    } | null;
}

export default function CredentialsModal({ isOpen, onClose, account }: CredentialsModalProps) {
    const [showPassword, setShowPassword] = useState(false);
    const [copiedField, setCopiedField] = useState<string | null>(null);
    
    // Password Change states
    const [isEditing, setIsEditing] = useState(false);
    const [newPassword, setNewPassword] = useState("");
    const [isUpdating, setIsUpdating] = useState(false);
    const [statusMsg, setStatusMsg] = useState<{ type: 'error' | 'success', text: string } | null>(null);

    if (!isOpen || !account) return null;

    const copyToClipboard = (text: string, field: string) => {
        navigator.clipboard.writeText(text);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
    };

    const generateRandomPassword = (length = 12) => {
        const charset = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%^&*";
        // Ensure complexity: at least one of each
        const lower = "abcdefghjkmnpqrstuvwxyz";
        const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
        const digits = "23456789";
        const symbols = "!@#$%^&*";
        
        let password = "";
        password += lower[Math.floor(Math.random() * lower.length)];
        password += upper[Math.floor(Math.random() * upper.length)];
        password += digits[Math.floor(Math.random() * digits.length)];
        password += symbols[Math.floor(Math.random() * symbols.length)];
        
        for (let i = 4; i < length; i++) {
            password += charset[Math.floor(Math.random() * charset.length)];
        }
        return password.split('').sort(() => 0.5 - Math.random()).join('');
    };

    const handleUpdatePassword = async () => {
        if (!newPassword || newPassword.length < 8) {
            setStatusMsg({ type: 'error', text: 'Password must be at least 8 characters.' });
            return;
        }

        setIsUpdating(true);
        setStatusMsg(null);
        try {
            await fetchFromBackend('/api/mt5/change-password', {
                method: 'POST',
                body: JSON.stringify({
                    login: account.login,
                    new_password: newPassword,
                    type: 'master'
                }),
                requireAuth: true
            });
            setStatusMsg({ type: 'success', text: 'Master password updated successfully!' });
            setIsEditing(false);
            // We don't have a way to update the parent account object easily here without a refresh
            // But the user knows it's updated. 
        } catch (error: any) {
            setStatusMsg({ type: 'error', text: error.message || 'Failed to update password.' });
        } finally {
            setIsUpdating(false);
        }
    };

    const CredentialRow = ({ label, value, field, isPassword = false, icon: Icon, onEdit }: any) => (
        <div className="bg-white/5 border border-white/5 rounded-xl p-4 flex items-center justify-between group hover:border-blue-500/30 hover:bg-white/10 transition-all duration-200">
            <div className="flex items-center gap-4 flex-1">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 shadow-sm shrink-0">
                    <Icon size={20} />
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-0.5">{label}</p>
                    <p className="text-white font-mono font-medium text-lg tracking-wide select-all truncate">
                        {isPassword && !showPassword ? '••••••••••' : value}
                    </p>
                </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
                {isPassword && !isEditing && (
                    <button
                        onClick={() => setShowPassword(!showPassword)}
                        className="p-2 hover:bg-white/10 rounded-lg text-gray-500 hover:text-white transition-colors"
                        title="Toggle Visibility"
                    >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                )}
                {onEdit && !isEditing && (
                    <button
                        onClick={onEdit}
                        className="p-2 hover:bg-blue-500/10 rounded-lg text-blue-400 hover:text-blue-300 transition-colors"
                        title="Change Password"
                    >
                        <RefreshCw size={18} />
                    </button>
                )}
                <button
                    onClick={() => copyToClipboard(value?.toString() || '', field)}
                    className={cn(
                        "p-2 rounded-lg transition-all duration-200",
                        copiedField === field
                            ? "bg-green-500/20 text-green-400"
                            : "hover:bg-white/10 text-gray-500 hover:text-white"
                    )}
                    title="Copy"
                >
                    {copiedField === field ? <Check size={18} /> : <Copy size={18} />}
                </button>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                onClick={onClose}
            />
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="relative bg-[#0a0f1d] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl shadow-black/50 overflow-hidden"
            >
                {/* Header */}
                <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between bg-white/[0.02] relative">
                    <div className="flex items-center gap-3">
                        <div className="relative w-10 h-10 rounded-xl bg-blue-600/10 flex items-center justify-center overflow-hidden border border-blue-500/20">
                            <Image src="/tff-diamond.jpg" alt="Logo" fill className="object-cover scale-[1.4]" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">Account Credentials</h2>
                            <p className="text-xs text-gray-400 font-medium">MT5 Login Details</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4">
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-2">
                        <p className="text-sm text-blue-300 leading-relaxed font-medium">
                            Use these credentials to log in to the <strong className="font-bold text-blue-200">MetaTrader 5</strong> platform.
                        </p>
                    </div>

                    {statusMsg && (
                        <div className={cn(
                            "p-3 rounded-lg text-xs font-bold animate-in fade-in slide-in-from-top-2",
                            statusMsg.type === 'success' ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"
                        )}>
                            {statusMsg.text}
                        </div>
                    )}

                    <CredentialRow
                        label="Login ID"
                        value={account.login}
                        field="login"
                        icon={Shield}
                    />

                    {isEditing ? (
                        <div className="bg-white/5 border-2 border-blue-500/50 rounded-xl p-4 space-y-3 animate-in zoom-in-95">
                            <div className="flex justify-between items-center">
                                <label className="text-xs text-gray-400 font-bold uppercase tracking-wider">New Master Password</label>
                                <button 
                                    onClick={() => setIsEditing(false)}
                                    className="text-xs text-gray-500 hover:text-white font-bold"
                                >
                                    Cancel
                                </button>
                            </div>
                            <div className="relative">
                                <input 
                                    type="text"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Enter new password..."
                                    className="w-full bg-[#0a0f1d] border border-white/10 rounded-lg px-3 py-2 text-sm font-mono text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                                <button 
                                    onClick={() => setNewPassword(generateRandomPassword())}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 hover:bg-white/10 text-blue-400 rounded-md transition-all"
                                    title="Auto-generate"
                                >
                                    <RefreshCw size={14} className={isUpdating ? "animate-spin" : ""} />
                                </button>
                            </div>
                            <button
                                onClick={handleUpdatePassword}
                                disabled={isUpdating || !newPassword}
                                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-white/10 text-white rounded-lg py-2.5 text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.98]"
                            >
                                {isUpdating ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                Update Password
                            </button>
                        </div>
                    ) : (
                        <CredentialRow
                            label="Master Password"
                            value={account.password || '••••••••'}
                            field="password"
                            isPassword
                            icon={Key}
                            onEdit={() => {
                                setIsEditing(true);
                                setStatusMsg(null);
                            }}
                        />
                    )}

                    <CredentialRow
                        label="Server"
                        value={account.server || 'AURO MARKETS'}
                        field="server"
                        icon={Server}
                    />
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-white/5 border-t border-white/5 text-center">
                    <p className="text-xs text-gray-500 font-medium">
                        Never share your master password with anyone provided by support.
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
