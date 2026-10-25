import { promises as fs } from 'fs';
import path from 'path';
import { parseMarkdownFile } from './courseParser';
import { Category, Subcategory, Course } from './courseParser';
import { getEnglishSlug } from './categoryMapping';
import { toPosixPath } from './pathUtils';
import { truncateText } from './textUtils';

/**
 * 这门课在「另一种语言」下有没有对应文件。
 *
 * 不能用 `locale === 'en'` 猜：那样英文页会一律宣称自己也有中文版，
 * 而 JSON-LD 的 `availableLanguage` 和「语言版本」事实行都据此输出。
 */
async function courseLanguageFlags(docsPath: string, locale: string, coursePath: string) {
  const relative = toPosixPath(path.relative(docsPath, coursePath)).split('/')
  const mirrorLocale = locale === 'zh' ? 'en' : 'zh'
  const hasMirror = await fileExists(path.join(docsPath, mirrorLocale, ...relative.slice(1)))
  return {
    hasEnglishVersion: locale === 'en' || hasMirror,
    hasChineseVersion: locale === 'zh' || hasMirror
  }
}

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
              const languageFlags = await courseLanguageFlags(docsPath, locale, coursePath);
              
              const course: Course = {
                id: `${category.slug}-${subcategory.slug}-${courseFile.replace('.md', '')}`,
                title: courseData.title,
                description: truncateText(courseData.content, 200),
                path: toPosixPath(path.relative(docsPath, coursePath)),
                slug: courseFile.replace('.md', ''),
                content: courseData.content,
                ...languageFlags,
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
          const languageFlags = await courseLanguageFlags(docsPath, locale, coursePath);
          
          const course: Course = {
            id: `${category.slug}-${item.replace('.md', '')}`,
            title: courseData.title,
            description: truncateText(courseData.content, 200),
            path: toPosixPath(path.relative(docsPath, coursePath)),
            slug: item.replace('.md', ''),
            content: courseData.content,
            ...languageFlags,
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
