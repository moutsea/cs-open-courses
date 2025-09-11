'use client';

import Link from 'next/link';
import { Course } from '@/lib/courseParser';
import { buildDynamicRoutePath } from '@/lib/pathUtils';
import { useSafeTranslations, getDifficultyColor } from '@/lib/translationUtils';

interface CourseCardProps {
  course: Course;
  locale: string;
  forceLanguage?: 'en' | 'zh';
}

export default function CourseCard({ course, locale, forceLanguage }: CourseCardProps) {
  const resolvedLocale = forceLanguage || locale;
  const { t } = useSafeTranslations('courses', resolvedLocale);

  return (
    <div className="relative bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 cursor-pointer border border-gray-100 hover:border-blue-100 group overflow-hidden">
      {/* Card Header with icon */}
      <div className="mb-4">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mb-3 group-hover:scale-105 transition-transform duration-300">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
        
        <Link href={`/${resolvedLocale}/course/${buildDynamicRoutePath(course.path).join('/')}`}>
          <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors duration-300 leading-tight">
            {course.title}
          </h3>
        </Link>
      </div>

      {/* Course Metadata */}
      <div className="mb-4 space-y-2">
        {course.difficulty && (
          <div className="flex items-center text-sm">
            <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{t('difficulty')}: </span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ml-1 ${getDifficultyColor(course.difficulty)}`}>
              {course.difficulty}
            </span>
          </div>
        )}
        
        {course.duration && (
          <div className="flex items-center text-sm">
            <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{t('duration')}: </span>
            <span className="ml-2 text-xs text-gray-600 font-medium">
              {
                typeof course.duration === 'object' 
                  ? `${course.duration.value} ${resolvedLocale === 'en' ? 'hours' : '小时'}`
                  : (() => {
                      // 处理字符串类型的duration
                      const durationStr = course.duration.toString();
                      if (resolvedLocale === 'en') {
                        // 如果已经包含"hours"，直接返回
                        if (durationStr.toLowerCase().includes('hours')) {
                          return durationStr;
                        }
                        // 移除中文的"小时"字样
                        const cleanDuration = durationStr.replace(/\s*小时\s*$/, '').trim();
                        return `${cleanDuration} hours`;
                      }
                      // 中文环境下，如果包含"hours"，替换为"小时"
                      if (durationStr.toLowerCase().includes('hours')) {
                        return durationStr.replace(/hours/i, '小时');
                      }
                      return durationStr;
                    })()
              }
            </span>
          </div>
        )}
        
        {course.programmingLanguage && (
          <div className="flex items-center text-sm">
            <svg className="w-4 h-4 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
            <span>{t('language')}: </span>
            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium ml-1">
              {course.programmingLanguage}
            </span>
          </div>
        )}
      </div>

      {/* Course Description */}
      {(course.summary || course.summaryEn) && (
        <div className="mb-4">
          <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">
            {resolvedLocale === 'en' && course.summaryEn ? course.summaryEn : course.summary}
          </p>
        </div>
      )}

      {/* View Course Button */}
      <div className="flex justify-end pt-4 border-t border-gray-100">
        <Link 
          href={`/${resolvedLocale}/course/${buildDynamicRoutePath(course.path).join('/')}`}
          className="flex items-center text-blue-600 hover:text-blue-800 transition-colors duration-300 text-sm font-medium"
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