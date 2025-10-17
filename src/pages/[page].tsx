import { GetServerSideProps } from 'next'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { HNStory, HNSearchResponse } from '@/types/hn'
import { searchStories, sortStoriesByQuality, getRecencyStatus } from '@/lib/hn-api'
import { StoryCard } from '@/components/StoryCard'
import { Pagination } from '@/components/Pagination'
import { KeyboardNav } from '@/components/KeyboardNav'
import { EmptyState, ErrorState } from '@/components/LoadingStates'
import { ProgressBar } from '@/components/LoadingOptimizations'

interface PageProps {
  stories: HNStory[]
  currentPage: number
  totalPages: number
  error?: string
}

export default function StoriesPage({ stories, currentPage, totalPages, error }: PageProps) {
  const router = useRouter()
  const [isNavigating, setIsNavigating] = useState(false)
  const [isInfiniteScroll, setIsInfiniteScroll] = useState(false)
  const [domainFilter, setDomainFilter] = useState('')
  const [allStories, setAllStories] = useState<HNStory[]>(stories)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [currentLoadedPage, setCurrentLoadedPage] = useState(currentPage)

  // Filter stories based on domain filter
  const filteredStories = domainFilter 
    ? allStories.filter(story => {
        const domain = story.url ? new URL(story.url).hostname : ''
        return domain.toLowerCase().includes(domainFilter.toLowerCase()) ||
               story.title.toLowerCase().includes(domainFilter.toLowerCase())
      })
    : allStories

  // Load more stories for infinite scroll
  const loadMoreStories = async () => {
    if (isLoadingMore || currentLoadedPage >= totalPages) return
    
    setIsLoadingMore(true)
    try {
      const response = await fetch(`/api/stories?page=${currentLoadedPage + 1}`)
      if (response.ok) {
        const newData = await response.json()
        setAllStories(prev => [...prev, ...newData.stories])
        setCurrentLoadedPage(prev => prev + 1)
      }
    } catch (error) {
      console.error('Error loading more stories:', error)
    } finally {
      setIsLoadingMore(false)
    }
  }

  // Infinite scroll effect
  useEffect(() => {
    if (!isInfiniteScroll) return

    const handleScroll = () => {
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 1000) {
        loadMoreStories()
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [isInfiniteScroll, isLoadingMore, currentLoadedPage, totalPages, loadMoreStories])

  // Reset stories when page prop changes
  useEffect(() => {
    setAllStories(stories)
    setCurrentLoadedPage(currentPage)
  }, [stories, currentPage])

  useEffect(() => {
    const handleRouteChangeStart = () => setIsNavigating(true)
    const handleRouteChangeComplete = () => setIsNavigating(false)
    const handleRouteChangeError = () => setIsNavigating(false)

    router.events.on('routeChangeStart', handleRouteChangeStart)
    router.events.on('routeChangeComplete', handleRouteChangeComplete)
    router.events.on('routeChangeError', handleRouteChangeError)

    return () => {
      router.events.off('routeChangeStart', handleRouteChangeStart)
      router.events.off('routeChangeComplete', handleRouteChangeComplete)
      router.events.off('routeChangeError', handleRouteChangeError)
    }
  }, [router])
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-8">
          <header className="text-center mb-12">
            <Link href="/" className="inline-block group">
              <div className="flex items-center justify-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300">
                  <span className="text-2xl"></span>
                </div>
                <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                 HN Scout
                </h1>
              </div>
            </Link>
          </header>
          <ErrorState message={error} />
        </div>
      </div>
    )
  }

  if (!stories.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-8">
          <header className="text-center mb-12">
            <Link href="/" className="inline-block group">
              <div className="flex items-center justify-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300">
                  <span className="text-2xl">👾</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                 👾HN Scout
                </h1>
              </div>
            </Link>
          </header>
          <EmptyState message="No stories found on this page" />
        </div>
      </div>
    )
  }

  return (
    <>
      <ProgressBar isLoading={isNavigating} />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-8">
          <header className="text-center mb-12">
            <Link href="/" className="inline-block group">
              <div className="relative mb-8">
                {/* Background glow effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-indigo-600/20 blur-3xl rounded-full"></div>
                
                {/* Main logo container */}
                <div className="relative flex items-center justify-center space-x-4 px-8 py-6 bg-white/80 backdrop-blur-xl rounded-3xl border border-white/30 shadow-2xl group-hover:shadow-3xl transition-all duration-500 group-hover:scale-105">
                  {/* Animated avatar */}
                  <div className="relative">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:rotate-12">
                      <span className="text-3xl group-hover:scale-110 transition-transform duration-300">👾</span>
                    </div>
                    {/* Pulse ring */}
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl opacity-20 group-hover:opacity-30 animate-pulse"></div>
                  </div>
                  
                  {/* Title */}
                  <div className="text-left">
                    <h1 className="text-5xl md:text-6xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-1 tracking-tight">
                      HN Scout
                    </h1>
                    <p className="text-sm text-slate-600 font-medium tracking-wide">
                      Intelligence-Driven News Discovery
                    </p>
                  </div>
                  
                  {/* Decorative elements */}
                  <div className="absolute -top-2 -right-2 w-4 h-4 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full animate-bounce"></div>
                  <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-gradient-to-br from-green-400 to-blue-500 rounded-full animate-pulse"></div>
                </div>
              </div>
            </Link>
            
            {/* Enhanced Navigation */}
            <nav className="mb-8">
              <div className="flex items-center justify-center space-x-8 bg-white/60 backdrop-blur-sm rounded-2xl py-4 px-6 border border-white/30 shadow-lg max-w-md mx-auto">
                <div className="flex items-center space-x-2 px-4 py-2 bg-blue-100 rounded-xl">
                  <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                  <span className="text-blue-700 font-semibold text-sm">Stories</span>
                </div>
                <Link href="/reading-list" className="flex items-center space-x-2 text-slate-600 hover:text-blue-600 transition-colors font-medium px-4 py-2 rounded-xl hover:bg-blue-50">
                  <span className="text-lg">📚</span>
                  <span className="text-sm">Reading List</span>
                </Link>
              </div>
            </nav>
            
            {/* Content Overview Dashboard */}
            <div className="max-w-4xl mx-auto bg-white/90 backdrop-blur-xl rounded-3xl border border-white/30 shadow-2xl p-8 mb-8">
              {/* Header Stats */}
              <div className="flex flex-col lg:flex-row items-center justify-between mb-6 pb-6 border-b border-slate-200">
                <div className="flex items-center space-x-6 mb-4 lg:mb-0">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-slate-800 font-semibold text-lg">
                        {isInfiniteScroll ? `${currentLoadedPage} of ${totalPages} Pages Loaded` : `Page ${currentPage} of ${totalPages}`}
                      </div>
                      <div className="text-slate-500 text-sm">Browse curated content</div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-slate-800 font-semibold text-lg">Quality Sorted</div>
                    <div className="text-slate-500 text-sm">Intelligent ranking system</div>
                  </div>
                </div>
              </div>
              
              {/* Algorithm Legend */}
              <div>
                <h3 className="text-slate-800 font-semibold text-base mb-4 flex items-center">
                  <span className="w-6 h-6 bg-gradient-to-br from-amber-400 to-amber-500 rounded-lg flex items-center justify-center mr-2">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </span>
                  Scoring Algorithm
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                  <div className="flex items-center space-x-2 bg-red-50 rounded-xl px-4 py-3 border border-red-100">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="font-medium text-red-800">🔥 HOT (0-2h)</span>
                    <span className="text-red-600 font-semibold">+60 boost</span>
                  </div>
                  <div className="flex items-center space-x-2 bg-orange-50 rounded-xl px-4 py-3 border border-orange-100">
                    <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                    <span className="font-medium text-orange-800">📈 TRENDING (2-6h)</span>
                    <span className="text-orange-600 font-semibold">+40 boost</span>
                  </div>
                  <div className="flex items-center space-x-2 bg-blue-50 rounded-xl px-4 py-3 border border-blue-100">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="font-medium text-blue-800">⏰ RECENT (6-24h)</span>
                    <span className="text-blue-600 font-semibold">Variable boost</span>
                  </div>
                  <div className="flex items-center space-x-2 bg-purple-50 rounded-xl px-4 py-3 border border-purple-100">
                    <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                    <span className="font-medium text-purple-800">🚀 VIRAL</span>
                    <span className="text-purple-600 font-semibold">5000+ pts</span>
                  </div>
                  <div className="flex items-center space-x-2 bg-yellow-50 rounded-xl px-4 py-3 border border-yellow-100">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <span className="font-medium text-yellow-800">⭐ CLASSIC</span>
                    <span className="text-yellow-600 font-semibold">1000+ pts</span>
                  </div>
                  <div className="flex items-center space-x-2 bg-slate-50 rounded-xl px-4 py-3 border border-slate-100">
                    <div className="w-3 h-3 bg-slate-500 rounded-full"></div>
                    <span className="font-medium text-slate-800">📊 STANDARD</span>
                    <span className="text-slate-600 font-semibold">Base score</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Advanced Filter Controls */}
            <div className="max-w-4xl mx-auto bg-white/90 backdrop-blur-xl rounded-3xl border border-white/30 shadow-2xl p-8 mb-8">
              <div className="mb-6">
                <h3 className="text-slate-800 font-semibold text-lg mb-2 flex items-center">
                  <span className="w-6 h-6 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-lg flex items-center justify-center mr-3">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z" />
                    </svg>
                  </span>
                  Content Discovery
                </h3>
                <p className="text-slate-600 text-sm">Filter and refine your story feed with intelligent search</p>
              </div>
              
              <div className="flex flex-col lg:flex-row items-center space-y-4 lg:space-y-0 lg:space-x-6">
                <div className="flex-1 w-full">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      placeholder="Filter by domain, keyword, or topic... (e.g., github.com, AI, startup)"
                      value={domainFilter}
                      onChange={(e) => setDomainFilter(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/95 backdrop-blur-sm text-slate-700 placeholder-slate-400 font-medium shadow-inner"
                    />
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4">
                  {domainFilter && (
                    <button
                      onClick={() => setDomainFilter('')}
                      className="flex items-center space-x-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 text-sm rounded-xl transition-all duration-200 border border-red-200 font-medium shadow-sm hover:shadow-md"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span>Clear Filter</span>
                    </button>
                  )}
                  
                  <label className="flex items-center space-x-3 bg-gradient-to-r from-blue-50 to-indigo-50 px-5 py-3 rounded-xl border border-blue-200 cursor-pointer hover:from-blue-100 hover:to-indigo-100 transition-all duration-200 shadow-sm hover:shadow-md">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={isInfiniteScroll}
                        onChange={(e) => setIsInfiniteScroll(e.target.checked)}
                        className="sr-only"
                      />
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200 ${isInfiniteScroll ? 'bg-blue-600 border-blue-600' : 'border-slate-300 bg-white'}`}>
                        {isInfiniteScroll && (
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xl">∞</span>
                      <span className="text-sm text-blue-800 font-semibold">Infinite Scroll</span>
                    </div>
                  </label>
                </div>
              </div>
              
              {domainFilter && (
                <div className="mt-3 text-sm text-gray-600">
                  Showing {filteredStories.length} of {allStories.length} stories
                  {filteredStories.length !== allStories.length && ` matching "${domainFilter}"`}
                </div>
              )}
            </div>
          </header>

          <main className="max-w-5xl mx-auto">
            {/* Stories Grid */}
            <div className="space-y-4 mb-12">
              {filteredStories.map((story, index) => (
                <StoryCard 
                  key={`${story.objectID}-${index}`} 
                  story={story} 
                  index={index} 
                />
              ))}
              
              {isLoadingMore && (
                <div className="text-center py-8">
                  <div className="inline-flex items-center space-x-2 bg-white/80 backdrop-blur-sm rounded-xl px-6 py-3 shadow-lg">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span className="text-gray-600">Loading more stories...</span>
                  </div>
                </div>
              )}
              
              {isInfiniteScroll && currentLoadedPage >= totalPages && !isLoadingMore && (
                <div className="text-center py-8">
                  <div className="inline-flex items-center space-x-2 bg-green-50 rounded-xl px-6 py-3">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-green-700 font-medium">All stories loaded!</span>
                  </div>
                </div>
              )}
            </div>

            {/* Enhanced Pagination - Only show when not in infinite scroll mode */}
            {!isInfiniteScroll && (
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/20 shadow-lg p-6">
                <Pagination 
                  currentPage={currentPage} 
                  totalPages={totalPages} 
                />
              </div>
            )}
          </main>

          {/* Professional Footer */}
          <footer className="text-center mt-16 pb-8">
            <div className="max-w-md mx-auto bg-white/40 backdrop-blur-sm rounded-xl border border-white/20 p-4">
              <p className="text-sm text-slate-600 mb-2">
                Powered by <span className="font-semibold">Hacker News API</span>
              </p>
              <a 
                href="https://hn.algolia.com/api" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="inline-flex items-center text-xs text-blue-600 hover:text-blue-700 transition-colors"
              >
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                API Documentation
              </a>
            </div>
          </footer>

          <KeyboardNav currentPage={currentPage} totalPages={totalPages} />
        </div>
      </div>
    </>
  )
}

export const getServerSideProps: GetServerSideProps<PageProps> = async (context) => {
  const page = parseInt(context.params?.page as string) || 1
  
  // Validate page parameter
  if (page < 1) {
    return {
      redirect: {
        destination: '/1',
        permanent: false,
      },
    }
  }

  try {
    // Add timeout for the entire SSR process
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('SSR timeout')), 2000) // 2 second SSR timeout
    })

    const dataPromise = searchStories(page - 1) // API is 0-indexed
    
    const data: HNSearchResponse = await Promise.race([dataPromise, timeoutPromise]) as HNSearchResponse
    
    // Handle out of range pages
    if (page > data.nbPages && data.nbPages > 0) {
      return {
        redirect: {
          destination: `/${data.nbPages}`,
          permanent: false,
        },
      }
    }
    
    // Sort stories by quality score before rendering (per page only)
    const sortedStories = sortStoriesByQuality(data.hits)
    
    return {
      props: {
        stories: sortedStories,
        currentPage: page,
        totalPages: data.nbPages,
      },
    }
  } catch (error) {
    console.error('Error fetching stories:', error)
    
    // Return cached error page for faster loading
    return {
      props: {
        stories: [],
        currentPage: page,
        totalPages: 1,
        error: error instanceof Error && error.message.includes('timeout') 
          ? 'Request timed out. Please try again.' 
          : 'Failed to load stories. Please try again later.',
      },
    }
  }
}