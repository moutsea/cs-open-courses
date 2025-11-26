export interface TutorialTopic {
  name: string
  level: "Beginner" | "Intermediate" | "Advanced"
  duration: string
  description: string
}

export type TutorialIcon = 'tools' | 'math' | 'code' | 'systems' | 'theory' | 'ai' | 'rocket'

export interface TutorialSection {
  title: string
  description: string
  icon: TutorialIcon
  topics: TutorialTopic[]
}

const tutorialSectionsEn: TutorialSection[] = [
  {
    title: "Essential Tools",
    description: "Master the fundamental tools that every computer science student needs",
    icon: 'tools',
    topics: [
      { name: "Command Line & Shell", level: "Beginner", duration: "4 hours", description: "Learn Vim, command line basics, and shell scripting" },
      { name: "Git & Version Control", level: "Beginner", duration: "3 hours", description: "Master Git for project management and collaboration" },
      { name: "Information Retrieval", level: "Beginner", duration: "2 hours", description: "Learn information retrieval techniques, search engines, and data indexing" },
      { name: "Docker & Containerization", level: "Intermediate", duration: "3 hours", description: "Learn container technology for modern development" }
    ]
  },
  {
    title: "Mathematical Foundations",
    description: "Build strong mathematical background for computer science",
    icon: 'math',
    topics: [
      { name: "Calculus & Linear Algebra", level: "Beginner", duration: "20 hours", description: "Essential math for algorithms and machine learning" },
      { name: "Discrete Mathematics", level: "Intermediate", duration: "15 hours", description: "Logic, set theory, graph theory, and combinatorics" },
      { name: "Probability Theory", level: "Intermediate", duration: "12 hours", description: "Foundation for machine learning and algorithms" },
      { name: "Information Theory", level: "Advanced", duration: "8 hours", description: "Entropy, coding, and communication theory" }
    ]
  },
  {
    title: "Programming Fundamentals",
    description: "Learn programming from scratch with multiple languages",
    icon: 'code',
    topics: [
      { name: "Introduction to Programming", level: "Beginner", duration: "20 hours", description: "Start with Python or C - Harvard CS50, MIT 6.100L" },
      { name: "Data Structures & Algorithms", level: "Intermediate", duration: "25 hours", description: "UCB CS61B, Princeton Algorithms - Core CS foundation" },
      { name: "Software Engineering", level: "Intermediate", duration: "15 hours", description: "MIT 6.031, UCB CS169 - Write production-quality code" },
      { name: "Advanced Programming", level: "Advanced", duration: "20 hours", description: "Stanford CS106B/X, MIT 6.824 - Systems programming" }
    ]
  },
  {
    title: "Computer Systems",
    description: "Understand how computers work from hardware to software",
    icon: 'systems',
    topics: [
      { name: "Computer Architecture", level: "Intermediate", duration: "15 hours", description: "Nand2Tetris, UCB CS61C - Build a computer from scratch" },
      { name: "Operating Systems", level: "Advanced", duration: "20 hours", description: "MIT 6.S081, UCB CS162 - Write your own OS kernel" },
      { name: "Computer Networks", level: "Intermediate", duration: "15 hours", description: "Stanford CS144 - Implement TCP/IP protocol stack" },
      { name: "Database Systems", level: "Intermediate", duration: "15 hours", description: "CMU 15-445, UCB CS186 - Build your own database" }
    ]
  },
  {
    title: "Algorithms & Theory",
    description: "Master the theoretical foundations of computer science",
    icon: 'theory',
    topics: [
      { name: "Algorithm Design", level: "Intermediate", duration: "20 hours", description: "UCB CS170, MIT 6.046 - Advanced algorithm techniques" },
      { name: "Theory of Computation", level: "Advanced", duration: "15 hours", description: "MIT 6.045J - Automata, computability, complexity" },
      { name: "Cryptography", level: "Advanced", duration: "12 hours", description: "Stanford CS255 - Mathematical foundations of security" },
      { name: "Convex Optimization", level: "Advanced", duration: "10 hours", description: "Stanford EE364A - Optimization in ML and algorithms" }
    ]
  },
  {
    title: "Machine Learning & AI",
    description: "Explore the fascinating world of artificial intelligence",
    icon: 'ai',
    topics: [
      { name: "Machine Learning Fundamentals", level: "Intermediate", duration: "25 hours", description: "Andrew Ng ML, Stanford CS229 - Core ML concepts" },
      { name: "Deep Learning", level: "Advanced", duration: "30 hours", description: "Stanford CS231n, CS224n - CNNs, RNNs, Transformers" },
      { name: "Reinforcement Learning", level: "Advanced", duration: "20 hours", description: "UCB CS285 - Deep RL and policy optimization" },
      { name: "AI Systems", level: "Advanced", duration: "15 hours", description: "CMU 10-414 - Deep learning systems and optimization" }
    ]
  },
  {
    title: "Specialized Topics",
    description: "Explore advanced and specialized areas of computer science",
    icon: 'rocket',
    topics: [
      { name: "Computer Graphics", level: "Advanced", duration: "20 hours", description: "Stanford CS148, Games101 - Rendering and visualization" },
      { name: "Parallel Computing", level: "Advanced", duration: "15 hours", description: "CMU 15-418/Stanford CS149 - GPU programming and CUDA" },
      { name: "Distributed Systems", level: "Advanced", duration: "20 hours", description: "MIT 6.824 - Consensus, replication, fault tolerance" },
      { name: "System Security", level: "Advanced", duration: "18 hours", description: "UCB CS161, SU SEED Labs - Security and cryptography" }
    ]
  }
]

const tutorialSectionsZh: TutorialSection[] = [
  {
    title: "基础工具",
    description: "掌握每个计算机科学学生都需要的基础工具",
    icon: 'tools',
    topics: [
      { name: "命令行与Shell", level: "Beginner", duration: "4 hours", description: "学习Vim、命令行基础和Shell脚本编程" },
      { name: "Git与版本控制", level: "Beginner", duration: "3 hours", description: "掌握Git进行项目管理和协作开发" },
      { name: "信息检索", level: "Beginner", duration: "2 hours", description: "学习信息检索技术、搜索引擎和数据索引" },
      { name: "Docker与容器化", level: "Intermediate", duration: "3 hours", description: "学习现代开发中的容器技术" }
    ]
  },
  {
    title: "数学基础",
    description: "为计算机科学打下坚实的数学基础",
    icon: 'math',
    topics: [
      { name: "微积分与线性代数", level: "Beginner", duration: "20 hours", description: "算法和机器学习的基础数学" },
      { name: "离散数学", level: "Intermediate", duration: "15 hours", description: "逻辑、集合论、图论和组合数学" },
      { name: "概率论", level: "Intermediate", duration: "12 hours", description: "机器学习和算法的基础" },
      { name: "信息论", level: "Advanced", duration: "8 hours", description: "熵、编码和通信理论" }
    ]
  },
  {
    title: "编程基础",
    description: "从多种语言开始学习编程",
    icon: 'code',
    topics: [
      { name: "编程入门", level: "Beginner", duration: "20 hours", description: "从Python或C开始学习 - 哈佛CS50，MIT 6.100L" },
      { name: "数据结构与算法", level: "Intermediate", duration: "25 hours", description: "UCB CS61B，普林斯顿算法 - 核心CS基础" },
      { name: "软件工程", level: "Intermediate", duration: "15 hours", description: "MIT 6.031，UCB CS169 - 编写生产级代码" },
      { name: "高级编程", level: "Advanced", duration: "20 hours", description: "斯坦福CS106B/X，MIT 6.824 - 系统编程" }
    ]
  },
  {
    title: "计算机系统",
    description: "从硬件到软件理解计算机的工作原理",
    icon: 'systems',
    topics: [
      { name: "计算机体系结构", level: "Intermediate", duration: "15 hours", description: "Nand2Tetris，UCB CS61C - 从零开始构建计算机" },
      { name: "操作系统", level: "Advanced", duration: "20 hours", description: "MIT 6.S081，UCB CS162 - 编写自己的操作系统内核" },
      { name: "计算机网络", level: "Intermediate", duration: "15 hours", description: "斯坦福CS144 - 实现TCP/IP协议栈" },
      { name: "数据库系统", level: "Intermediate", duration: "15 hours", description: "CMU 15-445，UCB CS186 - 构建自己的数据库" }
    ]
  },
  {
    title: "算法与理论",
    description: "掌握计算机科学的理论基础",
    icon: 'theory',
    topics: [
      { name: "算法设计", level: "Intermediate", duration: "20 hours", description: "UCB CS170，MIT 6.046 - 高级算法技术" },
      { name: "计算理论", level: "Advanced", duration: "15 hours", description: "MIT 6.045J - 自动机、可计算性、复杂性" },
      { name: "密码学", level: "Advanced", duration: "12 hours", description: "斯坦福CS255 - 安全的数学基础" },
      { name: "凸优化", level: "Advanced", duration: "10 hours", description: "斯坦福EE364A - 机器学习和算法中的优化" }
    ]
  },
  {
    title: "机器学习与人工智能",
    description: "探索人工智能的迷人世界",
    icon: 'ai',
    topics: [
      { name: "机器学习基础", level: "Intermediate", duration: "25 hours", description: "Andrew Ng ML，斯坦福CS229 - 核心ML概念" },
      { name: "深度学习", level: "Advanced", duration: "30 hours", description: "斯坦福CS231n，CS224n - CNN、RNN、Transformer" },
      { name: "强化学习", level: "Advanced", duration: "20 hours", description: "UCB CS285 - 深度RL和策略优化" },
      { name: "AI系统", level: "Advanced", duration: "15 hours", description: "CMU 10-414 - 深度学习系统和优化" }
    ]
  },
  {
    title: "专业领域",
    description: "探索计算机科学的高级和专业领域",
    icon: 'rocket',
    topics: [
      { name: "计算机图形学", level: "Advanced", duration: "20 hours", description: "斯坦福CS148，Games101 - 渲染和可视化" },
      { name: "并行计算", level: "Advanced", duration: "15 hours", description: "CMU 15-418/斯坦福CS149 - GPU编程和CUDA" },
      { name: "分布式系统", level: "Advanced", duration: "20 hours", description: "MIT 6.824 - 共识、复制、容错" },
      { name: "系统安全", level: "Advanced", duration: "18 hours", description: "UCB CS161，SU SEED Labs - 安全和密码学" }
    ]
  }
]

export const tutorialSections = { en: tutorialSectionsEn, zh: tutorialSectionsZh } as const

export function getTutorialSections(locale: string): TutorialSection[] {
  return locale === 'zh' ? tutorialSectionsZh : tutorialSectionsEn
}
