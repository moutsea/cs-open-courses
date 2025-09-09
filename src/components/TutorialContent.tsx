import { getTranslations } from 'next-intl/server';
import Header from './Header';
import Footer from './Footer';
import SectionNavigation from './SectionNavigation';
import Link from 'next/link';
import TutorialTopicCard from './TutorialTopicCard';

interface TutorialTopic {
  name: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  duration: string;
  description: string;
}

interface TutorialSection {
  title: string;
  description: string;
  icon: string;
  topics: TutorialTopic[];
}

const tutorialSections: TutorialSection[] = [
  {
    title: "Essential Tools",
    description: "Master the fundamental tools that every computer science student needs",
    icon: "🛠️",
    topics: [
      { name: "Command Line & Shell", level: "Beginner" as const, duration: "4 hours", description: "Learn Vim, command line basics, and shell scripting" },
      { name: "Git & Version Control", level: "Beginner" as const, duration: "3 hours", description: "Master Git for project management and collaboration" },
      { name: "IDE & Development Environment", level: "Beginner" as const, duration: "2 hours", description: "Set up VS Code, debugging tools, and development workflow" },
      { name: "Docker & Containerization", level: "Intermediate" as const, duration: "3 hours", description: "Learn container technology for modern development" }
    ]
  },
  {
    title: "Mathematical Foundations",
    description: "Build strong mathematical background for computer science",
    icon: "📊",
    topics: [
      { name: "Calculus & Linear Algebra", level: "Beginner" as const, duration: "20 hours", description: "Essential math for algorithms and machine learning" },
      { name: "Discrete Mathematics", level: "Intermediate" as const, duration: "15 hours", description: "Logic, set theory, graph theory, and combinatorics" },
      { name: "Probability Theory", level: "Intermediate" as const, duration: "12 hours", description: "Foundation for machine learning and algorithms" },
      { name: "Information Theory", level: "Advanced" as const, duration: "8 hours", description: "Entropy, coding, and communication theory" }
    ]
  },
  {
    title: "Programming Fundamentals",
    description: "Learn programming from scratch with multiple languages",
    icon: "💻",
    topics: [
      { name: "Introduction to Programming", level: "Beginner" as const, duration: "20 hours", description: "Start with Python or C - Harvard CS50, MIT 6.100L" },
      { name: "Data Structures & Algorithms", level: "Intermediate" as const, duration: "25 hours", description: "UCB CS61B, Princeton Algorithms - Core CS foundation" },
      { name: "Software Engineering", level: "Intermediate" as const, duration: "15 hours", description: "MIT 6.031, UCB CS169 - Write production-quality code" },
      { name: "Advanced Programming", level: "Advanced" as const, duration: "20 hours", description: "Stanford CS106B/X, MIT 6.824 - Systems programming" }
    ]
  },
  {
    title: "Computer Systems",
    description: "Understand how computers work from hardware to software",
    icon: "🔧",
    topics: [
      { name: "Computer Architecture", level: "Intermediate" as const, duration: "15 hours", description: "Nand2Tetris, UCB CS61C - Build a computer from scratch" },
      { name: "Operating Systems", level: "Advanced" as const, duration: "20 hours", description: "MIT 6.S081, UCB CS162 - Write your own OS kernel" },
      { name: "Computer Networks", level: "Intermediate" as const, duration: "15 hours", description: "Stanford CS144 - Implement TCP/IP protocol stack" },
      { name: "Database Systems", level: "Intermediate" as const, duration: "15 hours", description: "CMU 15-445, UCB CS186 - Build your own database" }
    ]
  },
  {
    title: "Algorithms & Theory",
    description: "Master the theoretical foundations of computer science",
    icon: "🧮",
    topics: [
      { name: "Algorithm Design", level: "Intermediate" as const, duration: "20 hours", description: "UCB CS170, MIT 6.046 - Advanced algorithm techniques" },
      { name: "Theory of Computation", level: "Advanced" as const, duration: "15 hours", description: "MIT 6.045J - Automata, computability, complexity" },
      { name: "Cryptography", level: "Advanced" as const, duration: "12 hours", description: "Stanford CS255 - Mathematical foundations of security" },
      { name: "Convex Optimization", level: "Advanced" as const, duration: "10 hours", description: "Stanford EE364A - Optimization in ML and algorithms" }
    ]
  },
  {
    title: "Machine Learning & AI",
    description: "Explore the fascinating world of artificial intelligence",
    icon: "🤖",
    topics: [
      { name: "Machine Learning Fundamentals", level: "Intermediate" as const, duration: "25 hours", description: "Andrew Ng ML, Stanford CS229 - Core ML concepts" },
      { name: "Deep Learning", level: "Advanced" as const, duration: "30 hours", description: "Stanford CS231n, CS224n - CNNs, RNNs, Transformers" },
      { name: "Reinforcement Learning", level: "Advanced" as const, duration: "20 hours", description: "UCB CS285 - Deep RL and policy optimization" },
      { name: "AI Systems", level: "Advanced" as const, duration: "15 hours", description: "CMU 10-414 - Deep learning systems and optimization" }
    ]
  },
  {
    title: "Specialized Topics",
    description: "Explore advanced and specialized areas of computer science",
    icon: "🚀",
    topics: [
      { name: "Computer Graphics", level: "Advanced" as const, duration: "20 hours", description: "Stanford CS148, Games101 - Rendering and visualization" },
      { name: "Parallel Computing", level: "Advanced" as const, duration: "15 hours", description: "CMU 15-418/Stanford CS149 - GPU programming and CUDA" },
      { name: "Distributed Systems", level: "Advanced" as const, duration: "20 hours", description: "MIT 6.824 - Consensus, replication, fault tolerance" },
      { name: "System Security", level: "Advanced" as const, duration: "18 hours", description: "UCB CS161, SU SEED Labs - Security and cryptography" }
    ]
  }
];

export default async function TutorialContent({ locale }: { locale: string }) {
  const t = await getTranslations({locale, namespace: 'tutorial'});
  
  // 翻译映射函数
  const getTranslatedContent = () => {
    if (locale === 'zh') {
      return {
        sections: [
          {
            title: "基础工具",
            description: "掌握每个计算机科学学生都需要的基础工具",
            icon: "🛠️",
            topics: [
              { name: "命令行与Shell", level: "Beginner" as const, duration: "4 hours", description: "学习Vim、命令行基础和Shell脚本编程" },
              { name: "Git与版本控制", level: "Beginner" as const, duration: "3 hours", description: "掌握Git进行项目管理和协作开发" },
              { name: "IDE与开发环境", level: "Beginner" as const, duration: "2 hours", description: "设置VS Code、调试工具和开发工作流" },
              { name: "Docker与容器化", level: "Intermediate" as const, duration: "3 hours", description: "学习现代开发中的容器技术" }
            ]
          },
          {
            title: "数学基础",
            description: "为计算机科学打下坚实的数学基础",
            icon: "📊",
            topics: [
              { name: "微积分与线性代数", level: "Beginner" as const, duration: "20 hours", description: "算法和机器学习的基础数学" },
              { name: "离散数学", level: "Intermediate" as const, duration: "15 hours", description: "逻辑、集合论、图论和组合数学" },
              { name: "概率论", level: "Intermediate" as const, duration: "12 hours", description: "机器学习和算法的基础" },
              { name: "信息论", level: "Advanced" as const, duration: "8 hours", description: "熵、编码和通信理论" }
            ]
          },
          {
            title: "编程基础",
            description: "从多种语言开始学习编程",
            icon: "💻",
            topics: [
              { name: "编程入门", level: "Beginner" as const, duration: "20 hours", description: "从Python或C开始学习 - 哈佛CS50，MIT 6.100L" },
              { name: "数据结构与算法", level: "Intermediate" as const, duration: "25 hours", description: "UCB CS61B，普林斯顿算法 - 核心CS基础" },
              { name: "软件工程", level: "Intermediate" as const, duration: "15 hours", description: "MIT 6.031，UCB CS169 - 编写生产级代码" },
              { name: "高级编程", level: "Advanced" as const, duration: "20 hours", description: "斯坦福CS106B/X，MIT 6.824 - 系统编程" }
            ]
          },
          {
            title: "计算机系统",
            description: "从硬件到软件理解计算机的工作原理",
            icon: "🔧",
            topics: [
              { name: "计算机体系结构", level: "Intermediate" as const, duration: "15 hours", description: "Nand2Tetris，UCB CS61C - 从零开始构建计算机" },
              { name: "操作系统", level: "Advanced" as const, duration: "20 hours", description: "MIT 6.S081，UCB CS162 - 编写自己的操作系统内核" },
              { name: "计算机网络", level: "Intermediate" as const, duration: "15 hours", description: "斯坦福CS144 - 实现TCP/IP协议栈" },
              { name: "数据库系统", level: "Intermediate" as const, duration: "15 hours", description: "CMU 15-445，UCB CS186 - 构建自己的数据库" }
            ]
          },
          {
            title: "算法与理论",
            description: "掌握计算机科学的理论基础",
            icon: "🧮",
            topics: [
              { name: "算法设计", level: "Intermediate" as const, duration: "20 hours", description: "UCB CS170，MIT 6.046 - 高级算法技术" },
              { name: "计算理论", level: "Advanced" as const, duration: "15 hours", description: "MIT 6.045J - 自动机、可计算性、复杂性" },
              { name: "密码学", level: "Advanced" as const, duration: "12 hours", description: "斯坦福CS255 - 安全的数学基础" },
              { name: "凸优化", level: "Advanced" as const, duration: "10 hours", description: "斯坦福EE364A - 机器学习和算法中的优化" }
            ]
          },
          {
            title: "机器学习与人工智能",
            description: "探索人工智能的迷人世界",
            icon: "🤖",
            topics: [
              { name: "机器学习基础", level: "Intermediate" as const, duration: "25 hours", description: "Andrew Ng ML，斯坦福CS229 - 核心ML概念" },
              { name: "深度学习", level: "Advanced" as const, duration: "30 hours", description: "斯坦福CS231n，CS224n - CNN、RNN、Transformer" },
              { name: "强化学习", level: "Advanced" as const, duration: "20 hours", description: "UCB CS285 - 深度RL和策略优化" },
              { name: "AI系统", level: "Advanced" as const, duration: "15 hours", description: "CMU 10-414 - 深度学习系统和优化" }
            ]
          },
          {
            title: "专业领域",
            description: "探索计算机科学的高级和专业领域",
            icon: "🚀",
            topics: [
              { name: "计算机图形学", level: "Advanced" as const, duration: "20 hours", description: "斯坦福CS148，Games101 - 渲染和可视化" },
              { name: "并行计算", level: "Advanced" as const, duration: "15 hours", description: "CMU 15-418/斯坦福CS149 - GPU编程和CUDA" },
              { name: "分布式系统", level: "Advanced" as const, duration: "20 hours", description: "MIT 6.824 - 共识、复制、容错" },
              { name: "系统安全", level: "Advanced" as const, duration: "18 hours", description: "UCB CS161，SU SEED Labs - 安全和密码学" }
            ]
          }
        ]
      };
    } else {
      return { sections: tutorialSections };
    }
  };
  
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
  const titleText = t('title');
  const subtitleText = t('subtitle');
  const stagesText = t('stages');
  const sequenceTitle = t('sequence_title');
  const sequenceSubtitle = t('sequence_subtitle');
  const howToStart = t('how_to_start');
  const howToStartDesc = t('how_to_start_desc');
  const startBasic = t('start_basic');
  const startBasicDesc = t('start_basic_desc');
  const progressGradually = t('progress_gradually');
  const progressGraduallyDesc = t('progress_gradually_desc');
  const practiceOriented = t('practice_oriented');
  const practiceOrientedDesc = t('practice_oriented_desc');
  const readyToStart = t('ready_to_start');
  const readyToStartDesc = t('ready_to_start_desc');
  const browseCourses = t('browse_courses');
  const startLearning = t('start_learning');

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <Header locale={locale} />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-green-600 to-blue-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">{titleText}</h1>
            <p className="text-xl md:text-2xl mb-8 text-green-100">{subtitleText}</p>
            <div className="text-lg">
              <span className="bg-white/20 px-4 py-2 rounded-full">{getTranslatedContent().sections.length} {stagesText}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Getting Started Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">{howToStart}</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">{howToStartDesc}</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6 bg-white rounded-lg shadow-sm">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-xl font-semibold mb-2">{startBasic}</h3>
              <p className="text-gray-600">{startBasicDesc}</p>
            </div>
            <div className="text-center p-6 bg-white rounded-lg shadow-sm">
              <div className="text-4xl mb-4">📚</div>
              <h3 className="text-xl font-semibold mb-2">{progressGradually}</h3>
              <p className="text-gray-600">{progressGraduallyDesc}</p>
            </div>
            <div className="text-center p-6 bg-white rounded-lg shadow-sm">
              <div className="text-4xl mb-4">🚀</div>
              <h3 className="text-xl font-semibold mb-2">{practiceOriented}</h3>
              <p className="text-gray-600">{practiceOrientedDesc}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Learning Path Section - Moved to top for better visibility */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">{sequenceTitle}</h2>
            <p className="text-lg text-gray-600">{sequenceSubtitle}</p>
          </div>
          
          <SectionNavigation 
            sections={getTranslatedContent().sections} 
            locale={locale} 
          />
        </div>
      </section>

      {/* Tutorial Sections */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-12">
            {getTranslatedContent().sections.map((section, index) => (
              <div 
                key={index} 
                id={`section-${index}`}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-8 scroll-mt-20"
              >
                <div className="flex items-start space-x-6">
                  <div className="text-5xl flex-shrink-0">{section.icon}</div>
                  <div className="flex-grow">
                    <h2 className="text-2xl font-bold text-gray-900 mb-3">{section.title}</h2>
                    <p className="text-gray-600 mb-6 text-lg">{section.description}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {section.topics.map((topic, topicIndex) => (
                        <TutorialTopicCard 
                          key={topicIndex} 
                          topic={topic} 
                          index={topicIndex}
                          locale={locale}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* CTA Section */}
      <section className="py-16 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">{readyToStart}</h2>
          <p className="text-xl mb-8 text-gray-300">{readyToStartDesc}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href={`/${locale}/courses`} className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors inline-block">
              {browseCourses}
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}