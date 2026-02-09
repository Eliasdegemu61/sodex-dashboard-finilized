// Client-side API wrapper for server-side endpoints

interface CachedResponse {
  data?: unknown;
  fromCache?: boolean;
  error?: string;
}

export async function fetchRegistryFromServer(): Promise<Array<{ userId: string; address: string }>> {
  try {
    console.log('[v0] Fetching registry from server');
    const response = await fetch('/api/wallet/registry');
    
    if (!response.ok) {
      console.error('[v0] Registry fetch failed with status:', response.status);
      throw new Error(`Registry fetch failed: ${response.status}`);
    }

    const result: CachedResponse = await response.json();

    if (result.error) {
      console.error('[v0] Registry error:', result.error);
      throw new Error(result.error);
    }

    console.log('[v0] Registry fetched from server', { 
      fromCache: result.fromCache, 
      entries: (result.data as any[])?.length 
    });
    return result.data as Array<{ userId: string; address: string }>;
  } catch (error) {
    console.error('[v0] Failed to fetch registry:', error);
    throw error;
  }
}

export async function lookupWalletAddress(address: string): Promise<string> {
  try {
    console.log('[v0] Looking up wallet address:', address);
    const response = await fetch('/api/wallet/lookup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('[v0] Lookup failed with status:', response.status, error);
      throw new Error(error.error || `Lookup failed: ${response.status}`);
    }

    const result = await response.json();
    console.log('[v0] Wallet lookup successful', { 
      address, 
      userId: result.userId,
      fromCache: result.fromCache 
    });
    return result.userId;
  } catch (error) {
    console.error('[v0] Failed to lookup wallet:', error);
    throw error;
  }
}
