'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TrendingUp } from 'lucide-react'

interface Pair {
  pair: string
  volume: number
}

interface VolumeData {
  all_time_stats: {
    total_combined_volume: number
    total_spot_volume: number
    total_futures_volume: number
    top_5_spot: Pair[]
    top_5_futures: Pair[]
  }
}

export function TopPairsWidget() {
  const [data, setData] = useState<VolumeData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const response = await fetch('https://raw.githubusercontent.com/Eliasdegemu61/sodex-tracker-new-v1-data-2/main/volume_summary.json')
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const fetchedData: VolumeData = await response.json()
        console.log('[v0] Fetched top pairs data:', fetchedData)
        setData(fetchedData)
      } catch (error) {
        console.error('[v0] Error loading volume data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading || !data) {
    return (
      <Card className="p-3 md:p-4 bg-card/50 border-border">
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-secondary rounded w-1/3" />
          <div className="h-32 bg-secondary rounded" />
        </div>
      </Card>
    )
  }

  const formatVolume = (volume: number | undefined) => {
    if (!volume) return '0'
    if (volume >= 1e6) return (volume / 1e6).toFixed(2) + 'M'
    if (volume >= 1e3) return (volume / 1e3).toFixed(2) + 'K'
    return volume.toFixed(2)
  }

  const stats = data.all_time_stats
  const allTopPairs = [...stats.top_5_spot, ...stats.top_5_futures]
    .sort((a, b) => b.volume - a.volume)
    .slice(0, 5)

  return (
    <Card className="p-3 md:p-4 bg-card/50 border-border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm md:text-base font-semibold text-foreground flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-accent" />
          All-Time Top Pairs
        </h3>
      </div>

      {/* All-Time Stats */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="p-2 bg-secondary/30 rounded">
          <div className="text-xs text-muted-foreground">Spot Vol</div>
          <div className="text-sm font-bold text-accent">${formatVolume(stats.total_spot_volume)}</div>
        </div>
        <div className="p-2 bg-secondary/30 rounded">
          <div className="text-xs text-muted-foreground">Futures Vol</div>
          <div className="text-sm font-bold text-accent">${formatVolume(stats.total_futures_volume)}</div>
        </div>
      </div>

      {/* Top Pairs Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-transparent p-0 h-auto border-t border-border">
          <TabsTrigger value="all" className="text-xs md:text-sm font-semibold rounded-none bg-transparent text-muted-foreground py-3 px-4 data-[state=active]:bg-secondary/50 data-[state=active]:text-foreground shadow-none">
            All Pairs
          </TabsTrigger>
          <TabsTrigger value="spot" className="text-xs md:text-sm font-semibold rounded-none bg-transparent text-muted-foreground py-3 px-4 data-[state=active]:bg-secondary/50 data-[state=active]:text-foreground shadow-none">
            Spot
          </TabsTrigger>
          <TabsTrigger value="futures" className="text-xs md:text-sm font-semibold rounded-none bg-transparent text-muted-foreground py-3 px-4 data-[state=active]:bg-secondary/50 data-[state=active]:text-foreground shadow-none">
            Futures
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4 space-y-2">
          {allTopPairs && allTopPairs.length > 0 ? (
            allTopPairs.map((pair, idx) => (
              <div key={pair.pair} className="flex items-center justify-between p-2 hover:bg-secondary/20 rounded transition">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs font-semibold text-muted-foreground min-w-fit">#{idx + 1}</span>
                  <span className="text-xs md:text-sm font-mono text-foreground truncate">{pair.pair}</span>
                  <span className={`text-xs px-2 py-0.5 rounded ${pair.pair.includes('-') ? 'bg-orange-600/20 text-orange-600' : 'bg-orange-400/20 text-orange-400'}`}>
                    {pair.pair.includes('-') ? 'Futures' : 'Spot'}
                  </span>
                </div>
                <span className="text-xs md:text-sm font-bold text-accent flex-shrink-0">${formatVolume(pair.volume)}</span>
              </div>
            ))
          ) : (
            <div className="text-xs text-muted-foreground text-center py-4">No data available</div>
          )}
        </TabsContent>

        <TabsContent value="spot" className="mt-4 space-y-2">
          {stats.top_5_spot && stats.top_5_spot.length > 0 ? (
            stats.top_5_spot.map((pair, idx) => (
              <div key={pair.pair} className="flex items-center justify-between p-2 hover:bg-secondary/20 rounded transition">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-muted-foreground">#{idx + 1}</span>
                  <span className="text-xs md:text-sm font-mono text-foreground">{pair.pair}</span>
                </div>
                <span className="text-xs md:text-sm font-bold text-accent">${formatVolume(pair.volume)}</span>
              </div>
            ))
          ) : (
            <div className="text-xs text-muted-foreground text-center py-4">No spot pairs available</div>
          )}
        </TabsContent>

        <TabsContent value="futures" className="mt-4 space-y-2">
          {stats.top_5_futures && stats.top_5_futures.length > 0 ? (
            stats.top_5_futures.map((pair, idx) => (
              <div key={pair.pair} className="flex items-center justify-between p-2 hover:bg-secondary/20 rounded transition">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-muted-foreground">#{idx + 1}</span>
                  <span className="text-xs md:text-sm font-mono text-foreground">{pair.pair}</span>
                </div>
                <span className="text-xs md:text-sm font-bold text-accent">${formatVolume(pair.volume)}</span>
              </div>
            ))
          ) : (
            <div className="text-xs text-muted-foreground text-center py-4">No futures pairs available</div>
          )}
        </TabsContent>
      </Tabs>
    </Card>
  )
}
