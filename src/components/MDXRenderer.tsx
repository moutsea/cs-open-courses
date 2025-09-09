'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface MDXRendererProps {
  content: string;
  title: string;
  locale: string;
  hasEnglishVersion?: boolean;
  hasChineseVersion?: boolean;
  isFallback?: boolean;
  coursePath: string[];
}

export default function MDXRenderer({ 
  content, 
  title, 
  locale, 
  hasEnglishVersion = false, 
  hasChineseVersion = false,
  isFallback = false,
  coursePath 
}: MDXRendererProps) {
  const [copiedCode, setCopiedCode] = useState<string>('');

  const handleCopyCode = (code: string, event: React.MouseEvent) => {
    event.preventDefault();
    navigator.clipboard.writeText(code).then(() => {
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(''), 2000);
    });
  };

  const isChinese = locale === 'zh';

  return (
    <div className="min-h-screen flex flex-col">
      <Header locale={locale} />
      <main className="flex-grow container mx-auto px-4 py-8 max-w-4xl">
        {/* Back to courses button */}
        <div className="mb-6">
          <a
            href={`/${locale}/courses`}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            {isChinese ? '返回课程列表' : 'Back to Courses'}
          </a>
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
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </article>

        {/* Copy code notification */}
        {copiedCode && (
          <div className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg">
            Code copied to clipboard!
          </div>
        )}
      </main>
      
      <Footer locale={locale} />
    </div>
  );
}