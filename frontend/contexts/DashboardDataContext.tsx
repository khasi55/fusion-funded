"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { useAccount } from './AccountContext';
import { useSocket } from './SocketContext';
import { fetchFromBackend } from '@/lib/backend-api';
import { useChallengeSubscription } from '@/hooks/useChallengeSocket';

interface DashboardData {
    objectives: any | null;
    stats: any | null;
    trades: any[] | null;
    risk: any | null;
    consistency: any | null;
    calendar: any | null;
    analysis: any | null;
}

interface DashboardDataContextType {
    data: DashboardData;
    loading: {
        objectives: boolean;
        trades: boolean;
        risk: boolean;
        consistency: boolean;
        calendar: boolean;
        global: boolean;
    };
    error: string | null;
    refreshData: (isSilent?: boolean) => Promise<void>;
}

const DashboardDataContext = createContext<DashboardDataContextType | undefined>(undefined);

export function DashboardDataProvider({ children }: { children: ReactNode }) {
    const { selectedAccount } = useAccount();

    // Subscribe to real-time updates for the selected challenge (Centralized here)
    useChallengeSubscription(selectedAccount?.id);

    const [data, setData] = useState<DashboardData>({
        objectives: null,
        stats: null,
        trades: null,
        risk: null,
        consistency: null,
        calendar: null,
        analysis: null,
    });

    const [loading, setLoading] = useState({
        objectives: false,
        trades: false,
        risk: false,
        consistency: false,
        calendar: false,
        global: false,
    });

    const [error, setError] = useState<string | null>(null);

    const fetchAllData = useCallback(async (isSilent = false) => {
        if (!selectedAccount) return;

        if (!isSilent) setLoading(prev => ({ ...prev, global: true }));
        setError(null);

        const challengeId = selectedAccount.id;

        try {
            let bulkData: any;

            if (challengeId === 'mock-demo-id') {
                // Return static mock data for demo account
                bulkData = {
                    objectives: {
                        challenge: { initial_balance: 100000, max_drawdown: 10, max_daily_drawdown: 5, target_profit: 5 },
                        daily_loss: { current: 0, allowed: 5000, remaining: 5000, start_of_day_equity: 104500.50, max_allowed: 95000 },
                        total_loss: { current: 0, allowed: 10000, remaining: 10000, max_allowed: 90000 },
                        profit_target: { current: 4500.5, target: 5000 },
                        stats: { start_date: new Date(Date.now() - 5 * 86400000).toISOString(), days_traded: 4, win_rate: 68, profit_factor: 1.8 }
                    },
                    risk: {
                        average_win: 450,
                        average_loss: 250,
                        expectancy: 120,
                        avg_risk_per_trade: 0.5,
                        win_rate: 68
                    },
                    consistency: {
                        score: 92,
                        volume_consistency: 88,
                        profit_consistency: 95,
                        days: [
                            { date: new Date(Date.now() - 4 * 86400000).toISOString(), pnl: 1200 },
                            { date: new Date(Date.now() - 3 * 86400000).toISOString(), pnl: 800 },
                            { date: new Date(Date.now() - 2 * 86400000).toISOString(), pnl: -350 },
                            { date: new Date(Date.now() - 1 * 86400000).toISOString(), pnl: 2850.50 }
                        ]
                    },
                    calendar: {
                        daily_pnl: {
                            [new Date(Date.now() - 4 * 86400000).toISOString().split('T')[0]]: 1200,
                            [new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0]]: 800,
                            [new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0]]: -350,
                            [new Date(Date.now() - 1 * 86400000).toISOString().split('T')[0]]: 2850.50
                        }
                    },
                    trades: {
                        trades: [
                            { open_time: new Date(Date.now() - 5 * 86400000).toISOString(), close_time: new Date(Date.now() - 5 * 86400000 + 3600000).toISOString(), symbol: 'BTCUSD', type: 'Buy', volume: 0.5, open_price: 65000, close_price: 65500, profit_loss: 250, is_open: false, platform: 'MT5', _date: new Date(Date.now() - 5 * 86400000).toISOString() },
                            { open_time: new Date(Date.now() - 4 * 86400000).toISOString(), close_time: new Date(Date.now() - 4 * 86400000 + 3600000).toISOString(), symbol: 'XAUUSD', type: 'Buy', volume: 2, open_price: 2020.5, close_price: 2026.5, profit_loss: 1200, is_open: false, platform: 'MT5', _date: new Date(Date.now() - 4 * 86400000).toISOString() },
                            { open_time: new Date(Date.now() - 3 * 86400000).toISOString(), close_time: new Date(Date.now() - 3 * 86400000 + 7200000).toISOString(), symbol: 'EURUSD', type: 'Sell', volume: 5, open_price: 1.0850, close_price: 1.0834, profit_loss: 800, is_open: false, platform: 'MT5', _date: new Date(Date.now() - 3 * 86400000).toISOString() },
                            { open_time: new Date(Date.now() - 2 * 86400000).toISOString(), close_time: new Date(Date.now() - 2 * 86400000 + 1800000).toISOString(), symbol: 'US30', type: 'Buy', volume: 1, open_price: 38500, close_price: 38465, profit_loss: -350, is_open: false, platform: 'MT5', _date: new Date(Date.now() - 2 * 86400000).toISOString() },
                            { open_time: new Date(Date.now() - 1 * 86400000).toISOString(), close_time: new Date(Date.now() - 1 * 86400000 + 5400000).toISOString(), symbol: 'GBPUSD', type: 'Buy', volume: 4, open_price: 1.2600, close_price: 1.2671, profit_loss: 2840.50, commission: -10, is_open: false, swap: 20, platform: 'MT5', _date: new Date(Date.now() - 1 * 86400000).toISOString() }
                        ]
                    },
                    analysis: {
                        best_trade: 2850.50,
                        worst_trade: -350,
                        best_day: 2850.50,
                        worst_day: -350
                    }
                };
            } else {
                // Consolidated bulk fetch
                bulkData = await fetchFromBackend(`/api/dashboard/bulk?challenge_id=${challengeId}`, {
                    credentials: 'include'
                });
            }

            console.log(`[DashboardData] ${isSilent ? 'Silent' : 'Full'} refresh received`);

            setData({
                objectives: bulkData.objectives || null,
                stats: bulkData.objectives?.stats || null,
                risk: bulkData.risk || null,
                consistency: bulkData.consistency || null,
                calendar: bulkData.calendar || null,
                trades: bulkData.trades?.trades || bulkData.trades || null,
                analysis: bulkData.analysis || null,
            });
        } catch (err: any) {
            console.error('[DashboardData] Fetch error:', err);
            setError(err.message || 'Failed to load dashboard data');
        } finally {
            if (!isSilent) setLoading(prev => ({ ...prev, global: false }));
        }
    }, [selectedAccount]);

    // --- Real-time WebSocket event handlers ---
    const { socket } = useSocket();
    const refreshInFlightRef = useRef(false);

    useEffect(() => {
        if (!socket || !selectedAccount?.id) return;

        const handleBalanceUpdate = (update: any) => {
            console.log('📊 [DashboardData] balance_update received:', update);
            setData((prev) => {
                // IGNORE Zero Equity Glitch from bridge (Aggressive Check)
                // We ignore any update with 0 equity to prevent UI from showing "Failed" before Risk Engine syncs.
                // Real blowouts will be handled by 'status' updates or Risk Engine passing valid low equity.
                if (Number(update.equity) === 0) {
                    console.warn('⚠️ [DashboardData] Ignoring 0 equity update (glitch protection)');
                    return prev;
                }

                if (!prev.objectives || !prev.objectives.challenge) {
                    // Trigger refresh if update arrives before primary data
                    if (!refreshInFlightRef.current) {
                        refreshInFlightRef.current = true;
                        fetchAllData().finally(() => { refreshInFlightRef.current = false; });
                    }
                    return prev;
                }

                // Recalculate objectives with new equity
                const currentEquity = update.equity;
                const floatingPl = update.floating_pl ?? 0;

                const startOfDayEquity = prev.objectives.daily_loss?.start_of_day_equity || 0;
                const initialBalance = Number(prev.objectives.challenge.initial_balance) || 0;
                const maxDailyLoss = prev.objectives.daily_loss?.max_allowed || 0;
                const maxTotalLoss = prev.objectives.total_loss?.max_allowed || 0;

                const dailyNet = currentEquity - startOfDayEquity;
                const dailyLoss = dailyNet >= 0 ? 0 : Math.abs(dailyNet);
                const dailyBreachLevel = startOfDayEquity - maxDailyLoss;
                const dailyRemaining = Math.max(0, currentEquity - dailyBreachLevel);

                const totalNet = currentEquity - initialBalance;
                const totalLoss = totalNet >= 0 ? 0 : Math.abs(totalNet);
                const totalBreachLevel = initialBalance - maxTotalLoss;
                const totalRemaining = Math.max(0, currentEquity - totalBreachLevel);

                return {
                    ...prev,
                    objectives: {
                        ...prev.objectives,
                        daily_loss: {
                            ...prev.objectives.daily_loss,
                            current: dailyLoss,
                            remaining: dailyRemaining,
                        },
                        total_loss: {
                            ...prev.objectives.total_loss,
                            current: totalLoss,
                            remaining: totalRemaining,
                        },
                        stats: {
                            ...prev.objectives.stats,
                            equity: currentEquity,
                            floating_pl: floatingPl,
                        },
                    },
                    stats: {
                        ...prev.stats,
                        equity: currentEquity,
                        floating_pl: floatingPl,
                    },
                };
            });
        };

        const handleTradeUpdate = (update: any) => {
            console.log('📊 [DashboardData] trade_update received:', update);
            fetchAllData();
        };

        socket.on('balance_update', handleBalanceUpdate);
        socket.on('trade_update', handleTradeUpdate);

        return () => {
            socket.off('balance_update', handleBalanceUpdate);
            socket.off('trade_update', handleTradeUpdate);
        };
    }, [socket, selectedAccount?.id, fetchAllData]);

    // --- Periodic Polling Fallback ---
    useEffect(() => {
        if (!selectedAccount?.id) return;

        const pollInterval = setInterval(() => {
            console.log('[DashboardData] Periodic polling refresh (silent)...');
            fetchAllData(true); // Silent: No loading spinners
        }, 120000); // Poll every 120s as fallback (Reduced from 30s)

        return () => clearInterval(pollInterval);
    }, [selectedAccount?.id, fetchAllData]);

    // --- Initial Fetch Trigger ---
    // Only fetch when account truly changes or is first loaded
    // Relying on this instead of mount-time effect to avoid double calls
    useEffect(() => {
        if (selectedAccount?.id) {
            console.log('[DashboardData] selectedAccount trigger. ID:', selectedAccount.id);
            fetchAllData();
        }
    }, [selectedAccount?.id, fetchAllData]);

    return (
        <DashboardDataContext.Provider value={{ data, loading, error, refreshData: fetchAllData }}>
            {children}
        </DashboardDataContext.Provider>
    );
}

export function useDashboardData() {
    const context = useContext(DashboardDataContext);
    if (context === undefined) {
        return {
            data: {
                objectives: null,
                stats: null,
                trades: null,
                risk: null,
                consistency: null,
                calendar: null,
                analysis: null,
            },
            loading: {
                objectives: false,
                trades: false,
                risk: false,
                consistency: false,
                calendar: false,
                global: false,
            },
            error: null,
            refreshData: async () => { },
        } as DashboardDataContextType;
    }
    return context;
}
