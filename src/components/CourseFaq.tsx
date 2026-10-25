import { Fragment, type ReactNode } from 'react'
import type { CourseFaqItem } from '@/lib/courseFacts'

interface CourseFaqProps {
  items: CourseFaqItem[]
  locale: string
  /** Used for the section heading, e.g. course title. */
  title?: string
  /** Heading id; pages that render more than one FAQ block must pass distinct values. */
  id?: string
}

const URL_PATTERN = /(https?:\/\/[^\s"<>“”‘’「」『』《》）。，；、：]+)/g
const TRAILING_PUNCTUATION = /[.,;:!?]+$/

function trimUrlPunctuation(value: string): string {
  let url = value.replace(TRAILING_PUNCTUATION, '')
  // Keep parentheses that belong to the URL, e.g. /Book_(2026), while
  // excluding an enclosing prose parenthesis from the clickable target.
  let extraClosing = (url.match(/\)/g)?.length || 0) - (url.match(/\(/g)?.length || 0)
  while (extraClosing > 0 && url.endsWith(')')) {
    url = url.slice(0, -1).replace(TRAILING_PUNCTUATION, '')
    extraClosing--
  }
  return url
}

function AnswerLink({ href }: { href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="break-all text-cyan-300 underline decoration-cyan-300/40 underline-offset-2 transition hover:text-cyan-200"
    >
      {href.replace(/^https?:\/\//i, '')}
    </a>
  )
}

/** Plain-text FAQs and prose still use automatic URL detection. */
function renderText(answer: string): ReactNode[] {
  return answer.split(URL_PATTERN).map((part, index) => {
    if (!/^https?:\/\//.test(part)) return <span key={index}>{part}</span>
    const href = trimUrlPunctuation(part)
    const trailing = part.slice(href.length)
    return (
      <span key={index}>
        <AnswerLink href={href} />
        {trailing}
      </span>
    )
  })
}

function renderAnswer(item: CourseFaqItem): ReactNode[] {
  if (!item.answerParts) return renderText(item.a)
  return item.answerParts.map((part, index) => {
    if (typeof part === 'string') return <Fragment key={index}>{renderText(part)}</Fragment>
    // These targets already came from parsed links. Their punctuation is part
    // of the URL, even when it looks like the end of a sentence.
    return /^https?:\/\//i.test(part.url)
      ? <AnswerLink key={index} href={part.url} />
      : <span key={index}>{part.url}</span>
  })
}

export default function CourseFaq({ items, locale, title, id = 'course-faq' }: CourseFaqProps) {
  const isZh = locale === 'zh'
  if (items.length === 0) return null
  const heading = title || (isZh ? '常见问题' : 'Frequently asked questions')

  return (
    <section aria-labelledby={id} className="mt-10 rounded-3xl border border-white/10 bg-white/[0.04] p-5 sm:p-6">
      <h2 id={id} className="mb-4 text-lg font-semibold text-white">{heading}</h2>
      <div className="space-y-2">
        {items.map(item => (
          <details key={item.q} className="group rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3">
            <summary className="flex cursor-pointer list-none items-start gap-2 text-sm font-medium text-white/90 transition group-open:text-cyan-200">
              <span aria-hidden="true" className="mt-[0.15rem] text-cyan-300/70 transition group-open:rotate-90">▸</span>
              {/* heading 不能嵌在 span 里：span 的 content model 只允许 phrasing content。 */}
              <h3 className="text-sm font-semibold">{item.q}</h3>
            </summary>
            <p className="mt-2 break-words pl-6 text-sm leading-relaxed text-white/70">{renderAnswer(item)}</p>
          </details>
        ))}
      </div>
    </section>
  )
}
