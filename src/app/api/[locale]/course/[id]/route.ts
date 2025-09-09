import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { getEnglishSlug } from '@/lib/categoryMapping';
import { parseMarkdownFile, Category, Course } from '@/lib/courseParser';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ locale: string; id: string }> }
) {
  let locale, id;
  try {
    const resolvedParams = await params;
    locale = resolvedParams.locale;
    id = resolvedParams.id;
    
    // Get the categories data directly (same logic as categories API)
    const docsPath = path.join(process.cwd(), 'cs-self-learning', 'docs');
    const categories: Category[] = [];
    
    // Get all directories in docs folder (excluding images)
    const categoryDirs = await fs.readdir(docsPath);
    
    for (const categoryDir of categoryDirs) {
      const categoryPath = path.join(docsPath, categoryDir);
      const stat = await fs.stat(categoryPath);
      
      if (stat.isDirectory() && categoryDir !== 'images') {
        const category: Category = {
          name: categoryDir,
          slug: getEnglishSlug(categoryDir),
          subcategories: [],
          courses: []
        };
        
        // Get all markdown files in category directory
        const files = await fs.readdir(categoryPath);
        
        for (const file of files) {
          if (file.endsWith('.md') || file.endsWith('.en.md')) {
            const filePath = path.join(categoryPath, file);
            const courseData = await parseMarkdownFile(filePath);
            
            if (courseData) {
              const fileSlug = file.replace('.md', '').replace('.en.md', '');
              const isEnglishFile = file.endsWith('.en.md');
              
              // For Chinese files, create course entry
              if (!isEnglishFile) {
                const course: Course = {
                  id: `${category.slug}-${fileSlug}`,
                  title: courseData.title,
                  description: courseData.content.substring(0, 200) + '...',
                  path: path.join(categoryDir, file),
                  slug: fileSlug,
                  content: courseData.content,
                  hasEnglishVersion: false, // Will be updated if English version exists
                  summary: courseData.summary,
                  summaryEn: courseData.summaryEn,
                  programmingLanguage: courseData.programmingLanguage,
                  difficulty: courseData.difficulty,
                  duration: courseData.duration,
                  categorySlug: category.slug
                };
                
                category.courses.push(course);
              }
            }
          }
        }
        
        // Second pass: check for English versions and update hasEnglishVersion
        for (const course of category.courses) {
          const englishFile = course.path.replace('.md', '.en.md');
          const englishFilePath = path.join(categoryPath, path.basename(englishFile));
          
          try {
            await fs.access(englishFilePath);
            course.hasEnglishVersion = true;
            
            // If English file exists, parse it to get English content
            const englishCourseData = await parseMarkdownFile(englishFilePath);
            if (englishCourseData) {
              course.contentEn = englishCourseData.content;
              course.summaryEn = englishCourseData.summaryEn || englishCourseData.summary;
            }
          } catch {
            course.hasEnglishVersion = false;
          }
        }
        
        categories.push(category);
      }
    }
    
    // Find the course by ID
    let foundCourse = null;
    
    for (const category of categories) {
      for (const course of category.courses) {
        if (course.id === id) {
          foundCourse = course;
          break;
        }
      }
      if (foundCourse) break;
    }
    
    if (!foundCourse) {
      return NextResponse.json(
        { error: locale === 'zh' ? '课程未找到' : 'Course not found' },
        { status: 404 }
      );
    }
    
    // Parse English file to get correct title if needed
    let englishTitle = foundCourse.title;
    if (foundCourse.hasEnglishVersion) {
      const englishFilePath = foundCourse.path.replace('.md', '.en.md');
      const fullEnglishPath = path.join(process.cwd(), 'cs-self-learning', 'docs', englishFilePath);
      try {
        const englishCourseData = await parseMarkdownFile(fullEnglishPath);
        if (englishCourseData) {
          englishTitle = englishCourseData.title;
        }
      } catch (error) {
        console.error('Error parsing English file for title:', error);
      }
    }
    
    // Return course data based on locale
    const courseForLocale = {
      ...foundCourse,
      title: locale === 'en' && foundCourse.hasEnglishVersion ? 
        englishTitle : foundCourse.title,
      content: locale === 'en' && foundCourse.contentEn ? 
        foundCourse.contentEn : foundCourse.content,
      summary: locale === 'en' && foundCourse.summaryEn ? 
        foundCourse.summaryEn : foundCourse.summary,
      description: locale === 'en' && foundCourse.contentEn ? 
        (foundCourse.contentEn.substring(0, 200) + '...') : foundCourse.description
    };
    
    return NextResponse.json(courseForLocale);
  } catch (error) {
    console.error('Error fetching course:', error);
    return NextResponse.json(
      { error: locale === 'zh' ? '获取课程失败' : 'Failed to fetch course' },
      { status: 500 }
    );
  }
}