import { NextResponse } from 'next/server';

const VOLUME_CHART_URL = 'https://raw.githubusercontent.com/Eliasdegemu61/sodex-tracker-new-v1-data-2/main/volume_chart.json';
const CACHE_DURATION = 300; // 5 minutes

interface ChartDataPoint {
  day: string;
  spot_vol: number;
  futures_vol: number;
  total_day_vol: number;
}

// In-memory cache
let cachedData: ChartDataPoint[] | null = null;
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
    const response = await fetch(VOLUME_CHART_URL, {
      headers: token ? { Authorization: `token ${token}` } : {},
      next: { revalidate: CACHE_DURATION },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data: ChartDataPoint[] = await response.json();

    // Update cache
    cachedData = data;
    lastCacheTime = now;

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': `public, s-maxage=${CACHE_DURATION}, stale-while-revalidate=${CACHE_DURATION * 2}`,
      },
    });
  } catch (error) {
    console.error('[v0] Failed to fetch volume chart:', error);
    return NextResponse.json(
      { error: 'Failed to fetch volume chart' },
      { status: 500 }
    );
  }
}
