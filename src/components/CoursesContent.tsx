'use client';

import { useState } from 'react';
import { Category, Course } from '@/lib/courseParser';
import CourseCard from '@/components/CourseCard';
import { getChineseName } from '@/lib/categoryMapping';
import { useTranslations } from 'next-intl';

interface CoursesContentProps {
  categories: Category[];
  locale: string;
  variant?: 'default' | 'immersive';
}

export default function CoursesContent({ categories, locale, variant = 'default' }: CoursesContentProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const isChinese = locale === 'zh';
  const t = useTranslations('courses');
  const isImmersive = variant === 'immersive';
  const activeCategory = selectedCategory ? categories.find(cat => cat.slug === selectedCategory) : null;
  const activeSubcategory = activeCategory && selectedSubcategory
    ? activeCategory.subcategories.find(sub => sub.slug === selectedSubcategory)
    : null;

  const sidebarCardClass = isImmersive
    ? 'bg-white/5 rounded-[28px] border border-white/10 p-6 shadow-[0_25px_80px_rgba(2,6,23,0.55)] backdrop-blur-xl'
    : 'bg-gradient-to-br from-white via-slate-50 to-white rounded-3xl border border-slate-100/80 p-6 shadow-[0_10px_35px_rgba(15,23,42,0.09)]';
  const mainShellClass = isImmersive
    ? 'rounded-[32px] border border-white/10 bg-white/5 p-6 sm:p-8 shadow-[0_30px_90px_rgba(2,6,23,0.45)] backdrop-blur-xl text-white'
    : 'rounded-[32px] border border-slate-100 bg-white p-6 sm:p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)] text-slate-900';
  const headingClass = isImmersive ? 'text-white' : 'text-slate-900';
  const subtleTextClass = isImmersive ? 'text-slate-300' : 'text-slate-500';
  const secondaryTextClass = isImmersive ? 'text-slate-400' : 'text-slate-500';
  const chipClass = isImmersive
    ? 'px-3 py-1.5 rounded-full text-xs bg-white/10 text-slate-100 border border-white/20 shadow-[0_10px_30px_rgba(15,23,42,0.25)]'
    : 'px-3 py-1.5 bg-slate-100 text-slate-700 rounded-full text-xs border border-slate-200';
  const categoryButtonBase = `w-full text-left px-4 py-4 rounded-2xl transition-all border ${
    isImmersive
      ? 'border-white/0 text-slate-200 hover:border-white/10 hover:bg-white/5'
      : 'border-transparent hover:bg-slate-50 text-slate-600'
  }`;
  const categoryButtonSelected = isImmersive
    ? 'bg-gradient-to-r from-blue-500/20 via-cyan-500/20 to-purple-500/30 text-white border-white/30 shadow-[0_25px_55px_rgba(59,130,246,0.35)]'
    : 'bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 text-blue-900 border-blue-100 shadow-[0_12px_30px_rgba(59,130,246,0.2)]';
  const subcategoryButtonBase = `w-full text-left px-3 py-2 rounded-xl text-sm transition-all border ${
    isImmersive
      ? 'border-white/5 text-slate-300 hover:border-white/15 hover:bg-white/5'
      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
  }`;
  const subcategoryButtonSelected = isImmersive
    ? 'bg-white/15 text-white border-white/30 shadow-[0_12px_30px_rgba(59,130,246,0.25)]'
    : 'bg-blue-50 text-blue-700 border-blue-200';
  const gradientPalette = isImmersive
    ? [
        'from-blue-500/15 via-blue-400/10 to-cyan-400/20',
        'from-purple-500/15 via-fuchsia-500/10 to-pink-500/20',
        'from-emerald-500/15 via-teal-500/10 to-cyan-500/20',
        'from-amber-400/15 via-orange-500/10 to-pink-500/20'
      ]
    : [
        'from-slate-50 via-white to-indigo-50',
        'from-rose-50 via-white to-orange-50',
        'from-emerald-50 via-white to-teal-50',
        'from-amber-50 via-white to-rose-50'
      ];
  const subcategoryPanelClass = isImmersive
    ? 'space-y-1.5 rounded-2xl border border-dashed border-white/15 bg-white/5 px-3 py-3'
    : 'space-y-1.5 rounded-2xl border border-dashed border-slate-200 bg-white/60 px-3 py-3';
  const dividerClass = isImmersive ? 'border-white/10' : 'border-slate-100';
  
  const getCategoryDisplayName = (category: Category) => {
    if (!isChinese) {
      return category.slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    } else {
      return getChineseName(category.slug);
    }
  };
  
  const getSubcategoryDisplayName = (subcategoryName: string, subcategorySlug: string) => {
    if (!isChinese) {
      return subcategorySlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    } else {
      return subcategoryName;
    }
  };

  const handleCategorySelect = (categorySlug: string) => {
    if (selectedCategory === categorySlug) {
      setSelectedCategory(null);
      setSelectedSubcategory(null);
    } else {
      setSelectedCategory(categorySlug);
      setSelectedSubcategory(null);
    }
  };

  const handleSubcategorySelect = (subcategorySlug: string) => {
    if (selectedSubcategory === subcategorySlug) {
      setSelectedSubcategory(null);
    } else {
      setSelectedSubcategory(subcategorySlug);
    }
  };

  const getFilteredCourses = (): Course[] => {
    if (!activeCategory) return [];
    if (!selectedSubcategory) return activeCategory.courses;
    return activeSubcategory ? activeSubcategory.courses : [];
  };

  return (
    <div className="grid gap-10 lg:grid-cols-[320px_minmax(0,1fr)] items-start">
      <div>
        <div className={`${sidebarCardClass} sticky top-8 space-y-5`}>
          <div>
            <p className={`text-xs uppercase tracking-[0.4em] ${secondaryTextClass}`}>
              {t('categories')}
            </p>
            <h2 className={`text-2xl font-semibold mt-2 ${headingClass}`}>
              {t('allCategories')}
            </h2>
          </div>

          <div className="space-y-3 max-h-[calc(100vh-260px)] overflow-y-auto pr-1 custom-scrollbar">
            {categories.map((category, index) => (
              <div key={category.slug} className="space-y-2">
                <button
                  onClick={() => handleCategorySelect(category.slug)}
                  className={`${categoryButtonBase} ${selectedCategory === category.slug ? categoryButtonSelected : ''}`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-sm uppercase tracking-[0.3em] opacity-70">
                        {t('category')}
                      </p>
                      <p className="text-lg font-semibold mt-1">
                        {getCategoryDisplayName(category)}
                      </p>
                    </div>
                    <span className="text-sm font-semibold opacity-80">
                      {category.courses.length}
                    </span>
                  </div>
                </button>

                {selectedCategory === category.slug && category.subcategories.length > 0 && (
                  <div className={subcategoryPanelClass}>
                    {category.subcategories.map(subcategory => (
                      <button
                        key={subcategory.slug}
                        onClick={() => handleSubcategorySelect(subcategory.slug)}
                        className={`${subcategoryButtonBase} ${selectedSubcategory === subcategory.slug ? subcategoryButtonSelected : ''}`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span>{getSubcategoryDisplayName(subcategory.name, subcategory.slug)}</span>
                          <span className={`text-xs ${secondaryTextClass}`}>
                            {subcategory.courses.length}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-8">
        {activeCategory ? (
          <div className={mainShellClass}>
            <div className={`flex flex-col gap-6 border-b ${dividerClass} pb-6 md:flex-row md:items-center md:justify-between`}>
              <div>
                <p className={`text-xs uppercase tracking-[0.35em] ${isImmersive ? 'text-white/60' : 'text-slate-500'}`}>
                  {t('selectedCategory')}
                </p>
                <h2 className="text-3xl font-semibold mt-2">
                  {getCategoryDisplayName(activeCategory)}
                  {activeSubcategory && (
                    <span className="text-base font-normal ml-2 opacity-70">
                      / {getSubcategoryDisplayName(activeSubcategory.name, activeSubcategory.slug)}
                    </span>
                  )}
                </h2>
                <p className={`mt-2 text-sm ${subtleTextClass}`}>
                  {activeCategory.courses.length} {t('coursesCount')}
                  {activeSubcategory && ` · ${activeSubcategory.courses.length} ${t('coursesCount')}`}
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedCategory(null);
                  setSelectedSubcategory(null);
                }}
                className={`inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition ${
                  isImmersive
                    ? 'bg-white/10 text-white hover:bg-white/20'
                    : 'bg-slate-900/5 text-slate-900 hover:bg-slate-900/10'
                }`}
              >
                {t('backToCourses')}
              </button>
            </div>

            {getFilteredCourses().length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                {getFilteredCourses().map(course => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    locale={locale}
                    variant={variant === 'immersive' ? 'immersive' : 'default'}
                  />
                ))}
              </div>
            ) : (
              <div className="py-12 text-center">
                <p className={secondaryTextClass}>{t('noCourses')}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {categories.map((category, index) => (
              <button
                key={category.slug}
                onClick={() => handleCategorySelect(category.slug)}
                className={`group relative overflow-hidden rounded-[28px] p-6 text-left transition-all ${
                  isImmersive
                    ? `bg-gradient-to-br ${gradientPalette[index % gradientPalette.length]} border border-white/10 text-white hover:border-white/30`
                    : `bg-gradient-to-br ${gradientPalette[index % gradientPalette.length]} text-slate-900 border border-transparent hover:border-slate-200`
                }`}
              >
                <div className="relative z-10 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm uppercase tracking-[0.4em] opacity-80">
                      {t('category')}
                    </span>
                    <span className="text-sm font-semibold">
                      {category.courses.length} {t('coursesCount')}
                    </span>
                  </div>
                  <h3 className="text-2xl font-semibold">
                    {getCategoryDisplayName(category)}
                  </h3>
                  {category.subcategories.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {category.subcategories.slice(0, 3).map(subcategory => (
                        <span key={subcategory.slug} className={chipClass}>
                          {getSubcategoryDisplayName(subcategory.name, subcategory.slug)}
                        </span>
                      ))}
                      {category.subcategories.length > 3 && (
                        <span className={chipClass}>
                          +{category.subcategories.length - 3} {t('more')}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <div
                  className={`absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 ${
                    isImmersive ? 'bg-white/15' : 'bg-white/20'
                  }`}
                ></div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
