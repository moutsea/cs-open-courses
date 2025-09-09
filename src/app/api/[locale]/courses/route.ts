import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

interface CourseInfo {
  id: string;
  title: string;
  path: string;
  category: string;
  subcategory?: string;
  courseName: string;
  isEnglish: boolean;
  hasChineseVersion: boolean;
  hasEnglishVersion: boolean;
  difficulty?: string;
  duration?: string;
  programmingLanguage?: string;
  summary?: string;
  summaryEn?: string;
}

export async function GET(request: NextRequest) {
  try {
    const { pathname } = new URL(request.url);
    const locale = pathname.split('/')[3] || 'zh';
    
    const courseDir = path.join(process.cwd(), 'src/app/[locale]/course');
    const courses: CourseInfo[] = [];
    
    // 递归扫描课程目录
    const scanDirectory = (dirPath: string, currentCategory: string = '', currentSubcategory: string = '') => {
      const items = fs.readdirSync(dirPath);
      
      for (const item of items) {
        const itemPath = path.join(dirPath, item);
        const stat = fs.statSync(itemPath);
        
        if (stat.isDirectory() && item !== '[...path]') {
          // 如果是目录，递归扫描
          const newCategory = currentCategory || item;
          const newSubcategory = currentCategory ? (currentSubcategory || item) : '';
          scanDirectory(itemPath, newCategory, newSubcategory);
        } else if (item.endsWith('.tsx') && !item.includes('page.tsx.backup') && !item.includes('[...path]') && item !== 'simple-test.tsx') {
          // 根据语言偏好选择要扫描的文件
          let shouldScan = false;
          if (locale === 'en') {
            // 英文站点：只扫描 .en.tsx 文件
            shouldScan = item.endsWith('.en.tsx');
          } else {
            // 中文站点：只扫描 .tsx 文件（非 .en.tsx）
            shouldScan = !item.endsWith('.en.tsx');
          }
          
          if (shouldScan) {
            const courseInfo = parseCourseFile(itemPath, currentCategory, currentSubcategory, locale);
            if (courseInfo) {
              courses.push(courseInfo);
            }
          }
        }
      }
    };
    
    // 解析课程文件获取基本信息
    const parseCourseFile = (filePath: string, category: string, subcategory: string, currentLocale: string): CourseInfo | null => {
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const relativePath = path.relative(courseDir, filePath);
        const pathParts = relativePath.replace('.tsx', '').split(path.sep);
        
        // 判断是否是英文版本
        const isEnglish = pathParts[pathParts.length - 1].endsWith('.en') || relativePath.includes('.en.tsx');
        const courseName = pathParts[pathParts.length - 1].replace('.en', '');
        
        // 构建课程ID
        const courseId = pathParts.join('/');
        
        // 提取课程基本信息
        const titleMatch = content.match(/title:\s*"([^"]+)"/);
        const difficultyMatch = content.match(/difficulty:\s*"([^"]+)"/);
        const durationMatch = content.match(/duration:\s*"([^"]+)"/);
        const programmingLanguageMatch = content.match(/programmingLanguage:\s*"([^"]+)"/);
        const summaryMatch = content.match(/summary:\s*"([^"]+)"/);
        const summaryEnMatch = content.match(/summaryEn:\s*"([^"]+)"/);
        
        // 检查是否有对应语言版本
        const chinesePath = isEnglish ? relativePath.replace('.en.tsx', '.tsx') : relativePath;
        const englishPath = !isEnglish ? relativePath.replace('.tsx', '.en.tsx') : relativePath;
        
        const hasChineseVersion = isEnglish ? fs.existsSync(path.join(courseDir, chinesePath)) : true;
        const hasEnglishVersion = !isEnglish ? fs.existsSync(path.join(courseDir, englishPath)) : true;
        
        // 根据文件类型正确设置 summary 和 summaryEn 字段
        let summaryValue = summaryMatch ? summaryMatch[1] : undefined;
        let summaryEnValue = summaryEnMatch ? summaryEnMatch[1] : undefined;
        
        // 如果是英文文件，将 summary 设置为 summaryEn，这样 CourseCard 可以正确显示
        if (isEnglish) {
          summaryEnValue = summaryValue; // 英文文件的 summary 应该作为 summaryEn
          summaryValue = undefined; // 英文文件没有中文 summary
        }
        
        return {
          id: courseId,
          title: titleMatch ? titleMatch[1] : courseName,
          path: courseId,
          category,
          subcategory: subcategory || undefined,
          courseName,
          isEnglish,
          hasChineseVersion,
          hasEnglishVersion,
          difficulty: difficultyMatch ? difficultyMatch[1] : undefined,
          duration: durationMatch ? durationMatch[1] : undefined,
          programmingLanguage: programmingLanguageMatch ? programmingLanguageMatch[1] : undefined,
          summary: summaryValue,
          summaryEn: summaryEnValue
        };
      } catch (error) {
        console.error(`Error parsing course file ${filePath}:`, error);
        return null;
      }
    };
    
    scanDirectory(courseDir);
    
    // 调试：打印课程信息
    console.log(`Total courses found for ${locale}: ${courses.length}`);
    console.log(`Sample courses:`);
    courses.slice(0, 3).forEach(course => {
      console.log(`- ${course.title} (summary: ${course.summary ? course.summary.substring(0, 50) + '...' : 'none'}, summaryEn: ${course.summaryEn ? course.summaryEn.substring(0, 50) + '...' : 'none'})`);
    });
    
    // 按类别和子类别分组
    const groupedCourses = courses.reduce((acc, course) => {
      if (!acc[course.category]) {
        acc[course.category] = {
          slug: course.category,
          name: course.category,
          courses: [],
          subcategories: {}
        };
      }
      
      if (course.subcategory) {
        if (!acc[course.category].subcategories[course.subcategory]) {
          acc[course.category].subcategories[course.subcategory] = {
            slug: course.subcategory,
            name: course.subcategory,
            courses: []
          };
        }
        acc[course.category].subcategories[course.subcategory].courses.push(course);
      } else {
        acc[course.category].courses.push(course);
      }
      
      return acc;
    }, {} as any);
    
    // 转换为最终格式，并过滤掉[...path]类别
    const result = Object.values(groupedCourses)
      .filter((category: any) => category.slug !== '[...path]')
      .map((category: any) => ({
        slug: category.slug,
        name: category.name,
        courses: category.courses,
        subcategories: Object.values(category.subcategories).map((subcategory: any) => ({
          slug: subcategory.slug,
          name: subcategory.name,
          courses: subcategory.courses
        }))
      }));
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error scanning courses:', error);
    return NextResponse.json({ error: 'Failed to scan courses' }, { status: 500 });
  }
}