import { useState, useEffect } from 'react'
import Link from 'next/link'
import { HNStory } from '@/types/hn'
import { calculateQualityScore, formatTimeAgo, extractDomain } from '@/lib/hn-api'
import { EmptyState } from '@/components/LoadingStates'

export default function ReadingListPage() {
  const [readingList, setReadingList] = useState<HNStory[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // 💡 Load saved posts from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('hn-reading-list')
      setReadingList(saved ? JSON.parse(saved) : [])
    }
    setIsLoading(false)
  }, [])

  // 🗑️ Remove post from reading list
  const removeFromReadingList = (storyId: string) => {
    const filtered = readingList.filter(item => item.objectID !== storyId)
    setReadingList(filtered)
    localStorage.setItem('hn-reading-list', JSON.stringify(filtered))
  }

  // 🧹 Clear all saved posts
  const clearAllPosts = () => {
    setReadingList([])
    localStorage.removeItem('hn-reading-list')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-12">
          <Link href="/" className="inline-block group">
            <div className="flex items-center justify-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300">
                <span className="text-2xl">👾</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                👾HN Scout
              </h1>
            </div>
          </Link>
          
          <nav className="text-sm text-gray-600 mb-6">
            <Link href="/1" className="hover:text-blue-600 transition-colors">
              Stories
            </Link>
            <span className="mx-2">→</span>
            <span className="text-blue-600 font-medium">Reading List</span>
          </nav>

          <div className="max-w-2xl mx-auto bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl p-6">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <span className="text-2xl">📚</span>
              <h2 className="text-2xl font-bold text-gray-800">Your Reading List</h2>
            </div>
            <p className="text-gray-600 text-sm">
              {readingList.length === 0 
                ? "💡 Save interesting posts to read them later. "
                : `📖 ${readingList.length} post${readingList.length === 1 ? '' : 's'} saved for later reading`
              }
            </p>
            
            {readingList.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <button
                  onClick={clearAllPosts}
                  className="text-sm text-red-600 hover:text-red-700 font-medium transition-colors"
                >
                  🧹 Clear All Posts
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="max-w-5xl mx-auto">
          {readingList.length === 0 ? (
            <div className="text-center">
              <EmptyState message="No posts saved yet" />
              <div className="mt-6">
                <Link 
                  href="/1"
                  className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
                >
                  <span className="mr-2">📰</span>
                  Browse Stories
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {readingList.map((story, index) => {
                const qualityScore = calculateQualityScore(story)
                const domain = extractDomain(story.url)
                const timeAgo = formatTimeAgo(story.created_at)
                
                return (
                  <article 
                    key={story.objectID} 
                    className="group relative bg-white rounded-xl border border-slate-200 hover:border-slate-300 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
                  >
                    <div className="p-6">
                      {/* Header with ranking and metrics */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100 text-blue-600 text-sm font-semibold">
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
                          <button
                            onClick={() => removeFromReadingList(story.objectID)}
                            className="text-red-500 hover:text-red-700 transition-colors"
                            title="Remove from Reading List"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>

                      {/* Title */}
                      <h2 className="text-xl font-bold text-slate-800 mb-3 leading-tight group-hover:text-blue-600 transition-colors">
                        <Link href={`/item/${story.objectID}`} className="hover:underline">
                          {story.title}
                        </Link>
                      </h2>

                      {/* Story text preview */}
                      {story.story_text && (
                        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                          <div 
                            className="text-sm text-gray-700 line-clamp-2"
                            dangerouslySetInnerHTML={{ 
                              __html: story.story_text.length > 200 
                                ? story.story_text.substring(0, 200) + '...' 
                                : story.story_text 
                            }}
                          />
                        </div>
                      )}

                      {/* Footer */}
                      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                        <div className="flex items-center space-x-4 text-sm text-slate-500">
                          <span>by <span className="font-medium">{story.author}</span></span>
                          <span>{timeAgo}</span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {story.url && (
                            <a
                              href={story.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 font-medium py-1 px-3 rounded transition-colors"
                            >
                              Read Article
                            </a>
                          )}
                          <Link
                            href={`/item/${story.objectID}`}
                            className="text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-1 px-3 rounded transition-colors"
                          >
                            View Details
                          </Link>
                        </div>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </main>

        <footer className="text-center mt-16 pb-8">
          <div className="max-w-md mx-auto bg-white/40 backdrop-blur-sm rounded-xl border border-white/20 p-4">
            <p className="text-sm text-slate-600 mb-2">
            
            </p>
            <p className="text-xs text-slate-500">
              
            </p>
          </div>
        </footer>
      </div>
    </div>
  )
}