'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { formatNumber } from '@/lib/format-number'

export function OverallProfitEfficiencyCard() {
  const [overallEfficiency, setOverallEfficiency] = useState<number>(0)
  const [overallPnL, setOverallPnL] = useState<number>(0)
  const [overallVolume, setOverallVolume] = useState<number>(0)
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

        const totalPnl = traders.reduce((sum, t) => sum + parseFloat(t.pnl), 0)
        const totalVolume = traders.reduce((sum, t) => sum + parseFloat(t.vol), 0)
        const efficiency = totalVolume > 0 ? (totalPnl / totalVolume) * 1000 : 0

        setOverallEfficiency(efficiency)
        setOverallPnL(totalPnl)
        setOverallVolume(totalVolume)
      } catch (error) {
        console.error('[v0] Error fetching overall profit efficiency data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  if (isLoading) {
    return (
      <Card className="p-3 bg-card/50 border-border">
        <div className="h-12 bg-muted/30 rounded animate-pulse" />
      </Card>
    )
  }

  return (
    <Card className="p-3 md:p-4 bg-card/50 border-border">
      <p className="text-xs text-muted-foreground mb-2">Overall Profit Efficiency</p>
      <div className="flex items-center gap-2">
        <div className="text-xl md:text-2xl font-bold">
          <span className={overallEfficiency >= 0 ? 'text-green-500' : 'text-destructive'}>
            ${formatNumber(overallEfficiency)}
          </span>
        </div>
        <div className="text-xs text-muted-foreground">
          <div>per 1K volume</div>
        </div>
      </div>
    </Card>
  )
}
