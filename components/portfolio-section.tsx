'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { PortfolioOverview } from './portfolio-overview';
import { PortfolioHeatmap } from './portfolio-heatmap';
import { PnLChart } from './pnl-chart';
import { PositionsTable } from './positions-table';
import { WalletBindForm } from './wallet-bind-form';
import { PortfolioMetrics } from './portfolio-metrics';
import { FundFlowTable } from './fund-flow-table';
import { AssetFlowCard } from './asset-flow-card';
import { MonthlyCalendar } from './monthly-calendar';
import { usePortfolio } from '@/context/portfolio-context';
import { RankingCard } from './ranking-card';

export function PortfolioSection() {
  const { walletAddress, isLoading, error, clearWalletAddress } = usePortfolio();
  const [showUnbindConfirm, setShowUnbindConfirm] = useState(false);

  const handleUnbind = () => {
    clearWalletAddress();
    setShowUnbindConfirm(false);
  };

  if (!walletAddress) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center pt-6">
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground">Portfolio</h1>
        </div>
        <WalletBindForm />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Card className="p-8 text-center bg-card border border-red-500/30 max-w-md">
          <h2 className="text-2xl font-bold text-red-400 mb-3">Error Loading Portfolio</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <button
            onClick={() => setShowUnbindConfirm(true)}
            className="text-primary hover:underline text-sm"
          >
            Try again
          </button>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 md:gap-4">
          <div className="space-y-2">
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground">Portfolio</h1>
            <p className="text-xs md:text-sm text-muted-foreground break-all">Account: {walletAddress}</p>
          </div>
          <Button
            variant="outline"
            onClick={() => setShowUnbindConfirm(true)}
            className="text-red-500 hover:bg-red-500/10 border-red-500/30 text-xs md:text-sm px-2 md:px-4 py-1 md:py-2 whitespace-nowrap"
          >
            Unbind Account
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
          {walletAddress && <FundFlowTable walletAddress={walletAddress} />}
          {walletAddress && <AssetFlowCard walletAddress={walletAddress} />}
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

        {/* Trading Activity Heatmap */}
        <PortfolioHeatmap />
      </div>

      <AlertDialog open={showUnbindConfirm} onOpenChange={setShowUnbindConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unbind Your Account?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove your wallet address and all associated data from this device. You can bind a different account later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3">
            <AlertDialogCancel>Keep Bound</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUnbind}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Unbind Account
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
