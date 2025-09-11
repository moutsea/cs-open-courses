import { promises as fs } from 'fs';
import path from 'path';
import { parseMarkdownFile } from './courseParser';
import { Category, Subcategory, Course } from './courseParser';
import { getEnglishSlug } from './categoryMapping';

export async function getCategoriesForLocale(locale: string): Promise<Category[]> {
  const docsPath = path.join(process.cwd(), 'course-content');
  const categories: Category[] = [];
  
  try {
    // Scan the locale-specific directory
    const localePath = path.join(docsPath, locale);
    const categoryDirs = await fs.readdir(localePath);
    
    for (const categoryDir of categoryDirs) {
      const categoryPath = path.join(localePath, categoryDir);
      const stats = await fs.stat(categoryPath);
      
      if (!stats.isDirectory()) continue;
      
      const category: Category = {
        name: categoryDir,
        slug: getEnglishSlug(categoryDir),
        subcategories: [],
        courses: []
      };
      
      // Get all items in category directory
      const items = await fs.readdir(categoryPath);
      
      for (const item of items) {
        const itemPath = path.join(categoryPath, item);
        const itemStats = await fs.stat(itemPath);
        
        if (itemStats.isDirectory()) {
          // This is a subcategory
          const subcategory: Subcategory = {
            name: item,
            slug: getEnglishSlug(item),
            courses: []
          };
          
          // Get courses in subcategory
          const courseFiles = await fs.readdir(itemPath);
          
          for (const courseFile of courseFiles) {
            if (courseFile.endsWith('.md')) {
              const coursePath = path.join(itemPath, courseFile);
              const courseData = await parseMarkdownFile(coursePath, locale);
              
              const course: Course = {
                id: `${category.slug}-${subcategory.slug}-${courseFile.replace('.md', '')}`,
                title: courseData.title,
                description: courseData.content.substring(0, 200) + '...',
                path: path.relative(docsPath, coursePath),
                slug: courseFile.replace('.md', ''),
                content: courseData.content,
                hasEnglishVersion: locale === 'en', // Will be updated later if needed
                summary: courseData.summary,
                summaryEn: courseData.summaryEn,
                programmingLanguage: courseData.programmingLanguage,
                difficulty: courseData.difficulty,
                duration: courseData.duration
              };
              
              subcategory.courses.push(course);
              category.courses.push(course);
            }
          }
          
          if (subcategory.courses.length > 0) {
            category.subcategories.push(subcategory);
          }
        } else if (item.endsWith('.md')) {
          // This is a direct course in category
          const coursePath = path.join(categoryPath, item);
          const courseData = await parseMarkdownFile(coursePath, locale);
          
          const course: Course = {
            id: `${category.slug}-${item.replace('.md', '')}`,
            title: courseData.title,
            description: courseData.content.substring(0, 200) + '...',
            path: path.relative(docsPath, coursePath),
            slug: item.replace('.md', ''),
            content: courseData.content,
            hasEnglishVersion: locale === 'en', // Will be updated later if needed
            summary: courseData.summary,
            summaryEn: courseData.summaryEn,
            programmingLanguage: courseData.programmingLanguage,
            difficulty: courseData.difficulty,
            duration: courseData.duration
          };
          
          category.courses.push(course);
        }
      }
      
      if (category.courses.length > 0) {
        categories.push(category);
      }
    }
    
    // For English locale, check if courses have Chinese versions
    if (locale === 'en') {
      const zhPath = path.join(docsPath, 'zh');
      for (const category of categories) {
        for (const course of category.courses) {
          const zhCoursePath = path.join(zhPath, course.path);
          if (await fileExists(zhCoursePath)) {
            course.hasEnglishVersion = true;
          }
        }
        
        for (const subcategory of category.subcategories) {
          for (const course of subcategory.courses) {
            const zhCoursePath = path.join(zhPath, course.path);
            if (await fileExists(zhCoursePath)) {
              course.hasEnglishVersion = true;
            }
          }
        }
      }
    }
    
    // For Chinese locale, check if courses have English versions
    if (locale === 'zh') {
      const enPath = path.join(docsPath, 'en');
      for (const category of categories) {
        for (const course of category.courses) {
          const enCoursePath = path.join(enPath, course.path);
          if (await fileExists(enCoursePath)) {
            course.hasEnglishVersion = true;
          }
        }
        
        for (const subcategory of category.subcategories) {
          for (const course of subcategory.courses) {
            const enCoursePath = path.join(enPath, course.path);
            if (await fileExists(enCoursePath)) {
              course.hasEnglishVersion = true;
            }
          }
        }
      }
    }
    
    return categories;
    
  } catch (error) {
    console.error('Error getting categories for locale:', locale, error);
    return [];
  }
}

export async function getAllCourses(locale: string): Promise<Course[]> {
  const categories = await getCategoriesForLocale(locale);
  const allCourses: Course[] = [];
  
  for (const category of categories) {
    allCourses.push(...category.courses);
    for (const subcategory of category.subcategories) {
      allCourses.push(...subcategory.courses);
    }
  }
  
  return allCourses;
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}