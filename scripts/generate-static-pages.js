import fs from 'fs/promises';
import path from 'path';

// Simplified category mapping - extracted from the TypeScript file
const categoryMapping = {
  "人工智能": "artificial-intelligence",
  "体系结构": "computer-architecture",
  "并行与分布式系统": "parallel-distributed-systems",
  "必学工具": "essential-tools",
  "操作系统": "operating-systems",
  "数学基础": "mathematics-basics",
  "数学进阶": "advanced-mathematics",
  "数据库系统": "database-systems",
  "数据科学": "data-science",
  "数据结构与算法": "data-structures-algorithms",
  "机器学习": "machine-learning",
  "机器学习系统": "machine-learning-systems",
  "机器学习进阶": "advanced-machine-learning",
  "深度学习": "deep-learning",
  "深度生成模型": "deep-generative-models",
  "电子基础": "electronics-basics",
  "系统安全": "system-security",
  "编程入门": "programming-introduction",
  "编程语言设计与分析": "programming-languages-design",
  "编译原理": "compilers",
  "计算机图形学": "computer-graphics",
  "计算机系统基础": "computer-systems-basics",
  "计算机网络": "computer-networks",
  "软件工程": "software-engineering",
  "Web开发": "web-development",
  
  // Subcategory mappings
  "Python": "python",
  "Rust": "rust",
  "Java": "java",
  "cpp": "cpp",
  "C": "c",
  "Functional": "functional",
  "大语言模型": "large-language-models"
};

function getEnglishSlug(chineseName) {
  return categoryMapping[chineseName] || chineseName.toLowerCase().replace(/\s+/g, '-');
}

async function generateStaticPages() {
  const docsPath = path.join(process.cwd(), 'cs-self-learning', 'docs');
  const appPath = path.join(process.cwd(), 'src', 'app');
  
  try {
    // Get all directories in docs folder
    const categoryDirs = await fs.readdir(docsPath);
    
    for (const categoryDir of categoryDirs) {
      const categoryPath = path.join(docsPath, categoryDir);
      const stats = await fs.stat(categoryPath);
      
      if (!stats.isDirectory() || categoryDir === 'images') continue;
      
      const categorySlug = getEnglishSlug(categoryDir);
      
      // Process items in category directory
      const items = await fs.readdir(categoryPath);
      
      for (const item of items) {
        const itemPath = path.join(categoryPath, item);
        const itemStats = await fs.stat(itemPath);
        
        if (itemStats.isDirectory()) {
          // This is a subcategory
          const subcategorySlug = getEnglishSlug(item);
          
          // Process courses in subcategory
          const courseFiles = await fs.readdir(itemPath);
          
          for (const courseFile of courseFiles) {
            if (courseFile.endsWith('.md')) {
              await generateCoursePage({
                categoryDir,
                categorySlug,
                subcategoryDir: item,
                subcategorySlug,
                courseFile,
                docsPath,
                appPath
              });
            }
          }
        } else if (item.endsWith('.md')) {
          // This is a direct course in category
          await generateCoursePage({
            categoryDir,
            categorySlug,
            courseFile: item,
            docsPath,
            appPath
          });
        }
      }
    }
    
    console.log('✅ Static pages generated successfully!');
  } catch (error) {
    console.error('❌ Error generating static pages:', error);
  }
}

async function generateCoursePage({
  categoryDir,
  categorySlug,
  subcategoryDir,
  subcategorySlug,
  courseFile,
  docsPath,
  appPath
}) {
  const isEnglishFile = courseFile.endsWith('.en.md');
  const courseSlug = courseFile.replace('.md', '').replace('.en.md', '');
  const fileName = courseSlug + '.tsx';
  
  // Determine the path structure
  let routePath;
  if (subcategoryDir) {
    routePath = path.join(appPath, '[locale]', 'course', categorySlug, subcategorySlug, fileName);
  } else {
    routePath = path.join(appPath, '[locale]', 'course', categorySlug, fileName);
  }
  
  // Create directory if it doesn't exist
  await fs.mkdir(path.dirname(routePath), { recursive: true });
  
  // Read the markdown file
  const filePath = subcategoryDir 
    ? path.join(docsPath, categoryDir, subcategoryDir, courseFile)
    : path.join(docsPath, categoryDir, courseFile);
  
  const content = await fs.readFile(filePath, 'utf-8');
  
  // Extract course metadata
  const courseData = extractCourseData(content, courseFile, isEnglishFile);
  
  // Generate the page component
  const pageContent = generatePageComponent({
    courseData,
    categoryDir,
    categorySlug,
    subcategoryDir,
    subcategorySlug,
    courseSlug,
    isEnglishFile,
    content
  });
  
  // Write the page file
  await fs.writeFile(routePath, pageContent);
  console.log(`📄 Generated: ${routePath}`);
}

function extractCourseData(content, fileName, isEnglishFile) {
  const lines = content.split('\n');
  
  // Extract title from first h1 or use filename
  let title = fileName.replace('.md', '').replace('.en', '');
  const firstLine = lines.find(line => line.startsWith('# '));
  if (firstLine) {
    title = firstLine.substring(2).trim();
  }
  
  // Extract metadata
  let programmingLanguage = '';
  let difficulty = '';
  let duration = '';
  let summary = '';
  
  const introSectionIndex = lines.findIndex(line => 
    line.includes('课程简介') || line.includes('Course Introduction') || line.includes('课程介绍') || 
    line.includes('Descriptions') || line.includes('Description') || line.includes('简介')
  );
  
  if (introSectionIndex !== -1) {
    // Extract metadata
    for (let i = introSectionIndex + 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line.startsWith('-') && line !== '') break;
      if (line === '') continue;
      
      if (line.includes('编程语言') || line.includes('Programming Language')) {
        const parts = line.split(/[:：]/);
        if (parts.length > 1) {
          programmingLanguage = parts[1].trim().replace(/\*\*/g, '');
        }
      }
      
      if (line.includes('课程难度') || line.includes('Difficulty')) {
        const parts = line.split(/[:：]/);
        if (parts.length > 1) {
          const difficultyText = parts[1].trim().replace(/\*\*/g, '');
          const starCount = (difficultyText.match(/🌟/g) || []).length;
          if (starCount > 0) {
            if (starCount <= 2) difficulty = 'Beginner';
            else if (starCount <= 4) difficulty = 'Intermediate';
            else difficulty = 'Advanced';
          } else {
            difficulty = difficultyText;
          }
        }
      }
      
      if (line.includes('预计学时') || line.includes('Class Hour')) {
        const parts = line.split(/[:：]/);
        if (parts.length > 1) {
          duration = parts[1].trim().replace(/\*\*/g, '');
        }
      }
    }
    
    // Extract summary
    let descriptionStartIndex = introSectionIndex + 1;
    while (descriptionStartIndex < lines.length) {
      const line = lines[descriptionStartIndex].trim();
      if (line.startsWith('-') || line.includes(':') || line.startsWith('##') || line === '') {
        descriptionStartIndex++;
      } else {
        break;
      }
    }
    
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
    
    summary = descriptionLines.join(' ')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/#+\s*/g, '')
      .trim();
    
    if (summary.length > 150) {
      summary = summary.substring(0, 150) + '...';
    }
  }
  
  return {
    title,
    programmingLanguage,
    difficulty,
    duration,
    summary,
    content
  };
}

function generatePageComponent({
  courseData,
  categoryDir,
  categorySlug,
  subcategoryDir,
  subcategorySlug,
  courseSlug,
  isEnglishFile,
  content
}) {
  const hasSubcategory = subcategoryDir ? true : false;
  
  return `'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';

export default function CoursePage() {
  const [isExpanded, setIsExpanded] = useState(false);
  const t = useTranslations('course');
  const tCourses = useTranslations('courses');
  const params = useParams<{ locale: string }>();
  const locale = params.locale;

  const courseData = {
    title: "${courseData.title}",
    programmingLanguage: "${courseData.programmingLanguage}",
    difficulty: "${courseData.difficulty}",
    duration: "${courseData.duration}",
    summary: "${courseData.summary}",
    content: \`${content.replace(/\`/g, '\\`').replace(/\$/g, '\\$')}\`,
    path: "${hasSubcategory ? `${categoryDir}/${subcategoryDir}/${courseSlug}${isEnglishFile ? '.en.md' : '.md'}` : `${categoryDir}/${courseSlug}${isEnglishFile ? '.en.md' : '.md'}`}",
    hasEnglishVersion: ${!isEnglishFile}
  };

  const toggleExpanded = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsExpanded(!isExpanded);
  };

  // Format the content with better markdown rendering
  const formatContent = (content: string) => {
    let formatted = content;
    
    // Handle headers first, but skip the first H1 to avoid duplication with page title
    let isFirstH1 = true;
    formatted = formatted.replace(/^# (.*$)/gm, (match, title) => {
      if (isFirstH1) {
        isFirstH1 = false;
        return ''; // Skip the first H1
      }
      return \`<h1 class="text-3xl font-bold text-gray-900 mt-8 mb-6">\${title}</h1>\`;
    });
    
    // Remove Course Overview title but keep the content
    formatted = formatted.replace(/^## Course Overview$/gm, '');
    
    formatted = formatted
      .replace(/^### (.*$)/gm, '<h3 class="text-xl font-semibold text-gray-800 mt-6 mb-4">$1</h3>')
      .replace(/^## (.*$)/gm, '<h2 class="text-2xl font-bold text-gray-900 mt-6 mb-5">$1</h2>');
    
    // Handle lists by splitting lines and processing
    const lines = formatted.split('\\n');
    let inNumberedList = false;
    let inBulletList = false;
    const result = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Check for numbered list
      if (/^\\d+\\.\\s+/.test(line)) {
        if (!inNumberedList) {
          if (inBulletList) {
            result.push('</ul>');
            inBulletList = false;
          }
          result.push('<ol class="mb-6 space-y-3 bg-blue-50 p-4 rounded-lg border-l-4 border-blue-300">');
          inNumberedList = true;
        }
        let itemText = line.replace(/^\\d+\\.\\s+/, '');
        // Process markdown within list items
        itemText = itemText
          .replace(/\\*\\*(.*?)\\*\\*/g, '<strong class="font-semibold text-gray-800">$1</strong>')
          .replace(/\\*(.*?)\\*/g, '<em class="italic text-gray-700">$1</em>')
          .replace(/\`(.*?)\`/g, '<code class="bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm font-mono">$1</code>')
          .replace(/\\[(.*?)\\]\\((.*?)\\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline">$1</a>')
          .replace(/<(https?:\\/\\/[^\\s>]+)>/g, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline">$1</a>');
        result.push(\`<li class="mb-3 ml-6 list-decimal text-gray-700 leading-relaxed">\${itemText}</li>\`);
      }
      // Check for bullet list
      else if (/^[\\-\\*]\\s+/.test(line)) {
        if (!inBulletList) {
          if (inNumberedList) {
            result.push('</ol>');
            inNumberedList = false;
          }
          result.push('<ul class="mb-6 space-y-3 bg-gray-50 p-4 rounded-lg border-l-4 border-gray-300">');
          inBulletList = true;
        }
        let itemText = line.replace(/^[\\-\\*]\\s+/, '');
        // Process markdown within list items
        itemText = itemText
          .replace(/\\*\\*(.*?)\\*\\*/g, '<strong class="font-semibold text-gray-800">$1</strong>')
          .replace(/\\*(.*?)\\*/g, '<em class="italic text-gray-700">$1</em>')
          .replace(/\`(.*?)\`/g, '<code class="bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm font-mono">$1</code>')
          .replace(/\\[(.*?)\\]\\((.*?)\\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline">$1</a>')
          .replace(/<(https?:\\/\\/[^\\s>]+)>/g, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline">$1</a>');
        result.push(\`<li class="mb-3 ml-6 list-disc text-gray-700 leading-relaxed">\${itemText}</li>\`);
      }
      // Empty line or other content
      else {
        if (inNumberedList) {
          result.push('</ol>');
          inNumberedList = false;
        }
        if (inBulletList) {
          result.push('</ul>');
          inBulletList = false;
        }
        result.push(line);
      }
    }
    
    // Close any open lists
    if (inNumberedList) result.push('</ol>');
    if (inBulletList) result.push('</ul>');
    
    formatted = result.join('\\n');
    
    // Handle other markdown elements
    const contentLines = formatted.split('\\n');
    const processedLines = [];
    let inList = false;
    
    for (const line of contentLines) {
      if (line.includes('<ol class="') || line.includes('<ul class="')) {
        inList = true;
        processedLines.push(line);
      } else if (line.includes('</ol>') || line.includes('</ul>')) {
        inList = false;
        processedLines.push(line);
      } else if (!inList) {
        // Process markdown for non-list content
        const processedLine = line
          .replace(/\\*\\*(.*?)\\*\\*/g, '<strong class="font-semibold text-gray-800">$1</strong>')
          .replace(/\\*(.*?)\\*/g, '<em class="italic text-gray-700">$1</em>')
          .replace(/\`(.*?)\`/g, '<code class="bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm font-mono">$1</code>')
          .replace(/\\[(.*?)\\]\\((.*?)\\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline">$1</a>')
          .replace(/<(https?:\\/\\/[^\\s>]+)>/g, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline">$1</a>');
        processedLines.push(processedLine);
      } else {
        processedLines.push(line);
      }
    }
    
    formatted = processedLines.join('\\n');
    
    // Handle paragraphs and line breaks
    formatted = formatted
      .replace(/\\n\\n/g, '</p><p class="mb-4 text-gray-700 leading-relaxed">')
      .replace(/\\n(?![<])/g, '<br />');
    
    return formatted;
  };

  const formattedContent = \`<p class="mb-4 text-gray-700 leading-relaxed">\${formatContent(courseData.content)}</p>\`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Header locale={locale} />
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4 py-6 max-w-4xl">
          <div className="flex items-center justify-between">
            <Link 
              href={locale === 'en' ? '/courses' : \`/\${locale}/courses\`} 
              className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              {tCourses('backToCourses')}
            </Link>
            
            {courseData.hasEnglishVersion && (
              <div className="flex items-center px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm font-medium">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                </svg>
                {locale === 'zh' ? '中文版本' : 'English Version'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Course Header */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-gray-900 mb-4 leading-tight">
                {courseData.title}
              </h1>
              <div className="flex items-center text-sm text-gray-500 space-x-4">
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                    ${hasSubcategory ? `${categorySlug}/${subcategorySlug}/${courseSlug}` : `${categorySlug}/${courseSlug}`}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Course Content */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="border-b border-gray-200 px-8 py-6 bg-gradient-to-r from-blue-50 to-indigo-50">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <svg className="w-6 h-6 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              {t('courseContent')}
            </h2>
          </div>
          
          <div className="p-8">
            <div 
              className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-strong:text-gray-800 prose-code:bg-gray-100 prose-code:text-gray-800 prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline"
              dangerouslySetInnerHTML={{ 
                __html: formattedContent
              }} 
            />
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <Link 
            href={locale === 'en' ? '/courses' : \`/\${locale}/courses\`} 
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            {tCourses('browseMore')}
          </Link>
        </div>
      </div>
      
      <Footer locale={locale} />
    </div>
  );
}
`;
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  generateStaticPages();
}

export { generateStaticPages };