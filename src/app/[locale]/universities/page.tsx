import UniversitiesPage from '@/components/UniversitiesPage'

export default async function LocaleUniversitiesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  return UniversitiesPage({ locale })
}