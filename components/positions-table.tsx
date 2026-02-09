'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowUpRight, ArrowDownLeft, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { usePortfolio } from '@/context/portfolio-context';
import { useMemo, useState } from 'react';

export function PositionsTable() {
  const { positions } = usePortfolio();
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);
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

  const displayPositions = useMemo(() => {
    if (!positions || positions.length === 0) {
      return [];
    }

    return positions.map((position, idx) => {
      // Debug logging to check the actual values
      if (position.pairName === 'SILVER-USD') {
        console.log('[v0] SILVER-USD position:', {
          position_side: (position as any).position_side,
          positionSideLabel: position.positionSideLabel,
          pnl: position.realizedPnlValue,
        });
      }

      return {
        id: String(idx),
        pair: position.pairName,
        type: position.positionSideLabel === 'LONG' ? 'long' : 'short',
        entry: parseFloat(position.avg_entry_price),
        close: parseFloat(position.avg_close_price),
        size: position.closedSize,
        pnl: position.realizedPnlValue,
        pnlPercent: position.closedSize > 0 ? (position.realizedPnlValue / (parseFloat(position.avg_entry_price) * position.closedSize)) * 100 : 0,
        leverage: `${position.leverage}x`,
        marginMode: position.marginModeLabel,
        fee: position.tradingFee,
        createdAt: position.createdAtFormatted,
      };
    });
  }, [positions]);

  // Pagination logic
  const totalPages = Math.ceil(displayPositions.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedPositions = displayPositions.slice(startIndex, endIndex);

  // Reset to first page when rows per page changes
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

  if (!positions || positions.length === 0) {
    return (
      <Card className="p-3 md:p-6 bg-card border border-border">
        <h3 className="text-base md:text-lg font-bold text-foreground mb-4">Position History</h3>
        <p className="text-muted-foreground text-xs md:text-sm">No position history available</p>
      </Card>
    );
  }

  return (
    <Card className="p-3 md:p-6 bg-card border border-border">
      <h3 className="text-base md:text-lg font-bold text-foreground mb-4">Position History</h3>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-2 text-muted-foreground font-medium">Pair</th>
              <th className="text-left py-3 px-2 text-muted-foreground font-medium">Side</th>
              <th className="text-left py-3 px-2 text-muted-foreground font-medium">Mode</th>
              <th className="text-right py-3 px-2 text-muted-foreground font-medium">Entry</th>
              <th className="text-right py-3 px-2 text-muted-foreground font-medium">Close</th>
              <th className="text-right py-3 px-2 text-muted-foreground font-medium">Size</th>
              <th className="text-right py-3 px-2 text-muted-foreground font-medium">Leverage</th>
              <th className="text-right py-3 px-2 text-muted-foreground font-medium">Fee</th>
              <th className="text-right py-3 px-2 text-muted-foreground font-medium">PnL</th>
              <th className="text-right py-3 px-2 text-muted-foreground font-medium">%</th>
              <th className="text-left py-3 px-2 text-muted-foreground font-medium">Date</th>
            </tr>
          </thead>
          <tbody>
            {paginatedPositions.map((position) => (
              <tr key={position.id} className="border-b border-border hover:bg-secondary/30 transition-colors">
                <td className="py-3 px-2 font-semibold text-foreground text-sm">{position.pair}</td>
                <td className="py-3 px-2">
                  <Badge
                    variant={position.type === 'long' ? 'default' : 'secondary'}
                    className={position.type === 'long' ? 'bg-emerald-900/50 text-emerald-300' : 'bg-red-900/50 text-red-300'}
                  >
                    {position.type.toUpperCase()}
                  </Badge>
                </td>
                <td className="py-3 px-2 text-sm">
                  <Badge variant="outline" className="text-xs">
                    {position.marginMode}
                  </Badge>
                </td>
                <td className="py-3 px-2 text-right text-muted-foreground text-xs">${position.entry.toFixed(6)}</td>
                <td className="py-3 px-2 text-right text-foreground font-medium text-xs">${position.close.toFixed(6)}</td>
                <td className="py-3 px-2 text-right text-muted-foreground text-xs">{position.size.toFixed(4)}</td>
                <td className="py-3 px-2 text-right text-foreground font-medium text-sm">{position.leverage}</td>
                <td className="py-3 px-2 text-right text-muted-foreground text-xs">${position.fee.toFixed(4)}</td>
                <td className={`py-3 px-2 text-right font-bold text-xs ${position.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {position.pnl >= 0 ? '+' : ''} ${position.pnl.toFixed(4)}
                </td>
                <td className="py-3 px-2 text-right">
                  <div className="flex items-center justify-end gap-1">
                    {position.pnlPercent >= 0 ? (
                      <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <ArrowDownLeft className="w-4 h-4 text-red-400" />
                    )}
                    <span className={`font-semibold text-xs ${position.pnlPercent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {position.pnlPercent >= 0 ? '+' : ''} {position.pnlPercent.toFixed(2)}%
                    </span>
                  </div>
                </td>
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
                  <span className="font-semibold text-foreground">{position.pair}</span>
                  <Badge
                    variant={position.type === 'long' ? 'default' : 'secondary'}
                    className={`text-xs ${position.type === 'long' ? 'bg-emerald-900/50 text-emerald-300' : 'bg-red-900/50 text-red-300'}`}
                  >
                    {position.type.toUpperCase()}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>Entry: ${position.entry.toFixed(4)}</span>
                  <span className={position.pnl >= 0 ? 'text-emerald-400 font-semibold' : 'text-red-400 font-semibold'}>
                    {position.pnl >= 0 ? '+' : ''} ${position.pnl.toFixed(4)}
                  </span>
                </div>
              </div>
              <ChevronDown
                className={`w-5 h-5 text-muted-foreground transition-transform ${expandedRows.has(position.id) ? 'rotate-180' : ''}`}
              />
            </button>

            {/* Expandable Details */}
            {expandedRows.has(position.id) && (
              <div className="p-3 border-t border-border bg-card/30 space-y-2 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-muted-foreground">Close Price</span>
                    <p className="font-semibold text-foreground">${position.close.toFixed(6)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Size</span>
                    <p className="font-semibold text-foreground">{position.size.toFixed(4)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Leverage</span>
                    <p className="font-semibold text-foreground">{position.leverage}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Mode</span>
                    <p className="font-semibold text-foreground">{position.marginMode}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Fee</span>
                    <p className="font-semibold text-foreground">${position.fee.toFixed(4)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Return %</span>
                    <p className={`font-semibold ${position.pnlPercent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {position.pnlPercent >= 0 ? '+' : ''} {position.pnlPercent.toFixed(2)}%
                    </p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Date Closed</span>
                    <p className="font-semibold text-foreground">{position.createdAt}</p>
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
