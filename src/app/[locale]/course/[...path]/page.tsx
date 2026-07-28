import { Suspense } from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import MDXRenderer from '@/components/MDXRenderer';
import { markdownToHTML, extractTitleFromMarkdown } from '@/lib/markdownProcessor';
import { getCourseContent } from '@/lib/courseUtils';
import { getChineseName, getEnglishSlug } from '@/lib/categoryMapping';
import { getAllCourses } from '@/lib/getServerData';
import StructuredData from '@/components/StructuredData';
import { absoluteUrl, INDEXABLE_ROBOTS, localizedPath, pageAlternates, SITE_NAME, socialImages } from '@/lib/seo';

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
    notFound();
  }

  let title = extractTitleFromMarkdown(courseContent.content);
  if (locale === 'zh') {
    title = `${title} (中文)`;
  }

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
  const categoryLabel = getChineseName(categoryName);

  const description = locale === 'zh'
    ? `免费学习 ${title}，查看${categoryLabel}课程介绍、学习资料与相关资源，系统掌握核心概念与实践方法。`
    : `Explore ${title}, a free ${categoryName.replace(/-/g, ' ')} learning resource with course overviews, materials, and guidance for ${categoryDescription}.`;
  const pathname = `/course/${coursePath}`;
  const url = absoluteUrl(localizedPath(locale, pathname));

  return {
    title,
    description,
    robots: INDEXABLE_ROBOTS,
    alternates: pageAlternates(locale, pathname),
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
      title,
      description,
      url,
      siteName: SITE_NAME,
      type: 'article',
      locale: locale === 'zh' ? 'zh_CN' : 'en_US',
      images: socialImages()
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [absoluteUrl('/og.jpg')]
    }
  };
}

export default async function CoursePage({ params }: CoursePageProps) {
  const { locale, path } = await params;
  const courseContent = await getCourseContent(path, locale);

  if (!courseContent.exists) {
    notFound();
  }

  return (
    <Suspense fallback={<div className="text-center py-8">Loading course...</div>}>
      <CourseRenderer locale={locale} path={path} courseContent={courseContent} />
    </Suspense>
  );
}

async function CourseRenderer({
  locale,
  path,
  courseContent
}: {
  locale: string;
  path: string[];
  courseContent: Awaited<ReturnType<typeof getCourseContent>>;
}) {
  // Convert markdown to HTML
  const htmlContent = await markdownToHTML(courseContent.content);

  // Generate structured data
  const courseUrl = absoluteUrl(localizedPath(locale, `/course/${path.join('/')}`));
  const courseTitle = extractTitleFromMarkdown(courseContent.content);
  const categoryName = path[0] || 'computer science';
  const courseSlug = path[path.length - 1]?.toLowerCase() || '';
  const isCS61B = courseSlug === 'cs61b';

  const providerInfo = isCS61B
    ? {
      "@type": "CollegeOrUniversity",
      "name": "UC Berkeley EECS",
      "sameAs": "https://eecs.berkeley.edu",
      "url": "https://www.berkeley.edu/"
    }
    : {
      "@type": "EducationalOrganization",
      "name": SITE_NAME,
      "url": absoluteUrl('/'),
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
          : locale === 'zh'
            ? `${courseTitle} 的免费课程介绍、学习资料与学习指南。`
            : `Free course overview, learning materials, and study guidance for ${courseTitle}.`,
        "url": courseUrl,
        "provider": providerInfo,
        "educationalLevel": "Higher Education",
        "courseMode": "online",
        "isAccessibleForFree": true,
        "inLanguage": locale === 'zh' ? "zh-CN" : "en-US",
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
        "coursePrerequisites": isCS61B ? "CS61A or equivalent introductory programming experience" : undefined
      },
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": locale === 'zh' ? "首页" : "Home",
            "item": absoluteUrl(localizedPath(locale))
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": locale === 'zh' ? "课程" : "Courses",
            "item": absoluteUrl(localizedPath(locale, '/courses'))
          },
          {
            "@type": "ListItem",
            "position": 3,
            "name": courseTitle,
            "item": courseUrl
          }
        ]
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
        title={courseTitle}
        coursePath={path}
        categorySlug={path[0]}
        subcategorySlug={path[1]}
        hasEnglishVersion={courseContent.hasEnglishVersion}
        hasChineseVersion={courseContent.hasChineseVersion}
      />
    </>
  );
}
