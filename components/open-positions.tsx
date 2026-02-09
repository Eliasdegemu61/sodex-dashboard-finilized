'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowUpRight, ArrowDownLeft, ChevronLeft, ChevronRight, AlertCircle, ChevronDown } from 'lucide-react';
import { usePortfolio } from '@/context/portfolio-context';
import { useMemo, useState, useEffect } from 'react';
import { fetchOpenPositions, fetchAccountDetails, type OpenPositionData, type BalanceData } from '@/lib/sodex-api';
import { cacheManager } from '@/lib/cache';

export function OpenPositions() {
  const { userId } = usePortfolio();
  const [openPositions, setOpenPositions] = useState<OpenPositionData[]>([]);
  const [balanceData, setBalanceData] = useState<BalanceData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [lastUpdateTime, setLastUpdateTime] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [countdownSeconds, setCountdownSeconds] = useState(20);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const loadOpenPositions = async (skipCache = false) => {
    if (!userId) return;

    try {
      // Clear cache for this user if we want fresh data (for auto-refresh)
      if (skipCache) {
        cacheManager.delete(`accountDetails_${userId}`);
        console.log('[v0] Cleared cache for open positions refresh');
      }

      console.log('[v0] Fetching account details for userId:', userId);
      const accountData = await fetchAccountDetails(userId);
      setOpenPositions(accountData.positions);
      setBalanceData(accountData.balances[0] || null);
      setLastUpdateTime(new Date().toLocaleTimeString());
      setError(null);
      setCountdownSeconds(20); // Reset countdown after refresh
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch open positions';
      console.error('[v0] Error fetching open positions:', errorMessage);
      setError(errorMessage);
    }
  };

  // Initial fetch when component mounts or userId changes - ALWAYS FRESH DATA
  useEffect(() => {
    if (!userId) return;

    setIsLoading(true);
    // Clear cache before initial fetch to get fresh data on page load
    cacheManager.delete(`accountDetails_${userId}`);
    console.log('[v0] Cleared cache for fresh data on page load');
    loadOpenPositions().then(() => setIsLoading(false));
  }, [userId]);

  // Auto-refresh every 20 seconds with cache bypass
  useEffect(() => {
    if (!userId) return;

    const refreshInterval = setInterval(() => {
      setIsRefreshing(true);
      loadOpenPositions(true).then(() => setIsRefreshing(false)); // true = skip cache
    }, 20000); // 20 seconds

    return () => clearInterval(refreshInterval);
  }, [userId]);

  // Countdown timer
  useEffect(() => {
    const countdownInterval = setInterval(() => {
      setCountdownSeconds((prev) => {
        if (prev <= 1) {
          return 20;
        }
        return prev - 1;
      });
    }, 1000); // Update every second

    return () => clearInterval(countdownInterval);
  }, []);

  const displayPositions = useMemo(() => {
    return openPositions.map((position, idx) => ({
      id: String(idx),
      symbol: position.symbol,
      side: position.positionSide,
      size: parseFloat(position.positionSize),
      entry: parseFloat(position.entryPrice),
      liquidation: parseFloat(position.liquidationPrice),
      margin: parseFloat(position.isolatedMargin),
      leverage: position.leverage,
      unrealized: parseFloat(position.unrealizedProfit),
      realized: parseFloat(position.realizedProfit),
      fee: parseFloat(position.cumTradingFee),
      createdAt: new Date(position.createdTime).toLocaleString(),
    }));
  }, [openPositions]);

  // Pagination logic
  const totalPages = Math.ceil(displayPositions.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedPositions = displayPositions.slice(startIndex, endIndex);

  const handleRowsPerPageChange = (newRows: number) => {
    setRowsPerPage(newRows);
    setCurrentPage(1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  if (!userId) {
    return (
      <Card className="p-12 bg-card border border-border text-center">
        <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
        <h3 className="text-lg font-bold text-foreground mb-2">No Account Bound</h3>
        <p className="text-muted-foreground">Bind your account to view open positions</p>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="p-12 bg-card border border-border text-center">
        <div className="space-y-3">
          <div className="h-2 bg-muted-foreground/20 rounded-full animate-pulse"></div>
          <div className="h-2 bg-muted-foreground/20 rounded-full animate-pulse"></div>
          <p className="text-sm text-muted-foreground mt-4">Loading open positions...</p>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-8 bg-card border border-red-500/30">
        <div className="flex items-start gap-4">
          <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-red-400 mb-1">Error Loading Open Positions</h3>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        </div>
      </Card>
    );
  }

  if (openPositions.length === 0) {
    return (
      <Card className="p-12 bg-card border border-border text-center">
        <h3 className="text-lg font-bold text-foreground mb-2">No Open Positions</h3>
        <p className="text-muted-foreground">You don't have any active positions</p>
      </Card>
    );
  }

  return (
    <Card className="p-3 md:p-6 bg-card border border-border">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-3 md:mb-4 gap-2">
        <div className="flex items-center gap-2 md:gap-3">
          <h3 className="text-base md:text-lg font-bold text-foreground">Open Positions</h3>
          <div className="flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1 md:py-1.5 rounded-full bg-primary/10 border border-primary/30">
            <div className="w-1.5 md:w-2 h-1.5 md:h-2 bg-primary rounded-full animate-pulse"></div>
            <span className="text-xs text-primary font-semibold">
              REFRESHING IN {countdownSeconds}SEC
            </span>
          </div>
        </div>
        {lastUpdateTime && (
          <span className="text-xs text-muted-foreground">Last updated: {lastUpdateTime}</span>
        )}
      </div>

      {/* Balance Info */}
      {balanceData && (
        <div className="grid grid-cols-3 gap-2 md:gap-4 mb-4 md:mb-6">
          <div className="p-2 md:p-4 rounded-lg bg-secondary/30 border border-border/50">
            <p className="text-xs text-muted-foreground font-medium mb-1">Wallet Balance (perps)</p>
            <p className="text-base md:text-2xl font-bold text-foreground">${parseFloat(balanceData.walletBalance).toFixed(2)}</p>
          </div>
          <div className="p-2 md:p-4 rounded-lg bg-secondary/30 border border-border/50">
            <p className="text-xs text-muted-foreground font-medium mb-1">Available Balance (perps)</p>
            <p className="text-base md:text-2xl font-bold text-emerald-400">${parseFloat(balanceData.availableBalance).toFixed(2)}</p>
          </div>
          <div className="p-2 md:p-4 rounded-lg bg-secondary/30 border border-border/50">
            <p className="text-xs text-muted-foreground font-medium mb-1">Margin Frozen (perps)</p>
            <p className="text-base md:text-2xl font-bold text-orange-400">${parseFloat(balanceData.openOrderMarginFrozen).toFixed(2)}</p>
          </div>
        </div>
      )}

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-xs md:text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 md:py-3 px-2 text-muted-foreground font-medium">Symbol</th>
              <th className="text-left py-2 md:py-3 px-2 text-muted-foreground font-medium">Side</th>
              <th className="text-right py-2 md:py-3 px-2 text-muted-foreground font-medium">Size</th>
              <th className="text-right py-2 md:py-3 px-2 text-muted-foreground font-medium">Entry</th>
              <th className="text-right py-2 md:py-3 px-2 text-muted-foreground font-medium">Liquidation</th>
              <th className="text-right py-2 md:py-3 px-2 text-muted-foreground font-medium">Leverage</th>
              <th className="text-right py-2 md:py-3 px-2 text-muted-foreground font-medium">Margin</th>
              <th className="text-right py-2 md:py-3 px-2 text-muted-foreground font-medium">Unrealized PnL</th>
              <th className="text-right py-2 md:py-3 px-2 text-muted-foreground font-medium">Fee</th>
              <th className="text-left py-2 md:py-3 px-2 text-muted-foreground font-medium">Opened</th>
            </tr>
          </thead>
          <tbody>
            {paginatedPositions.map((position) => (
              <tr key={position.id} className="border-b border-border hover:bg-secondary/30 transition-colors">
                <td className="py-3 px-2 font-semibold text-foreground text-xs md:text-sm">{position.symbol}</td>
                <td className="py-3 px-2">
                  <Badge
                    variant={position.side === 'LONG' ? 'default' : 'secondary'}
                    className={
                      position.side === 'LONG'
                        ? 'bg-emerald-900/50 text-emerald-300 text-xs'
                        : 'bg-red-900/50 text-red-300 text-xs'
                    }
                  >
                    {position.side}
                  </Badge>
                </td>
                <td className="py-3 px-2 text-right text-foreground font-medium text-xs">
                  {position.size.toFixed(4)}
                </td>
                <td className="py-3 px-2 text-right text-muted-foreground text-xs">${position.entry.toFixed(6)}</td>
                <td className="py-3 px-2 text-right text-muted-foreground text-xs">${position.liquidation.toFixed(6)}</td>
                <td className="py-3 px-2 text-right text-foreground font-medium text-xs">{position.leverage}x</td>
                <td className="py-3 px-2 text-right text-muted-foreground text-xs">${position.margin.toFixed(6)}</td>
                <td
                  className={`py-3 px-2 text-right font-bold text-xs flex items-center justify-end gap-1 ${
                    position.unrealized >= 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {position.unrealized >= 0 ? (
                    <ArrowUpRight className="w-3 h-3 md:w-4 md:h-4" />
                  ) : (
                    <ArrowDownLeft className="w-3 h-3 md:w-4 md:h-4" />
                  )}
                  {position.unrealized >= 0 ? '+' : ''}${position.unrealized.toFixed(4)}
                </td>
                <td className="py-3 px-2 text-right text-muted-foreground text-xs">${position.fee.toFixed(6)}</td>
                <td className="py-3 px-2 text-left text-muted-foreground text-xs">{position.createdAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Expandable List */}
      <div className="md:hidden space-y-2">
        {paginatedPositions.map((position) => (
          <div key={position.id} className="border border-border rounded-lg overflow-hidden">
            {/* Expandable Row Summary */}
            <button
              onClick={() => toggleExpand(position.id)}
              className="w-full p-3 flex items-center justify-between bg-card/50 hover:bg-secondary/30 transition-colors text-left"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-foreground text-sm">{position.symbol}</span>
                  <Badge
                    variant={position.side === 'LONG' ? 'default' : 'secondary'}
                    className={`text-xs ${
                      position.side === 'LONG'
                        ? 'bg-emerald-900/50 text-emerald-300'
                        : 'bg-red-900/50 text-red-300'
                    }`}
                  >
                    {position.side}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>Size: {position.size.toFixed(4)}</span>
                  <span className={position.unrealized >= 0 ? 'text-emerald-400 font-semibold' : 'text-red-400 font-semibold'}>
                    {position.unrealized >= 0 ? '+' : ''} ${position.unrealized.toFixed(4)}
                  </span>
                </div>
              </div>
              <ChevronDown
                className={`w-5 h-5 text-muted-foreground transition-transform flex-shrink-0 ${expandedRows.has(position.id) ? 'rotate-180' : ''}`}
              />
            </button>

            {/* Expandable Details */}
            {expandedRows.has(position.id) && (
              <div className="p-3 border-t border-border bg-card/30 space-y-2 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-muted-foreground text-xs">Entry Price</span>
                    <p className="font-semibold text-foreground text-sm">${position.entry.toFixed(6)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">Liquidation</span>
                    <p className="font-semibold text-foreground text-sm">${position.liquidation.toFixed(6)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">Leverage</span>
                    <p className="font-semibold text-foreground text-sm">{position.leverage}x</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">Margin</span>
                    <p className="font-semibold text-foreground text-sm">${position.margin.toFixed(6)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">Fee</span>
                    <p className="font-semibold text-foreground text-sm">${position.fee.toFixed(6)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">Opened</span>
                    <p className="font-semibold text-foreground text-xs">{position.createdAt}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Pagination Controls */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mt-4 md:mt-6 pt-4 md:pt-6 border-t border-border gap-4">
        <div className="flex items-center gap-2 md:gap-3">
          <span className="text-xs md:text-sm text-muted-foreground font-medium">Rows:</span>
          <div className="flex gap-1 p-1 bg-secondary/30 rounded-lg border border-border/50">
            {[5, 10, 20, 50].map((value) => (
              <button
                key={value}
                onClick={() => handleRowsPerPageChange(value)}
                className={`px-2 md:px-3 py-1 md:py-1.5 text-xs md:text-sm font-medium rounded-md transition-all ${
                  rowsPerPage === value
                    ? 'bg-primary text-primary-foreground shadow-lg'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                }`}
              >
                {value}
              </button>
            ))}
          </div>
        </div>

        <div className="text-xs md:text-sm text-muted-foreground order-3 md:order-2 w-full md:w-auto text-center md:text-left">
          {startIndex + 1}-{Math.min(endIndex, displayPositions.length)} of {displayPositions.length}
        </div>

        <div className="flex items-center gap-1 md:gap-2 order-2 md:order-3">
          <Button
            onClick={handlePrevPage}
            disabled={currentPage === 1}
            variant="outline"
            size="sm"
            className="gap-1 bg-transparent px-2 md:px-3 h-8 md:h-9 text-xs md:text-sm"
          >
            <ChevronLeft className="w-3 h-3 md:w-4 md:h-4" />
            <span className="hidden md:inline">Prev</span>
          </Button>

          <div className="flex items-center gap-1 px-2">
            <span className="text-xs text-muted-foreground">
              {currentPage}/{totalPages}
            </span>
          </div>

          <Button
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            variant="outline"
            size="sm"
            className="gap-1 bg-transparent px-2 md:px-3 h-8 md:h-9 text-xs md:text-sm"
          >
            <span className="hidden md:inline">Next</span>
            <ChevronRight className="w-3 h-3 md:w-4 md:h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
