'use client';

import Link from 'next/link';
import { sanitizeMarkdownHTML } from '@/lib/htmlSanitizer';
import PageLayout from './PageLayout';
import { getChineseName } from '@/lib/categoryMapping';

interface MDXRendererProps {
  content: string;
  locale: string;
  isFallback?: boolean;
  title?: string;
  categorySlug?: string;
  subcategorySlug?: string;
  hasEnglishVersion?: boolean;
  hasChineseVersion?: boolean;
}

export default function MDXRenderer({
  content,
  locale,
  isFallback = false,
  title,
  categorySlug,
  subcategorySlug,
  hasEnglishVersion = false,
  hasChineseVersion = false
}: MDXRendererProps) {
  const isChinese = locale === 'zh';
  const courseTitle = title || (isChinese ? '课程内容' : 'Course');

  const formatSlug = (slug?: string) => {
    if (!slug) return '';
    if (isChinese) {
      return getChineseName(slug);
    }
    return slug
      .replace(/-/g, ' ')
      .replace(/\b\w/g, letter => letter.toUpperCase());
  };

  const displayCategory = formatSlug(categorySlug);
  const displaySubcategory = formatSlug(subcategorySlug);

  const languageChips: Array<{ short: string; label: string }> = [];
  if (hasEnglishVersion) {
    languageChips.push({
      short: 'EN',
      label: isChinese ? '英文版' : 'English'
    });
  }
  if (hasChineseVersion) {
    languageChips.push({
      short: '中',
      label: isChinese ? '中文版' : 'Chinese'
    });
  }

  // 净化HTML内容以防止XSS攻击
  const sanitizedContent = sanitizeMarkdownHTML(content);
  const contentWithoutHeading = title
    ? sanitizedContent.replace(/<h1[^>]*>[\s\S]*?<\/h1>/, '').trim()
    : '';
  const displayContent =
    contentWithoutHeading.length > 0 ? contentWithoutHeading : sanitizedContent;

  const backToCoursesHref = locale === 'en' ? `/courses` : `/${locale}/courses`;

  return (
    <PageLayout locale={locale}>
      <div className="relative isolate overflow-hidden bg-slate-950 text-white">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-10 left-1/3 h-72 w-72 rounded-full bg-blue-500/30 blur-[200px]"></div>
          <div className="absolute top-24 right-0 h-64 w-64 rounded-full bg-purple-500/20 blur-[180px]"></div>
          <div className="absolute -bottom-10 left-10 h-80 w-80 rounded-full bg-cyan-400/20 blur-[180px]"></div>
        </div>

        <div className="relative mx-auto max-w-6xl px-4 pt-16 pb-24 sm:px-6 lg:px-8">
          <div className="space-y-8">
            <Link
              href={backToCoursesHref}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/80 transition hover:border-white/30 hover:text-white"
            >
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/20 bg-white/10">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </span>
              {isChinese ? '返回课程列表' : 'Back to Courses'}
            </Link>

            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.35em] text-white/80">
                {displayCategory && (
                  <span className="rounded-full border border-white/15 bg-white/5 px-4 py-1.5">
                    {displayCategory}
                  </span>
                )}
                {displaySubcategory && (
                  <span className="rounded-full border border-white/15 bg-white/5 px-4 py-1.5">
                    {displaySubcategory}
                  </span>
                )}
                {languageChips.map(chip => (
                  <span
                    key={chip.short}
                    className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-[0.7rem] tracking-[0.3em]"
                  >
                    <span className="text-xs font-bold">{chip.short}</span>
                    <span className="tracking-[0.15em] text-white/70">{chip.label}</span>
                  </span>
                ))}
                {isFallback && (
                  <span className="rounded-full border border-amber-300/70 bg-amber-300/10 px-4 py-1.5 text-[0.7rem] tracking-[0.3em] text-amber-100">
                    {isChinese ? '当前显示英文原版' : 'Showing alternate language'}
                  </span>
                )}
              </div>

              <div className="space-y-4">
                <p className="text-sm uppercase tracking-[0.5em] text-white/60">
                  {isChinese ? '课程内容' : 'Course Outline'}
                </p>
                <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">
                  {courseTitle}
                </h1>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 mx-auto max-w-5xl px-4 pb-16 sm:px-6 lg:px-8">
          <div className="rounded-[36px] border border-white/15 bg-slate-900/80 p-6 text-white shadow-[0_40px_120px_rgba(2,6,23,0.45)] backdrop-blur-2xl sm:p-10">
            {isFallback && (
              <div className="mb-6 rounded-2xl border border-amber-200/40 bg-amber-200/10 px-4 py-4 text-sm text-amber-100">
                {isChinese
                  ? '提示：此课程暂无完整中文内容，当前展示英文原版。'
                  : "Heads up: this course is not available in English yet, so we're showing the Chinese version."}
              </div>
            )}

            <article className="markdown-content space-y-6 text-slate-100 leading-relaxed">
              <div dangerouslySetInnerHTML={{ __html: displayContent }} />
            </article>
          </div>
        </div>
      </div>
      <style jsx global>{`
        .markdown-content {
          font-size: 1.08rem;
          line-height: 1.85;
          letter-spacing: 0.01em;
        }
        .markdown-content :where(p, li, span, blockquote, td, th) {
          color: #e2e8f0;
        }
        .markdown-content :where(h1) {
          font-size: clamp(2.5rem, 5vw, 3rem);
        }
        .markdown-content :where(h2) {
          font-size: clamp(2rem, 4vw, 2.4rem);
        }
        .markdown-content :where(h3) {
          font-size: clamp(1.65rem, 3vw, 2rem);
        }
        .markdown-content :where(h4, h5, h6) {
          font-size: 1.2rem;
        }
        .markdown-content :where(h1, h2, h3, h4, h5, h6) {
          color: #f8fafc;
          margin-top: 2.5rem;
          margin-bottom: 1.25rem;
          font-weight: 600;
          line-height: 1.25;
        }
        .markdown-content :where(p + p) {
          margin-top: 1.2rem;
        }
        .markdown-content :where(a) {
          color: #67e8f9;
          text-decoration: underline;
          text-decoration-color: rgba(103, 232, 249, 0.4);
        }
        .markdown-content :where(a:hover) {
          text-decoration-color: rgba(103, 232, 249, 0.8);
        }
        .markdown-content :where(code) {
          color: #f9a8d4;
          background-color: rgba(15, 23, 42, 0.65);
          padding: 0.15rem 0.4rem;
          border-radius: 0.375rem;
        }
        .markdown-content :where(pre) {
          margin-top: 1.5rem;
          margin-bottom: 1.5rem;
          padding: 1rem;
          border-radius: 1.25rem;
          background: linear-gradient(130deg, rgba(15,35,64,0.95), rgba(31,41,79,0.85));
          border: 1px solid rgba(255,255,255,0.08);
        }
        .markdown-content :where(pre code) {
          display: block;
          padding: 0;
          background: transparent;
          border-radius: 0;
        }
        .markdown-content :where(blockquote) {
          border-left: 3px solid rgba(147, 197, 253, 0.6);
          padding-left: 1.25rem;
          margin: 2rem 0;
          font-style: italic;
          color: #cbd5f5;
        }
        .markdown-content :where(table) {
          width: 100%;
          border-collapse: collapse;
          margin: 2rem 0;
          font-size: 0.95em;
        }
        .markdown-content :where(th) {
          background-color: rgba(248, 250, 252, 0.08);
          font-weight: 600;
        }
        .markdown-content :where(th, td) {
          border: 1px solid rgba(248, 250, 252, 0.15);
          padding: 0.85rem;
        }
        .markdown-content :where(ul, ol) {
          padding-left: 1.6rem;
          margin: 1.2rem 0;
        }
        .markdown-content :where(li + li) {
          margin-top: 0.4rem;
        }
        .markdown-content :where(hr) {
          border: none;
          border-top: 1px dashed rgba(248, 250, 252, 0.2);
          margin: 2.5rem 0;
        }
        .markdown-content :where(img) {
          border-radius: 1.25rem;
          border: 1px solid rgba(248, 250, 252, 0.15);
          box-shadow: 0 25px 60px rgba(2, 6, 23, 0.45);
        }
      `}</style>
    </PageLayout>
  );
}
