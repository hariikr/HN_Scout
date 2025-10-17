import { GetServerSideProps } from 'next'
import Link from 'next/link'
import { HNStory, HNComment } from '@/types/hn'
import { getStoryById, getCommentsForStory, calculateQualityScore, formatTimeAgo, extractDomain } from '@/lib/hn-api'
import { ErrorState } from '@/components/LoadingStates'

interface PageProps {
  story: HNStory | null
  comments: HNComment[]
  error?: string
}

export default function ItemPage({ story, comments, error }: PageProps) {
  if (error || !story) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100">
        <div className="container mx-auto px-4 py-8">
          <header className="text-center mb-8">
            <Link href="/" className="inline-block">
              <h1 className="text-3xl md:text-4xl font-bold text-orange-600 mb-2 hover:text-orange-700 transition-colors">
                🧭 HN Scout
              </h1>
            </Link>
          </header>
          <ErrorState message={error || 'Story not found'} />
        </div>
      </div>
    )
  }

  const qualityScore = calculateQualityScore(story)
  const domain = extractDomain(story.url)
  const timeAgo = formatTimeAgo(story.created_at)
  const hnUrl = `https://news.ycombinator.com/item?id=${story.objectID}`

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <Link href="/" className="inline-block">
            <h1 className="text-3xl md:text-4xl font-bold text-orange-600 mb-2 hover:text-orange-700 transition-colors">
              🧭 HN Scout
            </h1>
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
              </div>
              
              <div className="flex items-center space-x-3 text-xs text-gray-500">
                <span title="Points contribution" className="bg-gray-100 px-2 py-1 rounded">
                  Points: {qualityScore.breakdown.points}
                </span>
                <span title="Comments contribution" className="bg-gray-100 px-2 py-1 rounded">
                  Comments: {qualityScore.breakdown.comments}
                </span>
                <span title="Recency boost" className="bg-gray-100 px-2 py-1 rounded">
                  Recency: {qualityScore.breakdown.recency}
                </span>
              </div>
            </div>
          </article>

          {comments.length > 0 && (
            <section className="bg-white rounded-lg shadow-lg p-8">
              <header className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  Latest Comments ({comments.length})
                </h2>
                <p className="text-gray-600 text-sm">
                  Showing the 5 most recent comments. 
                  <a 
                    href={hnUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-orange-600 hover:text-orange-700 ml-1"
                  >
                    View all on Hacker News
                  </a>
                </p>
              </header>

              <div className="space-y-6">
                {comments.map((comment) => (
                  <article key={comment.objectID} className="border-l-4 border-orange-200 pl-4">
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
      },
    }
  } catch (error) {
    console.error('Error fetching story data:', error)
    
    return {
      props: {
        story: null,
        comments: [],
        error: 'Failed to load story. Please try again later.',
      },
    }
  }
}