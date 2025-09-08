import TutorialContent from '../../../components/TutorialContent';

export default async function TutorialPage({params}: {params: Promise<{locale: string}>}) {
  const { locale } = await params;
  return <TutorialContent locale={locale} />;
}