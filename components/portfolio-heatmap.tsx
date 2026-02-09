'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useState, useMemo } from 'react';
import { usePortfolio } from '@/context/portfolio-context';

interface DayData {
  date: Date;
  pnl: number;
}

export function PortfolioHeatmap() {
  const { positions } = usePortfolio();
  
  // Get available years from positions
  const availableYears = useMemo(() => {
    if (!positions || positions.length === 0) {
      return [new Date().getFullYear()];
    }

    const years = new Set<number>();
    positions.forEach((position) => {
      let posDate: Date;
      if (typeof position.created_at === 'number') {
        posDate = new Date(position.created_at);
      } else {
        posDate = new Date(position.created_at);
      }
      years.add(posDate.getFullYear());
    });

    return Array.from(years).sort((a, b) => b - a);
  }, [positions]);

  const [selectedYear, setSelectedYear] = useState<number>(availableYears[0]);

  // Generate calendar data from actual positions for selected year
  const calendarData = useMemo(() => {
    if (!positions || positions.length === 0) {
      return [];
    }

    // Create a map of date to PnL
    const dateMap = new Map<string, number>();

    positions.forEach((position) => {
      let posDate: Date;
      if (typeof position.created_at === 'number') {
        posDate = new Date(position.created_at);
      } else {
        posDate = new Date(position.created_at);
      }
      
      // Only include positions from selected year
      if (posDate.getFullYear() !== selectedYear) {
        return;
      }

      const dateKey = posDate.toISOString().split('T')[0];
      const pnlValue = position.realizedPnlValue || 0;
      const currentPnL = dateMap.get(dateKey) || 0;
      
      dateMap.set(dateKey, currentPnL + pnlValue);
    });

    // Generate all days in the selected year
    const data: DayData[] = [];
    const startDate = new Date(selectedYear, 0, 1);
    const endDate = new Date(selectedYear, 11, 31);

    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      const dateKey = new Date(date).toISOString().split('T')[0];
      const pnl = dateMap.get(dateKey) || 0;
      data.push({ date: new Date(date), pnl });
    }

    return data;
  }, [positions, selectedYear]);

  // Calculate stats based on selected year
  const stats = useMemo(() => {
    // Filter positions for selected year
    const filteredPositions = positions.filter((position) => {
      let posDate: Date;
      if (typeof position.created_at === 'number') {
        posDate = new Date(position.created_at);
      } else {
        posDate = new Date(position.created_at);
      }
      return posDate.getFullYear() === selectedYear;
    });

    const totalTrades = filteredPositions.length;
    const wins = filteredPositions.filter((p) => p.realizedPnlValue > 0).length;
    const losses = filteredPositions.filter((p) => p.realizedPnlValue < 0).length;
    const totalPnL = filteredPositions.reduce((sum, p) => sum + p.realizedPnlValue, 0);
    const winRate = totalTrades > 0 ? ((wins / totalTrades) * 100).toFixed(2) : '0.00';

    return {
      totalTrades,
      wins,
      losses,
      totalPnL,
      winRate,
    };
  }, [positions, selectedYear]);

  const weeks = useMemo(() => {
    const weekArrays: DayData[][] = [];
    let currentWeek: DayData[] = [];

    calendarData.forEach((day) => {
      if (currentWeek.length === 7) {
        weekArrays.push(currentWeek);
        currentWeek = [];
      }
      currentWeek.push(day);
    });

    if (currentWeek.length > 0) {
      weekArrays.push(currentWeek);
    }

    return weekArrays;
  }, [calendarData]);

  const getColor = (pnl: number | null) => {
    if (pnl === null || pnl === 0) return 'border border-border/70 bg-card/30';
    
    // Scale colors based on magnitude of PnL
    if (pnl > 0) {
      // Green colors for positive PnL
      if (pnl >= 100) return 'bg-emerald-900/80 hover:bg-emerald-800';
      if (pnl >= 50) return 'bg-emerald-800/70 hover:bg-emerald-700';
      if (pnl >= 10) return 'bg-emerald-700/60 hover:bg-emerald-600';
      return 'bg-emerald-600/40 hover:bg-emerald-500/50'; // Small positive
    } else {
      // Red colors for negative PnL
      if (pnl <= -100) return 'bg-red-900/80 hover:bg-red-800';
      if (pnl <= -50) return 'bg-red-800/70 hover:bg-red-700';
      if (pnl <= -10) return 'bg-red-700/60 hover:bg-red-600';
      return 'bg-red-600/40 hover:bg-red-500/50'; // Small negative
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (!positions || positions.length === 0) {
    return (
      <Card className="p-3 md:p-6 bg-card border border-border">
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <h3 className="text-base md:text-lg font-bold text-foreground">Trading Activity Heatmap</h3>
        </div>
        <p className="text-muted-foreground text-xs md:text-sm">No position data available</p>
      </Card>
    );
  }

  return (
    <Card className="p-3 md:p-6 bg-card border border-border">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4 md:mb-6 gap-2">
        <h3 className="text-base md:text-lg font-bold text-foreground">Trading Activity Heatmap</h3>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {availableYears.map((year) => (
            <Button
              key={year}
              onClick={() => setSelectedYear(year)}
              variant={selectedYear === year ? 'default' : 'outline'}
              size="sm"
              className="px-2 md:px-3 text-xs md:text-sm whitespace-nowrap"
            >
              {year}
            </Button>
          ))}
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 md:gap-4 mb-4 md:mb-8">
        <div className="p-2 md:p-4 rounded-lg bg-card/50 border border-border/50">
          <p className="text-xs text-muted-foreground font-medium mb-0.5 md:mb-1">Overall PnL</p>
          <p className={`text-sm md:text-xl font-bold ${stats.totalPnL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {stats.totalPnL >= 0 ? '+' : ''}${stats.totalPnL.toFixed(2)}
          </p>
        </div>

        <div className="p-2 md:p-4 rounded-lg bg-card/50 border border-border/50">
          <p className="text-xs text-muted-foreground font-medium mb-0.5 md:mb-1">Total Trades</p>
          <p className="text-sm md:text-xl font-bold text-foreground">{stats.totalTrades}</p>
        </div>

        <div className="p-2 md:p-4 rounded-lg bg-card/50 border border-border/50">
          <p className="text-xs text-muted-foreground font-medium mb-0.5 md:mb-1">Wins</p>
          <p className="text-sm md:text-xl font-bold text-emerald-400">{stats.wins}</p>
        </div>

        <div className="p-2 md:p-4 rounded-lg bg-card/50 border border-border/50">
          <p className="text-xs text-muted-foreground font-medium mb-0.5 md:mb-1">Losses</p>
          <p className="text-sm md:text-xl font-bold text-red-400">{stats.losses}</p>
        </div>

        <div className="p-2 md:p-4 rounded-lg bg-card/50 border border-border/50">
          <p className="text-xs text-muted-foreground font-medium mb-0.5 md:mb-1">Win Rate</p>
          <p className="text-sm md:text-xl font-bold text-foreground">{stats.winRate}%</p>
        </div>
      </div>

      <div 
        className="overflow-x-auto"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        } as React.CSSProperties}
      >
        <style>{`.heatmap-scroll::-webkit-scrollbar { display: none; }`}</style>
        <div className="flex gap-1 min-w-min">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-1">
              {week.map((day) => (
                <div
                  key={day.date.toISOString()}
                  className={`w-6 h-6 rounded-sm cursor-pointer transition-all duration-200 ${getColor(day.pnl)}`}
                  title={`${formatDate(day.date)}: ${day.pnl >= 0 ? '+' : ''}${day.pnl.toFixed(2)} PnL`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4 mt-6 text-xs">
        <span className="text-muted-foreground font-medium">Loss</span>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded-sm bg-red-900/80"></div>
          <div className="w-4 h-4 rounded-sm bg-red-800/70"></div>
          <div className="w-4 h-4 rounded-sm bg-red-700/60"></div>
          <div className="w-4 h-4 rounded-sm bg-red-600/40"></div>
          <div className="w-4 h-4 rounded-sm border border-border/70 bg-card/30"></div>
          <div className="w-4 h-4 rounded-sm bg-emerald-600/40"></div>
          <div className="w-4 h-4 rounded-sm bg-emerald-700/60"></div>
          <div className="w-4 h-4 rounded-sm bg-emerald-800/70"></div>
          <div className="w-4 h-4 rounded-sm bg-emerald-900/80"></div>
        </div>
        <span className="text-muted-foreground font-medium">Gain</span>
      </div>
    </Card>
  );
}
