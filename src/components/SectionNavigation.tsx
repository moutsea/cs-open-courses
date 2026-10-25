'use client'

import { memo } from 'react';

interface SectionNavigationProps {
  sections: Array<{
    title: string;
  }>;
}

const SectionNavigation = memo(function SectionNavigation({ sections }: SectionNavigationProps) {
  const handleSectionClick = (index: number) => {
    const element = document.getElementById(`section-${index}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="flex flex-wrap justify-center items-center gap-4">
      {sections.map((section, index) => (
        <div key={index} className="flex items-center">
          <button
            onClick={() => handleSectionClick(index)}
            className="bg-cyan-400 hover:bg-cyan-300 text-slate-950 px-4 py-2 rounded-lg font-medium cursor-pointer transition-colors duration-200 hover:shadow-md"
          >
            {section.title}
          </button>
          {index < sections.length - 1 && (
            <div className="text-white/60 mx-2">→</div>
          )}
        </div>
      ))}
    </div>
  );
});

export default SectionNavigation;