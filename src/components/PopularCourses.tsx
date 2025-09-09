'use client';

import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { Course } from '@/lib/courseParser';

interface PopularCoursesProps {
  courses: Course[];
}

export default function PopularCourses({ courses }: PopularCoursesProps) {
  const t = useTranslations('home');
  const locale = useLocale();
  
  // Fallback translations in case the translations aren't loaded yet
  const fallbackTranslations = {
    title: locale === 'zh' ? '热门课程' : 'Popular Courses',
    subtitle: locale === 'zh' ? '精选顶尖大学经典课程' : 'Handpicked classic courses from top universities',
    viewCourse: locale === 'zh' ? '查看课程' : 'View Course',
    difficulty: locale === 'zh' ? '难度' : 'Difficulty',
    duration: locale === 'zh' ? '学习时间' : 'Duration',
    language: locale === 'zh' ? '编程语言' : 'Language'
  };
  
  // Safely get translations with fallback
  const getTranslation = (key: string) => {
    try {
      const value = t(key);
      return value || fallbackTranslations[key as keyof typeof fallbackTranslations];
    } catch (error) {
      return fallbackTranslations[key as keyof typeof fallbackTranslations];
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'beginner':
        return 'bg-green-100 text-green-800';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'advanced':
        return 'bg-red-100 text-red-800';
      case 'expert':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

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
  
  const translations = {
    title: getTranslation('popularCourses.title'),
    subtitle: getTranslation('popularCourses.subtitle'),
    viewCourse: getTranslation('popularCourses.viewCourse'),
    difficulty: getTranslation('popularCourses.difficulty'),
    duration: getTranslation('popularCourses.duration'),
    language: getTranslation('popularCourses.language')
  };

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {translations.title}
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {translations.subtitle}
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {courses.map((course, index) => (
            <div 
              key={course.id}
              className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-gray-100 hover:border-blue-200 group"
            >
              {/* Course Header */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">{index + 1}</span>
                  </div>
                  <div className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                    {course.programmingLanguage}
                  </div>
                </div>
                
                <Link href={locale === 'en' ? `/course/${course.id}` : `/${locale}/course/${course.id}`}>
                  <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors duration-300 leading-tight">
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
                    <span>{translations.difficulty}: </span>
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
                    <span>{translations.duration}: </span>
                    <div className="flex items-center ml-2">
                      {(() => {
                        const durationStr = typeof course.duration === 'object' 
                          ? course.duration.value?.toString() || '0'
                          : course.duration;
                        const style = getDurationStyle(durationStr);
                        return (
                          <>
                            <div className={`h-3 ${style.color} rounded-full ${style.width}`}></div>
                            <span className="ml-2 text-xs text-gray-600">
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
                
                {course.programmingLanguage && (
                  <div className="flex items-center text-sm">
                    <svg className="w-4 h-4 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                    <span>{translations.language}: </span>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium ml-1">
                      {course.programmingLanguage}
                    </span>
                  </div>
                )}
              </div>

              {/* Course Description */}
              <div className="mb-4">
                <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">
                  {course.summary}
                </p>
              </div>

              {/* View Course Button */}
              <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                <Link 
                  href={locale === 'en' ? `/course/${course.id}` : `/${locale}/course/${course.id}`}
                  className="flex items-center text-blue-600 hover:text-blue-800 transition-colors duration-300 text-sm font-medium"
                >
                  <span>{translations.viewCourse}</span>
                  <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          ))}
        </div>
        
        <div className="text-center mt-12">
          <Link 
            href={`/${locale}/courses`}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 inline-block"
          >
            {locale === 'zh' ? '更多课程' : 'More Courses'}
          </Link>
        </div>
      </div>
    </section>
  );
}