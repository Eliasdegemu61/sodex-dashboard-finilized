import { fetchAndProcessStats } from '@/lib/stats-service'

export const maxDuration = 60

export async function GET() {
  try {
    console.log('[v0] Cron job triggered')
    const stats = await fetchAndProcessStats()
    
    return Response.json({
      success: true,
      message: 'Stats updated successfully',
      timestamp: stats.timestamp,
      totalUsers: stats.totalUsers,
    })
  } catch (error) {
    console.error('[v0] Cron job error:', error)
    return Response.json(
      { success: false, error: 'Cron job failed' },
      { status: 500 }
    )
  }
}
