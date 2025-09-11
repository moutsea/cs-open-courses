import UniversitiesPage from '@/components/UniversitiesPage'
import { Metadata } from 'next'

// app/universities/page.tsx
export const metadata: Metadata = {
  title: 'Top Universities & CS Programs',
  description: 'Comprehensive directory of world-class universities offering computer science open courses. Explore programs from Berkeley, MIT, Stanford, Carnegie Mellon and more top institutions.',
  
  openGraph: {
    title: 'Top Universities & CS Programs - CS61B & Beyond',
    description: 'Discover the best computer science programs from leading universities worldwide. Compare courses, faculty, and learning resources.',
  },
  
  twitter: {
    title: 'Top Universities & CS Programs',
    description: 'Directory of world-class CS programs and open courses'
  }
}


export default async function LocaleUniversitiesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  return UniversitiesPage({ locale })
}