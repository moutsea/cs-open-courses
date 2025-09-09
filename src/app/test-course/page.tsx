import Link from 'next/link';
import { getAllCoursePaths } from '@/lib/courseUtils';

export default function TestCourseLinks() {
  // This would be populated with actual data from getAllCoursePaths
  const testCourses = [
    { path: ['编程入门', 'Java', 'MIT 6.092'], title: 'MIT 6.092: Introduction To Programming In Java', locale: 'en' },
    { path: ['编程入门', 'Java', 'MIT 6.092'], title: 'MIT 6.092: Java 编程入门', locale: 'zh' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Course Page Test Links</h1>
        
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Test Course Pages</h2>
          <div className="space-y-4">
            {testCourses.map((course, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium mb-2">{course.title}</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Path: /{course.path.join('/')} ({course.locale})
                </p>
                <Link 
                  href={`/${course.locale}/course/${course.path.join('/')}`}
                  className="inline-block bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  View Course
                </Link>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-medium text-yellow-800 mb-2">Note</h3>
          <p className="text-yellow-700 text-sm">
            These test links will help verify that the course page routing and MDX rendering are working correctly.
            The course pages should display the markdown content with proper styling and language switching.
          </p>
        </div>
      </div>
    </div>
  );
}