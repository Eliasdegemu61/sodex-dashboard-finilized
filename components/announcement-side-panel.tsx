'use client'

import React from "react"

import { useEffect, useState, useCallback } from 'react'
import { X, Loader2 } from 'lucide-react'
import { useAnnouncement } from '@/context/announcement-context'

interface Article {
  id: number
  title: string
  created_at: string
  body: string
}

// Cache articles
const articleCache = new Map<string, { data: Article; timestamp: number }>()
const CACHE_TTL = 10 * 60 * 1000

export function AnnouncementSidePanel() {
  const { selectedArticleId, setSelectedArticleId } = useAnnouncement()
  const [article, setArticle] = useState<Article | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!selectedArticleId) {
      setArticle(null)
      setError(null)
      return
    }

    const fetchArticle = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Check cache
        const cached = articleCache.get(String(selectedArticleId))
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
          console.log('[v0] Using cached article')
          setArticle(cached.data)
          setIsLoading(false)
          return
        }

        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 8000)

        const response = await fetch(
          `https://sodex-support.zendesk.com/api/v2/help_center/en-us/articles/${selectedArticleId}.json`,
          { 
            signal: controller.signal,
            next: { revalidate: 600 }
          }
        )

        clearTimeout(timeoutId)

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        const article = data.article

        // Cache it
        articleCache.set(String(selectedArticleId), { data: article, timestamp: Date.now() })
        setArticle(article)
      } catch (error) {
        console.error('[v0] Error fetching article:', error)
        setError(error instanceof Error ? error.message : 'Failed to load article')
        setArticle(null)
      } finally {
        setIsLoading(false)
      }
    }

    fetchArticle()
  }, [selectedArticleId])

  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }, [])

  const handleClose = useCallback(() => {
    setSelectedArticleId(null)
  }, [setSelectedArticleId])

  // Backdrop click handler
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose()
    }
  }

  return (
    <>
      {/* Backdrop */}
      {selectedArticleId && (
        <div
          className="fixed inset-0 bg-black/50 z-40 transition-opacity"
          onClick={handleBackdropClick}
        />
      )}

      {/* Side Panel */}
      <div
        className={`fixed right-0 top-0 h-full w-full md:w-96 bg-background border-l border-border z-50 transition-transform duration-300 ease-out ${
          selectedArticleId ? 'translate-x-0' : 'translate-x-full'
        } overflow-y-auto`}
      >
        {/* Header */}
        <div className="sticky top-0 bg-background border-b border-border p-4 flex items-center justify-between z-10">
          <h2 className="text-sm font-semibold text-foreground truncate">Latest Announcements</h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-secondary rounded transition-colors"
            aria-label="Close announcement"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {isLoading ? (
            <div className="space-y-4">
              <div className="h-6 bg-secondary/30 rounded animate-pulse w-4/5" />
              <div className="h-4 bg-secondary/30 rounded animate-pulse w-32" />
              <div className="space-y-2">
                <div className="h-4 bg-secondary/30 rounded animate-pulse w-full" />
                <div className="h-4 bg-secondary/30 rounded animate-pulse w-full" />
                <div className="h-4 bg-secondary/30 rounded animate-pulse w-3/4" />
              </div>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded">
              <p className="text-xs text-red-400">{error}</p>
            </div>
          ) : article ? (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-semibold text-foreground mb-2">{article.title}</h3>
                <p className="text-xs text-muted-foreground">{formatDate(article.created_at)}</p>
              </div>
              
              <div className="h-px bg-border" />

              <div className="prose prose-invert max-w-none text-sm">
                <div
                  className="text-foreground leading-relaxed space-y-4"
                  dangerouslySetInnerHTML={{ __html: article.body }}
                />
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </>
  )
}
