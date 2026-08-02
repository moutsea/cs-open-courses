export type GithubProjectCategory =
  | 'ai-ml'
  | 'web-development'
  | 'systems-infrastructure'
  | 'developer-tools'
  | 'data-databases'
  | 'mobile-desktop'
  | 'security-privacy'
  | 'learning-resources'
  | 'other'

export type GithubProjectSort = 'trending' | 'stars' | 'updated' | 'name'

export interface GithubProjectListItem {
  id: number
  fullName: string
  owner: string
  name: string
  description: string | null
  htmlUrl: string
  homepage: string | null
  avatarUrl: string | null
  language: string | null
  license: string | null
  topics: string[]
  category: GithubProjectCategory
  stars: number
  forks: number
  watchers: number
  openIssues: number
  starsDelta: number
  hotScore: number
  pushedAt: string | null
  githubUpdatedAt: string | null
}

export interface GithubProjectFilters {
  query?: string
  category?: string
  language?: string
  sort?: GithubProjectSort
  page?: number
  pageSize?: number
}

export interface GithubProjectsPage {
  projects: GithubProjectListItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface GithubProjectFacet {
  value: string
  count: number
}

export interface GithubProjectStats {
  total: number
  totalStars: number
  categories: GithubProjectFacet[]
  languages: GithubProjectFacet[]
  lastSync: {
    status: string
    discoveredCount: number
    updatedCount: number
    startedAt: string
    finishedAt: string | null
  } | null
}
