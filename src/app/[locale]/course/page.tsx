import { Suspense } from 'react';
import { Metadata } from 'next';
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

export async function generateMetadata({ params, searchParams }: CoursePageProps): Promise<Metadata> {
  const { locale } = await params;
  const { path } = await searchParams;

  if (!path) {
    return {
      title: 'Invalid Course URL | CS61B & Beyond',
      description: 'No course path specified. Please select a course from the courses page.'
    };
  }

  const decodedPath = decodePathParameter(path);
  const courseContent = await getCourseContent(decodedPath.split('/'), locale);

  if (!courseContent.exists) {
    return {
      title: 'Course Not Found',
      description: `Course "${decodedPath}" not found. Explore our collection of Berkeley, MIT, and Stanford computer science courses instead.`,
      openGraph: {
        title: 'Course Not Found - CS61B & Beyond',
        description: 'Discover other available computer science courses from top universities.'
      }
    };
  }

  const title = extractTitleFromMarkdown(courseContent.content);
  const pathSegments = decodedPath.split('/');
  
  // Create category-specific description based on actual categories
  const categoryDescriptions = {
    'programming-introduction': 'programming fundamentals, software development, and computational thinking',
    'data-structures-algorithms': 'data structures, algorithms, and computational problem-solving techniques',
    'machine-learning': 'machine learning algorithms, statistical modeling, and predictive analytics',
    'deep-learning': 'deep neural networks, backpropagation, and modern AI architectures',
    'computer-graphics': '3D graphics, rendering pipelines, and visual computing techniques',
    'parallel-distributed-systems': 'parallel computing, distributed algorithms, and scalable system design',
    'computer-networks': 'network protocols, data communication, and distributed systems architecture',
    'operating-systems': 'OS design, process management, memory systems, and concurrency control',
    'advanced-machine-learning': 'advanced ML techniques, reinforcement learning, and cutting-edge AI research',
    'advanced-mathematics': 'advanced mathematical concepts for computer science and engineering',
    'artificial-intelligence': 'AI fundamentals, knowledge representation, and intelligent systems',
    'compilers': 'compiler design, parsing techniques, and program optimization',
    'computer-architecture': 'CPU design, memory hierarchy, and computer organization principles',
    'computer-systems-basics': 'fundamental computer systems concepts and architecture',
    'data-science': 'data analysis, statistical methods, and big data processing',
    'database-systems': 'database design, SQL, query optimization, and data management systems',
    'deep-generative-models': 'generative AI, GANs, VAEs, and creative machine learning',
    'electronics-basics': 'electronic circuits, digital logic, and hardware fundamentals',
    'essential-tools': 'essential development tools, version control, and software engineering practices',
    'machine-learning-systems': 'ML infrastructure, deployment, and production systems',
    'mathematics-basics': 'foundational mathematics for computer science and programming',
    'programming-languages-design': 'programming language theory, design patterns, and paradigms',
    'software-engineering': 'software design, testing methodologies, and development lifecycle',
    'system-security': 'cybersecurity, encryption, and system protection mechanisms',
    'web-development': 'web technologies, frontend/backend development, and modern web frameworks'
  };
  
  const categoryName = pathSegments[0] || 'computer science';
  const categoryDescription = categoryDescriptions[categoryName as keyof typeof categoryDescriptions] || 'advanced computer science concepts';
  
  // Create specific description based on path
  const description = `Learn ${title} - ${categoryDescription}. Master essential concepts and practical applications in this comprehensive ${categoryName.replace(/-/g, ' ')} course from top universities.`;

  return {
    title: title,
    description: description,
    keywords: [
      title,
      categoryName.replace(/-/g, ' '),
      'computer science',
      'programming',
      'online course',
      'free education',
      ...pathSegments
    ],
    openGraph: {
      title: `${title} | CS61B & Beyond`,
      description: description,
      url: `https://cs61b.com/${locale}/course?path=${path}`,
      images: [
        {
          url: '/logo.png',
          width: 400,
          height: 400,
          alt: 'CS61B & Beyond - Computer Science Open Courses'
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | CS61B & Beyond`,
      description: description,
      images: ['/logo.png']
    }
  };
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