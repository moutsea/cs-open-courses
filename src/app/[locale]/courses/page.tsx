import Header from '@/components/Header';
import CoursesContent from '@/components/CoursesContent';
import { ImmersivePage, ImmersiveSection } from '@/components/layout/ImmersivePage';
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
    const totalCourses = categories.reduce((sum, cat) => sum + cat.courses.length, 0);
    const totalSubcategories = categories.reduce((sum, cat) => sum + cat.subcategories.length, 0);
    const featuredCategories = [...categories]
        .sort((a, b) => b.courses.length - a.courses.length)
        .slice(0, 3);
    const formatCategoryName = (slug: string) =>
        locale === 'zh'
            ? getChineseName(slug)
            : slug.replace(/-/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

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
        "numberOfItems": totalCourses,
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
            <ImmersivePage>
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
                />

                <ImmersiveSection className="py-16 text-white">
                    <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid gap-10 lg:grid-cols-[minmax(0,3fr)_2fr] items-center">
                            <div className="space-y-6">
                                <div className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-6 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-white/70">
                                    {locale === 'zh' ? '课程目录' : 'Course Catalog'}
                                </div>
                                <div>
                                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
                                        {locale === 'zh' ? '所有课程' : 'All Courses'}
                                    </h1>
                                    <p className="mt-4 text-lg text-white/70 max-w-2xl">
                                        {locale === 'zh'
                                            ? '汇集伯克利、MIT、斯坦福等顶尖大学的开源课程，帮助你构建系统的计算机科学知识图谱。'
                                            : 'Curated open courses from Berkeley, MIT, Stanford and more to help you build a complete computer science foundation.'}
                                    </p>
                                </div>
                                <div className="grid gap-4 sm:grid-cols-3">
                                    <div className="rounded-3xl border border-white/15 bg-white/5 p-5">
                                        <div className="text-3xl font-bold text-white">{totalCourses}</div>
                                        <p className="text-xs uppercase tracking-[0.35em] text-white/60">
                                            {locale === 'zh' ? '课程' : 'Courses'}
                                        </p>
                                    </div>
                                    <div className="rounded-3xl border border-white/15 bg-white/5 p-5">
                                        <div className="text-3xl font-bold text-white">{categories.length}</div>
                                        <p className="text-xs uppercase tracking-[0.35em] text-white/60">
                                            {locale === 'zh' ? '类别' : 'Categories'}
                                        </p>
                                    </div>
                                    <div className="rounded-3xl border border-white/15 bg-white/5 p-5">
                                        <div className="text-3xl font-bold text-white">{totalSubcategories}</div>
                                        <p className="text-xs uppercase tracking-[0.35em] text-white/60">
                                            {locale === 'zh' ? '子主题' : 'Subtopics'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl shadow-[0_35px_120px_rgba(2,6,23,0.55)]">
                                <p className="text-sm font-semibold uppercase tracking-[0.35em] text-white/60 mb-4">
                                    {locale === 'zh' ? '热门方向' : 'Popular Tracks'}
                                </p>
                                <div className="space-y-4">
                                    {featuredCategories.map((category) => (
                                        <div
                                            key={category.slug}
                                            className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                                        >
                                            <div>
                                                <p className="text-sm text-white/60 uppercase tracking-[0.3em]">
                                                    {locale === 'zh' ? '方向' : 'Track'}
                                                </p>
                                                <p className="text-lg font-semibold text-white">
                                                    {formatCategoryName(category.slug)}
                                                </p>
                                            </div>
                                            <span className="text-sm font-semibold text-white/80">
                                                {category.courses.length} {locale === 'zh' ? '门课' : 'courses'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </ImmersiveSection>

                <ImmersiveSection className="py-12">
                    <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="rounded-[36px] border border-white/10 bg-white/5 p-6 sm:p-10 backdrop-blur-xl shadow-[0_40px_120px_rgba(2,6,23,0.45)] text-white">
                            <div className="flex flex-col gap-6 pb-10 border-b border-white/10 mb-10">
                                <div>
                                    <p className="text-sm uppercase tracking-[0.4em] text-white/60">
                                        {locale === 'zh' ? '选择方向' : 'Choose A Focus'}
                                    </p>
                                    <h2 className="text-3xl font-semibold mt-2">
                                        {locale === 'zh' ? '探索完整课程目录' : 'Explore the complete catalog'}
                                    </h2>
                                </div>
                                <p className="text-white/70 max-w-3xl">
                                    {locale === 'zh'
                                        ? '根据类别与子类别筛选课程，快速锁定下一门学习内容。'
                                        : 'Filter by category and subtopic to quickly find the next course you want to take.'}
                                </p>
                            </div>

                            <CoursesContent categories={categories} locale={locale} variant="immersive" />
                        </div>
                    </div>
                </ImmersiveSection>
            </ImmersivePage>
        </div>
    );
}
