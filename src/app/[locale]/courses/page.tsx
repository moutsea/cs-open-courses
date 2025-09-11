import Header from '@/components/Header';
import CoursesContent from '@/components/CoursesContent';
import { getCategoriesForLocale } from '@/lib/getServerData';
import { Metadata } from 'next';
import { getChineseName } from '@/lib/categoryMapping';

export async function generateStaticParams() {
  return [
    { locale: 'en' },
    { locale: 'zh' }
  ];
}

export const metadata: Metadata = {
  title: 'All Courses',
  description: 'Browse all computer science open courses from Berkeley, MIT, Stanford. Find CS61A, CS61B, CS189, CS224N, Games101 and more top programming courses.'
}

export default async function CoursesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const categories = await getCategoriesForLocale(locale);
  
  // 添加左侧边栏滚动条样式
  const style = `
    .custom-scrollbar::-webkit-scrollbar {
      width: 6px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: #f1f1f1;
      border-radius: 3px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: #c1c1c1;
      border-radius: 3px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
      background: #a8a8a8;
    }
  `;
  
  // 生成结构化数据以增强 SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": locale === 'zh' ? "计算机科学课程" : "Computer Science Courses",
    "description": locale === 'zh' 
      ? "来自顶尖大学的计算机科学开放课程集合"
      : "Collection of computer science open courses from top universities",
    "numberOfItems": categories.reduce((sum, cat) => sum + cat.courses.length, 0),
    "itemListElement": categories.flatMap((category, catIndex) => [
      {
        "@type": "ListItem",
        "position": catIndex + 1,
        "item": {
          "@type": "Course",
          "name": getChineseName(category.slug),
          "description": `${category.courses.length} ${locale === 'zh' ? '门课程' : 'courses'} in ${getChineseName(category.slug)}`,
          "provider": {
            "@type": "Organization",
            "name": "CS Courses Platform"
          }
        }
      }
    ])
  };

  return (
    <div className="min-h-screen flex flex-col">
      <style>{style}</style>
      <Header locale={locale} />
      <main className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">
          {locale === 'zh' ? '所有课程' : 'All Courses'}
        </h1>
        
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        
        <CoursesContent categories={categories} locale={locale} />
      </main>
    </div>
  );
}