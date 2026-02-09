// Spot trading API service

import { cacheManager } from './cache';

export interface SpotTradesData {
  totalVolume: number;
  totalFees: number;
  tradeCount: number;
}

export async function fetchSpotTradesData(
  userId: string | number
): Promise<SpotTradesData> {
  const cacheKey = `spot_trades_data_${userId}`;

  return cacheManager.deduplicate(cacheKey, async () => {
    try {
      console.log('[v0] Fetching spot trades data for user:', userId);

      const response = await fetch(`/api/spot/trades?account_id=${userId}`);

      if (!response.ok) {
        throw new Error(`Spot trades API error: ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        console.error('[v0] Spot trades error:', data.error);
        // Return zero values if no trades found
        return {
          totalVolume: 0,
          totalFees: 0,
          tradeCount: 0,
        };
      }

      console.log('[v0] Spot trades data fetched:', {
        volume: data.totalVolume,
        fees: data.totalFees,
        trades: data.tradeCount,
      });

      return {
        totalVolume: data.totalVolume || 0,
        totalFees: data.totalFees || 0,
        tradeCount: data.tradeCount || 0,
      };
    } catch (error) {
      console.error('[v0] Failed to fetch spot trades data:', error);
      // Return zero values on error instead of throwing
      return {
        totalVolume: 0,
        totalFees: 0,
        tradeCount: 0,
      };
    }
  });
}
