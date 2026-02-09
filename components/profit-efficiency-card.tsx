'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { formatNumber } from '@/lib/format-number'

interface TraderEfficiency {
  userId: string
  address: string
  pnl: number
  volume: number
  efficiency: number
}

export function ProfitEfficiencyCard() {
  const [overallEfficiency, setOverallEfficiency] = useState<number>(0)
  const [overallPnL, setOverallPnL] = useState<number>(0)
  const [overallVolume, setOverallVolume] = useState<number>(0)
  const [topTraders, setTopTraders] = useState<TraderEfficiency[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [volumeRangeData, setVolumeRangeData] = useState<any[]>([]) // Declare volumeRangeData

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

        // Calculate overall efficiency (total PnL / total volume)
        const totalPnl = traders.reduce((sum, t) => sum + parseFloat(t.pnl), 0)
        const totalVolume = traders.reduce((sum, t) => sum + parseFloat(t.vol), 0)
        const efficiency = totalVolume > 0 ? totalPnl / totalVolume : 0
        const tradersWithEfficiency: TraderEfficiency[] = traders
          .map((t) => ({
            userId: t.userId,
            address: t.address,
            pnl: parseFloat(t.pnl),
            volume: parseFloat(t.vol),
            efficiency: parseFloat(t.vol) > 0 ? parseFloat(t.pnl) / parseFloat(t.vol) : 0,
          }))
          .filter((t) => t.volume > 0) // Only include traders with volume
          .sort((a, b) => b.efficiency - a.efficiency) // Sort by efficiency descending
          .slice(0, 5) // Top 5

        setOverallEfficiency(efficiency)
        setOverallPnL(totalPnl)
        setOverallVolume(totalVolume)
        setTopTraders(tradersWithEfficiency)
      } catch (error) {
        console.error('[v0] Error fetching profit efficiency data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  if (isLoading) {
    return (
      <Card className="p-4 md:p-6 bg-card/50 border-border">
        <div className="space-y-4">
          <div className="h-12 bg-muted/30 rounded animate-pulse" />
          <div className="h-64 bg-muted/20 rounded animate-pulse" />
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-8 bg-muted/20 rounded animate-pulse" />
            ))}
          </div>
        </div>
      </Card>
    )
  }

  // Return empty state if no data
  if (topTraders.length === 0 && volumeRangeData.length === 0) {
    return (
      <Card className="p-4 md:p-6 bg-card/50 border-border">
        <p className="text-sm text-muted-foreground text-center py-8">Loading profit efficiency data...</p>
      </Card>
    )
  }

  return (
    <Card className="p-4 md:p-6 bg-card/50 border-border">
      <div className="space-y-6">
        {/* Overall Efficiency */}
        <div className="border-b border-border pb-4">
          <p className="text-xs md:text-sm text-muted-foreground mb-2">Overall Profit Efficiency</p>
          <div className="flex items-center gap-3">
            <div className="text-3xl md:text-4xl font-bold">
              <span className={overallEfficiency >= 0 ? 'text-green-500' : 'text-destructive'}>
                ${formatNumber(overallPnL)}/{formatNumber(overallVolume)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">PnL / Volume</p>
          </div>
        </div>

        {/* Top 5 Efficient Traders */}
        <div>
          <p className="text-xs md:text-sm text-muted-foreground mb-3">Top 5 Efficient Traders</p>
          <div className="space-y-2">
            {topTraders.map((trader, index) => (
              <div
                key={trader.userId}
                className="flex items-center justify-between p-2 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs font-semibold text-muted-foreground w-6">#{index + 1}</span>
                  <span className="text-xs text-muted-foreground truncate">
                    {trader.address.slice(0, 6)}...{trader.address.slice(-4)}
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-xs font-bold ${trader.efficiency >= 0 ? 'text-green-500' : 'text-destructive'}`}>
                    ${formatNumber(trader.pnl)}/{formatNumber(trader.volume)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  )
}
