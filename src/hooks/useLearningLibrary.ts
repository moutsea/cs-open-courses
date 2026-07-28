'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  LEARNING_LIBRARY_EVENT,
  LearningCourse,
  LearningEntry,
  readLearningLibrary,
  updateLearningEntry
} from '@/lib/learningLibrary'

export function useLearningLibrary() {
  const [entries, setEntries] = useState<LearningEntry[]>([])
  const [isReady, setIsReady] = useState(false)

  const refreshEntries = useCallback(() => {
    setEntries(readLearningLibrary())
    setIsReady(true)
  }, [])

  useEffect(() => {
    refreshEntries()
    window.addEventListener('storage', refreshEntries)
    window.addEventListener(LEARNING_LIBRARY_EVENT, refreshEntries)

    return () => {
      window.removeEventListener('storage', refreshEntries)
      window.removeEventListener(LEARNING_LIBRARY_EVENT, refreshEntries)
    }
  }, [refreshEntries])

  const updateEntry = useCallback((
    course: LearningCourse,
    changes: Partial<Pick<LearningEntry, 'favorite' | 'status'>>
  ) => {
    setEntries(updateLearningEntry(course, changes))
  }, [])

  return { entries, isReady, updateEntry }
}
