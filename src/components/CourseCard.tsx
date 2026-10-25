'use client';

import Link from 'next/link';
import { memo } from 'react';
import { Course } from '@/lib/courseParser';
import { buildDynamicRoutePath, localizedPath } from '@/lib/pathUtils';
import { useSafeTranslations, getDifficultyColor } from '@/lib/translationUtils';
import { difficultyLabel } from '@/lib/courseFacts';

interface CourseCardProps {
  course: Course;
  locale: string;
  forceLanguage?: 'en' | 'zh';
  /** 保留旧 API：默认与 immersive 都是深色卡片，仅内边距不同。 */
  variant?: 'default' | 'immersive';
}

const CourseCard = memo(function CourseCard({ course, locale, forceLanguage, variant = 'immersive' }: CourseCardProps) {
  const resolvedLocale = forceLanguage || locale;
  const { t } = useSafeTranslations('courses', resolvedLocale);
  const padding = variant === 'default' ? 'p-5' : 'p-6';

  return (
    <div
      className={`group relative cursor-pointer overflow-hidden rounded-2xl border border-white/10 bg-white/5 ${padding} text-slate-100 backdrop-blur-xl transition-all duration-300 hover:border-white/25 hover:bg-white/10`}
    >
      <div className="mb-4">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl border border-cyan-300/20 bg-cyan-400/15 text-cyan-200 transition-transform duration-300 group-hover:scale-105">
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>

        <Link href={localizedPath(resolvedLocale, `/course/${buildDynamicRoutePath(course.path).join('/')}`)}>
          <h3 className="mb-2 text-xl font-bold leading-tight text-white transition-colors duration-300 group-hover:text-cyan-200">
            {course.title}
          </h3>
        </Link>
      </div>

      <div className="mb-4 space-y-2 text-sm text-white/70">
        {course.difficulty && (
          <div className="flex items-center">
            <svg className="mr-2 h-4 w-4 text-cyan-200/80" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{t('difficulty')}: </span>
            <span className={`ml-1 rounded-full px-2 py-1 text-xs font-medium ${getDifficultyColor(course.difficulty)}`}>
              {difficultyLabel(course.difficulty, resolvedLocale === 'zh' ? 'zh' : 'en') ?? course.difficulty}
            </span>
          </div>
        )}

        {course.duration && (
          <div className="flex items-center">
            <svg className="mr-2 h-4 w-4 text-emerald-300/80" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{t('duration')}: </span>
            <span className="ml-2 text-xs font-medium text-white/70">
              {
                typeof course.duration === 'object'
                  ? course.duration.value !== null
                    ? `${course.duration.value} ${resolvedLocale === 'en' ? 'hours' : '小时'}`
                    : course.duration.originalText
                  : (() => {
                      const durationStr = course.duration.toString();
                      if (resolvedLocale === 'en') {
                        if (durationStr.toLowerCase().includes('hours')) return durationStr;
                        return `${durationStr.replace(/\s*小时\s*$/, '').trim()} hours`;
                      }
                      if (durationStr.toLowerCase().includes('hours')) return durationStr.replace(/hours/i, '小时');
                      return durationStr;
                    })()
              }
            </span>
          </div>
        )}

        {course.programmingLanguage && (
          <div className="flex items-center">
            <svg className="mr-2 h-4 w-4 text-cyan-200/60" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
            <span>{t('language')}: </span>
            <span className="ml-1 rounded-full border border-white/10 bg-white/10 px-2 py-1 text-xs font-medium text-white/70">
              {course.programmingLanguage}
            </span>
          </div>
        )}
      </div>

      {(course.summary || course.summaryEn) && (
        <div className="mb-4">
          <p className="line-clamp-3 text-sm leading-relaxed text-white/60">
            {resolvedLocale === 'en' && course.summaryEn ? course.summaryEn : course.summary}
          </p>
        </div>
      )}

      <div className="flex justify-end border-t border-white/10 pt-4">
        <Link
          href={localizedPath(resolvedLocale, `/course/${buildDynamicRoutePath(course.path).join('/')}`)}
          className="flex items-center text-sm font-medium text-cyan-200 transition-colors duration-300 hover:text-cyan-100"
        >
          <span>{t('viewCourse')}</span>
          <svg className="ml-1 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  );
});

export default CourseCard;
