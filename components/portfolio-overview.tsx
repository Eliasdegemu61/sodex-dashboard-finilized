'use client';

import React, { useMemo, useState, useEffect } from "react"
import { fetchAccountDetails } from '@/lib/account-api'; // Import fetchAccountDetails

import { Card } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign, Activity, Target, AlertCircle, BarChart3, Zap } from 'lucide-react';
import { usePortfolio } from '@/context/portfolio-context';
import { calculateTotalBalance, fetchPnLOverview, getVolumeFromPnLOverview, fetchDetailedBalance } from '@/lib/sodex-api';
import { fetchSpotTradesData } from '@/lib/spot-api';

interface PortfolioStat {
  label: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  breakdown?: {
    futures: number;
    spot: number;
  };
}

export function PortfolioOverview() {
  const { positions, userId } = usePortfolio();
  const [totalBalance, setTotalBalance] = useState<number>(0);
  const [spotBalance, setSpotBalance] = useState<number>(0);
  const [futuresBalance, setFuturesBalance] = useState<number>(0);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [futuresVolume, setFuturesVolume] = useState<number>(0);
  const [spotVolume, setSpotVolume] = useState<number>(0);
  const [futuresFees, setFuturesFees] = useState<number>(0);
  const [spotFees, setSpotFees] = useState<number>(0);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [isLoadingVolume, setIsLoadingVolume] = useState(false);

  // Fetch combined balance using new detailed balance function
  useEffect(() => {
    if (!userId) return;

    const fetchBalance = async () => {
      setIsLoadingBalance(true);
      try {
        const balanceData = await fetchDetailedBalance(userId);
        setSpotBalance(balanceData.spotBalance);
        setFuturesBalance(balanceData.futuresBalance);
        setWalletBalance(balanceData.futuresBalance);
        setTotalBalance(balanceData.totalUsdValue);
      } catch (err) {
        console.error('[v0] Error fetching balance:', err);
      } finally {
        setIsLoadingBalance(false);
      }
    };

    fetchBalance();
    
    // Refresh balance every 20 seconds
    const interval = setInterval(fetchBalance, 20000);
    return () => clearInterval(interval);
  }, [userId]);

  // Fetch volume and fees data (both futures and spot)
  useEffect(() => {
    if (!userId || !positions || positions.length === 0) return;

    const fetchVolumeAndFees = async () => {
      setIsLoadingVolume(true);
      try {
        // Fetch both futures and spot data in parallel
        const [pnlData, spotData] = await Promise.all([
          fetchPnLOverview(userId),
          fetchSpotTradesData(userId),
        ]);

        const futuresVol = getVolumeFromPnLOverview(pnlData);
        // Calculate futures fees from positions data
        const calcFuturesFees = positions.reduce((sum, p) => sum + (parseFloat(p.cum_trading_fee || '0') || 0), 0);
        
        setFuturesVolume(futuresVol);
        setSpotVolume(spotData.totalVolume);
        setFuturesFees(calcFuturesFees);
        setSpotFees(spotData.totalFees);

        console.log('[v0] Volume and fees updated:', {
          futuresVolume: futuresVol,
          spotVolume: spotData.totalVolume,
          futuresFees: calcFuturesFees,
          spotFees: spotData.totalFees,
          totalVolume: futuresVol + spotData.totalVolume,
          totalFees: calcFuturesFees + spotData.totalFees,
        });
      } catch (err) {
        console.error('[v0] Error fetching volume and fees:', err);
      } finally {
        setIsLoadingVolume(false);
      }
    };

    fetchVolumeAndFees();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchVolumeAndFees, 30000);
    return () => clearInterval(interval);
  }, [userId, positions]);

  const stats = useMemo(() => {
    // Calculate total volume and fees
    const totalVolume = futuresVolume + spotVolume;
    const totalFees = futuresFees + spotFees;

    // Declare combinedBalance variable
    const combinedBalance = totalBalance;

    if (!positions || positions.length === 0) {
      return [
        {
          label: 'Total Wallet Balance',
          value: `$${totalBalance.toFixed(2)}`, 
          change: 0, 
          icon: <DollarSign className="w-5 h-5" />,
          breakdown: {
            futures: walletBalance,
            spot: spotBalance,
          },
        },
        { 
          label: 'Realized PnL', 
          value: '$0', 
          change: 0, 
          icon: <TrendingUp className="w-5 h-5" />,
          breakdown: null,
        },
        { 
          label: 'Volume', 
          value: `$${totalVolume.toFixed(2)}`, 
          change: 0, 
          icon: <BarChart3 className="w-5 h-5" />,
          breakdown: {
            futures: 0,
            spot: 0,
          },
        },
        { 
          label: 'Total Fees Paid', 
          value: `$${totalFees.toFixed(2)}`, 
          change: 0, 
          icon: <Zap className="w-5 h-5" />,
          breakdown: {
            futures: 0,
            spot: 0,
          },
        },
      ];
    }

    // Calculate Win Rate
    const winningTrades = positions.filter(p => p.realizedPnlValue > 0).length;
    const totalTrades = positions.length;
    const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;

    // Calculate Total PnL from positions
    const totalPnL = positions.reduce((sum, p) => sum + p.realizedPnlValue, 0);

    return [
      {
        label: 'Total Wallet Balance',
        value: `$${totalBalance.toLocaleString('en-US', { maximumFractionDigits: 2 })}`,
        change: undefined,
        icon: <DollarSign className="w-5 h-5" />,
        breakdown: {
          futures: walletBalance,
          spot: spotBalance,
        },
      },
      {
        label: 'Realized PnL',
        value: `$${totalPnL.toLocaleString('en-US', { maximumFractionDigits: 2 })}`,
        change: undefined,
        icon: <TrendingUp className="w-5 h-5" />,
        breakdown: null,
      },
      {
        label: 'Volume',
        value: `$${totalVolume.toLocaleString('en-US', { maximumFractionDigits: 2 })}`,
        change: undefined,
        icon: <BarChart3 className="w-5 h-5" />,
        breakdown: {
          futures: futuresVolume,
          spot: spotVolume,
        },
      },
      {
        label: 'Total Fees Paid',
        value: `$${totalFees.toLocaleString('en-US', { maximumFractionDigits: 2 })}`,
        change: undefined,
        icon: <Zap className="w-5 h-5" />,
        breakdown: {
          futures: futuresFees,
          spot: spotFees,
        },
      },
    ];
  }, [positions, totalBalance, futuresVolume, spotVolume, futuresFees, spotFees, walletBalance, spotBalance]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, idx) => (
        <Card key={idx} className="p-3 md:p-4 bg-card border border-border hover:border-accent/50 transition-colors">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-xs md:text-xs font-medium text-muted-foreground mb-1 md:mb-2">{stat.label}</p>
              {(isLoadingBalance && stat.label === 'Total Wallet Balance') || (isLoadingVolume && (stat.label === 'Volume' || stat.label === 'Total Fees Paid')) ? (
                <div className="space-y-2">
                  <div className="h-8 bg-secondary/50 rounded w-24 animate-pulse"></div>
                  <div className="h-3 bg-secondary/40 rounded w-16 animate-pulse"></div>
                </div>
              ) : (
                <>
                  <p className="text-lg md:text-2xl font-bold text-foreground">{stat.value}</p>
                  {stat.breakdown && (
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-muted-foreground">
                        Futures: ${stat.breakdown.futures.toLocaleString('en-US', { maximumFractionDigits: 1, minimumFractionDigits: 1 })} | Spot: ${stat.breakdown.spot.toLocaleString('en-US', { maximumFractionDigits: 1, minimumFractionDigits: 1 })}
                      </span>
                    </div>
                  )}
                  {stat.change !== undefined && (
                    <div className="flex items-center gap-1 mt-1 md:mt-2">
                      {stat.change >= 0 ? (
                        <TrendingUp className="w-3 md:w-4 h-3 md:h-4 text-emerald-400" />
                      ) : (
                        <TrendingDown className="w-3 md:w-4 h-3 md:h-4 text-red-400" />
                      )}
                      <span className={`text-xs font-semibold ${stat.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {stat.change >= 0 ? '+' : ''}{stat.change.toFixed(1)}%
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="text-accent/60 flex-shrink-0 w-4 md:w-5 h-4 md:h-5">{stat.icon}</div>
          </div>
        </Card>
      ))}
    </div>
  );
}
