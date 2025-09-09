export interface CourseInfo {
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
}

export interface SubcategoryInfo {
  slug: string;
  name: string;
  courses: CourseInfo[];
}

export interface CategoryInfo {
  slug: string;
  name: string;
  courses: CourseInfo[];
  subcategories: SubcategoryInfo[];
}