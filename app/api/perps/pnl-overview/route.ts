import { NextRequest, NextResponse } from 'next/server';
import { cacheManager } from '@/lib/cache';

interface PnLOverviewResponse {
  code: number;
  message: string;
  data: {
    account_id: number;
    ts_ms: number;
    cumulative_pnl: string;
    cumulative_quote_volume: string;
    unrealized_pnl: string;
  };
}

const CACHE_DURATION = 300; // 5 minutes

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('account_id');

    if (!accountId) {
      return NextResponse.json(
        { error: 'account_id is required' },
        { status: 400 }
      );
    }

    const cacheKey = `pnl_overview_${accountId}`;

    // Try to get from cache first
    const cached = await cacheManager.get(cacheKey);
    if (cached) {
      console.log('[v0] PnL overview cache HIT:', accountId);
      return NextResponse.json({ ...cached, fromCache: true });
    }

    console.log('[v0] PnL overview cache MISS, fetching from API');

    const response = await fetch(
      `https://mainnet-data.sodex.dev/api/v1/perps/pnl/overview?account_id=${accountId}`
    );

    if (!response.ok) {
      console.error('[v0] PnL overview API error:', response.status);
      return NextResponse.json(
        { error: `Failed to fetch PnL overview: ${response.statusText}` },
        { status: response.status }
      );
    }

    const data: PnLOverviewResponse = await response.json();

    if (data.code !== 0) {
      console.error('[v0] API returned error code:', data.code);
      return NextResponse.json(
        { error: `API error: ${data.message}` },
        { status: 400 }
      );
    }

    console.log('[v0] PnL overview fetched:', {
      volume: data.data.cumulative_quote_volume,
      accountId: data.data.account_id,
    });

    // Cache the result
    await cacheManager.set(cacheKey, data, CACHE_DURATION);

    return NextResponse.json({ ...data, fromCache: false });
  } catch (error) {
    console.error('[v0] PnL overview error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch PnL overview' },
      { status: 500 }
    );
  }
}
