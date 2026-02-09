'use client';

import React, { useEffect } from "react"

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';
import { PortfolioOverview } from './portfolio-overview';
import { PortfolioHeatmap } from './portfolio-heatmap';
import { PnLChart } from './pnl-chart';
import { PositionsTable } from './positions-table';
import { PortfolioMetrics } from './portfolio-metrics';
import { OpenPositions } from './open-positions';
import { FundFlowTable } from './fund-flow-table';
import { AssetFlowCard } from './asset-flow-card';
import { MonthlyCalendar } from './monthly-calendar';
import { PortfolioProvider } from '@/context/portfolio-context';
import type { EnrichedPosition } from '@/lib/sodex-api';
import { getUserIdByAddress, fetchAllPositions, enrichPositions } from '@/lib/sodex-api';
import { RankingCard } from './ranking-card';

// Loading Skeleton Component
function TrackerLoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="space-y-2">
        <div className="h-8 bg-secondary/50 rounded w-32"></div>
        <div className="h-4 bg-secondary/50 rounded w-48"></div>
      </div>

      {/* Overview Stats Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-6 bg-card border border-border">
            <div className="h-4 bg-secondary/50 rounded w-20 mb-4"></div>
            <div className="h-8 bg-secondary/50 rounded w-32"></div>
          </Card>
        ))}
      </div>

      {/* Charts Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="p-6 bg-card border border-border h-80">
            <div className="h-full bg-secondary/50 rounded animate-pulse"></div>
          </Card>
        </div>
        <Card className="p-6 bg-card border border-border h-80">
          <div className="h-full bg-secondary/50 rounded animate-pulse"></div>
        </Card>
      </div>

      {/* Heatmap Skeleton */}
      <Card className="p-6 bg-card border border-border h-64">
        <div className="h-full bg-secondary/50 rounded animate-pulse"></div>
      </Card>
    </div>
  );
}

function TrackerContent({ initialSearchAddress }: { initialSearchAddress?: string }) {
  const [searchInput, setSearchInput] = useState(initialSearchAddress || '');
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [positions, setPositions] = useState<EnrichedPosition[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (addressToSearch?: string) => {
    const valueToSearch = (addressToSearch || searchInput || '').trim();
    if (!valueToSearch) return;

    setIsLoading(true);
    setError(null);

    try {
      console.log('[v0] Searching for wallet:', valueToSearch);

      // Step 1: Get userId from address (works with both addresses and userIds)
      const foundUserId = await getUserIdByAddress(valueToSearch);
      console.log('[v0] Found userId:', foundUserId);

      // Step 2: Fetch positions
      const fetchedPositions = await fetchAllPositions(foundUserId);
      console.log('[v0] Fetched positions for tracker:', fetchedPositions.length);

      // Step 3: Enrich positions with symbol data
      const enrichedPositions = await enrichPositions(fetchedPositions);
      console.log('[v0] Enriched positions:', enrichedPositions.length);

      setWalletAddress(valueToSearch);
      setUserId(foundUserId);
      setPositions(enrichedPositions);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch wallet data';
      console.error('[v0] Error searching wallet:', errorMessage);
      setError(errorMessage);
      setWalletAddress(null);
      setUserId(null);
      setPositions([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-search when initialSearchAddress is provided
  useEffect(() => {
    if (initialSearchAddress && initialSearchAddress.trim()) {
      console.log('[v0] Initializing tracker with address:', initialSearchAddress);
      setSearchInput(initialSearchAddress);
      handleSearch(initialSearchAddress);
    }
  }, [initialSearchAddress]);

  const handleClear = () => {
    setSearchInput('');
    setWalletAddress(null);
    setUserId(null);
    setPositions([]);
    setError(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Render search UI when no wallet is selected
  if (!walletAddress) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Card className="p-8 bg-card border border-border max-w-md w-full">
          <h2 className="text-2xl font-bold text-foreground mb-3">Wallet Tracker</h2>
          <p className="text-muted-foreground mb-6 text-sm">Enter a wallet address to track trading positions and performance</p>
          
          <div className="space-y-3">
            <div className="relative">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter wallet address"
                className="w-full px-4 py-2 bg-secondary border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}
            
            <Button
              onClick={() => handleSearch(searchInput)}
              disabled={isLoading || !searchInput.trim()}
              className="w-full gap-2"
            >
              <Search className="w-4 h-4" />
              {isLoading ? 'Searching...' : 'Search Wallet'}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Render portfolio data when wallet is found
  if (isLoading) {
    return (
      <div className="p-4 md:p-6">
        <TrackerLoadingSkeleton />
      </div>
    );
  }

  return (
    <PortfolioProvider initialUserId={userId} initialPositions={positions}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground">Wallet Tracker</h1>
            <p className="text-xs md:text-sm text-muted-foreground">Tracking: {walletAddress}</p>
          </div>
          <Button
            variant="outline"
            onClick={handleClear}
            className="gap-2 text-muted-foreground hover:text-foreground bg-transparent"
          >
            <X className="w-4 h-4" />
            Clear
          </Button>
        </div>

        {/* Overview Stats */}
        <PortfolioOverview />

        {/* Main Charts Row */}
        <div className="grid grid-cols-1 gap-6">
          {/* PnL Chart */}
          <div>
            <PnLChart />
          </div>
        </div>

        {/* Positions Table */}
        <PositionsTable />

        {/* Fund Flow Table and Asset Flow Card */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <FundFlowTable walletAddress={walletAddress} />
          <AssetFlowCard walletAddress={walletAddress} />
        </div>

        {/* Advanced Metrics */}
        <PortfolioMetrics />

        {/* Calendar and Ranking Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <MonthlyCalendar />
          </div>
          <RankingCard walletAddress={walletAddress} />
        </div>

        {/* Open Positions */}
        <OpenPositions />

        {/* Trading Activity Heatmap */}
        <PortfolioHeatmap />
      </div>
    </PortfolioProvider>
  );
}

export function TrackerSection({ initialSearchAddress }: { initialSearchAddress?: string }) {
  return (
    <TrackerContent initialSearchAddress={initialSearchAddress} />
  );
}
