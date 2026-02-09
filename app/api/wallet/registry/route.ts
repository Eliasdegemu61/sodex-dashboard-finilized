import { NextRequest, NextResponse } from 'next/server';
import { cacheManager } from '@/lib/cache';

const CACHE_DURATION = 3600; // 1 hour
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

interface RegistryUser {
  userId: string;
  address: string;
}

export async function GET(request: NextRequest) {
  try {
    const cacheKey = 'github_registry';

    // Try to get from cache first
    const cached = await cacheManager.get(cacheKey);
    if (cached) {
      console.log('[v0] Registry served from cache');
      return NextResponse.json({ data: cached, fromCache: true });
    }

    console.log('[v0] Fetching registry from GitHub, token available:', !!GITHUB_TOKEN);

    // Fetch from GitHub with token for better rate limits
    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github.v3.raw',
      'User-Agent': 'Sodex-Tracker',
    };

    if (GITHUB_TOKEN) {
      headers['Authorization'] = `token ${GITHUB_TOKEN}`;
    }

    const response = await fetch(
      'https://raw.githubusercontent.com/Eliasdegemu61/Sodex-Tracker-new-v1/main/registry.json',
      { 
        headers,
        cache: 'no-store'
      }
    );

    if (!response.ok) {
      console.error('[v0] GitHub API error:', response.status, response.statusText);
      return NextResponse.json(
        { error: `Failed to fetch registry: ${response.statusText}` },
        { status: response.status }
      );
    }

    const data: RegistryUser[] = await response.json();
    console.log('[v0] Registry fetched successfully, entries:', data.length);

    // Cache the result
    await cacheManager.set(cacheKey, data, CACHE_DURATION);

    return NextResponse.json({ data, fromCache: false });
  } catch (error) {
    console.error('[v0] Registry fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch registry from GitHub' },
      { status: 500 }
    );
  }
}
