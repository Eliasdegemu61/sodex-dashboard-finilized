import { cacheManager } from '@/lib/cache-manager'

export interface ZendeskArticle {
  id: number
  title: string
  body: string
  html_url: string
  created_at: string
  updated_at: string
  labels: string[]
}

const ZENDESK_ARTICLES_CACHE_KEY = 'zendesk_articles_list'

// Mock articles data
const mockArticles: ZendeskArticle[] = [
  {
    id: 1,
    title: 'SoDEX Protocol v2.0 Launch Announcement',
    body: 'We are excited to announce the launch of SoDEX Protocol v2.0 with major performance improvements and new trading features.',
    html_url: 'https://sodex-support.zendesk.com/articles/1',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    labels: ['Updates', 'Release'],
  },
  {
    id: 2,
    title: 'New Trading Pairs Now Available',
    body: 'We have added 10 new trading pairs including emerging market assets. Check out the full list in your dashboard.',
    html_url: 'https://sodex-support.zendesk.com/articles/2',
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    labels: ['Updates', 'Trading'],
  },
  {
    id: 3,
    title: 'Security Improvements and Bug Fixes',
    body: 'We have completed a comprehensive security audit and deployed several bug fixes to improve platform stability and user safety.',
    html_url: 'https://sodex-support.zendesk.com/articles/3',
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    labels: ['Updates', 'Security'],
  },
]

export async function fetchZendeskArticles(): Promise<ZendeskArticle[]> {
  return cacheManager.deduplicate(ZENDESK_ARTICLES_CACHE_KEY, async () => {
    return mockArticles
  })
}

export async function fetchArticleById(id: number): Promise<ZendeskArticle | null> {
  const cacheKey = `zendesk_article_${id}`
  return cacheManager.deduplicate(cacheKey, async () => {
    return mockArticles.find(a => a.id === id) || null
  })
}
