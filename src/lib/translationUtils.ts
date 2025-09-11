import { useTranslations } from 'next-intl';

// 通用翻译接口
export interface TranslationKeys {
  difficulty: string;
  duration: string;
  language: string;
  viewCourse: string;
  courses: string;
  universities: string;
  tutorial: string;
  title: string;
  subtitle: string;
}

// 默认的fallback翻译
export const fallbackTranslations: Record<string, TranslationKeys> = {
  en: {
    difficulty: 'Difficulty',
    duration: 'Duration',
    language: 'Language',
    viewCourse: 'View Course',
    courses: 'Courses',
    universities: 'Universities',
    tutorial: 'Tutorial',
    title: 'Popular Courses',
    subtitle: 'Handpicked classic courses from top universities'
  },
  zh: {
    difficulty: '难度',
    duration: '学习时间',
    language: '编程语言',
    viewCourse: '查看课程',
    courses: '所有课程',
    universities: '大学',
    tutorial: '教程',
    title: '热门课程',
    subtitle: '精选顶尖大学经典课程'
  }
};

// 简单翻译hooks - 用于不需要next-intl的组件
export function useSimpleTranslations(locale: string) {
  return fallbackTranslations[locale] || fallbackTranslations.en;
}

// 安全翻译hooks - 带有fallback的翻译获取
export function useSafeTranslations(namespace: string, locale?: string) {
  const t = useTranslations(namespace);
  const fallback = fallbackTranslations[locale || 'en'] || fallbackTranslations.en;
  
  const getTranslation = (key: string): string => {
    try {
      const value = t(key);
      // 如果从消息文件中找到了值且不是键本身，则使用它
      if (value && value !== key) {
        return value;
      }
      // 否则使用fallback
      return fallback[key as keyof TranslationKeys];
    } catch {
      return fallback[key as keyof TranslationKeys];
    }
  };
  
  return { t: getTranslation, fallback };
}

// 获取难度颜色
export function getDifficultyColor(difficulty: string): string {
  switch (difficulty.toLowerCase()) {
    case 'beginner':
      return 'bg-green-100 text-green-800';
    case 'intermediate':
      return 'bg-yellow-100 text-yellow-800';
    case 'advanced':
      return 'bg-red-100 text-red-800';
    case 'expert':
      return 'bg-purple-100 text-purple-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

// 简单的翻译函数 - 用于服务端组件
export function getSimpleTranslation(key: keyof TranslationKeys, locale: string): string {
  const translations = fallbackTranslations[locale] || fallbackTranslations.en;
  return translations[key];
}