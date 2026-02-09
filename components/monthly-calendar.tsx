'use client';

import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { usePortfolio } from '@/context/portfolio-context';

interface DayTrades {
  date: Date;
  pnl: number;
  trades: any[];
}

export function MonthlyCalendar() {
  const { positions } = usePortfolio();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const dayData = useMemo(() => {
    if (!positions || positions.length === 0) {
      return new Map<string, DayTrades>();
    }

    const dateMap = new Map<string, DayTrades>();

    positions.forEach((position) => {
      let posDate: Date;
      if (typeof position.created_at === 'number') {
        posDate = new Date(position.created_at);
      } else {
        posDate = new Date(position.created_at);
      }

      const dateKey = posDate.toISOString().split('T')[0];
      const existing = dateMap.get(dateKey);
      const pnl = position.realizedPnlValue || 0;

      if (existing) {
        existing.pnl += pnl;
        existing.trades.push(position);
      } else {
        dateMap.set(dateKey, {
          date: posDate,
          pnl,
          trades: [position],
        });
      }
    });

    return dateMap;
  }, [positions]);

  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];

    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  }, [currentDate]);

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
    setSelectedDate(null);
    setIsModalOpen(false);
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
    setSelectedDate(null);
    setIsModalOpen(false);
  };

  const getDayPnL = (date: Date | null) => {
    if (!date) return null;
    const dateKey = date.toISOString().split('T')[0];
    return dayData.get(dateKey);
  };

  const getBackgroundColor = (pnl: number | null) => {
    if (pnl === null || pnl === 0) {
      return 'bg-secondary/30 border border-border/50 hover:bg-secondary/50';
    }
    if (pnl > 0) {
      return 'bg-emerald-900/40 border border-emerald-700/50 hover:bg-emerald-900/60';
    } else {
      return 'bg-red-900/40 border border-red-700/50 hover:bg-red-900/60';
    }
  };

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    setIsModalOpen(true);
  };

  const selectedDayTrades = selectedDate ? getDayPnL(selectedDate) : null;

  const monthYear = currentDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const weekDaysFull = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

  return (
    <>
      {/* Calendar Card - Compact Layout */}
      <Card className="p-3 bg-card border border-border">
        {/* Header with Month/Year and Navigation */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-foreground">{monthYear}</h3>
          <div className="flex gap-1">
            <Button
              onClick={previousMonth}
              variant="outline"
              size="sm"
              className="h-5 w-5 p-0 bg-transparent"
            >
              <ChevronLeft className="w-2.5 h-2.5" />
            </Button>
            <Button
              onClick={nextMonth}
              variant="outline"
              size="sm"
              className="h-5 w-5 p-0 bg-transparent"
            >
              <ChevronRight className="w-2.5 h-2.5" />
            </Button>
          </div>
        </div>

        {/* Weekday headers - Smaller */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDaysFull.map((day) => (
            <div
              key={day}
              className="text-center text-xs font-semibold text-foreground bg-secondary/40 rounded-full py-0.5"
            >
              {day[0]}
            </div>
          ))}
        </div>

        {/* Calendar days - Grid layout */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((date, idx) => {
            const dayTrades = getDayPnL(date);
            const hasActivity = dayTrades && dayTrades.pnl !== 0;

            return (
              <button
                key={idx}
                onClick={() => date && handleDayClick(date)}
                disabled={!date}
                className={`
                  relative aspect-square rounded-md p-1 text-xs font-semibold transition-all duration-200 flex flex-col items-center justify-center
                  ${!date ? 'bg-transparent cursor-default' : `${getBackgroundColor(dayTrades?.pnl ?? null)} hover:scale-105 cursor-pointer`}
                `}
              >
                {date && (
                  <>
                    <div className="text-foreground text-xs leading-none">{date.getDate()}</div>
                    {hasActivity && (
                      <div className={`text-xs leading-none mt-0.5 ${dayTrades.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        ${Math.abs(dayTrades.pnl).toFixed(0)}
                      </div>
                    )}
                  </>
                )}
              </button>
            );
          })}
        </div>
      </Card>

      {/* Modal Popup for Trades */}
      {isModalOpen && selectedDayTrades && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="bg-card border border-border max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 md:p-6 border-b border-border/50">
              <div>
                <h2 className="text-lg md:text-xl font-bold text-foreground">
                  {selectedDate?.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                </h2>
                <p className={`text-sm font-semibold mt-1 ${selectedDayTrades.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  Daily PnL: {selectedDayTrades.pnl >= 0 ? '+' : ''}${selectedDayTrades.pnl.toFixed(2)}
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-secondary/50 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Trades List */}
            <div className="overflow-y-auto flex-1 p-4 md:p-6 space-y-3">
              {selectedDayTrades.trades.map((trade, idx) => (
                <div key={idx} className="p-3 md:p-4 rounded-lg bg-secondary/20 border border-border/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm md:text-base text-foreground">{trade.pairName}</span>
                    <span className={`text-sm md:text-base font-bold ${trade.realizedPnlValue >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {trade.realizedPnlValue >= 0 ? '+' : ''}${trade.realizedPnlValue.toFixed(2)}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground grid grid-cols-2 gap-2">
                    <div className="flex justify-between">
                      <span>Position:</span>
                      <span className="text-foreground">{trade.positionSideLabel} {trade.leverage}x</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Entry / Close:</span>
                      <span className="text-foreground">${parseFloat(trade.avg_entry_price).toFixed(4)} / ${parseFloat(trade.avg_close_price).toFixed(4)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Size:</span>
                      <span className="text-foreground">{trade.closedSize.toFixed(4)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="p-4 md:p-6 border-t border-border/50">
              <Button
                onClick={() => setIsModalOpen(false)}
                className="w-full"
                variant="outline"
              >
                Close
              </Button>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
