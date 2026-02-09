import { NextResponse } from 'next/server';

const LEADERBOARD_API_URL = 'https://raw.githubusercontent.com/Eliasdegemu61/Sodex-Tracker-new-v1/main/live_stats.json';
const CACHE_DURATION = 60; // 1 minute for live stats

interface LeaderboardApiEntry {
  userId: string;
  address: string;
  pnl: string;
  vol: string;
}

// In-memory cache
let cachedData: LeaderboardApiEntry[] | null = null;
let lastCacheTime = 0;

export async function GET() {
  try {
    const now = Date.now();

    // Check cache
    if (cachedData && now - lastCacheTime < CACHE_DURATION * 1000) {
      return NextResponse.json(cachedData, {
        headers: {
          'Cache-Control': `public, s-maxage=${CACHE_DURATION}, stale-while-revalidate=${CACHE_DURATION * 2}`,
        },
      });
    }

    // Fetch from GitHub with GITHUB_TOKEN
    const token = process.env.GITHUB_TOKEN;
    const response = await fetch(LEADERBOARD_API_URL, {
      headers: token ? { Authorization: `token ${token}` } : {},
      // Disable Next.js data cache to avoid 2MB limit on large JSON files
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data: LeaderboardApiEntry[] = await response.json();

    // Update cache
    cachedData = data;
    lastCacheTime = now;

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': `public, s-maxage=${CACHE_DURATION}, stale-while-revalidate=${CACHE_DURATION * 2}`,
      },
    });
  } catch (error) {
    console.error('[v0] Failed to fetch live stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch live stats' },
      { status: 500 }
    );
  }
}
