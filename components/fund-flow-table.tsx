'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowDown, ArrowUp, Loader2, ExternalLink, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';

interface FundFlowData {
  account: string;
  amount: string;
  chain: string;
  coin: string;
  decimals: number;
  status: string;
  statusTime: number;
  type: 'CustodyDeposit' | 'CustodyWithdraw' | string;
  token: string;
  txHash: string;
  receiver?: string;
  sender?: string;
}

interface FundFlowTableProps {
  walletAddress: string;
}

export function FundFlowTable({ walletAddress }: FundFlowTableProps) {
  const [flows, setFlows] = useState<FundFlowData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'deposit' | 'withdraw'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [showingTxHash, setShowingTxHash] = useState<string | null>(null);

  useEffect(() => {
    if (!walletAddress) return;
    fetchFundFlow();
  }, [walletAddress]);

  const fetchFundFlow = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/wallet/fund-flow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account: walletAddress }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch fund flow data');
      }

      const data = await response.json();

      if (data.code === '0' && data.data?.accountFlows) {
        setFlows(data.data.accountFlows);
      } else {
        throw new Error(data.message || 'No fund flow data found');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load fund flow';
      setError(errorMessage);
      setFlows([]);
    } finally {
      setIsLoading(false);
    }
  };

  const isDeposit = (type: string) => type.includes('Deposit');
  const isWithdraw = (type: string) => type.includes('Withdraw');

  const displayFlows = useMemo(() => {
    return flows.filter(flow => {
      if (filterType === 'deposit') return isDeposit(flow.type);
      if (filterType === 'withdraw') return isWithdraw(flow.type);
      return true;
    });
  }, [flows, filterType]);

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

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

  // Pagination logic
  const totalPages = Math.ceil(displayFlows.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedFlows = displayFlows.slice(startIndex, endIndex);

  const formatAmount = (amount: string, decimals: number) => {
    const num = parseFloat(amount) / Math.pow(10, decimals);
    return num.toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 });
  };

  // Calculate netflow stats
  const netflowStats = useMemo(() => {
    const deposits = flows
      .filter(f => isDeposit(f.type))
      .reduce((sum, f) => sum + parseFloat(f.amount) / Math.pow(10, f.decimals), 0);
    
    const withdrawals = flows
      .filter(f => isWithdraw(f.type))
      .reduce((sum, f) => sum + parseFloat(f.amount) / Math.pow(10, f.decimals), 0);
    
    const netflow = deposits - withdrawals;
    
    return { deposits, withdrawals, netflow };
  }, [flows]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const copyToClipboard = (hash: string) => {
    navigator.clipboard.writeText(hash);
  };

  const getStatusColor = (status: string) => {
    if (status === 'Success') {
      return 'bg-emerald-900/50 text-emerald-300';
    }
    return 'bg-amber-900/50 text-amber-300';
  };

  const getExplorerUrl = (txHash: string, chain: string) => {
    const chainMap: { [key: string]: string } = {
      // EVM Chains
      'ARB': 'https://arbiscan.io/tx/',
      'ARBITRUM': 'https://arbiscan.io/tx/',
      'ETH': 'https://etherscan.io/tx/',
      'ETHEREUM': 'https://etherscan.io/tx/',
      'POLYGON': 'https://polygonscan.com/tx/',
      'POLY': 'https://polygonscan.com/tx/',
      'OPTIMISM': 'https://optimistic.etherscan.io/tx/',
      'OPT': 'https://optimistic.etherscan.io/tx/',
      'BASE': 'https://basescan.org/tx/',
      'AVAX': 'https://snowtrace.io/tx/',
      'AVAXC': 'https://snowtrace.io/tx/',
      'AVALANCHE': 'https://snowtrace.io/tx/',
      'BSC': 'https://bscscan.com/tx/',
      'BSCSCAN': 'https://bscscan.com/tx/',
      'BINANCE': 'https://bscscan.com/tx/',
      'HYPERLIQUID': 'https://explorer.hyperliquid.xyz/tx/',
      'HYPE': 'https://explorer.hyperliquid.xyz/tx/',
      // Non-EVM Chains
      'SOLANA': 'https://solscan.io/tx/',
      'SOL': 'https://solscan.io/tx/',
      'SUI': 'https://suiscan.xyz/tx/',
      'TON': 'https://tonscan.org/tx/',
      'XLM': 'https://stellar.expert/explorer/public/tx/',
      'STELLAR': 'https://stellar.expert/explorer/public/tx/',
      'LTC': 'https://blockchair.com/litecoin/transaction/',
      'LITECOIN': 'https://blockchair.com/litecoin/transaction/',
      'BTC': 'https://www.blockchain.com/btc/tx/',
      'BITCOIN': 'https://www.blockchain.com/btc/tx/',
      'XRP': 'https://xrpscan.com/tx/',
      'RIPPLE': 'https://xrpscan.com/tx/',
      'DOGE': 'https://blockchair.com/dogecoin/transaction/',
      'DOGECOIN': 'https://blockchair.com/dogecoin/transaction/',
    };

    // Extract the chain name, handling formats like "BASE_ETH", "ARB_ETH", etc.
    const chainParts = chain.split('_');
    const chainName = chainParts[0].toUpperCase();
    
    const baseUrl = chainMap[chainName] || chainMap['ARB'];
    return `${baseUrl}${txHash}`;
  };

  if (isLoading) {
    return (
      <Card className="p-3 md:p-6 bg-card border border-border">
        <h3 className="text-base md:text-lg font-bold text-foreground mb-4">Fund Flow</h3>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-3 md:p-6 bg-card border border-border">
        <h3 className="text-base md:text-lg font-bold text-foreground mb-4">Fund Flow</h3>
        <div className="flex flex-col items-center justify-center py-8 gap-4">
          <p className="text-sm text-red-400">{error}</p>
          <Button onClick={fetchFundFlow} variant="outline" size="sm" className="bg-transparent">
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  if (flows.length === 0) {
    return (
      <Card className="p-3 md:p-6 bg-card border border-border">
        <h3 className="text-base md:text-lg font-bold text-foreground mb-4">Fund Flow</h3>
        <p className="text-muted-foreground text-xs md:text-sm">No fund flow data available</p>
      </Card>
    );
  }

  return (
    <Card className="p-3 md:p-6 bg-card border border-border">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4 md:mb-6">
        <h3 className="text-base md:text-lg font-bold text-foreground">Fund Flow</h3>
        
        {/* Netflow Info */}
        <div className="grid grid-cols-3 gap-2 md:gap-4">
          <div className="bg-emerald-900/20 border border-emerald-900/30 rounded-lg p-2 md:p-3">
            <p className="text-xs text-muted-foreground mb-1">Deposits</p>
            <p className="text-sm md:text-base font-bold text-emerald-400">
              ${netflowStats.deposits.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </p>
          </div>
          <div className="bg-red-900/20 border border-red-900/30 rounded-lg p-2 md:p-3">
            <p className="text-xs text-muted-foreground mb-1">Withdrawals</p>
            <p className="text-sm md:text-base font-bold text-red-400">
              ${netflowStats.withdrawals.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </p>
          </div>
          <div className={`rounded-lg p-2 md:p-3 border ${netflowStats.netflow >= 0 ? 'bg-emerald-900/20 border-emerald-900/30' : 'bg-red-900/20 border-red-900/30'}`}>
            <p className="text-xs text-muted-foreground mb-1">Net Flow</p>
            <p className={`text-sm md:text-base font-bold ${netflowStats.netflow >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              ${(netflowStats.netflow >= 0 ? '+' : '')}{netflowStats.netflow.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </p>
          </div>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="flex gap-2 mb-4 md:mb-6">
        <Button
          onClick={() => {
            setFilterType('all');
            setCurrentPage(1);
          }}
          variant={filterType === 'all' ? 'default' : 'outline'}
          size="sm"
          className={filterType === 'all' ? 'bg-primary text-primary-foreground' : 'bg-transparent'}
        >
          All
        </Button>
        <Button
          onClick={() => {
            setFilterType('deposit');
            setCurrentPage(1);
          }}
          variant={filterType === 'deposit' ? 'default' : 'outline'}
          size="sm"
          className={filterType === 'deposit' ? 'bg-emerald-900/50 text-emerald-300' : 'bg-transparent'}
        >
          Deposits
        </Button>
        <Button
          onClick={() => {
            setFilterType('withdraw');
            setCurrentPage(1);
          }}
          variant={filterType === 'withdraw' ? 'default' : 'outline'}
          size="sm"
          className={filterType === 'withdraw' ? 'bg-red-900/50 text-red-300' : 'bg-transparent'}
        >
          Withdrawals
        </Button>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-2 text-muted-foreground font-medium">Type</th>
              <th className="text-left py-3 px-2 text-muted-foreground font-medium">Coin</th>
              <th className="text-right py-3 px-2 text-muted-foreground font-medium">Amount</th>
              <th className="text-left py-3 px-2 text-muted-foreground font-medium">Chain</th>
              <th className="text-left py-3 px-2 text-muted-foreground font-medium">Date</th>
            </tr>
          </thead>
          <tbody>
            {paginatedFlows.map((flow, idx) => (
              <tr key={`${startIndex}-${idx}`} className="border-b border-border hover:bg-secondary/30 transition-colors">
                <td className="py-3 px-2 flex items-center gap-2">
                  {isDeposit(flow.type) ? (
                    <ArrowDown className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <ArrowUp className="w-4 h-4 text-red-400" />
                  )}
                  <span className={`font-semibold text-sm ${isDeposit(flow.type) ? 'text-emerald-400' : 'text-red-400'}`}>
                    {isDeposit(flow.type) ? 'Deposit' : 'Withdraw'}
                  </span>
                </td>
                <td className="py-3 px-2 font-semibold text-foreground text-sm">{flow.coin}</td>
                <td className={`py-3 px-2 text-right font-bold text-sm ${isDeposit(flow.type) ? 'text-emerald-400' : 'text-red-400'}`}>
                  {isDeposit(flow.type) ? '+' : '-'} {formatAmount(flow.amount, flow.decimals)}
                </td>
                <td className="py-3 px-2 text-sm">
                  <Badge variant="outline" className="text-xs">
                    {flow.chain.replace('_', ' ')}
                  </Badge>
                </td>
                <td className="py-3 px-2 text-sm text-muted-foreground">{formatDate(flow.statusTime)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Expandable List */}
      <div className="md:hidden space-y-2">
        {paginatedFlows.map((flow, idx) => {
          const rowId = `${startIndex}-${idx}`;
          return (
            <div key={rowId} className="border border-border rounded-lg overflow-hidden">
              {/* Expandable Row Summary */}
              <button
                onClick={() => toggleExpand(rowId)}
                className="w-full p-3 flex items-center justify-between bg-card/50 hover:bg-secondary/30 transition-colors text-left"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {isDeposit(flow.type) ? (
                      <ArrowDown className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <ArrowUp className="w-4 h-4 text-red-400" />
                    )}
                    <span className={`font-semibold capitalize ${isDeposit(flow.type) ? 'text-emerald-400' : 'text-red-400'}`}>
                      {isDeposit(flow.type) ? 'Deposit' : 'Withdraw'}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {flow.coin} • {flow.chain.replace('_', ' ')}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right mr-2">
                    <div className={`font-semibold ${isDeposit(flow.type) ? 'text-emerald-400' : 'text-red-400'}`}>
                      {isDeposit(flow.type) ? '+' : '-'} {formatAmount(flow.amount, flow.decimals)}
                    </div>
                  </div>
                  <ChevronDown
                    className={`w-5 h-5 text-muted-foreground transition-transform ${expandedRows.has(rowId) ? 'rotate-180' : ''}`}
                  />
                </div>
              </button>

              {/* Expandable Details */}
              {expandedRows.has(rowId) && (
                <div className="p-3 border-t border-border bg-card/30 space-y-2 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-muted-foreground">Date</span>
                      <p className="font-semibold text-foreground">{formatDate(flow.statusTime)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Chain</span>
                      <p className="font-semibold text-foreground">{flow.chain.replace('_', ' ')}</p>
                    </div>
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Amount</span>
                      <p className={`font-semibold ${isDeposit(flow.type) ? 'text-emerald-400' : 'text-red-400'}`}>
                        {isDeposit(flow.type) ? '+' : '-'} {formatAmount(flow.amount, flow.decimals)} {flow.coin}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
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
          {startIndex + 1}-{Math.min(endIndex, displayFlows.length)} of {displayFlows.length}
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
