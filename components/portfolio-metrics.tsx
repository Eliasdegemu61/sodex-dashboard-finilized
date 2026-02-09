'use client';

import { Card } from '@/components/ui/card';
import { usePortfolio } from '@/context/portfolio-context';
import { useMemo } from 'react';

export function PortfolioMetrics() {
  const { positions } = usePortfolio();

  const metrics = useMemo(() => {
    if (!positions || positions.length === 0) {
      return {
        sharpeRatio: 0,
        maxDrawdown: 0,
        profitFactor: 0,
        avgTrade: 0,
      };
    }

    // Calculate cumulative PnL array for drawdown calculation
    // Starting from initial balance of 10,000
    const initialBalance = 10000;
    let cumulativeBalance = initialBalance;
    const balanceArray: number[] = [initialBalance];

    positions.forEach((position) => {
      cumulativeBalance += position.realizedPnlValue;
      balanceArray.push(cumulativeBalance);
    });

    // Calculate Max Drawdown correctly (in absolute dollars, not percentage)
    let maxDrawdown = 0;
    let runningMax = initialBalance;

    balanceArray.forEach((balance) => {
      if (balance > runningMax) {
        runningMax = balance;
      }
      const drawdownAmount = runningMax - balance;
      if (drawdownAmount > maxDrawdown) {
        maxDrawdown = drawdownAmount;
      }
    });

    console.log('[v0] Drawdown calc - runningMax:', runningMax, 'maxDrawdown:', maxDrawdown);

    // Calculate Profit Factor
    const winningTrades = positions.filter(p => p.realizedPnlValue > 0);
    const losingTrades = positions.filter(p => p.realizedPnlValue < 0);

    const grossProfit = winningTrades.reduce((sum, p) => sum + p.realizedPnlValue, 0);
    const grossLoss = Math.abs(losingTrades.reduce((sum, p) => sum + p.realizedPnlValue, 0));

    const profitFactor = grossLoss > 0 ? (grossProfit / grossLoss).toFixed(2) : '0.00';

    // Calculate Sharpe Ratio (simplified - using returns std dev)
    const totalPnL = balanceArray[balanceArray.length - 1] - initialBalance;
    const avgReturn = totalPnL / positions.length;
    const variance = positions.reduce((sum) => {
      return sum + Math.pow(avgReturn - (totalPnL / positions.length), 2);
    }, 0) / positions.length;
    const stdDev = Math.sqrt(variance) || 1;
    const sharpeRatio = (avgReturn / stdDev).toFixed(2);

    // Calculate Average Trade
    const avgTrade = totalPnL / positions.length;

    return {
      sharpeRatio: parseFloat(sharpeRatio),
      maxDrawdown: isFinite(maxDrawdown) ? maxDrawdown : 0,
      profitFactor: parseFloat(profitFactor as string),
      avgTrade: avgTrade,
    };
  }, [positions]);

  return (
    <Card className="p-6 bg-card border border-border">
      <h3 className="text-base font-bold text-foreground mb-4">Portfolio Metrics</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">Sharpe Ratio</p>
          <p className="text-2xl font-bold text-cyan-400">{metrics.sharpeRatio.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground/70">Risk-adjusted returns</p>
        </div>

        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">Max Drawdown</p>
          <p className="text-2xl font-bold text-red-400">${metrics.maxDrawdown.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground/70">Peak to trough</p>
        </div>

        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">Profit Factor</p>
          <p className="text-2xl font-bold text-emerald-400">{metrics.profitFactor.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground/70">Gross profit / loss</p>
        </div>

        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">Avg Trade</p>
          <p className={`text-2xl font-bold ${metrics.avgTrade >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            ${metrics.avgTrade.toFixed(2)}
          </p>
          <p className="text-xs text-muted-foreground/70">Average per trade</p>
        </div>
      </div>
    </Card>
  );
}
