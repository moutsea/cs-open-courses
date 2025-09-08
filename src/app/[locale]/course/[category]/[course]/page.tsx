'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Course } from '@/lib/courseParser';
import { getEnglishSlug } from '@/lib/categoryMapping';
import { useTranslations, useLocale } from 'next-intl';

interface CoursePageProps {
  params: Promise<{
    locale: string;
    category: string;
    course: string;
  }>;
}

export default function CoursePage({ params }: CoursePageProps) {
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const t = useTranslations('course');
  const tCourses = useTranslations('courses');
  const locale = useLocale();

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const { locale, category, course: courseName } = await params;
        
        // Build course ID from path components
        // For courses directly in category, the format is `${category}-${category}-${courseName}`
        // For courses in subcategories, the format is `${category}-${subcategory}-${courseName}`
        // We need to try both formats
        const courseId1 = `${category}-${courseName}`;
        const courseId2 = `${category}-${category}-${courseName}`;
        
        let response = await fetch(`/${locale}/api/course/${courseId1}`);
        if (!response.ok) {
          // Try the alternative format
          response = await fetch(`/${locale}/api/course/${courseId2}`);
        }
        
        if (!response.ok) {
          if (response.status === 404) {
            setError(t('notFound'));
          } else {
            setError(t('error'));
          }
          return;
        }
        
        const courseData = await response.json();
        setCourse(courseData);
      } catch (err) {
        console.error('Error fetching course:', err);
        setError(t('error'));
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [params, t]);

  // Convert Chinese path components to English
  const getEnglishPath = (path: string): string => {
    return path.split('/').map(component => {
      // Remove .md extension if present
      const cleanComponent = component.replace('.md', '');
      // Convert to English slug
      const englishSlug = getEnglishSlug(cleanComponent);
      // Add back .md extension if it was there
      return component.endsWith('.md') ? englishSlug + '.md' : englishSlug;
    }).join('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{t('notFound')}</h1>
          <p className="text-gray-600 mb-6">{t('notFoundDescription')}</p>
          <Link href={`/${locale}/courses`} className="text-blue-600 hover:text-blue-800">
            ← {tCourses('backToCourses')}
          </Link>
        </div>
      </div>
    );
  }

  // Format the content with better markdown rendering
  const formatContent = (content: string) => {
    let formatted = content;
    
    // Handle headers first, but skip the first H1 to avoid duplication with page title
    let isFirstH1 = true;
    formatted = formatted.replace(/^# (.*$)/gm, (match, title) => {
      if (isFirstH1) {
        isFirstH1 = false;
        return ''; // Skip the first H1
      }
      return `<h1 class="text-3xl font-bold text-gray-900 mt-8 mb-6">${title}</h1>`;
    });
    
    // Remove Course Overview title but keep the content
    formatted = formatted.replace(/^## Course Overview$/gm, '');
    
    formatted = formatted
      .replace(/^### (.*$)/gm, '<h3 class="text-xl font-semibold text-gray-800 mt-6 mb-4">$1</h3>')
      .replace(/^## (.*$)/gm, '<h2 class="text-2xl font-bold text-gray-900 mt-6 mb-5">$1</h2>');
    
    // Handle lists by splitting lines and processing
    const lines = formatted.split('\n');
    let inNumberedList = false;
    let inBulletList = false;
    const result = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Check for numbered list
      if (/^\d+\.\s+/.test(line)) {
        if (!inNumberedList) {
          if (inBulletList) {
            result.push('</ul>');
            inBulletList = false;
          }
          result.push('<ol class="mb-6 space-y-3 bg-blue-50 p-4 rounded-lg border-l-4 border-blue-300">');
          inNumberedList = true;
        }
        let itemText = line.replace(/^\d+\.\s+/, '');
        // Process markdown within list items
        itemText = itemText
          .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-800">$1</strong>')
          .replace(/\*(.*?)\*/g, '<em class="italic text-gray-700">$1</em>')
          .replace(/`(.*?)`/g, '<code class="bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm font-mono">$1</code>')
          .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline">$1</a>')
          .replace(/<(https?:\/\/[^\s>]+)>/g, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline">$1</a>');
        result.push(`<li class="mb-3 ml-6 list-decimal text-gray-700 leading-relaxed">${itemText}</li>`);
      }
      // Check for bullet list
      else if (/^[\-\*]\s+/.test(line)) {
        if (!inBulletList) {
          if (inNumberedList) {
            result.push('</ol>');
            inNumberedList = false;
          }
          result.push('<ul class="mb-6 space-y-3 bg-gray-50 p-4 rounded-lg border-l-4 border-gray-300">');
          inBulletList = true;
        }
        let itemText = line.replace(/^[\-\*]\s+/, '');
        // Process markdown within list items
        itemText = itemText
          .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-800">$1</strong>')
          .replace(/\*(.*?)\*/g, '<em class="italic text-gray-700">$1</em>')
          .replace(/`(.*?)`/g, '<code class="bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm font-mono">$1</code>')
          .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline">$1</a>')
          .replace(/<(https?:\/\/[^\s>]+)>/g, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline">$1</a>');
        result.push(`<li class="mb-3 ml-6 list-disc text-gray-700 leading-relaxed">${itemText}</li>`);
      }
      // Empty line or other content
      else {
        if (inNumberedList) {
          result.push('</ol>');
          inNumberedList = false;
        }
        if (inBulletList) {
          result.push('</ul>');
          inBulletList = false;
        }
        result.push(line);
      }
    }
    
    // Close any open lists
    if (inNumberedList) result.push('</ol>');
    if (inBulletList) result.push('</ul>');
    
    formatted = result.join('\n');
    
    // Handle other markdown elements - be more careful with lists
    // Since lists are already processed, we'll apply markdown to everything else
    const contentLines = formatted.split('\n');
    const processedLines = [];
    let inList = false;
    
    for (const line of contentLines) {
      if (line.includes('<ol class="') || line.includes('<ul class="')) {
        inList = true;
        processedLines.push(line);
      } else if (line.includes('</ol>') || line.includes('</ul>')) {
        inList = false;
        processedLines.push(line);
      } else if (!inList) {
        // Process markdown for non-list content
        const processedLine = line
          .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-800">$1</strong>')
          .replace(/\*(.*?)\*/g, '<em class="italic text-gray-700">$1</em>')
          .replace(/`(.*?)`/g, '<code class="bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm font-mono">$1</code>')
          .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline">$1</a>')
          .replace(/<(https?:\/\/[^\s>]+)>/g, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline">$1</a>');
        processedLines.push(processedLine);
      } else {
        processedLines.push(line);
      }
    }
    
    formatted = processedLines.join('\n');
    
    // Handle paragraphs and line breaks
    formatted = formatted
      .replace(/\n\n/g, '</p><p class="mb-4 text-gray-700 leading-relaxed">')
      .replace(/\n(?![<])/g, '<br />');
    
    return formatted;
  };

  const formattedContent = `<p class="mb-4 text-gray-700 leading-relaxed">${formatContent(course.content)}</p>`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4 py-6 max-w-4xl">
          <div className="flex items-center justify-between">
            <Link 
              href={`/${locale}/courses`} 
              className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              {tCourses('backToCourses')}
            </Link>
            
            {course.hasEnglishVersion && (
              <div className="flex items-center px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm font-medium">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                </svg>
                {locale === 'zh' ? '英文版本' : 'English Version'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Course Header */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-gray-900 mb-4 leading-tight">
                {course.title}
              </h1>
              <div className="flex items-center text-sm text-gray-500 space-x-4">
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                    {getEnglishPath(course.path).replace('.md', '')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Course Content */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="border-b border-gray-200 px-8 py-6 bg-gradient-to-r from-blue-50 to-indigo-50">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <svg className="w-6 h-6 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              {t('courseContent')}
            </h2>
          </div>
          
          <div className="p-8">
            <div 
              className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-strong:text-gray-800 prose-code:bg-gray-100 prose-code:text-gray-800 prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline"
              dangerouslySetInnerHTML={{ 
                __html: formattedContent
              }} 
            />
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <Link 
            href={`/${locale}/courses`} 
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            {tCourses('browseMore')}
          </Link>
        </div>
      </div>
    </div>
  );
}