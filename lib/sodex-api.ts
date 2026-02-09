// API service for Sodex protocol data

import { cacheManager } from './cache';
import { lookupWalletAddress } from './client-api';

interface PositionData {
  account_id: number;
  position_id: number;
  user_id: number;
  symbol_id: number;
  margin_mode: number; // 1 = ISOLATED, 2 = CROSS
  position_side: number; // 2 = LONG, 3 = SHORT
  size: string;
  initial_margin: string;
  avg_entry_price: string;
  cum_open_cost: string;
  cum_trading_fee: string;
  cum_closed_size: string;
  avg_close_price: string;
  max_size: string;
  realized_pnl: string;
  frozen_size: string;
  leverage: number;
  active: boolean;
  is_taken_over: boolean;
  take_over_price: string;
  created_at: number;
  updated_at: number;
}

interface SymbolData {
  symbolID: number;
  name: string;
  baseCoin: string;
  quoteCoin?: string;
  [key: string]: unknown;
}

interface PositionsResponse {
  code: number;
  message: string;
  data: PositionData[];
  next_cursor?: string;
}

interface SymbolsResponse {
  code: number;
  timestamp: number;
  data: Record<string, SymbolData>;
}

// Use server-side endpoint for wallet lookup
export async function getUserIdByAddress(address: string): Promise<string> {
  return lookupWalletAddress(address);
}

export async function fetchPositions(
  accountId: string | number,
  cursor?: string
): Promise<{ positions: PositionData[]; nextCursor?: string }> {
  const url = new URL('https://mainnet-data.sodex.dev/api/v1/perps/positions');
  url.searchParams.append('account_id', String(accountId));
  url.searchParams.append('limit', '1000');
  if (cursor) {
    url.searchParams.append('cursor', cursor);
  }

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Failed to fetch positions: ${response.statusText}`);
  }

  const data: PositionsResponse = await response.json();
  if (data.code !== 0) {
    throw new Error(`API error: ${data.message}`);
  }

  return {
    positions: data.data || [],
    nextCursor: data.next_cursor,
  };
}

export async function fetchAllPositions(
  accountId: string | number
): Promise<PositionData[]> {
  const allPositions: PositionData[] = [];
  let cursor: string | undefined;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { positions, nextCursor } = await fetchPositions(accountId, cursor);
    allPositions.push(...positions);

    if (!nextCursor) {
      break;
    }
    cursor = nextCursor;
  }

  return allPositions;
}

export async function fetchSymbols(): Promise<Map<number, SymbolData>> {
  const response = await fetch('https://mainnet-gw.sodex.dev/bolt/symbols?names');
  if (!response.ok) {
    throw new Error(`Failed to fetch symbols: ${response.statusText}`);
  }

  const data: SymbolsResponse = await response.json();
  if (data.code !== 0) {
    throw new Error(`API error retrieving symbols`);
  }

  const symbolMap = new Map<number, SymbolData>();
  for (const symbol of Object.values(data.data)) {
    symbolMap.set(symbol.symbolID, symbol);
  }

  return symbolMap;
}

export interface EnrichedPosition extends PositionData {
  pairName: string;
  marginModeLabel: string;
  positionSideLabel: string;
  realizedPnlValue: number;
  tradingFee: number;
  closedSize: number;
  createdAtFormatted: string;
}

export async function enrichPositions(
  positions: PositionData[]
): Promise<EnrichedPosition[]> {
  const symbolMap = await fetchSymbols();

  return positions
    .filter((position) => {
      // Only include positions that were closed (have close price and closed size)
      const closedSize = parseFloat(position.cum_closed_size || '0');
      const closePrice = parseFloat(position.avg_close_price || '0');
      return closedSize > 0 && closePrice > 0;
    })
    .map((position) => {
      const symbol = symbolMap.get(position.symbol_id);
      const pairName = symbol?.name || `SYMBOL_${position.symbol_id}`;
      const marginModeLabel = position.margin_mode === 1 ? 'ISOLATED' : 'CROSS';
      
      // Handle position_side: 2 = LONG, 3 = SHORT (can be string or number)
      const positionSideValue = typeof position.position_side === 'string' 
        ? parseInt(position.position_side) 
        : position.position_side;
      const positionSideLabel = positionSideValue === 2 ? 'LONG' : positionSideValue === 3 ? 'SHORT' : 'UNKNOWN';
      
      const realizedPnlValue = parseFloat(position.realized_pnl || '0');
      const tradingFee = parseFloat(position.cum_trading_fee || '0');
      const closedSize = parseFloat(position.cum_closed_size || '0');
      const createdAtFormatted = new Date(position.created_at).toLocaleString();

      console.log('[v0] Enriching position:', {
        pairName,
        closedSize,
        realizedPnlValue,
        tradingFee,
        position_side: positionSideValue,
        positionSideLabel,
      });

      return {
        ...position,
        pairName,
        marginModeLabel,
        positionSideLabel,
        realizedPnlValue,
        tradingFee,
        closedSize,
        createdAtFormatted,
      };
    });
}

export interface OpenPositionData {
  symbol: string;
  positionId: string;
  contractType: string;
  positionType: string;
  positionSide: string; // LONG or SHORT
  positionSize: string;
  entryPrice: string;
  liquidationPrice: string;
  isolatedMargin: string;
  leverage: number;
  unrealizedProfit: string;
  realizedProfit: string;
  cumTradingFee: string;
  createdTime: number;
  updatedTime: number;
}

export interface BalanceData {
  coin: string;
  walletBalance: string;
  openOrderMarginFrozen: string;
  availableBalance: string;
}

export interface AccountDetailsData {
  positions: OpenPositionData[];
  balances: BalanceData[];
  isolatedMargin: string;
  crossMargin: string;
  availableMarginForIsolated: string;
  availableMarginForCross: string;
}

export interface AccountDetailsResponse {
  code: number;
  timestamp: number;
  data: AccountDetailsData;
}

export async function fetchAccountDetails(userId: string | number): Promise<AccountDetailsData> {
  const cacheKey = `accountDetails_${userId}`;
  
  return cacheManager.deduplicate(cacheKey, async () => {
    const url = `https://mainnet-gw.sodex.dev/futures/fapi/user/v1/public/account/details?accountId=${userId}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch account details: ${response.statusText}`);
    }

    const data: AccountDetailsResponse = await response.json();
    if (data.code !== 0) {
      throw new Error(`API error: Failed to fetch account details`);
    }

    console.log('[v0] Fetched account details - positions:', data.data.positions.length, 'balance:', data.data.balances[0]?.walletBalance);
    return data.data;
  });
}

export async function fetchOpenPositions(userId: string | number): Promise<OpenPositionData[]> {
  const accountData = await fetchAccountDetails(userId);
  return accountData.positions || [];
}

export interface SpotBalance {
  coin: string;
  balance: string;
  availableBalance: string;
}

export interface SpotBalanceResponse {
  code: number;
  data: {
    spotBalance: SpotBalance[];
    totalUsdtAmount: number;
  };
}

export async function fetchSpotBalance(userId: string | number): Promise<SpotBalance[]> {
  const cacheKey = `spotBalance_${userId}`;
  
  return cacheManager.deduplicate(cacheKey, async () => {
    const url = `https://mainnet-gw.sodex.dev/pro/p/user/balance/list?accountId=${userId}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch spot balance: ${response.statusText}`);
    }

    const data: SpotBalanceResponse = await response.json();
    if (data.code !== 0) {
      throw new Error(`API error: Failed to fetch spot balance`);
    }

    console.log('[v0] Fetched spot balance - tokens:', data.data.spotBalance.length);
    return data.data.spotBalance || [];
  });
}

export interface MarkPrice {
  s: string; // Symbol like "BTC-USD"
  p: string; // Price
  t: number; // Timestamp
}

export interface MarkPriceResponse {
  code: number;
  data: MarkPrice[];
}

export async function fetchMarkPrices(): Promise<MarkPrice[]> {
  const cacheKey = 'markPrices';
  
  return cacheManager.deduplicate(cacheKey, async () => {
    const url = `https://mainnet-gw.sodex.dev/futures/fapi/market/v1/public/q/mark-price`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch mark prices: ${response.statusText}`);
    }

    const data: MarkPriceResponse = await response.json();
    if (data.code !== 0) {
      throw new Error(`API error: Failed to fetch mark prices`);
    }

    console.log('[v0] Fetched mark prices - count:', data.data.length);
    return data.data || [];
  });
}

interface FallbackMarkPrice {
  symbol: string;
  markPrice: string;
}

interface FallbackMarkPriceResponse {
  code: number;
  data: FallbackMarkPrice[];
}

export async function fetchFallbackMarkPrices(): Promise<Map<string, number>> {
  const cacheKey = 'fallbackMarkPrices';
  
  return cacheManager.deduplicate(cacheKey, async () => {
    const url = `https://mainnet-gw.sodex.dev/api/v1/perps/markets/mark-prices`;
    
    const response = await fetch(url);
    if (!response.ok) {
      console.warn('[v0] Failed to fetch fallback mark prices:', response.statusText);
      return new Map();
    }

    const data: FallbackMarkPriceResponse = await response.json();
    if (data.code !== 0) {
      console.warn('[v0] Fallback API error:', data.code);
      return new Map();
    }

    // Create map of token -> price
    const fallbackPrices = new Map<string, number>();
    data.data.forEach((mp) => {
      // Extract token name from symbol (e.g., "SILVER-USD" -> "SILVER")
      const tokenName = mp.symbol.split('-')[0];
      fallbackPrices.set(tokenName, parseFloat(mp.markPrice));
    });

    console.log('[v0] Fetched fallback mark prices - count:', fallbackPrices.size);
    return fallbackPrices;
  });
}

// Normalize token name to match with mark prices
function normalizeTokenName(coin: string): string {
  // Remove "v" prefix
  let normalized = coin.startsWith('v') ? coin.slice(1) : coin;
  
  // Handle special cases
  if (normalized === 'SOSO' || normalized === 'WSOSO') return 'SOSO';
  if (normalized === 'MAG7.ssi') return 'MAG7';
  if (normalized === 'USDC') return 'USDC';
  
  return normalized;
}

export async function fetchDetailedBalance(userId: string | number): Promise<BalanceData> {
  const cacheKey = `detailedBalance_${userId}`;
  
  return cacheManager.deduplicate(cacheKey, async () => {
    try {
      const accountId = userId;

      // Fetch futures and spot balance in parallel
      const [futuresResponse, spotResponse] = await Promise.all([
        fetch(`https://mainnet-gw.sodex.dev/futures/fapi/user/v1/public/account/details?accountId=${accountId}`).then(r => r.json()),
        fetch(`https://mainnet-gw.sodex.dev/pro/p/user/balance/list?accountId=${accountId}`).then(r => r.json()),
      ]);

      // Validate API responses
      if (futuresResponse.code !== 0 || spotResponse.code !== 0) {
        throw new Error(`Failed to fetch balance data: futures code=${futuresResponse.code}, spot code=${spotResponse.code}`);
      }

      // Get futures balance (USDC wallet balance)
      const futuresBalance = parseFloat(futuresResponse.data?.balances?.[0]?.walletBalance || '0');
      console.log('[v0] Futures USDC balance:', futuresBalance);

      // Get spot balance from totalUsdtAmount (already calculated as USD)
      const spotBalance = parseFloat(spotResponse.data?.totalUsdtAmount || '0');
      console.log('[v0] Spot total USD balance:', spotBalance);

      // Process individual spot tokens for display
      const tokens: TokenBalance[] = [];
      if (spotResponse.data?.spotBalance && Array.isArray(spotResponse.data.spotBalance)) {
        spotResponse.data.spotBalance.forEach((tokenData: any) => {
          const balance = parseFloat(tokenData.balance || '0');
          if (balance > 0) {
            // Clean token name (remove v/w prefix)
            const cleanCoin = tokenData.coin.replace(/^[vw]/, '');
            
            // For spot tokens, we need to calculate USD value
            // We'll use the fact that totalUsdtAmount is the sum of all tokens
            // So we calculate each token's USD value based on available data
            const usdValue = parseFloat(tokenData.usdValue || '0');
            
            tokens.push({
              token: cleanCoin,
              coin: tokenData.coin,
              balance: balance,
              usdValue: usdValue > 0 ? usdValue : balance, // Use provided usdValue or fallback to balance
            });

            console.log('[v0] Token:', cleanCoin, 'balance:', balance, 'usdValue:', usdValue);
          }
        });
      }

      const totalUsdValue = spotBalance + futuresBalance;
      console.log('[v0] Total balance - Spot:', spotBalance, '+ Futures:', futuresBalance, '= Total:', totalUsdValue);

      return {
        totalUsdValue,
        tokens,
        futuresBalance,
        spotBalance,
      };
    } catch (err) {
      console.error('[v0] Error fetching detailed balance:', err);
      throw err;
    }
  });
}

export async function fetchTotalBalance(userId: string | number): Promise<{ spotBalance: number; futuresBalance: number; totalBalance: number }> {
  const cacheKey = `totalBalance_${userId}`;
  
  return cacheManager.deduplicate(cacheKey, async () => {
    try {
      // Fetch all data in parallel
      const [accountData, spotTokens, markPrices, fallbackPrices] = await Promise.all([
        fetchAccountDetails(userId),
        fetchSpotBalance(userId),
        fetchMarkPrices(),
        fetchFallbackMarkPrices(),
      ]);

      // Create a map of prices by symbol for quick lookup from primary API
      const primaryPriceMap = new Map<string, number>();
      markPrices.forEach((mp) => {
        const symbol = mp.s.split('-')[0]; // Remove "-USD" suffix
        primaryPriceMap.set(symbol, parseFloat(mp.p));
      });

      // Calculate spot balance in USD
      let spotBalanceUSD = 0;
      spotTokens.forEach((token) => {
        const normalized = normalizeTokenName(token.coin);
        const amount = parseFloat(token.balance);

        // First, try primary API
        let price = primaryPriceMap.get(normalized);

        // If not in primary API, try fallback API
        if (price === undefined) {
          price = fallbackPrices.get(normalized);
          if (price !== undefined) {
            console.log('[v0] Using fallback price for', normalized, ':', price);
          } else {
            // Not found in either API - skip this token
            console.log('[v0] Warning: Token', normalized, 'not found in either API, skipping');
            return;
          }
        }

        // Only add to balance if we found a price
        const usdValue = amount * price;
        spotBalanceUSD += usdValue;

        if (amount > 0) {
          console.log('[v0] Spot token:', token.coin, 'normalized:', normalized, 'amount:', amount, 'price:', price, 'usd:', usdValue);
        }
      });

      // Get futures balance (wallet balance)
      const futuresBalance = parseFloat(accountData.balances[0]?.walletBalance || '0');

      const totalBalance = spotBalanceUSD + futuresBalance;

      console.log('[v0] Balance calc - spot:', spotBalanceUSD, 'futures:', futuresBalance, 'total:', totalBalance);

      return {
        spotBalance: spotBalanceUSD,
        futuresBalance: futuresBalance,
        totalBalance: totalBalance,
      };
    } catch (err) {
      console.error('[v0] Error calculating total balance:', err);
      throw err;
    }
  });
}

export interface TokenBalance {
  token: string;
  coin: string;
  balance: number;
  usdValue: number;
}

export interface BalanceData {
  totalUsdValue: number;
  tokens: TokenBalance[];
  futuresBalance: number;
  spotBalance: number;
}

export interface PnLOverviewData {
  account_id: number;
  ts_ms: number;
  cumulative_pnl: string;
  cumulative_quote_volume: string;
  unrealized_pnl: string;
}

export async function fetchPnLOverview(
  userId: string | number
): Promise<PnLOverviewData> {
  const cacheKey = `pnl_overview_${userId}`;

  return cacheManager.deduplicate(cacheKey, async () => {
    const response = await fetch(`/api/perps/pnl-overview?account_id=${userId}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch PnL overview: ${response.statusText}`);
    }

    const result = await response.json();

    if (result.error) {
      throw new Error(result.error);
    }

    console.log('[v0] PnL overview fetched:', {
      volume: result.data.cumulative_quote_volume,
      fromCache: result.fromCache,
    });

    return result.data;
  });
}

export function getVolumeFromPnLOverview(
  pnlData: PnLOverviewData
): number {
  return parseFloat(pnlData.cumulative_quote_volume || '0');
}
