import { getAllCourses } from '@/lib/getServerData'
import { buildDynamicRoutePath } from '@/lib/pathUtils'

export default async function sitemap() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const currentDate = new Date().toISOString().split('T')[0]
  
  const sitemapEntries = [
    // 首页
    {
      url: `${baseUrl}/`,
      lastModified: currentDate,
      changeFrequency: 'weekly' as const,
      priority: 1.0,
    },
    {
      url: `${baseUrl}/zh`,
      lastModified: currentDate,
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    },
    
    // 关于页面
    {
      url: `${baseUrl}/about`,
      lastModified: currentDate,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/zh/about`,
      lastModified: currentDate,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    },
    
    // 课程列表页面
    {
      url: `${baseUrl}/courses`,
      lastModified: currentDate,
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/zh/courses`,
      lastModified: currentDate,
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    
    // 大学页面
    {
      url: `${baseUrl}/universities`,
      lastModified: currentDate,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/zh/universities`,
      lastModified: currentDate,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    
    // 教程页面
    {
      url: `${baseUrl}/tutorial`,
      lastModified: currentDate,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/zh/tutorial`,
      lastModified: currentDate,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    },
    
    // 搜索页面
    {
      url: `${baseUrl}/search`,
      lastModified: currentDate,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    },
    {
      url: `${baseUrl}/zh/search`,
      lastModified: currentDate,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    },
  ]
  
  try {
    // 获取所有课程并添加到 sitemap
    const [enCourses, zhCourses] = await Promise.all([
      getAllCourses('en'),
      getAllCourses('zh')
    ])
    
    // 使用 Set 来避免重复路径
    const enCoursePaths = new Set<string>()
    const zhCoursePaths = new Set<string>()
    
    // 添加英文课程（去重）
    enCourses.forEach(course => {
      const routePath = buildDynamicRoutePath(course.path)
      const url = `${baseUrl}/course/${routePath.join('/')}`
      if (!enCoursePaths.has(url)) {
        enCoursePaths.add(url)
        sitemapEntries.push({
          url: url,
          lastModified: currentDate,
          changeFrequency: 'monthly' as const,
          priority: 0.8,
        })
      }
    })
    
    // 添加中文课程（去重）
    zhCourses.forEach(course => {
      const routePath = buildDynamicRoutePath(course.path)
      const url = `${baseUrl}/zh/course/${routePath.join('/')}`
      if (!zhCoursePaths.has(url)) {
        zhCoursePaths.add(url)
        sitemapEntries.push({
          url: url,
          lastModified: currentDate,
          changeFrequency: 'monthly' as const,
          priority: 0.8,
        })
      }
    })
    
  } catch (error) {
    console.error('Error generating course sitemap entries:', error)
  }
  
  return sitemapEntries
}
