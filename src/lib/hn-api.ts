import { HNStory, HNComment, HNSearchResponse, QualityScore } from '@/types/hn'

const BASE_URL = 'https://hn.algolia.com/api/v1'

// Cache for API responses to reduce redundant requests
const cache = new Map<string, { data: any; timestamp: number }>()
const CACHE_TTL = 60000 // 1 minute cache

export async function searchStories(page: number, hitsPerPage: number = 20): Promise<HNSearchResponse> {
  const cacheKey = `stories-${page}-${hitsPerPage}`
  const now = Date.now()
  
  // Check cache first
  const cached = cache.get(cacheKey)
  if (cached && (now - cached.timestamp) < CACHE_TTL) {
    return cached.data
  }
  
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 3000) // 3 second timeout
  
  try {
    // Get a mix of popular and recent stories
    // First, get recent stories (last 72 hours) - these will have recency boosts
    const recentCutoff = Math.floor((Date.now() - 72 * 60 * 60 * 1000) / 1000)
    
    const [popularResponse, recentResponse] = await Promise.all([
      // Popular stories (original behavior)
      fetch(
        `${BASE_URL}/search?tags=story&page=${page}&hitsPerPage=${Math.ceil(hitsPerPage * 0.7)}`,
        { 
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
            'Cache-Control': 'max-age=60'
          }
        }
      ),
      // Recent stories (last 72 hours)
      fetch(
        `${BASE_URL}/search_by_date?tags=story&numericFilters=created_at_i>${recentCutoff}&hitsPerPage=${Math.ceil(hitsPerPage * 0.3)}`,
        { 
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
            'Cache-Control': 'max-age=60'
          }
        }
      )
    ])
    
    clearTimeout(timeoutId)
    
    if (!popularResponse.ok || !recentResponse.ok) {
      throw new Error(`Failed to fetch stories: ${popularResponse.statusText || recentResponse.statusText}`)
    }
    
    const [popularData, recentData] = await Promise.all([
      popularResponse.json(),
      recentResponse.json()
    ])
    
    // Combine and deduplicate stories
    const allStories = [...popularData.hits, ...recentData.hits]
    const uniqueStories = allStories.filter((story, index, self) => 
      index === self.findIndex(s => s.objectID === story.objectID)
    )
    
    // Sort by quality score (which includes recency boost)
    const sortedStories = sortStoriesByQuality(uniqueStories)
    
    // Take the requested number of stories
    const finalStories = sortedStories.slice(0, hitsPerPage)
    
    const data = {
      hits: finalStories,
      page: popularData.page,
      nbPages: popularData.nbPages,
      hitsPerPage: hitsPerPage,
      nbHits: popularData.nbHits + recentData.nbHits
    }
    
    // Cache the response
    cache.set(cacheKey, { data, timestamp: now })
    
    return data
  } catch (error) {
    clearTimeout(timeoutId)
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout - please try again')
    }
    throw error
  }
}

export async function getStoryById(id: string): Promise<HNStory> {
  const cacheKey = `story-${id}`
  const now = Date.now()
  
  // Check cache first
  const cached = cache.get(cacheKey)
  if (cached && (now - cached.timestamp) < CACHE_TTL) {
    return cached.data
  }
  
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 2000) // 2 second timeout
  
  try {
    // Use search API with filters to get story with num_comments field
    const response = await fetch(`${BASE_URL}/search?tags=story&filters=objectID:${id}`, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'max-age=300' // 5 minutes for individual stories
      }
    })
    
    clearTimeout(timeoutId)
    
    if (!response.ok) {
      throw new Error(`Failed to fetch story: ${response.statusText}`)
    }
    
    const searchResult = await response.json()
    
    if (!searchResult.hits || searchResult.hits.length === 0) {
      throw new Error('Story not found')
    }
    
    const data = searchResult.hits[0] // Get the first (and only) result
    
    // Cache the response
    cache.set(cacheKey, { data, timestamp: now })
    
    return data
  } catch (error) {
    clearTimeout(timeoutId)
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout - please try again')
    }
    throw error
  }
}

export async function getCommentsForStory(storyId: string): Promise<HNComment[]> {
  const cacheKey = `comments-${storyId}`
  const now = Date.now()
  
  // Check cache first
  const cached = cache.get(cacheKey)
  if (cached && (now - cached.timestamp) < CACHE_TTL) {
    return cached.data
  }
  
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 2000) // 2 second timeout
  
  try {
    const response = await fetch(
      `${BASE_URL}/search?tags=comment,story_${storyId}&hitsPerPage=5`,
      {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'max-age=120' // 2 minutes for comments
        }
      }
    )
    
    clearTimeout(timeoutId)
    
    if (!response.ok) {
      throw new Error(`Failed to fetch comments: ${response.statusText}`)
    }
    
    const data = await response.json()
    const comments = data.hits
    
    // Cache the response
    cache.set(cacheKey, { data: comments, timestamp: now })
    
    return comments
  } catch (error) {
    clearTimeout(timeoutId)
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout - please try again')
    }
    throw error
  }
}

/**
 * Calculate quality score for a Hacker News story
 * 
 * Enhanced formula with improved recency boost:
 * - Points (upvotes): Linear scaling with diminishing returns
 * - Comments: Engagement indicator with moderate weight  
 * - Recency Boost: Multi-tier time decay to prioritize newer content
 *   * First 2 hours: 60 bonus points (hot stories)
 *   * 2-6 hours: 40 bonus points (trending stories)
 *   * 6-24 hours: Exponential decay from 40 to 10
 *   * 24-72 hours: Linear decay from 10 to 0
 * 
 * Score = (Points^0.8 * 2) + (Comments^0.6 * 1.5) + RecencyBoost
 */
export function calculateQualityScore(story: HNStory): QualityScore {
  const now = Date.now()
  const createdAt = new Date(story.created_at).getTime()
  const hoursAgo = (now - createdAt) / (1000 * 60 * 60)
  
  // Points contribution (diminishing returns to prevent outliers)
  const pointsScore = Math.pow(Math.max(story.points || 0, 1), 0.8) * 2
  
  // Comments contribution (engagement indicator)
  const commentsScore = Math.pow(Math.max(story.num_comments || 0, 1), 0.6) * 1.5
  
  // Enhanced Recency boost with multi-tier system
  let recencyScore = 0
  if (hoursAgo <= 2) {
    // 🔥 HOT: First 2 hours get maximum boost
    recencyScore = 60
  } else if (hoursAgo <= 6) {
    // 📈 TRENDING: 2-6 hours get high boost  
    recencyScore = 40
  } else if (hoursAgo <= 24) {
    // ⏰ RECENT: 6-24 hours exponential decay
    recencyScore = 40 * Math.exp(-(hoursAgo - 6) / 12) + 10
  } else if (hoursAgo <= 72) {
    // 📰 AGING: 24-72 hours linear decay
    recencyScore = Math.max(0, 10 * (1 - (hoursAgo - 24) / 48))
  } else {
    // 📜 OLD: Beyond 72 hours no boost
    recencyScore = 0
  }
  
  const totalScore = pointsScore + commentsScore + recencyScore
  
  return {
    score: Math.round(totalScore * 10) / 10,
    breakdown: {
      points: Math.round(pointsScore * 10) / 10,
      comments: Math.round(commentsScore * 10) / 10,
      recency: Math.round(recencyScore * 10) / 10
    }
  }
}

export function sortStoriesByQuality(stories: HNStory[]): HNStory[] {
  return stories
    .map(story => ({
      ...story,
      qualityScore: calculateQualityScore(story)
    }))
    .sort((a, b) => b.qualityScore.score - a.qualityScore.score)
}

/**
 * Get recency status and visual indicator for a story
 * Returns status info for UI display with special categories for viral content
 */
export function getRecencyStatus(story: HNStory): {
  status: 'hot' | 'trending' | 'recent' | 'aging' | 'classic' | 'viral' | 'archive'
  label: string
  icon: string
  color: string
  description: string
  priority: number
} {
  const now = Date.now()
  const createdAt = new Date(story.created_at).getTime()
  const hoursAgo = (now - createdAt) / (1000 * 60 * 60)
  const points = story.points || 0
  const comments = story.num_comments || 0
  
  // Special categories for old but highly engaged content
  if (hoursAgo > 72) {
    // Viral content: Very high engagement (5000+ points OR 2000+ comments)
    if (points >= 5000 || comments >= 2000) {
      return {
        status: 'viral',
        label: 'VIRAL',
        icon: '🚀',
        color: 'text-purple-600 bg-purple-50 border-purple-300',
        description: 'Legendary viral story with massive engagement',
        priority: 1
      }
    }
    // Classic content: High engagement (1000+ points OR 500+ comments)
    else if (points >= 1000 || comments >= 500) {
      return {
        status: 'classic',
        label: 'CLASSIC',
        icon: '⭐',
        color: 'text-yellow-600 bg-yellow-50 border-yellow-300',
        description: 'Classic story with significant historical engagement',
        priority: 2
      }
    }
    // Regular archive
    else {
      return {
        status: 'archive',
        label: 'ARCHIVE',
        icon: '📜',
        color: 'text-gray-500 bg-gray-50 border-gray-200',
        description: 'Archived story from more than 3 days ago',
        priority: 6
      }
    }
  }
  
  // Time-based categories for recent content
  if (hoursAgo <= 2) {
    return {
      status: 'hot',
      label: 'HOT',
      icon: '🔥',
      color: 'text-red-600 bg-red-50 border-red-300',
      description: 'Breaking news! Posted within the last 2 hours',
      priority: 0
    }
  } else if (hoursAgo <= 6) {
    return {
      status: 'trending',
      label: 'TRENDING',
      icon: '📈',
      color: 'text-orange-600 bg-orange-50 border-orange-300',
      description: 'Trending story from the last 6 hours',
      priority: 1
    }
  } else if (hoursAgo <= 24) {
    return {
      status: 'recent',
      label: 'RECENT',
      icon: '⏰',
      color: 'text-blue-600 bg-blue-50 border-blue-300',
      description: 'Fresh story from today',
      priority: 3
    }
  } else if (hoursAgo <= 72) {
    return {
      status: 'aging',
      label: 'AGING',
      icon: '📰',
      color: 'text-gray-600 bg-gray-50 border-gray-200',
      description: 'Story from the last few days',
      priority: 4
    }
  }
  
  // Fallback (shouldn't reach here due to above logic)
  return {
    status: 'archive',
    label: 'ARCHIVE',
    icon: '📜',
    color: 'text-gray-500 bg-gray-50 border-gray-200',
    description: 'Archived story',
    priority: 6
  }
}

// Utility to clear cache when needed
export function clearCache() {
  cache.clear()
}

// Utility to get cache size
export function getCacheSize() {
  return cache.size
}

export function formatTimeAgo(dateString: string): string {
  const now = Date.now()
  const createdAt = new Date(dateString).getTime()
  const diffMs = now - createdAt
  
  const minutes = Math.floor(diffMs / (1000 * 60))
  const hours = Math.floor(diffMs / (1000 * 60 * 60))
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''} ago`
  } else if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''} ago`
  } else if (minutes > 0) {
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
  } else {
    return 'Just now'
  }
}

export function extractDomain(url?: string): string {
  if (!url) return ''
  
  try {
    const domain = new URL(url).hostname
    return domain.replace('www.', '')
  } catch {
    return ''
  }
}