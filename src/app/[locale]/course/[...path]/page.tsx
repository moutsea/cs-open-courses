import { notFound } from 'next/navigation';
import MDXRenderer from '@/components/MDXRenderer';
import { markdownToHTML, extractTitleFromMarkdown } from '@/lib/markdownProcessor';
import { getCourseContent, getAllCoursePaths } from '@/lib/courseUtils';

interface CoursePageProps {
  params: Promise<{
    locale: string;
    path: string[];
  }>;
}



export async function generateStaticParams() {
  const coursePaths = await getAllCoursePaths();
  return coursePaths.map(({ locale, path }) => ({ locale, path }));
}

export default async function CoursePage({ params }: CoursePageProps) {
  const { locale, path: coursePath } = await params;
  const courseContent = await getCourseContent(coursePath, locale);
  
  if (!courseContent.exists) {
    notFound();
  }
  
  // Convert markdown to HTML
  const htmlContent = await markdownToHTML(courseContent.content);
  const title = extractTitleFromMarkdown(courseContent.content);
  
  return (
    <MDXRenderer
      content={htmlContent}
      title={title}
      locale={locale}
      hasEnglishVersion={courseContent.hasEnglishVersion}
      hasChineseVersion={courseContent.hasChineseVersion}
      isFallback={courseContent.isFallback}
      coursePath={coursePath}
    />
  );
}