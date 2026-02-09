import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { Redis } from '@upstash/redis'

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

interface TraderStats {
  totalUsers: number
  usersInProfit: number
  usersInLoss: number
}

interface CachedDexData {
  volumeData: VolumeStats | null
  traderStats: TraderStats | null
  lastUpdated: number
}

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

const CACHE_DURATION = 30 * 60 // 30 minutes in seconds
const CACHE_KEY = 'dex-status-cache'
const GITHUB_TRADERS_URL = 'https://raw.githubusercontent.com/Eliasdegemu61/Sodex-Tracker-new-v1/main/live_stats.json'
const GITHUB_VOLUME_URL = 'https://raw.githubusercontent.com/Eliasdegemu61/sodex-tracker-new-v1-data-2/main/volume_summary.json'

async function fetchAndCalculateDexData(): Promise<CachedDexData> {
  console.log('[v0] Server: Fetching fresh Dex Status data from GitHub')
  
  try {
    // Fetch traders data
    const tradersResponse = await fetch(GITHUB_TRADERS_URL, {
      cache: 'no-store',
    })
    if (!tradersResponse.ok) {
      throw new Error(`Failed to fetch traders data: ${tradersResponse.status}`)
    }
    const traders: Array<{ userId: string; address: string; pnl: string; vol: string }> = await tradersResponse.json()

    const totalUsers = traders.length
    const usersInProfit = traders.filter((t) => parseFloat(t.pnl) > 0).length
    const usersInLoss = traders.filter((t) => parseFloat(t.pnl) < 0).length

    const traderStats: TraderStats = {
      totalUsers,
      usersInProfit,
      usersInLoss,
    }

    // Fetch volume data
    const volumeResponse = await fetch(GITHUB_VOLUME_URL, {
      cache: 'no-store',
    })
    if (!volumeResponse.ok) {
      throw new Error(`Failed to fetch volume data: ${volumeResponse.status}`)
    }
    const volumeData: VolumeStats = await volumeResponse.json()

    const now = Date.now()
    const cachedData: CachedDexData = {
      volumeData,
      traderStats,
      lastUpdated: now,
    }

    // Store in Redis with 30 minute expiration
    await redis.setex(CACHE_KEY, CACHE_DURATION, JSON.stringify(cachedData))
    console.log('[v0] Server: Dex Status data cached in Redis for', CACHE_DURATION, 'seconds')
    
    return cachedData
  } catch (error) {
    console.error('[v0] Server: Error fetching Dex data:', error)
    throw error
  }
}

export async function GET(request: NextRequest) {
  try {
    // Try to get from Redis cache
    const cached = await redis.get<string>(CACHE_KEY)
    
    if (cached) {
      const cachedData: CachedDexData = JSON.parse(cached)
      const cacheAgeSeconds = Math.round((Date.now() - cachedData.lastUpdated) / 1000)
      console.log('[v0] Server: Returning cached Dex Status from Redis (age:', cacheAgeSeconds, 'seconds)')
      
      return NextResponse.json({
        ...cachedData,
        fromCache: true,
        cacheAgeSeconds,
      })
    }

    // Cache miss or expired, fetch fresh data
    console.log('[v0] Server: Cache miss in Redis, fetching fresh data')
    const freshData = await fetchAndCalculateDexData()

    return NextResponse.json({
      ...freshData,
      fromCache: false,
      cacheAgeSeconds: 0,
    })
  } catch (error) {
    console.error('[v0] Server: Error in Dex Status API:', error)
    return NextResponse.json(
      { error: 'Failed to fetch Dex Status data' },
      { status: 500 }
    )
  }
}

// Trigger cache refresh from external service
export async function POST(request: NextRequest) {
  try {
    console.log('[v0] Server: Manually triggering Dex Status cache refresh')
    const data = await fetchAndCalculateDexData()
    return NextResponse.json({
      message: 'Dex Status cache refreshed',
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
