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
  const docsPath = path.join(process.cwd(), 'cs-self-learning', 'docs');
  const paths: CoursePath[] = [];
  
  async function scanDirectory(dirPath: string, currentPath: string[] = []) {
    const items = await fs.readdir(dirPath);
    
    for (const item of items) {
      const itemPath = path.join(dirPath, item);
      const stats = await fs.stat(itemPath);
      
      if (stats.isDirectory()) {
        await scanDirectory(itemPath, [...currentPath, item]);
      } else if (item.endsWith('.md') && !item.endsWith('.en.md')) {
        // This is a Chinese course
        const coursePath = [...currentPath, item.replace('.md', '')];
        
        // Check if English version exists
        const englishPath = path.join(dirPath, item.replace('.md', '.en.md'));
        const hasEnglishVersion = await fileExists(englishPath);
        
        // Read the Chinese file to get title
        const chineseContent = await fs.readFile(itemPath, 'utf-8');
        const title = extractTitle(chineseContent, item.replace('.md', ''));
        
        paths.push({
          locale: 'zh',
          path: coursePath,
          title,
          hasChineseVersion: true,
          hasEnglishVersion,
        });
        
        if (hasEnglishVersion) {
          // Read the English file to get title
          const englishContent = await fs.readFile(englishPath, 'utf-8');
          const englishTitle = extractTitle(englishContent, item.replace('.md', ''));
          
          paths.push({
            locale: 'en',
            path: coursePath,
            title: englishTitle,
            hasChineseVersion: true,
            hasEnglishVersion: true,
          });
        }
      }
    }
  }
  
  try {
    await scanDirectory(docsPath);
  } catch (error) {
    console.error('Error scanning docs directory:', error);
  }
  
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
  const docsPath = path.join(process.cwd(), 'cs-self-learning', 'docs');
  const relativePath = path.join(...coursePath);
  
  // Determine file extension based on locale
  const fileExtension = locale === 'zh' ? '.md' : '.en.md';
  const filePath = path.join(docsPath, relativePath + fileExtension);
  
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const title = extractTitle(content, coursePath[coursePath.length - 1] || 'Untitled');
    
    return {
      content,
      title,
      filePath,
      exists: true,
      hasEnglishVersion: locale === 'zh',
      hasChineseVersion: locale === 'en',
    };
  } catch (error) {
    // If the requested language version doesn't exist, try the other language
    const fallbackExtension = locale === 'zh' ? '.en.md' : '.md';
    const fallbackPath = path.join(docsPath, relativePath + fallbackExtension);
    
    try {
      const content = await fs.readFile(fallbackPath, 'utf-8');
      const title = extractTitle(content, coursePath[coursePath.length - 1] || 'Untitled');
      
      return {
        content,
        title,
        filePath: fallbackPath,
        exists: true,
        hasEnglishVersion: fallbackExtension === '.md',
        hasChineseVersion: fallbackExtension === '.en.md',
        isFallback: true,
      };
    } catch (fallbackError) {
      return {
        content: '',
        title: '',
        filePath: '',
        exists: false,
        hasEnglishVersion: false,
        hasChineseVersion: false,
      };
    }
  }
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