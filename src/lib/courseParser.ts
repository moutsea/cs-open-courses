import { promises as fs } from 'fs';
import path from 'path';
import { getEnglishSlug } from './categoryMapping';

export interface Course {
  id: string;
  title: string;
  description: string;
  path: string;
  slug: string;
  content: string;
  contentEn?: string;
  hasEnglishVersion: boolean;
  summary?: string;
  summaryEn?: string;
  programmingLanguage?: string;
  difficulty?: string;
  duration?: string | { value: number | null; originalText: string };
  categorySlug?: string;
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

export async function parseMarkdownFile(filePath: string): Promise<{ 
  title: string; 
  content: string; 
  summary?: string; 
  summaryEn?: string;
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
    let programmingLanguage = '';
    let difficulty = '';
    let duration: string | { value: number | null; originalText: string } = '';
    
    // Detect if this is an English file
    const isEnglishFile = filePath.includes('.en.md') || 
                         content.toLowerCase().includes('descriptions') ||
                         content.toLowerCase().includes('course introduction') ||
                         content.toLowerCase().includes('course overview') ||
                         content.toLowerCase().includes('offered by:') ||
                         content.toLowerCase().includes('programming language:') ||
                         content.toLowerCase().includes('programming languages:');
    
    const introSectionIndex = lines.findIndex(line => 
      line.includes('课程简介') || line.includes('Course Introduction') || line.includes('课程介绍') || 
      line.includes('Course Overview') || line.includes('Descriptions') || line.includes('Description') || line.includes('简介')
    );
    
    if (introSectionIndex !== -1) {
      // Look for the actual description text after the metadata
      let descriptionStartIndex = introSectionIndex + 1;
      
      // Extract metadata from lines starting with -
      for (let i = introSectionIndex + 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line.startsWith('-') && line !== '') break;
        if (line === '') continue; // Skip empty lines
        
        // Extract programming language - handle both Chinese and English formats
        if (line.includes('编程语言') || line.includes('Programming Language') || line.includes('Programming Languages')) {
          const parts = line.split(/[:：]/);
          if (parts.length > 1) {
            programmingLanguage = parts[1].trim().replace(/\*\*/g, ''); // 移除**加粗符号
          }
        }
        
        // Extract difficulty - handle both Chinese and English formats
        if (line.includes('课程难度') || line.includes('Difficulty')) {
          const parts = line.split(/[:：]/);
          if (parts.length > 1) {
            const difficultyText = parts[1].trim().replace(/\*\*/g, ''); // 移除**加粗符号
            
            // Convert stars to difficulty level
            const starCount = (difficultyText.match(/🌟/g) || []).length;
            if (starCount > 0) {
              if (starCount <= 2) {
                difficulty = 'Beginner';
              } else if (starCount <= 4) {
                difficulty = 'Intermediate';
              } else {
                difficulty = 'Advanced';
              }
            } else {
              difficulty = difficultyText;
            }
          }
        }
        
        // Extract duration - handle both Chinese and English formats
        if (line.includes('预计学时') || line.includes('Class Hour') || line.includes('Class Hours') || line.includes('Estimated Hours')) {
          const parts = line.split(/[:：]/);
          if (parts.length > 1) {
            const durationText = parts[1].trim().replace(/\*\*/g, ''); // 移除**加粗符号
            
            // Extract numeric value and unit separately
            const match = durationText.match(/(\d+)\s*(小时|hour|hours)/i);
            if (match) {
              const value = match[1];
              // Store both numeric value and unit info for later localization
              duration = {
                value: parseInt(value),
                originalText: durationText
              };
            } else {
              duration = {
                value: null,
                originalText: durationText
              };
            }
          }
        }
      }
      
      // Skip metadata lines (lines starting with - or containing : )
      while (descriptionStartIndex < lines.length) {
        const line = lines[descriptionStartIndex].trim();
        if (line.startsWith('-') || line.includes(':') || line.startsWith('##') || line === '') {
          descriptionStartIndex++;
        } else {
          break;
        }
      }
      
      // Extract the description paragraph (until next section or end)
      const descriptionLines = [];
      for (let i = descriptionStartIndex; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith('##') || line.startsWith('#') || line === '---') {
          break;
        }
        if (line) {
          descriptionLines.push(line);
        }
      }
      
      // Clean the description by removing markdown syntax
      summary = descriptionLines.join(' ')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove markdown links
        .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold formatting
        .replace(/\*([^*]+)\*/g, '$1') // Remove italic formatting
        .replace(/`([^`]+)`/g, '$1') // Remove inline code
        .replace(/#+\s*/g, '') // Remove headers
        .trim();
      
      // Limit to 150 characters for card display
      if (summary.length > 150) {
        summary = summary.substring(0, 150) + '...';
      }
      
      // Store in appropriate summary field based on language
      if (isEnglishFile) {
        summaryEn = summary;
        summary = ''; // Clear Chinese summary for English files
      }
    }
    
    return { title, content, summary, summaryEn, programmingLanguage, difficulty, duration };
  } catch (error) {
    console.error(`Error parsing markdown file ${filePath}:`, error);
    return { title: path.basename(filePath, '.md'), content: '', summary: '' };
  }
}

export async function buildCourseStructure(): Promise<Category[]> {
  const docsPath = path.join(process.cwd(), 'cs-self-learning', 'docs-new');
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
            const { title: chineseTitle, content: chineseContent, summary: chineseSummary, summaryEn: chineseSummaryEn, programmingLanguage: chinesePL, difficulty: chineseDiff, duration: chineseDur } = await parseMarkdownFile(coursePath);
            
            let title = chineseTitle;
            let content = chineseContent;
            let contentEn = undefined;
            
            let summary = chineseSummary;
            let summaryEn = chineseSummaryEn;
            let programmingLanguage = chinesePL;
            let difficulty = chineseDiff;
            let duration = chineseDur;
            
            if (hasEnglishVersion) {
              const { title: englishTitle, content: englishContent, summary: englishSummary, summaryEn: englishSummaryEn, programmingLanguage: englishPL, difficulty: englishDiff, duration: englishDur } = await parseMarkdownFile(courseEnglishPath);
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
              description: content.substring(0, 200) + '...',
              path: path.relative(docsPath, coursePath),
              slug: courseFile.replace('.md', ''),
              content,
              contentEn,
              hasEnglishVersion,
              summary: summary || content.substring(0, 150) + '...',
              summaryEn: summaryEn || content.substring(0, 150) + '...',
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
        const { title: chineseTitle, content: chineseContent, summary: chineseSummary, summaryEn: chineseSummaryEn, programmingLanguage: chinesePL, difficulty: chineseDiff, duration: chineseDur } = await parseMarkdownFile(coursePath);
        
        let title = chineseTitle;
        let content = chineseContent;
        let contentEn = undefined;
        let summary = chineseSummary;
        let summaryEn = chineseSummaryEn;
        let programmingLanguage = chinesePL;
        let difficulty = chineseDiff;
        let duration = chineseDur;
        
        if (hasEnglishVersion) {
          const { title: englishTitle, content: englishContent, summary: englishSummary, summaryEn: englishSummaryEn, programmingLanguage: englishPL, difficulty: englishDiff, duration: englishDur } = await parseMarkdownFile(courseEnglishPath);
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
          description: content.substring(0, 200) + '...',
          path: path.relative(docsPath, coursePath),
          slug: item.replace('.md', ''),
          content,
          contentEn,
          hasEnglishVersion,
          summary: summary || content.substring(0, 150) + '...',
          summaryEn: summaryEn || content.substring(0, 150) + '...',
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
    const docsPath = path.join(process.cwd(), 'cs-self-learning', 'docs-new');
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
          const courseData = await parseMarkdownFile(filePath);
          
          if (courseData) {
            const hasEnglishVersion = lang === 'zh' && categoryFiles.includes(`${courseSlug}.en.md`);
            
            return {
              id: `${categorySlug}-${courseSlug}`,
              title: courseData.title,
              description: courseData.content.substring(0, 200) + '...',
              path: path.relative(docsPath, filePath),
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
    const docsPath = path.join(process.cwd(), 'cs-self-learning', 'docs-new');
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
              const courseData = await parseMarkdownFile(filePath);
              
              if (courseData) {
                const hasEnglishVersion = lang === 'zh' && files.includes(`${courseSlug}.en.md`);
                
                return {
                  id: `${categorySlug}-${subcategorySlug}-${courseSlug}`,
                  title: courseData.title,
                  description: courseData.content.substring(0, 200) + '...',
                  path: path.relative(docsPath, filePath),
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