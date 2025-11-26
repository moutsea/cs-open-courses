'use client';

import Link from 'next/link';
import { memo } from 'react';
import { Course } from '@/lib/courseParser';
import { buildDynamicRoutePath } from '@/lib/pathUtils';
import { useSafeTranslations, getDifficultyColor } from '@/lib/translationUtils';

interface CourseCardProps {
  course: Course;
  locale: string;
  forceLanguage?: 'en' | 'zh';
  variant?: 'default' | 'immersive';
}

const CourseCard = memo(function CourseCard({ course, locale, forceLanguage, variant = 'default' }: CourseCardProps) {
  const resolvedLocale = forceLanguage || locale;
  const { t } = useSafeTranslations('courses', resolvedLocale);
  const isImmersive = variant === 'immersive';

  const cardClassName = isImmersive
    ? 'relative rounded-2xl border border-white/10 bg-white/5 text-slate-100 shadow-[0_20px_70px_rgba(2,6,23,0.5)] hover:border-white/20 hover:bg-white/10 transition-all duration-500 p-6 cursor-pointer group overflow-hidden backdrop-blur-xl'
    : 'relative bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 cursor-pointer border border-gray-100 hover:border-blue-100 group overflow-hidden';

  return (
    <div className={cardClassName}>
      {/* Card Header with icon */}
      <div className="mb-4">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-3 group-hover:scale-105 transition-transform duration-300 ${isImmersive ? 'bg-gradient-to-br from-blue-500/80 via-indigo-500/80 to-purple-600/80 shadow-[0_10px_30px_rgba(59,130,246,0.45)]' : 'bg-gradient-to-br from-blue-500 to-purple-600'}`}>
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
        
        <Link href={`/${resolvedLocale}/course/${buildDynamicRoutePath(course.path).join('/')}`}>
          <h3 className={`text-xl font-bold mb-2 transition-colors duration-300 leading-tight ${isImmersive ? 'text-white group-hover:text-blue-200' : 'text-gray-900 group-hover:text-blue-600'}`}>
            {course.title}
          </h3>
        </Link>
      </div>

      {/* Course Metadata */}
      <div className="mb-4 space-y-2 text-sm">
        {course.difficulty && (
          <div className={`flex items-center ${isImmersive ? 'text-slate-200' : ''}`}>
            <svg className={`w-4 h-4 mr-2 ${isImmersive ? 'text-blue-200' : 'text-blue-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{t('difficulty')}: </span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ml-1 ${getDifficultyColor(course.difficulty)}`}>
              {course.difficulty}
            </span>
          </div>
        )}
        
        {course.duration && (
          <div className={`flex items-center ${isImmersive ? 'text-slate-200' : ''}`}>
            <svg className={`w-4 h-4 mr-2 ${isImmersive ? 'text-emerald-300' : 'text-green-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{t('duration')}: </span>
            <span className={`ml-2 text-xs font-medium ${isImmersive ? 'text-slate-100' : 'text-gray-600'}`}>
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
          <div className={`flex items-center ${isImmersive ? 'text-slate-200' : ''}`}>
            <svg className={`w-4 h-4 mr-2 ${isImmersive ? 'text-purple-300' : 'text-purple-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
            <span>{t('language')}: </span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ml-1 ${isImmersive ? 'bg-blue-500/20 text-blue-100 border border-blue-300/20' : 'bg-blue-100 text-blue-800'}`}>
              {course.programmingLanguage}
            </span>
          </div>
        )}
      </div>

      {/* Course Description */}
      {(course.summary || course.summaryEn) && (
        <div className="mb-4">
          <p className={`text-sm leading-relaxed line-clamp-3 ${isImmersive ? 'text-slate-200' : 'text-gray-600'}`}>
            {resolvedLocale === 'en' && course.summaryEn ? course.summaryEn : course.summary}
          </p>
        </div>
      )}

      {/* View Course Button */}
      <div className={`flex justify-end pt-4 border-t ${isImmersive ? 'border-white/10' : 'border-gray-100'}`}>
        <Link 
          href={`/${resolvedLocale}/course/${buildDynamicRoutePath(course.path).join('/')}`}
          className={`flex items-center text-sm font-medium transition-colors duration-300 ${isImmersive ? 'text-blue-100 hover:text-white' : 'text-blue-600 hover:text-blue-800'}`}
        >
          <span>{t('viewCourse')}</span>
          <svg className={`w-4 h-4 ml-1 group-hover:translate-x-1 transition-all duration-300 ${isImmersive ? 'text-blue-200' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      {/* Decorative background elements */}
      {isImmersive ? (
        <>
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-blue-500/10 via-purple-500/10 to-transparent rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl -z-10" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-cyan-400/10 via-blue-500/10 to-transparent rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl -z-10" />
        </>
      ) : (
        <>
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-blue-50 to-purple-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-blue-50 to-purple-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
        </>
      )}
    </div>
  );
});

export default CourseCard;
