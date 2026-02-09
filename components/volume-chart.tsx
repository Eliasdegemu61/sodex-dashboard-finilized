'use client'

import { VolumeChartClient } from '@/components/volume-chart-client'
import { useState, useEffect } from 'react'

interface ChartDataPoint {
  day: string
  spot_vol: number
  futures_vol: number
  total_day_vol: number
}

export function VolumeChart() {
  const [chartData, setChartData] = useState<ChartDataPoint[] | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(
          'https://raw.githubusercontent.com/Eliasdegemu61/sodex-tracker-new-v1-data-2/main/volume_chart.json'
        )
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data: ChartDataPoint[] = await response.json()
        console.log('[v0] Fetched volume chart data:', data.length, 'records')
        setChartData(data)
      } catch (error) {
        console.error('[v0] Error fetching volume data:', error)
        setChartData(null)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  return <VolumeChartClient data={null} chartData={chartData} />
}
