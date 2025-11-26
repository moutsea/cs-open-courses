'use client';

import Link from 'next/link';
import { Course } from '@/lib/courseParser';
import { buildDynamicRoutePath } from '@/lib/pathUtils';
import { useSafeTranslations, getDifficultyColor } from '@/lib/translationUtils';

interface PopularCoursesProps {
  courses: Course[];
  locale: string;
}

export default function PopularCourses({ courses, locale }: PopularCoursesProps) {
  const { t } = useSafeTranslations('home', locale);

  const getDurationStyle = (duration: string) => {
    const durationNum = parseInt(duration);
    let width, color;
    
    if (durationNum <= 50) {
      width = 'w-8';
      color = 'bg-green-500';
    } else if (durationNum <= 60) {
      width = 'w-12';
      color = 'bg-green-500';
    } else if (durationNum <= 100) {
      width = 'w-16';
      color = 'bg-yellow-500';
    } else if (durationNum <= 150) {
      width = 'w-24';
      color = 'bg-orange-500';
    } else {
      width = 'w-32';
      color = 'bg-red-500';
    }
    
    return { width, color };
  };

  return (
    <section className="relative py-20">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-4 py-2 bg-white/10 border border-white/10 rounded-full mb-6">
            <span className="text-white/80 text-sm font-semibold">🔥 Featured Courses</span>
          </div>

          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            {t('popularCourses.title')}
          </h2>

          <p className="text-xl text-blue-100/80 max-w-3xl mx-auto leading-relaxed">
            {t('popularCourses.subtitle')}
          </p>
        </div>

        {/* Courses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {courses.map((course, index) => (
            <div
              key={course.id}
              className="group relative"
            >
              {/* Course Card */}
              <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 p-8 border border-white/50 hover:border-blue-200/50 overflow-hidden">
                {/* Background gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-purple-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                {/* Course Number Badge */}
                <div className="absolute top-6 right-6 w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg group-hover:scale-110 transition-transform duration-300">
                  {index + 1}
                </div>

                <div className="relative">
                  {/* Course Header */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="px-3 py-1.5 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 rounded-full text-sm font-semibold border border-blue-200/50">
                        {course.programmingLanguage}
                      </div>
                    </div>

                    <Link href={`/${locale}/course/${buildDynamicRoutePath(course.path).join('/')}`}>
                      <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors duration-300 leading-tight group-hover:scale-105 transform origin-left">
                        {course.title}
                      </h3>
                    </Link>
                  </div>

                  {/* Course Metadata */}
                  <div className="mb-6 space-y-3">
                    {course.difficulty && (
                      <div className="flex items-center text-sm text-gray-700">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <span className="font-medium">{t('popularCourses.difficulty')}: </span>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ml-2 ${getDifficultyColor(course.difficulty)} border border-white/50 shadow-sm`}>
                          {course.difficulty}
                        </span>
                      </div>
                    )}

                    {course.duration && (
                      <div className="flex items-center text-sm text-gray-700">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <span className="font-medium">{t('popularCourses.duration')}: </span>
                        <div className="flex items-center ml-2">
                          {(() => {
                            const durationStr = typeof course.duration === 'object'
                              ? course.duration.value?.toString() || '0'
                              : course.duration;
                            const style = getDurationStyle(durationStr);
                            return (
                              <>
                                <div className={`h-2 ${style.color} rounded-full ${style.width} shadow-sm`}></div>
                                <span className="ml-3 text-xs font-semibold text-gray-600">
                                  {
                                    typeof course.duration === 'object'
                                      ? `${course.duration.value} ${locale === 'en' ? 'hours' : '小时'}`
                                      : course.duration
                                  }
                                </span>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Course Description */}
                  <div className="mb-6">
                    <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">
                      {course.summary}
                    </p>
                  </div>

                  {/* View Course Button */}
                  <div className="flex justify-between items-center pt-6 border-t border-gray-100/50">
                    <Link
                      href={`/${locale}/course/${buildDynamicRoutePath(course.path).join('/')}`}
                      className="flex items-center text-blue-600 hover:text-blue-800 transition-colors duration-300 font-semibold group/btn"
                    >
                      <span>{t('popularCourses.viewCourse')}</span>
                      <svg className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* View All Courses Button */}
        <div className="text-center mt-16">
          <Link
            href={`/${locale}/courses`}
            className="group relative inline-flex items-center px-12 py-6 bg-gradient-to-r from-white via-white to-blue-50 text-blue-600 font-extrabold text-xl rounded-3xl transition-all duration-500 transform hover:scale-110 shadow-2xl hover:shadow-3xl hover:shadow-blue-500/20 border-2 border-white/50 hover:border-blue-200/50 backdrop-blur-sm overflow-hidden"
          >
            <span className="relative z-10 flex items-center">
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {locale === 'zh' ? '探索更多课程' : 'Explore More Courses'}
              </span>
              <svg className="w-6 h-6 ml-3 text-blue-600 group-hover:text-purple-600 group-hover:translate-x-1 transition-all duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </span>

            {/* Hover gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-50/80 via-purple-50/80 to-indigo-50/80 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

            {/* Shimmer effect on hover */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>
          </Link>
        </div>
      </div>
    </section>
  );
}
