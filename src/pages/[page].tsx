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
  }, [isInfiniteScroll, isLoadingMore, currentLoadedPage, totalPages])

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
            
            {/* Page Info Card */}
            <div className="max-w-2xl mx-auto bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl p-6 mb-8">
              <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <span className="text-slate-700 font-medium">
                    {isInfiniteScroll ? `Loaded ${currentLoadedPage} of ${totalPages} pages` : `Page ${currentPage} of ${totalPages}`}
                  </span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <span className="text-slate-700 font-medium">Quality Sorted</span>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-slate-200">
                <div className="text-xs text-slate-600 bg-slate-50 rounded-lg px-3 py-2 font-mono mb-2">
                 
                </div>
                <div className="text-xs text-slate-500 space-y-1">
                  <div className="flex items-center flex-wrap gap-x-4 gap-y-1">
                    <span className="flex items-center">
                      <span className="w-2 h-2 bg-red-100 border border-red-300 rounded-full mr-1"></span>
                      🔥 HOT (0-2h): +60 boost
                    </span>
                    <span className="flex items-center">
                      <span className="w-2 h-2 bg-orange-100 border border-orange-300 rounded-full mr-1"></span>
                      📈 TRENDING (2-6h): +40 boost
                    </span>
                    <span className="flex items-center">
                      <span className="w-2 h-2 bg-blue-100 border border-blue-300 rounded-full mr-1"></span>
                      ⏰ RECENT (6-24h): Variable boost
                    </span>
                  </div>
                  <div className="flex items-center flex-wrap gap-x-4 gap-y-1">
                    <span className="flex items-center">
                      <span className="w-2 h-2 bg-purple-100 border border-purple-300 rounded-full mr-1"></span>
                      🚀 VIRAL: 5000+ points legendary stories
                    </span>
                    <span className="flex items-center">
                      <span className="w-2 h-2 bg-yellow-100 border border-yellow-300 rounded-full mr-1"></span>
                      ⭐ CLASSIC: 1000+ points historical gems
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Filter and Controls */}
            <div className="max-w-4xl mx-auto bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl p-6 mb-8">
              <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4">
                <div className="flex-1 w-full">
                  <input
                    type="text"
                    placeholder="Filter stories by domain or keyword... (e.g., github.com, AI, startup)"
                    value={domainFilter}
                    onChange={(e) => setDomainFilter(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/90 backdrop-blur-sm"
                  />
                </div>
                
                <div className="flex items-center space-x-4">
                  {domainFilter && (
                    <button
                      onClick={() => setDomainFilter('')}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm rounded-lg transition-colors"
                    >
                      Clear Filter
                    </button>
                  )}
                  
                  <label className="flex items-center space-x-2 bg-blue-50 px-4 py-2 rounded-lg">
                    <input
                      type="checkbox"
                      checked={isInfiniteScroll}
                      onChange={(e) => setIsInfiniteScroll(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-blue-700 font-medium">Infinite Scroll</span>
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