import { Suspense } from 'react';
import { Metadata } from 'next';
import MDXRenderer from '@/components/MDXRenderer';
import { markdownToHTML, extractTitleFromMarkdown } from '@/lib/markdownProcessor';
import { getCourseContent } from '@/lib/courseUtils';
import { getEnglishSlug } from '@/lib/categoryMapping';
import { getAllCourses } from '@/lib/getServerData';
import StructuredData from '@/components/StructuredData';

interface CoursePageProps {
  params: Promise<{
    locale: string;
    path: string[];
  }>;
}

export async function generateStaticParams() {
  const params = [];
  
  // Generate params for both locales
  for (const locale of ['en', 'zh']) {
    try {
      const courses = await getAllCourses(locale);
      
      for (const course of courses) {
        // Convert course path to URL format
        const pathParts = course.path.split('/');
        const pathWithoutLocale = pathParts.slice(1); // Remove locale prefix
        const lastPart = pathWithoutLocale[pathWithoutLocale.length - 1];
        
        // Remove file extension if present (both .md and .en.md)
        if (lastPart && lastPart.endsWith('.md')) {
          if (lastPart.endsWith('.en.md')) {
            pathWithoutLocale[pathWithoutLocale.length - 1] = lastPart.replace('.en.md', '');
          } else {
            pathWithoutLocale[pathWithoutLocale.length - 1] = lastPart.replace('.md', '');
          }
        }
        
        // Convert directory parts to English slugs
        const urlPath = pathWithoutLocale.map((segment, index) => {
          if (index < pathWithoutLocale.length - 1) {
            // Convert Chinese directory names to English slugs
            return getEnglishSlug(segment);
          }
          return segment;
        });
        
        params.push({
          locale,
          path: urlPath,
        });
      }
    } catch (error) {
      console.error(`Error generating static params for locale ${locale}:`, error);
    }
  }
  
  return params;
}

export async function generateMetadata({ params }: CoursePageProps): Promise<Metadata> {
  const { locale, path } = await params;
  
  // Convert URL path back to file system path
  const coursePath = path.join('/');
  const courseContent = await getCourseContent(path, locale);

  if (!courseContent.exists) {
    return {
      title: 'Course Not Found',
      description: `Course "${coursePath}" not found. Explore our collection of Berkeley, MIT, and Stanford computer science courses instead.`,
      openGraph: {
        title: 'Course Not Found - CS61B & Beyond',
        description: 'Discover other available computer science courses from top universities.'
      }
    };
  }

  const title = extractTitleFromMarkdown(courseContent.content);
  
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
  
  const categoryName = path[0] || 'computer science';
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
      ...path
    ],
    openGraph: {
      title: `${title} | CS61B & Beyond`,
      description: description,
      url: `https://cs61b.com/${locale}/course/${path.join('/')}`,
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

export default async function CoursePage({ params }: CoursePageProps) {
  const { locale, path } = await params;
  
  return (
    <Suspense fallback={<div className="text-center py-8">Loading course...</div>}>
      <CourseRenderer locale={locale} path={path} />
    </Suspense>
  );
}

async function CourseRenderer({ locale, path }: { locale: string; path: string[] }) {
  const courseContent = await getCourseContent(path, locale);

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

  // Generate structured data
  const courseUrl = `https://cs61b.com/${locale}/course/${path.join('/')}`;
  const courseTitle = extractTitleFromMarkdown(courseContent.content);
  const categoryName = path[0] || 'computer science';
  
  // Estimate course duration based on content length
  const estimatedDuration = Math.max(1, Math.ceil(courseContent.content.length / 5000));

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Course",
        "name": courseTitle,
        "description": `Learn ${courseTitle} - ${categoryName.replace(/-/g, ' ')} course from top universities including Berkeley, MIT, and Stanford.`,
        "url": courseUrl,
        "provider": {
          "@type": "EducationalOrganization",
          "name": "CS61B & Beyond",
          "url": "https://cs61b.com",
          "description": "Free computer science courses from top universities"
        },
        "educationalLevel": "Higher Education",
        "courseMode": "online",
        "isAccessibleForFree": true,
        "inLanguage": locale === 'zh' ? "zh-CN" : "en-US",
        "timeRequired": `PT${estimatedDuration}H`,
        "teaches": courseTitle,
        "about": {
          "@type": "Thing",
          "name": categoryName.replace(/-/g, ' ')
        },
        "hasCourseInstance": {
          "@type": "CourseInstance",
          "courseMode": "online",
          "courseSchedule": {
            "@type": "Schedule",
            "repeatFrequency": "daily"
          }
        }
      },
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": "https://cs61b.com"
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": locale === 'zh' ? "课程" : "Courses",
            "item": `https://cs61b.com/${locale}/courses`
          },
          {
            "@type": "ListItem",
            "position": 3,
            "name": categoryName.replace(/-/g, ' '),
            "item": `https://cs61b.com/${locale}/courses/${categoryName}`
          },
          {
            "@type": "ListItem",
            "position": 4,
            "name": courseTitle,
            "item": courseUrl
          }
        ]
      },
      {
        "@type": "EducationalOrganization",
        "name": "CS61B & Beyond",
        "url": "https://cs61b.com",
        "description": "Platform offering free computer science courses from top universities including UC Berkeley, MIT, Stanford, and Princeton",
        "knowsAbout": [
          "Computer Science",
          "Data Structures",
          "Algorithms",
          "Machine Learning",
          "Computer Architecture",
          "Operating Systems",
          "Computer Networks",
          "Database Systems"
        ],
        "address": {
          "@type": "PostalAddress",
          "addressCountry": "US"
        }
      }
    ]
  };

  return (
    <>
      <StructuredData data={structuredData} />
      <MDXRenderer
        content={htmlContent}
        locale={locale}
        isFallback={courseContent.isFallback}
      />
    </>
  );
}