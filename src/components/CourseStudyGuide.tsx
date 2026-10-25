import Link from 'next/link'
import { courseGuides } from '@/data/course-guides'
import type { Course } from '@/lib/courseParser'
import { getCourseSeo } from '@/lib/courseSeo'
import { buildDynamicRoutePath, localizedPath } from '@/lib/pathUtils'

export default function CourseStudyGuide({ coursePath, courses, locale }: { coursePath: string; courses: Course[]; locale: string }) {
  const guide = courseGuides[coursePath]
  const text = guide?.[locale === 'zh' ? 'zh' : 'en']
  const currentCategory = coursePath.split('/')[0]
  const byPath = new Map(courses.map(course => [buildDynamicRoutePath(course.path).join('/'), course]))
  const relatedPaths = [...new Set([
    ...(guide?.related || []),
    ...[...byPath.keys()].filter(path => path.startsWith(`${currentCategory}/`))
  ])].filter(path => path !== coursePath && byPath.has(path)).slice(0, 4)
  return <div className="mt-10 space-y-8 border-t border-white/15 pt-8">
    {text && <section aria-labelledby="study-guide-title" className="space-y-5">
      <h2 id="study-guide-title" className="text-2xl font-semibold">{locale === 'zh' ? '自学路线与常见难点' : 'Self-study plan and common pitfalls'}</h2>
      <p className="leading-relaxed text-slate-200">{text.prerequisites}</p>
      <ol className="list-decimal space-y-3 pl-6 text-slate-200">{text.steps.map(step => <li key={step}>{step}</li>)}</ol>
      <h3 className="text-xl font-semibold">{locale === 'zh' ? '练习时重点检查' : 'What to check as you practice'}</h3>
      <p className="leading-relaxed text-slate-200">{text.pitfalls}</p>
      <h3 className="text-xl font-semibold">{locale === 'zh' ? '课程版本与资料' : 'Course versions and materials'}</h3>
      <p className="leading-relaxed text-slate-200">{text.version}</p>
      <a href={guide.source} target="_blank" rel="noopener noreferrer" className="inline-block text-cyan-200 underline">{locale === 'zh' ? '查看官方课程安排' : 'Check the official course schedule'}</a>
    </section>}
    {relatedPaths.length > 0 && <section aria-labelledby="related-courses-title">
      <h2 id="related-courses-title" className="mb-4 text-2xl font-semibold">{locale === 'zh' ? '衔接与相关课程' : 'Preparation and related courses'}</h2>
      <ul className="grid gap-3 sm:grid-cols-2">{relatedPaths.map(path => <li key={path}>
        <Link className="block rounded-2xl border border-white/15 px-4 py-3 text-cyan-200 hover:bg-white/5" href={localizedPath(locale, `/course/${path}`)}>{getCourseSeo(byPath.get(path)!, locale).title}</Link>
      </li>)}</ul>
    </section>}
  </div>
}
