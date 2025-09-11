import TutorialContent from '../../../components/TutorialContent';
import { Metadata } from 'next';

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
  return <TutorialContent locale={locale} />;
}