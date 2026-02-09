'use server'

import { fetchAndProcessStats } from '@/lib/stats-service'
import { fetchAndCacheVolumeData } from '@/lib/volume-service'

export interface DashboardData {
  stats: Awaited<ReturnType<typeof fetchAndProcessStats>>
  volumeData: Awaited<ReturnType<typeof fetchAndCacheVolumeData>>
}

export async function loadDashboardData(): Promise<DashboardData> {
  try {
    const [stats, volumeData] = await Promise.all([
      fetchAndProcessStats(),
      fetchAndCacheVolumeData(),
    ])

    return { stats, volumeData }
  } catch (error) {
    console.error('[v0] Error loading dashboard data:', error)
    throw error
  }
}
