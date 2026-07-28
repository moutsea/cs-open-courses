import Link from 'next/link'
import { ArrowRight, Clock3, Code2 } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import type { Course } from '@/lib/courseParser'
import { buildDynamicRoutePath, localizedPath } from '@/lib/pathUtils'

interface FeaturedCourseItem {
  course: Course
  role: string
}

interface HomeFeaturedCoursesProps {
  courses: FeaturedCourseItem[]
  locale: string
}

function formatDuration(course: Course, locale: string, formatHours: (count: number) => string) {
  if (!course.duration) return ''
  if (typeof course.duration === 'object') {
    if (course.duration.value !== null) {
      return formatHours(course.duration.value)
    }
    return course.duration.originalText
  }
  if (locale === 'zh') return course.duration.replace(/hours?/i, '小时')
  return course.duration.replace(/小时/g, 'hours')
}

function formatDifficulty(difficulty: string | undefined, labels: Record<string, string>) {
  if (!difficulty) return ''
  return labels[difficulty] || difficulty
}

export default async function HomeFeaturedCourses({ courses, locale }: HomeFeaturedCoursesProps) {
  const isChinese = locale === 'zh'
  const t = await getTranslations({ locale, namespace: 'home.featured' })
  const difficultyLabels = {
    Beginner: t('difficulty.beginner'),
    Intermediate: t('difficulty.intermediate'),
    Advanced: t('difficulty.advanced'),
    Expert: t('difficulty.expert')
  }

  return (
    <section className="px-4 py-14 text-white sm:px-6 lg:px-8" aria-labelledby="featured-courses-title">
      <div className="mx-auto max-w-screen-2xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-200/70">
              {t('eyebrow')}
            </p>
            <h2 id="featured-courses-title" className="mt-3 text-3xl font-bold sm:text-4xl">
              {t('title')}
            </h2>
            <p className="mt-3 max-w-2xl text-white/60">
              {t('description')}
            </p>
          </div>
          <Link href={localizedPath(locale, '/courses')} className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-200 hover:text-cyan-100">
            {t('browseAll')}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {courses.map(({ course, role }, index) => {
            const duration = formatDuration(course, locale, count => t('hours', { count }))
            const difficulty = formatDifficulty(course.difficulty, difficultyLabels)
            const summary = isChinese ? course.summary : (course.summaryEn || course.summary)
            const href = localizedPath(locale, `/course/${buildDynamicRoutePath(course.path).join('/')}`)

            return (
              <Link
                key={course.id}
                href={href}
                className="group flex min-h-80 flex-col rounded-[28px] border border-white/10 bg-white/5 p-6 transition hover:-translate-y-0.5 hover:border-cyan-200/30 hover:bg-white/10"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="rounded-full border border-cyan-200/15 bg-cyan-200/10 px-3 py-1 text-xs font-semibold text-cyan-100">
                    {role}
                  </span>
                  <span className="text-xs font-semibold text-white/40">0{index + 1}</span>
                </div>

                <h3 className="mt-6 line-clamp-3 text-xl font-bold leading-snug transition group-hover:text-cyan-100">{course.title}</h3>

                <div className="mt-5 flex flex-wrap gap-2 text-xs text-white/60">
                  {course.programmingLanguage && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-950/40 px-3 py-1.5">
                      <Code2 className="h-3.5 w-3.5" aria-hidden="true" />
                      {course.programmingLanguage}
                    </span>
                  )}
                  {duration && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-950/40 px-3 py-1.5">
                      <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
                      {duration}
                    </span>
                  )}
                  {difficulty && <span className="rounded-full bg-slate-950/40 px-3 py-1.5">{difficulty}</span>}
                </div>

                <p className="mt-5 line-clamp-3 text-sm leading-relaxed text-white/55">{summary}</p>

                <div className="mt-auto inline-flex items-center gap-2 pt-6 text-sm font-semibold text-cyan-200">
                  {t('viewCourse')}
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
