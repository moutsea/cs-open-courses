export const categoryMapping: Record<string, string> = {
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
  "C": "c",
  "C++": "cpp",
  "函数式编程": "functional",
  "大语言模型": "large-language-models"
};

export const reverseCategoryMapping: Record<string, string> = Object.entries(categoryMapping).reduce((acc, [chinese, english]) => {
  acc[english] = chinese;
  return acc;
}, {} as Record<string, string>);

export function getEnglishSlug(chineseName: string): string {
  return categoryMapping[chineseName] || chineseName.toLowerCase().replace(/\s+/g, '-');
}

export function getChineseName(englishSlug: string): string {
  return reverseCategoryMapping[englishSlug] || englishSlug;
}
/**
 * slug 里带符号的标签，首字母大写拼不回来（`cpp` → `Cpp`）。
 * 展示名一律走 `slugLabel`，不要再各自写 `replace(/\b\w/g, upper)`。
 */
const slugLabelOverrides: Record<string, string> = {
  cpp: 'C++',
  c: 'C'
};

/**
 * 把 slug 变成给人看的名词：中文取映射表，英文按词大写，符号缩写查例外表。
 * 中文名缺失时退回英文写法，避免把 slug 直接露出来。
 */
export function slugLabel(slug: string, locale: string): string {
  if (locale === 'zh') {
    const chinese = getChineseName(slug);
    if (chinese && chinese !== slug) return chinese;
  }
  const override = slugLabelOverrides[slug];
  if (override) return override;
  return slug.replace(/-/g, ' ').replace(/\b\w/g, letter => letter.toUpperCase());
}
