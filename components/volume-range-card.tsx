'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { formatNumber } from '@/lib/format-number'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface VolumeRangeData {
  range: string
  avgPnL: number
  count: number
  rangeMin: number
  rangeMax: number
}

interface TraderEfficiency {
  userId: string
  address: string
  pnl: number
  volume: number
  efficiency: number
}

export function VolumeRangeCard() {
  const [volumeRangeData, setVolumeRangeData] = useState<VolumeRangeData[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch(
          'https://raw.githubusercontent.com/Eliasdegemu61/Sodex-Tracker-new-v1/main/live_stats.json'
        )
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const traders: Array<{ userId: string; address: string; pnl: string; vol: string }> =
          await response.json()

        const tradersWithEfficiency: TraderEfficiency[] = traders
          .map((t) => ({
            userId: t.userId,
            address: t.address,
            pnl: parseFloat(t.pnl),
            volume: parseFloat(t.vol),
            efficiency: parseFloat(t.vol) > 0 ? parseFloat(t.pnl) / parseFloat(t.vol) : 0,
          }))
          .filter((t) => t.volume > 0)
          .sort((a, b) => b.efficiency - a.efficiency)

        // Define volume ranges
        const ranges = [
          { name: '100-1K', min: 100, max: 1000 },
          { name: '1K-10K', min: 1000, max: 10000 },
          { name: '10K-100K', min: 10000, max: 100000 },
          { name: '100K-500K', min: 100000, max: 500000 },
          { name: '500K-1M', min: 500000, max: 1000000 },
          { name: '1M-5M', min: 1000000, max: 5000000 },
          { name: '5M-7M', min: 5000000, max: 7000000 },
          { name: '7M-10M', min: 7000000, max: 10000000 },
          { name: '10M+', min: 10000000, max: Infinity },
        ]

        // Group traders by volume range and calculate average PnL
        const rangeData = ranges.map((range) => {
          const tradersInRange = tradersWithEfficiency.filter(
            (t) => t.volume >= range.min && t.volume < range.max
          )
          const avgPnL =
            tradersInRange.length > 0
              ? tradersInRange.reduce((sum, t) => sum + t.pnl, 0) / tradersInRange.length
              : 0

          return {
            range: range.name,
            avgPnL: avgPnL,
            count: tradersInRange.length,
            rangeMin: range.min,
            rangeMax: range.max,
          }
        })

        setVolumeRangeData(rangeData)
      } catch (error) {
        console.error('[v0] Error fetching volume range data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  if (isLoading) {
    return (
      <Card className="p-4 md:p-6 bg-card/50 border-border">
        <div className="h-64 bg-muted/20 rounded animate-pulse" />
      </Card>
    )
  }

  if (volumeRangeData.length === 0) {
    return (
      <Card className="p-4 md:p-6 bg-card/50 border-border">
        <p className="text-sm text-muted-foreground text-center py-8">Loading volume range data...</p>
      </Card>
    )
  }

  return (
    <Card className="p-4 md:p-6 bg-card/50 border-border">
      <div className="space-y-4">
        <div>
          <p className="text-xs md:text-sm text-muted-foreground mb-3">Average PnL by Volume Range</p>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={volumeRangeData}
              margin={{ top: 10, right: 30, left: 0, bottom: 30 }}
            >
              <XAxis
                dataKey="range"
                tick={{ fontSize: 12, fill: '#888' }}
              />
              <YAxis
                tick={{ fontSize: 12, fill: '#888' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1a1a1a',
                  border: '1px solid #333',
                  borderRadius: '6px',
                  color: '#fff',
                }}
                formatter={(value) => {
                  const num = value as number
                  const sign = num < 0 ? '-' : ''
                  return `${sign}$${formatNumber(Math.abs(num))}`
                }}
                labelFormatter={(label) => `Range: ${label}`}
              />
              <Bar dataKey="avgPnL" fill="#fb923c" radius={[8, 8, 0, 0]} stroke="none">
                {volumeRangeData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.avgPnL >= 0 ? '#22c55e' : '#ef4444'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="text-xs text-muted-foreground text-center">
          {volumeRangeData.reduce((sum, r) => sum + r.count, 0)} traders across{' '}
          {volumeRangeData.filter((r) => r.count > 0).length} volume ranges
        </div>
      </div>
    </Card>
  )
}
