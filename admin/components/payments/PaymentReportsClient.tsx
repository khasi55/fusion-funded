"use client";

import { useEffect, useState, useCallback } from "react";
import { format } from "date-fns";
import { 
    Search, 
    Download,
    Copy, 
    Check, 
    Eye,
    Upload,
    RefreshCw,
    Image,
    ExternalLink
} from "lucide-react";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";

interface PaymentOrder {
    id: string;
    order_id: string;
    payment_id?: string;
    amount: number;
    currency: string;
    status: string;
    payment_method: string;
    payment_gateway: string;
    account_size: number;
    account_type: string;
    coupon_code: string;
    created_at: string;
    paid_at: string;
    user_name: string;
    user_email: string;
    metadata?: any;
    proof_image?: string;
}

export function PaymentReportsClient() {
    const [payments, setPayments] = useState<PaymentOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState("all");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchQuery, setSearchQuery] = useState("");
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [uploadingId, setUploadingId] = useState<string | null>(null);

    const fetchPayments = useCallback(async () => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams({
                page: page.toString(),
                limit: "50",
                status: statusFilter,
                search: searchQuery
            });
            const res = await fetch(`/api/admin/payments?${queryParams}`);
            if (res.ok) {
                const { data, meta } = await res.json();
                setPayments(data || []);
                setTotalPages(meta?.totalPages || 1);
            }
        } catch (error) {
            console.error("Failed to fetch payments", error);
        } finally {
            setLoading(false);
        }
    }, [page, statusFilter, searchQuery]);

    useEffect(() => {
        fetchPayments();
    }, [fetchPayments]);

    const handleCopy = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        toast.success("Copied to clipboard");
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleApprove = async (orderId: string) => {
        if (!confirm(`Are you sure you want to approve order ${orderId}?`)) return;
        try {
            const res = await fetch(`/api/admin/orders/${orderId}/approve`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            if (res.ok) {
                toast.success("Order approved successfully!");
                fetchPayments();
            } else {
                const data = await res.json();
                toast.error(data.error || "Failed to approve order");
            }
        } catch (error) {
            toast.error("Failed to connect to server");
        }
    };

    const handleUploadProof = async (orderId: string, file: File) => {
        try {
            setUploadingId(orderId);
            const formData = new FormData();
            formData.append('file', file);
            formData.append('bucket', 'proofs');
            formData.append('path', `${orderId}-${Date.now()}.${file.name.split('.').pop()}`);

            const uploadRes = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });

            if (!uploadRes.ok) throw new Error('Upload failed');
            const { url } = await uploadRes.json();

            const syncRes = await fetch(`/api/payments/update-manual-utr`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId, utr: 'ADMIN_UPLOAD_' + Date.now(), proofUrl: url })
            });

            if (syncRes.ok) {
                toast.success("Proof uploaded!");
                fetchPayments();
            } else {
                toast.error("Failed to sync proof");
            }
        } catch (error) {
            toast.error("Upload failed");
        } finally {
            setUploadingId(null);
        }
    };

    const handleExport = () => {
        const headers = ["Date", "Order ID", "User Name", "User Email", "Gateway", "Method", "Amount", "Account Size", "Account Type", "Coupon", "Currency", "Status"];
        const csvContent = [
            headers.join(","),
            ...payments.map(p => [
                format(new Date(p.created_at), 'yyyy-MM-dd HH:mm:ss'),
                p.order_id,
                `"${p.user_name}"`,
                p.user_email,
                p.payment_gateway,
                p.payment_method,
                p.amount,
                p.account_size,
                p.account_type,
                p.coupon_code,
                p.currency,
                p.status
            ].join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.setAttribute("download", `payment_report_${format(new Date(), 'yyyy-MM-dd')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-6 p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-200">
                <div className="inline-flex bg-gray-100 p-1 rounded-lg">
                    {['all', 'paid', 'pending', 'expired', 'failed'].map((s) => (
                        <button
                            key={s}
                            onClick={() => { setStatusFilter(s); setPage(1); }}
                            className={`px-4 py-2 rounded-md text-sm font-medium capitalize ${statusFilter === s ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                        >
                            {s}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-gray-50 border border-gray-200 pl-10 pr-4 py-2 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 w-64"
                        />
                    </div>
                    <button onClick={fetchPayments} className="p-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-100">
                        <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                    </button>
                    <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm hover:bg-gray-800">
                        <Download size={16} /> Export
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="px-6 py-4 text-sm font-semibold text-gray-600">ORDER ID</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-600">USER</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-600">GATEWAY</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-600">ACCOUNT</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-600">COUPON</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-right">AMOUNT</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-center">STATUS</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-center">PROOF</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading && payments.length === 0 ? (
                                <tr><td colSpan={8} className="px-6 py-10 text-center text-gray-400">Loading payments...</td></tr>
                            ) : payments.length === 0 ? (
                                <tr><td colSpan={8} className="px-6 py-10 text-center text-gray-400">No payments found</td></tr>
                            ) : (
                                payments.map((p) => (
                                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-bold text-gray-900">{p.order_id}</span>
                                                    <button onClick={() => handleCopy(p.order_id, p.id)} className="text-gray-300 hover:text-blue-500">
                                                        <Copy size={12} />
                                                    </button>
                                                </div>
                                                <span className="text-[10px] text-gray-400 uppercase font-medium">{format(new Date(p.created_at), 'MMM dd, HH:mm')}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500">
                                                    {p.user_name.substring(0, 2).toUpperCase()}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium text-gray-900">{p.user_name}</span>
                                                    <span className="text-[11px] text-gray-400">{p.user_email}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium text-gray-900 capitalize">{p.payment_gateway}</span>
                                                <span className="text-[10px] text-gray-400 uppercase">{p.payment_method || 'DIGITAL'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium text-gray-900 tracking-tight">${(p.account_size / 1000).toLocaleString()}k</span>
                                                <span className="text-[10px] text-gray-400 uppercase">{p.account_type || 'HFT2'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {p.coupon_code && p.coupon_code !== '-' ? (
                                                <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-[11px] font-medium border border-gray-200">{p.coupon_code}</span>
                                            ) : (
                                                <span className="text-gray-300">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex flex-col items-end">
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-[10px] text-gray-400 font-bold">{p.currency}</span>
                                                    <span className="text-sm font-bold text-gray-900">${p.amount.toLocaleString()}</span>
                                                </div>
                                                <span className="text-[10px] text-gray-400 font-medium">≈ ₹{(p.amount * 98).toLocaleString()}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex flex-col items-center gap-2">
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                                                    p.status === 'paid' ? 'bg-green-50 text-green-700 border-green-200' :
                                                    p.status === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                                    'bg-gray-50 text-gray-400 border-gray-200'
                                                }`}>
                                                    {p.status}
                                                </span>
                                                {p.status === 'pending' && (
                                                    <button onClick={() => handleApprove(p.order_id)} className="text-[10px] font-bold text-blue-600 hover:underline">Approve</button>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                {p.proof_image ? (
                                                    <button onClick={() => setSelectedImage(p.proof_image || null)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors">
                                                        <Eye size={18} />
                                                    </button>
                                                ) : (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] text-gray-300 font-medium uppercase tracking-tighter">No Proof</span>
                                                        <label className="cursor-pointer text-gray-400 hover:text-blue-500">
                                                            <Upload size={14} />
                                                            <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                                                                const file = e.target.files?.[0];
                                                                if (file) handleUploadProof(p.order_id, file);
                                                            }} disabled={uploadingId === p.order_id} />
                                                        </label>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="p-4 border-t border-gray-100 flex items-center justify-between">
                    <p className="text-xs text-gray-400">Page {page} of {totalPages}</p>
                    <div className="flex gap-2">
                        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-2 border border-gray-200 rounded-lg text-xs font-semibold hover:bg-gray-50 disabled:opacity-50">Back</button>
                        <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-4 py-2 bg-gray-900 border border-gray-900 rounded-lg text-xs font-semibold text-white hover:bg-gray-800 disabled:opacity-50">Next</button>
                    </div>
                </div>
            </div>

            {/* Premium Image Lightbox */}
            {selectedImage && (
                <div 
                    className="fixed inset-0 z-[9999] flex flex-col bg-black/80 backdrop-blur-2xl p-4 md:p-10 h-[100dvh] w-screen left-0 top-0 overflow-hidden"
                    onClick={() => { setSelectedImage(null); }}
                >
                    {/* Top Action Bar */}
                    <div className="absolute top-0 right-0 left-0 p-4 md:p-8 flex items-center justify-between z-[10001] pointer-events-none">
                        <div className="flex items-center gap-4 pointer-events-auto">
                            <div className="flex flex-col">
                                <span className="text-white text-sm font-black tracking-[0.2em] uppercase">Proof Verification</span>
                                <span className="text-white/40 text-[9px] font-bold uppercase tracking-wider">Confidential Material</span>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-3 pointer-events-auto">
                            {/* All buttons removed per user request */}
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div 
                        className="relative w-full flex-1 flex flex-col items-center justify-center gap-6 animate-in fade-in duration-500 overflow-hidden"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Image Wrap */}
                        <div className="relative w-full h-full flex items-center justify-center p-4 md:p-12 overflow-hidden">
                            <img 
                                src={selectedImage} 
                                alt="Payment Proof" 
                                className="max-w-full max-h-full object-contain rounded-xl shadow-2xl transition-all select-none"
                            />
                        </div>

                        {/* Bottom Info Bar - Responsive visibility */}
                        <div className="flex items-center gap-6 px-8 py-3 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-2xl opacity-100">
                            <a 
                                href={selectedImage} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-white/70 hover:text-white text-[9px] font-black uppercase tracking-[0.3em] flex items-center gap-3 transition-colors group"
                                onClick={e => e.stopPropagation()}
                            >
                                <ExternalLink size={12} className="group-hover:animate-pulse" /> View Full Resolution
                            </a>
                        </div>
                    </div>
                </div>
            ) /* End of Lightbox */}
        </div>
    );
}
