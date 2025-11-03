'use client';

import Link from 'next/link';
import { sanitizeMarkdownHTML } from '@/lib/htmlSanitizer';
import PageLayout from './PageLayout';

interface MDXRendererProps {
  content: string;
  locale: string;
  isFallback?: boolean;
}

export default function MDXRenderer({
  content,
  locale,
  isFallback = false,
}: MDXRendererProps) {
  const isChinese = locale === 'zh';

  // 净化HTML内容以防止XSS攻击
  const sanitizedContent = sanitizeMarkdownHTML(content);

  return (
    <PageLayout locale={locale}>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Back to courses button */}
        <div className="mb-6">
          <Link
            href={locale === 'en' ? `/courses` : `/${locale}/courses`}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            {isChinese ? '返回课程列表' : 'Back to Courses'}
          </Link>
        </div>

        {/* Fallback language notice */}
        {isFallback && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800 text-sm">
              {isChinese
                ? '注意：此课程暂无中文版本，显示的是英文版本。'
                : 'Note: This course is not available in English, showing Chinese version.'
              }
            </p>
          </div>
        )}

        {/* Course content */}
        <article className="bg-white rounded-lg shadow-sm p-6">
          <div
            className="prose prose-lg max-w-none"
            dangerouslySetInnerHTML={{ __html: sanitizedContent }}
          />
        </article>
      </div>
    </PageLayout>
  );
}