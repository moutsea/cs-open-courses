import TutorialContent from '../../../components/TutorialContent';
import { Metadata } from 'next';
import StructuredData from '../../../components/StructuredData';

export const metadata: Metadata = {
  title: 'CS Learning Path for Beginners',
  description: 'Complete beginner\'s guide to computer science learning. Step-by-step roadmap from CS61A basics to advanced topics like algorithms, machine learning, and systems programming.',
  
  openGraph: {
    title: 'CS Learning Path for Beginners - CS61B & Beyond',
    description: 'Start your computer science journey with our curated learning paths. From Python basics to advanced CS topics, designed for complete beginners.',
  },
  
  twitter: {
    title: 'CS Learning Path for Beginners',
    description: 'Complete roadmap to learn computer science from scratch'
  }
}

export default async function TutorialPage({params}: {params: Promise<{locale: string}>}) {
  const { locale } = await params;
  
  const tutorialStructuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CreativeWork",
        "name": locale === 'zh' ? '计算机科学学习路径' : 'CS Learning Path for Beginners',
        "description": locale === 'zh' 
          ? '完整的计算机科学初学者指南。从CS61A基础知识到算法、机器学习和系统编程等高级主题的分步路线图。'
          : 'Complete beginner\'s guide to computer science learning. Step-by-step roadmap from CS61A basics to advanced topics like algorithms, machine learning, and systems programming.',
        "url": `https://cs61b.com/${locale}/tutorial`,
        "inLanguage": locale === 'zh' ? "zh-CN" : "en-US",
        "educationalLevel": "Beginner",
        "learningResourceType": "Learning Path",
        "teaches": [
          "Computer Science Fundamentals",
          "Programming",
          "Data Structures",
          "Algorithms",
          "Machine Learning",
          "Computer Systems",
          "Operating Systems",
          "Computer Networks"
        ],
        "provider": {
          "@type": "EducationalOrganization",
          "name": "CS61B & Beyond",
          "url": "https://cs61b.com",
          "description": "Free computer science courses from top universities"
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
            "name": locale === 'zh' ? "学习路径" : "Learning Path",
            "item": `https://cs61b.com/${locale}/tutorial`
          }
        ]
      }
    ]
  };

  return (
    <>
      <StructuredData data={tutorialStructuredData} />
      <TutorialContent locale={locale} />
    </>
  );
}