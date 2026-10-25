import { promises as fs } from 'fs';
import path from 'path';
import { getEnglishSlug } from './categoryMapping';
import { toPosixPath } from './pathUtils';
import { truncateText } from './textUtils';
import { isStudyHoursLabel, totalStudyHours } from './courseStudyHours';
import { courseIntroduction, courseListItemText, courseMarkdownSections } from './courseMarkdown';

export interface Course {
  id: string;
  title: string;
  description: string;
  path: string;
  slug: string;
  content: string;
  contentEn?: string;
  hasEnglishVersion: boolean;
  /**
   * 中文版是否存在。单语课程（只有英文或只有中文）必须靠它区分，
   * 不能由 `hasEnglishVersion` 反推——否则英文页会宣称自己也有中文版。
   */
  hasChineseVersion?: boolean;
  summary?: string;
  summaryEn?: string;
  university?: string;
  programmingLanguage?: string;
  difficulty?: string;
  duration?: string | { value: number | null; originalText: string };
  /** 目录第一段（分类 slug）。结构化数据的 `about` 与面包屑都用它。 */
  categorySlug?: string;
  /** 目录第二段（子分类 slug），只有三级目录的课程才有。 */
  subcategorySlug?: string;
}

export interface Subcategory {
  name: string;
  slug: string;
  courses: Course[];
}

export interface Category {
  name: string;
  slug: string;
  subcategories: Subcategory[];
  courses: Course[];
}

export async function parseMarkdownFile(filePath: string, locale?: string): Promise<{ 
  title: string; 
  content: string; 
  summary?: string; 
  summaryEn?: string;
  university?: string;
  programmingLanguage?: string; 
  difficulty?: string; 
  duration?: string | { value: number | null; originalText: string }; 
}> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const lines = content.split('\n');
    
    // Extract title from first h1 or use filename
    let title = path.basename(filePath, '.md').replace('.en', '');
    const firstLine = lines.find(line => line.startsWith('# '));
    if (firstLine) {
      title = firstLine.substring(2).trim();
    }
    
    // Extract metadata from the course description section
    let summary = '';
    let summaryEn = '';
    let university = '';
    let programmingLanguage = '';
    let difficulty = '';
    let duration: string | { value: number | null; originalText: string } = '';
    
    // Determine language from file path
    const isEnglishFile = locale === 'en' || filePath.includes('/en/') || filePath.includes('.en.md');
    
    const introSection = courseMarkdownSections(content).find(section => section.kind === 'meta');
    if (introSection) {
      const { items, description } = courseIntroduction(introSection);
      for (const item of items) {
        // A list item's own text includes its continuation lines, but not its
        // child lists. Keep everything after the first colon intact.
        const text = courseListItemText(item).replace(/\*\*/g, '').replace(/\s+/g, ' ').trim();
        const separator = text.search(/[:：]/);
        if (separator === -1) continue;
        const metadataLabel = text.slice(0, separator).trim().toLowerCase();
        const value = text.slice(separator + 1).trim();
        if (!value) continue;
        if (['offered by', 'university', 'affiliated university', 'affiliated universities', '所属大学', '课程所属大学', '开课学校'].includes(metadataLabel)) {
          university = value.replace(/^·+/, '');
        }
        
        // Extract programming language - handle both Chinese and English formats
        if (['编程语言', 'programming language', 'programming languages', 'language', 'languages'].includes(metadataLabel)) {
          programmingLanguage = value;
        }
        
        // Extract difficulty - handle both Chinese and English formats
        if (['课程难度', 'difficulty', 'difficulty level', 'course difficulty', 'course difficulty level'].includes(metadataLabel)) {
          const starCount = (value.match(/🌟/g) || []).length;
          if (starCount > 0) {
            if (starCount <= 2) {
              difficulty = 'Beginner';
            } else if (starCount <= 4) {
              difficulty = 'Intermediate';
            } else {
              difficulty = 'Advanced';
            }
          } else {
            difficulty = value;
          }
        }
        
        // Extract duration - handle both Chinese and English formats
        if (isStudyHoursLabel(metadataLabel)) {
          duration = {
            value: totalStudyHours(value) ?? null,
            originalText: value
          };
        }
      }

      // The shared Markdown parser returns visible text with references
      // resolved. Preserve literal punctuation such as the # in C#.
      summary = truncateText(description, 150);
      
      // Store in appropriate summary field based on language
      if (isEnglishFile) {
        summaryEn = summary;
        summary = ''; // Clear Chinese summary for English files
      }
    }
    
    return { title, content, summary, summaryEn, university, programmingLanguage, difficulty, duration };
  } catch (error) {
    console.error(`Error parsing markdown file ${filePath}:`, error);
    return { title: path.basename(filePath, '.md'), content: '', summary: '' };
  }
}

export async function buildCourseStructure(): Promise<Category[]> {
  const docsPath = path.join(process.cwd(), 'course-content');
  const categories: Category[] = [];
  
  // Get all directories in docs folder (excluding images)
  const categoryDirs = await fs.readdir(docsPath);
  
  for (const categoryDir of categoryDirs) {
    const categoryPath = path.join(docsPath, categoryDir);
    const stats = await fs.stat(categoryPath);
    
    if (!stats.isDirectory() || categoryDir === 'images') continue;
    
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
          if (courseFile.endsWith('.md') && !courseFile.endsWith('.en.md')) {
            const coursePath = path.join(itemPath, courseFile);
            const courseEnglishPath = path.join(itemPath, courseFile.replace('.md', '.en.md'));
            
            const hasEnglishVersion = await fileExists(courseEnglishPath);
            const { title: chineseTitle, content: chineseContent, summary: chineseSummary, summaryEn: chineseSummaryEn, programmingLanguage: chinesePL, difficulty: chineseDiff, duration: chineseDur } = await parseMarkdownFile(coursePath, 'zh');
            
            let title = chineseTitle;
            let content = chineseContent;
            let contentEn = undefined;
            
            let summary = chineseSummary;
            let summaryEn = chineseSummaryEn;
            let programmingLanguage = chinesePL;
            let difficulty = chineseDiff;
            let duration = chineseDur;
            
            if (hasEnglishVersion) {
              const { title: englishTitle, content: englishContent, summary: englishSummary, summaryEn: englishSummaryEn, programmingLanguage: englishPL, difficulty: englishDiff, duration: englishDur } = await parseMarkdownFile(courseEnglishPath, 'en');
              title = englishTitle;
              content = chineseContent;
              contentEn = englishContent;
              summary = chineseSummary;
              summaryEn = englishSummaryEn || englishSummary;
              programmingLanguage = englishPL || chinesePL;
              difficulty = englishDiff || chineseDiff;
              duration = englishDur || chineseDur;
            }
            
            const course: Course = {
              id: `${category.slug}-${subcategory.slug}-${courseFile.replace('.md', '')}`,
              title,
              description: truncateText(content, 200),
              path: toPosixPath(path.relative(docsPath, coursePath)),
              slug: courseFile.replace('.md', ''),
              content,
              contentEn,
              hasEnglishVersion,
              summary: summary || truncateText(content, 150),
              summaryEn: summaryEn || truncateText(content, 150),
              programmingLanguage,
              difficulty,
              duration
            };
            
            subcategory.courses.push(course);
            category.courses.push(course);
          }
        }
        
        category.subcategories.push(subcategory);
      } else if (item.endsWith('.md') && !item.endsWith('.en.md')) {
        // This is a direct course in category
        const coursePath = path.join(categoryPath, item);
        const courseEnglishPath = path.join(categoryPath, item.replace('.md', '.en.md'));
        
        const hasEnglishVersion = await fileExists(courseEnglishPath);
        const { title: chineseTitle, content: chineseContent, summary: chineseSummary, summaryEn: chineseSummaryEn, programmingLanguage: chinesePL, difficulty: chineseDiff, duration: chineseDur } = await parseMarkdownFile(coursePath, 'zh');
        
        let title = chineseTitle;
        let content = chineseContent;
        let contentEn = undefined;
        let summary = chineseSummary;
        let summaryEn = chineseSummaryEn;
        let programmingLanguage = chinesePL;
        let difficulty = chineseDiff;
        let duration = chineseDur;
        
        if (hasEnglishVersion) {
          const { title: englishTitle, content: englishContent, summary: englishSummary, summaryEn: englishSummaryEn, programmingLanguage: englishPL, difficulty: englishDiff, duration: englishDur } = await parseMarkdownFile(courseEnglishPath, 'en');
          title = englishTitle;
          content = chineseContent;
          contentEn = englishContent;
          summary = chineseSummary;
          summaryEn = englishSummaryEn || englishSummary;
          programmingLanguage = englishPL || chinesePL;
          difficulty = englishDiff || chineseDiff;
          duration = englishDur || chineseDur;
        }
        
        const course: Course = {
          id: `${category.slug}-${item.replace('.md', '')}`,
          title,
          description: truncateText(content, 200),
          path: toPosixPath(path.relative(docsPath, coursePath)),
          slug: item.replace('.md', ''),
          content,
          contentEn,
          hasEnglishVersion,
          summary: summary || truncateText(content, 150),
          summaryEn: summaryEn || truncateText(content, 150),
          programmingLanguage,
          difficulty,
          duration
        };
        
        category.courses.push(course);
      }
    }
    
    categories.push(category);
  }
  
  return categories;
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function getAllCourses(): Promise<Course[]> {
  const categories = await buildCourseStructure();
  return categories.flatMap(category => category.courses);
}

export async function getCourseByPath(coursePath: string): Promise<Course | null> {
  const courses = await getAllCourses();
  return courses.find(course => course.path === coursePath) || null;
}

export async function getCourseById(id: string, lang: string = 'en'): Promise<Course | null> {
  // Parse the ID to extract path components
  const parts = id.split('-');
  if (parts.length < 2) return null;
  
  // For direct category courses (format: category-course), use the same logic as categories API
  if (parts.length === 2) {
    const categorySlug = parts[0];
    const courseSlug = parts[1];
    
    // Find the category directory
    const docsPath = path.join(process.cwd(), 'course-content');
    const categoryDirs = await fs.readdir(docsPath);
    
    for (const categoryDir of categoryDirs) {
      const categoryPath = path.join(docsPath, categoryDir);
      const stats = await fs.stat(categoryPath);
      
      if (!stats.isDirectory() || categoryDir === 'images') continue;
      
      // Check if this category matches the slug
      if (getEnglishSlug(categoryDir) === categorySlug) {
        // Look for the course file directly in category (using categories API logic)
        const categoryFiles = await fs.readdir(categoryPath);
        const targetFile = lang === 'zh' ? `${courseSlug}.md` : `${courseSlug}.en.md`;
        
        if (categoryFiles.includes(targetFile)) {
          const filePath = path.join(categoryPath, targetFile);
          const courseData = await parseMarkdownFile(filePath, lang);
          
          if (courseData) {
            const hasEnglishVersion = lang === 'zh' && categoryFiles.includes(`${courseSlug}.en.md`);
            
            return {
              id: `${categorySlug}-${courseSlug}`,
              title: courseData.title,
              description: truncateText(courseData.content, 200),
              path: toPosixPath(path.relative(docsPath, filePath)),
              slug: courseSlug,
              content: courseData.content,
              hasEnglishVersion,
              summary: courseData.summary,
              summaryEn: courseData.summaryEn,
              programmingLanguage: courseData.programmingLanguage,
              difficulty: courseData.difficulty,
              duration: courseData.duration,
              categorySlug
            };
          }
        }
      }
    }
  }
  
  // For subcategory courses (format: category-subcategory-course), use similar logic
  if (parts.length >= 3) {
    const categorySlug = parts[0];
    const subcategorySlug = parts[1];
    const courseSlug = parts[parts.length - 1];
    
    // Find the category directory
    const docsPath = path.join(process.cwd(), 'course-content');
    const categoryDirs = await fs.readdir(docsPath);
    
    for (const categoryDir of categoryDirs) {
      const categoryPath = path.join(docsPath, categoryDir);
      const stats = await fs.stat(categoryPath);
      
      if (!stats.isDirectory() || categoryDir === 'images') continue;
      
      // Check if this category matches the slug
      if (getEnglishSlug(categoryDir) === categorySlug) {
        // Look for the subcategory
        const subcategoryDirs = await fs.readdir(categoryPath);
        
        for (const subcategoryDir of subcategoryDirs) {
          const subcategoryPath = path.join(categoryPath, subcategoryDir);
          const subStats = await fs.stat(subcategoryPath);
          
          if (!subStats.isDirectory()) continue;
          
          // Check if this subcategory matches the slug
          if (getEnglishSlug(subcategoryDir) === subcategorySlug) {
            // Look for the course file (using categories API logic)
            const files = await fs.readdir(subcategoryPath);
            const targetFile = lang === 'zh' ? `${courseSlug}.md` : `${courseSlug}.en.md`;
            
            if (files.includes(targetFile)) {
              const filePath = path.join(subcategoryPath, targetFile);
              const courseData = await parseMarkdownFile(filePath, lang);
              
              if (courseData) {
                const hasEnglishVersion = lang === 'zh' && files.includes(`${courseSlug}.en.md`);
                
                return {
                  id: `${categorySlug}-${subcategorySlug}-${courseSlug}`,
                  title: courseData.title,
                  description: truncateText(courseData.content, 200),
                  path: toPosixPath(path.relative(docsPath, filePath)),
                  slug: courseSlug,
                  content: courseData.content,
                  hasEnglishVersion,
                  summary: courseData.summary,
                  summaryEn: courseData.summaryEn,
                  programmingLanguage: courseData.programmingLanguage,
                  difficulty: courseData.difficulty,
                  duration: courseData.duration,
                  categorySlug
                };
              }
            }
          }
        }
      }
    }
  }
  
  return null;
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const categories = await buildCourseStructure();
  return categories.find(category => category.slug === slug) || null;
}
