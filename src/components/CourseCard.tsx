'use client';

import Link from 'next/link';
import { Course } from '@/lib/courseParser';
import { useState } from 'react';
import { useLocale } from 'next-intl';
import { useTranslations } from 'next-intl';

interface CourseCardProps {
  course: Course;
  forceLanguage?: 'en' | 'zh';
}

export default function CourseCard({ course, forceLanguage }: CourseCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hookLocale = useLocale();
  const locale = forceLanguage || hookLocale;
  const t = useTranslations('courses');

  const toggleExpanded = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsExpanded(!isExpanded);
  };

  
  return (
    <div className="relative bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 cursor-pointer border border-gray-100 hover:border-blue-100 group overflow-hidden">
      {/* Card Header with icon */}
      <div className="mb-4">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mb-3 group-hover:scale-105 transition-transform duration-300">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
        
        <Link href={`/${locale}/course/${course.categorySlug || course.id.split('-')[0]}/${course.slug}`}>
          <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors duration-300 leading-tight">
            {course.title}
          </h3>
        </Link>
      </div>

      {/* Course Metadata */}
      <div className="mb-4 space-y-2">
        {course.difficulty && (
          <div className="flex items-center text-sm text-gray-600">
            <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{t('difficulty')}: {course.difficulty}</span>
          </div>
        )}
        
        {course.duration && (
          <div className="flex items-center text-sm text-gray-600">
            <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>
              {t('duration')}: {
                typeof course.duration === 'object' 
                  ? `${course.duration.value} ${locale === 'en' ? 'hours' : '小时'}`
                  : course.duration
              }
            </span>
          </div>
        )}
        
        {course.programmingLanguage && (
          <div className="flex items-center text-sm text-gray-600">
            <svg className="w-4 h-4 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
            <span>{t('language')}: {course.programmingLanguage}</span>
          </div>
        )}
      </div>

      {/* Collapsible Course Description */}
      {(course.summary || course.summaryEn) && (
        <div className="mb-4">
          <div className={`text-gray-600 text-sm leading-relaxed transition-all duration-300 overflow-hidden ${
            isExpanded ? 'max-h-96' : 'max-h-0'
          }`}>
            <p>
              {isExpanded 
                ? (locale === 'en' && course.contentEn ? course.contentEn : course.content)
                : (locale === 'en' && course.summaryEn ? course.summaryEn : course.summary)
              }
            </p>
          </div>
        </div>
      )}

      {/* Bottom Actions */}
      <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
        {(course.summary || course.summaryEn) && (
          <button
            onClick={toggleExpanded}
            className="flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors duration-200"
          >
            <span>{isExpanded ? t('showLess') : t('showMore')}</span>
            <svg 
              className={`w-4 h-4 ml-1 transition-transform duration-200 ${
                isExpanded ? 'rotate-180' : ''
              }`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        )}
        
        <Link 
          href={`/${locale}/course/${course.categorySlug || course.id.split('-')[0]}/${course.slug}`}
          className="flex items-center text-gray-500 hover:text-blue-600 transition-colors duration-300 text-sm font-medium"
          onClick={(e) => e.stopPropagation()}
        >
          <span>{t('viewCourse')}</span>
          <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-blue-50 to-purple-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
      <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-blue-50 to-purple-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
    </div>
  );
}