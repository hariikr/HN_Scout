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
    const response = await fetch(
      `${BASE_URL}/search?tags=story&page=${page}&hitsPerPage=${hitsPerPage}`,
      { 
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'max-age=60'
        }
      }
    )
    
    clearTimeout(timeoutId)
    
    if (!response.ok) {
      throw new Error(`Failed to fetch stories: ${response.statusText}`)
    }
    
    const data = await response.json()
    
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
    const response = await fetch(`${BASE_URL}/items/${id}`, {
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
    
    const data = await response.json()
    
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
 * Formula combines:
 * - Points (upvotes): Linear scaling with diminishing returns
 * - Comments: Engagement indicator with moderate weight
 * - Recency: Time decay factor to prioritize newer content
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
  
  // Recency boost (exponential decay over 48 hours)
  const recencyScore = Math.max(0, 50 * Math.exp(-hoursAgo / 24))
  
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