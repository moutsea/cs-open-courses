// Popular courses data (synced from homepage)
const POPULAR_COURSES = [
  {
    path: '/programming-introduction/python/CS61A',
    slug: 'CS61A',
  },
  {
    path: '/data-structures-algorithms/CS61B',
    slug: 'CS61B',
  },
  {
    path: '/machine-learning/CS189',
    slug: 'CS189',
  },
  {
    path: '/computer-graphics/GAMES101',
    slug: 'GAMES101',
  },
  {
    path: '/deep-learning/CS224n',
    slug: 'CS224n',
  },
  {
    path: '/parallel-distributed-systems/MIT6.824',
    slug: 'MIT6.824',
  },
]

export default function sitemap() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const currentDate = new Date().toISOString().split('T')[0]
  
  const sitemapEntries = [
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
    
    // 课程页面
    {
      url: `${baseUrl}/courses`,
      lastModified: currentDate,
      changeFrequency: 'daily' as const, // 课程信息变化较频繁
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
  ]
  
  // 添加热门课程到 sitemap
  POPULAR_COURSES.forEach(course => {
    // 英文版本
    sitemapEntries.push({
      url: `${baseUrl}/course?path=${encodeURIComponent(course.path)}`,
      lastModified: currentDate,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })
    
    // 中文版本
    sitemapEntries.push({
      url: `${baseUrl}/zh/course?path=${encodeURIComponent(course.path)}`,
      lastModified: currentDate,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })
  })
  
  return sitemapEntries
}
