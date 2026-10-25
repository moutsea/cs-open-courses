import Link from 'next/link'
import { localizedPath } from '@/lib/seo'

export interface ComparisonRow {
  title: string
  routePath: string
  university?: string
  language?: string
  level?: string
  hours?: string
  prerequisites?: string
}

const LABELS = {
  zh: {
    title: '课程',
    university: '所属大学',
    language: '编程语言',
    level: '难度',
    hours: '预计学时',
    prerequisites: '先修要求',
    caption: '课程对比',
    empty: '—'
  },
  en: {
    title: 'Course',
    university: 'University',
    language: 'Language',
    level: 'Level',
    hours: 'Study hours',
    prerequisites: 'Prerequisites',
    caption: 'Course comparison',
    empty: '—'
  }
} as const

export default function CourseComparisonTable({ rows, locale }: { rows: ComparisonRow[]; locale: string }) {
  if (rows.length === 0) return null
  const isZh = locale === 'zh'
  const t = isZh ? LABELS.zh : LABELS.en
  const value = (input?: string) => (input && input.trim() ? input : t.empty)

  return (
    <>
      {/* 窄屏：表格 6 列放不下，改成卡片，避免横向滚动 */}
      <ul className="space-y-3 md:hidden">
        {rows.map(row => (
          <li key={row.routePath} className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <Link
              href={localizedPath(locale, `/course/${row.routePath}`)}
              className="text-sm font-semibold text-cyan-200 hover:underline"
            >
              {row.title}
            </Link>
            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
              <div>
                <dt className="text-white/40">{t.university}</dt>
                <dd className="mt-0.5 text-white/75">{value(row.university)}</dd>
              </div>
              <div>
                <dt className="text-white/40">{t.language}</dt>
                <dd className="mt-0.5 text-white/75">{value(row.language)}</dd>
              </div>
              <div>
                <dt className="text-white/40">{t.level}</dt>
                <dd className="mt-0.5 text-white/75">{value(row.level)}</dd>
              </div>
              <div>
                <dt className="text-white/40">{t.hours}</dt>
                <dd className="mt-0.5 text-white/75">{value(row.hours)}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-white/40">{t.prerequisites}</dt>
                <dd className="mt-0.5 leading-relaxed text-white/75">{value(row.prerequisites)}</dd>
              </div>
            </dl>
          </li>
        ))}
      </ul>

      {/* 宽屏：完整对比表 */}
      <div className="hidden overflow-x-auto rounded-3xl border border-white/10 bg-white/5 md:block">
        <table className="w-full min-w-[46rem] border-collapse text-left text-sm">
          <caption className="sr-only">{t.caption}</caption>
          <thead>
            <tr className="border-b border-white/10 text-white/60">
              <th scope="col" className="px-4 py-3 font-medium">{t.title}</th>
              <th scope="col" className="px-4 py-3 font-medium">{t.university}</th>
              <th scope="col" className="px-4 py-3 font-medium">{t.language}</th>
              <th scope="col" className="px-4 py-3 font-medium">{t.level}</th>
              <th scope="col" className="px-4 py-3 font-medium">{t.hours}</th>
              <th scope="col" className="px-4 py-3 font-medium">{t.prerequisites}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row.routePath} className="border-b border-white/5 last:border-0 align-top">
                <th scope="row" className="px-4 py-3 font-semibold text-white">
                  <Link className="text-cyan-200 hover:underline" href={localizedPath(locale, `/course/${row.routePath}`)}>{row.title}</Link>
                </th>
                <td className="px-4 py-3 text-white/70">{value(row.university)}</td>
                <td className="px-4 py-3 text-white/70">{value(row.language)}</td>
                <td className="whitespace-nowrap px-4 py-3 text-white/70">{value(row.level)}</td>
                <td className="whitespace-nowrap px-4 py-3 text-white/70">{value(row.hours)}</td>
                <td className="px-4 py-3 text-white/70">{value(row.prerequisites)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
