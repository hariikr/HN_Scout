import { NextApiRequest, NextApiResponse } from 'next'
import { searchStories, sortStoriesByQuality } from '@/lib/hn-api'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { page } = req.query
  const pageNumber = parseInt(page as string) || 1

  try {
    const data = await searchStories(pageNumber - 1) // API is 0-indexed
    const sortedStories = sortStoriesByQuality(data.hits)
    
    res.status(200).json({
      stories: sortedStories,
      currentPage: pageNumber,
      totalPages: data.nbPages,
    })
  } catch (error) {
    console.error('Error fetching stories:', error)
    res.status(500).json({ 
      message: 'Failed to fetch stories',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}