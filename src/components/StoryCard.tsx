import Link from 'next/link'
import { HNStory } from '@/types/hn'
import { calculateQualityScore, formatTimeAgo, extractDomain } from '@/lib/hn-api'

interface StoryCardProps {
  story: HNStory
  index: number
}

export function StoryCard({ story, index }: StoryCardProps) {
  const qualityScore = calculateQualityScore(story)
  const domain = extractDomain(story.url)
  const timeAgo = formatTimeAgo(story.created_at)
  
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
            <div className="flex items-center space-x-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span className="font-medium">{story.num_comments || 0}</span>
            </div>
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
        
        {/* Quality Score Breakdown - Hidden by default, shown on hover */}
        <div className="mt-4 pt-4 border-t border-slate-100 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Quality Breakdown:</span>
            <div className="flex items-center space-x-3">
              <span title="Points contribution">P: {qualityScore.breakdown.points}</span>
              <span title="Comments contribution">C: {qualityScore.breakdown.comments}</span>
              <span title="Recency boost">R: {qualityScore.breakdown.recency}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Subtle border accent */}
      <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left"></div>
    </article>
  )
}