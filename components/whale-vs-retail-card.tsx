'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'

interface User {
  userId: string
  address: string
  pnl: string | number
  vol: string | number
}

interface WhaleRetailMetrics {
  whales: {
    count: number
    traderPercent: number
    volumeControlled: number
    volumeShare: number
  }
  retail: {
    count: number
    traderPercent: number
    volumeControlled: number
    volumeShare: number
  }
}

const WHALE_THRESHOLD = 0.008

export function WhaleVsRetailCard() {
  const [metrics, setMetrics] = useState<WhaleRetailMetrics | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(
          'https://raw.githubusercontent.com/Eliasdegemu61/Sodex-Tracker-new-v1/main/live_stats.json'
        )
        if (!response.ok) throw new Error('Failed to fetch')
        const users: User[] = await response.json()

        // Step 1: Preprocess - convert to numbers and filter vol = 0
        const processed = users
          .map(u => ({
            vol: typeof u.vol === 'string' ? parseFloat(u.vol) : u.vol,
            pnl: typeof u.pnl === 'string' ? parseFloat(u.pnl) : u.pnl,
          }))
          .filter(u => u.vol > 0 && isFinite(u.vol))

        // Handle edge case: no valid data
        if (processed.length === 0) {
          console.error('[v0] No valid volume data found')
          setMetrics(null)
          return
        }

        // Step 2: Calculate total volume
        const totalVolume = processed.reduce((sum, u) => sum + u.vol, 0)

        // Step 3 & 4: Classify and compute metrics
        const whales = processed.filter(u => u.vol / totalVolume > WHALE_THRESHOLD)
        const retail = processed.filter(u => u.vol / totalVolume <= WHALE_THRESHOLD)

        const whaleVolume = whales.reduce((sum, u) => sum + u.vol, 0)
        const retailVolume = retail.reduce((sum, u) => sum + u.vol, 0)

        setMetrics({
          whales: {
            count: whales.length,
            traderPercent: (whales.length / processed.length) * 100,
            volumeControlled: whaleVolume,
            volumeShare: (whaleVolume / totalVolume) * 100,
          },
          retail: {
            count: retail.length,
            traderPercent: (retail.length / processed.length) * 100,
            volumeControlled: retailVolume,
            volumeShare: (retailVolume / totalVolume) * 100,
          },
        })
      } catch (error) {
        console.error('[v0] Error fetching whale vs retail data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const formatVolume = (vol: number) => {
    if (vol >= 1_000_000_000) return `$${(vol / 1_000_000_000).toFixed(2)}B`
    if (vol >= 1_000_000) return `$${(vol / 1_000_000).toFixed(2)}M`
    if (vol >= 1_000) return `$${(vol / 1_000).toFixed(2)}K`
    return `$${vol.toFixed(2)}`
  }

  if (isLoading || !metrics) {
    return (
      <Card className="p-4 md:p-6 bg-card border border-border">
        <h3 className="text-base md:text-lg font-semibold mb-4">Whale vs Retail</h3>
        <div className="grid grid-cols-2 gap-4">
          {[1, 2].map(i => (
            <div key={i} className="space-y-3">
              <div className="h-6 bg-secondary/30 rounded animate-pulse w-16" />
              <div className="h-10 bg-secondary/30 rounded animate-pulse" />
              <div className="h-4 bg-secondary/30 rounded animate-pulse w-20" />
              <div className="h-12 bg-secondary/30 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-4 md:p-6 bg-card border border-border">
      <h3 className="text-base md:text-lg font-semibold mb-6">Whale vs Retail</h3>

      <div className="grid grid-cols-2 gap-4">
        {/* Whales Panel */}
        <div className="rounded-lg border border-orange-200 dark:border-orange-500/30 bg-orange-50 dark:bg-orange-950/50 p-4 space-y-4">
          <div>
            <p className="text-xs text-orange-600 dark:text-orange-400/80 mb-1">Whales &gt;0.8%</p>
            <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">{metrics.whales.count}</p>
            <p className="text-xs text-orange-500 dark:text-orange-400/60 mt-1">{metrics.whales.traderPercent.toFixed(1)}% of traders</p>
          </div>

          <div className="border-t border-orange-200 dark:border-orange-500/20 pt-3">
            <p className="text-xs text-orange-600 dark:text-orange-400/80 mb-2">Volume controlled</p>
            <p className="text-lg font-bold text-orange-600 dark:text-orange-400">{metrics.whales.volumeShare.toFixed(1)}%</p>
          </div>
        </div>

        {/* Retail Panel */}
        <div className="rounded-lg border border-muted/20 bg-gradient-to-br from-muted/10 to-muted/5 p-4 space-y-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Retail ≤0.8%</p>
            <p className="text-3xl font-bold text-muted-foreground">{metrics.retail.count}</p>
            <p className="text-xs text-muted-foreground mt-1">{metrics.retail.traderPercent.toFixed(1)}% of traders</p>
          </div>

          <div className="border-t border-muted/10 pt-3">
            <p className="text-xs text-muted-foreground mb-2">Volume controlled</p>
            <p className="text-lg font-bold text-muted-foreground">{metrics.retail.volumeShare.toFixed(1)}%</p>
          </div>
        </div>
      </div>
    </Card>
  )
}
