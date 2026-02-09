'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { CachedVolumeData, ChartDataPoint } from '@/lib/volume-service'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

type TimeRange = '1w' | '1m' | '3m' | '6m' | '1y'

interface VolumeChartClientProps {
  data: CachedVolumeData | null
  chartData?: ChartDataPoint[]
}

function filterChartData(chartData: ChartDataPoint[] | undefined, timeRange: TimeRange) {
  if (!chartData || chartData.length === 0) return []

  const now = new Date()
  let cutoffDate = new Date()

  switch (timeRange) {
    case '1w':
      cutoffDate.setDate(now.getDate() - 7)
      break
    case '1m':
      cutoffDate.setMonth(now.getMonth() - 1)
      break
    case '3m':
      cutoffDate.setMonth(now.getMonth() - 3)
      break
    case '6m':
      cutoffDate.setMonth(now.getMonth() - 6)
      break
    case '1y':
      cutoffDate.setFullYear(now.getFullYear() - 1)
      break
  }

  return chartData
    .filter((day) => {
      const dayDate = new Date(day.day)
      return dayDate >= cutoffDate
    })
    .map((day) => {
      return {
        date: day.day,
        spot: Number((day.spot_vol / 1e6).toFixed(2)),
        futures: Number((day.futures_vol / 1e6).toFixed(2)),
        total: Number((day.total_day_vol / 1e6).toFixed(2)),
      }
    })
}

export function VolumeChartClient({ data, chartData }: VolumeChartClientProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('1m')
  const processedChartData = filterChartData(chartData, timeRange)

  return (
    <Card className="p-2 md:p-4 bg-card/50 border-border">
      <div className="flex items-center justify-between mb-4 gap-2">
        <h3 className="text-xs md:text-sm font-semibold text-foreground">Volume Trend</h3>
        <div className="flex gap-1 md:gap-2 flex-wrap justify-end">
          {(['1w', '1m', '3m', '6m', '1y'] as TimeRange[]).map((range) => (
            <Button
              key={range}
              variant={timeRange === range ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeRange(range)}
              className="text-xs px-2 md:px-3 h-7 md:h-8"
            >
              {range.toUpperCase()}
            </Button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={250}>
        <AreaChart data={processedChartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
          <XAxis
            dataKey="date"
            stroke="currentColor"
            fontSize={10}
            tick={{ fill: 'currentColor' }}
            interval={Math.floor(processedChartData.length / 6)}
          />
          <YAxis
            stroke="currentColor"
            fontSize={10}
            tick={{ fill: 'currentColor' }}
            label={{ value: 'Volume (M)', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--color-card)',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
            }}
            cursor={false}
            formatter={(value) => `$${Number(value).toFixed(2)}M`}
            labelFormatter={(label) => `Date: ${label}`}
          />
          <Area
            type="monotone"
            dataKey="spot"
            stroke="#fb923c"
            fill="#fb923c"
            fillOpacity={0.25}
            strokeWidth={2}
            isAnimationActive={false}
            name="S"
            dot={false}
          />
          <Area
            type="monotone"
            dataKey="futures"
            stroke="#ea580c"
            fill="#ea580c"
            fillOpacity={0.25}
            strokeWidth={2}
            isAnimationActive={false}
            name="F"
            dot={false}
          />
          <Area
            type="monotone"
            dataKey="total"
            stroke="#f59e0b"
            fill="none"
            strokeWidth={2.5}
            isAnimationActive={false}
            name="Total"
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>

      <div className="mt-4 flex gap-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-orange-400 rounded" />
          <span className="text-muted-foreground">S (Spot)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-orange-600 rounded" />
          <span className="text-muted-foreground">F (Futures)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 border-2 border-amber-400 rounded" />
          <span className="text-muted-foreground">Total</span>
        </div>
      </div>
    </Card>
  )
}
