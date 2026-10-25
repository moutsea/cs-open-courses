import type { CourseResource, FactRow, FactLocale, ResourceKind } from '@/lib/courseFacts'
import { resourceKindLabel } from '@/lib/courseFacts'

/**
 * "课程官网 · 课程网站" is noise. Source markdown often labels a link with nothing but its type,
 * so the badge is only kept when the label actually carries information.
 */
const GENERIC_LABEL: Record<ResourceKind, RegExp> = {
  website: /^(课程)?(官网|网站|主页|首页|课程主页|课程网站|website|site|homepage)$/i,
  video: /^(课程)?(视频|录播|课程视频|lectures?|videos?)$/i,
  textbook: /^(课程)?(教材|课本|书|textbook|book)$/i,
  assignment: /^(课程)?(作业|实验|课程作业|labs?|homework|assignments?)$/i,
  other: /^$/
}

function isGenericLabel(kind: ResourceKind, label: string): boolean {
  return GENERIC_LABEL[kind].test(label.trim())
}

interface CourseFactSheetProps {
  rows: FactRow[]
  resources: CourseResource[]
  locale: FactLocale
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

export default function CourseFactSheet({ rows, resources, locale }: CourseFactSheetProps) {
  const isZh = locale === 'zh'
  if (rows.length === 0 && resources.length === 0) return null

  const candidates = resources.filter(item => item.url && item.available !== false)
  const firstOfEachKind = new Map<ResourceKind, CourseResource>()
  for (const link of candidates) {
    if (!firstOfEachKind.has(link.kind)) firstOfEachKind.set(link.kind, link)
  }
  // Retain each resource type before filling the remaining slots with archives.
  const extraLinks = candidates.filter(link => firstOfEachKind.get(link.kind) !== link)
  const selected = new Set([...firstOfEachKind.values(), ...extraLinks].slice(0, 8))
  const links = candidates.filter(link => selected.has(link))

  return (
    <section
      aria-label={isZh ? '课程速览' : 'Course at a glance'}
      className="mb-8 rounded-3xl border border-white/10 bg-white/[0.04] p-5 sm:p-6"
    >
      <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.3em] text-cyan-200/80">
        {isZh ? '课程速览' : 'At a glance'}
      </h2>

      {rows.length > 0 && (
        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map(row => (
            <div key={row.label} className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3">
              <dt className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-white/50">{row.label}</dt>
              <dd className="mt-1 text-sm font-medium text-white/90">{row.value}</dd>
            </div>
          ))}
        </dl>
      )}

      {links.length > 0 && (
        <div className="mt-5">
          <p className="mb-2 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-white/50">
            {isZh ? '官方资源' : 'Official resources'}
          </p>
          <ul className="flex flex-wrap gap-2">
            {links.map(link => {
              const kindLabel = resourceKindLabel(link.kind, locale)
              const showKind = Boolean(link.label) && !isGenericLabel(link.kind, link.label)
              return (
                <li key={`${link.kind}-${link.url}`}>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1.5 text-xs font-medium text-cyan-100 transition hover:border-cyan-200/60 hover:bg-cyan-300/20"
                    title={`${link.label || kindLabel} · ${hostOf(link.url)}`}
                  >
                    {showKind && (
                      <span className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-cyan-200/70">
                        {kindLabel}
                      </span>
                    )}
                    <span className="max-w-[14rem] truncate">{link.label || kindLabel}</span>
                  </a>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </section>
  )
}
