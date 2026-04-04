"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Search, Check, X, Upload } from "lucide-react";
import { toast } from "react-hot-toast";
import { createClient } from "@/utils/supabase/client";
import Image from "next/image";

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
    user_name: string;
    user_email: string;
    metadata?: any;
}

export function OrdersListClient() {
    const [orders, setOrders] = useState<PaymentOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    
    // Upload State tracking
    const [uploadingOrderId, setUploadingOrderId] = useState<string | null>(null);
    const [pendingProofs, setPendingProofs] = useState<Record<string, string>>({});
    
    // Action State tracking
    const [actioningOrderId, setActioningOrderId] = useState<string | null>(null);

    const supabase = createClient();

    const fetchOrders = async () => {
        setLoading(true);
        try {
            // Fetch all pending orders
            const res = await fetch(`/api/admin/payments?status=pending&limit=100`);
            if (res.ok) {
                const { data } = await res.json();
                
                // Filter down to manual orders likely waiting for approval
                const manualOrders = (data || []).filter((o: PaymentOrder) => 
                    o.payment_gateway === 'manual' ||
                    o.payment_gateway === 'upi_manual' ||
                    o.payment_gateway === 'crypto_manual' || 
                    o.payment_method === 'manual_crypto' ||
                    o.payment_method === 'upi' ||
                    o.payment_method === 'crypto' ||
                    o.payment_gateway === 'upi' ||
                    o.payment_gateway === 'crypto'
                );
                
                setOrders(manualOrders);
            }
        } catch (error) {
            console.error("Failed to fetch manual orders", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const filteredOrders = orders.filter(order =>
        order.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.user_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.order_id?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleFileUpload = async (orderId: string, file: File) => {
        if (!file) return;
        
        setUploadingOrderId(orderId);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `manual_proof_${orderId}_${Date.now()}.${fileExt}`;

            const { data, error } = await supabase.storage
                .from('proofs')
                .upload(fileName, file, { upsert: true });

            if (error) throw error;

            const { data: { publicUrl } } = supabase.storage
                .from('proofs')
                .getPublicUrl(fileName);

            setPendingProofs(prev => ({ ...prev, [orderId]: publicUrl }));
            toast.success("Proof uploaded successfully to bucket. Ready for approval.");
        } catch (err: any) {
            console.error("Upload error:", err);
            toast.error(err.message || "Failed to upload proof");
        } finally {
            setUploadingOrderId(null);
        }
    };

    const handleApprove = async (orderId: string) => {
        if (!confirm(`Are you sure you want to approve order ${orderId}? This will issue an MT5 account to the user.`)) return;

        setActioningOrderId(orderId);
        try {
            const proofUrl = pendingProofs[orderId] || null;
            
            const res = await fetch(`/api/admin/orders/${orderId}/approve`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    transactionId: `MANUAL-${Date.now()}`,
                    note: "Manually approved from Orders dashboard",
                    proofUrl: proofUrl
                })
            });

            if (res.ok) {
                toast.success("Order approved and MT5 account created!");
                // Clear state and refresh
                setPendingProofs(prev => {
                    const next = { ...prev };
                    delete next[orderId];
                    return next;
                });
                fetchOrders();
            } else {
                const data = await res.json();
                toast.error(data.error || "Failed to approve order");
            }
        } catch (error) {
            console.error("Approval error:", error);
            toast.error("Failed to connect to server");
        } finally {
            setActioningOrderId(null);
        }
    };

    const handleDeny = async (orderId: string) => {
        const reason = prompt("Enter denial reason (will be logged):");
        if (reason === null) return; // Cancelled

        setActioningOrderId(orderId);
        try {
            const res = await fetch(`/api/admin/orders/${orderId}/deny`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason: reason || "Manually denied by admin" })
            });

            if (res.ok) {
                toast.success("Order denied successfully");
                fetchOrders();
            } else {
                const data = await res.json();
                toast.error(data.error || "Failed to deny order");
            }
        } catch (error) {
            console.error("Deny error:", error);
            toast.error("Failed to connect to server");
        } finally {
            setActioningOrderId(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-96">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search by name, email, or order ID..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full rounded-lg bg-gray-50 border border-gray-200 pl-10 pr-4 py-2 text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                        />
                    </div>
                </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
                <div className="overflow-x-auto min-h-[400px]">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-200 bg-gray-50/80">
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Order Details</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Trader</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Payment</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Challenge</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-center">Payment Proof</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-20 text-center text-gray-500">
                                        <div className="flex justify-center mb-2"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
                                        Loading manual orders...
                                    </td>
                                </tr>
                            ) : filteredOrders.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-20 text-center text-gray-500">
                                        No pending manual orders require approval at this time.
                                    </td>
                                </tr>
                            ) : (
                                filteredOrders.map((order) => (
                                    <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                                        {/* Order Details */}
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-gray-900">{order.order_id}</span>
                                                <span className="text-xs text-gray-500">{format(new Date(order.created_at), 'MMM d, yyyy HH:mm')}</span>
                                            </div>
                                        </td>
                                        
                                        {/* Trader */}
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-col">
                                                <span className="text-sm text-gray-900 font-semibold">{order.user_name || 'Unknown'}</span>
                                                <span className="text-xs text-gray-500">{order.user_email}</span>
                                            </div>
                                        </td>
                                        
                                        {/* Payment */}
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-gray-900">
                                                    {order.currency === 'INR' ? '₹' : '$'}{order.amount.toLocaleString()}
                                                </span>
                                                <span className="text-xs text-indigo-600 font-medium uppercase mt-0.5 px-2 py-0.5 bg-indigo-50 rounded-full w-max">
                                                    {(order.payment_method || order.payment_gateway || 'Manual').replace('_manual', '').replace('manual_', '')}
                                                </span>
                                            </div>
                                        </td>

                                        {/* Challenge */}
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-col">
                                                <span className="text-sm text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full w-max">
                                                    ${(order.account_size)?.toLocaleString() || '0'}
                                                </span>
                                                <span className="text-[10px] tracking-wider text-gray-500 uppercase font-bold mt-1">
                                                    {order.account_type || 'Challenge'}
                                                </span>
                                            </div>
                                        </td>

                                        {/* Proof Upload */}
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex flex-col items-center gap-2">
                                                {pendingProofs[order.order_id] ? (
                                                    <div className="relative w-16 h-16 rounded-md overflow-hidden border border-gray-200">
                                                        <Image src={pendingProofs[order.order_id]} alt="Proof" fill className="object-cover" />
                                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                                            <button 
                                                                onClick={() => {
                                                                    setPendingProofs(prev => { delete prev[order.order_id]; return {...prev}; });
                                                                }}
                                                                className="text-white bg-red-600 rounded-full p-1"
                                                            >
                                                                <X className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="relative">
                                                        <input 
                                                            type="file" 
                                                            accept="image/*"
                                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                                                            disabled={uploadingOrderId === order.order_id || actioningOrderId === order.order_id}
                                                            onChange={(e) => {
                                                                if (e.target.files && e.target.files[0]) {
                                                                    handleFileUpload(order.order_id, e.target.files[0]);
                                                                }
                                                            }}
                                                        />
                                                        <div className={`px-4 py-2 border-2 border-dashed rounded-lg text-xs font-medium flex items-center gap-2 transition-colors ${
                                                            uploadingOrderId === order.order_id 
                                                                ? 'border-blue-300 text-blue-500 bg-blue-50'
                                                                : 'border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-700 hover:bg-gray-50'
                                                        }`}>
                                                            {uploadingOrderId === order.order_id ? (
                                                                <>
                                                                    <div className="animate-spin h-3 w-3 border-2 border-blue-500 border-t-transparent rounded-full" />
                                                                    Uploading...
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Upload className="w-3.5 h-3.5" />
                                                                    Attach Proof
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </td>

                                        {/* Actions */}
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleDeny(order.order_id)}
                                                    disabled={actioningOrderId === order.order_id}
                                                    className="px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                                                >
                                                    Deny
                                                </button>
                                                <button
                                                    onClick={() => handleApprove(order.order_id)}
                                                    disabled={actioningOrderId === order.order_id}
                                                    className="px-4 py-2 text-white bg-green-600 hover:bg-green-700 rounded-lg text-sm font-semibold shadow-sm transition-colors disabled:opacity-50 flex items-center gap-2"
                                                >
                                                    {actioningOrderId === order.order_id ? (
                                                        <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin inline-block"></span>
                                                    ) : (
                                                        <Check className="w-4 h-4" />
                                                    )}
                                                    Approve
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
