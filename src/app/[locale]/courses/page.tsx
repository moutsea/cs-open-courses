'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { Category } from '@/lib/courseParser';
import CourseCard from '@/components/CourseCard';
import { getChineseName } from '@/lib/categoryMapping';
import { useTranslations, useLocale } from 'next-intl';

export default function CoursesPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const locale = useLocale();
  const isChinese = locale === 'zh';
  const t = useTranslations('courses');
  
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
  
    
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(`/${locale}/api/categories`);
        const data = await response.json();
        setCategories(data);
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCategories();
  }, [locale]);

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

  const getFilteredCourses = () => {
    if (!selectedCategory) return [];
    
    const category = categories.find(cat => cat.slug === selectedCategory);
    if (!category) return [];
    
    if (!selectedSubcategory) return category.courses;
    
    const subcategory = category.subcategories.find(sub => sub.slug === selectedSubcategory);
    return subcategory ? subcategory.courses : [];
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header locale={locale} />
        <main className="flex-grow container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">{t('loading')}</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header locale={locale} />
      <main className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">{t('title')}</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">
                {t('categories')}
              </h2>
              
              {/* Categories */}
              <div className="space-y-2">
                {categories.map((category) => (
                  <div key={category.slug}>
                    <button
                      onClick={() => handleCategorySelect(category.slug)}
                      className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                        selectedCategory === category.slug
                          ? 'bg-blue-100 text-blue-700'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      {getCategoryDisplayName(category)}
                      <span className="float-right text-sm text-gray-500">
                        {category.courses.length}
                      </span>
                    </button>
                    
                    {/* Subcategories */}
                    {selectedCategory === category.slug && category.subcategories.length > 0 && (
                      <div className="ml-4 mt-2 space-y-1">
                        {category.subcategories.map((subcategory) => (
                          <button
                            key={subcategory.slug}
                            onClick={() => handleSubcategorySelect(subcategory.slug)}
                            className={`w-full text-left px-3 py-1 rounded-md text-sm transition-colors ${
                              selectedSubcategory === subcategory.slug
                                ? 'bg-blue-100 text-blue-700'
                                : 'hover:bg-gray-100'
                            }`}
                          >
                            {getSubcategoryDisplayName(subcategory.name, subcategory.slug)}
                            <span className="float-right text-xs text-gray-500">
                              {subcategory.courses.length}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Main Content */}
          <div className="lg:col-span-3">
            {selectedCategory ? (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-semibold">
                    {getCategoryDisplayName(categories.find(cat => cat.slug === selectedCategory)!)}
                    {selectedSubcategory && ` - ${getSubcategoryDisplayName(
                      categories.find(cat => cat.slug === selectedCategory)!
                        .subcategories.find(sub => sub.slug === selectedSubcategory)!.name,
                      selectedSubcategory
                    )}`}
                  </h2>
                  <button
                    onClick={() => {
                      setSelectedCategory(null);
                      setSelectedSubcategory(null);
                    }}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    {t('backToCourses')}
                  </button>
                </div>
                
                {getFilteredCourses().length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {getFilteredCourses().map((course) => (
                      <CourseCard key={course.id} course={course} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-500">
                      {t('noCourses')}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <h2 className="text-2xl font-semibold mb-6">
                  {t('allCategories')}
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {categories.map((category) => (
                    <div
                      key={category.slug}
                      className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => handleCategorySelect(category.slug)}
                    >
                      <h3 className="text-xl font-semibold mb-2">
                        {getCategoryDisplayName(category)}
                      </h3>
                      <p className="text-gray-600 mb-4">
                        {category.courses.length} {t('coursesCount')}
                      </p>
                      
                      {category.subcategories.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="font-medium text-gray-700">
                            {t('subcategories')}
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {category.subcategories.slice(0, 3).map((subcategory) => (
                              <span
                                key={subcategory.slug}
                                className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-sm"
                              >
                                {getSubcategoryDisplayName(subcategory.name, subcategory.slug)}
                              </span>
                            ))}
                            {category.subcategories.length > 3 && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-sm">
                                +{category.subcategories.length - 3} {t('more')}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}