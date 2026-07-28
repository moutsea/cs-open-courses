'use client'

import { useLearningLibrary } from '@/hooks/useLearningLibrary'
import type { LearningCourse, LearningStatus } from '@/lib/learningLibrary'

interface CourseLearningActionsProps {
  course: LearningCourse
}

export default function CourseLearningActions({ course }: CourseLearningActionsProps) {
  const { entries, isReady, updateEntry } = useLearningLibrary()
  const entry = entries.find(item => item.path === course.path)
  const isChinese = course.locale === 'zh'
  const status = entry?.status || 'not-started'
  const isFavorite = entry?.favorite || false

  const statusOptions: Array<{ value: LearningStatus; label: string }> = [
    { value: 'not-started', label: isChinese ? '尚未开始' : 'Not started' },
    { value: 'in-progress', label: isChinese ? '学习中' : 'In progress' },
    { value: 'completed', label: isChinese ? '已完成' : 'Completed' }
  ]

  return (
    <div className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-white/5 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/50">
          {isChinese ? '我的学习' : 'My learning'}
        </p>
        <p className="mt-1 text-sm text-white/70">
          {isChinese ? '收藏课程并记录当前学习进度' : 'Save this course and track your progress'}
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="button"
          disabled={!isReady}
          aria-pressed={isFavorite}
          onClick={() => updateEntry(course, { favorite: !isFavorite })}
          className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition disabled:cursor-wait disabled:opacity-60 ${
            isFavorite
              ? 'border-pink-300/50 bg-pink-300/15 text-pink-100'
              : 'border-white/15 bg-white/5 text-white/80 hover:border-white/40 hover:bg-white/10'
          }`}
        >
          <span aria-hidden="true">{isFavorite ? '♥' : '♡'}</span>
          {isFavorite ? (isChinese ? '已收藏' : 'Saved') : (isChinese ? '收藏' : 'Save')}
        </button>

        <label className="flex min-h-11 items-center gap-3 rounded-full border border-white/15 bg-slate-950/40 px-4 py-2 text-sm text-white/70">
          <span>{isChinese ? '进度' : 'Progress'}</span>
          <select
            value={status}
            disabled={!isReady}
            onChange={(event) => updateEntry(course, { status: event.target.value as LearningStatus })}
            className="bg-transparent font-semibold text-white outline-none disabled:cursor-wait"
          >
            {statusOptions.map(option => (
              <option key={option.value} value={option.value} className="bg-slate-900 text-white">
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  )
}
