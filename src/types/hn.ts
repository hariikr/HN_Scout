export interface HNStory {
  objectID: string
  title: string
  url?: string
  author: string
  created_at: string
  points: number
  num_comments: number
  story_text?: string
  _tags: string[]
}

export interface HNComment {
  objectID: string
  author: string
  created_at: string
  comment_text: string
  parent_id: number
  story_id: number
}

export interface HNSearchResponse {
  hits: HNStory[]
  page: number
  nbPages: number
  hitsPerPage: number
  nbHits: number
}

export interface QualityScore {
  score: number
  breakdown: {
    points: number
    comments: number
    recency: number
  }
}