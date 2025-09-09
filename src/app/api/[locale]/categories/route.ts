import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { getEnglishSlug } from '@/lib/categoryMapping';
import { parseMarkdownFile, Category, Subcategory, Course } from '@/lib/courseParser';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ locale: string }> }
) {
  let locale: string;
  try {
    const resolvedParams = await params;
    locale = resolvedParams.locale;
    
    const docsPath = path.join(process.cwd(), 'cs-self-learning', 'docs-new');
    const categories: Category[] = [];
    
    // Use language-specific directory based on locale
    const langDir = locale === 'zh' ? 'zh' : 'en';
    const langPath = path.join(docsPath, langDir);
    
    // Get all directories in language folder
    const categoryDirs = await fs.readdir(langPath);
    
    for (const categoryDir of categoryDirs) {
      const categoryPath = path.join(langPath, categoryDir);
      const stats = await fs.stat(categoryPath);
      
      if (!stats.isDirectory()) continue;
      
      const category: Category = {
        name: categoryDir,
        slug: getEnglishSlug(categoryDir),
        subcategories: [],
        courses: []
      };
      
      // Get all subdirectories in category folder
      const subcategoryDirs = await fs.readdir(categoryPath);
      
      for (const subcategoryDir of subcategoryDirs) {
        const subcategoryPath = path.join(categoryPath, subcategoryDir);
        const subStats = await fs.stat(subcategoryPath);
        
        if (!subStats.isDirectory()) continue;
        
        const subcategory: Subcategory = {
          name: subcategoryDir,
          slug: getEnglishSlug(subcategoryDir),
          courses: []
        };
        
        // Get all markdown files in subcategory folder
        const files = await fs.readdir(subcategoryPath);
        const markdownFiles = files.filter(file => file.endsWith('.md'));
        
        for (const file of markdownFiles) {
          const filePath = path.join(subcategoryPath, file);
          const courseData = await parseMarkdownFile(filePath);
          
          if (courseData) {
            const course: Course = {
              id: `${category.slug}-${subcategory.slug}-${file.replace('.md', '')}`,
              title: courseData.title,
              description: courseData.content.substring(0, 200) + '...',
              path: `${category.slug}/${subcategory.slug}/${file.replace('.md', '')}`,
              slug: file.replace('.md', ''),
              content: courseData.content,
              hasEnglishVersion: locale === 'en', // English API means this course has English version
              summary: courseData.summary,
              summaryEn: courseData.summaryEn,
              programmingLanguage: courseData.programmingLanguage,
              difficulty: courseData.difficulty,
              duration: courseData.duration,
              categorySlug: category.slug
            };
            subcategory.courses.push(course);
          }
        }
        
        if (subcategory.courses.length > 0) {
          category.subcategories.push(subcategory);
        }
      }
      
      // Add courses directly in category folder
      const categoryFiles = await fs.readdir(categoryPath);
      const categoryMarkdownFiles = categoryFiles.filter(file => file.endsWith('.md'));
      
      for (const file of categoryMarkdownFiles) {
        const filePath = path.join(categoryPath, file);
        const courseData = await parseMarkdownFile(filePath);
        
        if (courseData) {
          const course: Course = {
            id: `${category.slug}-${file.replace('.md', '')}`,
            title: courseData.title,
            description: courseData.content.substring(0, 200) + '...',
            path: `${category.slug}/${file.replace('.md', '')}`,
            slug: file.replace('.md', ''),
            content: courseData.content,
            hasEnglishVersion: locale === 'en', // English API means this course has English version
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
      
      if (category.subcategories.length > 0 || category.courses.length > 0) {
        categories.push(category);
      }
    }
    
    return NextResponse.json(categories);
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}