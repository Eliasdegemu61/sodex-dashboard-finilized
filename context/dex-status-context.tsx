'use client'

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'

export interface ComprehensiveDexData {
  dexStatus: {
    totalUsers: number
    usersInProfit: number
    usersInLoss: number
    totalVolume: number
    spotVolume: number
    perpVolume: number
    spotVsPerpsRatio: { spot: number; perps: number }
    topGainers: Array<{ userId: string; address: string; pnl: number; vol: number }>
    topLosers: Array<{ userId: string; address: string; pnl: number; vol: number }>
    pnlByVolumeRange: Array<{ range: string; avgPnl: number; count: number }>
    overallProfitEfficiency: { profitUsers: number; avgProfit: number; avgLoss: number }
    todayTopPairs: Array<{ pair: string; volume: number }>
    allTimeTopPairs: Array<{ pair: string; volume: number }>
    topTradersSpot: Array<{ address: string; volume: number; rank: number }>
    topTradersPrerps: Array<{ address: string; volume: number; rank: number }>
  }
  leaderboards: {
    perpsLeaderboard: Array<{ userId: string; address: string; pnl: string; vol: string }>
    spotLeaderboard: Array<{ address: string; vol: number }>
  }
  lastUpdated: number
}

interface DexStatusContextType {
  dexData: ComprehensiveDexData | null
  isLoading: boolean
  fetchDexData: () => Promise<void>
  clearCache: () => void
}

const DexStatusContext = createContext<DexStatusContextType | undefined>(undefined)

export function DexStatusProvider({ children }: { children: ReactNode }) {
  const [dexData, setDexData] = useState<ComprehensiveDexData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [lastFetchTime, setLastFetchTime] = useState<number | null>(null)

  const CACHE_DURATION = 10 * 60 * 1000 // 10 minutes client-side cache

  const fetchDexData = useCallback(async () => {
    const now = Date.now()
    
    // Check if we have valid cached data (less than 10 minutes old)
    if (dexData && lastFetchTime && (now - lastFetchTime) < CACHE_DURATION) {
      console.log('[v0] Using cached Dex Data (age:', Math.round((now - lastFetchTime) / 1000), 'seconds)')
      return
    }

    try {
      setIsLoading(true)

      // Fetch pre-calculated comprehensive data from server
      const response = await fetch('/api/cache/comprehensive')
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data: ComprehensiveDexData = await response.json()

      setDexData(data)
      setLastFetchTime(now)
      
      console.log('[v0] Fetched comprehensive Dex Data from server cache (fromCache:', data.fromCache, ')')
    } catch (error) {
      console.error('[v0] Error fetching Dex Data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [dexData, lastFetchTime])

  const clearCache = useCallback(() => {
    setDexData(null)
    setLastFetchTime(null)
    console.log('[v0] Cleared Dex Data cache')
  }, [])

  return (
    <DexStatusContext.Provider value={{ dexData, isLoading, fetchDexData, clearCache }}>
      {children}
    </DexStatusContext.Provider>
  )
}

export function useDexStatus() {
  const context = useContext(DexStatusContext)
  if (context === undefined) {
    throw new Error('useDexStatus must be used within a DexStatusProvider')
  }
  return context
}
