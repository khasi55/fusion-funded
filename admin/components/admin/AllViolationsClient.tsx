"use client";

import { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function AllViolationsClient({ enrichedAccounts }: { enrichedAccounts: any[] }) {
    const searchParams = useSearchParams();
    const searchTerm = searchParams.get('search') || "";
    
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 20;

    const filteredAccounts = useMemo(() => {
        if (!searchTerm) return enrichedAccounts;
        const lowerSearch = searchTerm.toLowerCase();

        return enrichedAccounts.filter((account) => {
            const loginMatch = account.challenge?.login?.toString().toLowerCase().includes(lowerSearch);
            const nameMatch = account.profile?.full_name?.toLowerCase().includes(lowerSearch);
            const emailMatch = account.profile?.email?.toLowerCase().includes(lowerSearch);
            const ticketMatch = account.violations?.some((v: any) => v.trade_ticket?.toString().toLowerCase().includes(lowerSearch));

            return loginMatch || nameMatch || emailMatch || ticketMatch;
        });
    }, [enrichedAccounts, searchTerm]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    const paginatedAccounts = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredAccounts.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredAccounts, currentPage]);

    const totalPages = Math.ceil(filteredAccounts.length / ITEMS_PER_PAGE);

    return (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200 bg-gray-50">
                <h2 className="text-sm font-semibold text-gray-700 uppercase">
                    Accounts List {searchTerm && `(${filteredAccounts.length} found)`}
                </h2>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm min-w-[800px]">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-3 font-semibold text-gray-700 text-xs uppercase whitespace-nowrap">Account</th>
                            <th className="px-6 py-3 font-semibold text-gray-700 text-xs uppercase whitespace-nowrap">User</th>
                            <th className="px-6 py-3 font-semibold text-gray-700 text-xs uppercase whitespace-nowrap">Total Violations</th>
                            <th className="px-6 py-3 font-semibold text-gray-700 text-xs uppercase whitespace-nowrap">Violation Types</th>
                            <th className="px-6 py-3 font-semibold text-gray-700 text-xs uppercase whitespace-nowrap">Latest</th>
                            <th className="px-6 py-3 font-semibold text-gray-700 text-xs uppercase whitespace-nowrap">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {paginatedAccounts?.map((account: any) => (
                            <tr key={account.challengeId} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4">
                                    <Link
                                        href={`/mt5?account=${account.challenge?.login}`}
                                        className="font-mono text-indigo-600 font-medium hover:text-indigo-800 hover:underline"
                                    >
                                        {account.challenge?.login || 'N/A'}
                                    </Link>
                                    <div className="text-xs text-gray-500 capitalize mt-1">
                                        {account.challenge?.challenge_type}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="font-medium text-gray-900 truncate max-w-[150px] lg:max-w-xs">
                                        {account.profile?.full_name || 'Unknown'}
                                    </div>
                                    <div className="text-xs text-gray-500 font-mono mt-1 truncate max-w-[150px] lg:max-w-xs">
                                        {account.profile?.email}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-red-100 text-red-800">
                                        {account.totalViolations}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                                        {Object.entries(account.violationCounts).map(([type, count]: [string, any]) => (
                                            <span
                                                key={type}
                                                className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-700"
                                            >
                                                {type.replace('_', ' ')}: {count}
                                            </span>
                                        ))}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-gray-500 text-xs whitespace-nowrap">
                                    {new Date(account.latestViolation.created_at).toLocaleDateString()}
                                    <div className="text-[10px] opacity-70 mt-1">
                                        {new Date(account.latestViolation.created_at).toLocaleTimeString()}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <Link
                                        href={`/risk-violations/${account.challengeId}`}
                                        className="inline-flex items-center justify-center px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded hover:bg-indigo-700 transition-colors"
                                    >
                                        View Details →
                                    </Link>
                                </td>
                            </tr>
                        ))}
                        {paginatedAccounts?.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                    {enrichedAccounts.length === 0
                                        ? "No risk violations found."
                                        : "No accounts match your search."}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {totalPages > 1 && (
                <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200 bg-gray-50">
                    <div className="text-sm text-gray-500">
                        Showing <span className="font-medium text-gray-900">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to <span className="font-medium text-gray-900">{Math.min(currentPage * ITEMS_PER_PAGE, filteredAccounts.length)}</span> of <span className="font-medium text-gray-900">{filteredAccounts.length}</span> results
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="p-2 border border-gray-200 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-sm font-medium text-gray-600 min-w-[3rem] text-center">
                            {currentPage} / {totalPages}
                        </span>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="p-2 border border-gray-200 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
