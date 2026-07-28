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
                university: courseData.university,
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
            university: courseData.university,
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
    
    // For Chinese locale, check if courses have English versions
    if (locale === 'zh') {
      const enPath = path.join(docsPath, 'en');
      for (const category of categories) {
        for (const course of category.courses) {
          const relativeCoursePath = course.path.split(path.sep).slice(1).join(path.sep);
          course.hasEnglishVersion = await fileExists(path.join(enPath, relativeCoursePath));
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
  return categories.flatMap(category => category.courses);
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}
