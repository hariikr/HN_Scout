import Link from 'next/link'
import { useState, useEffect, useMemo } from 'react'
import { HNStory, HNComment } from '@/types/hn'
import { calculateQualityScore, formatTimeAgo, extractDomain, getCommentsForStory, getRecencyStatus } from '@/lib/hn-api'

interface StoryCardProps {
  story: HNStory
  index: number
}

export function StoryCard({ story, index }: StoryCardProps) {
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState<HNComment[]>([])
  const [loadingComments, setLoadingComments] = useState(false)
  const [currentTime, setCurrentTime] = useState(Date.now())
  
  // Update time every minute to keep recency scores fresh
  // For very recent stories (HOT/TRENDING), update more frequently
  useEffect(() => {
    const now = Date.now()
    const createdAt = new Date(story.created_at).getTime()
    const hoursAgo = (now - createdAt) / (1000 * 60 * 60)
    
    // Update every 30 seconds for HOT stories (0-2h), every minute for others
    const updateInterval = hoursAgo <= 2 ? 30000 : 60000
    
    const interval = setInterval(() => {
      setCurrentTime(Date.now())
    }, updateInterval)
    
    return () => clearInterval(interval)
  }, [story.created_at])
  
  // Recalculate these values when time updates  
  const qualityScore = useMemo(() => {
    // Trigger recalculation when currentTime changes
    return calculateQualityScore(story);
  }, [story, currentTime])
  const domain = extractDomain(story.url)
  const timeAgo = useMemo(() => {
    // Trigger recalculation when currentTime changes
    return formatTimeAgo(story.created_at);
  }, [story.created_at, currentTime])
  const recencyStatus = useMemo(() => {
    // Trigger recalculation when currentTime changes
    return getRecencyStatus(story);
  }, [story, currentTime])

  // Load comments when expanded
  const loadComments = async () => {
    if (comments.length > 0) return // Already loaded
    
    setLoadingComments(true)
    try {
      const storyComments = await getCommentsForStory(story.objectID)
      setComments(storyComments.slice(0, 3)) // Show only top 3 comments
    } catch (error) {
      console.error('Error loading comments:', error)
    } finally {
      setLoadingComments(false)
    }
  }

  const toggleComments = () => {
    if (!showComments) {
      loadComments()
    }
    setShowComments(!showComments)
  }
  
  return (
    <article className="group relative bg-white rounded-xl border border-slate-200 hover:border-slate-300 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
      <div className="p-6">
        {/* Header with ranking and metrics */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 text-slate-600 text-sm font-semibold">
              {index + 1}
            </div>
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                Score: {qualityScore.score}
              </span>
              {/* Recency Status Badge */}
              {recencyStatus.status !== 'archive' && (
                <span 
                  className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border ${recencyStatus.color}`}
                  title={recencyStatus.description}
                >
                  <span className="mr-1">{recencyStatus.icon}</span>
                  {recencyStatus.label}
                  {/* Live update indicator for very recent stories */}
                  {(recencyStatus.status === 'hot' || recencyStatus.status === 'trending') && (
                    <span className="ml-1 relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-current"></span>
                    </span>
                  )}
                </span>
              )}
              {domain && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-600">
                  {domain}
                </span>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-4 text-sm text-slate-500">
            <div className="flex items-center space-x-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
              <span className="font-medium">{story.points || 0}</span>
            </div>
            <button
              onClick={toggleComments}
              className="flex items-center space-x-1 hover:text-blue-600 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span className="font-medium">{story.num_comments || 0}</span>
              <svg 
                className={`w-3 h-3 transition-transform ${showComments ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Title */}
        <h2 className="text-lg font-semibold text-slate-900 mb-3 leading-snug group-hover:text-blue-600 transition-colors duration-200">
          {story.url ? (
            <a 
              href={story.url}
              target="_blank"
              rel="noopener noreferrer"
              className="line-clamp-2"
            >
              {story.title}
            </a>
          ) : (
            <Link 
              href={`/item/${story.objectID}`}
              className="line-clamp-2"
            >
              {story.title}
            </Link>
          )}
        </h2>
        
        {/* Metadata */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 text-sm text-slate-600">
            <span className="font-medium">by {story.author}</span>
            <span>•</span>
            <time className="text-slate-500">{timeAgo}</time>
          </div>
          
          <Link 
            href={`/item/${story.objectID}`}
            className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors duration-200"
          >
            View Details
            <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
        
        {/* Quality Score Breakdown - Enhanced with recency info */}
        <div className="mt-4 pt-4 border-t border-slate-100 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span>Quality Breakdown:</span>
            <div className="flex items-center space-x-3">
              <span title="Points contribution">Points: {qualityScore.breakdown.points}</span>
              <span title="Comments contribution">Comments: {qualityScore.breakdown.comments}</span>
              <span 
                title={`Recency boost: ${recencyStatus.description}`}
                className={`font-medium ${recencyStatus.status !== 'archive' ? 'text-blue-600' : ''}`}
              >
                Recency: {qualityScore.breakdown.recency}
                {(recencyStatus.status === 'hot' || recencyStatus.status === 'trending') && (
                  <span className="ml-1 text-green-500" title="Live updating">●</span>
                )}
              </span>
            </div>
          </div>
          {/* Recency explanation */}
          {recencyStatus.status !== 'archive' && (
            <div className="text-xs text-slate-400 italic">
              {recencyStatus.icon} {recencyStatus.description}
              {(recencyStatus.status === 'hot' || recencyStatus.status === 'trending') && (
                <span className="ml-2 text-green-500">• Updating live</span>
              )}
            </div>
          )}
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="mt-4 pt-4 border-t border-slate-200">
            <div className="space-y-3">
              {loadingComments ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-sm text-gray-500">Loading comments...</span>
                </div>
              ) : comments.length > 0 ? (
                <>
                  {comments.map((comment) => (
                    <div key={comment.objectID} className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">{comment.author}</span>
                        <span className="text-xs text-gray-500">{formatTimeAgo(comment.created_at)}</span>
                      </div>
                      <div 
                        className="text-sm text-gray-600 line-clamp-3"
                        dangerouslySetInnerHTML={{ 
                          __html: comment.comment_text.length > 200 
                            ? comment.comment_text.substring(0, 200) + '...' 
                            : comment.comment_text 
                        }}
                      />
                    </div>
                  ))}
                  <div className="text-center">
                    <Link 
                      href={`/item/${story.objectID}`}
                      className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      View all {story.num_comments} comments
                      <svg className="ml-1 w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                </>
              ) : (
                <div className="text-sm text-gray-500 text-center py-2">
                  No comments available
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Subtle border accent */}
      <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left"></div>
    </article>
  )
}