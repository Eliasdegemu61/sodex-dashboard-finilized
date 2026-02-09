'use client';

import { useEffect, useState } from 'react'

interface CachedData {
  data: any
  timestamp: number
}

// In-memory cache with automatic invalidation
const cache = new Map<string, CachedData>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

// Track in-flight requests to deduplicate
const pendingRequests = new Map<string, Promise<any>>()

export function useSharedData(url: string) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        // Check if data is cached and valid
        const cached = cache.get(url)
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
          console.log('[v0] Using cached data for:', url)
          setData(cached.data)
          setLoading(false)
          return
        }

        // Check if request is already in flight
        if (pendingRequests.has(url)) {
          console.log('[v0] Using pending request for:', url)
          const result = await pendingRequests.get(url)
          setData(result)
          setLoading(false)
          return
        }

        // Make the request and cache it
        const promise = fetch(url).then(async (response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
          }
          return response.json()
        })

        pendingRequests.set(url, promise)

        const result = await promise
        cache.set(url, { data: result, timestamp: Date.now() })
        pendingRequests.delete(url)

        console.log('[v0] Fetched and cached data for:', url)
        setData(result)
        setError(null)
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err))
        console.error('[v0] Error fetching shared data:', error)
        setError(error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [url])

  return { data, loading, error }
}
