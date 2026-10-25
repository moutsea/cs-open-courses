export interface CategoryFaqItem {
  q: string
  a: string
}

export const categoryGuides: Record<string, { en: string; zh: string }> = {
  'programming-introduction': {
    en: 'The goal of a first programming course is to write a few hundred lines on your own, not to finish a syntax reference. Complete beginners should start with Python: CS50P runs 30 to 40 hours, and CS61A takes about 50 while also teaching abstraction and interpreters — it is the official prerequisite for CS61B. To build C and memory foundations, Harvard CS50x is only 20 hours but moves fast, and pairs well with Duke’s C specialisation afterwards. Java learners can start with Princeton COS126, which explicitly assumes no programming background.',
    zh: '第一门编程课的目标是能独立写出几百行程序，而不是把语法表背完。完全零基础建议从 Python 入手：CS50P 约 30 到 40 小时，CS61A 约 50 小时，后者会顺带讲清抽象与解释器，也是 CS61B 的正式先修。想打牢 C 与内存的基础，Harvard 的 CS50x 只要 20 小时但节奏很快，之后可以接 Duke 的 C 程序设计专项。偏好 Java 可以看 Princeton COS126，它明确不要求编程基础。语言只是载体，选定一门后至少完成一个完整项目再考虑换。'
  },
  'data-structures-algorithms': {
    en: 'Data structures and algorithms underpin everything that follows, and the main variable in choosing is how comfortable you already are with a language. CS61B is the balanced entry at about 60 hours in Java: fourteen labs implement the structures by hand and three projects put you inside a thousand-line codebase. MIT 6.006 is the more theoretical route, 100 hours plus in Python, followed by 6.046 for design and analysis. For interview preparation, Princeton’s Algorithms I & II condenses the core into roughly 60 hours of Java.',
    zh: '数据结构与算法是后续所有课程的地基，选课时真正的变量是「你现在的语言熟练度」。CS61B 是最平衡的入口：约 60 小时、Java，从配置 IDEA 讲起，14 个 lab 手写绝大部分数据结构，3 个 Project 让你接触上千行工程代码，先修只有 CS61A。想更偏理论可以走 MIT 6.006，100 小时以上、Python，课堂讲解比同类课更细，之后接 6.046 学算法设计与分析。如果目标是面试与刷题，Princeton 的 Algorithms I & II 把核心内容压进 60 小时的 Java 实现里，密度更友好。'
  },
  'machine-learning': {
    en: 'The commonest mistake in learning machine learning is starting with a course that is too theoretical and stalling on the mathematics. Coursera’s Machine Learning is the smoothest first step at about 100 hours in Python, assuming a little AI background, and it makes supervised learning, evaluation, and tuning concrete. Stanford CS229 is the graduate version from the same instructor: also 100 hours, but requiring calculus, probability, and real mathematical maturity, teaching derivations rather than library calls. Berkeley CS189 sits in between and expects CS188 and CS70 first.',
    zh: '机器学习入门最容易踩的坑是先看太理论的课，然后在数学上卡住。Coursera 的 Machine Learning 是最平滑的第一门，100 小时、Python，需要一点 AI 入门和 Python 熟练度，把监督学习、评估和调参讲得足够具体；Stanford 的 CS229 是同一位讲者的研究生版本，同样 100 小时，但要求高数、概率论和较深厚的数学功底，讲的是算法背后的推导而不是调包。伯克利的 CS189 介于两者之间，但要先修 CS188 与 CS70。想先建立直觉，就按 Machine Learning、CS189、CS229 的顺序走。'
  },
  'deep-learning': {
    en: 'Deep learning courses are chosen by the application you care about, not by which one covers the most ground. For a general start, Stanford CS230 or Hung-yi Lee’s machine learning course runs about 80 hours in Python and assumes basic machine learning. Then specialise: CS231n and UMich EECS 498-007 for computer vision, CS224n for natural language processing, CS224w for graph data, and CS285 for reinforcement learning, which explicitly requires CS188 and CS189. All of them assume working PyTorch skills and paper-reproduction assignments, so revise backpropagation first.',
    zh: '深度学习课的选择取决于你想深入哪个应用方向，而不是哪门「更全」。通用入门可以从 Stanford 的 CS230 或台大李宏毅机器学习开始，80 小时、Python，先修是机器学习基础。之后按方向分流：计算机视觉看 CS231n 与 UMich 的 EECS 498-007，自然语言处理看 CS224n，图数据看 CS224w，强化学习看 CS285，后者明确要求先修 CS188 与 CS189。这些课都假设你能写 PyTorch，作业以复现经典模型为主，提前把反向传播补一遍会轻松很多。'
  },
  'advanced-machine-learning': {
    en: 'This is the research-level shelf: it assumes you already know machine learning and want depth rather than coverage. CMU 10-708 builds probabilistic graphical models up to variational inference and MCMC, and connects them to neural networks and reinforcement learning; CS229M (STATS214) treats learning as a theory problem with generalisation bounds. Both expect prior coursework in machine learning, deep learning, and statistics, and the difficulty ratings start at five stars. Close your gaps in probability and convex optimisation first, then pick one thread and finish it.',
    zh: '这一栏不是再学一遍模型，而是把机器学习当作概率建模问题来推导。CMU 10-708 的图模型课体系性最强，从图模型基础一路讲到与神经网络的结合、在强化学习中的应用，以及非参数方法；CS229M（STATS214）则专攻学习理论，两条路分别对应「建模」与「证明」。四门课的共同前提是已经完整学过机器学习、深度学习和统计，难度普遍在五星以上。建议先补齐概率与凸优化，再按研究兴趣锁定一条主线：偏贝叶斯推断读 10-708，偏理论证明读 CS229M。'
  },
  'advanced-mathematics': {
    en: 'Mathematics is where most self-taught programmers stall, so choose the entry point deliberately. CS70 assumes no prerequisites and covers discrete mathematics and probability in about 60 hours; MIT 6.042J teaches similar material with a stronger computer science slant. Only then should you specialise: EE364A for convex optimisation, MIT 18.330 for numerical analysis, CS126 for a rigorous probability course. The advanced three all expect calculus, linear algebra, and probability, and each runs past 100 hours, so take them one at a time rather than in parallel.',
    zh: '数学基础决定你能走多远，但入门不该从最难的那门开始。CS70 没有先修要求，60 小时能过一遍离散数学与概率论，而且每个模块都会落到实际算法上，是最稳的起点；6.042J 讲同一批内容，但更强调它们在计算机科学中的用法。这两门打底之后，再按方向分流：想做机器学习理论选 EE364A 凸优化，想做数值计算与仿真选 MIT 18.330，概率论方向可以看 CS126。后面三门都要求微积分、线性代数、概率论三件套齐全，学时也在 100 小时以上。'
  },
  'artificial-intelligence': {
    en: 'Introductory AI courses differ mainly in how much code you write. CS188 is the broadest: search and pruning, constraint satisfaction, Markov decision processes, Bayesian networks, and reinforcement learning, all reinforced by Pac-Man projects where every algorithm actually runs. Harvard’s CS50 AI is the lighter on-ramp at roughly 30 hours with twelve programming assignments and works well as a first course. Both use Python; CS188 expects the probability background from CS70. For language models, follow up with Neural Networks: Zero to Hero.',
    zh: 'AI 入门课的分歧点在于「要不要亲手写代码实现算法」。CS188 覆盖面最广，从搜索剪枝、约束满足一路讲到马尔可夫决策过程、贝叶斯网络与强化学习，配套的吃豆人 Project 让每个算法都能真正跑起来；Harvard 的 CS50 AI 更轻，30 小时、12 个编程作业，用强化学习训练 Nim 游戏、用剪枝扫雷，很适合作为第一门课试水。两门都只用 Python，CS188 需要先修 CS70 的概率基础。想理解大模型内部，可以在这之后接《神经网络：从零到英雄》，跟着 Karpathy 手写反向传播并实现一个 GPT。'
  },
  'computer-systems-basics': {
    en: 'Systems fundamentals answer one concrete question: why does this C program behave the way it does on the machine? CSAPP is the most famous and the heaviest, roughly 150 hours across assembly, architecture, linking, exceptional control flow, virtual memory, concurrency, and networking, assuming CS61A and CS61B, with notoriously hard projects. CS110 takes a different route through C/C++ with Unix, GDB, and Valgrind and demands strong debugging instincts. COS217 is the gentler entry at about 110 hours in C and ARM64 assembly, a good fit once you know data structures.',
    zh: '系统基础课解决一个具体问题：为什么这段 C 代码在机器上跑成了这样。CSAPP 是最有名也最重的一门，150 小时覆盖汇编、体系结构、链接、异常控制流、虚拟内存、并发与网络，先修是 CS61A 加 CS61B，Project 难度公认很高。CS110 走的是另一条路，用 C/C++ 配合 Unix、GDB、Valgrind 讲系统编程，同样 150 小时，对调试能力要求极高。COS217 相对温和，110 小时、以 C 与 ARM64 汇编为主，适合已经有数据结构基础、想先建立系统视角的人。'
  },
  'computer-architecture': {
    en: 'If you want to know how source code becomes signals on a chip, you can build up from gates or drill down from programs. Nand2Tetris assumes nothing and in about 40 hours has you construct a CPU from NAND gates, then write a compiler and a small OS — an excellent first pass. DDCA adds Verilog, pipelining, and the memory hierarchy from the ETH curriculum. CS61C is the hardest entry, expecting CS61A and CS61B first, and uses C and RISC-V with projects such as writing a neural network in assembly.',
    zh: '想搞清楚「代码怎么变成电路上的电信号」，可以从最底层往上搭，也可以从上往下拆。Nand2Tetris 没有先修要求，40 小时内用与非门搭出 CPU，再自己写编译器和简易操作系统，最后在上面跑俄罗斯方块，是极佳的全局入门；DDCA 在这个基础上补上 Verilog、流水线与存储层次，是 ETH 体系结构的正式课程。CS61C 则要求先学完 CS61A 与 CS61B，用 C 和 RISC-V 讲清楚程序到硬件的映射，Project 里甚至有汇编写神经网络这类硬活。'
  },
  'operating-systems': {
    en: 'An operating systems course is worth almost exactly what its labs are worth, so check which kernel they use first. MIT 6.S081 works inside xv6 on RISC-V, runs about 150 hours, and assumes architecture plus solid C and RISC-V assembly; it is the most respected lab sequence available. Berkeley CS162 expects CS61A, CS61B, and CS61C, and runs 200 hours and up. To lower the entry cost, NJU OS and HIT OS both stay in C with complete labs, while Princeton COS318 builds on COS217-level systems programming.',
    zh: '操作系统课的价值几乎全在实验，选课时要先看它的 lab 用什么内核。MIT 6.S081 用 RISC-V 版 xv6，150 小时，先修是体系结构、扎实的 C 语言功底与 RISC-V 汇编，是目前公认最经典的一套实验；Berkeley 的 CS162 先修是 CS61A/B/C，200 小时以上且上不封顶，内容与要求都最重。想降低起步难度，可以先看南大 OS 或哈工大 OS，两门都以 C 为主、分别 150 与 100 小时，实验完整，后者的实验基于 Linux 0.11 源码。'
  },
  'computer-networks': {
    en: 'Networking courses split into two styles: principles first, or build the stack as you go. CS168 suits systematic understanding, moving from layering and addressing through routing to TCP, DNS, and HTTP, with a clear textbook and three Python projects on traceroute, routing, and transport. The Top-Down Approach lectures are the fast route to intuition: about 40 hours and almost no coding prerequisite. CS144 is the demanding one — it assumes systems fundamentals and CS106L, then spends 100 hours having you implement a TCP/IP stack in C++.',
    zh: '网络课有两种讲法：先讲分层原理再往下实现，或者直接照着协议栈写代码。想系统理解 Internet 怎么运作，CS168 更合适，它从分层、寻址、路由讲到 TCP、DNS、HTTP，配套教材写得简洁清楚，三个 Python Project 覆盖 traceroute、路由与传输；只想快速建立直觉，可以看《计算机网络：自顶向下方法》对应的课程，40 小时、几乎没有编程门槛。CS144 是最硬的一门，要求计算机系统基础和 CS106L，你会在 100 小时里用 C++ 亲手搭出整个 TCP/IP 协议栈。'
  },
  'database-systems': {
    en: 'Database courses divide on whether you learn to use a database or to build one. CMU 15-445 is the build-first choice: roughly 100 hours of C++ inside the bustub teaching database, implementing a buffer pool, a B+ tree index, query execution, and concurrency control, with lectures, autograder, and videos all public — but it assumes C++, data structures, and CSAPP-level systems knowledge. Berkeley CS186 goes wider, covering SQL optimisation, transactions, and recovery while you implement a relational database in Java, and expects CS61A, CS61B, and CS61C.',
    zh: '数据库课程的分界线是「学怎么用」还是「学怎么造」。CMU 15-445 是造这一侧的首选：100 小时，用 C++ 在 bustub 教学数据库里依次实现缓冲池、B+ 树索引、查询执行与并发控制，讲义、自动评测和课程视频全部开源，但它要求 C++、数据结构与算法，以及 CSAPP 级别的系统基础。Berkeley 的 CS186 覆盖更全，从 SQL 查询的拆解优化讲到事务与故障恢复，用 Java 实现一个支持并发查询和 B+ 树索引的关系型数据库，先修是 CS61A、CS61B、CS61C。'
  },
  'computer-graphics': {
    en: 'Graphics is gated by mathematics more than by programming. GAMES101 is the standard starting point for self-learners: linear algebra plus some calculus, about 80 hours, and a single pass through rasterisation, geometry, light transport, and animation, with assignments that build a renderer by hand. The field then splits — GAMES202 covers real-time rendering and ray tracing and expects GAMES101 first, while GAMES103 moves into physically based simulation and assumes college physics plus C#. CMU 15-462 is the fuller, harder alternative, requiring vector calculus and C/C++.',
    zh: '图形学的门槛主要在数学，而不在编程。GAMES101 是国内自学图形学最常见的第一门课：线性代数加一点高数、80 小时，把光栅化、几何表示、光的传播与动画模拟四条主线一次讲完，配套作业就是自己动手写渲染器。学完再分两个方向：GAMES202 讲实时渲染与光线追踪，要求先学完 GAMES101；GAMES103 转向物理仿真，需要大学物理和 C#。想要更完整的体系可以看 CMU 15-462，它要求向量微积分和 C/C++，作业强度明显更高。'
  },
  'machine-learning-systems': {
    en: 'Machine learning systems asks how models actually run fast on real hardware — it is a systems course, not an algorithms one. CMU 10-414 is the best starting point: about 100 hours in Python and C++, starting from automatic differentiation and ending with a miniature deep learning framework, assuming only an intro systems course such as 15-213, intro deep learning, and basic mathematics. CMU 15-442 goes down to the metal with GPU programming, distributed training, and ML compilation. MIT 6.5940 TinyML and Machine Learning Compilation focus on the edge and on compilers.',
    zh: '机器学习系统研究的是模型怎么在真实硬件上跑得动、跑得快，属于系统课而不是算法课。CMU 10-414 是最好的起点：100 小时，用 Python 与 C++ 从自动微分开始，一路写出一个迷你深度学习框架，先修只要系统入门（如 15-213）、深度学习入门和基础数学。想再往硬件走，CMU 15-442 覆盖 GPU 编程、分布式训练与机器学习编译，难度五星。偏端侧与编译可以看 MIT 6.5940 TinyML 和 Machine Learning Compilation，30 到 50 小时就能入门。'
  },
  'parallel-distributed-systems': {
    en: 'Parallel and distributed computing are usually grouped together but are different courses. CMU 15-418 / Stanford CS149 is parallelism inside one machine — multicore, SIMD, GPUs, caches, and coherence — about 150 hours in C++, assuming computer architecture and working C++ skills. MIT 6.824 is consistency and fault tolerance across machines: you implement MapReduce, Raft, and a sharded key-value service in Go over roughly 200 hours, and it is genuinely hard. Take CS149 first for performance intuition, then move to 6.824.',
    zh: '并行与分布式常被放在一起，但其实是两门不同的课。CMU 15-418 / Stanford CS149 讲的是单机内的并行：多核、SIMD、GPU、缓存与一致性，150 小时、C++，要求先修计算机体系结构并熟悉 C++。MIT 6.824 讲的是多机之间的一致性与容错，用 Go 实现 MapReduce、Raft 与分片键值服务，200 小时，先修体系结构与并行编程，难度在六星。建议先用 CS149 建立性能直觉，再进 6.824；顺序反了，很容易被 Raft 的竞态调试劝退。'
  },
  'programming-languages-design': {
    en: 'This area is often mistaken for pure theory, but these courses all involve substantial coding. Stanford CS242 is representative: lambda calculus and type systems first, then OCaml and Rust to ground the theory in working programs, about 60 hours, assuming some familiarity with systems and programming language theory. For static analysis instead, NJU’s software analysis course moves from abstract syntax trees and control flow graphs to dataflow and pointer analysis in Java over 60 hours, while PKU’s version is stricter. Cambridge’s semantics course is a 20-to-30-hour theoretical supplement.',
    zh: '这个方向常被误解成「只讲理论」，其实这几门课都要写代码。CS242 的路线很有代表性：先讲 Lambda 演算和类型系统，再用 OCaml 与 Rust 把理论落到实际程序里，说明这些概念如何帮你避开错误，60 小时，先修是对计算机系统和编程语言理论的初步了解。更想走静态分析的话，南大软件分析从抽象语法树、控制流图讲到数据流分析与指针分析，Java 实现、60 小时，只需数据结构基础；北大软件分析技术内容相近但要求更高。'
  },
  'software-engineering': {
    en: 'Software engineering courses degenerate into slides about documents and diagrams, so check whether the course makes you write code. MIT 6.031 keeps the focus on code quality: about 100 hours in Java, organised around being safe from bugs, easy to change, and understandable, covering abstraction, specifications, testing, and concurrency, with only one programming language as prerequisite. Berkeley CS169 takes the agile and SaaS route with Ruby on Rails and continuous delivery. CMU 17-803 is about empirical research methods and suits PhD-bound students.',
    zh: '软件工程课最容易变成「讲文档和流程图」，所以要看它是否逼你写代码。MIT 6.031 把重点放在代码质量上：100 小时、Java，围绕「无 bug、易修改、可理解」三个目标，讲抽象、规格、测试与并发，先修只要掌握一门编程语言，很适合作为学完数据结构后的下一门。Berkeley 的 CS169 走敏捷开发与 SaaS 路线，用 Ruby/Rails 讲持续交付与云端部署，没有先修要求但工作量不小。CMU 17-803 偏实证研究方法，更适合准备做研究的博士生。'
  },
  'system-security': {
    en: 'Security courses depend on which layer you want to defend. At the systems and binary level, MIT 6.858 is the classic: about 150 hours of labs against a web application, covering buffer overflows and privilege separation, assuming architecture and some systems background. Berkeley CS161 is broader, requiring CS61A, CS61B, and CS61C and using C and Go across memory safety, cryptography, web security, and network attacks. For a zero-prerequisite start, SEED Labs ships virtual machine and Docker environments plus open lecture notes.',
    zh: '安全课的选择取决于你想防守哪一层。系统与二进制这一层，MIT 6.858 是经典：150 小时，围绕一个 Web 应用做缓冲区溢出、权限分离等实验，先修要求体系结构和对系统的初步理解；Berkeley CS161 更全面，先修是 CS61A、CS61B、CS61C 三件套，用 C 和 Go 覆盖内存安全、密码学、Web 安全与网络攻击。想零基础先试水，SEED Labs 没有先修要求，提供虚拟机与 Docker 的攻防环境和开源讲义。'
  },
  'web-development': {
    en: 'Web development is one of the few areas you can learn almost entirely through projects, so pick courses that hand you a working application. Helsinki’s Full Stack open is the friendliest entry at two stars, with open-ended hours, building single-page apps and REST APIs in React and Node.js, plus GraphQL, testing, and MongoDB persistence; prerequisites are just solid programming skills and Git. Stanford CS142 offers a fuller picture across HTML, CSS, JavaScript, React, and Node with eight projects. CS571 focuses on React UI and state.',
    zh: 'Web 开发是少数可以完全靠项目学出来的方向，选课时要看它是否给出可运行的完整应用。Helsinki 的 Full Stack open 是最友好的入口：难度两星、学时因人而异，用 React 与 Node.js 做单页应用和 REST API，还讲 GraphQL、测试与 MongoDB 持久化，先修只是良好的编程能力与 Git 基础。想要更完整的视角，Stanford CS142 覆盖 HTML、CSS、JavaScript、React 与 Node 并配 8 个 Project，要求有一定编程经验、100 小时、难度四星，作业要自己搭一个完整应用，对 JavaScript 熟练度要求更高。'
  },
  'data-science': {
    en: 'Data science is best entered by finishing a full pipeline from raw data to conclusion, rather than by delaying everything until the mathematics is done. Berkeley’s Data100 is the natural first course: about 80 hours in Python, covering cleaning, feature extraction, visualisation, and the basics of inference and machine learning, while making you fluent in Pandas, NumPy, and Matplotlib. It expects Data8, CS61A, and linear algebra — so with no programming background, start with CS61A, then come back with the Python and Pandas fluency the assignments assume.',
    zh: '数据科学入门的关键是先跑通「从原始数据到结论」这条完整链路，而不是先补完所有数学。伯克利的 Data100 是这条路上最合适的第一门：80 小时、Python，讲数据清洗、特征提取、可视化，以及推理与机器学习的基本方法，同时把 Pandas、NumPy、Matplotlib 用熟，编程作业设计得相当有意思。它的先修是 Data8、CS61A 和线性代数，所以没有编程基础的话，建议先用 CS61A 打好 Python 与抽象能力，再回来学 Data100。'
  },
  'electronics-basics': {
    en: 'Electronics is not compulsory for computer science students, but it decides whether you can actually read hardware and signals. EE16A&B is Berkeley’s freshman sequence for electrical engineering, assuming nothing, using circuits to gather information and make predictions, with fully remote labs — long at 150 hours but coherent. On the signals side, MIT 6.007 needs only calculus and linear algebra and covers Fourier analysis and system response in 50 to 70 hours, while UCB EE120 is stricter at about 100 hours and expects CS61A, CS70, and probability.',
    zh: '电子基础不是计算机专业的必修，但它决定了你能不能真正读懂硬件与信号。EE16A&B 是伯克利电子系的大一入门课，没有先修要求，通过电路从环境中收集信息再做分析与预测，配套 lab 有完整的远程版本，150 小时偏长但体系完整。信号与系统这一侧，MIT 6.007 只要微积分和线性代数、50 到 70 小时，是理解傅里叶与系统响应的最短路径；UCB EE120 更严格，还要求 CS61A、CS70 与概率基础，100 小时。'
  },
  'essential-tools': {
    en: 'This section is not about theory but about whether you can operate the tools you touch every day. Learn Git before Vim, and do not start either half-understood: Git’s internal model rewards reading the first chapters of Pro Git, and skipping that is how people lose work; Vim rewards repetition. Then cover building and reproducing environments — GNU Make and CMake let you read how other people’s C/C++ projects compile, and Docker removes the environment setup that drains enthusiasm fastest. Add LaTeX when reports arrive.',
    zh: '这一栏解决的不是「学什么理论」，而是每天都要用的东西会不会用。建议先 Git 再 Vim，两者都不适合一知半解就上手：Git 的内部模型需要先读一遍 Pro Git 的前几章，否则很容易把代码搞丢；Vim 则是典型的熟能生巧。接着补构建与复现环境，GNU Make 和 CMake 能让你看懂别人的 C/C++ 项目怎么编译，Docker 解决的是配环境这个最消耗热情的问题。写论文和课程报告再学 LaTeX，日常检索与知识管理可以看信息检索与工作流两部分。'
  },
  'mathematics-basics': {
    en: 'These three courses answer three different needs. Linear algebra underlies almost everything else: MIT 18.06, taught by Gilbert Strang with a textbook adopted at Tsinghua, is a three-star course whose time commitment depends entirely on your background, and works well alongside the public lectures. Calculus follows the MIT course at two stars with no prerequisites, useful for filling gaps. Information theory gets its own focused treatment in MIT 6.050J at around 100 hours with no prerequisites. Take 18.06 first, then decide.',
    zh: '数学基础这三门课对应的其实是三种不同需求。线性代数几乎是一切的前提，MIT 18.06 由 Gilbert Strang 讲授，教材已被清华采用为官方教材，难度三星、学时因人而异，可以配合公开视频反复看；微积分同样走 MIT 的课程，两星、没有先修要求，适合作为查漏补缺的复习材料。如果对熵、编码这类概念本身感兴趣，MIT 6.050J 是 100 小时的独立专题，同样没有先修要求。建议先修完 18.06，再决定要不要投入 6.050J。'
  },
  compilers: {
    en: 'Compilers is one of those subjects you cannot learn by reading alone. Stanford CS143 is the most complete option: you build a whole compiler for the COOL language, from lexing through code generation down to MIPS assembly, but it assumes computer architecture and takes around 150 hours. NJU’s compiler course is the gentler entry, requiring only discrete mathematics over about 80 hours. PKU’s course takes the opposite approach, building a SysY to RISC-V compiler from an empty folder in 60 hours with maximum freedom.',
    zh: '编译原理是少数必须动手写才学得会的课，只看书几乎不可能掌握。CS143 是完整度最高的选择：用 Java 或 C++ 为 COOL 语言实现词法、语法、语义分析与代码生成，最终编译到 MIPS 汇编，但它要求先修计算机体系结构，150 小时的投入也不算轻。想降低门槛可以先看南大编译原理，只需离散数学、80 小时、Java 实现，能把前端流程完整走一遍；PKU 编译原理实践则让你从空文件夹构建 SysY 到 RISC-V 的编译器，60 小时、自由度最高。'
  },
  'deep-generative-models': {
    en: 'Generative modelling now means two threads: diffusion models and large language models. To understand the mathematics, MIT 6.S184 is the lightest entry at about 20 hours, deriving diffusion and flow matching from stochastic differential equations with only deep learning and calculus as prerequisites. The systems side is CMU 15-779 and CMU 11-868, covering GPU programming, machine learning compilation, distributed training, and LLM serving; both expect PyTorch experience and some CUDA. The modelling and NLP layers sit in CMU 11-667 and 11-711.',
    zh: '这个方向现在基本是两条线：扩散模型与大语言模型。想理解生成模型的数学原理，MIT 6.S184 是最轻的入口，约 20 小时，从随机微分方程的角度讲扩散与流匹配，先修只要深度学习和微积分，配套笔记质量很高。偏系统与工程一侧是 CMU 15-779 与 CMU 11-868，前者讲 GPU 编程、机器学习编译、分布式训练与推理加速，后者从算子一路做到大模型服务部署，两门都要求 PyTorch 经验并建议了解 CUDA。上层算法与应用可以看 CMU 11-667 与 11-711。'
  }
}

export const categoryFaqs: Record<string, { en: CategoryFaqItem[]; zh: CategoryFaqItem[] }> = {
  'programming-introduction': {
    zh: [
      { q: '编程入门课程应该先学哪门？', a: '零基础先学 CS50P 或 CS61A，分别约 30 到 50 小时、都用 Python，CS61A 还是 CS61B 的正式先修；想学 C 可以从 Harvard 的 CS50x 开始，20 小时但节奏很快，还会顺带讲 Git 与命令行。' },
      { q: '第一门语言选 Python 还是 C？', a: '想快些写出能用的程序选 Python，CS50P 与 CS61A 都是现成入口；想理解内存和指针选 C，Duke 的 C 程序设计专项 110 小时更系统，但难度四星。' },
      { q: '完全没有编程基础可以学 CS61B 吗？', a: '不建议。CS61B 的先修是 CS61A，虽然课程会从 IDEA 配置和 Java 语法讲起，但没有编程经验仍会跟不上，先完成 CS61A 或 CS50 并把 lab 做完更稳。' },
      { q: '入门课学完之后接着学什么？', a: '接着学数据结构与算法，比如 CS61B，再补系统基础如 CSAPP。入门阶段先选定一门语言并完成一个完整项目，比同时开几门课有效得多。' }
    ],
    en: [
      { q: 'Which programming course should I start with?', a: 'With no background, start with CS50P or CS61A — roughly 30 to 50 hours, both in Python, and CS61A is the official prerequisite for CS61B. For C, Harvard CS50x takes about 20 hours but moves fast.' },
      { q: 'Should my first language be Python or C?', a: 'Python gets you writing useful programs sooner, via CS50P or CS61A. C builds a mental model of memory and pointers; Duke’s C specialisation is the systematic route at about 110 hours and four stars.' },
      { q: 'Can I take CS61B with no programming experience?', a: 'Not comfortably. CS61B lists CS61A as its prerequisite. It does teach Java and IDE setup from scratch, but without prior programming practice the projects are hard to follow.' },
      { q: 'What comes after an introductory course?', a: 'Data structures and algorithms, such as CS61B, then systems fundamentals such as CSAPP. Finish one language and one complete project before adding a second course.' }
    ]
  },
  'data-structures-algorithms': {
    zh: [
      { q: '数据结构与算法先学哪门？', a: '有 CS61A 基础就直接学 CS61B，60 小时、Java，14 个 lab 手写数据结构；想更偏理论可以选 MIT 6.006，但它要求先修计算机导论，且公认较难。' },
      { q: '算法课程需要什么数学基础？', a: '6.006 与 6.046 需要一定的离散数学和概率直觉，CS170 明确要求先修 CS61B 与 CS70。如果没学过证明，建议先补离散数学再开始。' },
      { q: '零基础能直接学 CS61B 吗？', a: '需要先修 CS61A。CS61B 会从 IDEA 配置和 Java 语法讲起，但没有编程基础仍会吃力，建议先完成 CS61A 或 CS50 再开始，否则后期的 Project 会卡住。' },
      { q: '只想刷题面试该选哪门？', a: 'Princeton 的 Algorithms I & II 只需 CS61A、约 60 小时、Java 实现，内容密度对刷题最友好；CS61B 的工程训练更完整但投入更大，两者可以搭配：先用 CS61B 打底，再用 Algo 强化。' }
    ],
    en: [
      { q: 'Which data structures course should I take first?', a: 'With CS61A behind you, take CS61B: about 60 hours in Java with fourteen labs that implement the structures yourself. MIT 6.006 is the more theoretical option but expects an intro CS course.' },
      { q: 'How much mathematics do algorithms courses need?', a: 'MIT 6.006 and 6.046 assume some discrete mathematics and probability intuition; CS170 explicitly requires CS61B and CS70. If you have never written proofs, revise discrete mathematics first.' },
      { q: 'Can I start CS61B from zero?', a: 'CS61B requires CS61A. It does walk through IDE setup and Java syntax, but without prior programming practice the projects are steep. Finish CS61A or CS50 first.' },
      { q: 'Which course is best for interview preparation?', a: 'Princeton’s Algorithms I & II needs only CS61A and takes about 60 hours of Java, which is the friendliest density for interview practice. CS61B trains engineering habits more thoroughly but costs more time.' }
    ]
  },
  'machine-learning': {
    zh: [
      { q: '机器学习课程先学哪门？', a: '先学 Coursera 的 Machine Learning，100 小时、Python，讲监督学习、评估与调参；想深入推导再学 Stanford CS229，但它要求高数与概率论基础，作业也更考验推导耐心。' },
      { q: 'CS229 需要什么基础？', a: '官方先修是高数、概率论、Python，并要求较深厚的数学功底，预计 100 小时。课程以 notes 和推导为主，作业不对公众开放。' },
      { q: '零基础可以学机器学习吗？', a: '需要先有 Python 和基础数学。Coursera 的 Machine Learning 相对友好，但仍要求 AI 入门与 Python 熟练，建议先完成一门编程课和线性代数，否则梯度下降与正则化部分容易掉队。' },
      { q: 'CS189 和 CS229 怎么选？', a: 'CS189 是伯克利的入门课，要求先修 CS188 与 CS70、100 小时、Python；CS229 是研究生课，更偏理论推导。想先建立直觉选 CS189，想做研究选 CS229，两者难度都是四星。' }
    ],
    en: [
      { q: 'Which machine learning course should I take first?', a: 'Start with Coursera’s Machine Learning: about 100 hours in Python, covering supervised learning, evaluation, and tuning. Move to Stanford CS229 for derivations, but it assumes calculus and probability.' },
      { q: 'What background does CS229 require?', a: 'Calculus, probability, Python, and real mathematical maturity, with roughly 100 hours of work. It is taught through course notes and derivations, and the assignments are not public.' },
      { q: 'Can a beginner learn machine learning?', a: 'You need Python and basic mathematics first. Coursera’s Machine Learning is friendly but still expects some AI background and Python fluency, so finish a programming course and linear algebra beforehand.' },
      { q: 'CS189 or CS229?', a: 'CS189 is Berkeley’s introduction and requires CS188 plus CS70 over about 100 hours. CS229 is a graduate course built on derivations. Choose CS189 for intuition, CS229 for research depth.' }
    ]
  },
  'deep-learning': {
    zh: [
      { q: '深度学习入门学哪门课？', a: '可以先看 Stanford 的 CS230 或台大李宏毅机器学习，80 小时、Python，先修是机器学习基础；想做视觉可以直接看 UMich 的 EECS 498-007，它更偏工程实现与动手训练。' },
      { q: 'CS231n 需要什么基础？', a: '先修写的是机器学习基础，编程语言 Python，预计 80 小时、难度四星。作业要手写卷积与反向传播，最好先熟悉 NumPy 和 PyTorch。' },
      { q: '强化学习课程需要什么先修？', a: 'CS285 明确要求先修 CS188 与 CS189，还需要了解马尔可夫决策过程。课程公式较多，机器学习基础不牢会很难跟上进度。' },
      { q: 'NLP 和图神经网络该学哪门？', a: '自然语言处理看 Stanford 的 CS224n，图数据看 CS224w，两门都要求深度学习基础和 Python、各约 80 小时。按你手头的项目方向选一门即可。' }
    ],
    en: [
      { q: 'Which deep learning course should I start with?', a: 'Stanford CS230 or Hung-yi Lee’s course, both about 80 hours in Python and assuming basic machine learning. For vision specifically, UMich EECS 498-007 is a solid alternative.' },
      { q: 'What does CS231n require?', a: 'Basic machine learning and Python, with about 80 hours and a four-star rating. Assignments have you write convolutions and backpropagation by hand, so learn NumPy and PyTorch first.' },
      { q: 'What are the prerequisites for deep reinforcement learning?', a: 'CS285 explicitly requires CS188 and CS189, plus familiarity with Markov decision processes. The lectures are formula-heavy, so weak machine learning foundations will slow you down quickly.' },
      { q: 'Should I take CS224n or CS224w?', a: 'CS224n covers natural language processing, CS224w covers machine learning on graphs. Both assume deep learning basics and Python, and both run about 80 hours — pick by your project.' }
    ]
  },
  'operating-systems': {
    zh: [
      { q: '操作系统课程先学哪门？', a: '想降低门槛先看南大 OS 或哈工大 OS，分别 150 与 100 小时、以 C 为主；想跟最经典的实验就选 MIT 6.S081，它基于 RISC-V 的 xv6 内核，但实验强度也最高。' },
      { q: 'MIT 6.S081 需要什么基础？', a: '先修写的是体系结构、扎实的 C 语言功底和 RISC-V 汇编，预计 150 小时、难度五星。没有 C 和系统课基础直接做 lab 会非常痛苦。' },
      { q: 'CS162 为什么难？', a: '它要求先修 CS61A、CS61B、CS61C，预计 200 小时以上且上不封顶，用 C 和 x86 汇编实现内核，难度六星，是这批课程里工作量最大的一门。' },
      { q: '没有 C 基础能学操作系统吗？', a: '不建议直接开始。绝大多数课程要求扎实的 C 功底，哈工大 OS 的先修只写 C 语言，可以作为过渡，但仍需先补指针、内存布局和汇编。' }
    ],
    en: [
      { q: 'Which operating systems course should I take first?', a: 'To lower the entry cost, look at NJU OS or HIT OS: 150 and 100 hours, both in C. For the most respected labs, pick MIT 6.S081, which works inside xv6 on RISC-V.' },
      { q: 'What does MIT 6.S081 require?', a: 'Computer architecture, solid C, and RISC-V assembly, with about 150 hours and a five-star rating. Starting the labs without C and systems background is painful.' },
      { q: 'Why is CS162 considered so hard?', a: 'It requires CS61A, CS61B, and CS61C, runs 200 hours and up with no ceiling, and has you build a kernel in C and x86 assembly. It is the heaviest course in this group.' },
      { q: 'Can I take an OS course without C experience?', a: 'Not directly. Nearly every course assumes solid C. HIT OS lists only C as a prerequisite and can serve as a bridge, but you still need pointers, memory layout, and some assembly.' }
    ]
  },
  compilers: {
    zh: [
      { q: '编译原理课程先学哪门？', a: '先学南大编译原理，只需离散数学、约 80 小时、Java 实现，能把前端流程走完；之后再做 CS143 完整的 COOL 编译器并生成 MIPS 汇编。' },
      { q: '学编译原理需要什么基础？', a: '至少要有数据结构与计算机系统基础。CS143 明确要求先修计算机体系结构，PKU、SJTU、USTC 的课程都要求系统基础加 C++ 或 Java 编程能力。' },
      { q: '零基础能直接学 CS143 吗？', a: '不建议。CS143 预计 150 小时，要求体系结构基础，还要用 Java 或 C++ 完成词法、语法、语义、代码生成四个阶段。先补系统课更稳。' },
      { q: '国内的编译原理课怎么选？', a: 'PKU 编译原理实践从空文件夹构建 SysY 到 RISC-V 的编译器，60 小时、自由度最高；南大只需离散数学、80 小时，适合先跑通前端流程；SJTU 与 USTC 用 C++，分别 150 与 100 小时。' }
    ],
    en: [
      { q: 'Which compilers course should I take first?', a: 'Start with NJU’s course: only discrete mathematics required, about 80 hours of Java, and it covers the whole front end. Then attempt CS143 and a full COOL compiler targeting MIPS.' },
      { q: 'What background does compiler study need?', a: 'At minimum data structures and systems fundamentals. CS143 explicitly requires computer architecture, and the PKU, SJTU, and USTC courses all assume systems knowledge plus C++ or Java.' },
      { q: 'Can I jump straight into CS143?', a: 'Not advisable. CS143 runs about 150 hours, assumes computer architecture, and has you write lexing, parsing, semantic analysis, and code generation. Build systems foundations first.' },
      { q: 'How do the Chinese compilers courses differ?', a: 'PKU’s course builds a SysY to RISC-V compiler from an empty folder in about 60 hours with maximum freedom; SJTU and USTC use C++ at 150 and 100 hours and stay closer to a full implementation.' }
    ]
  },
  'computer-architecture': {
    zh: [
      { q: '计算机组成原理课程怎么入门？', a: '从 Nand2Tetris 开始最稳：没有先修要求、约 40 小时，用与非门搭出 CPU 再写编译器和简易 OS，能从门电路一路理解到程序。' },
      { q: 'CS61C 和 Nand2Tetris 有什么区别？', a: '官方建议先修 CS50 或同阶课程，最好有 C 语言基础。课程用 Verilog、MIPS 与 LC3 汇编，100 小时、三星，讲完流水线与存储层次后可以接 ETH 的 Computer Architecture。' },
      { q: 'DDCA 需要什么基础？', a: '不完全相同。Nand2Tetris 与 DDCA 偏数字设计与组成，CS61C 讲程序到硬件的映射并用 RISC-V 实现，Princeton 的 Computer Architecture 更偏体系结构，要求数字逻辑与汇编基础。' },
      { q: '计算机体系结构和组成原理是一回事吗？', a: '不完全相同。DDCA 与 Nand2Tetris 偏组成与数字设计，CS61C 讲程序到硬件的映射，Princeton 的 Computer Architecture 更偏体系结构，要求数字逻辑与汇编基础。' }
    ],
    en: [
      { q: 'How should I start learning computer architecture?', a: 'Begin with Nand2Tetris: no prerequisites, about 40 hours, building a CPU from NAND gates and then a compiler and small OS — the clearest path from gates to programs.' },
      { q: 'What is the difference between CS61C and Nand2Tetris?', a: 'N2T gives a three-star overview from the bottom up. CS61C goes deeper, requires CS61A and CS61B, and uses C and RISC-V to cover pipelining, caches, and virtual memory in 100 hours.' },
      { q: 'What does DDCA assume?', a: 'CS50 or an equivalent course, ideally with C experience. DDCA uses Verilog, MIPS, and LC3 assembly across about 100 hours at three stars, and leads into ETH’s Computer Architecture.' },
      { q: 'Which architecture course is the hardest?', a: 'CS61C demands CS61A and CS61B first and is four stars; ETH Computer Architecture builds on DDCA, adds Verilog and C/C++, and runs about 70 hours and up.' }
    ]
  },
  'computer-networks': {
    zh: [
      { q: '计算机网络课程先学哪门？', a: '想建立整体理解，先看自顶向下方法对应的课程，约 40 小时、几乎无编程门槛；之后再学 CS168 深入路由与传输协议，或直接做 CS144 的协议栈。' },
      { q: 'CS144 需要什么基础？', a: '要求一定的计算机系统基础和 CS106L 级别的 C++，预计 100 小时、难度五星。你要用 C++ 从零实现可靠传输、报文重组与连接管理。' },
      { q: '哪门网络课适合零基础？', a: '自顶向下方法的两个版本都只要求一点计算机系统基础、40 小时、无指定编程语言，是门槛最低的入口；CS168 则要求先修 CS61B。' },
      { q: 'CS168 的作业是什么形式？', a: '三个 Python Project，主题分别是 traceroute、路由和传输，配合伯克利自编的在线教材。难度三星、约 140 小时，侧重 Internet 的设计原则与核心协议。' }
    ],
    en: [
      { q: 'Which networking course should I take first?', a: 'For an overall picture, start with the Top-Down Approach lectures: about 40 hours with almost no coding prerequisite. Then take CS168 for routing and transport, or go straight to CS144.' },
      { q: 'What does CS144 require?', a: 'Some systems fundamentals and CS106L-level C++, with about 100 hours and a five-star rating. You implement reliable transfer, reassembly, and connection management in C++ from scratch.' },
      { q: 'Which networking course suits complete beginners?', a: 'Both Top-Down Approach versions ask only for basic systems knowledge, run about 40 hours, and specify no programming language. CS168 by contrast requires CS61B first.' },
      { q: 'What are CS168 assignments like?', a: 'Three Python projects on traceroute, routing, and transport, alongside Berkeley’s own online textbook. It is a three-star, roughly 140-hour course focused on Internet design principles.' }
    ]
  },
  'computer-systems-basics': {
    zh: [
      { q: '系统基础课先学哪门？', a: '已有数据结构基础可以从 COS217 入手，110 小时、C 与 ARM64 汇编；想一次学透就选 CSAPP，但它要求先修 CS61A 与 CS61B，Project 难度很高，做完才算真正理解程序的每一层。' },
      { q: 'CSAPP 需要什么基础？', a: '官方先修是 CS61A 与 CS61B，编程语言是 C，预计 150 小时、难度五星。没有 C 和数据结构基础直接读，会卡在汇编与链接章节。' },
      { q: 'CS110 和 CSAPP 有什么区别？', a: 'CSAPP 覆盖更广，从汇编一路讲到网络与并发，Project 强度大；CS110 更聚焦系统编程，用 C/C++ 配合 Unix、GDB、Valgrind 讲进程、内存与并发，150 小时，对调试能力要求极高。' }
    ],
    en: [
      { q: 'Which systems course should I start with?', a: 'With data structures done, COS217 is a reasonable start at about 110 hours in C and ARM64 assembly. CSAPP goes further but requires CS61A and CS61B and has hard projects.' },
      { q: 'What background does CSAPP need?', a: 'CS61A and CS61B, plus C as the working language, with about 150 hours and a five-star rating. Without C and data structures you will stall in the assembly and linking chapters.' },
      { q: 'CS110 or CSAPP?', a: 'CSAPP covers more ground, from assembly through networking and concurrency. CS110 focuses on systems programming with C/C++ plus Unix, GDB, and Valgrind, and demands stronger debugging skills.' }
    ]
  },
  'data-science': {
    zh: [
      { q: '数据科学入门学哪门课？', a: '伯克利的 Data100 是最合适的第一门，80 小时、Python，讲数据清洗、特征提取、可视化与基本的推理和机器学习，还会用熟 Pandas 与 NumPy。' },
      { q: 'Data100 需要什么基础？', a: '先修写的是 Data8、CS61A 和线性代数。没有编程经验建议先学 CS61A，否则 Pandas 作业和可视化部分会很吃力；线性代数可以边学边补，不必等全部学完。' },
      { q: '数据科学和机器学习先学哪个？', a: '先学 Data100 建立数据处理与评估的直觉，再学机器学习课程。数学可以边学边补线性代数，不必等全部学完才动手写代码。' }
    ],
    en: [
      { q: 'Which data science course should I take first?', a: 'Berkeley Data100: about 80 hours in Python, covering cleaning, feature extraction, visualisation, and the basics of inference and machine learning while you get fluent in Pandas and NumPy.' },
      { q: 'What does Data100 assume?', a: 'Data8, CS61A, and linear algebra. Without programming experience, start with CS61A — otherwise the Pandas assignments and the visualisation work become a struggle.' },
      { q: 'Data science or machine learning first?', a: 'Take Data100 first to build intuition for handling data and evaluating results, then move to a machine learning course. You can study linear algebra alongside rather than before.' }
    ]
  },
  'advanced-machine-learning': {
    zh: [
      { q: '机器学习进阶课程先学哪门？', a: '偏概率建模先学 CMU 10-708 的图模型，偏理论证明先学 CS229M。两门都假设你已经完整学过机器学习与深度学习，不要当作第一门 ML 课。' },
      { q: '这些课需要什么数学基础？', a: '至少要熟悉概率论、线性代数与凸优化，统计推断和贝叶斯方法几乎是必修。CS229M 与 STA4273 对证明能力要求最高，数学没把握建议先补一门统计课。' },
      { q: '零基础可以直接读图模型吗？', a: '不建议。CMU 10-708 的先修写明是机器学习、深度学习与强化学习，直接上手会卡在变分推断与 MCMC。先完成一门基础 ML 课再回来更稳。' }
    ],
    en: [
      { q: 'Which advanced machine learning course comes first?', a: 'For probabilistic modelling, CMU 10-708 on graphical models; for theory, CS229M. Both assume you have already completed machine learning and deep learning, so neither is a first ML course.' },
      { q: 'What mathematics do these courses assume?', a: 'Probability, linear algebra, and convex optimisation at minimum, with statistical inference and Bayesian methods effectively required. CS229M and STA4273 demand the strongest proof skills.' },
      { q: 'Can I start with graphical models directly?', a: 'Not really. CMU 10-708 lists machine learning, deep learning, and reinforcement learning as prerequisites, and variational inference is a hard first wall. Finish a core ML course first.' }
    ]
  },
  'advanced-mathematics': {
    zh: [
      { q: '计算机专业的数学课应该先学哪门？', a: '先学 CS70 或 MIT 6.042J。CS70 没有先修要求、约 60 小时，覆盖离散数学与概率，每个模块都会落到具体算法上；6.042J 内容相近，但更强调在计算机科学里的用法。' },
      { q: '凸优化需要什么基础？', a: 'Stanford EE364A 要求 Python、微积分、线性代数、概率论，最好还有一点数值分析，预计 150 小时。没有这些基础建议先补线性代数和概率。' },
      { q: '离散数学和概率论要分开学吗？', a: '不必。CS70 把两者放在一门课里讲，每个模块都会对应到实际算法；学完再按方向补 CS126 这类更严格的概率论课程即可。' }
    ],
    en: [
      { q: 'Which mathematics course should a CS student start with?', a: 'CS70 or MIT 6.042J. CS70 has no prerequisites, takes about 60 hours, and covers discrete mathematics and probability; 6.042J teaches similar material with a stronger CS emphasis.' },
      { q: 'What does convex optimisation require?', a: 'Stanford EE364A expects Python, calculus, linear algebra, probability, and ideally some numerical analysis, with about 150 hours of work. Without those, revise linear algebra and probability first.' },
      { q: 'Should discrete mathematics and probability be separate?', a: 'Not necessarily. CS70 teaches both in one course and ties each topic to a real algorithm. Afterwards you can add a stricter probability course such as CS126.' }
    ]
  },
  'artificial-intelligence': {
    zh: [
      { q: 'AI 入门课程推荐先学哪门？', a: '想系统学选 CS188，50 小时、Python，先修是 CS70；只想先试水选 Harvard 的 CS50 AI，30 小时、12 个编程作业，只需基本概率论和 Python。两门都不要求先学过机器学习。' },
      { q: 'CS188 一定要先学 CS70 吗？', a: '官方先修写的是 CS70。课程里的马尔可夫决策过程、贝叶斯网络会用到条件独立等概率工具，没学过建议先补 CS70 的概率部分再开始。' },
      { q: '想理解大模型原理该学哪门？', a: '可以看 Karpathy 的《神经网络：从零到英雄》，约 19 小时，要求基本 Python 和深度学习概念，会带你手写反向传播并实现一个 GPT，偏工程实现。' }
    ],
    en: [
      { q: 'Which AI course should I start with?', a: 'For a systematic treatment, CS188: about 50 hours in Python, requiring CS70. To test the waters, Harvard CS50 AI takes roughly 30 hours with twelve assignments and needs only basic probability and Python.' },
      { q: 'Do I need CS70 before CS188?', a: 'CS70 is the listed prerequisite. Markov decision processes and Bayesian networks rely on conditional independence and probability, so revise that part of CS70 first if you have not seen it.' },
      { q: 'Which course explains how language models work?', a: 'Neural Networks: Zero to Hero, about 19 hours, assuming basic Python and deep learning concepts. It walks through backpropagation by hand and builds a GPT from scratch — engineering rather than theory.' }
    ]
  },
  'computer-graphics': {
    zh: [
      { q: '图形学课程先学哪门？', a: '先学 GAMES101：要求线性代数、高数与 C++，约 80 小时，一次讲完光栅化、几何、光的传播与动画模拟，它也是 GAMES202 的先修，作业是自己写一个渲染器。' },
      { q: 'GAMES202 和 GAMES103 怎么选？', a: '做实时渲染与光线追踪选 GAMES202，要先学完 GAMES101；做物理仿真选 GAMES103，需要大学物理、C# 与基础图形知识。两门难度都是四星，作业都要自己写代码验证效果。' },
      { q: '零基础可以学图形学吗？', a: '至少要会 C++ 并掌握线性代数。GAMES101 的先修写的就是线性代数、高等数学和 C++，缺哪项都建议先补，否则作业里的矩阵变换很吃力；CMU 15-462 还要求向量微积分。' }
    ],
    en: [
      { q: 'Which graphics course should I take first?', a: 'GAMES101: it asks for linear algebra, some calculus, and C++, runs about 80 hours, and covers rasterisation, geometry, light transport, and animation in one pass. GAMES202 builds on it.' },
      { q: 'GAMES202 or GAMES103?', a: 'Choose GAMES202 for real-time rendering and ray tracing, which requires GAMES101 first. Choose GAMES103 for physically based simulation, which assumes college physics, C#, and basic graphics.' },
      { q: 'Can I study graphics with no background?', a: 'You need C++ and linear algebra at minimum. GAMES101 lists linear algebra, advanced mathematics, and C++, and skipping them makes the matrix transformations in the assignments painful.' }
    ]
  },
  'machine-learning-systems': {
    zh: [
      { q: '机器学习系统课程先学哪门？', a: '先学 CMU 10-414，100 小时、Python 与 C++，从自动微分开始实现一个迷你深度学习框架；它要求系统入门、深度学习入门和基础数学。' },
      { q: '15-442 和 10-414 有什么区别？', a: '10-414 侧重框架与自动微分，难度三星，适合先建立整体认识；15-442 覆盖 GPU 编程、分布式训练与机器学习编译，要写 CUDA，100 小时以上、难度五星。' },
      { q: '学 ML 系统需要先学体系结构吗？', a: '需要。CMU 15-442 与 15-779 都要求系统基础，内容涉及 GPU 编程、内存层次与算子优化，先修一门体系结构或 CSAPP 级别的课程会顺利很多，尤其是缓存与并发的直觉。' }
    ],
    en: [
      { q: 'Which ML systems course should I start with?', a: 'CMU 10-414: about 100 hours in Python and C++, building a miniature deep learning framework starting from automatic differentiation. It assumes an intro systems course, intro deep learning, and basic maths.' },
      { q: 'CMU 15-442 or 10-414?', a: '10-414 focuses on frameworks and automatic differentiation at three stars. 15-442 adds GPU programming, distributed training, and ML compilation with CUDA, runs past 100 hours, and is five stars.' },
      { q: 'Do I need computer architecture first?', a: 'Yes for the harder ones. CMU 15-442 and 15-779 assume systems fundamentals and cover GPUs, memory hierarchies, and kernel optimisation, so an architecture or CSAPP-level course helps a lot.' }
    ]
  },
  'parallel-distributed-systems': {
    zh: [
      { q: '并行与分布式先学哪个？', a: '先学 CMU 15-418 / Stanford CS149，150 小时、C++，要求先修体系结构并熟悉 C++；有了性能直觉再学 MIT 6.824 的一致性与容错，顺序反了很容易被 Raft 的竞态调试劝退。' },
      { q: 'MIT 6.824 需要什么基础？', a: '先修是计算机体系结构和并行编程，用 Go 实现 MapReduce、Raft 与分片键值服务，预计 200 小时、难度六星，调试量非常大，Go 需要提前熟悉。' },
      { q: '学分布式一定要先学并行吗？', a: '不一定，但强烈建议。6.824 的 lab 涉及并发与性能，没有并行编程经验容易卡在竞态和超时上，CS149 正好补这部分直觉。' }
    ],
    en: [
      { q: 'Parallel or distributed first?', a: 'Take CMU 15-418 / Stanford CS149 first: about 150 hours in C++, assuming computer architecture and working C++. Then move to MIT 6.824 for consistency and fault tolerance.' },
      { q: 'What does MIT 6.824 require?', a: 'Computer architecture and parallel programming experience. You implement MapReduce, Raft, and a sharded key-value service in Go over roughly 200 hours, and the debugging load is severe.' },
      { q: 'Do I need parallel computing before distributed systems?', a: 'Not strictly, but strongly advised. The 6.824 labs involve concurrency and performance, and without parallel programming experience races and timeouts become blockers.' }
    ]
  },
  'programming-languages-design': {
    zh: [
      { q: '程序语言课程先学哪门？', a: '先学剑桥的 Semantics of Programming Languages，20 到 30 小时、只需基础离散数学，用 OCaml 讲操作语义；之后再看 Stanford CS242 的类型系统与实现，两门都要求动手写解释器。' },
      { q: 'CS242 需要什么基础？', a: '先修是对计算机系统和编程语言理论的初步了解，编程语言是 OCaml 与 Rust，预计 60 小时、难度四星。没有函数式编程经验需要额外补。' },
      { q: '软件分析算程序语言方向吗？', a: '算。南大软件分析从抽象语法树、控制流图讲到数据流与指针分析，Java 实现、60 小时；北大版本内容相近但难度四星，要求更高。' }
    ],
    en: [
      { q: 'Which programming languages course comes first?', a: 'Cambridge’s Semantics of Programming Languages: 20 to 30 hours, only basic discrete mathematics, and operational semantics in OCaml. Then try Stanford CS242 for type systems and implementation.' },
      { q: 'What does CS242 assume?', a: 'Some familiarity with computer systems and programming language theory, with OCaml and Rust as the working languages, about 60 hours at four stars. No functional programming experience means extra work.' },
      { q: 'Does software analysis count as programming languages?', a: 'Yes. NJU’s course moves from syntax trees and control flow graphs to dataflow and pointer analysis in Java over 60 hours; PKU’s version covers similar ground at a harder four stars.' }
    ]
  },
  'software-engineering': {
    zh: [
      { q: '软件工程课程推荐哪门？', a: '想提升代码质量学 MIT 6.031，100 小时、Java，围绕无 bug、易修改、可理解三个目标讲抽象、规格与测试；想学敏捷与云部署选 UCB CS169。' },
      { q: 'MIT 6.031 需要什么基础？', a: '只需掌握至少一门编程语言，编程语言是 Java，预计 100 小时、难度四星。有数据结构基础会更顺，因为课程强调抽象与规格设计。' },
      { q: '软件工程课一定要组队做项目吗？', a: '不一定。CS169 用 Ruby/Rails 走完整的敏捷交付流程，可能涉及团队协作；6.031 以个人练习和代码质量为主；CMU 17-803 则偏实证研究方法。' }
    ],
    en: [
      { q: 'Which software engineering course should I take?', a: 'For code quality, MIT 6.031: about 100 hours in Java, organised around freedom from bugs, ease of change, and understandability. For agile practice and cloud delivery, take UCB CS169.' },
      { q: 'What does MIT 6.031 require?', a: 'One programming language, with Java as the working language, about 100 hours at four stars. Data structures experience helps, since the course leans on abstraction and specification design.' },
      { q: 'Do these courses require team projects?', a: 'Not all. CS169 runs a full agile delivery process with Ruby on Rails; 6.031 centres on individual exercises and code quality; CMU 17-803 is about empirical research methods.' }
    ]
  },
  'system-security': {
    zh: [
      { q: '系统安全课程先学哪门？', a: '想从系统侧入手学 MIT 6.858，150 小时，围绕 Zoobar 应用做缓冲区溢出与权限分离实验；想覆盖更广选 UCB CS161，但要先修 CS61A、CS61B、CS61C 三件套。' },
      { q: '零基础可以学安全吗？', a: '可以看 SEED Labs：没有先修要求，提供虚拟机与 Docker 攻防环境和开源讲义，覆盖软件、网络、Web、操作系统与移动安全，约 150 小时。' },
      { q: '安全课需要什么编程基础？', a: '多数需要 C、汇编与操作系统基础。6.858 要求体系结构和对系统的初步了解，CS161 要求 CS61 三件套，MIT 6.1600 则只需离散数学、编程与系统基础。' }
    ],
    en: [
      { q: 'Which systems security course should I take first?', a: 'MIT 6.858 for the systems side: about 150 hours of labs against the Zoobar application, covering buffer overflows and privilege separation. UCB CS161 covers more but requires CS61A, CS61B, CS61C.' },
      { q: 'Can a beginner study security?', a: 'SEED Labs is the entry point: no prerequisites, virtual machine and Docker lab environments, open lecture notes, and topics from software and web to OS and mobile security in about 150 hours.' },
      { q: 'What programming background do security courses need?', a: 'Most assume C, assembly, and operating systems. 6.858 asks for architecture and basic systems knowledge, CS161 the CS61 sequence, while MIT 6.1600 needs discrete maths, programming, and systems basics.' }
    ]
  },
  'web-development': {
    zh: [
      { q: 'Web 开发课程先学哪门？', a: '先学 Helsinki 的 Full Stack open，难度两星、学时因人而异，用 React 与 Node.js 做单页应用和 REST API；它只要求良好的编程能力与 Git 基础，作业做完就能看到应用跑起来。' },
      { q: 'Full Stack open 需要什么基础？', a: '先修写明要有良好的编程技能、基本网络编程与数据库知识，并会用 Git。课程用 JavaScript，没写过 JS 建议先补语法与异步编程。' },
      { q: '只学前端该看哪门？', a: '想只学前端可以看 CS571，主题是用 React 与 React Native 构建界面，每周约 2 小时讲座加 4 到 10 小时作业，难度三星、共 12 周；想补全栈再看 CS142 或 Full Stack open。' }
    ],
    en: [
      { q: 'Which web development course should I start with?', a: 'Helsinki’s Full Stack open: two stars with open-ended hours, building single-page apps and REST APIs in React and Node.js. It asks only for solid programming skills and Git basics.' },
      { q: 'What does Full Stack open assume?', a: 'Good programming skills, basic networking and database knowledge, and working Git knowledge. The course is in JavaScript, so learn syntax and asynchronous programming first if JS is new.' },
      { q: 'Which course is best for front end only?', a: 'CS571 covers building UI with React and React Native, roughly two hours of lectures and four to ten hours of assignments weekly. Add CS142 or Full Stack open later for the backend picture.' }
    ]
  },
  'database-systems': {
    zh: [
      { q: '数据库课程先学哪门？', a: '想系统理解内部实现，先学 CMU 15-445，100 小时、C++，四个 Project 依次实现缓冲池、B+ 树、查询执行与并发控制；想覆盖 SQL 优化和故障恢复可以选 CS186。' },
      { q: '15-445 需要什么基础？', a: '官方先修是 C++、数据结构与算法，以及 CMU 15-213（CSAPP）一级的系统基础，预计 100 小时、难度四星。没有 C++ 与系统课基础会非常吃力。' },
      { q: '只想学 SQL 该看哪门？', a: '这批课都以数据库内核为主。CS186 的编程作业会练到 SQL 与查询优化，相对实用；如果只写查询语句，建议先补 SQL 基础再跟课。' },
      { q: '零基础可以学数据库系统吗？', a: 'Caltech 的 CS122 与 Stanford 的 CS346 都没有硬性先修要求，但难度五星、各约 150 小时，用 Java 或 C++ 从零实现数据库，仍需要扎实的编程能力，不建议作为第一门数据库课。' }
    ],
    en: [
      { q: 'Which database course should I take first?', a: 'For internals, CMU 15-445: about 100 hours in C++, with four projects covering a buffer pool, a B+ tree, query execution, and concurrency control. For a wider sweep including SQL optimisation and recovery, CS186.' },
      { q: 'What does 15-445 require?', a: 'C++, data structures and algorithms, and CSAPP-level systems knowledge, roughly 100 hours at four stars. Without C++ and a systems course the projects are brutal.' },
      { q: 'Which course is best if I only want SQL?', a: 'These courses all centre on the database engine. CS186’s projects exercise SQL and query optimisation more directly; if you only write queries, learn SQL basics first.' },
      { q: 'Can a beginner take a database systems course?', a: 'Caltech CS122 and Stanford CS346 list no hard prerequisites, but both are five stars at about 150 hours and have you implement a database in Java or C++. Solid programming skills are still required.' }
    ]
  },
  'deep-generative-models': {
    zh: [
      { q: '生成模型课程先学哪门？', a: '先学 MIT 6.S184，约 20 小时，从随机微分方程讲扩散与流匹配，先修只要深度学习和微积分，难度四星；想进大模型系统方向再学 CMU 15-779。' },
      { q: '扩散模型需要什么数学基础？', a: '需要微积分和线性代数。6.S184 的先修写明要熟悉微积分，课程大量使用微分方程与概率记号，最好还能读懂基础的随机过程。' },
      { q: '大模型课程怎么选？', a: '偏系统与性能选 CMU 11-868 和 15-779，涉及 GPU 编程、分布式训练与推理加速；偏算法与建模选 CMU 11-667 与 11-711，后者还需要一定的 NLP 背景。' },
      { q: '零基础可以学这些课吗？', a: '不建议。这些课默认你已学过深度学习并有 PyTorch 经验，15-779 还建议了解 CUDA 与机器学习基础。先完成一门深度学习课再进入会稳很多。' }
    ],
    en: [
      { q: 'Which generative models course should I start with?', a: 'MIT 6.S184: about 20 hours, deriving diffusion and flow matching from stochastic differential equations, with only deep learning and calculus as prerequisites. Move to CMU 15-779 for the systems side.' },
      { q: 'What mathematics do diffusion models need?', a: 'Calculus and linear algebra. 6.S184 explicitly asks for comfort with calculus and leans heavily on differential equations and probability notation; basic stochastic processes help.' },
      { q: 'How do I choose among the LLM courses?', a: 'For systems and performance, CMU 11-868 and 15-779 cover GPU programming, distributed training, and inference acceleration. For modelling, CMU 11-667 and 11-711 cover architecture, training, and evaluation.' },
      { q: 'Can I take these with no background?', a: 'Not really. They assume deep learning coursework and PyTorch experience, and 15-779 also suggests CUDA and machine learning basics. Finish a deep learning course first.' }
    ]
  },
  'electronics-basics': {
    zh: [
      { q: '电子基础课程从哪门开始？', a: 'EE16A&B 没有先修要求，是伯克利电子系的大一入门课，150 小时但体系完整、lab 有远程版本，适合从零了解电路如何采集信息并做预测。' },
      { q: '信号与系统需要什么数学基础？', a: 'MIT 6.007 要求微积分和线性代数，50 到 70 小时、难度两星，是理解傅里叶变换与系统响应的最短路径；UCB EE120 更严格，还要求 CS61A、CS70 与概率基础，100 小时、五星。' },
      { q: '计算机专业需要学电子基础吗？', a: '不是必修。但想读懂硬件、信号处理或做嵌入式方向，EE16 与信号与系统能补上从物理层到算法的直觉，通常放在系统基础课之后学。' }
    ],
    en: [
      { q: 'Which electronics course should I start with?', a: 'EE16A&B: no prerequisites, Berkeley’s freshman electrical engineering sequence, 150 hours but coherent, with remote labs. It teaches how circuits gather information and support prediction.' },
      { q: 'What mathematics do signals and systems courses need?', a: 'MIT 6.007 asks for calculus and linear algebra over 50 to 70 hours at two stars. UCB EE120 is stricter: it also expects CS61A, CS70, and probability, runs 100 hours, and is five stars.' },
      { q: 'Does a CS student need electronics?', a: 'It is not compulsory, but if you care about hardware, signal processing, or embedded work, EE16 and signals and systems fill in the physics-to-algorithm layer. Take them after systems basics.' }
    ]
  },
  'essential-tools': {
    zh: [
      { q: '编程工具应该先学哪个？', a: '先学 Git，再学 Vim。Git 的内部模型需要读一遍 Pro Git 前几章才能理解，Vim 可以靠日常使用慢慢熟练，两者都不建议一知半解就上手。' },
      { q: 'CMake 和 GNU Make 什么区别？', a: 'Make 更底层，用 Makefile 描述依赖与构建命令；CMake 生成各平台的构建文件再调用 Make 等工具。建议先学 Make 再学 CMake，之后读懂开源 C/C++ 项目的编译流程会轻松很多。' },
      { q: 'Docker 值得花时间学吗？', a: '值得。配环境是最消耗学习热情的一步，Docker 用容器把应用和依赖一起打包，可以在不同机器上直接运行，官方文档加动手练习就够入门。' },
      { q: '写课程报告需要学 LaTeX 吗？', a: '建议学。LaTeX 在公式、交叉引用和参考文献上远优于普通编辑器，计算机方向的论文与报告基本都用它，入门成本不高但长期收益明显。' }
    ],
    en: [
      { q: 'Which developer tool should I learn first?', a: 'Git, then Vim. Git’s internal model is worth reading the first chapters of Pro Git for, while Vim rewards daily repetition. Starting either one half-understood causes avoidable damage.' },
      { q: 'What is the difference between CMake and GNU Make?', a: 'Make is lower level: a Makefile describes dependencies and build commands. CMake generates platform-specific build files that then call Make or another build system. Learn Make first.' },
      { q: 'Is Docker worth the time?', a: 'Yes. Environment setup drains enthusiasm faster than anything else, and Docker packages an application with its dependencies so it runs identically elsewhere. The official docs plus practice are enough.' },
      { q: 'Do I need LaTeX for course reports?', a: 'It is worth learning. LaTeX handles formulas, cross-references, and bibliographies far better than word processors, and computer science reports and papers almost all use it.' }
    ]
  },
  'mathematics-basics': {
    zh: [
      { q: '计算机专业要先学哪门数学？', a: '先学线性代数。MIT 18.06 由 Gilbert Strang 讲授，难度三星、学时因人而异，教材被清华采用；微积分可以按需复习 MIT 的课程，离散与概率则另外看 CS70。' },
      { q: 'MIT 18.06 需要什么基础？', a: '先修只写了英文，也就是能听懂英文授课。课程从向量与矩阵讲起，难度三星，学时因人而异，适合边看公开视频边做题。' },
      { q: '信息论值得单独学吗？', a: '如果对熵、编码或机器学习理论感兴趣，值得。MIT 6.050J 没有先修要求、约 100 小时，把信息与熵当作独立专题讲清楚。' }
    ],
    en: [
      { q: 'Which mathematics course should a CS student take first?', a: 'Linear algebra. MIT 18.06, taught by Gilbert Strang with a textbook adopted at Tsinghua, is rated three stars and its time commitment varies. Revise calculus from the MIT course as needed.' },
      { q: 'What does MIT 18.06 assume?', a: 'Only English — the listed prerequisite is literally the language. The course starts from vectors and matrices, is rated three stars, and suits working through the public lectures with exercises.' },
      { q: 'Is information theory worth studying separately?', a: 'If entropy, coding, or machine learning theory interest you, yes. MIT 6.050J has no prerequisites and takes about 100 hours, treating information and entropy as a self-contained topic.' }
    ]
  }
}