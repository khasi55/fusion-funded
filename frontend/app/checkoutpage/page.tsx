"use client";

import { useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2, ArrowRight, Wallet, ShieldCheck, Zap, Trophy, Globe, Info, CreditCard, X } from 'lucide-react';
import { cn } from "@/lib/utils";
import Link from "next/link";
import PublicSidebar from "@/components/layout/PublicSidebar";
import { COUNTRIES } from "@/lib/countries";
import { pricingConfig, getSizeKey, getConfigKey } from "@/components/challenges/ChallengeConfigurator";
import { fetchFromBackend } from "@/lib/backend-api";

// --- Reusable UI Component ---
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
    <motion.button
        whileHover={!disabled ? { scale: 1.02, translateY: -2 } : {}}
        whileTap={!disabled ? { scale: 0.98 } : {}}
        onClick={disabled ? undefined : onClick}
        disabled={disabled}
        className={cn(
            "relative flex items-center gap-4 p-5 rounded-[1.25rem] border text-left transition-all duration-300 select-none w-full group",
            disabled
                ? "bg-white/5 border-transparent opacity-40 cursor-not-allowed"
                : "cursor-pointer",
            !disabled && active
                ? "bg-blue-600/15 border-blue-500/60 shadow-[0_0_25px_rgba(59,130,246,0.15)] ring-1 ring-blue-500/20"
                : !disabled && "bg-slate-900/40 border-white/5 hover:border-white/20 hover:bg-slate-900/60 backdrop-blur-md"
        )}
    >
        {/* Selection Indicator Glow */}
        {active && !disabled && (
            <div className="absolute inset-0 bg-blue-500/5 rounded-[1.25rem] blur-xl pointer-events-none" />
        )}

        {/* Radio Circle */}
        <div className={cn(
            "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 shrink-0",
            active ? "border-blue-500 bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" : "border-white/10 group-hover:border-white/30",
            disabled && "border-white/5 bg-transparent"
        )}>
            {active && (
                <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-2 h-2 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,1)]" 
                />
            )}
        </div>

        <div className="flex flex-col relative z-10">
            <span className={cn(
                "text-base font-bold tracking-tight transition-colors", 
                active ? "text-white" : "text-slate-400 group-hover:text-slate-200"
            )}>
                {label}
            </span>
            {subLabel && (
                <span className={cn(
                    "text-[11px] font-semibold tracking-wider uppercase mt-0.5",
                    active ? "text-blue-400/80" : "text-slate-600 group-hover:text-slate-500"
                )}>
                    {subLabel}
                </span>
            )}
        </div>

        {/* Glossy Overlay */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
    </motion.button>
);

const SectionHeader = ({ title, sub }: { title: string, sub: string }) => (
    <div className="mb-6 relative">
        <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-blue-500 to-cyan-500 rounded-full blur-[1px]" />
        <h3 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
            {title}
            <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
        </h3>
        <p className="text-sm text-slate-500 font-semibold tracking-wide mt-1 uppercase opacity-80">{sub}</p>
    </div>
);

// Constants
// Constants
const EXCHANGE_RATE_INR = 98;
const CHALLENGE_TYPES = [
    { id: "hft", label: "HFT Phase 1", desc: "Fast-track contest evaluation", recommended: true }
];

const MODELS = [
    { id: "hft_funded", label: "HFT Funded", desc: "Official funded contest account" }
];

const PLATFORMS = [
    { id: "mt5", label: "MetaTrader 5" }
];

function CheckoutContent() {
    const searchParams = useSearchParams();

    // Configurator State
    const [type, setType] = useState("hft");
    const [model, setModel] = useState("hft_funded");
    const [size, setSize] = useState(100000);
    const [platform, setPlatform] = useState("mt5");
    const [coupon, setCoupon] = useState("");
    const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
    const [couponError, setCouponError] = useState("");
    const [validatingCoupon, setValidatingCoupon] = useState(false);

    // Dynamic Pricing State
    const [pricingData, setPricingData] = useState<any>(pricingConfig);

    // Fetch dynamic pricing
    useEffect(() => {
        const loadPricing = async () => {
            try {
                // Use the new public endpoint
                const data = await fetchFromBackend('/api/config/pricing');
                if (data && Object.keys(data).length > 0) {
                    setPricingData(data);
                }
            } catch (e) {
                console.error("Failed to load pricing", e);
            }
        };
        loadPricing();
    }, []);

    // Checkout Flow State
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentUrl, setPaymentUrl] = useState("");
    const [formData, setFormData] = useState({
        firstName: "", lastName: "", email: "", country: "", phone: "", terms: false, referralCode: ""
    });
    const [selectedGateway, setSelectedGateway] = useState("epay");


    // Dynamic Size Logic
    const availableSizes = (() => {
        const configKey = getConfigKey(type, model);
        if (!configKey) return [];
        // Use pricingData instead of pricingConfig
        const config = pricingData[configKey];
        if (!config) return [];
        const sizesStr = Object.keys(config);
        return sizesStr.map(s => parseInt(s.replace('K', '')) * 1000).sort((a, b) => a - b);
    })();

    // Ensure valid size on type/model change
    useEffect(() => {
        if (!availableSizes.includes(size)) {
            if (availableSizes.length > 0) setSize(availableSizes[0]);
        }
    }, [type, model, availableSizes, size]);

    // Pricing Calculation
    const getBasePrice = () => {
        const configKey = getConfigKey(type, model);
        if (!configKey) return 0;
        const sizeKey = getSizeKey(size);
        const config = pricingData[configKey] as any;
        if (!config) return 0;
        const sizeConfig = config[sizeKey];
        if (!sizeConfig) return 0;
        return parseInt(sizeConfig.price.replace('$', ''));
    };

    const basePriceUSD = getBasePrice();
    const discountAmount = appliedCoupon ? Math.round(appliedCoupon.discount.amount) : 0;
    const finalPriceUSD = Math.round(Math.max(0, basePriceUSD - discountAmount));
    // const finalPriceINR = Math.round(finalPriceUSD * 84); // If implementing INR view

    const handleApplyCoupon = async () => {
        if (!coupon.trim()) return;
        setAppliedCoupon(null); // Clear previous state immediately
        setValidatingCoupon(true);
        setCouponError("");
        try {
            const data = await fetchFromBackend('/api/coupons/validate', {
                method: 'POST',
                body: JSON.stringify({ code: coupon.trim(), amount: basePriceUSD, account_type_id: null }),
                requireAuth: false
            });
            if (data.valid) {
                setAppliedCoupon(data);
                setCouponError("");
            } else {
                setAppliedCoupon(null);
                setCouponError(data.error || 'Invalid coupon code');
            }
        } catch (error) {
            console.error('Coupon error:', error);
            setCouponError('Failed to validate coupon');
        } finally {
            setValidatingCoupon(false);
        }
    };

    // Clear/Re-validate coupon when config changes (and price likely changes)
    useEffect(() => {
        setAppliedCoupon(null); // Clear stale coupon IMMEDIATELY on config change
        if (coupon.trim()) {
            handleApplyCoupon();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [size, type, model]);


    const handleContinue = () => {
        if (currentStep < 3) setCurrentStep(currentStep + 1);
        else handleSubmit();
    };

    const handleBack = () => {
        if (currentStep > 1) setCurrentStep(currentStep - 1);
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            // 1. Determine MT5 Group based on Brand
            let mt5Group = '';
            
            // HFT Branding (Specific requirement grp3)
            if (type === 'hft') {
                mt5Group = 'AUS\\contest\\7401\\grp3';
            }
            // Lite (S folders)
            else if (model === 'lite') {
                if (type === 'Instant') mt5Group = 'demo\\S\\0-SF';
                else if (type === '1-step') mt5Group = 'demo\\S\\1-SF';
                else if (type === '2-step') mt5Group = 'demo\\S\\2-SF';
            }
            // Prime (SF folders)
            else if (model === 'prime') {
                if (type === 'Instant') mt5Group = 'demo\\SF\\0-Pro';
                else if (type === '1-step') mt5Group = 'demo\\Pro-Platinum';
                else if (type === '2-step') mt5Group = 'demo\\SF\\2-Pro';
            }

            // Call backend payment API
            const isBrowser = typeof window !== 'undefined';
            const backendUrl = isBrowser ? "" : (process.env.NEXT_PUBLIC_BACKEND_URL || 'https://api.fusionfunded.co');
            
            // EPay requires alphanumeric orderID (no hyphens or special chars)
            const orderId = `SF${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
            const response = await fetch(`${backendUrl}/api/payments/create-order`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    gateway: selectedGateway.toLowerCase(),
                    orderId: orderId,
                    amount: finalPriceUSD,
                    currency: 'USD',
                    customerEmail: formData.email,
                    customerName: `${formData.firstName} ${formData.lastName}`,
                    metadata: {
                        type: type.toLowerCase(),
                        model,
                        size,
                        mt5_group: mt5Group,
                        platform: 'MT5',
                        country: formData.country,
                        phone: formData.phone,
                        referralCode: formData.referralCode,
                        coupon: appliedCoupon ? coupon : undefined
                    }
                })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to create order');

            if (data.paymentUrl) {
                const gatewayLower = selectedGateway.toLowerCase();
                if (gatewayLower === 'epay' || gatewayLower === 'sharkpay' || gatewayLower === 'cregis') {
                    // Redirect directly for these gateways to avoid iframe issues
                    window.location.href = data.paymentUrl;
                } else {
                    setPaymentUrl(data.paymentUrl);
                    setShowPaymentModal(true);
                }
            } else {
                alert('Order created but no payment URL returned.');
            }
        } catch (error: any) {
            console.error(error);
            alert(error.message || "Payment initialization failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex-1 flex flex-col h-full md:h-[calc(100vh-2rem)] relative w-full bg-[#03040c] md:rounded-[2.5rem] md:my-4 md:mr-4 overflow-hidden border border-white/5 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
            {/* Rich Background Aesthetics */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none animate-pulse" style={{ animationDuration: '8s' }} />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-cyan-600/5 rounded-full blur-[140px] pointer-events-none animate-pulse" style={{ animationDuration: '12s' }} />
            <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-purple-600/5 rounded-full blur-[120px] pointer-events-none" />

            <main className="flex-1 overflow-y-auto w-full relative scrollbar-hide">

                {/* Stepper Header */}
                <div className="flex flex-col md:flex-row items-center justify-between p-8 md:px-12 md:py-10 border-b border-white/[0.03] bg-[#03040c]/60 backdrop-blur-3xl sticky top-0 z-20">
                    <div className="relative group">
                        <h1 className="text-4xl font-black text-white tracking-tighter mb-4 md:mb-0 bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-slate-500">
                            Secure Checkout
                        </h1>
                        <div className="absolute -bottom-1 left-0 w-12 h-1 bg-blue-600 rounded-full group-hover:w-full transition-all duration-500" />
                    </div>
                    
                    <div className="flex items-center gap-6 text-sm font-bold">
                        {[1, 2, 3].map((step) => (
                            <div key={step} className="flex items-center gap-4 group/step">
                                <div className={cn(
                                    "w-10 h-10 rounded-2xl flex items-center justify-center text-sm transition-all duration-500 border-2",
                                    currentStep >= step 
                                        ? "bg-blue-600 border-blue-400 text-white shadow-[0_0_20px_rgba(37,99,235,0.3)] scale-110" 
                                        : "bg-white/5 border-white/10 text-slate-600 group-hover/step:border-white/20"
                                )}>
                                    {step}
                                </div>
                                <span className={cn(
                                    "transition-all duration-500 tracking-tight uppercase text-[10px]", 
                                    currentStep >= step ? "text-white scale-105" : "text-slate-600"
                                )}>
                                    {step === 1 ? "Customize" : step === 2 ? "Identity" : "Finalize"}
                                </span>
                                {step < 3 && <div className={cn("w-8 h-[2px] rounded-full transition-all duration-1000 hidden lg:block", currentStep > step ? "bg-gradient-to-r from-blue-600 to-cyan-500" : "bg-white/5")}></div>}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-12 pb-24">

                    {/* Step 1: Configuration (Replaces old UI) */}
                    <div className={cn("grid grid-cols-1 xl:grid-cols-3 gap-8", currentStep !== 1 && "hidden")}>

                        {/* Config Column */}
                        <div className="xl:col-span-2 space-y-8">
                            {/* Model */}
                            <section>
                                <SectionHeader title="Model" sub="Choose your account tier" />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {MODELS.map(m => (
                                        <RadioPill
                                            key={m.id}
                                            active={model === m.id}
                                            label={m.label}
                                            subLabel={m.desc}
                                            onClick={() => {
                                                setModel(m.id);
                                                if (m.id === 'prime' && type === '1-step') setType('2-step');
                                            }}
                                        />
                                    ))}
                                </div>
                            </section>

                            {/* Type */}
                            <section>
                                <SectionHeader title="Challenge Type" sub="Choose your evaluation path" />
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {CHALLENGE_TYPES.map(t => {
                                        const isDisabled = model === 'prime' && t.id === '1-step';
                                        return (
                                            <RadioPill
                                                key={t.id}
                                                active={type === t.id}
                                                label={t.label}
                                                subLabel={t.desc}
                                                disabled={isDisabled}
                                                onClick={() => { if (!isDisabled) setType(t.id); }}
                                            />
                                        );
                                    })}
                                </div>
                            </section>

                            {/* Size */}
                            <section>
                                <SectionHeader title="Account Size" sub="Select starting balance" />
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
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
                                <SectionHeader title="Platform" sub="Trading interface" />
                                <div className="grid grid-cols-1 gap-4 max-w-sm">
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
                        </div>

                        {/* Summary Column (Sticky) */}
                        <div className="xl:col-span-1">
                            <div className="sticky top-24 space-y-6">
                                 {/* Coupon */}
                                <motion.div 
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-slate-900/60 backdrop-blur-3xl p-8 rounded-[2rem] border border-white/[0.05] shadow-2xl relative overflow-hidden group"
                                >
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-all duration-700" />
                                    
                                    <h3 className="font-bold text-[11px] mb-5 text-slate-500 uppercase tracking-[0.2em]">Redeem Promo Code</h3>
                                    <div className="flex gap-3">
                                        <input
                                            type="text"
                                            placeholder="ENTER CODE"
                                            className="flex-1 bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 text-sm text-white uppercase focus:outline-none focus:border-blue-500/50 focus:bg-white/[0.07] transition-all placeholder:text-slate-700 font-bold tracking-widest"
                                            value={coupon}
                                            onChange={(e) => {
                                                setCoupon(e.target.value);
                                                setCouponError("");
                                                setAppliedCoupon(null);
                                            }}
                                            disabled={validatingCoupon}
                                        />
                                        <button
                                            onClick={handleApplyCoupon}
                                            disabled={validatingCoupon || !coupon.trim()}
                                            className="px-8 text-sm font-black text-white bg-blue-600 hover:bg-blue-500 rounded-2xl transition-all disabled:opacity-30 shadow-[0_0_20px_rgba(37,99,235,0.2)] active:scale-95"
                                        >
                                            Apply
                                        </button>
                                    </div>
                                    <AnimatePresence>
                                        {couponError && (
                                            <motion.p 
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="text-[11px] text-red-400 mt-4 font-bold uppercase tracking-wider ml-1"
                                            >
                                                {couponError}
                                            </motion.p>
                                        )}
                                        {appliedCoupon && (
                                            <motion.div 
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                className={cn(
                                                    "flex items-center gap-3 text-xs mt-4 font-bold px-4 py-3 rounded-xl backdrop-blur-md", 
                                                    appliedCoupon.discount.type === 'bogo' 
                                                        ? "text-purple-400 border border-purple-500/30 bg-purple-500/10" 
                                                        : "text-emerald-400 border border-emerald-500/30 bg-emerald-500/10"
                                                )}
                                            >
                                                {appliedCoupon.discount.type === 'bogo' ? <Zap size={16} className="text-purple-400 animate-pulse" /> : <Check size={16} className="text-emerald-400" />}
                                                <div className="flex flex-col">
                                                    <span className="uppercase tracking-widest text-[9px] opacity-70">Success</span>
                                                    <span>
                                                        {appliedCoupon.discount.type === 'bogo'
                                                            ? `BOGO Activated!`
                                                            : `${appliedCoupon.coupon.code} - $${Math.round(discountAmount)} SAVED`
                                                        }
                                                    </span>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>

                                {/* Order Summary */}
                                <motion.div 
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 }}
                                    className="bg-gradient-to-b from-slate-900/80 to-slate-950/80 backdrop-blur-3xl p-10 rounded-[3rem] border border-white/5 shadow-[0_0_50px_rgba(0,0,0,0.3)] relative overflow-hidden group"
                                >
                                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-600/10 rounded-full blur-[80px] pointer-events-none group-hover:bg-blue-600/20 transition-all duration-1000" />
                                    <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-cyan-600/5 rounded-full blur-[80px] pointer-events-none" />
                                    
                                    <h3 className="font-black text-2xl text-white mb-8 border-b border-white/5 pb-6 tracking-tighter">Order Detail</h3>
                                    
                                    <div className="space-y-6">
                                        <div className="flex justify-between items-center group/item">
                                            <span className="text-slate-500 font-bold tracking-[0.15em] uppercase text-[10px] group-hover/item:text-slate-400 transition-colors">Account</span>
                                            <span className="font-black text-white text-base tracking-tight">${size.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between items-center group/item">
                                            <span className="text-slate-500 font-bold tracking-[0.15em] uppercase text-[10px] group-hover/item:text-slate-400 transition-colors">Type</span>
                                            <span className="font-black text-white text-base tracking-tight">{CHALLENGE_TYPES.find(t => t.id === type)?.label}</span>
                                        </div>
                                        <div className="flex justify-between items-center group/item">
                                            <span className="text-slate-500 font-bold tracking-[0.15em] uppercase text-[10px] group-hover/item:text-slate-400 transition-colors">Risk Tier</span>
                                            <span className="font-black text-blue-400 text-base tracking-tight">{MODELS.find(m => m.id === model)?.label}</span>
                                        </div>

                                        <div className="py-4">
                                            <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                                        </div>

                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-500 font-bold tracking-[0.15em] uppercase text-[10px]">Price</span>
                                            <span className="font-bold font-mono text-slate-300 text-lg tracking-tighter">${basePriceUSD}</span>
                                        </div>

                                        <AnimatePresence>
                                            {appliedCoupon && (
                                                <motion.div 
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    className={cn(
                                                        "flex justify-between items-center px-4 py-3 rounded-2xl", 
                                                        appliedCoupon.discount.type === 'bogo' ? "bg-purple-600/10 border border-purple-500/20" : "bg-emerald-600/10 border border-emerald-500/20"
                                                    )}
                                                >
                                                    <span className={cn("font-black text-[10px] uppercase tracking-[0.2em]", appliedCoupon.discount.type === 'bogo' ? "text-purple-400" : "text-emerald-400")}>
                                                        {appliedCoupon.discount.type === 'bogo' ? "BOGO ACTIVE" : "DISCOUNT"}
                                                    </span>
                                                    <span className={cn("font-black font-mono text-xl tracking-tighter", appliedCoupon.discount.type === 'bogo' ? "text-purple-400" : "text-emerald-400")}>
                                                        {appliedCoupon.discount.type === 'bogo' ? "FREE" : `-$${Math.round(discountAmount)}`}
                                                    </span>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        <div className="pt-8 mt-4 border-t border-white/10 relative">
                                            <div className="flex justify-between items-end">
                                                <div>
                                                    <span className="font-black text-[11px] text-slate-500 uppercase tracking-[0.3em] block mb-1">Total Due</span>
                                                    <div className="flex items-baseline gap-1">
                                                        <span className="text-4xl font-black text-white tracking-tighter shadow-blue-500/20 drop-shadow-2xl">
                                                            ${Math.round(finalPriceUSD)}
                                                        </span>
                                                        <span className="text-xs font-bold text-blue-500/60 font-mono">USD</span>
                                                    </div>
                                                </div>
                                                <div className="pb-1">
                                                    <div className="w-12 h-12 rounded-full bg-blue-600/10 flex items-center justify-center border border-blue-500/20">
                                                        <ShieldCheck className="text-blue-500" size={20} />
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            {/* Decorative Corner Glow */}
                                            <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        </div>

                    </div>


                    {/* Step 2: Register (Enhanced UI) */}
                    <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={cn("space-y-12 max-w-4xl mx-auto py-12", currentStep !== 2 && "hidden")}
                    >
                        <div className="text-center mb-16 relative">
                            <motion.div 
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="absolute -top-12 left-1/2 -translate-x-1/2 w-24 h-24 bg-blue-600/10 rounded-full blur-3xl"
                            />
                            <h2 className="text-5xl font-black text-white tracking-tighter mb-4">Account Creation</h2>
                            <p className="text-slate-500 font-bold tracking-wide uppercase text-[10px]">Secure your trader identity</p>
                        </div>

                        <div className="bg-slate-900/60 backdrop-blur-3xl p-12 rounded-[3.5rem] border border-white/[0.05] shadow-[0_0_50px_rgba(0,0,0,0.3)] grid grid-cols-1 md:grid-cols-2 gap-10 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-64 h-64 bg-blue-600/5 rounded-full blur-[100px] pointer-events-none" />
                            
                            {/* Form Inputs */}
                            <div className="space-y-3 relative z-10">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">First Name</label>
                                <input
                                    type="text"
                                    value={formData.firstName}
                                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                    className="w-full bg-white/[0.03] border border-white/10 rounded-[1.25rem] px-6 py-5 text-white focus:outline-none focus:border-blue-500/50 focus:bg-white/[0.08] transition-all placeholder:text-slate-700 font-bold"
                                    placeholder="e.g. John"
                                />
                            </div>
                            <div className="space-y-3 relative z-10">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Last Name</label>
                                <input
                                    type="text"
                                    value={formData.lastName}
                                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                    className="w-full bg-white/[0.03] border border-white/10 rounded-[1.25rem] px-6 py-5 text-white focus:outline-none focus:border-blue-500/50 focus:bg-white/[0.08] transition-all placeholder:text-slate-700 font-bold"
                                    placeholder="e.g. Doe"
                                />
                            </div>
                            <div className="space-y-3 md:col-span-2 relative z-10">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Email Identity</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full bg-white/[0.03] border border-white/10 rounded-[1.25rem] px-6 py-5 text-white focus:outline-none focus:border-blue-500/50 focus:bg-white/[0.08] transition-all placeholder:text-slate-700 font-bold"
                                    placeholder="trader@fusionfunded.com"
                                />
                            </div>
                            <div className="space-y-3 relative z-10">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Country of Residence</label>
                                <div className="relative">
                                    <select
                                        value={formData.country}
                                        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                                        className="w-full bg-white/[0.03] border border-white/10 rounded-[1.25rem] px-6 py-5 text-white focus:outline-none focus:border-blue-500/50 focus:bg-white/[0.08] transition-all appearance-none cursor-pointer font-bold pr-12"
                                    >
                                        <option value="" className="bg-[#03040c]">Select Territory</option>
                                        {COUNTRIES.map(c => <option key={c.code} value={c.code} className="bg-[#03040c]">{c.name}</option>)}
                                    </select>
                                    <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
                                        <Globe size={20} />
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-3 relative z-10">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Mobile Number</label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full bg-white/[0.03] border border-white/10 rounded-[1.25rem] px-6 py-5 text-white focus:outline-none focus:border-blue-500/50 focus:bg-white/[0.08] transition-all placeholder:text-slate-700 font-bold"
                                    placeholder="+1 234 567 8900"
                                />
                            </div>
                            <div className="space-y-3 relative z-10">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Promo Referral (Optional)</label>
                                <input
                                    type="text"
                                    value={formData.referralCode}
                                    onChange={(e) => setFormData({ ...formData, referralCode: e.target.value })}
                                    className="w-full bg-white/[0.03] border border-white/10 rounded-[1.25rem] px-6 py-5 text-white focus:outline-none focus:border-blue-500/50 focus:bg-white/[0.08] transition-all placeholder:text-slate-700 font-bold"
                                />
                            </div>
                            <div className="md:col-span-2 pt-8 relative z-10">
                                <label className="flex items-start gap-5 cursor-pointer group">
                                    <div className="relative flex items-center justify-center mt-1">
                                        <input
                                            type="checkbox"
                                            checked={formData.terms}
                                            onChange={(e) => setFormData({ ...formData, terms: e.target.checked })}
                                            className="peer absolute opacity-0 w-7 h-7 cursor-pointer"
                                        />
                                        <div className="w-7 h-7 border-2 border-white/10 rounded-xl bg-white/[0.03] peer-checked:bg-blue-600 peer-checked:border-blue-400 transition-all duration-300 flex items-center justify-center shadow-lg group-hover:border-white/30">
                                            {formData.terms && <Check size={16} className="text-white" strokeWidth={3} />}
                                        </div>
                                    </div>
                                    <span className="text-sm text-slate-500 font-bold leading-relaxed group-hover:text-slate-300 transition-colors">
                                        I certify that I have read and agree to the <span className="text-blue-500 hover:underline">Terms of Service</span> and <span className="text-blue-500 hover:underline">Privacy Policy</span>.
                                    </span>
                                </label>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={cn("space-y-12 max-w-5xl mx-auto py-12", currentStep !== 3 && "hidden")}
                    >
                        <div className="text-center mb-16 relative">
                            <motion.div 
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="absolute -top-12 left-1/2 -translate-x-1/2 w-24 h-24 bg-blue-600/10 rounded-full blur-3xl"
                            />
                            <h2 className="text-5xl font-black text-white tracking-tighter mb-4">Payment Selection</h2>
                            <p className="text-slate-500 font-bold tracking-wide uppercase text-[10px]">Secure Gateway Protocol</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">


                            {/* EPay Option */}
                            <motion.button
                                whileHover={{ scale: 1.02, translateY: -5 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setSelectedGateway("epay")}
                                className={cn(
                                    "p-10 border-[3px] rounded-[3.5rem] transition-all text-left relative overflow-hidden group/card",
                                    selectedGateway === "epay" 
                                        ? "bg-blue-600/15 border-blue-500 shadow-[0_30px_60px_-12px_rgba(255,255,255,0.05),0_18px_36px_-18px_rgba(37,99,235,0.3)] ring-1 ring-blue-400/20" 
                                        : "bg-slate-900/40 border-white/5 hover:border-white/10 backdrop-blur-xl"
                                )}
                            >
                                <div className="flex justify-between items-start mb-10">
                                    <div className={cn(
                                        "p-5 rounded-3xl transition-all duration-500 shadow-2xl", 
                                        selectedGateway === "epay" ? "bg-blue-500 text-white rotate-6 scale-110" : "bg-white/5 text-slate-500"
                                    )}>
                                        <Globe size={32} strokeWidth={2.5} />
                                    </div>
                                    {selectedGateway === "epay" && (
                                        <motion.div 
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            className="w-8 h-8 bg-blue-400 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(96,165,250,0.5)]"
                                        >
                                            <Check className="text-white" size={18} strokeWidth={4} />
                                        </motion.div>
                                    )}
                                </div>
                                <h3 className="text-2xl font-black text-white tracking-tight mb-2">Global Card</h3>
                                <p className="text-slate-500 text-[11px] font-bold uppercase tracking-widest leading-relaxed">International Visa/Mastercard</p>
                                
                                <div className="mt-10 flex flex-col">
                                    <span className="text-[10px] font-black text-blue-500/60 uppercase tracking-[0.3em] mb-1">Standard Billing</span>
                                    <div className="text-3xl font-black text-white font-mono tracking-tighter">
                                        ${Math.round(finalPriceUSD)}
                                    </div>
                                </div>

                                <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-blue-500/5 rounded-full blur-3xl group-hover/card:bg-blue-500/10 transition-all duration-700" />
                            </motion.button>

                            {/* Cregis Crypto Option */}
                            <motion.button
                                whileHover={{ scale: 1.02, translateY: -5 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setSelectedGateway("Cregis")}
                                className={cn(
                                    "p-10 border-[3px] rounded-[3.5rem] transition-all text-left relative overflow-hidden group/card",
                                    selectedGateway === "Cregis" 
                                        ? "bg-blue-600/15 border-blue-500 shadow-[0_30px_60px_-12px_rgba(255,255,255,0.05),0_18px_36px_-18px_rgba(37,99,235,0.3)] ring-1 ring-blue-400/20" 
                                        : "bg-slate-900/40 border-white/5 hover:border-white/10 backdrop-blur-xl"
                                )}
                            >
                                <div className="flex justify-between items-start mb-10">
                                    <div className={cn(
                                        "p-5 rounded-3xl transition-all duration-500 shadow-2xl", 
                                        selectedGateway === "Cregis" ? "bg-blue-500 text-white rotate-6 scale-110" : "bg-white/5 text-slate-500"
                                    )}>
                                        <Trophy size={32} strokeWidth={2.5} />
                                    </div>
                                    {selectedGateway === "Cregis" && (
                                        <motion.div 
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            className="w-8 h-8 bg-blue-400 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(96,165,250,0.5)]"
                                        >
                                            <Check className="text-white" size={18} strokeWidth={4} />
                                        </motion.div>
                                    )}
                                </div>
                                <h3 className="text-2xl font-black text-white tracking-tight mb-2">Crypto Assets</h3>
                                <p className="text-slate-500 text-[11px] font-bold uppercase tracking-widest leading-relaxed">DeFi Transfer (USDT/BTC/ETH)</p>
                                
                                <div className="mt-10 flex flex-col">
                                    <span className="text-[10px] font-black text-blue-500/60 uppercase tracking-[0.3em] mb-1">Direct Settlement</span>
                                    <div className="text-3xl font-black text-white font-mono tracking-tighter">
                                        ${Math.round(finalPriceUSD)}
                                    </div>
                                </div>

                                <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-blue-500/5 rounded-full blur-3xl group-hover/card:bg-blue-500/10 transition-all duration-700" />
                            </motion.button>
                        </div>

                        <div className="p-8 bg-blue-600/10 rounded-3xl border border-blue-500/20 text-xs text-slate-400 flex items-center gap-5 backdrop-blur-sm max-w-3xl mx-auto shadow-2xl">
                            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shrink-0">
                                <Info size={24} className="text-blue-400" />
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="font-black text-blue-400 uppercase tracking-widest text-[9px]">Important Information</span>
                                <p className="font-bold leading-relaxed text-slate-500">
                                    {selectedGateway === "Sharkpay"
                                        ? "SharkPay utilizes instant local bank infrastructure. Ensure you use the exact VPA/Account provided on the next page."
                                        : selectedGateway === "Cregis"
                                            ? "Cryptocurrency transfers require network confirmation. Your account will be provisioned once 3 confirmations are received."
                                            : "Global card processing is secured by AES-256 encryption. We do not store your full card details on our servers."}
                                </p>
                            </div>
                        </div>
                    </motion.div>

                </div>

                {/* Footer Bar */}
                <div className="p-8 md:p-12 bg-[#03040c]/80 backdrop-blur-3xl border-t border-white/[0.03] flex flex-col md:flex-row items-center justify-between gap-8 sticky bottom-0 z-20">
                    <div className="flex items-center gap-10">
                        <div className="flex flex-col">
                            <p className="text-[10px] text-slate-500 uppercase tracking-[0.3em] mb-2 font-black">Secure Checkout</p>
                            <div className="flex items-baseline gap-3">
                                <span className="text-xs font-bold text-slate-600 font-mono">USD</span>
                                <p className="text-5xl font-black text-white tracking-tighter drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                                    ${Math.round(finalPriceUSD)}
                                </p>
                            </div>
                        </div>
                        
                        <div className="hidden lg:flex items-center gap-6 border-l border-white/10 pl-10">
                            <div className="flex flex-col">
                                <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mb-1">Verify</span>
                                <div className="flex items-center gap-2 text-emerald-500/80">
                                    <ShieldCheck size={16} />
                                    <span className="text-[10px] font-bold uppercase tracking-wider">SSL Encrypted</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-5 w-full md:w-auto">
                        {currentStep > 1 && (
                            <button
                                onClick={handleBack}
                                disabled={loading}
                                className="px-10 py-5 font-black text-[11px] text-slate-500 hover:text-white uppercase tracking-widest hover:bg-white/5 rounded-[1.5rem] transition-all duration-300"
                            >
                                Previous
                            </button>
                        )}
                        <button
                            onClick={handleContinue}
                            disabled={loading || validatingCoupon || (currentStep === 1 && !finalPriceUSD) || (currentStep === 2 && (!formData.email || !formData.terms))}
                            className="flex-1 md:flex-none relative group overflow-hidden bg-blue-600 hover:bg-blue-500 text-white font-black py-5 px-16 rounded-[1.5rem] shadow-[0_0_30px_rgba(37,99,235,0.25)] active:scale-[0.97] transition-all flex items-center justify-center gap-3 disabled:opacity-30 disabled:active:scale-100 disabled:cursor-not-allowed min-w-[240px]"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                            <span className="uppercase tracking-[0.15em] text-sm">
                                {loading ? <Loader2 className="animate-spin" /> : (
                                    validatingCoupon ? "Validating..." : (
                                        currentStep === 3
                                            ? (selectedGateway.toLowerCase() === 'cregis' ? "Complete with Crypto" : `Confirm with ${selectedGateway}`)
                                            : "Continue"
                                    )
                                )}
                            </span>
                            {!loading && !validatingCoupon && <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" /> }
                        </button>
                    </div>
                </div>

            </main>

            {/* Payment Modal */}
            {showPaymentModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={() => setShowPaymentModal(false)}>
                    <div className="relative w-full h-full md:w-[600px] md:h-[800px] md:rounded-2xl overflow-hidden bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <button
                            onClick={() => setShowPaymentModal(false)}
                            className="absolute top-4 right-4 z-10 bg-white shadow rounded-full p-2"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <iframe src={paymentUrl} className="w-full h-full border-0" title="Checkout" />
                    </div>
                </div>
            )}
        </div>
    );
}

export default function CheckoutPage() {
    return (
        <div className="flex h-screen overflow-hidden bg-[#050617] relative font-sans">
            <PublicSidebar />
            <Suspense fallback={<div className="flex-1 flex items-center justify-center bg-[#050617]"><Loader2 className="animate-spin text-blue-500" /></div>}>
                <CheckoutContent />
            </Suspense>
        </div>
    );
}
