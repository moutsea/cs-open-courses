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

        // Remove file extension if present
        if (lastPart && lastPart.endsWith('.md')) {
          pathWithoutLocale[pathWithoutLocale.length - 1] = lastPart.replace('.md', '');
        }

        // Convert directory parts to English slugs
        const urlPath = pathWithoutLocale.map((segment, index) => {
          if (index < pathWithoutLocale.length - 1) {
            // Convert Chinese directory names to English slugs
            return getEnglishSlug(segment);
          }
          // For file names, preserve original name (including spaces)
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
  const description = `Start learning ${title} today. A comprehensive ${categoryName.replace(/-/g, ' ')} course from top universities like Berkeley, MIT, and Stanford. Master ${categoryDescription} with free resources.`;

  const url = locale === 'en'
    ? `${process.env.NEXT_PUBLIC_SITE_URL}/course/${coursePath}`
    : `${process.env.NEXT_PUBLIC_SITE_URL}/${locale}/course/${coursePath}`;

  return {
    title: title,
    description: description,
    alternates: {
      canonical: `https://www.cs61bbeyond.com/course/${coursePath}`,
      languages: {
        'en': `https://www.cs61bbeyond.com/course/${coursePath}`,
        'zh': `https://www.cs61bbeyond.com/zh/course/${coursePath}`,
      },
    },
    keywords: [
      title,
      `${title} course`,
      `learn ${title}`,
      categoryName.replace(/-/g, ' '),
      'computer science',
      'programming',
      'online course',
      'free education',
      'self-taught',
      ...path
    ],
    openGraph: {
      title: `${title}`,
      description: description,
      url: url,
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
      title: `${title}`,
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
  const courseUrl = locale === 'en'
    ? `${process.env.NEXT_PUBLIC_SITE_URL}/course/${path.join('/')}`
    : `${process.env.NEXT_PUBLIC_SITE_URL}/${locale}/course/${path.join('/')}`;
  const courseTitle = extractTitleFromMarkdown(courseContent.content);
  const categoryName = path[0] || 'computer science';
  const courseSlug = path[path.length - 1]?.toLowerCase() || '';
  const isCS61B = courseSlug === 'cs61b';

  // Estimate course duration based on content length
  const estimatedDuration = Math.max(1, Math.ceil(courseContent.content.length / 5000));

  const providerInfo = isCS61B
    ? {
      "@type": "CollegeOrUniversity",
      "name": "UC Berkeley EECS",
      "sameAs": "https://eecs.berkeley.edu",
      "url": "https://www.berkeley.edu/"
    }
    : {
      "@type": "EducationalOrganization",
      "name": "CS61B & Beyond",
      "url": process.env.NEXT_PUBLIC_SITE_URL!,
      "description": "Free computer science courses from top universities"
    };

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Course",
        "name": courseTitle,
        "description": isCS61B
          ? "Comprehensive guide to UC Berkeley CS61B, covering Java, data structures, and project-based learning."
          : `Learn ${courseTitle} - ${categoryName.replace(/-/g, ' ')} course from top universities including Berkeley, MIT, and Stanford.`,
        "url": courseUrl,
        "provider": providerInfo,
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
        "audience": isCS61B
          ? {
            "@type": "EducationalAudience",
            "educationalRole": "Undergraduate",
            "description": "Students preparing for Berkeley CS61B or equivalent data structures coursework."
          }
          : undefined,
        "coursePrerequisites": isCS61B ? "CS61A or equivalent introductory programming experience" : undefined,
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
            "item": process.env.NEXT_PUBLIC_SITE_URL!
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": locale === 'zh' ? "课程" : "Courses",
            "item": locale === 'en' ? `${process.env.NEXT_PUBLIC_SITE_URL}/courses` : `${process.env.NEXT_PUBLIC_SITE_URL}/${locale}/courses`
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

  if (isCS61B) {
    const faqItems = locale === 'zh'
      ? [
        {
          q: 'CS61B 难度如何？',
          a: 'CS61B 是伯克利的中级课程，要求扎实的编程基础和大量项目实践，主要学习 Java 与数据结构。'
        },
        {
          q: 'CS61B 包含哪些项目？',
          a: '课程包含世界地图、Gitlet 等项目，帮助掌握树、图、哈希等数据结构在工程中的应用。'
        },
        {
          q: '如何准备 CS61B？',
          a: '建议先完成 CS61A 或同等级别的编程课程，并熟悉 Java 语法与面向对象思想。'
        }
      ]
      : [
        {
          q: 'How hard is Berkeley CS61B?',
          a: 'CS61B is an intermediate Berkeley course that assumes strong programming skills and emphasizes Java, algorithms, and rigorous projects.'
        },
        {
          q: 'What projects are in CS61B?',
          a: 'Expect multi-week projects like Build Your Own Gitlet and world maps that apply trees, graphs, and hashing in production-style codebases.'
        },
        {
          q: 'How should I prepare for CS61B?',
          a: 'Complete CS61A or an equivalent intro class, get comfortable with Java tooling, and review recursion plus basic data structures beforehand.'
        }
      ];

    type GraphItem = typeof structuredData["@graph"][number] | {
      "@type": "FAQPage";
      mainEntity: Array<{
        "@type": "Question";
        name: string;
        acceptedAnswer: {
          "@type": "Answer";
          text: string;
        };
      }>;
    };

    const faqNode: GraphItem = {
      "@type": "FAQPage",
      mainEntity: faqItems.map(item => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.a
        }
      }))
    };
    (structuredData["@graph"] as GraphItem[]).push(faqNode)
  }

  return (
    <>
      <StructuredData data={structuredData} />
      <MDXRenderer
        content={htmlContent}
        locale={locale}
        isFallback={courseContent.isFallback}
        title={courseTitle}
        categorySlug={path[0]}
        subcategorySlug={path[1]}
        hasEnglishVersion={courseContent.hasEnglishVersion}
        hasChineseVersion={courseContent.hasChineseVersion}
      />
    </>
  );
}
