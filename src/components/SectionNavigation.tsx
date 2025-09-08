'use client'

interface SectionNavigationProps {
  sections: Array<{
    title: string;
  }>;
  locale: string;
}

export default function SectionNavigation({ sections, locale }: SectionNavigationProps) {
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
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium cursor-pointer transition-colors duration-200 hover:shadow-md"
          >
            {section.title}
          </button>
          {index < sections.length - 1 && (
            <div className="text-gray-400 mx-2">→</div>
          )}
        </div>
      ))}
    </div>
  );
}