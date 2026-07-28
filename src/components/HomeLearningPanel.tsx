'use client'

import Link from 'next/link'
import { ArrowRight, BookOpenCheck, BrainCircuit, Code2, Cpu, Route } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useLearningLibrary } from '@/hooks/useLearningLibrary'
import { localizedPath } from '@/lib/pathUtils'

const learningDirections = [
  {
    id: 'beginner',
    icon: Code2,
    href: '/courses?category=programming-introduction'
  },
  {
    id: 'algorithms',
    icon: Route,
    href: '/courses?category=data-structures-algorithms'
  },
  {
    id: 'systems',
    icon: Cpu,
    href: '/courses?category=computer-systems-basics'
  },
  {
    id: 'ai',
    icon: BrainCircuit,
    href: '/courses?category=machine-learning'
  }
]

export default function HomeLearningPanel({ locale }: { locale: string }) {
  const { entries, isReady } = useLearningLibrary()
  const t = useTranslations('home.learningPanel')
  const activeEntries = entries
    .filter(entry => entry.favorite || entry.status !== 'not-started')
    .sort((firstEntry, secondEntry) => secondEntry.updatedAt - firstEntry.updatedAt)
  const showProgress = isReady && activeEntries.length > 0

  return (
    <section className="px-4 py-10 text-white sm:px-6 lg:px-8" aria-labelledby="home-learning-title" aria-label={t('ariaLabel')}>
      <div className="mx-auto min-h-96 max-w-screen-2xl rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-[0_25px_80px_rgba(2,6,23,0.28)] backdrop-blur-xl sm:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-200/70">
              {showProgress ? t('continueEyebrow') : t('chooseEyebrow')}
            </p>
            <h2 id="home-learning-title" className="mt-3 text-3xl font-bold sm:text-4xl">
              {showProgress ? t('continueTitle') : t('chooseTitle')}
            </h2>
            <p className="mt-3 max-w-2xl text-white/60">
              {showProgress ? t('continueDescription') : t('chooseDescription')}
            </p>
          </div>
          {showProgress && (
            <div className="flex gap-3 text-sm">
              <span className="rounded-full border border-white/10 bg-slate-950/30 px-4 py-2 text-white/65">
                {activeEntries.filter(entry => entry.status === 'in-progress').length} {t('inProgress')}
              </span>
              <span className="rounded-full border border-white/10 bg-slate-950/30 px-4 py-2 text-white/65">
                {activeEntries.filter(entry => entry.status === 'completed').length} {t('completed')}
              </span>
            </div>
          )}
        </div>

        {showProgress ? (
          <div className="mt-7 grid gap-4 lg:grid-cols-3">
            {activeEntries.slice(0, 3).map(entry => (
              <Link
                key={entry.path}
                href={localizedPath(locale, `/course/${entry.path}`)}
                className="group rounded-2xl border border-white/10 bg-slate-950/35 p-5 transition hover:border-cyan-200/30 hover:bg-white/10"
              >
                <div className="flex items-start justify-between gap-4">
                  <BookOpenCheck className="h-6 w-6 flex-none text-cyan-200" aria-hidden="true" />
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/60">
                    {entry.status === 'completed'
                      ? t('statusCompleted')
                      : entry.status === 'in-progress'
                        ? t('statusInProgress')
                        : t('statusSaved')}
                  </span>
                </div>
                <h3 className="mt-5 line-clamp-2 text-lg font-bold transition group-hover:text-cyan-100">{entry.title}</h3>
                <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-cyan-200">
                  {t('continueCourse')}
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" aria-hidden="true" />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {learningDirections.map(direction => {
              const Icon = direction.icon
              return (
                <Link
                  key={direction.id}
                  href={localizedPath(locale, direction.href)}
                  className="group rounded-2xl border border-white/10 bg-slate-950/35 p-5 transition hover:-translate-y-0.5 hover:border-cyan-200/30 hover:bg-white/10"
                >
                  <Icon className="h-7 w-7 text-cyan-200" aria-hidden="true" />
                  <h3 className="mt-5 text-lg font-bold transition group-hover:text-cyan-100">{t(`directions.${direction.id}.title`)}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/55">{t(`directions.${direction.id}.description`)}</p>
                  <ArrowRight className="mt-5 h-4 w-4 text-cyan-200 transition group-hover:translate-x-1" aria-hidden="true" />
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
