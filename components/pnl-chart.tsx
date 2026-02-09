'use client';

import { Card } from '@/components/ui/card';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Area } from 'recharts';
import { usePortfolio } from '@/context/portfolio-context';
import { useMemo } from 'react';

interface PnLChartProps {
  title?: string;
}

export function PnLChart({ title = 'Profit & Loss' }: PnLChartProps) {
  const { positions } = usePortfolio();

  const chartData = useMemo(() => {
    if (!positions || positions.length === 0) {
      return [];
    }

    // Group positions by day using ISO date key for proper sorting
    const dayMap = new Map<string, { pnl: number; fullDate: string }>();
    positions.forEach((position) => {
      const date = new Date(position.created_at);
      const isoDateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD for sorting
      const displayDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
      
      const current = dayMap.get(isoDateKey) || { pnl: 0, fullDate: displayDate };
      dayMap.set(isoDateKey, {
        pnl: current.pnl + position.realizedPnlValue,
        fullDate: displayDate,
      });
    });

    // Convert to array and sort by ISO date
    const sortedData = Array.from(dayMap.entries())
      .sort((a, b) => {
        // Sort by ISO date key (YYYY-MM-DD)
        return a[0].localeCompare(b[0]);
      })
      .map(([dateKey, { pnl, fullDate }]) => ({
        date: fullDate,
        pnl,
      }));

    // Calculate cumulative PnL
    let cumulativePnL = 0;
    return sortedData.map((day) => {
      cumulativePnL += day.pnl;
      return {
        ...day,
        cumulative: cumulativePnL,
      };
    });
  }, [positions]);

  const stats = useMemo(() => {
    if (chartData.length === 0) {
      return { totalPnL: 0, percentageChange: '0', isPositive: true, displayValue: '$0' };
    }

    const totalPnL = chartData[chartData.length - 1].cumulative;
    const initialValue = 10000; // Starting value for percentage calculation
    const percentageChange = ((totalPnL / initialValue) * 100).toFixed(2);
    const isPositive = totalPnL >= 0;

    // Format display value - use K only if value > 999
    let displayValue: string;
    if (Math.abs(totalPnL) > 999) {
      displayValue = `$${(totalPnL / 1000).toFixed(1)}K`;
    } else {
      displayValue = `$${totalPnL.toFixed(2)}`;
    }

    return { totalPnL, percentageChange, isPositive, displayValue };
  }, [chartData]);

  const getBarColor = (value: number) => {
    return value >= 0 ? '#10b98166' : '#ef444466'; // Semi-transparent green for positive, red for negative
  };

  if (chartData.length === 0) {
    return (
      <Card className="p-3 md:p-6 bg-card border border-border">
        <div className="mb-4 md:mb-6">
          <h3 className="text-base md:text-lg font-bold text-foreground mb-1 md:mb-2">{title}</h3>
          <p className="text-xs md:text-sm text-muted-foreground">No position data available</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-3 md:p-6 bg-card border border-border">
      <div className="mb-4 md:mb-6">
        <h3 className="text-base md:text-lg font-bold text-foreground mb-1 md:mb-2">{title}</h3>
        <div className="flex items-baseline gap-2 md:gap-3">
          <p className={`text-xl md:text-3xl font-bold ${stats.isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
            {stats.displayValue}
          </p>
          <p className={`text-xs md:text-sm font-semibold ${stats.isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
            {stats.isPositive ? '+' : ''}{stats.percentageChange}%
          </p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={250}>
        <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <XAxis dataKey="date" stroke="#666" style={{ fontSize: '10px' }} tick={{ fontSize: 10 }} />
          <YAxis stroke="#666" style={{ fontSize: '10px' }} tick={{ fontSize: 10 }} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1a1a1a',
              border: '1px solid #333',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '12px',
            }}
            labelStyle={{ color: '#fff' }}
            formatter={(value) => {
              const numValue = value as number;
              if (Math.abs(numValue) > 999) {
                return `$${(numValue / 1000).toFixed(1)}K`;
              }
              return `$${numValue.toFixed(2)}`;
            }}
            contentFormatter={(value, name, props) => {
              if (props.payload) {
                return [
                  `Daily PnL: $${(props.payload.pnl as number).toFixed(2)}`,
                  `Cumulative: $${(props.payload.cumulative as number).toFixed(2)}`,
                ];
              }
              return value;
            }}
          />
          <Bar dataKey="pnl" fill="#10b981">
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getBarColor(entry.pnl)} />
            ))}
          </Bar>
          <Line
            type="monotone"
            dataKey="cumulative"
            stroke="#f97316"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </Card>
  );
}
