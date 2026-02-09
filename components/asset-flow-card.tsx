'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { usePortfolio } from '@/context/portfolio-context';
import { fetchDetailedBalance, fetchSpotBalance, fetchMarkPrices, calculateTotalBalance, fetchAccountDetails } from '@/lib/sodex-api';

interface AssetData {
  coin: string;
  balance: string; // Human-readable token amount as string
  usdValue: number;
  percentage: number;
  isFuture?: boolean;
  color?: string;
}

interface AssetFlowCardProps {
  walletAddress: string;
}

const ASSET_COLORS = [
  '#FF9500', // Orange - BTC
  '#3B82F6', // Blue - ETH
  '#EC4899', // Pink - SOL
  '#10B981', // Green
  '#8B5CF6', // Purple
  '#EF4444', // Red
  '#F59E0B', // Amber
  '#06B6D4', // Cyan
];

// Token decimal mapping
const TOKEN_DECIMALS: Record<string, number> = {
  BTC: 8,
  ETH: 18,
  SOL: 9,
  USDC: 6,
  USDT: 6,
  WBTC: 8,
  WETH: 18,
  WSOL: 9,
  ARB: 18,
  OP: 18,
  LINK: 18,
  UNI: 18,
  AAVE: 18,
  USDT: 6,
  DAI: 18,
  WMATIC: 18,
  MATIC: 18,
  AVAX: 18,
  FTM: 18,
  CRV: 18,
  CVX: 18,
  SOSO: 18,
  WSOSO: 18,
  MAG7: 18,
  'MAG7.ssi': 18,
};

export function AssetFlowCard({ walletAddress }: AssetFlowCardProps) {
  const { userId } = usePortfolio();
  const [assets, setAssets] = useState<AssetData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalBalance, setTotalBalance] = useState<number>(0);

  // Display name formatter - removes initial 'v' or 'w' from token symbol
  const getDisplayName = (coin: string): string => {
    if (coin.startsWith('v') || coin.startsWith('w')) {
      return coin.slice(1);
    }
    return coin;
  };

  // Get decimals for a token
  const getTokenDecimals = (coin: string): number => {
    const displayName = getDisplayName(coin);
    return TOKEN_DECIMALS[displayName] || 18; // Default to 18 if not found
  };

  // Format token balance with proper decimals
  const formatTokenBalance = (balance: string, coin: string): string => {
    try {
      const num = parseFloat(balance);
      return num.toFixed(4);
    } catch {
      return '0';
    }
  };

  useEffect(() => {
    if (!userId) return;
    fetchAssets();
  }, [userId]);

  const fetchAssets = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Use the new detailed balance function which returns tokens with USD values
      const balanceData = await fetchDetailedBalance(userId!);
      const accountData = await fetchAccountDetails(userId!);

      // Convert detailed balance tokens to AssetData format
      const assetList: AssetData[] = balanceData.tokens.map((token, idx) => ({
        coin: token.token,
        balance: token.balance.toString(),
        usdValue: token.usdValue,
        percentage: 0,
        isFuture: false,
        color: ASSET_COLORS[idx % ASSET_COLORS.length],
      }));

      // Add futures USDC if balance > 0
      if (balanceData.futuresBalance > 0) {
        const existingUsdcIndex = assetList.findIndex(
          (asset) => asset.coin.toUpperCase() === 'USDC'
        );

        if (existingUsdcIndex >= 0) {
          // Combine with existing USDC
          const existingTokenAmount = parseFloat(assetList[existingUsdcIndex].balance);
          assetList[existingUsdcIndex].balance = (existingTokenAmount + balanceData.futuresBalance).toString();
          assetList[existingUsdcIndex].usdValue += balanceData.futuresBalance;
        } else {
          // Add new USDC entry from futures
          assetList.push({
            coin: 'USDC',
            balance: balanceData.futuresBalance.toString(),
            usdValue: balanceData.futuresBalance,
            percentage: 0,
            isFuture: true,
            color: ASSET_COLORS[assetList.length % ASSET_COLORS.length],
          });
        }
      }

      // Sort by USD value and calculate percentages
      assetList.sort((a, b) => b.usdValue - a.usdValue);
      const total = assetList.reduce((sum, asset) => sum + asset.usdValue, 0);
      const assetsWithPercentage = assetList.map((asset) => ({
        ...asset,
        percentage: total > 0 ? (asset.usdValue / total) * 100 : 0,
      }));

      setAssets(assetsWithPercentage);
      setTotalBalance(balanceData.totalUsdValue);

      console.log('[v0] Assets loaded:', assetsWithPercentage);
    } catch (err) {
      console.error('[v0] Error fetching assets:', err);
      setError(err instanceof Error ? err.message : 'Failed to load assets');
      setAssets([]);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="p-4 md:p-6 bg-card border border-border">
        <h3 className="text-base md:text-lg font-bold text-foreground mb-4">Asset Allocation</h3>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-4 md:p-6 bg-card border border-border">
        <h3 className="text-base md:text-lg font-bold text-foreground mb-4">Asset Allocation</h3>
        <div className="flex flex-col items-center justify-center py-8 gap-4">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      </Card>
    );
  }

  if (assets.length === 0) {
    return (
      <Card className="p-4 md:p-6 bg-card border border-border">
        <h3 className="text-base md:text-lg font-bold text-foreground mb-4">Asset Allocation</h3>
        <p className="text-muted-foreground text-xs md:text-sm">No assets available</p>
      </Card>
    );
  }

  return (
    <Card className="p-4 md:p-6 bg-card border border-border">
      <div className="space-y-6">
        {/* Header with Total Balance */}
        <div className="space-y-1">
          <h3 className="text-xs md:text-sm text-muted-foreground font-medium">Total Wallet Balance</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl md:text-3xl font-bold text-foreground">
              ${totalBalance.toLocaleString('en-US', { maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Asset Allocation Section */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-foreground">Asset Allocation</h4>
          
          {/* Stacked Bar Chart */}
          <div className="flex gap-1 h-2 rounded-full overflow-hidden bg-secondary/20">
            {assets.map((asset, idx) => (
              <div
                key={idx}
                className="rounded-full transition-all"
                style={{
                  width: `${asset.percentage}%`,
                  backgroundColor: asset.color,
                }}
              />
            ))}
          </div>

          {/* Asset Rows */}
          <div className="space-y-3">
            {assets.map((asset, idx) => {
              return (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary/10 hover:bg-secondary/20 transition-colors border-l-4"
                  style={{ borderLeftColor: asset.color }}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm md:text-base text-foreground">
                        {getDisplayName(asset.coin)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatTokenBalance(asset.balance, asset.coin)} {getDisplayName(asset.coin)}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-sm md:text-base font-bold text-foreground">
                      ${asset.usdValue.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Card>
  );
}
