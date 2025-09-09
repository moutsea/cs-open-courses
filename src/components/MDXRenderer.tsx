'use client';

import { useState } from 'react';
import Header from '@/components/Header';

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
        {/* Language switcher */}
        <div className="mb-6 flex justify-end">
          <div className="bg-white rounded-lg shadow-sm p-2 inline-flex">
            {hasChineseVersion && (
              <a
                href={`/${locale === 'zh' ? 'en' : 'zh'}/course/${coursePath.join('/')}`}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  isChinese
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                中文
              </a>
            )}
            {hasEnglishVersion && (
              <a
                href={`/${locale === 'zh' ? 'en' : 'zh'}/course/${coursePath.join('/')}`}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  !isChinese
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                English
              </a>
            )}
          </div>
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
    </div>
  );
}