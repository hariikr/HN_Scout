import { GetServerSideProps } from 'next'
import Link from 'next/link'
import { useState, useEffect, useMemo } from 'react'
import { HNStory, HNComment } from '@/types/hn'
import { getStoryById, getCommentsForStory, calculateQualityScore, formatTimeAgo, extractDomain, getRecencyStatus } from '@/lib/hn-api'
import { ErrorState } from '@/components/LoadingStates'

interface PageProps {
  story: HNStory | null
  comments: HNComment[]
  storyId: string
  error?: string
}

export default function ItemPage({ story, comments, storyId, error }: PageProps) {
  const [isInReadingList, setIsInReadingList] = useState(false)
  const [currentTime, setCurrentTime] = useState(Date.now())

  // Update time every minute to keep recency scores fresh
  // For very recent stories (HOT/TRENDING), update more frequently
  useEffect(() => {
    if (!story) return
    
    const now = Date.now()
    const createdAt = new Date(story.created_at).getTime()
    const hoursAgo = (now - createdAt) / (1000 * 60 * 60)
    
    // Update every 30 seconds for HOT stories (0-2h), every minute for others
    const updateInterval = hoursAgo <= 2 ? 30000 : 60000
    
    const interval = setInterval(() => {
      setCurrentTime(Date.now())
    }, updateInterval)
    
    return () => clearInterval(interval)
  }, [story])

  // 💡 Reading List Functions - Save posts locally in browser
  const getReadingList = (): HNStory[] => {
    if (typeof window === 'undefined') return []
    const saved = localStorage.getItem('hn-reading-list')
    return saved ? JSON.parse(saved) : []
  }

  const saveToReadingList = (story: HNStory) => {
    const readingList = getReadingList()
    const exists = readingList.find(item => item.objectID === story.objectID)
    
    if (!exists) {
      // 💾 Store complete post details in browser's localStorage
      readingList.push(story)
      localStorage.setItem('hn-reading-list', JSON.stringify(readingList))
      setIsInReadingList(true)
    }
  }

  const removeFromReadingList = (storyId: string) => {
    const readingList = getReadingList()
    const filtered = readingList.filter(item => item.objectID !== storyId)
    localStorage.setItem('hn-reading-list', JSON.stringify(filtered))
    setIsInReadingList(false)
  }

  // 🧠 Check if current story is already saved on page load
  useEffect(() => {
    if (story) {
      const readingList = getReadingList()
      setIsInReadingList(readingList.some(item => item.objectID === story.objectID))
    }
  }, [story])

  if (error || !story) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100">
        <div className="container mx-auto px-4 py-8">
          <header className="text-center mb-8">
            <Link href="/" className="inline-block group">
              <div className="relative mb-4">
                <div className="flex items-center justify-center space-x-3 px-6 py-4 bg-white/80 backdrop-blur-xl rounded-2xl border border-white/30 shadow-xl group-hover:shadow-2xl transition-all duration-300">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-500 via-red-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                    <span className="text-2xl">👾</span>
                  </div>
                  <h1 className="text-3xl font-black bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 bg-clip-text text-transparent tracking-tight">
                    HN Scout
                  </h1>
                </div>
              </div>
            </Link>
          </header>
          <ErrorState message={error || 'Story not found'} />
        </div>
      </div>
    )
  }

  const qualityScore = useMemo(() => calculateQualityScore(story), [story, currentTime])
  const domain = extractDomain(story.url)
  const timeAgo = useMemo(() => formatTimeAgo(story.created_at), [story.created_at, currentTime])
  const recencyStatus = useMemo(() => getRecencyStatus(story), [story, currentTime])
  const hnUrl = `https://news.ycombinator.com/item?id=${story.objectID || storyId}`

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <Link href="/" className="inline-block group">
            <div className="relative mb-4">
              <div className="flex items-center justify-center space-x-3 px-6 py-4 bg-white/80 backdrop-blur-xl rounded-2xl border border-white/30 shadow-xl group-hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 via-red-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-2xl group-hover:scale-110 transition-transform duration-300">👾</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 bg-clip-text text-transparent tracking-tight">
                  HN Scout
                </h1>
              </div>
            </div>
          </Link>
          <nav className="text-sm text-gray-600">
            <Link href="/1" className="hover:text-orange-600 transition-colors">
              Stories
            </Link>
            <span className="mx-2">→</span>
            <span>Story Details</span>
          </nav>
        </header>

        <main className="max-w-4xl mx-auto">
          <article className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <header className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <span className="bg-blue-100 text-blue-700 text-sm font-medium px-3 py-1 rounded-full">
                    Quality Score: {qualityScore.score}
                  </span>
                  {/* Recency Status Badge */}
                  {recencyStatus.status !== 'archive' && (
                    <span 
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${recencyStatus.color}`}
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
                    <span className="text-gray-500 text-sm bg-gray-100 px-3 py-1 rounded-full">
                      {domain}
                    </span>
                  )}
                </div>
              </div>
              
              <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4 leading-tight">
                {story.title}
              </h1>
              
              <div className="flex items-center justify-between text-gray-600">
                <div className="flex items-center space-x-4">
                  <span className="font-medium">by {story.author}</span>
                  <span>{timeAgo}</span>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="flex items-center bg-green-50 text-green-700 px-3 py-1 rounded-full">
                    ▲ {story.points || 0} points
                  </span>
                  <span className="flex items-center bg-blue-50 text-blue-700 px-3 py-1 rounded-full">
                    💬 {story.num_comments || 0} comments
                  </span>
                </div>
              </div>
            </header>

            {story.story_text && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div 
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: story.story_text }}
                />
              </div>
            )}

            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <div className="flex items-center space-x-4">
                {story.url && (
                  <a
                    href={story.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-opacity-50"
                  >
                    Read Full Story →
                  </a>
                )}
                <a
                  href={hnUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-orange-100 hover:bg-orange-200 text-orange-700 font-medium py-2 px-4 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-opacity-50"
                >
                  View on HN
                </a>
                
                {/* 💡 Reading List Button - Personal bookmark system */}
                <button
                  onClick={() => isInReadingList ? removeFromReadingList(story.objectID || storyId) : saveToReadingList(story)}
                  className={`font-medium py-2 px-4 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-opacity-50 ${
                    isInReadingList
                      ? 'bg-green-100 hover:bg-green-200 text-green-700 focus:ring-green-400'
                      : 'bg-blue-100 hover:bg-blue-200 text-blue-700 focus:ring-blue-400'
                  }`}
                  title={isInReadingList ? 'Remove from Reading List' : 'Save to Reading List - Stored locally in your browser'}
                >
                  {isInReadingList ? '✓ Saved for Later' : '🔖 Save for Later'}
                </button>
              </div>
              
              <div className="flex items-center space-x-3 text-xs text-gray-500">
                <span title="Points contribution" className="bg-gray-100 px-2 py-1 rounded">
                  Points: {qualityScore.breakdown.points}
                </span>
                <span title="Comments contribution" className="bg-gray-100 px-2 py-1 rounded">
                  Comments: {qualityScore.breakdown.comments}
                </span>
                <span 
                  title={`Recency boost: ${recencyStatus.description}`}
                  className={`px-2 py-1 rounded ${recencyStatus.status !== 'archive' ? 'bg-blue-100 text-blue-700 font-medium' : 'bg-gray-100'}`}
                >
                  Recency: {qualityScore.breakdown.recency}
                  {(recencyStatus.status === 'hot' || recencyStatus.status === 'trending') && (
                    <span className="ml-1 text-green-500" title="Live updating">●</span>
                  )}
                </span>
              </div>
            </div>
          </article>

          {comments.length > 0 && (
            <section className="bg-white rounded-lg shadow-lg p-8">
              <header className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  Comments ({comments.length})
                </h2>
                <p className="text-gray-600 text-sm">
                  Showing recent comments from this discussion.
                  <a 
                    href={hnUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-orange-600 hover:text-orange-700 ml-1"
                  >
                    View all on Hacker News →
                  </a>
                </p>
              </header>

              <div className="space-y-6">
                {comments.map((comment) => (
                  <article key={comment.objectID} className="border-l-4 border-orange-200 pl-4 bg-gray-50 p-4 rounded-lg">
                    <header className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-800">{comment.author}</span>
                        <span className="text-gray-500 text-sm">
                          {formatTimeAgo(comment.created_at)}
                        </span>
                      </div>
                    </header>
                    <div 
                      className="prose prose-sm max-w-none text-gray-700"
                      dangerouslySetInnerHTML={{ __html: comment.comment_text }}
                    />
                  </article>
                ))}
                
                {comments.length > 0 && (
                  <div className="text-center pt-4 border-t border-gray-200">
                    <a
                      href={hnUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center bg-orange-100 hover:bg-orange-200 text-orange-700 font-medium py-2 px-4 rounded-lg transition-colors"
                    >
                      💬 Join the discussion on Hacker News
                      <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                )}
              </div>
            </section>
          )}

          {comments.length === 0 && (
            <section className="bg-white rounded-lg shadow-lg p-8 text-center">
              <div className="text-gray-500">
                <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-600 mb-2">No Comments Yet</h3>
                <p className="text-gray-500 mb-4">Be the first to join the discussion!</p>
                <a
                  href={hnUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  💬 Start the conversation on HN
                  <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            </section>
          )}
        </main>

        <footer className="text-center mt-12 text-sm text-gray-500">
          <p>
            Data from <a href="https://hn.algolia.com/api" target="_blank" rel="noopener noreferrer" className="text-orange-600 hover:text-orange-700">Hacker News API</a>
          </p>
        </footer>
      </div>
    </div>
  )
}

export const getServerSideProps: GetServerSideProps<PageProps> = async (context) => {
  const id = context.params?.id as string

  try {
    const [story, comments] = await Promise.all([
      getStoryById(id),
      getCommentsForStory(id)
    ])
    
    return {
      props: {
        story,
        comments,
        storyId: id,
      },
    }
  } catch (error) {
    console.error('Error fetching story data:', error)
    
    return {
      props: {
        story: null,
        comments: [],
        storyId: id,
        error: 'Failed to load story. Please try again later.',
      },
    }
  }
}