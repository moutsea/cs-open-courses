import Link from 'next/link'
import { ArrowRight, Blocks, Cpu, Rocket } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { localizedPath } from '@/lib/pathUtils'

export default async function HomeLearningPaths({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: 'home.learningPaths' })
  const stages = [
    {
      index: '01',
      icon: Blocks,
      title: t('stages.foundation.title'),
      description: t('stages.foundation.description'),
      topics: t.raw('stages.foundation.topics') as string[],
      href: '/tutorial#stage-1'
    },
    {
      index: '02',
      icon: Cpu,
      title: t('stages.core.title'),
      description: t('stages.core.description'),
      topics: t.raw('stages.core.topics') as string[],
      href: '/tutorial#stage-3'
    },
    {
      index: '03',
      icon: Rocket,
      title: t('stages.direction.title'),
      description: t('stages.direction.description'),
      topics: t.raw('stages.direction.topics') as string[],
      href: '/tutorial#stage-6'
    }
  ]

  return (
    <section className="px-4 py-14 text-white sm:px-6 lg:px-8" aria-labelledby="home-path-title" aria-label={t('ariaLabel')}>
      <div className="mx-auto max-w-screen-2xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-200/70">
              {t('eyebrow')}
            </p>
            <h2 id="home-path-title" className="mt-3 text-3xl font-bold sm:text-4xl">
              {t('title')}
            </h2>
            <p className="mt-3 max-w-2xl text-white/60">
              {t('description')}
            </p>
          </div>
          <Link href={localizedPath(locale, '/tutorial')} className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-200 hover:text-cyan-100">
            {t('viewAll')}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {stages.map(stage => {
            const Icon = stage.icon
            return (
              <Link
                key={stage.index}
                href={localizedPath(locale, stage.href)}
                className="group rounded-[28px] border border-white/10 bg-white/5 p-6 transition hover:-translate-y-0.5 hover:border-cyan-200/30 hover:bg-white/10"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="rounded-2xl border border-cyan-200/15 bg-cyan-200/10 p-3 text-cyan-200">
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <span className="text-sm font-bold tracking-[0.2em] text-white/30">{stage.index}</span>
                </div>
                <h3 className="mt-6 text-2xl font-bold transition group-hover:text-cyan-100">{stage.title}</h3>
                <p className="mt-2 text-white/60">{stage.description}</p>
                <ul className="mt-5 space-y-2 text-sm text-white/50">
                  {stage.topics.map(topic => (
                    <li key={topic} className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-cyan-300/70" aria-hidden="true" />
                      {topic}
                    </li>
                  ))}
                </ul>
                <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-cyan-200">
                  {t('exploreStage')}
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" aria-hidden="true" />
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
