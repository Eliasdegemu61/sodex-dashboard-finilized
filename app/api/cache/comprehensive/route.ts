import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { Redis } from '@upstash/redis'

interface LeaderboardEntry {
  userId: string
  address: string
  pnl: string
  vol: string
}

interface SpotLeaderboardEntry {
  address: string
  vol: number
}

interface CacheData {
  // DEX Status Data
  dexStatus: {
    totalUsers: number
    usersInProfit: number
    usersInLoss: number
    totalVolume: number
    spotVolume: number
    perpVolume: number
    spotVsPerpsRatio: { spot: number; perps: number }
    topGainers: Array<{ userId: string; address: string; pnl: number; vol: number }>
    topLosers: Array<{ userId: string; address: string; pnl: number; vol: number }>
    pnlByVolumeRange: Array<{ range: string; avgPnl: number; count: number }>
    overallProfitEfficiency: { profitUsers: number; avgProfit: number; avgLoss: number }
    todayTopPairs: Array<{ pair: string; volume: number }>
    allTimeTopPairs: Array<{ pair: string; volume: number }>
    topTradersSpot: Array<{ address: string; volume: number; rank: number }>
    topTradersPrerps: Array<{ address: string; volume: number; rank: number }>
  }
  // Leaderboard Data
  leaderboards: {
    perpsLeaderboard: LeaderboardEntry[]
    spotLeaderboard: SpotLeaderboardEntry[]
  }
  lastUpdated: number
}

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

const CACHE_DURATION = 30 * 60 // 30 minutes in seconds
const CACHE_KEY = 'comprehensive-dex-cache'

const GITHUB_URLS = {
  traders: 'https://raw.githubusercontent.com/Eliasdegemu61/Sodex-Tracker-new-v1/main/live_stats.json',
  volume: 'https://raw.githubusercontent.com/Eliasdegemu61/sodex-tracker-new-v1-data-2/main/volume_summary.json',
  spot: 'https://raw.githubusercontent.com/Eliasdegemu61/sodex-tracker-new-v1-data-2/main/spot_summary.json',
}

async function calculateComprehensiveData(): Promise<CacheData> {
  console.log('[v0] Server: Calculating comprehensive DEX and Leaderboard data')

  try {
    // Fetch all required data from GitHub
    const [tradersRes, volumeRes, spotRes] = await Promise.all([
      fetch(GITHUB_URLS.traders, { cache: 'no-store' }),
      fetch(GITHUB_URLS.volume, { cache: 'no-store' }),
      fetch(GITHUB_URLS.spot, { cache: 'no-store' }),
    ])

    if (!tradersRes.ok || !volumeRes.ok || !spotRes.ok) {
      throw new Error('Failed to fetch GitHub data')
    }

    const traders: LeaderboardEntry[] = await tradersRes.json()
    const volumeData = await volumeRes.json()
    const spotData = await spotRes.json()

    // --- DEX STATUS CALCULATIONS ---

    // Total users and stats
    const totalUsers = traders.length
    const usersInProfit = traders.filter(t => parseFloat(t.pnl) > 0).length
    const usersInLoss = traders.filter(t => parseFloat(t.pnl) < 0).length

    // Volume calculations
    const totalVolume = traders.reduce((sum, t) => sum + parseFloat(t.vol), 0)
    const spotVolume = volumeData.all_time_stats.total_spot_volume || 0
    const perpVolume = volumeData.all_time_stats.total_futures_volume || 0
    const spotVsPerpsRatio = {
      spot: spotVolume / (spotVolume + perpVolume),
      perps: perpVolume / (spotVolume + perpVolume),
    }

    // Top Gainers and Losers
    const topGainers = traders
      .filter(t => parseFloat(t.pnl) > 0)
      .sort((a, b) => parseFloat(b.pnl) - parseFloat(a.pnl))
      .slice(0, 5)
      .map(t => ({
        userId: t.userId,
        address: t.address,
        pnl: parseFloat(t.pnl),
        vol: parseFloat(t.vol),
      }))

    const topLosers = traders
      .filter(t => parseFloat(t.pnl) < 0)
      .sort((a, b) => parseFloat(a.pnl) - parseFloat(b.pnl))
      .slice(0, 5)
      .map(t => ({
        userId: t.userId,
        address: t.address,
        pnl: parseFloat(t.pnl),
        vol: parseFloat(t.vol),
      }))

    // PnL by Volume Range
    const volumeRanges = [
      { min: 0, max: 10000, label: '$0 - $10K' },
      { min: 10000, max: 50000, label: '$10K - $50K' },
      { min: 50000, max: 100000, label: '$50K - $100K' },
      { min: 100000, max: 500000, label: '$100K - $500K' },
      { min: 500000, max: Infinity, label: '$500K+' },
    ]

    const pnlByVolumeRange = volumeRanges.map(range => {
      const inRange = traders.filter(t => {
        const vol = parseFloat(t.vol)
        return vol >= range.min && vol < range.max
      })
      const avgPnl = inRange.length > 0
        ? inRange.reduce((sum, t) => sum + parseFloat(t.pnl), 0) / inRange.length
        : 0
      return {
        range: range.label,
        avgPnl,
        count: inRange.length,
      }
    })

    // Overall Profit Efficiency
    const profitUsers = traders.filter(t => parseFloat(t.pnl) > 0)
    const avgProfit = profitUsers.length > 0
      ? profitUsers.reduce((sum, t) => sum + parseFloat(t.pnl), 0) / profitUsers.length
      : 0
    const lossUsers = traders.filter(t => parseFloat(t.pnl) < 0)
    const avgLoss = lossUsers.length > 0
      ? lossUsers.reduce((sum, t) => sum + parseFloat(t.pnl), 0) / lossUsers.length
      : 0

    const overallProfitEfficiency = {
      profitUsers: profitUsers.length,
      avgProfit,
      avgLoss,
    }

    // Top Pairs
    const todayTopPairs = volumeData.today_stats?.top_5_spot?.map((p: any) => ({
      pair: p.pair,
      volume: p.volume,
    })) || []

    const allTimeTopPairs = volumeData.all_time_stats?.top_5_spot?.map((p: any) => ({
      pair: p.pair,
      volume: p.volume,
    })) || []

    // Top Traders
    const topTradersSpot = traders
      .sort((a, b) => parseFloat(b.vol) - parseFloat(a.vol))
      .slice(0, 10)
      .map((t, idx) => ({
        address: t.address,
        volume: parseFloat(t.vol),
        rank: idx + 1,
      }))

    const topTradersPrerps = traders
      .sort((a, b) => parseFloat(b.vol) - parseFloat(a.vol))
      .slice(0, 10)
      .map((t, idx) => ({
        address: t.address,
        volume: parseFloat(t.vol),
        rank: idx + 1,
      }))

    // --- LEADERBOARD CALCULATIONS ---

    // Perps Leaderboard (sorted by volume)
    const perpsLeaderboard = traders
      .sort((a, b) => parseFloat(b.vol) - parseFloat(a.vol))

    // Spot Leaderboard
    const spotLeaderboard = (spotData || [])
      .sort((a: any, b: any) => b.vol - a.vol)

    // Compile all data
    const cacheData: CacheData = {
      dexStatus: {
        totalUsers,
        usersInProfit,
        usersInLoss,
        totalVolume,
        spotVolume,
        perpVolume,
        spotVsPerpsRatio,
        topGainers,
        topLosers,
        pnlByVolumeRange,
        overallProfitEfficiency,
        todayTopPairs,
        allTimeTopPairs,
        topTradersSpot,
        topTradersPrerps,
      },
      leaderboards: {
        perpsLeaderboard,
        spotLeaderboard,
      },
      lastUpdated: Date.now(),
    }

    // Store in Redis with 30 minute expiration
    await redis.setex(CACHE_KEY, CACHE_DURATION, JSON.stringify(cacheData))
    console.log('[v0] Server: Comprehensive cache stored in Redis for', CACHE_DURATION, 'seconds')

    return cacheData
  } catch (error) {
    console.error('[v0] Server: Error calculating comprehensive data:', error)
    throw error
  }
}

export async function GET(request: NextRequest) {
  try {
    // Try to get from Redis cache
    const cached = await redis.get<string>(CACHE_KEY)

    if (cached) {
      const cacheData: CacheData = JSON.parse(cached)
      const cacheAgeSeconds = Math.round((Date.now() - cacheData.lastUpdated) / 1000)
      console.log('[v0] Server: Returning cached data from Redis (age:', cacheAgeSeconds, 'seconds)')

      return NextResponse.json({
        ...cacheData,
        fromCache: true,
        cacheAgeSeconds,
      })
    }

    // Cache miss, calculate fresh data
    console.log('[v0] Server: Cache miss, calculating fresh data')
    const freshData = await calculateComprehensiveData()

    return NextResponse.json({
      ...freshData,
      fromCache: false,
      cacheAgeSeconds: 0,
    })
  } catch (error) {
    console.error('[v0] Server: Error in comprehensive cache API:', error)
    return NextResponse.json(
      { error: 'Failed to fetch comprehensive cache data' },
      { status: 500 }
    )
  }
}

// POST to manually refresh cache
export async function POST(request: NextRequest) {
  try {
    console.log('[v0] Server: Manually refreshing comprehensive cache')
    const data = await calculateComprehensiveData()
    return NextResponse.json({
      message: 'Comprehensive cache refreshed',
      ...data,
      fromCache: false,
    })
  } catch (error) {
    console.error('[v0] Server: Error refreshing cache:', error)
    return NextResponse.json(
      { error: 'Failed to refresh cache' },
      { status: 500 }
    )
  }
}
