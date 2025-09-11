'use client';

import Link from 'next/link';

interface TutorialTopic {
  name: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  duration: string;
  description: string;
}

interface TutorialTopicCardProps {
  topic: TutorialTopic;
  locale: string;
}

// 课程映射 - 基于课程名称映射到课程ID
const courseMapping: Record<string, string> = {
  // Essential Tools
  "Command Line & Shell": "essential-tools-Vim",
  "Git & Version Control": "essential-tools-Git", 
  "IDE & Development Environment": "essential-tools-workflow",
  "Docker & Containerization": "essential-tools-Docker",
  
  // Mathematical Foundations
  "Calculus & Linear Algebra": "mathematics-basics-MITmaths",
  "Discrete Mathematics": "advanced-mathematics-CS70",
  "Probability Theory": "advanced-mathematics-CS126",
  "Information Theory": "mathematics-basics-information",
  
  // Programming Fundamentals
  "Introduction to Programming": "programming-introduction-MIT-Missing-Semester",
  "Data Structures & Algorithms": "data-structures-algorithms-CS61B",
  "Software Engineering": "software-engineering-CS169",
  "Advanced Programming": "computer-systems-basics-CS110",
  
  // Computer Systems
  "Computer Architecture": "computer-architecture-N2T",
  "Operating Systems": "operating-systems-MIT6.S081",
  "Computer Networks": "computer-networks-CS144",
  "Database Systems": "database-systems-15445",
  
  // Algorithms & Theory
  "Algorithm Design": "data-structures-algorithms-CS170",
  "Theory of Computation": "advanced-mathematics-6.042J",
  "Cryptography": "system-security-CS161",
  "Convex Optimization": "advanced-mathematics-convex",
  
  // Machine Learning & AI
  "Machine Learning Fundamentals": "machine-learning-CS229",
  "Deep Learning": "deep-learning-CS231",
  "Reinforcement Learning": "deep-learning-CS285",
  "AI Systems": "machine-learning-systems-CMU10-414",
  
  // Specialized Topics
  "Computer Graphics": "computer-graphics-CS148",
  "Parallel Computing": "parallel-distributed-systems-CS149",
  "Distributed Systems": "parallel-distributed-systems-MIT6.824",
  "System Security": "system-security-CS161",
  
  // 中文映射
  "命令行与Shell": "essential-tools-Vim",
  "Git与版本控制": "essential-tools-Git",
  "IDE与开发环境": "essential-tools-workflow", 
  "Docker与容器化": "essential-tools-Docker",
  "微积分与线性代数": "mathematics-basics-MITmaths",
  "离散数学": "advanced-mathematics-CS70",
  "概率论": "advanced-mathematics-CS126",
  "信息论": "mathematics-basics-information",
  "编程入门": "programming-introduction-MIT-Missing-Semester",
  "数据结构与算法": "data-structures-algorithms-CS61B",
  "软件工程": "software-engineering-CS169",
  "高级编程": "computer-systems-basics-CS110",
  "计算机体系结构": "computer-architecture-N2T",
  "操作系统": "operating-systems-MIT6.S081",
  "计算机网络": "computer-networks-CS144",
  "数据库系统": "database-systems-15445",
  "算法设计": "data-structures-algorithms-CS170",
  "计算理论": "advanced-mathematics-6.042J",
  "密码学": "system-security-CS161",
  "凸优化": "advanced-mathematics-convex",
  "机器学习基础": "machine-learning-CS229",
  "深度学习": "deep-learning-CS231",
  "强化学习": "deep-learning-CS285",
  "AI系统": "machine-learning-systems-CMU10-414",
  "计算机图形学": "computer-graphics-CS148",
  "并行计算": "parallel-distributed-systems-CS149",
  "分布式系统": "parallel-distributed-systems-MIT6.824",
  "系统安全": "system-security-CS161"
};

export default function TutorialTopicCard({ topic, locale }: TutorialTopicCardProps) {
  
  const getLevelColor = (level: string) => {
    switch (level) {
      case "Beginner": return 'bg-green-100 text-green-800';
      case "Intermediate": return 'bg-yellow-100 text-yellow-800';
      case "Advanced": return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const levelTranslations = {
    en: { Beginner: "Beginner", Intermediate: "Intermediate", Advanced: "Advanced" },
    zh: { Beginner: "初级", Intermediate: "中级", Advanced: "高级" }
  };

  const hoursText = locale === 'zh' ? '小时' : 'hours';
  
  // 查找相关的课程ID
  const courseId = courseMapping[topic.name];
  const hasRelatedCourse = !!courseId;
  
  return (
    <div className={`border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-all duration-300 ${
      hasRelatedCourse ? 'hover:shadow-md cursor-pointer group' : ''
    }`}>
      {hasRelatedCourse ? (
        <Link href={`/${locale}/course/${courseId}`} className="block">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
              {topic.name}
            </h3>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getLevelColor(topic.level)}`}>
              {levelTranslations[locale as keyof typeof levelTranslations][topic.level as keyof typeof levelTranslations.en]}
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-2">{topic.description}</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center text-sm text-gray-500">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {topic.duration} {hoursText}
            </div>
            <div className="flex items-center text-blue-600 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </Link>
      ) : (
        <>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-gray-900">{topic.name}</h3>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getLevelColor(topic.level)}`}>
              {levelTranslations[locale as keyof typeof levelTranslations][topic.level as keyof typeof levelTranslations.en]}
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-2">{topic.description}</p>
          <div className="flex items-center text-sm text-gray-500">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {topic.duration} {hoursText}
          </div>
        </>
      )}
    </div>
  );
}