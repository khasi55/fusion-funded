"use server";

import { OrdersListClient } from "@/components/orders/OrdersListClient";

export default async function ManualOrdersPage() {
    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Manual Orders</h1>
                    <p className="text-sm text-gray-500 mt-1">Review, append proofs to, and approve manual Crypto orders.</p>
                </div>
            </div>

            <OrdersListClient />
        </div>
    );
}
