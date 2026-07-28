export type LearningStatus = 'not-started' | 'in-progress' | 'completed'

export interface LearningEntry {
  path: string
  title: string
  locale: string
  favorite: boolean
  status: LearningStatus
  updatedAt: number
}

export interface LearningCourse {
  path: string
  title: string
  locale: string
}

export const LEARNING_LIBRARY_EVENT = 'cs-courses-learning-library-updated'

const STORAGE_KEY = 'cs-courses-learning-library-v1'

function isLearningStatus(value: unknown): value is LearningStatus {
  return value === 'not-started' || value === 'in-progress' || value === 'completed'
}

export function readLearningLibrary(): LearningEntry[] {
  if (typeof window === 'undefined') return []

  try {
    const storedValue = window.localStorage.getItem(STORAGE_KEY)
    if (!storedValue) return []

    const entries = JSON.parse(storedValue)
    if (!Array.isArray(entries)) return []

    return entries.filter((entry): entry is LearningEntry => (
      typeof entry?.path === 'string' &&
      typeof entry?.title === 'string' &&
      typeof entry?.locale === 'string' &&
      typeof entry?.favorite === 'boolean' &&
      isLearningStatus(entry?.status) &&
      typeof entry?.updatedAt === 'number'
    ))
  } catch {
    return []
  }
}

export function updateLearningEntry(
  course: LearningCourse,
  changes: Partial<Pick<LearningEntry, 'favorite' | 'status'>>
): LearningEntry[] {
  if (typeof window === 'undefined') return []

  const entries = readLearningLibrary()
  const existingEntry = entries.find(entry => entry.path === course.path)
  const nextEntry: LearningEntry = {
    path: course.path,
    title: course.title,
    locale: course.locale,
    favorite: changes.favorite ?? existingEntry?.favorite ?? false,
    status: changes.status ?? existingEntry?.status ?? 'not-started',
    updatedAt: Date.now()
  }

  const remainingEntries = entries.filter(entry => entry.path !== course.path)
  const nextEntries = nextEntry.favorite || nextEntry.status !== 'not-started'
    ? [nextEntry, ...remainingEntries]
    : remainingEntries

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextEntries))
  window.dispatchEvent(new Event(LEARNING_LIBRARY_EVENT))
  return nextEntries
}
