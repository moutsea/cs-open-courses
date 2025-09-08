import Link from 'next/link';
import { Category } from '@/lib/courseParser';
import { getChineseName } from '@/lib/categoryMapping';

interface CategoryCardProps {
  category: Category;
}

export default function CategoryCard({ category }: CategoryCardProps) {
  const courseCount = category.courses.length;
  
  return (
    <Link href={`/category/${category.slug}`}>
      <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 cursor-pointer">
        <h2 className="text-xl font-bold text-gray-800 mb-2">
          {getChineseName(category.slug)}
        </h2>
        <p className="text-gray-600 mb-4">
          {courseCount} {courseCount === 1 ? 'course' : 'courses'}
        </p>
        {category.subcategories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {category.subcategories.slice(0, 3).map((subcategory) => (
              <span 
                key={subcategory.slug}
                className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
              >
                {subcategory.name}
              </span>
            ))}
            {category.subcategories.length > 3 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-sm rounded-full">
                +{category.subcategories.length - 3} more
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}