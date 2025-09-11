'use client';

import Header from './Header';
import Footer from './Footer';

interface PageLayoutProps {
  children: React.ReactNode;
  locale: string;
}

export default function PageLayout({ children, locale }: PageLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header locale={locale} />
      <main className="flex-grow">
        {children}
      </main>
      <Footer locale={locale} />
    </div>
  );
}