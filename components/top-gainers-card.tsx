'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { TrendingUp } from 'lucide-react'
import { formatNumber } from '@/lib/format-number'

interface Trader {
  userId: string
  address: string
  pnl: string
  vol: string
}

interface Gainer {
  userId: string
  address: string
  pnl: number
  vol: number
}

export function TopGainersCard() {
  const [gainers, setGainers] = useState<Gainer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchGainers = async () => {
      try {
        setLoading(true)
        const response = await fetch(
          'https://raw.githubusercontent.com/Eliasdegemu61/Sodex-Tracker-new-v1/main/live_stats.json'
        )
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data: Trader[] = await response.json()
        console.log('[v0] Fetched gainers data:', data.length, 'records')
        
        // Filter traders with positive PnL and sort by highest PnL first
        const topGainers = data
          .filter(t => parseFloat(t.pnl) > 0)
          .sort((a, b) => parseFloat(b.pnl) - parseFloat(a.pnl))
          .slice(0, 5)
          .map(t => ({
            userId: t.userId,
            address: t.address,
            pnl: parseFloat(t.pnl),
            vol: parseFloat(t.vol),
          }))
        
        setGainers(topGainers)
      } catch (error) {
        console.error('[v0] Error fetching top gainers:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchGainers()
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
        <TrendingUp className="w-4 h-4 text-green-500" />
        Top 5 Gainers
      </h3>
      <div className="space-y-2">
        {gainers.length > 0 ? (
          gainers.map((item, idx) => (
            <div key={item.address} className="flex items-center justify-between p-2 bg-secondary/30 rounded hover:bg-secondary/50 transition">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs font-bold text-muted-foreground">#{idx + 1}</span>
                <span className="text-xs font-mono text-foreground truncate">{formatAddress(item.address)}</span>
              </div>
              <span className="text-xs font-bold text-green-500 flex-shrink-0">+${formatNumber(item.pnl)}</span>
            </div>
          ))
        ) : (
          <div className="text-xs text-muted-foreground text-center py-4">No gainers available</div>
        )}
      </div>
    </Card>
  )
}
