'use client'

import { Card } from '@/components/ui/card'
import { formatNumber } from '@/lib/format-number'
import { useState, useEffect } from 'react'
import { fetchSpotLeaderboardData } from '@/lib/volume-service'

interface SpotTrader {
  address: string
  userId: string
  vol: number
  last_ts: number
}

function formatAddress(address: string) {
  return address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'N/A'
}

export function TopSpotTradersCard() {
  const [traders, setTraders] = useState<SpotTrader[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTraders = async () => {
      try {
        setLoading(true)
        const data = await fetchSpotLeaderboardData()
        console.log('[v0] Fetched spot traders data:', data.length, 'records')
        
        // Sort by volume (descending) and get top 5
        const topTraders = data
          .filter(t => t.vol > 0)
          .sort((a, b) => b.vol - a.vol)
          .slice(0, 5)
        
        setTraders(topTraders)
      } catch (error) {
        console.error('[v0] Error fetching spot traders:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTraders()
  }, [])

  if (loading) {
    return (
      <Card className="p-3 bg-card/50 border-border">
        <h3 className="text-sm font-semibold text-foreground mb-3">Top Traders (Spot)</h3>
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-6 bg-secondary/30 rounded animate-pulse" />
          ))}
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-3 bg-card/50 border-border">
      <h3 className="text-sm font-semibold text-foreground mb-3">Top Traders (Spot)</h3>
      <div className="space-y-2">
        {traders.length > 0 ? (
          traders.map((trader, idx) => (
            <div key={trader.address} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-muted-foreground font-bold">#{idx + 1}</span>
                <span className="text-muted-foreground truncate">{formatAddress(trader.address)}</span>
              </div>
              <span className="text-accent font-semibold flex-shrink-0">${formatNumber(trader.vol)}</span>
            </div>
          ))
        ) : (
          <div className="text-xs text-muted-foreground text-center py-2">No data available</div>
        )}
      </div>
    </Card>
  )
}
