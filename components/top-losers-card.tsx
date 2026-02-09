'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { TrendingDown } from 'lucide-react'
import { formatNumber } from '@/lib/format-number'

interface Trader {
  userId: string
  address: string
  pnl: string
  vol: string
}

interface Loser {
  userId: string
  address: string
  pnl: number
  vol: number
}

export function TopLosersCard() {
  const [losers, setLosers] = useState<Loser[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLosers = async () => {
      try {
        setLoading(true)
        const response = await fetch(
          'https://raw.githubusercontent.com/Eliasdegemu61/Sodex-Tracker-new-v1/main/live_stats.json'
        )
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data: Trader[] = await response.json()
        console.log('[v0] Fetched losers data:', data.length, 'records')
        
        // Filter traders with negative PnL and sort by lowest PnL first
        const topLosers = data
          .filter(t => parseFloat(t.pnl) < 0)
          .sort((a, b) => parseFloat(a.pnl) - parseFloat(b.pnl))
          .slice(0, 5)
          .map(t => ({
            userId: t.userId,
            address: t.address,
            pnl: parseFloat(t.pnl),
            vol: parseFloat(t.vol),
          }))
        
        setLosers(topLosers)
      } catch (error) {
        console.error('[v0] Error fetching top losers:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchLosers()
  }, [])

  if (loading) {
    return (
      <Card className="p-3 bg-card/50 border-border">
        <div className="h-48 animate-pulse" />
      </Card>
    )
  }

  const formatAddress = (address: string) => {
    return address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'N/A'
  }

  return (
    <Card className="p-3 md:p-4 bg-card/50 border-border">
      <h3 className="text-xs md:text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
        <TrendingDown className="w-4 h-4 text-red-500" />
        Top 5 Losers
      </h3>
      <div className="space-y-2">
        {losers.length > 0 ? (
          losers.map((item, idx) => (
            <div key={item.address} className="flex items-center justify-between p-2 bg-secondary/30 rounded hover:bg-secondary/50 transition">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs font-bold text-muted-foreground">#{idx + 1}</span>
                <span className="text-xs font-mono text-foreground truncate">{formatAddress(item.address)}</span>
              </div>
              <span className="text-xs font-bold text-destructive flex-shrink-0">-${formatNumber(Math.abs(item.pnl))}</span>
            </div>
          ))
        ) : (
          <div className="text-xs text-muted-foreground text-center py-4">No losers available</div>
        )}
      </div>
    </Card>
  )
}
