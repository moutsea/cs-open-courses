import { promises as fs } from 'fs';
import path from 'path';

export interface CoursePath {
  locale: string;
  path: string[];
  title: string;
  hasChineseVersion: boolean;
  hasEnglishVersion: boolean;
}

export async function getAllCoursePaths(): Promise<CoursePath[]> {
  const docsPath = path.join('/Users/liang/Documents/code/react/no_hard_thing/cs-courses', 'cs-self-learning', 'docs-new');
  const paths: CoursePath[] = [];
  
  async function scanLanguageDirectory(langDir: string, locale: string) {
    const langPath = path.join(docsPath, langDir);
    
    async function scanDirectory(dirPath: string, currentPath: string[] = []) {
      const items = await fs.readdir(dirPath);
      
      for (const item of items) {
        const itemPath = path.join(dirPath, item);
        const stats = await fs.stat(itemPath);
        
        if (stats.isDirectory()) {
          await scanDirectory(itemPath, [...currentPath, item]);
        } else if (item.endsWith('.md') && !item.endsWith('.en.md')) {
          // This is a course file
          const coursePath = [...currentPath, item.replace('.md', '')];
          
          // Check if the other language version exists
          const otherLang = locale === 'zh' ? 'en' : 'zh';
          const otherLangPath = path.join(docsPath, otherLang, ...currentPath, item);
          const hasOtherVersion = await fileExists(otherLangPath);
          
          // Read the file to get title
          const content = await fs.readFile(itemPath, 'utf-8');
          const title = extractTitle(content, item.replace('.md', ''));
          
          paths.push({
            locale: locale,
            path: coursePath,
            title,
            hasChineseVersion: locale === 'zh' || hasOtherVersion,
            hasEnglishVersion: locale === 'en' || hasOtherVersion,
          });
        }
      }
    }
    
    try {
      await scanDirectory(langPath, []);
    } catch (error) {
      console.error(`Error scanning ${langDir} directory:`, error);
    }
  }
  
  // Scan both Chinese and English directories
  await scanLanguageDirectory('zh', 'zh');
  await scanLanguageDirectory('en', 'en');
  
  return paths;
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function extractTitle(content: string, fallback: string): string {
  const lines = content.split('\n');
  const firstLine = lines.find(line => line.startsWith('# '));
  if (firstLine) {
    return firstLine.substring(2).trim();
  }
  return fallback;
}

export async function getCourseContent(coursePath: string[], locale: string) {
  const docsPath = path.join('/Users/liang/Documents/code/react/no_hard_thing/cs-courses', 'cs-self-learning', 'docs-new');
  const relativePath = path.join(...coursePath);
  
  // Use language-specific directory
  const langDir = locale === 'zh' ? 'zh' : 'en';
  
  // Try different file naming conventions
  const possiblePaths = [
    path.join(docsPath, langDir, relativePath + '.md'),  // Standard .md file
    path.join(docsPath, langDir, relativePath + '.en.md'), // English version
  ];
  
  // Add debug logging
  console.log('getCourseContent called with:', { coursePath, locale, docsPath, relativePath, langDir, possiblePaths });
  
  // Try each possible path
  for (const filePath of possiblePaths) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const title = extractTitle(content, coursePath[coursePath.length - 1] || 'Untitled');
      
      // Check if the other language version exists
      const otherLangDir = locale === 'zh' ? 'en' : 'zh';
      const otherPossiblePaths = [
        path.join(docsPath, otherLangDir, relativePath + '.md'),
        path.join(docsPath, otherLangDir, relativePath + '.en.md'),
      ];
      
      let hasOtherVersion = false;
      for (const otherPath of otherPossiblePaths) {
        if (await fileExists(otherPath)) {
          hasOtherVersion = true;
          break;
        }
      }
      
      console.log('File found successfully:', { filePath, contentLength: content.length });
      
      return {
        content,
        title,
        filePath,
        exists: true,
        hasEnglishVersion: locale === 'en' || hasOtherVersion,
        hasChineseVersion: locale === 'zh' || hasOtherVersion,
      };
    } catch (error) {
      console.log('Failed to read file:', filePath);
      // Continue to next possible path
    }
  }
  
  // If all attempts failed, try fallback to other language
  console.log('All attempts failed, trying fallback...');
  const fallbackLangDir = locale === 'zh' ? 'en' : 'zh';
  const fallbackPaths = [
    path.join(docsPath, fallbackLangDir, relativePath + '.md'),
    path.join(docsPath, fallbackLangDir, relativePath + '.en.md'),
  ];
  
  for (const fallbackPath of fallbackPaths) {
    try {
      const content = await fs.readFile(fallbackPath, 'utf-8');
      const title = extractTitle(content, coursePath[coursePath.length - 1] || 'Untitled');
      
      return {
        content,
        title,
        filePath: fallbackPath,
        exists: true,
        hasEnglishVersion: fallbackLangDir === 'en',
        hasChineseVersion: fallbackLangDir === 'zh',
        isFallback: true,
      };
    } catch (fallbackError) {
      console.log('Fallback failed:', fallbackPath);
    }
  }
  
  console.log('No files found, returning not found');
  return {
    content: '',
    title: '',
    filePath: '',
    exists: false,
    hasEnglishVersion: false,
    hasChineseVersion: false,
  };
}

export async function getCourseMetadata(coursePath: string[]) {
  const metadata = {
    category: '',
    subcategory: '',
    courseName: coursePath[coursePath.length - 1] || '',
  };
  
  // Walk through the path to find category and subcategory
  for (let i = 0; i < coursePath.length - 1; i++) {
    if (i === 0) {
      metadata.category = coursePath[i];
    } else if (i === 1) {
      metadata.subcategory = coursePath[i];
    }
  }
  
  return metadata;
}