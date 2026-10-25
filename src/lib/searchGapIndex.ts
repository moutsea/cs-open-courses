/**
 * 构建 `ContentIndex`：把站内「有哪些页、每页能回答什么」摊平成可匹配的数据。
 *
 * 和 `searchGaps.ts` 分工：那边是纯逻辑，这边负责读仓库里的真实数据（fs + 生成的索引）。
 * 只在服务端（admin 页面）调用。
 */

import catalogRoutes from '@/data/generated/catalog-routes.json'
import { categoryGuides } from '@/data/category-guides'
import { courseGuides } from '@/data/course-guides'
import videoCatalog from '@/data/course-videos.json'
import { getAllCourses, getCategoriesForLocale } from '@/lib/getServerData'
import { searchCourses, type CourseSearchIndex } from '@/lib/searchIndex'
import { buildDynamicRoutePath } from '@/lib/pathUtils'
import { slugLabel } from '@/lib/categoryMapping'
import { extractCourseFacts, type FactLocale } from '@/lib/courseFacts'
import { universityChineseNames, universitySearchAliases } from '@/data/university-names'
import { courseCodeAliases, extractCodes, normalizeTerm, tokenizeForKeys, type ContentEntry, type ContentIndex, type SearchCapability } from '@/lib/searchGaps'

/**
 * 分类页的搜索别名。用户搜「数据库课程」，而分类页叫「数据库系统」——
 * 没有别名的话这类词会被误判成「站内没有对应页面」。
 */
const categorySearchAliases: Record<string, string[]> = {
  'artificial-intelligence': ['人工智能', 'ai'],
  'computer-architecture': ['计算机组成', '体系结构', '计组', 'computer organization'],
  'parallel-distributed-systems': ['并行', '分布式', '并发', 'distributed'],
  'essential-tools': ['工具', '开发工具', '效率工具', '环境配置'],
  'operating-systems': ['操作系统', 'os'],
  'mathematics-basics': ['数学基础', '线性代数', '微积分'],
  'advanced-mathematics': ['数学进阶', '概率论', '凸优化'],
  'database-systems': ['数据库', 'db', 'sql'],
  'data-science': ['数据科学', '数据分析'],
  'data-structures-algorithms': ['数据结构', '算法', '刷题'],
  'machine-learning': ['机器学习', 'ml'],
  'machine-learning-systems': ['机器学习系统', 'mlsys', '推理优化'],
  'advanced-machine-learning': ['机器学习进阶', '图模型'],
  'deep-learning': ['深度学习', 'dl'],
  'deep-generative-models': ['生成模型', '大模型', 'aigc'],
  'electronics-basics': ['电路', '电子基础', '信号与系统'],
  'system-security': ['系统安全', '信息安全', '网络安全', '安全'],
  'programming-introduction': ['编程入门', '零基础', '入门编程', '语言入门'],
  'programming-languages-design': ['编程语言', '程序分析', 'pl'],
  'compilers': ['编译原理', '编译器', 'compiler'],
  'computer-graphics': ['图形学', '计算机图形学', '渲染', 'cg'],
  'computer-networks': ['计算机网络', '网络', 'networking', 'tcp'],
  'computer-systems-basics': ['计算机系统基础', '系统编程'],
  'software-engineering': ['软件工程', '软工'],
  'web-development': ['web', '前端', '全栈', '网页开发']
}

const HUB_ENTRIES: { path: string; label: string; keys: string[]; capabilities: SearchCapability[] }[] = [
  {
    path: '/courses',
    label: '课程目录',
    keys: ['课程目录', '全部课程', '所有课程', '课程列表', '公开课'],
    capabilities: ['roadmap']
  },
  {
    path: '/tutorial',
    label: '学习路线',
    keys: ['学习路线', '路线图', '自学路线', '学习路径', 'roadmap', '怎么学', '转码'],
    capabilities: ['roadmap']
  },
  {
    path: '/universities',
    label: '大学课程索引',
    keys: ['大学课程', '高校课程', '院校'],
    capabilities: []
  }
]

/** `course-content/zh` 下的目录名是英文 slug，展示名要换回中文。 */
function categoryLabel(slug: string, locale: string): string {
  return slugLabel(slug, locale)
}

function withLocale(path: string, locale: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`
  return locale === 'zh' ? `/zh${normalized}` : normalized
}

function uniqueKeys(keys: (string | undefined | null)[]): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  for (const key of keys) {
    if (!key) continue
    const normalized = normalizeTerm(key)
    if (normalized.length < 2) continue
    if (seen.has(normalized)) continue
    seen.add(normalized)
    result.push(normalized)
  }
  return result
}

export async function buildContentIndex(locale: string): Promise<ContentIndex> {
  const factLocale: FactLocale = locale === 'zh' ? 'zh' : 'en'
  const courses = await getAllCourses(locale)
  const entries: ContentEntry[] = []
  const courseCodes = new Set<string>()

  for (const course of courses) {
    const coursePath = buildDynamicRoutePath(course.path).join('/')
    const routePath = withLocale(`/course/${coursePath}`, locale)
    const markdown = course.content || course.contentEn || ''
    const facts = extractCourseFacts(markdown, factLocale)
    const resources = facts.resources.filter(resource => resource.available !== false && resource.url)
    const videos = (videoCatalog.courses as Record<string, { url: string }[]>)[coursePath] || []

    const capabilities: SearchCapability[] = []
    if (courseGuides[coursePath]) capabilities.push('guide', 'roadmap')
    if (resources.some(resource => resource.kind === 'textbook')) capabilities.push('textbook')
    if (videos.length > 0 || resources.some(resource => resource.kind === 'video')) capabilities.push('video')
    if (resources.some(resource => resource.kind === 'assignment')) capabilities.push('assignment')
    if (resources.some(resource => /github\.com|gitlab\.com|gitee\.com/i.test(resource.url))) capabilities.push('github')
    if (facts.prerequisites) capabilities.push('prerequisite')
    if (facts.difficultyLabel || facts.hours) capabilities.push('difficulty')
    // 「中文」能力 = 有中文版，不能拿 hasEnglishVersion 顶替（英文页会一律命中）。
    if (course.hasChineseVersion ?? Boolean(course.content)) capabilities.push('chinese')
    // 站内没有笔记 / 历年题 / PDF 下载：能力表里显式缺席，用户搜到这类词就会报缺口。

    // Preserve complete names such as Nand2Tetris and route identifiers such as N2T / 6031.
    // Keep dotted/hyphenated title tokens intact so MIT6.S184 never introduces a MIT6 alias.
    const titleIdentifiers = (course.title.match(/[A-Za-z0-9]+(?:[.\-][A-Za-z0-9]+)*/g) || [])
      .filter(token => /[A-Za-z]/.test(token) && /\d/.test(token))
    const codes = uniqueKeys([
      ...extractCodes([course.title, course.slug, course.path].join(' ')),
      ...(/\d/.test(course.slug) ? [course.slug] : []),
      ...titleIdentifiers
    ].flatMap(courseCodeAliases))
    for (const code of codes) courseCodes.add(code)

    entries.push({
      kind: 'course',
      path: routePath,
      label: course.title,
      codes,
      keys: uniqueKeys([
        course.title,
        course.slug,
        course.path,
        ...tokenizeForKeys(course.title),
        ...tokenizeForKeys(course.slug),
        ...codes
      ]),
      capabilities
    })
  }

  const categories = await getCategoriesForLocale(locale)
  for (const category of categories) {
    const slug = category.slug
    const chineseName = categoryLabel(slug, locale)
    entries.push({
      kind: 'category',
      path: withLocale(`/courses/${slug}`, locale),
      label: chineseName,
      keys: uniqueKeys([
        category.name,
        chineseName,
        slug,
        slug.replace(/-/g, ' '),
        ...(categorySearchAliases[slug] || []),
        ...tokenizeForKeys(slug)
      ]),
      capabilities: categoryGuides[slug] ? ['guide', 'roadmap'] : ['roadmap']
    })

    for (const subcategory of category.subcategories || []) {
      const subSlug = subcategory.slug
      if (!subSlug) continue
      entries.push({
        kind: 'category',
        path: withLocale(`/courses/${slug}/${subSlug}`, locale),
        label: `${chineseName} · ${categoryLabel(subSlug, locale)}`,
        keys: uniqueKeys([subcategory.name, categoryLabel(subSlug, locale), subSlug, subSlug.replace(/-/g, ' '), ...tokenizeForKeys(subSlug)]),
        capabilities: ['roadmap']
      })
    }
  }

  const universitySlugs: string[] = catalogRoutes[locale === 'zh' ? 'zh' : 'en']?.universities || []
  for (const slug of universitySlugs) {
    const name = universityChineseNames[slug] || slug
    entries.push({
      kind: 'university',
      path: withLocale(`/universities/${slug}`, locale),
      label: name,
      keys: uniqueKeys([name, slug, slug.replace(/-/g, ' '), ...(universitySearchAliases[slug] || []), ...tokenizeForKeys(name)]),
      // 大学页有课程清单和 FAQ，但没有教材/视频的横向对比。
      capabilities: ['roadmap']
    })
  }

  for (const hub of HUB_ENTRIES) {
    entries.push({
      kind: 'hub',
      path: withLocale(hub.path, locale),
      label: hub.label,
      keys: uniqueKeys(hub.keys),
      capabilities: hub.capabilities
    })
  }

  return { entries, courseCodes }
}

/**
 * 进程内缓存。
 *
 * 内容索引和站内搜索索引都来自构建期打进包里的 md / 生成 JSON，同一次部署内不会变；
 * 新部署会起新的 isolate，缓存随之作废，所以不需要手动失效。
 * 不用 `unstable_cache`：它要把结果序列化，而 `ContentIndex.courseCodes` 是 Set。
 * 开发环境不缓存，改了 md 刷新就能看到。
 */
const cacheEnabled = process.env.NODE_ENV === 'production'

const contentIndexCache = new Map<string, Promise<ContentIndex>>()

/** `buildContentIndex` 的缓存版：同一 locale 只构建一次（约 400–600ms → 0）。调用方不得修改返回值。 */
export function getContentIndex(locale: string): Promise<ContentIndex> {
  if (!cacheEnabled) return buildContentIndex(locale)
  const cached = contentIndexCache.get(locale)
  if (cached) return cached
  const pending = buildContentIndex(locale)
  contentIndexCache.set(locale, pending)
  // 失败不缓存，下次请求重试。
  pending.catch(() => contentIndexCache.delete(locale))
  return pending
}

/** 搜索词来自用户输入，键数设上限，超出后整体清空（量级很小，不值得做 LRU）。 */
const SEARCH_HIT_CACHE_LIMIT = 5000
const searchHitCache = new Map<string, number>()

/**
 * 站内搜索命中数，按词缓存。`searchIndex` 必须是 `buildSearchIndex()` 返回的那份
 * 静态生成索引：缓存键里不含索引本身，换别的数组会读到旧结果。
 */
export function countSearchHits(term: string, searchIndex: CourseSearchIndex[]): number {
  const cached = cacheEnabled ? searchHitCache.get(term) : undefined
  if (cached !== undefined) return cached
  const hits = searchCourses(term, searchIndex).length
  if (cacheEnabled) {
    if (searchHitCache.size >= SEARCH_HIT_CACHE_LIMIT) searchHitCache.clear()
    searchHitCache.set(term, hits)
  }
  return hits
}
