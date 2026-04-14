"use client";

import { useState, useEffect } from "react";
import { Check, Info, CreditCard, Loader2, Copy, X, Wallet, CheckCircle2, QrCode, Smartphone as Currency } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { fetchFromBackend } from "@/lib/backend-api";
import { QRCodeSVG } from 'qrcode.react';


export const pricingConfig = {
    HFT2: {
        '2.5K': { price: '$29', dailyLoss: '7%', maxLoss: '10%', target1: '10%', target2: '-', minTrading: '9 Days', newsTrading: 'Yes' },
        '5K': { price: '$49', dailyLoss: '7%', maxLoss: '10%', target1: '10%', target2: '-', minTrading: '9 Days', newsTrading: 'Yes' },
        '10K': { price: '$99', dailyLoss: '7%', maxLoss: '10%', target1: '10%', target2: '-', minTrading: '9 Days', newsTrading: 'Yes' },
        '25K': { price: '$159', dailyLoss: '7%', maxLoss: '10%', target1: '10%', target2: '-', minTrading: '9 Days', newsTrading: 'Yes' },
        '50K': { price: '$299', dailyLoss: '7%', maxLoss: '10%', target1: '10%', target2: '-', minTrading: '9 Days', newsTrading: 'Yes' },
        '100K': { price: '$559', dailyLoss: '7%', maxLoss: '10%', target1: '10%', target2: '-', minTrading: '9 Days', newsTrading: 'Yes' },
    }
} as const;

// --- Data ---
const PLATFORMS = [
    { id: "mt5", label: "MetaTrader 5" }
];

const PAYMENT_GATEWAYS = [
    // { id: "upi_manual", label: "Domestic UPI", currency: "INR", desc: "Instant UPI/Bank Transfer", icon: "🇮🇳" },
    { id: "crypto_manual", label: "Crypto ", currency: "USD", desc: "USDT (Tron/BSC/ETH)", icon: "💎" }
];

const ADDONS = [
    { id: 'fees_refund', label: 'Fees Refund', percentage: 20, desc: 'Get your challenge fees refund' },
    { id: 'remove_consistency', label: 'Remove Consistency', percentage: 30, desc: 'Trade without consistency rules' },
    { id: 'min_trading_7', label: 'Min Trading Days (7 Days)', percentage: 12, desc: 'Allow payout after 7 trading days' },
    { id: 'fast_payout', label: 'Fast Payout (6 Hours)', percentage: 0, desc: 'Receive your withdrawal in 6 hours' }
];

// Helper to map size number to string key
export const getSizeKey = (size: number): string => {
    if (size >= 1000) {
        const val = size / 1000;
        return `${val === 2.5 ? '2.5' : val}K`;
    }
    return `${size}`;
};

// Helper to map type/model to config key
export const getConfigKey = (type: string, model: string): keyof typeof pricingConfig | null => {
    return 'HFT2';
};


// --- Utility Components ---
const RadioPill = ({
    active,
    label,
    onClick,
    subLabel = "",
    disabled = false
}: {
    active: boolean;
    label: string;
    onClick: () => void;
    subLabel?: string;
    disabled?: boolean;
}) => (
    <button
        onClick={disabled ? undefined : onClick}
        disabled={disabled}
        className={cn(
            "relative flex items-center gap-3 p-4 rounded-xl border text-left transition-all duration-200 select-none w-full",
            disabled
                ? "bg-muted/50 border-transparent opacity-50 cursor-not-allowed"
                : "cursor-pointer",
            !disabled && active
                ? "bg-primary/20 border-primary shadow-[0_0_0_1px_rgba(var(--primary),1)]"
                : !disabled && "bg-[#050923] border-white/10 hover:border-white/20"
        )}
    >
        {/* Radio Circle */}
        <div className={cn(
            "w-6 h-6 rounded-full border flex items-center justify-center transition-all duration-300 shrink-0",
            active
                ? "border-primary bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)]"
                : "border-white/20 bg-white/5",
            disabled && "border-gray-600 bg-transparent"
        )}>
            {active && (
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_5px_white]"
                />
            )}
        </div>

        <div className="flex flex-col">
            <span className={cn("text-sm font-bold", active ? "text-primary" : "text-white")}>{label}</span>
            {subLabel && <span className="text-[10px] text-gray-400">{subLabel}</span>}
        </div>
    </button>
);

const SectionHeader = ({ title, sub }: { title: string, sub: string }) => (
    <div className="mb-4">
        <h3 className="text-lg font-bold text-white">{title}</h3>
        <p className="text-xs text-gray-400">{sub}</p>
    </div>
);

// --- Success Modal ---
const SuccessModal = ({ credentials, onClose }: { credentials: any, onClose: () => void }) => {
    const CopyButton = ({ text }: { text: string }) => {
        const [copied, setCopied] = useState(false);
        const handleCopy = () => {
            navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        };
        return (
            <button
                onClick={handleCopy}
                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
            >
                {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
            </button>
        );
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="w-full max-w-md bg-[#0F1115] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
            >
                <div className="relative p-6 pt-12 text-center bg-gradient-to-b from-primary/20 to-transparent">
                    <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-white/5 rounded-full text-gray-400 hover:text-white">
                        <X size={20} />
                    </button>
                    <div className="w-16 h-16 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center mx-auto mb-4 border border-green-500/30">
                        <Check size={32} strokeWidth={3} />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Purchase Successful!</h2>
                    <p className="text-gray-400 text-sm px-4">Your account has been created instantly. Save these credentials carefully.</p>
                </div>

                <div className="p-6 space-y-4">
                    <div className="bg-white/5 rounded-xl border border-white/5 overflow-hidden">
                        {[
                            { label: "Login", value: credentials.login },
                            { label: "Password", value: credentials.masterPassword },
                            { label: "Server", value: credentials.server },
                            { label: "Platform", value: PLATFORMS.find(p => p.id === credentials.platform)?.label || credentials.platform },
                        ].map((item, i) => (
                            <div key={i} className="flex items-center justify-between p-3 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                                <span className="text-sm text-gray-400">{item.label}</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-mono font-medium text-white">{item.value}</span>
                                    <CopyButton text={String(item.value)} />
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 flex gap-3">
                        <Info className="shrink-0 text-yellow-500" size={18} />
                        <p className="text-xs text-yellow-200/80">
                            We have also sent these details to your email. You can find them later in your dashboard under "Credentials".
                        </p>
                    </div>

                    <button
                        onClick={onClose}
                        className="w-full py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl transition-all active:scale-95"
                    >
                        Go to Dashboard
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};

const ManualPaymentModal = ({
    orderId,
    amount,
    onClose,
    type
}: {
    orderId: string,
    amount: number,
    onClose: () => void,
    type: 'upi' | 'crypto'
}) => {
    const [step, setStep] = useState(1);
    const [utr, setUtr] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [selectedNetwork, setSelectedNetwork] = useState<'bsc' | 'tron' | 'eth'>('tron');
    const [proofFile, setProofFile] = useState<File | null>(null);
    const [uploadingProof, setUploadingProof] = useState(false);
    const supabase = createClient();

    const cryptoDetails = {
        bsc: {
            address: '0x06Cd21280D6eC7Ae38cC4Cf211E7a77c5dAE5517',
            network: 'BNB Smart Chain (BEP20)'
        },
        tron: {
            address: 'TYLt6t1Gv3Zb3ZUGgRFBbf2yTz3ey9BZJw',
            network: 'TRON (TRC20)'
        },
        eth: {
            address: '0x06Cd21280D6eC7Ae38cC4Cf211E7a77c5dAE5517',
            network: 'Ethereum (ERC20)'
        }
    };

    const upiDetails = {
        upiId: 'FUSION2024@YBL',
        name: 'Fusion Funded',
        bank: 'UPI Payment'
    };

    const uploadProof = async (file: File): Promise<string | null> => {
        try {
            setUploadingProof(true);
            const fileExt = file.name.split('.').pop();
            const fileName = `${orderId}-${Math.random()}.${fileExt}`;
            const { error: uploadError } = await supabase.storage
                .from('proofs')
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage
                .from('proofs')
                .getPublicUrl(fileName);

            return data.publicUrl;
        } catch (error) {
            console.error('Error uploading proof:', error);
            alert('Failed to upload payment proof');
            return null;
        } finally {
            setUploadingProof(false);
        }
    };

    const handleSubmit = async () => {
        if (!utr.trim()) return;
        setSubmitting(true);
        try {
            let finalProofUrl = null;
            if (proofFile) {
                finalProofUrl = await uploadProof(proofFile);
                if (!finalProofUrl) return; // Stop if upload failed
            }

            const isBrowser = typeof window !== 'undefined';
            const backendUrl = isBrowser ? "" : (process.env.NEXT_PUBLIC_BACKEND_URL || 'https://api.fusionfunded.co');
            const res = await fetch(`${backendUrl}/api/payments/update-manual-utr`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderId,
                    utr,
                    proofUrl: finalProofUrl
                })
            });
            if (res.ok) { setStep(3); }
            else { alert('Failed to submit transaction ID'); }
        } catch (e) {
            alert('Error connecting to server');
        } finally {
            setSubmitting(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert('Copied to clipboard!');
    };

    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4"
        >
            <motion.div
                initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
                className="w-full max-w-lg bg-[#0F1115] border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
            >
                {step === 1 && (
                    <div className="p-8 space-y-6 text-center">
                        <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/20 rounded-xl">
                                    <Wallet className="w-5 h-5 text-primary" />
                                </div>
                                <div className="text-left">
                                    <h2 className="text-xl font-bold text-white uppercase tracking-tight">{type === 'upi' ? 'UPI Payment' : 'Crypto Payment'}</h2>
                                    <p className="text-[10px] text-gray-500 font-mono">{orderId}</p>
                                </div>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-gray-400"><X size={20} /></button>
                        </div>

                        <div className="bg-primary/5 border border-primary/10 rounded-2xl p-6 flex flex-col items-center">
                            <div className="text-center mb-6">
                                <p className="text-xs text-gray-400 mb-1">Please send exactly</p>
                                <h4 className="text-3xl font-black text-white">
                                    {type === 'upi' ? `₹${Math.round(amount * 98).toLocaleString()}` : `$${amount.toLocaleString()}`}
                                </h4>
                                <p className="text-[10px] text-blue-400 mt-1 uppercase tracking-widest font-black">
                                    {type === 'upi' ? 'Manual Verification Required' : 'USDT ONLY'}
                                </p>
                            </div>

                            {type === 'crypto' ? (
                                <div className="w-full space-y-4">
                                    {/* Network Selector */}
                                    <div className="flex bg-black/40 p-1 rounded-xl border border-white/5">
                                        {(['tron', 'bsc', 'eth'] as const).map((net) => (
                                            <button
                                                key={net}
                                                onClick={() => setSelectedNetwork(net)}
                                                className={`flex-1 py-2 text-[10px] font-black rounded-lg transition-all ${selectedNetwork === net ? 'bg-primary text-primary-foreground shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                                            >
                                                {net === 'bsc' ? 'BEP20' : net.toUpperCase()}
                                            </button>
                                        ))}
                                    </div>

                                    {/* QR Code */}
                                    <div className="flex justify-center p-4 bg-white rounded-2xl mx-auto w-44 h-44 shadow-2xl">
                                        <QRCodeSVG
                                            value={cryptoDetails[selectedNetwork].address}
                                            size={144}
                                            level="H"
                                        />
                                    </div>

                                    <div className="bg-black/40 p-4 rounded-2xl border border-white/5 space-y-3">
                                        <div className="text-left">
                                            <p className="text-[9px] text-gray-500 uppercase font-black px-1">Network</p>
                                            <p className="text-xs text-white font-bold px-1">{cryptoDetails[selectedNetwork].network}</p>
                                        </div>
                                        <div className="flex items-center justify-between bg-black/60 p-3 rounded-xl border border-white/5 group">
                                            <div className="overflow-hidden text-left">
                                                <p className="text-[9px] text-gray-500 uppercase font-black">Address</p>
                                                <p className="text-[11px] text-white truncate font-mono opacity-80">{cryptoDetails[selectedNetwork].address}</p>
                                            </div>
                                            <button onClick={() => copyToClipboard(cryptoDetails[selectedNetwork].address)} className="p-2 hover:bg-white/5 rounded-lg text-primary transition-colors">
                                                <Copy className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="w-full space-y-4">
                                    {/* QR Code for UPI */}
                                    <div className="flex justify-center p-4 bg-white rounded-2xl mx-auto w-44 h-44 shadow-2xl">
                                        <QRCodeSVG
                                            value={`upi://pay?pa=${upiDetails.upiId}&pn=${encodeURIComponent(upiDetails.name)}&am=${Math.round(amount * 98)}&cu=INR`}
                                            size={144}
                                            level="H"
                                        />
                                    </div>
                                    <div className="bg-black/40 p-4 rounded-2xl border border-white/5 space-y-2 text-center">
                                        <div className="flex flex-col items-center justify-center p-4">
                                            <p className="text-[10px] text-gray-500 font-bold uppercase mb-2">Scan or Pay to UPI ID</p>
                                            <div className="flex items-center gap-3 bg-black/40 px-6 py-3 rounded-xl border border-white/10 mb-2">
                                                <span className="text-sm text-white font-mono font-black">{upiDetails.upiId}</span>
                                                <button onClick={() => copyToClipboard(upiDetails.upiId)} className="text-primary hover:text-primary/80 transition-colors">
                                                    <Copy className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <p className="text-[11px] text-primary font-black uppercase tracking-widest">{upiDetails.name}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={() => setStep(2)}
                            className="w-full py-4 bg-primary text-primary-foreground font-black rounded-2xl transition-all shadow-[0_10px_20px_rgba(var(--primary),0.2)] hover:shadow-[0_15px_30px_rgba(var(--primary),0.3)] active:scale-[0.98]"
                        >
                            I have made the payment
                        </button>
                    </div>
                )}

                {step === 2 && (
                    <div className="p-8 space-y-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-black text-white uppercase tracking-tight">Submit Transaction ID</h2>
                            <button onClick={() => setStep(1)} className="text-xs font-bold text-primary hover:underline">BACK</button>
                        </div>
                        <div className="bg-primary/5 border border-primary/10 rounded-2xl p-6 space-y-4">
                            <p className="text-xs text-gray-400 leading-relaxed">
                                Please provide the <span className="text-white font-bold">Transaction Hash or UTR</span> and upload your <span className="text-white font-bold">Payment Proof Image</span>. Our team will verify it within 1-12 hours.
                            </p>
                            <input
                                type="text"
                                placeholder={type === 'upi' ? "Paste UPI Reference / UTR Number" : "Paste Crypto Transaction Hash / TXID"}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-4 text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-mono text-sm"
                                value={utr}
                                onChange={(e) => setUtr(e.target.value)}
                            />

                            <div className="relative">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                                    disabled={submitting || uploadingProof}
                                />
                                <div className={`w-full bg-black/40 border ${proofFile ? 'border-primary' : 'border-white/10 border-dashed'} rounded-xl px-4 py-4 text-white hover:border-white/30 transition-all text-sm flex items-center justify-between`}>
                                    <span className={proofFile ? 'text-primary font-medium truncate' : 'text-gray-500'}>
                                        {proofFile ? (`✓ ${proofFile.name}`) : (type === 'upi' ? "Click to Upload Screenshot of UPI Payment" : "Click to Upload Screenshot of Crypto Transfer")}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={handleSubmit}
                            disabled={submitting || uploadingProof || !utr.trim() || !proofFile}
                            className="w-full py-4 bg-primary text-primary-foreground font-black rounded-2xl flex items-center justify-center gap-2 disabled:opacity-50 transition-all shadow-[0_10px_20px_rgba(var(--primary),0.2)] active:scale-[0.98]"
                        >
                            {(submitting || uploadingProof) ? <Loader2 className="animate-spin" /> : <CheckCircle2 size={18} />}
                            {uploadingProof ? 'UPLOADING PROOF...' : submitting ? 'VERIFYING...' : 'SUBMIT FOR APPROVAL'}
                        </button>
                    </div>
                )}

                {step === 3 && (
                    <div className="p-12 text-center space-y-6">
                        <div className="w-20 h-20 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center mx-auto mb-4 border border-green-500/20">
                            <CheckCircle2 size={40} className="animate-pulse" />
                        </div>
                        <h2 className="text-2xl font-black text-white uppercase tracking-tight">Submission Successful</h2>
                        <p className="text-gray-400 text-sm leading-relaxed">Your payment for order <span className="text-white font-mono font-bold bg-white/5 px-2 py-0.5 rounded">{orderId}</span> has been submitted. You will receive your credentials via email once verified.</p>
                        <button
                            onClick={onClose}
                            className="w-full py-4 bg-white/5 hover:bg-white/10 text-white font-black rounded-2xl transition-all border border-white/5 active:scale-[0.98]"
                        >
                            RETURN TO DASHBOARD
                        </button>
                    </div>
                )}
            </motion.div>
        </motion.div>
    );
};

export default function ChallengeConfigurator() {
    const router = useRouter();
    const supabase = createClient();

    // State
    const [type] = useState("hft");
    const [model] = useState("hft_funded");
    const [dynamicPricing, setDynamicPricing] = useState<any>(null);

    // Fetch dynamic pricing
    useEffect(() => {
        const fetchPricing = async () => {
            try {
                const data = await fetchFromBackend('/api/config/pricing', { requireAuth: false });
                if (data && Object.keys(data).length > 0) {
                    setDynamicPricing(data);
                }
            } catch (error) {
                console.warn('Failed to fetch dynamic pricing:', error);
            }
        };
        fetchPricing();
    }, []);

    const availableSizes = [2500, 5000, 10000, 25000, 50000, 100000];
    const [size, setSize] = useState(100000);

    const [platform, setPlatform] = useState("mt5");
    const [gateway, setGateway] = useState("crypto_manual");
    const [coupon, setCoupon] = useState("");
    const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
    const [couponError, setCouponError] = useState("");
    const [validatingCoupon, setValidatingCoupon] = useState(false);

    const [isPurchasing, setIsPurchasing] = useState(false);
    const [purchasedCredentials, setPurchasedCredentials] = useState<any>(null);
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [showManualPayment, setShowManualPayment] = useState(false);
    const [manualPaymentType, setManualPaymentType] = useState<'upi' | 'crypto'>('crypto');
    const [manualOrderId, setManualOrderId] = useState("");
    const [selectedAddons, setSelectedAddons] = useState<string[]>([]);

    // Clear applied coupon when size changes
    useEffect(() => {
        if (appliedCoupon) {
            setAppliedCoupon(null);
            setCouponError("");
        }
    }, [size]);

    // Price Calculation
    const getBasePrice = () => {
        const sizeKey = getSizeKey(size);
        const sourceConfig = (dynamicPricing && dynamicPricing['HFT2']) ? dynamicPricing : pricingConfig;
        const config = sourceConfig['HFT2'] as any;
        const sizeConfig = config[sizeKey];
        if (!sizeConfig) return 0;
        return parseInt(sizeConfig.price.replace('$', ''));
    };

    const basePriceUSD = getBasePrice();

    // Add-on Calculation
    const addonsTotalModifier = selectedAddons.reduce((acc, addonId) => {
        const addon = ADDONS.find(a => a.id === addonId);
        return acc + (addon ? addon.percentage : 0);
    }, 0);

    const addonsCost = Math.round(basePriceUSD * (addonsTotalModifier / 100));

    const discountAmount = (() => {
        if (!appliedCoupon) return 0;
        const type = String(appliedCoupon.discount.type || '').toLowerCase();
        if (type === 'percentage') {
            return Math.round(basePriceUSD * (Number(appliedCoupon.discount.value) / 100));
        }
        return Math.round(Number(appliedCoupon.discount.amount));
    })();

    const finalPriceUSD = Math.round(Math.max(0, basePriceUSD + addonsCost - discountAmount));
    const finalPriceINR = Math.round(finalPriceUSD * 98);

    const selectedGateway = PAYMENT_GATEWAYS.find(g => g.id === gateway);
    const displayCurrency = selectedGateway?.currency || 'USD';
    const displayPrice = displayCurrency === 'INR' ? finalPriceINR : finalPriceUSD;

    // Rule Details for Current Selection
    const currentConfig = pricingConfig.HFT2[getSizeKey(size) as keyof typeof pricingConfig.HFT2];

    const handleApplyCoupon = async () => {
        if (!coupon.trim()) return;
        setAppliedCoupon(null);
        setValidatingCoupon(true);
        setCouponError("");
        try {
            const data = await fetchFromBackend('/api/coupons/validate', {
                method: 'POST',
                body: JSON.stringify({ code: coupon.trim(), amount: basePriceUSD })
            });
            if (data.valid) { setAppliedCoupon(data); }
            else { setCouponError(data.error || 'Invalid coupon code'); }
        } catch (error) {
            setCouponError('Failed to validate coupon');
        } finally {
            setValidatingCoupon(false);
        }
    };

    const handlePurchase = async () => {
        setIsPurchasing(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                setIsPurchasing(false);
                return;
            }

            const mt5Group = 'AUS\\contest\\7401\\grp3';
            const isBrowser = typeof window !== 'undefined';
            const backendUrl = isBrowser ? "" : (process.env.NEXT_PUBLIC_BACKEND_URL || 'https://api.fusionfunded.co');
            const orderId = `FF${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

            // Both current gateways are manual
            try {
                const res = await fetch(`${backendUrl}/api/payments/create-order`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
                    },
                    body: JSON.stringify({
                        gateway: 'manual_crypto', // Always use this for now
                        orderId,
                        amount: finalPriceUSD,
                        currency: 'USD',
                        customerEmail: user.email || '',
                        customerName: user.user_metadata?.full_name || user.email || 'Customer',
                        metadata: {
                            account_type: 'HFT 2.0',
                            model: 'hft2',
                            type: 'phase1',
                            size: size,
                            account_size: size,
                            mt5_group: mt5Group,
                            platform,
                            coupon: appliedCoupon?.coupon?.code || null,
                            manual_method: gateway, // upi_manual or crypto_manual
                            selected_addons: selectedAddons
                        }
                    })
                });

                const data = await res.json();
                if (res.ok && data.success) {
                    setManualOrderId(orderId);
                    setManualPaymentType(gateway === 'upi_manual' ? 'upi' : 'crypto');
                    setShowManualPayment(true);
                } else {
                    alert(data.error || 'Failed to create order');
                }
            } catch (error) {
                alert('Failed to connect to server');
            }
        } catch (error) {
            alert('Failed to connect to server');
        } finally {
            setIsPurchasing(false);
        }
    };

    return (
        <div className="w-full max-w-[1600px] mx-auto p-4 md:p-8 font-sans text-foreground">

            <AnimatePresence>
                {purchasedCredentials && (
                    <SuccessModal
                        credentials={purchasedCredentials}
                        onClose={() => router.push('/dashboard')}
                    />
                )}

                {showManualPayment && (
                    <ManualPaymentModal
                        orderId={manualOrderId}
                        amount={finalPriceUSD}
                        type={manualPaymentType}
                        onClose={() => {
                            setShowManualPayment(false);
                            router.push('/dashboard');
                        }}
                    />
                )}
            </AnimatePresence>

            <div className="mb-8 flex items-center gap-4">
                <div className="h-8 w-1 bg-primary rounded-full" />
                <h1 className="text-3xl font-black tracking-tight text-white">Fusion Funded HFT 2.0</h1>
            </div>

            <div className="flex flex-col xl:flex-row gap-12">
                <div className="flex-1 space-y-10">

                    {/* Account Size */}
                    <section>
                        <SectionHeader title="Account Size" sub="Choose your preferred account size" />
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {availableSizes.map(s => (
                                <RadioPill
                                    key={s}
                                    active={size === s}
                                    label={`$${s.toLocaleString()}`}
                                    onClick={() => setSize(s)}
                                />
                            ))}
                        </div>
                    </section>


                    {/* Platform */}
                    <section>
                        <SectionHeader title="Trading Platform" sub="MetaTrader 5 is the standard for HFT" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {PLATFORMS.map(p => (
                                <RadioPill
                                    key={p.id}
                                    active={platform === p.id}
                                    label={p.label}
                                    onClick={() => setPlatform(p.id)}
                                />
                            ))}
                        </div>
                    </section>

                    {/* Add-ons Section */}
                    <section>
                        <SectionHeader title="Purchase Add-ons" sub="Customize your challenge with extra features" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {ADDONS.map(addon => {
                                const isActive = selectedAddons.includes(addon.id);
                                return (
                                    <div
                                        key={addon.id}
                                        onClick={() => {
                                            setSelectedAddons(prev =>
                                                prev.includes(addon.id)
                                                    ? prev.filter(id => id !== addon.id)
                                                    : [...prev, addon.id]
                                            );
                                        }}
                                        className={cn(
                                            "relative flex items-center justify-between p-5 rounded-xl border cursor-pointer transition-all duration-300 select-none group",
                                            isActive
                                                ? "bg-primary/10 border-primary shadow-[0_0_20px_rgba(var(--primary),0.15)]"
                                                : "bg-[#050923]/50 border-white/5 hover:border-white/20 backdrop-blur-sm"
                                        )}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={cn(
                                                "w-5 h-5 rounded border flex items-center justify-center transition-all duration-300",
                                                isActive ? "border-primary bg-primary" : "border-white/20 bg-white/5"
                                            )}>
                                                {isActive && <Check size={14} className="text-white" strokeWidth={4} />}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className={cn("text-sm font-bold tracking-tight", isActive ? "text-primary" : "text-white")}>
                                                    {addon.label}
                                                </span>
                                                <span className="text-[10px] text-gray-400 leading-tight">
                                                    {addon.desc}
                                                </span>
                                            </div>
                                        </div>
                                        <span className={cn("text-xs font-black px-2 py-1 rounded bg-white/5", isActive ? "text-primary" : "text-gray-400")}>
                                            {addon.percentage === 0 ? "0%" : `+${addon.percentage}%`}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </section>

                    {/* Payment Gateway */}
                    <section>
                        <SectionHeader title="Payment Gateway" sub="Choose your preferred payment method" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {PAYMENT_GATEWAYS.map(g => (
                                <div
                                    key={g.id}
                                    onClick={() => setGateway(g.id)}
                                    className={cn(
                                        "relative flex items-center gap-4 p-5 rounded-xl border cursor-pointer transition-all duration-300 select-none group",
                                        gateway === g.id
                                            ? "bg-primary/10 border-primary shadow-[0_0_20px_rgba(var(--primary),0.15)]"
                                            : "bg-[#050923]/50 border-white/5 hover:border-white/20 backdrop-blur-sm"
                                    )}
                                >
                                    <div className={cn(
                                        "w-6 h-6 rounded-full border flex items-center justify-center transition-all duration-300",
                                        gateway === g.id ? "border-primary bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)]" : "border-white/20 bg-white/5"
                                    )}>
                                        {gateway === g.id && <div className="w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_5px_white]" />}
                                    </div>
                                    <div className="flex-1 flex items-center gap-4">
                                        <span className="text-3xl filter drop-shadow-[0_4px_4px_rgba(0,0,0,0.25)]">{g.icon}</span>
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2">
                                                <span className={cn("text-base font-bold tracking-tight", gateway === g.id ? "text-primary" : "text-white")}>{g.label}</span>
                                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/20 text-primary font-bold border border-primary/20">{g.currency}</span>
                                            </div>
                                            <span className="text-xs text-gray-400 group-hover:text-gray-300 transition-colors">{g.desc}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                {/* Summary */}
                <div className="w-full xl:w-[450px] shrink-0 xl:sticky xl:top-8 space-y-6">
                    <div>
                        <SectionHeader title="Coupon Code" sub="Enter a coupon to get a discount" />
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Enter coupon code"
                                className="flex-1 bg-[#050923] text-white border border-white/10 rounded-lg px-4 py-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary uppercase transition-all"
                                value={coupon}
                                onChange={(e) => { setCoupon(e.target.value); setCouponError(""); setAppliedCoupon(null); }}
                            />
                            <button onClick={handleApplyCoupon} disabled={validatingCoupon || !coupon.trim()} className="px-6 font-bold text-sm text-white rounded-lg bg-[#050923] border border-white/10 hover:border-primary hover:text-primary transition-all disabled:opacity-50">
                                {validatingCoupon ? 'Checking...' : 'Apply'}
                            </button>
                        </div>
                        {couponError && <p className="text-xs text-red-400 mt-1">{couponError}</p>}
                        {appliedCoupon && (
                            <div className="flex items-center gap-2 text-sm text-green-400 mt-1">
                                <Check size={14} />
                                <span>Coupon Applied! {appliedCoupon.discount.type?.toLowerCase() === 'percentage' && `(${appliedCoupon.discount.value}% OFF)`}</span>
                            </div>
                        )}
                    </div>

                    <div className="bg-[#050923]/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden">
                        <div className="p-6 border-b border-white/10 bg-gradient-to-r from-primary/10 to-transparent">
                            <h3 className="font-bold text-lg text-white tracking-wide">Order Summary</h3>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="flex justify-between items-start text-sm">
                                <span className="text-gray-400 font-medium">${size.toLocaleString()} Fusion Funded HFT 2.0</span>
                                <span className="font-bold font-mono text-white text-lg">{displayCurrency === 'INR' ? '₹' : '$'}{(displayCurrency === 'INR' ? Math.round(basePriceUSD * 98) : basePriceUSD).toLocaleString()}</span>
                            </div>

                            {selectedAddons.length > 0 && (
                                <div className="space-y-2">
                                    {selectedAddons.map(addonId => {
                                        const addon = ADDONS.find(a => a.id === addonId)!;
                                        const cost = Math.round(basePriceUSD * (addon.percentage / 100));
                                        return (
                                            <div key={addonId} className="flex justify-between items-center text-xs">
                                                <span className="text-gray-400 flex items-center gap-1">
                                                    <CheckCircle2 size={12} className="text-primary" />
                                                    {addon.label}
                                                </span>
                                                <span className="font-mono text-white">
                                                    +{displayCurrency === 'INR' ? '₹' : '$'}{(displayCurrency === 'INR' ? Math.round(cost * 98) : cost).toLocaleString()}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                            {appliedCoupon && (
                                <div className="flex justify-between items-center text-sm text-green-400 bg-green-500/5 p-2 rounded-lg border border-green-500/10">
                                    <span className="font-medium">Discount ({appliedCoupon.coupon.code})</span>
                                    <span className="font-bold font-mono">-{displayCurrency === 'INR' ? '₹' : '$'}{Math.round(displayCurrency === 'INR' ? Math.round(discountAmount * 98) : discountAmount).toLocaleString()}</span>
                                </div>
                            )}
                            <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                            <div className="flex justify-between items-end py-2">
                                <span className="text-sm font-bold text-gray-300 uppercase tracking-widest">Total</span>
                                <div className="text-right">
                                    <div className="flex items-baseline gap-1 justify-end">
                                        <span className="text-xs font-bold text-primary mb-1">{displayCurrency}</span>
                                        <span className="text-4xl font-black text-white tracking-tighter">
                                            {displayCurrency === 'INR' ? '₹' : '$'}{displayPrice.toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white/5 rounded-xl p-4 border border-white/5 hover:border-white/10 transition-colors">
                                <label className="flex gap-3 cursor-pointer select-none group">
                                    <div className="relative mt-0.5">
                                        <input
                                            type="checkbox"
                                            className="peer sr-only"
                                            checked={agreedToTerms}
                                            onChange={(e) => setAgreedToTerms(e.target.checked)}
                                            id="terms-checkbox"
                                        />
                                        <div className="w-5 h-5 rounded-md border border-white/20 bg-white/5 transition-all peer-checked:bg-primary peer-checked:border-primary flex items-center justify-center">
                                            <Check size={14} className="text-white scale-0 peer-checked:scale-100 transition-transform" strokeWidth={4} />
                                        </div>
                                    </div>
                                    <span className="text-xs text-gray-400 group-hover:text-gray-300 transition-colors leading-relaxed">
                                        I agree to the <span className="text-primary font-semibold hover:underline">Terms of Use</span> and confirmed my details.
                                    </span>
                                </label>
                            </div>

                            <button
                                onClick={handlePurchase}
                                disabled={isPurchasing || !agreedToTerms}
                                className={cn(
                                    "w-full py-4 bg-primary text-primary-foreground font-black text-lg rounded-xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-[0_10px_20px_rgba(var(--primary),0.3)] hover:shadow-[0_15px_30px_rgba(var(--primary),0.4)]",
                                    (!agreedToTerms || isPurchasing) && "opacity-50 grayscale shadow-none"
                                )}
                            >
                                {isPurchasing ? <Loader2 size={24} className="animate-spin" /> : <CreditCard size={24} />}
                                {isPurchasing ? 'Processing...' : 'Complete Purchase'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
}
