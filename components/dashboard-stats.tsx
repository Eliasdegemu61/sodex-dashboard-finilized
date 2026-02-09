'use client'

import { Card } from '@/components/ui/card'
import { useState, useEffect } from 'react'
import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

interface VolumeStats {
  updated_at: string
  all_time_stats: {
    total_combined_volume: number
    total_spot_volume: number
    total_futures_volume: number
    top_5_spot: Array<{ pair: string; volume: number }>
    top_5_futures: Array<{ pair: string; volume: number }>
  }
  today_stats: {
    date: string
    top_5_spot: Array<{ pair: string; volume: number }>
    top_5_futures: Array<{ pair: string; volume: number }>
  }
}

interface DashboardStatsProps {
  variant?: 'default' | 'compact'
}

export function DashboardStats({ variant = 'default' }: DashboardStatsProps) {
  const [stats, setStats] = useState<{ totalUsers: number; usersInProfit: number; usersInLoss: number } | null>(null)
  const [volume, setVolume] = useState<{ spot: number; futures: number; combined: number } | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        
        // Fetch traders data for stats
        const tradersResponse = await fetch(
          'https://raw.githubusercontent.com/Eliasdegemu61/Sodex-Tracker-new-v1/main/live_stats.json'
        )
        if (!tradersResponse.ok) {
          throw new Error(`HTTP error! status: ${tradersResponse.status}`)
        }
        const traders: Array<{ userId: string; address: string; pnl: string; vol: string }> =
          await tradersResponse.json()

        const totalUsers = traders.length
        const usersInProfit = traders.filter((t) => parseFloat(t.pnl) > 0).length
        const usersInLoss = traders.filter((t) => parseFloat(t.pnl) < 0).length

        setStats({ totalUsers, usersInProfit, usersInLoss })

        // Fetch volume data
        const volumeResponse = await fetch(
          'https://raw.githubusercontent.com/Eliasdegemu61/sodex-tracker-new-v1-data-2/main/volume_summary.json'
        )
        if (!volumeResponse.ok) {
          throw new Error(`HTTP error! status: ${volumeResponse.status}`)
        }
        const volumeData: VolumeStats = await volumeResponse.json()
        
        setVolume({
          spot: volumeData.all_time_stats.total_spot_volume,
          futures: volumeData.all_time_stats.total_futures_volume,
          combined: volumeData.all_time_stats.total_combined_volume,
        })
      } catch (error) {
        console.error('[v0] Error fetching Dex Status data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  if (isLoading || !stats || !volume) {
    return (
      <div className="space-y-2 mb-4">
        {variant === 'compact' ? (
          <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
            <Card className="p-2 md:p-3 bg-card/50 border-border h-20" />
            <Card className="p-2 md:p-3 bg-card/50 border-border h-20" />
          </div>
        ) : (
          <>
            <Card className="p-3 bg-card/50 border-border h-16" />
            <Card className="p-3 bg-card/50 border-border h-16" />
            <Card className="p-3 bg-card/50 border-border h-16" />
          </>
        )}
      </div>
    )
  }

  const totalVolume = volume.combined
  const spotVolume = volume.spot
  const futuresVolume = volume.futures

  const pieData = [
    { name: 'S', value: spotVolume },
    { name: 'F', value: futuresVolume },
  ]

  // Compact variant - only show top 2 cards
  if (variant === 'compact') {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
        <Card className="p-2 md:p-3 bg-card/50 border-border">
          <div className="text-xs md:text-sm text-muted-foreground mb-0.5">Total Users</div>
          <div className="text-base md:text-lg font-bold text-foreground">{stats.totalUsers.toLocaleString()}</div>
          <div className="flex flex-col gap-1 text-xs mt-2">
            <span className="text-green-500">Profit: {((stats.usersInProfit / stats.totalUsers) * 100).toFixed(1)}%</span>
            <span className="text-destructive">Loss: {((stats.usersInLoss / stats.totalUsers) * 100).toFixed(1)}%</span>
          </div>
        </Card>
        <Card className="p-2 md:p-3 bg-card/50 border-border">
          <div className="text-xs md:text-sm text-muted-foreground mb-0.5">Total Volume</div>
          <div className="text-base md:text-lg font-bold text-foreground">${formatNumber(totalVolume)}</div>
          <div className="text-xs text-accent mt-2">All-Time Trading</div>
        </Card>
      </div>
    )
  }

  // Default variant - show all cards
  return (
    <div className="space-y-2 mb-4">
      <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
        <Card className="p-2 md:p-3 bg-card/50 border-border">
          <div className="text-xs md:text-sm text-muted-foreground mb-0.5">Total Users</div>
          <div className="text-base md:text-lg font-bold text-foreground">{stats.totalUsers.toLocaleString()}</div>
          <div className="flex flex-col gap-1 text-xs mt-2">
            <span className="text-green-500">Profit: {((stats.usersInProfit / stats.totalUsers) * 100).toFixed(1)}%</span>
            <span className="text-destructive">Loss: {((stats.usersInLoss / stats.totalUsers) * 100).toFixed(1)}%</span>
          </div>
        </Card>
        <Card className="p-2 md:p-3 bg-card/50 border-border">
          <div className="text-xs md:text-sm text-muted-foreground mb-0.5">Total Volume</div>
          <div className="text-base md:text-lg font-bold text-foreground">${formatNumber(totalVolume)}</div>
          <div className="text-xs text-accent mt-2">All-Time Trading</div>
        </Card>
      </div>
      <Card className="p-2 md:p-3 bg-card/50 border-border">
        <div className="text-xs md:text-sm text-muted-foreground mb-2">Spot vs Futures Volume</div>
        <div className="w-full h-48 flex items-center justify-center">
          <ResponsiveContainer width="100%" height={200} minWidth={0}>
            <PieChart>
              <defs>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={65}
                paddingAngle={2}
                dataKey="value"
                isAnimationActive={false}
                stroke="none"
                filter="url(#glow)"
                onClick={() => {}}
              >
                <Cell fill="#fb923c" />
                <Cell fill="#ea580c" />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex gap-4 text-xs mt-2 justify-center">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#fb923c' }} />
            <span className="text-muted-foreground">Spot: ${formatNumber(spotVolume)}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#ea580c' }} />
            <span className="text-muted-foreground">Futures: ${formatNumber(futuresVolume)}</span>
          </div>
        </div>
      </Card>
    </div>
  )
}

const formatNumber = (num: number) => {
  if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B'
  if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M'
  if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K'
  return num.toFixed(2)
}
