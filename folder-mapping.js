// 文件夹重命名映射表
const folderMapping = {
  // 主要分类
  '人工智能': 'artificial-intelligence',
  '体系结构': 'computer-architecture',
  '并行与分布式系统': 'parallel-distributed-systems',
  '必学工具': 'essential-tools',
  '操作系统': 'operating-systems',
  '数学基础': 'mathematics-fundamentals',
  '数学进阶': 'mathematics-advanced',
  '数据库系统': 'database-systems',
  '数据科学': 'data-science',
  '数据结构与算法': 'data-structures-algorithms',
  '机器学习': 'machine-learning',
  '机器学习系统': 'machine-learning-systems',
  '机器学习进阶': 'machine-learning-advanced',
  '深度学习': 'deep-learning',
  'Web开发': 'web-development',
  '编程入门': 'programming-basics',
  '软件工程': 'software-engineering',
  '编译原理': 'compilers',
  '计算机网络': 'computer-networks',
  '图形学': 'computer-graphics',
  '信息安全': 'information-security',
  '分布式系统': 'distributed-systems',
  '编程语言': 'programming-languages',
  '计算机组成原理': 'computer-organization',
  '算法设计': 'algorithm-design',
  '计算机科学导论': 'computer-science-introduction',
  '科研工具': 'research-tools',
  '计算机系统': 'computer-systems',
  '形式化方法': 'formal-methods',
  '科技论文写作': 'technical-writing',
  '其他': 'miscellaneous',
  
  // 编程入门子分类
  'C': 'c',
  'cpp': 'cpp',
  'Java': 'java',
  'Python': 'python',
  'JavaScript': 'javascript',
  'Go': 'go',
  'Rust': 'rust',
  'Swift': 'swift',
  'Kotlin': 'kotlin',
  'TypeScript': 'typescript',
  'Ruby': 'ruby',
  'PHP': 'php',
  'Shell': 'shell',
  '汇编': 'assembly',
  'Fortran': 'fortran',
  'MATLAB': 'matlab',
  'R': 'r',
  'SQL': 'sql',
  'HTML/CSS': 'html-css',
  '前端框架': 'frontend-frameworks',
  'WebAssembly': 'webassembly',
  'Linux': 'linux',
  'Git': 'git',
  'Docker': 'docker',
  'VS Code': 'vscode',
  
  // 软件工程子分类
  '6031': '6031',
  '软件设计': 'software-design',
  '软件测试': 'software-testing',
  '软件质量保证': 'software-quality-assurance',
  'DevOps': 'devops',
  '项目管理': 'project-management',
  '敏捷开发': 'agile-development',
  '代码重构': 'code-refactoring',
  '设计模式': 'design-patterns',
  '软件架构': 'software-architecture',
  'API设计': 'api-design',
  '微服务': 'microservices',
  '云计算': 'cloud-computing',
  '容器化': 'containerization',
  '持续集成': 'continuous-integration',
  '持续部署': 'continuous-deployment',
  
  // 可以继续添加更多映射...
};

// 反向映射（英文到中文）
const reverseFolderMapping = Object.fromEntries(
  Object.entries(folderMapping).map(([chinese, english]) => [english, chinese])
);

module.exports = {
  folderMapping,
  reverseFolderMapping
};