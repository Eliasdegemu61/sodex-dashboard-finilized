'use server'

import { cacheManager } from '@/lib/cache-manager'

interface ProcessedStats {
  timestamp: number
  totalUsers: number
  totalVolume: number
  usersInProfit: number
  usersInLoss: number
  leaderboardByPnl: Array<{
    rank: number
    userId: string
    address: string
    pnl: number
    vol: number
  }>
  leaderboardByVolume: Array<{
    rank: number
    userId: string
    address: string
    pnl: number
    vol: number
  }>
}

const STATS_CACHE_KEY = 'stats_service_processed'

// Mock data generator
function generateMockLeaderboard(count: number): Array<{
  rank: number
  userId: string
  address: string
  pnl: number
  vol: number
}> {
  return Array.from({ length: count }, (_, i) => {
    const index = i + 1
    return {
      rank: index,
      userId: `user_${index}`,
      address: `0x${Math.random().toString(16).slice(2)}${Math.random().toString(16).slice(2)}`,
      pnl: Math.random() > 0.5 ? Math.random() * 100000 : Math.random() * -50000,
      vol: Math.random() * 500000 + 10000,
    }
  })
}

export async function fetchAndProcessStats(): Promise<ProcessedStats> {
  return cacheManager.deduplicate(STATS_CACHE_KEY, async () => {
    const leaderboardByPnl = generateMockLeaderboard(50)
    const leaderboardByVolume = generateMockLeaderboard(50)

    const totalVolume = leaderboardByVolume.reduce((sum, entry) => sum + entry.vol, 0)
    const usersInProfit = leaderboardByPnl.filter(entry => entry.pnl > 0).length
    const usersInLoss = leaderboardByPnl.filter(entry => entry.pnl < 0).length

    const result: ProcessedStats = {
      timestamp: Date.now(),
      totalUsers: 1240,
      totalVolume: totalVolume,
      usersInProfit: usersInProfit,
      usersInLoss: usersInLoss,
      leaderboardByPnl,
      leaderboardByVolume,
    }

    return result
  })
}
