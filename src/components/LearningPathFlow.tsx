'use client';

import { useLocale } from 'next-intl';

export default function LearningPathFlow() {
  const locale = useLocale();

  const steps = [
    {
      title: locale === 'zh' ? '基础工具' : 'Essential Tools',
    },
    {
      title: locale === 'zh' ? '数学基础' : 'Mathematical Foundations',
    },
    {
      title: locale === 'zh' ? '编程基础' : 'Programming Fundamentals',
    },
    {
      title: locale === 'zh' ? '计算机系统' : 'Computer Systems',
    },
    {
      title: locale === 'zh' ? '算法与理论' : 'Algorithms & Theory',
    },
    {
      title: locale === 'zh' ? '机器学习与AI' : 'Machine Learning & AI',
    },
    {
      title: locale === 'zh' ? '专业领域' : 'Specialized Topics',
    }
  ];

  return (
    <div className="flex flex-wrap justify-center items-center gap-3 max-w-4xl mx-auto">
      {steps.map((step, index) => (
        <div key={index} className="flex items-center">
          <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white px-3 py-2 rounded-lg font-medium text-sm">
            {step.title}
          </div>
          {index < steps.length - 1 && (
            <div className="text-gray-400 mx-1">→</div>
          )}
        </div>
      ))}
    </div>
  );
}