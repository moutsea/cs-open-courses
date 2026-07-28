'use client'

import Link from 'next/link'
import { useLearningLibrary } from '@/hooks/useLearningLibrary'
import { localizedPath } from '@/lib/pathUtils'

export default function LearningDashboard({ locale }: { locale: string }) {
  const { entries, isReady } = useLearningLibrary()
  const isChinese = locale === 'zh'
  const favoriteCount = entries.filter(entry => entry.favorite).length
  const inProgressCount = entries.filter(entry => entry.status === 'in-progress').length
  const completedCount = entries.filter(entry => entry.status === 'completed').length

  if (!isReady) {
    return <div className="mb-10 h-32 animate-pulse rounded-3xl bg-white/5" />
  }

  return (
    <section className="mb-10 rounded-3xl border border-white/10 bg-slate-950/30 p-5 sm:p-6" aria-labelledby="learning-dashboard-title">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/50">
            {isChinese ? '本地学习空间' : 'Your learning space'}
          </p>
          <h2 id="learning-dashboard-title" className="mt-2 text-2xl font-semibold text-white">
            {isChinese ? '收藏与学习进度' : 'Saved courses and progress'}
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-white/60">
            {isChinese
              ? '数据只保存在当前浏览器中，无需注册账号。'
              : 'Your data stays in this browser, so no account is required.'}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 text-center">
          {[
            { value: favoriteCount, label: isChinese ? '收藏' : 'Saved' },
            { value: inProgressCount, label: isChinese ? '学习中' : 'Active' },
            { value: completedCount, label: isChinese ? '已完成' : 'Done' }
          ].map(item => (
            <div key={item.label} className="min-w-20 rounded-2xl border border-white/10 bg-white/5 px-3 py-3">
              <div className="text-xl font-bold text-white">{item.value}</div>
              <div className="text-xs text-white/50">{item.label}</div>
            </div>
          ))}
        </div>
      </div>

      {entries.length > 0 ? (
        <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {entries.slice(0, 6).map(entry => (
            <Link
              key={entry.path}
              href={localizedPath(locale, `/course/${entry.path}`)}
              className="rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-cyan-300/30 hover:bg-white/10"
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-semibold text-white">{entry.title}</h3>
                {entry.favorite && <span className="text-pink-200" aria-label={isChinese ? '已收藏' : 'Saved'}>♥</span>}
              </div>
              <p className="mt-2 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200/80">
                {entry.status === 'completed'
                  ? (isChinese ? '已完成' : 'Completed')
                  : entry.status === 'in-progress'
                    ? (isChinese ? '学习中' : 'In progress')
                    : (isChinese ? '尚未开始' : 'Not started')}
              </p>
            </Link>
          ))}
        </div>
      ) : (
        <p className="mt-6 rounded-2xl border border-dashed border-white/15 px-4 py-5 text-sm text-white/60">
          {isChinese
            ? '打开任意课程即可收藏，或把进度设置为“学习中”。'
            : 'Open any course to save it or mark it as in progress.'}
        </p>
      )}
    </section>
  )
}
