import { Suspense } from 'react';
import MDXRenderer from '@/components/MDXRenderer';
import { markdownToHTML, extractTitleFromMarkdown } from '@/lib/markdownProcessor';
import { getCourseContent } from '@/lib/courseUtils';
import { decodePathParameter } from '@/lib/pathUtils';

interface CoursePageProps {
  params: Promise<{
    locale: string;
  }>;
  searchParams: Promise<{
    path?: string;
  }>;
}

// Client component to handle search params
function CourseContent({ locale, encodedPath }: { locale: string; encodedPath: string }) {
  const decodedPath = decodePathParameter(encodedPath);
  
  return (
    <Suspense fallback={<div className="text-center py-8">Loading course...</div>}>
      <CourseRenderer locale={locale} path={decodedPath} />
    </Suspense>
  );
}

async function CourseRenderer({ locale, path }: { locale: string; path: string }) {
  const courseContent = await getCourseContent(path.split('/'), locale);
  
  if (!courseContent.exists) {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="flex-grow container mx-auto px-4 py-8 max-w-4xl">
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Course Not Found</h1>
            <p className="text-gray-600 mb-4">
              The course you&apos;re looking for doesn&apos;t exist or is not available.
            </p>
            <a href={`/${locale}/courses`} className="text-blue-600 hover:text-blue-800">
              ← Back to Courses
            </a>
          </div>
        </div>
      </div>
    );
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
      coursePath={path.split('/')}
    />
  );
}

export default async function CoursePage({ params, searchParams }: CoursePageProps) {
  const { locale } = await params;
  const { path } = await searchParams;
  
  if (!path) {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="flex-grow container mx-auto px-4 py-8 max-w-4xl">
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Invalid Course URL</h1>
            <p className="text-gray-600 mb-4">
              No course path specified. Please select a course from the courses page.
            </p>
            <a href={`/${locale}/courses`} className="text-blue-600 hover:text-blue-800">
              ← Back to Courses
            </a>
          </div>
        </div>
      </div>
    );
  }
  
  return <CourseContent locale={locale} encodedPath={path} />;
}