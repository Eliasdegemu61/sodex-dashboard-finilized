import { NextRequest, NextResponse } from 'next/server';
import { cacheManager } from '@/lib/cache';

interface RegistryUser {
  userId: string;
  address: string;
}

const CACHE_DURATION = 3600; // 1 hour
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

export async function POST(request: NextRequest) {
  try {
    const { address } = await request.json();

    if (!address || typeof address !== 'string') {
      return NextResponse.json(
        { error: 'Address is required and must be a string' },
        { status: 400 }
      );
    }

    const normalizedAddress = address.toLowerCase().trim();
    const cacheKey = `wallet_lookup_${normalizedAddress}`;

    console.log('[v0] Looking up wallet address:', normalizedAddress);

    // Try to get from cache first
    const cached = await cacheManager.get(cacheKey);
    if (cached) {
      console.log('[v0] Wallet lookup cache HIT:', normalizedAddress);
      return NextResponse.json({ userId: cached, fromCache: true });
    }

    console.log('[v0] Wallet lookup cache MISS, fetching registry from GitHub...');

    // Fetch registry directly from GitHub
    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github.v3.raw',
      'User-Agent': 'Sodex-Tracker',
    };

    if (GITHUB_TOKEN) {
      headers['Authorization'] = `token ${GITHUB_TOKEN}`;
    }

    const registryResponse = await fetch(
      'https://raw.githubusercontent.com/Eliasdegemu61/Sodex-Tracker-new-v1/main/registry.json',
      {
        headers,
        cache: 'no-store'
      }
    );

    if (!registryResponse.ok) {
      console.error('[v0] GitHub API error:', registryResponse.status, registryResponse.statusText);
      return NextResponse.json(
        { error: `Failed to fetch registry: ${registryResponse.statusText}` },
        { status: registryResponse.status }
      );
    }

    const registry: RegistryUser[] = await registryResponse.json();

    console.log('[v0] Registry loaded, searching for address in', registry.length, 'entries');

    const user = registry.find(
      (u) => u.address.toLowerCase() === normalizedAddress
    );

    if (!user) {
      console.warn('[v0] Address not found in registry:', normalizedAddress);
      return NextResponse.json(
        { error: `Address ${address} not found in registry. Please ensure you have the correct address.` },
        { status: 404 }
      );
    }

    console.log('[v0] Address matched to userId:', user.userId);

    // Cache the result
    await cacheManager.set(cacheKey, user.userId, CACHE_DURATION);

    return NextResponse.json({ userId: user.userId, fromCache: false });
  } catch (error) {
    console.error('[v0] Wallet lookup error:', error);
    return NextResponse.json(
      { error: 'Failed to lookup wallet' },
      { status: 500 }
    );
  }
}
