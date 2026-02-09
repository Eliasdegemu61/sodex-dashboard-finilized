'use client'

import { useEffect, useState, useCallback, useMemo, memo } from 'react'
import { Card } from '@/components/ui/card'
import { useAnnouncement } from '@/context/announcement-context'

interface Article {
  id: number
  title: string
  created_at: string
  html_url: string
  body: string
}

// Global cache for announcements
let cachedAnnouncements: Article[] | null = null
let cacheTimestamp = 0
const CACHE_DURATION = 15 * 60 * 1000 // 15 minutes

const AnnouncementItem = memo(function AnnouncementItem({
  article,
  onNavigate,
}: {
  article: Article
  onNavigate: (id: number) => void
}) {
  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }, [])

  return (
    <div
      className="group cursor-pointer p-2 rounded hover:bg-secondary/50 transition-colors"
      onClick={() => onNavigate(article.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onNavigate(article.id)}
    >
      <p className="text-xs font-medium text-accent group-hover:text-accent/80 line-clamp-2 transition-colors">
        {article.title}
      </p>
      <p className="text-xs text-muted-foreground mt-1">{formatDate(article.created_at)}</p>
    </div>
  )
})

export function AnnouncementsPanel() {
  const { setSelectedArticleId } = useAnnouncement()
  const [announcements, setAnnouncements] = useState<Article[]>([])
  const [isLoading, setIsLoading] = useState(() => {
    const now = Date.now()
    return !(cachedAnnouncements && (now - cacheTimestamp) < CACHE_DURATION)
  })

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const now = Date.now()
        if (cachedAnnouncements && (now - cacheTimestamp) < CACHE_DURATION) {
          console.log('[v0] Using cached announcements from panel')
          setAnnouncements(cachedAnnouncements)
          setIsLoading(false)
          return
        }

        setIsLoading(true)

        const response = await fetch(
          'https://sodex-support.zendesk.com/api/v2/help_center/en-us/articles.json?page=1&per_page=100',
          {
            next: { revalidate: 900 }
          }
        )
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
        const data = await response.json()
        
        const sorted = (data.articles || []).sort(
          (a: Article, b: Article) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ).slice(0, 3)
        
        cachedAnnouncements = sorted
        cacheTimestamp = now
        setAnnouncements(sorted)
        setIsLoading(false)
      } catch (error) {
        console.error('[v0] Error fetching announcements:', error)
        setAnnouncements([])
        setIsLoading(false)
      }
    }

    fetchAnnouncements()
  }, [])

  const handleNavigate = useCallback((id: number) => {
    setSelectedArticleId(id)
  }, [setSelectedArticleId])

  const announcementItems = useMemo(() => {
    return announcements.map((article) => (
      <AnnouncementItem
        key={article.id}
        article={article}
        onNavigate={handleNavigate}
      />
    ))
  }, [announcements, handleNavigate])

  if (isLoading) {
    return (
      <Card className="p-4 bg-card border border-border">
        <h3 className="text-sm font-semibold mb-4">Latest Announcements</h3>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 bg-secondary/30 rounded animate-pulse w-32" />
              <div className="h-3 bg-secondary/30 rounded animate-pulse w-24" />
            </div>
          ))}
        </div>
      </Card>
    )
  }

  if (announcements.length === 0) {
    return (
      <Card className="p-4 bg-card border border-border">
        <h3 className="text-sm font-semibold mb-4">Latest Announcements</h3>
        <p className="text-xs text-muted-foreground">No announcements available</p>
      </Card>
    )
  }

  return (
    <Card className="p-4 bg-card border border-border">
      <h3 className="text-sm font-semibold mb-4">Latest Announcements</h3>
      <div className="space-y-3">
        {announcementItems}
      </div>
    </Card>
  )
}
