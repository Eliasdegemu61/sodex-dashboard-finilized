import { NextRequest, NextResponse } from 'next/server';
import { cacheManager } from '@/lib/cache';

interface SpotTrade {
  account_id: number;
  symbol_id: number;
  trade_id: number;
  side: number;
  user_id: number;
  order_id: number;
  cl_ord_id: string;
  price: string;
  quantity: string;
  fee: string;
  ts_ms: number;
  is_maker: boolean;
}

interface SpotTradesResponse {
  code: number;
  message: string;
  data: SpotTrade[];
  meta: {
    next_cursor?: string;
  };
}

interface VolumeAndFeesResult {
  totalVolume: number;
  totalFees: number;
}

const CACHE_DURATION = 3600; // 1 hour

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const accountId = searchParams.get('account_id');

    if (!accountId) {
      return NextResponse.json(
        { error: 'account_id is required' },
        { status: 400 }
      );
    }

    const cacheKey = `spot_trades_${accountId}`;

    // Try cache first
    const cached = await cacheManager.get(cacheKey);
    if (cached) {
      console.log('[v0] Spot trades served from cache');
      return NextResponse.json({ ...cached, fromCache: true });
    }

    console.log('[v0] Fetching spot trades for account:', accountId);

    // Fetch all pages with pagination and accumulate volume/fees in real-time
    let totalVolume = 0;
    let totalFees = 0;
    let totalTrades = 0;
    let nextCursor: string | undefined;
    let pageCount = 0;
    const pageVolumes: number[] = [];
    const pageFees: number[] = [];
    const allTrades: SpotTrade[] = []; // Declare allTrades variable

    do {
      pageCount++;
      
      const url = new URL('https://mainnet-data.sodex.dev/api/v1/spot/trades');
      url.searchParams.set('account_id', accountId);
      url.searchParams.set('limit', '1000');
      if (nextCursor) {
        url.searchParams.set('cursor', nextCursor);
      }

      const response = await fetch(url.toString(), {
        cache: 'no-store',
      });

      if (!response.ok) {
        console.error('[v0] Spot trades API error:', response.status);
        return NextResponse.json(
          { error: `Failed to fetch spot trades: ${response.statusText}` },
          { status: response.status }
        );
      }

      const data: SpotTradesResponse = await response.json();

      // Calculate volume and fees for this page and accumulate into totals
      let pageVolume = 0;
      let pageFeeSum = 0;

      data.data.forEach((trade) => {
        const tradeVolume = parseFloat(trade.price) * parseFloat(trade.quantity);
        const tradeFee = parseFloat(trade.fee || '0');

        // ACCUMULATE into running totals
        totalVolume += tradeVolume;
        totalFees += tradeFee;
        pageVolume += tradeVolume;
        pageFeeSum += tradeFee;

        allTrades.push(trade);
      });

      totalTrades += data.data.length;
      pageVolumes.push(pageVolume);
      pageFees.push(pageFeeSum);

      console.log('[v0] Spot trades page', pageCount, '- trades:', data.data.length, 'page_volume:', pageVolume.toFixed(2), 'cumulative_volume:', totalVolume.toFixed(2));

      nextCursor = data.meta?.next_cursor;
    } while (nextCursor);

    console.log('[v0] Spot trades complete - total pages:', pageCount, 'total trades:', totalTrades, 'total volume:', totalVolume.toFixed(2), 'total fees:', totalFees.toFixed(2));

    const result = {
      totalVolume,
      totalFees,
      tradeCount: totalTrades,
    };

    // Cache the result
    await cacheManager.set(cacheKey, result, CACHE_DURATION);

    return NextResponse.json({ ...result, fromCache: false });
  } catch (error) {
    console.error('[v0] Spot trades fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch spot trades' },
      { status: 500 }
    );
  }
}
