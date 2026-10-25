interface GuideText {
  title: string
  description: string
  prerequisites: string
  steps: string[]
  pitfalls: string
  version: string
}

export interface CourseGuide {
  updatedAt: string
  source: string
  related: string[]
  en: GuideText
  zh: GuideText
}

export const courseGuides: Record<string, CourseGuide> = {
  'data-structures-algorithms/CS61B': {
    updatedAt: '2026-10-14',
    source: 'https://sp26.datastructur.es/',
    related: ['programming-introduction/python/CS61A', 'computer-architecture/CS61C'],
    en: {
      title: 'CS61B: Java, Data Structures & Self-Study Guide',
      description: 'Study Berkeley CS61B with Java preparation, data structures, project guidance, official resources, and a suggested path from CS61A to CS61C.',
      prerequisites: 'Be comfortable with functions, recursion, and basic programming. CS61A is a useful preparation; learn Java syntax alongside the opening exercises.',
      steps: ['Set up Java, Git, and the course testing tools; finish the introductory exercises.', 'Implement lists, trees, and hash tables, then explain their invariants and running costs.', 'Work through the projects in your chosen semester and add tests for edge cases before moving on.'],
      pitfalls: 'Passing a sample test is not enough. Check empty collections, resizing, aliasing, and the difference between an interface and its implementation.',
      version: 'The linked Spring 2026 site is a fixed reference. Keep the skeleton code, project specifications, and tests from the same semester; grading access varies by offering.'
    },
    zh: {
      title: 'CS61B 数据结构：Java 项目与自学路线',
      description: '伯克利 CS61B 自学指南：从 Java 准备到链表、树、哈希表与课程项目，整理官方资料、先修要求和衔接 CS61A、CS61C 的学习路线。',
      prerequisites: '建议先掌握函数、递归和基本编程，CS61A 可作为前置课程。Java 语法可以配合开课阶段的练习补齐。',
      steps: ['配置 Java、Git 与课程测试工具，完成入门练习。', '亲手实现链表、树和哈希表，解释它们的不变量与操作复杂度。', '按所选学期推进项目，为边界条件编写测试，再进入下一阶段。'],
      pitfalls: '不要只验证样例。重点检查空集合、扩容、引用共享，以及接口与实现的区别。',
      version: '此处以 Spring 2026 官方站点为固定参考。项目要求、骨架代码和测试应使用同一学期；不同版本的评分服务开放范围可能不同。'
    }
  },
  'programming-introduction/python/CS61A': {
    updatedAt: '2026-10-14',
    source: 'https://cs61a.org/',
    related: ['programming-introduction/c/CS50', 'data-structures-algorithms/CS61B'],
    en: {
      title: 'CS61A: Python, Scheme & Programming Abstractions',
      description: 'Learn Berkeley CS61A with a self-study plan for Python, recursion, data abstraction, Scheme, and SQL, plus official exercises and follow-on courses.',
      prerequisites: 'No prior course is required, but steady practice matters. If programming and debugging are both new, start with CS50 or a short Python introduction.',
      steps: ['Practice Python expressions, functions, and environment diagrams.', 'Use small examples to understand recursion, higher-order functions, and data abstraction.', 'Complete the chosen offering’s projects and connect the ideas across Python, Scheme, and SQL.'],
      pitfalls: 'Trace evaluation by hand before running code. Keep the return value of a function separate from what it prints, and identify the base case in recursive programs.',
      version: 'The official homepage follows the current offering. Choose one semester and keep its homework, projects, and supporting materials together.'
    },
    zh: {
      title: 'CS61A 自学指南：Python、递归与程序抽象',
      description: '伯克利 CS61A 学习路线：Python、递归、数据抽象、Scheme 与 SQL，附官方练习入口、常见难点及 CS50、CS61B 衔接建议。',
      prerequisites: '课程不要求前置课程，但需要持续练习。若编程和调试都完全陌生，可以先学习 CS50 或基础 Python。',
      steps: ['练习 Python 表达式、函数和环境图。', '用小例子理解递归、高阶函数与数据抽象。', '完成所选学期的项目，比较 Python、Scheme 与 SQL 表达问题的方式。'],
      pitfalls: '运行代码前先手动推演。分清返回值与打印结果，为递归写出明确的终止条件。',
      version: '官方首页随学期更新。建议选定一个学期，使用配套的作业、项目和教材章节，避免混用要求。'
    }
  },
  'operating-systems/MIT6.S081': {
    updatedAt: '2026-10-14',
    source: 'https://pdos.csail.mit.edu/6.1810/',
    related: ['computer-architecture/CS61C', 'computer-systems-basics/CSAPP'],
    en: {
      title: 'MIT 6.S081 / 6.1810: xv6 Operating Systems Guide',
      description: 'Prepare for MIT 6.S081 / 6.1810 with C and RISC-V foundations, an xv6 lab study plan, debugging advice, and links to the official course materials.',
      prerequisites: 'Practice C pointers, memory layout, and basic RISC-V assembly. Computer architecture knowledge helps you follow the boundary between hardware and the kernel.',
      steps: ['Build and boot xv6, then trace a system call from user space into the kernel.', 'Read the relevant xv6 chapter before each lab and draw the affected data structures.', 'Test one change at a time; explain how memory, locking, and process state interact before extending the kernel.'],
      pitfalls: 'A bug may appear far from its cause. Track ownership and lock ordering, and distinguish virtual addresses from physical addresses when debugging.',
      version: 'The course is now numbered 6.1810. Historical 6.S081 materials remain useful, but lab branches, instructions, and the xv6 book must match the chosen offering.'
    },
    zh: {
      title: 'MIT 6.S081 / 6.1810 操作系统与 xv6 实验指南',
      description: 'MIT 6.S081 / 6.1810 自学路线：C 与 RISC-V 先修准备、xv6 源码阅读、操作系统实验和调试方法，附官方课程及后续学习资源。',
      prerequisites: '先熟悉 C 指针、内存布局与基础 RISC-V 汇编。具备计算机组成知识，更容易理解硬件与内核的边界。',
      steps: ['编译并启动 xv6，追踪一次从用户态进入内核的系统调用。', '每次实验前阅读对应的 xv6 章节，画出涉及的数据结构。', '每次只验证一项改动，理清内存、锁与进程状态如何配合，再扩展内核。'],
      pitfalls: '错误出现的位置可能不是根因。调试时记录资源归属和加锁顺序，并区分虚拟地址与物理地址。',
      version: '课程现使用 6.1810 编号。历史 6.S081 材料仍可用于学习，但实验分支、题目说明和 xv6 教材应与所选学期一致。'
    }
  },
  'programming-introduction/c/CS50': {
    updatedAt: '2026-10-14',
    source: 'https://cs50.harvard.edu/x/',
    related: ['programming-introduction/python/CS61A', 'data-structures-algorithms/CS61B'],
    en: {
      title: 'Harvard CS50x: Computer Science Self-Study Guide',
      description: 'Start Harvard CS50x with a practical plan for C, algorithms, Python, SQL, and the final project, including preparation advice and official resources.',
      prerequisites: 'No programming background is needed. Allow time for problem sets as well as lectures, and practice reading compiler errors from the beginning.',
      steps: ['Follow the introductory programming material and solve small problems independently.', 'Work through C, memory, and algorithms before moving to Python and SQL.', 'Use the final project to combine what you learned; write down the problem, scope, and tests before building.'],
      pitfalls: 'Watching a solution can hide gaps in understanding. Reduce difficult problem sets to smaller cases and use a debugger to explain each step.',
      version: 'Use the year shown on the official CS50x site for problem-set instructions and submission policies. Archived years may use different assignments.'
    },
    zh: {
      title: '哈佛 CS50x 自学指南：编程入门与项目路线',
      description: '零基础学习哈佛 CS50x：整理 C、算法、Python、SQL 与最终项目的学习顺序，提供官方资源、作业练习建议和后续课程路线。',
      prerequisites: '不要求编程背景。除了观看讲座，也要为习题留出时间，从一开始就练习阅读编译器报错。',
      steps: ['跟随入门内容学习编程，并独立完成小问题。', '先练习 C、内存与算法，再推进 Python 和 SQL。', '通过最终项目串联所学，动手前写清问题、范围和验证方法。'],
      pitfalls: '看懂答案不代表能够独立解决问题。把困难习题拆成小案例，用调试器解释程序的每一步。',
      version: '以 CS50x 官方网站标明的年份为准，使用对应的习题要求与提交说明；归档年份的作业可能不同。'
    }
  },
  'computer-architecture/CS61C': {
    updatedAt: '2026-10-23',
    source: 'https://cs61c.org/',
    related: ['data-structures-algorithms/CS61B', 'computer-systems-basics/CSAPP', 'operating-systems/MIT6.S081', 'parallel-distributed-systems/CS149'],
    en: {
      title: 'CS61C Study Guide: Prerequisites, Projects & Textbook',
      description: 'Berkeley CS61C is the third course of the CS61 series and the one that finally explains how a C program becomes RISC-V assembly running on real silicon. The material covers assembly programming, datapath design, pipelining, caches, virtual memory, and concurrency, which is why the course is rated four stars of difficulty and estimated at roughly one hundred hours. Four projects attack different layers of the machine: a C warm-up game, a fully connected neural network hand-written in RISC-V assembly for MNIST digits, a two-stage pipelined CPU built in Logisim, and a small NumPy replacement optimised with OpenMP and SIMD. The Summer 2026 site hosts the current labs and calendar, while the Summer 2020 and Fall 2020 recordings on YouTube and Bilibili match the older project set. It suits students who already finished CS61A and CS61B, and pairs naturally with CSAPP when you want the operating-system side of the same story.',
      prerequisites: 'CS61A and CS61B are the stated prerequisites: you should already write recursive programs comfortably and know how to use a debugger before the C and assembly work begins.',
      steps: ['Rebuild your C and pointer fundamentals first, then use one early lab to get comfortable with the course build, gdb, and its test scripts.', 'When the Summer 2020 or Fall 2020 recordings reach RISC-V, hand-write the small assembly exercises and treat the MNIST neural network project as the real checkpoint.', 'Study pipelining, caches, and virtual memory alongside the Logisim project, drawing the datapath and control signals before wiring anything.', 'Finish with the OpenMP and SIMD project, measuring speedup against the naive version instead of only making the tests pass.'],
      pitfalls: 'A single mis-wired connection in Logisim can break the entire pipeline, so debug the datapath with waveforms and single stepping before you search for a finished project online.',
      version: 'Summer 2026 is the current offering. The project list here follows the public Fall 2020 edition, and current semesters may reorder or replace the projects.'
    },
    zh: {
      title: 'CS61C 计算机组成中文资料：先修、难度与教材',
      description: '伯克利 CS61C 中文课程资料：C 语言如何变成 RISC-V 汇编并在 CPU 上执行，覆盖汇编、流水线、Cache 与虚存。四个 Project 从生命游戏做到汇编神经网络和 Logisim CPU，附先修、难度与官方视频对照。',
      prerequisites: '官方先修要求是 CS61A 与 CS61B：开始写 C 和汇编之前，你应当能熟练写递归程序，并会用调试器定位问题。',
      steps: ['先补齐 C 语言与指针基础，用一个早期 Lab 熟悉课程构建方式、gdb 与测试脚本。', '跟着 Su20 或 Fa20 视频进入 RISC-V 部分时手写小编程题，把 MNIST 汇编神经网络当作真正的检验点。', '流水线、Cache、虚存三部分与 Logisim 项目同步推进，先画清数据通路和控制信号再动手连线。', '最后做 OpenMP 与 SIMD 项目，用加速比对比朴素实现，而不是只让测试通过。'],
      pitfalls: 'Logisim 里一处连线错误就能让整条流水线跑不通，先用波形和单步把数据通路调清楚，再去网上找别人做完的版本。',
      version: 'Summer 2026 是当前学期。此处的 Project 顺序以 Fall 2020 公开版本为例，最新学期可能调整或替换题目。'
    }
  },
  'parallel-distributed-systems/MIT6.824': {
    updatedAt: '2026-10-23',
    source: 'https://pdos.csail.mit.edu/6.824/',
    related: ['parallel-distributed-systems/CS149', 'operating-systems/MIT6.S081', 'system-security/MIT6.858', 'operating-systems/CS162'],
    en: {
      title: 'MIT 6.824 Distributed Systems Study Guide & Labs',
      description: 'MIT 6.824, now numbered 6.5840, is the distributed systems course from the PDOS group and one of the hardest self-study targets on this site at six stars of difficulty and an estimated two hundred hours. Each lecture dissects a classic paper rather than a textbook chapter, using those papers to derive the design principles behind real systems, and there is no assigned textbook at all. The Spring 2026 offering walks through five progressive labs: MapReduce, a key/value service, Raft, a fault-tolerant key/value service, and sharding. Go is the language throughout, and most learners report that debugging the Raft lab alone consumes many evenings. Because solutions are easy to find, the educational value depends almost entirely on writing the code yourself. A community Chinese translation of the lectures exists for learners who want help with the English recordings.',
      prerequisites: 'The course expects computer architecture and parallel programming background: you should be fluent in Go or another systems language, comfortable with goroutines and locks, and able to read a research paper critically.',
      steps: ['Read the MapReduce paper before the first lab and implement a coordinator and workers that survive worker crashes.', 'Implement Raft in isolation and test it with a random network partition harness before wiring it into anything else.', 'Build the fault-tolerant key/value service on top of your Raft, then add sharding with configuration changes.', 'Use the lab documentation of previous students only after your own tests fail, and write down each invariant you broke.'],
      pitfalls: 'Watching or reading the widely available solutions feels productive but destroys the only thing the course teaches, which is diagnosing the non-deterministic bugs that distributed code produces.',
      version: 'The course now uses the 6.5840 number; the linked site is the Spring 2026 offering with five labs.'
    },
    zh: {
      title: 'MIT 6.824 分布式系统中文学习指南与 Lab',
      description: 'MIT 6.824（6.5840）中文学习指南：没有教材，每课精读一篇分布式系统论文，Spring 2026 用五个 Lab 覆盖 MapReduce、KV、Raft、容错 KV 与分片。六星难度、200 小时，附先修与 Go 实现建议。',
      prerequisites: '课程要求计算机体系结构与并行编程基础：你应当能熟练使用 Go 或其他系统级语言，理解 goroutine 与锁，并具备批判性阅读论文的能力。',
      steps: ['先读 MapReduce 论文，再实现 coordinator 与 worker，并让它在 worker 崩溃时仍然正确。', '单独把 Raft 写完，用随机网络分区的测试框架反复验证，再接入其他组件。', '在 Raft 之上实现容错 KV 服务，然后加入分片与配置变更。', '只有在自己的测试失败后才去参考他人的 Lab 文档，并把每次破坏的不变量记录下来。'],
      pitfalls: '直接读网上流传的答案看起来很高效，实际上把课程唯一的价值——定位分布式代码里那些不确定复现的 bug——整个跳过了。',
      version: '课程现已使用 6.5840 编号，链接为 Spring 2026 版本，包含 5 个 Lab。'
    }
  },
  'computer-networks/CS144': {
    updatedAt: '2026-10-23',
    source: 'https://cs144.github.io/',
    related: ['computer-systems-basics/CSAPP', 'operating-systems/MIT6.S081', 'parallel-distributed-systems/MIT6.824', 'database-systems/15445'],
    en: {
      title: 'Stanford CS144 Study Guide: Build a TCP/IP Stack in C++',
      description: 'Stanford CS144 asks you to build an entire TCP/IP stack in C++, one checkpoint at a time, and many learners describe it as the best modern C++ primer they ever finished. Difficulty is five stars with roughly one hundred hours, and there is no textbook: the framework code is the text. Checkpoint zero warms up with telnet, netcat, a webget crawler, and an in-memory reliable byte stream. Checkpoints one through three implement a standards-compliant TCP that interoperates with industrial stacks. Checkpoint four swaps the kernel socket for your own TCP and asks you to analyse real traffic patterns with Python. Checkpoints five and six add a NetworkInterface with ARP and an IP router, and checkpoint seven wires everything together through a relay server. Prerequisites are a systems background plus CS106L-level C++.',
      prerequisites: 'Expect computer systems fundamentals and solid C++: the course lists CS106L as preparation, and you will need smart pointers, move semantics, and buffer handling before the framework code makes sense.',
      steps: ['Do checkpoint zero properly: learn telnet and netcat, then write webget and the in-memory byte stream with clean tests.', 'Implement the TCP receiver and sender for checkpoints one to three, verifying segment handling against the provided fuzz-style tests.', 'At checkpoint four, replace the kernel socket with your own TCP and plot the real traffic traces in Python rather than skipping the analysis.', 'Finish with NetworkInterface, the IP router, and the end-to-end relay, reading the glue code line by line until nothing feels like magic.'],
      pitfalls: 'The framework is where the course actually lives, so treating checkpoints five and seven as copy-paste glue work means the handshake, retransmission, and threading details stay permanently mysterious.',
      version: 'The official site tracks the current offering and starter code changes each time; the Winter 2024 site is preserved on the Wayback Machine as a stable reference.'
    },
    zh: {
      title: '斯坦福 CS144 中文课程资料：C++ 手写 TCP/IP',
      description: '斯坦福 CS144 中文资料：用 C++ 从零搭出整个 TCP/IP 协议栈，八个 checkpoint 从 webget 做到 IP 路由与端到端中继。五星难度、约 100 小时，附先修、框架代码读法与视频入口。',
      prerequisites: '需要一定的计算机系统基础并熟悉 C++：官方把 CS106L 列为准备课程，读懂框架代码前你应当掌握智能指针、移动语义与缓冲区管理。',
      steps: ['认真做完 checkpoint 0：先用 telnet 与 netcat 熟悉环境，再写 webget 与内存版可靠字节流，并配上自己的测试。', '完成 checkpoint 1 到 3 的 TCP 收发端，用课程提供的乱序、丢包测试验证分段处理。', '到 checkpoint 4 时把内核 socket 换成自己的 TCP，并用 Python 真正画出真实链路的流量曲线，不要跳过数据分析。', '最后实现 NetworkInterface、IP Router 与端到端中继，逐行读完胶水代码，直到不再觉得这是魔法。'],
      pitfalls: '这门课的精华全在框架代码里，把 checkpoint 5 和 7 当成抄胶水，三次握手、重传与多线程的细节就会一直停留在迷雾中。',
      version: '官网随学期更新且配套代码每轮都会变化，建议以当前站点为准；24 Winter 版本已由 Wayback Machine 存档，可作为稳定参考。'
    }
  },
  'database-systems/15445': {
    updatedAt: '2026-10-23',
    source: 'https://15445.courses.cs.cmu.edu/',
    related: ['database-systems/CS186', 'computer-systems-basics/CSAPP', 'database-systems/15799', 'operating-systems/CS162'],
    en: {
      title: 'CMU 15-445 Database Systems Study Guide & Bustub Labs',
      description: 'CMU 15-445 is the database course most self-learners start with, because the CMU Database Group publishes the lectures, notes, homework, and the entire Bustub teaching database in the open. Difficulty is four stars and the estimate is about one hundred hours, assuming you already write C++ and know data structures plus systems basics at the CSAPP level. Across the projects you implement the parts of a disk-oriented relational database: a buffer pool manager, a B+ tree storage engine, query executors and an optimizer, and concurrency control. A bustub-shell binary lets you query your own implementation as you build it, so feedback arrives quickly. The textbook is Database System Concepts and the Fall 2022 YouTube lectures remain watchable. Spring 2026 is the current offering, and project numbering shifts between semesters.',
      prerequisites: 'You need C++, data structures and algorithms, and systems background equivalent to CMU 15-213, which is the prerequisite CMU itself states for enrolled students.',
      steps: ['Watch the lecture series on storage and buffer management, then finish the buffer pool manager project and its eviction policies.', 'Build the B+ tree index project with a debugger open, checking split and merge cases against the provided unit tests.', 'Move to query executors and the optimizer, tracing a query plan through bustub-shell output at each stage.', 'Do the concurrency control project last, and only then read the recovery material in the textbook notes.'],
      pitfalls: 'Project numbering and content change every semester, so following a two-year-old walkthrough guarantees that the skeleton code, tests, and grading expectations no longer match.',
      version: 'Spring 2026 is the current offering. Historical archives for Spring 2023 and Fall 2022 are linked, and bustub versions before 2020 are no longer maintained.'
    },
    zh: {
      title: 'CMU 15-445 数据库中文课程资料：Bustub 实验',
      description: 'CMU 15-445 数据库中文资料：用 Bustub 实现缓冲池、B+ 树、查询算子与并发控制，四星难度约 100 小时。讲义、notes 与教材 Database System Concepts 全部开源，附先修与实验顺序。',
      prerequisites: '需要 C++、数据结构与算法，以及 CSAPP（CMU 15-213）级别的系统基础，这也是 CMU 对本校选课学生列出的先修要求。',
      steps: ['先看存储与缓冲池相关讲义，再完成 Buffer Pool Manager 项目与淘汰策略。', '做 B+ 树索引项目时把调试器打开，对照单元测试检查分裂与合并的边界情况。', '进入查询算子与优化器部分，用 bustub-shell 的输出逐步核对查询计划的每一层。', '把并发控制项目放到最后做，之后再回头读教材里恢复与日志相关章节。'],
      pitfalls: '每学期 Project 编号和内容都会调整，照着两年前的攻略做，骨架代码、测试和评分要求几乎一定对不上。',
      version: 'Spring 2026 为当前学期，另附 Spring 2023 与 Fall 2022 归档；2020 年以前的 bustub 版本已停止维护。'
    }
  },
  'computer-systems-basics/CSAPP': {
    updatedAt: '2026-10-23',
    source: 'http://csapp.cs.cmu.edu/',
    related: ['computer-architecture/CS61C', 'operating-systems/MIT6.S081', 'computer-networks/CS144', 'database-systems/15445'],
    en: {
      title: 'CSAPP Study Guide: Prerequisites, 11 Labs & Textbook',
      description: 'CSAPP, also known as CMU 15-213, is the systems course that most other systems courses quietly assume you have taken. It is rated five stars and estimated at one hundred fifty hours, and it is broad by design: assembly, machine-level representation, processor architecture, caching, linking and loading, exceptions and signals, virtual memory, dynamic allocation, concurrency, and network programming. The textbook is Computer Systems: A Programmer Perspective, third edition, written by the CMU dean, and it rewards slow reading rather than skimming. Eleven open-source labs turn each chapter into code: Data Lab, Bomb Lab, Attack Lab, Arch Lab, Cache Lab, Shell Lab, Malloc Lab, and Proxy Lab among others. Prerequisites are CS61A and CS61B, and the recordings are available for learners who want a lecture track alongside the book.',
      prerequisites: 'CS61A and CS61B are listed as preparation: you should be able to write C with pointers, read assembly output, and debug memory errors with a tool like gdb or valgrind.',
      steps: ['Read the machine-level chapters with the book open next to a disassembler, then complete Data Lab and Bomb Lab to check your reading of registers and stack frames.', 'Do Cache Lab and the architecture lab in the same block, since miss rates and pipeline timing explain each other.', 'Work through linking and virtual memory, then attempt Malloc Lab and Shell Lab where the abstractions become real code.', 'Finish with Proxy Lab and one chapter of concurrency, writing a short note on what each lab taught you about the machine model.'],
      pitfalls: 'The labs are famous and the answers are everywhere, so searching when stuck is easy; without hand-tracing the assembly and the cache simulations yourself, the course becomes a reading exercise with no lasting effect.',
      version: 'The third edition of the textbook and the third-edition lab page are the stable reference; course pages and slide sets are revised over time.'
    },
    zh: {
      title: 'CSAPP 中文学习指南：先修、11 个 Lab 与教材',
      description: 'CSAPP 中文学习指南：CMU 15-213 的系统大课，覆盖汇编、缓存、链接、虚存、内存分配与并发，五星难度约 150 小时。第三版教材配 11 个开源 Lab，附先修、实验顺序与章节对照。',
      prerequisites: '先修要求是 CS61A 与 CS61B：你需要能用 C 和指针写程序、看得懂反汇编输出，并会用 gdb 或 valgrind 定位内存错误。',
      steps: ['读机器级表示几章时把反汇编器放在旁边，用 Data Lab 与 Bomb Lab 检验你对寄存器与栈帧的解读。', '把 Cache Lab 与体系结构实验放在同一阶段完成，缓存命中率与流水线时序可以互相解释。', '学完链接与虚拟内存后做 Malloc Lab 与 Shell Lab，这两章只有写出来才算真的理解抽象。', '最后做 Proxy Lab 并补一章并发，为每个实验写一小段关于机器模型的笔记。'],
      pitfalls: '这门课 Labs 的答案网上唾手可得，卡住就搜最省事；不亲手推演汇编和缓存模拟，整门课就退化成一次没有后效的阅读体验。',
      version: '以第三版教材与第三版实验页面为稳定参考；课程主页与讲义会随时间修订。'
    }
  },
  'deep-learning/CS231': {
    updatedAt: '2026-10-23',
    source: 'http://cs231n.stanford.edu/',
    related: ['deep-learning/CS224n', 'deep-learning/CS230', 'machine-learning/CS229', 'deep-learning/EECS498-007'],
    en: {
      title: 'CS231n Study Guide: Computer Vision Assignments & Notes',
      description: 'CS231n is the Stanford course on convolutional networks for visual recognition, and its material is deliberately friendly: four stars of difficulty, an estimated eighty hours, and Python throughout. The syllabus is an introduction to computer vision built on deep learning, which is why an existing machine learning foundation matters more here than raw coding speed. There is no textbook, so the course site and its schedule page carry the whole thing, and assessment comes from three programming assignments. If you have already taken CS230 you can skip much of the preparation and go straight into the projects as practice. The lectures are mirrored on Bilibili, which makes the video track easy to follow, and the official schedule page is the reliable source for which assignment runs in which week, since the assignment set is revised between offerings.',
      prerequisites: 'The stated prerequisite is machine learning foundations, and the markdown explicitly notes that students who already took CS230 can move straight into the projects.',
      steps: ['Open the official schedule page first and write down the three assignments and their order for the semester you are following.', 'Watch the computer vision and convolutional network lectures in the video track before starting assignment one, not after getting stuck.', 'Complete the three assignments in order, and for each one record the metric you reached plus one failure case you inspected by hand.', 'If you have already taken CS230, start from the assignments immediately; otherwise spend a week on machine learning foundations first.'],
      pitfalls: 'Copying a framework one-liner for convolution or backprop removes the only part of this course that is hard to learn elsewhere, which is deriving and debugging the gradients yourself.',
      version: 'Use the current semester on the official site for the assignment set and schedule; the archived recordings pair with older assignment versions.'
    },
    zh: {
      title: 'CS231n 计算机视觉中文课程资料：作业与难度',
      description: 'CS231n 中文课程资料：斯坦福计算机视觉入门课，用深度学习讲视觉识别，四星难度约 80 小时，全程 Python。无教材，官方 schedule 加三个编程作业就是全部内容，附先修、视频与作业顺序。',
      prerequisites: '先修要求是机器学习基础；markdown 里明确提到，已学过 CS230 的同学可以直接上手 Project 作为练习。',
      steps: ['先打开官方 schedule 页面，把所选学期的三个作业及其顺序抄下来。', '动手前先把视频里计算机视觉与卷积网络相关章节看完，不要卡住了才回头补课。', '按顺序完成三个作业，每个都记录达到的指标和一个亲手检查过的失败案例。', '已学过 CS230 的可直接从作业切入；否则先花一周补机器学习基础再开始。'],
      pitfalls: '用框架一行调用代替卷积或反向传播，就把这门课唯一难以替代的部分——自己推导并调试梯度——直接删掉了。',
      version: '作业集合与日程以官网当前学期为准；视频录制对应较早的作业版本，混用前请先核对。'
    }
  },
  'deep-learning/CS224n': {
    updatedAt: '2026-10-23',
    source: 'http://web.stanford.edu/class/cs224n/index.html',
    related: ['deep-learning/CS231', 'deep-learning/CS224w', 'machine-learning/CS229', 'deep-learning/CS230'],
    en: {
      title: 'CS224n NLP Study Guide: Assignments, SQuAD Project & Notes',
      description: 'CS224n is the Stanford natural language processing course and the most common entry point into modern NLP, rated four stars and estimated at eighty hours. It moves from word vectors and the word2vec objective through recurrent networks, LSTMs, sequence-to-sequence models, machine translation, attention, and the Transformer, so the arc ends exactly where contemporary language modelling begins. There is no textbook; the lecture notes and five programming assignments carry the weight. The assignments progress from word vectors to word2vec, dependency parsing, machine translation, and fine-tuning a Transformer, and the final project trains a question answering model on the SQuAD dataset. The course assumes deep learning foundations plus Python, so a prior deep learning course saves considerable time. Recordings are widely mirrored on Bilibili.',
      prerequisites: 'The stated prerequisites are deep learning foundations plus Python: you should already have trained a neural network, understand backpropagation, and be comfortable with PyTorch or a comparable framework.',
      steps: ['Watch the word vector and word2vec lectures, then finish assignment one and two and verify your gradients before tuning anything.', 'Study the recurrent and attention lectures before the dependency parsing assignment, drawing the computation graph for each model.', 'Do the machine translation assignment with the provided training loop, and record BLEU scores for every change you make.', 'Finish with Transformer fine-tuning, then scope the SQuAD final project narrowly enough to report a baseline and one improvement.'],
      pitfalls: 'It is easy to finish the assignments by filling in blanks without ever reading the training loop, which leaves you unable to explain why the model converges or where the loss actually comes from.',
      version: 'The official index page tracks the current offering; assignment numbers and starter code differ between years, so keep one semester together.'
    },
    zh: {
      title: 'CS224n 自然语言处理中文资料：作业与 SQuAD 项目',
      description: 'CS224n 中文资料：斯坦福 NLP 入门课，从词向量、RNN 讲到注意力与 Transformer，四星难度约 80 小时。五个作业加一个 SQuAD 问答大作业，无教材，附先修、作业顺序与视频用法。',
      prerequisites: '官方先修要求是深度学习基础加 Python：你应当训练过神经网络、理解反向传播，并能熟练使用 PyTorch 一类的框架。',
      steps: ['看完词向量与 word2vec 两讲，完成前两个作业，先验证梯度再调参。', '在依存句法分析作业前学完 RNN 与注意力部分，为每个模型画出计算图。', '做机器翻译作业时保留课程给的训练循环，每改一处就记录一次 BLEU 变化。', '最后做 Transformer 微调，并把 SQuAD 大作业范围收窄到能交付一个基线加一项改进。'],
      pitfalls: '只填空完成作业而从不读训练循环，最后会说不清模型为什么收敛、损失究竟从哪来。',
      version: '以官网当前学期为准；不同年份的作业编号与骨架代码不同，请把同一学期的材料放在一起使用。'
    }
  },
  'data-structures-algorithms/CS170': {
    updatedAt: '2026-10-23',
    source: 'https://cs170.org/',
    related: ['data-structures-algorithms/CS61B', 'data-structures-algorithms/6.006', 'data-structures-algorithms/6.046', 'advanced-mathematics/CS70'],
    en: {
      title: 'CS170 Study Guide: Efficient Algorithms, Notes & Homework',
      description: 'Berkeley CS170 is the algorithm design course that replaces coding drills with proofs and complexity arguments, which is why it is rated only three stars of implementation difficulty but still demands real mathematical maturity. Roughly sixty hours covers divide and conquer, graph algorithms, shortest paths, minimum spanning trees, greedy methods, dynamic programming, union find, linear programming, network flow, NP-completeness, randomised algorithms, and hashing. There is no separate textbook in the usual sense: the course notes are the text, and they are written well enough to serve as a reference you keep returning to. Assessment is thirteen written homework sets, and LaTeX is the expected tool, so the course doubles as a gentle introduction to mathematical typesetting. Prerequisites are CS61B and CS70, since proofs and discrete probability are assumed throughout.',
      prerequisites: 'CS61B and CS70 are the stated prerequisites: you need comfort with induction and discrete probability, plus the ability to read and write a correctness proof, not just run code.',
      steps: ['Read the divide and conquer notes and solve the corresponding homework by hand before checking any solution sketch.', 'Work the graph chapter and its homeworks together, writing runtimes in terms of both vertices and edges every time.', 'Do the dynamic programming and greedy sets in one pass, and for each problem write down why the greedy choice is safe or why it fails.', 'Finish with NP-completeness and randomised algorithms, typesetting at least three solutions in LaTeX to build the habit.'],
      pitfalls: 'Recognising a familiar problem pattern is not a proof; writing an answer that names dynamic programming without establishing the recurrence and the optimal substructure earns very little.',
      version: 'Consult the current cs170.org offering for the semester-specific notes and homework set; archives differ in problem selection.'
    },
    zh: {
      title: 'CS170 算法中文课程资料：讲义、作业与难度',
      description: '伯克利 CS170 中文课程资料：用证明与复杂度分析讲分治、图算法、动规、网络流与 NP 完全性，三星难度约 60 小时。无教材、讲义即教材，13 次 LaTeX 书面作业，附先修与推进方式。',
      prerequisites: '先修要求是 CS61B 与 CS70：你需要熟悉归纳法与离散概率，能读懂也写得出正确性证明，而不只是把代码跑通。',
      steps: ['读分治讲义后先手写作业，再看任何题解。', '图论一章与作业同步推进，每次写复杂度都要同时写出点数和边数。', '把动态规划与贪心两组作业连着做，逐题写清贪心选择为什么安全、或者为什么失败。', '最后处理 NP 完全性与随机算法，至少用 LaTeX 排三份解答以形成习惯。'],
      pitfalls: '认出熟悉的题型不等于证明：只写一句「用动态规划」却不建立递推关系与最优子结构，几乎拿不到分。',
      version: '以 cs170.org 当前学期的讲义与作业为准；不同学期的题目选择会有差异。'
    }
  },
  'database-systems/CS186': {
    updatedAt: '2026-10-23',
    source: 'https://cs186berkeley.net/',
    related: ['database-systems/15445', 'database-systems/CS346', 'computer-architecture/CS61C', 'computer-systems-basics/CSAPP'],
    en: {
      title: 'UCB CS186 Database Study Guide: Java Projects & SQL',
      description: 'Berkeley CS186 approaches databases from the implementation side: five stars of difficulty, an estimated one hundred fifty hours, and six projects in which you build a relational database in Java that supports concurrent SQL queries, B+ tree indexes, and crash recovery. The lectures answer the questions that a pure SQL course skips, namely how a query is parsed, optimised, and turned into disk operations, how concurrency is controlled, and how a system recovers after a failure. Practical work also includes writing SQL and NoSQL queries, which pays off immediately if you build full-stack applications. There is no textbook: the project documentation and lecture material are the course. Prerequisites are CS61A, CS61B, and CS61C, so the systems background matters as much as the database content. Recordings are available on YouTube.',
      prerequisites: 'CS61A, CS61B, and CS61C are the prerequisites, and the course expects working Java: without the architecture background the buffer manager and recovery projects become guesswork.',
      steps: ['Start with the SQL and relational algebra material, then complete the early project that implements query operators in Java.', 'Build the B+ tree index project and test it with the provided checker before layering anything on top.', 'Do the concurrency project with a clear lock hierarchy written down first, since deadlocks here are timing dependent.', 'Finish the recovery project, then write a set of NoSQL queries against the same data to compare models directly.'],
      pitfalls: 'Passing the project tests does not mean your index or lock manager is correct: the hidden tests use concurrent workloads, so single-threaded reasoning leaves races that only appear under load.',
      version: 'Check the current cs186berkeley.net offering for the semester-specific project list and starter code, since projects are revised between terms.'
    },
    zh: {
      title: 'UCB CS186 数据库中文资料：Java 项目与 SQL',
      description: '伯克利 CS186 中文资料：用 Java 实现支持并发 SQL、B+ 树索引与故障恢复的数据库，五星难度约 150 小时。课程还练 SQL 与 NoSQL 查询，无教材，附先修、六个 Project 顺序与踩坑提醒。',
      prerequisites: '先修要求是 CS61A、CS61B 与 CS61C，并要求会用 Java；缺少体系结构基础，缓冲池与恢复项目就只能靠猜。',
      steps: ['先学 SQL 与关系代数，再完成早期那个用 Java 实现查询算子的项目。', '做 B+ 树索引项目时先用课程提供的检查器验证，再在其上叠加其他组件。', '做并发项目前先把锁的层级写清楚，这里的死锁与执行时序高度相关。', '完成恢复项目后，对同一份数据写一组 NoSQL 查询，直接对比两种模型。'],
      pitfalls: '项目测试通过不代表索引或锁管理器写对了：隐藏测试用的是并发负载，只用单线程思路推理会留下只在压力下才出现的竞态。',
      version: '请以 cs186berkeley.net 当前学期为准，项目列表与骨架代码每学期都会修订。'
    }
  },
  'computer-graphics/GAMES101': {
    updatedAt: '2026-10-23',
    source: 'http://games-cn.org/intro-graphics/',
    related: ['computer-graphics/GAMES202', 'computer-graphics/GAMES103', 'computer-graphics/15462', 'computer-graphics/CS148'],
    en: {
      title: 'GAMES101 Study Guide: Modern Graphics, 8 Projects & Book',
      description: 'GAMES101 is the Chinese graphics course that most learners in the country start with, taught at UCSB and organised around the four pillars of modern computer graphics: rasterisation, geometric representation, light transport, and animation and simulation. Difficulty is three stars and the estimate is eighty hours, which makes it far gentler than its reputation suggests, provided you arrive with linear algebra, calculus, and C++. Each of the eight projects adds a small but complete piece of a renderer: you implement rasterisation and shading of a simple model, then ray tracing for better quality, with optional extensions that trade speed for fidelity. The textbook is Fundamentals of Computer Graphics, used as a reference rather than read cover to cover. The course exists to make clear that graphics is not OpenGL and not ray tracing, but a method for generating a whole virtual world.',
      prerequisites: 'Linear algebra, advanced mathematics, and C++ are the stated prerequisites: you need matrix and vector manipulation plus enough calculus to read the rendering equation, and C++ to finish the projects.',
      steps: ['Watch the transformation and rasterisation lectures, then complete the first two projects until a model renders correctly with correct depth.', 'Study shading and textures, and finish the shading project by comparing the output of each model you implement.', 'Move to geometry and light transport, implementing ray tracing and checking noise and convergence behaviour quantitatively.', 'Attempt the optional extensions on at least two projects, measuring render time against image quality.'],
      pitfalls: 'The project skeletons invite you to fill in formulas without understanding the matrices, so keep a written derivation of each transform, otherwise ray tracing later feels like adjusting random parameters.',
      version: 'Use the official games-cn course page and the UCSB course page for the current project set; the Bilibili recordings match the original release.'
    },
    zh: {
      title: 'GAMES101 图形学中文资料：8 个 Project 与教材',
      description: 'GAMES101 中文课程资料：按光栅化、几何、光传播、动画四大板块讲现代图形学，三星难度约 80 小时。八个 Project 从光栅化做到光线追踪，教材 Fundamentals of Computer Graphics，附先修与顺序。',
      prerequisites: '先修要求是线性代数、高等数学与 C++：需要熟练做矩阵与向量运算，能读懂渲染方程里的积分，并用 C++ 完成作业。',
      steps: ['看完变换与光栅化两讲，完成前两个 Project，直到模型能正确渲染且深度关系正确。', '学习着色与纹理后完成着色 Project，逐个对比自己实现的每种模型输出。', '进入几何与光传播部分，实现光线追踪并定量观察噪声与收敛情况。', '至少在两个 Project 上尝试可选拓展，把渲染耗时与画面质量一起记录下来。'],
      pitfalls: '骨架代码很容易让人直接抄公式而不理解矩阵，务必把每个变换的推导写下来，否则后面做光线追踪就像在盲调参数。',
      version: '以 games-cn 官方页面与 UCSB 课程页面的当前 Project 集合为准；B 站视频对应最初发布版本。'
    }
  },
  'data-structures-algorithms/6.006': {
    updatedAt: '2026-10-23',
    source: 'https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-fall-2011/',
    related: ['data-structures-algorithms/CS170', 'data-structures-algorithms/6.046', 'data-structures-algorithms/CS61B', 'programming-introduction/python/CS61A'],
    en: {
      title: 'MIT 6.006 Algorithms Study Guide: CLRS & Problem Sets',
      description: 'MIT 6.006 is the algorithms course from MIT EECS, published in full through OpenCourseWare, and it is five stars of difficulty with a hundred hours or more of expected work. The markdown is blunt about the focus: compared with a C++ data structures course such as CS106B, 6.006 spends far more time explaining the algorithms themselves, while still covering classical data structures such as AVL trees. That makes it the natural next step after you have finished an introductory programming course, and it is also famously hard, so plan for the difficulty rather than being surprised by it. The textbook is Introduction to Algorithms, the CLRS volume, Python is the implementation language, and the Fall 2011 lectures, problem sets, and solutions are all online for self-checking.',
      prerequisites: 'The stated prerequisite is an introductory programming course such as CS50, CS61A, CS106A, or an equivalent: you need basic Python and enough comfort with proofs to follow the analysis.',
      steps: ['Start from the Fall 2011 OpenCourseWare schedule and map each lecture to its problem set before watching anything.', 'Watch a lecture, then attempt its problem set immediately, and only compare against the published solutions afterwards.', 'When a classical structure such as an AVL tree appears, implement it in Python from scratch and check its invariants with your own tests.', 'Read the matching CLRS chapters for the proofs the lectures compress, and keep a one-page summary of the cost of each operation.'],
      pitfalls: 'The problem sets look short but are proof-based, so memorising CLRS chapter conclusions without attempting the recurrences yourself leaves you unable to adapt an algorithm to a new constraint.',
      version: 'The published version is the Fall 2011 offering on OpenCourseWare; newer MIT offerings exist but this is the complete public recording.'
    },
    zh: {
      title: 'MIT 6.006 算法中文学习指南：CLRS 与习题',
      description: 'MIT 6.006 中文学习指南：OCW 完整公开的算法课，重心在算法讲解而非 C++ 数据结构，兼收 AVL 树等经典结构，五星难度约 100 小时。教材 CLRS，语言 Python，附先修与 Fall 2011 视频、习题用法。',
      prerequisites: '先修要求是计算机导论类课程，如 CS50、CS61A、CS106A 或同等水平：你需要会基础 Python，并能跟住课上的证明与分析。',
      steps: ['先从 OCW Fall 2011 的课程表入手，把每一讲与对应习题集对应起来再开始看视频。', '看完一讲就立刻做该讲习题，做完再对照官方公开的解答。', '遇到 AVL 树这类经典数据结构时用 Python 从零实现，并写自测检查不变量。', '对视频里压缩掉的证明，去读 CLRS 对应章节，并为每种操作整理一页复杂度小结。'],
      pitfalls: '习题看着短但都是证明题，只背下 CLRS 的章末结论而不自己推递推式，遇到新约束就完全无法改造算法。',
      version: '公开版本为 OpenCourseWare 上的 Fall 2011 学期；MIT 后续学期另有开课，但这是目前最完整的公开录制。'
    }
  },
  'machine-learning/CS229': {
    updatedAt: '2026-10-23',
    source: 'https://cs229.stanford.edu/',
    related: ['deep-learning/CS231', 'deep-learning/CS230', 'machine-learning/CS189', 'machine-learning/ML'],
    en: {
      title: 'CS229 Machine Learning Study Guide: Notes, Math & Difficulty',
      description: 'CS229 is the Stanford graduate machine learning course, and it is the one to take when you are no longer satisfied with calling library functions. Difficulty is four stars and the estimate is around one hundred hours, but the real cost is mathematical: advanced calculus, linear algebra, and probability are assumed from the first lecture. The course develops supervised learning, generalised linear models, generative learning algorithms, kernel methods and support vector machines, learning theory, and reinforcement learning from a derivation-first perspective. There is no textbook because the course notes serve that role, and they are unusually polished and are the main reason self-study works here. Note that assignments and problem sets are not open to the public, so your practice has to come from the notes, the lecture recordings, and reimplementing the derivations. Prerequisites include Python and solid mathematics.',
      prerequisites: 'Advanced mathematics, probability theory, and Python are the stated prerequisites, together with genuinely solid mathematical maturity: expect matrix calculus and probabilistic derivations from week one.',
      steps: ['Read the supervised learning and generalised linear model notes with the recordings, deriving each update rule on paper before coding anything.', 'Work through the generative learning and naive Bayes notes, then compare the discriminative and generative formulations on the same dataset.', 'Study the kernels and support vector machine notes, implementing the dual and checking the KKT conditions numerically.', 'Finish with learning theory and reinforcement learning, writing a short summary of every bound you meet so the assumptions stay visible.'],
      pitfalls: 'Because assignments are not public, it is tempting to watch the lectures only; without deriving and coding the updates yourself, the mathematical content slides off within a month.',
      version: 'Course notes and lecture recordings are updated by offering; use the current official site and keep one year of notes together for consistency.'
    },
    zh: {
      title: 'CS229 机器学习中文资料：讲义、数学要求与难度',
      description: 'CS229 中文学习资料：斯坦福研究生机器学习课，从监督学习、GLM 推到核方法、学习理论与强化学习，四星难度约 100 小时。无教材、课程 notes 极佳、作业不公开，附数学先修与自学路线。',
      prerequisites: '先修要求是高等数学、概率论与 Python，并且需要相当扎实的数学功底：第一周就要面对矩阵求导与概率推导。',
      steps: ['配合视频读监督学习与广义线性模型的 notes，先在纸上推完每个更新公式再写代码。', '读生成式学习与朴素贝叶斯部分，在同一份数据上对比判别式与生成式两种建模方式。', '学核方法与支持向量机时自己实现对偶形式，并用数值方法验证 KKT 条件。', '最后处理学习理论与强化学习，为遇到的每个界写一段小结，把前提假设显式记下来。'],
      pitfalls: '因为作业不公开，很容易只把视频看完；不亲手推导并实现更新公式，这些数学内容一个月内就会忘干净。',
      version: '讲义与视频会随学期更新，请以官网当前版本为准，并把同一年的 notes 放在一起使用。'
    }
  },
  'operating-systems/CS162': {
    updatedAt: '2026-10-23',
    source: 'https://cs162.org/',
    related: ['operating-systems/MIT6.S081', 'operating-systems/NJUOS', 'computer-systems-basics/CSAPP', 'computer-architecture/CS61C'],
    en: {
      title: 'CS162 Operating Systems Study Guide: Pintos Projects & Book',
      description: 'Berkeley CS162 is the six-star operating systems course, and the estimate of two hundred hours is described as a floor rather than a target. Two things make it distinctive. The first is the textbook, Operating Systems: Principles and Practice in its second edition, which fills in the theoretical background that xv6-based courses leave thin. The second is Pintos, a teaching operating system of roughly ten thousand lines that several top US universities use, in which you add a thread scheduler, system calls, virtual memory, and a file system. Unlike the small focused labs of MIT 6.S081, Pintos emphasises design: each project leaves a large part of the interface up to you and together they come to around two thousand lines. Prerequisites are CS61A, CS61B, and CS61C, and the language mix is C with x86 assembly.',
      prerequisites: 'CS61A, CS61B, and CS61C are the stated prerequisites, and you need fluent C plus enough x86 assembly reading skill to follow context switches and trap frames.',
      steps: ['Read the threads and scheduling chapters of the textbook while studying the Pintos thread code and its alarm clock exercise.', 'Add system calls next, and write down the user and kernel memory layout before touching the handlers.', 'Tackle virtual memory with a page table design note first, since the frame and swap decisions are hard to change later.', 'Finish the file system project and keep a debugging log of every race or triple fault you hit along the way.'],
      pitfalls: 'Pintos projects are open-ended and clock in at around two thousand lines, so starting to code without a written design for the interfaces guarantees rewrites after the first project.',
      version: 'The cs162.org site follows the current offering; the textbook reference is the second edition of Operating Systems: Principles and Practice.'
    },
    zh: {
      title: 'CS162 操作系统中文学习指南：Pintos 与教材',
      description: '伯克利 CS162 中文学习指南：六星操统课，在约一万行的 Pintos 上加调度、系统调用、虚存与文件系统，200 小时以上。教材 Operating Systems: Principles and Practice，附先修与进度安排。',
      prerequisites: '先修要求是 CS61A、CS61B 与 CS61C：你需要扎实的 C 语言功底，并能读懂 x86 汇编，才能跟住上下文切换与陷入内核的过程。',
      steps: ['读教材的线程与调度章节，同时研读 Pintos 的线程代码与 alarm clock 练习。', '接着补系统调用，动手前先把用户态与内核态的内存布局写清楚。', '做虚拟内存前先写一份页表设计说明，页框分配与换出策略后期很难改。', '完成文件系统项目，并把途中遇到的每个竞态与三重故障都记进调试日志。'],
      pitfalls: 'Pintos 的接口是开放的、四个项目合计两千行，不先写好设计文档就开始敲代码，做到第二个项目几乎一定要推倒重来。',
      version: 'cs162.org 随当前学期更新；教材参考 Operating Systems: Principles and Practice 第二版。'
    }
  },
  'compilers/CS143': {
    updatedAt: '2026-10-23',
    source: 'http://web.stanford.edu/class/cs143/',
    related: ['computer-architecture/CS61C', 'compilers/NJU-Compilers', 'compilers/CS420', 'operating-systems/MIT6.S081'],
    en: {
      title: 'Stanford CS143 Compilers Study Guide: COOL, MIPS & Labs',
      description: 'Stanford CS143 teaches compilers by making you write one, and the target is deliberately concrete: you implement a compiler for COOL, the Classroom Object-Oriented Language designed for this course, translating it to MIPS assembly that executes on the SPIM emulator. Difficulty is five stars and the estimate is one hundred fifty hours. The theory follows the organisation of the Dragon Book, covering lexical analysis, parsing, semantic analysis, runtime environments, register allocation, optimisation, and code generation, and the practical side mirrors it in four stages, three for the front end and one for the back end. The programming work grows gradually, and the optimiser is left open so that stronger students can go much further. Prerequisites include computer architecture, since you need to reason about registers and calling conventions. The language is Java or C++, depending on the assignment scaffolding.',
      prerequisites: 'Computer architecture is the stated prerequisite: you should understand registers, the stack, and calling conventions, because the back end emits MIPS by hand rather than through a library.',
      steps: ['Read the lexical analysis chapters and finish the lexer for COOL, testing it against the provided reference token output.', 'Build the parser and verify the abstract syntax tree with the supplied tree printer before starting semantic analysis.', 'Implement the type checker including inheritance and the class hierarchy, then do code generation for a small subset first.', 'Leave optimisation until the pipeline works end to end, then choose one optimisation and measure its effect on the test suite.'],
      pitfalls: 'Passing the parser tests can hide a wrong abstract syntax tree, so rely on the tree printer output rather than on the fact that no error was reported; later phases fail far from the real cause.',
      version: 'The Stanford course page tracks the current offering; the linked recordings correspond to an earlier run, so check that the assignment numbering matches.'
    },
    zh: {
      title: '斯坦福 CS143 编译原理中文资料：COOL 与 Lab',
      description: '斯坦福 CS143 中文资料：为 COOL 语言写编译器并生成 MIPS 汇编在 SPIM 上运行，五星难度约 150 小时。理论按龙书展开，5 个书面作业加 5 个编程作业，附先修与四阶段顺序。',
      prerequisites: '先修要求是计算机体系结构：你需要理解寄存器、栈与调用约定，因为后端要手写生成 MIPS，而不是调库。',
      steps: ['读词法分析章节并完成 COOL 词法分析器，用官方参考 token 输出逐条比对。', '实现语法分析，先用课程给的语法树打印工具确认抽象语法树，再进入语义分析。', '做含继承与类层次检查的类型检查，然后先为一个小子集生成代码。', '等整条流程跑通后再做优化，选择一项优化并用测试集量化它的效果。'],
      pitfalls: '语法分析测试通过可能掩盖了错误的抽象语法树，务必看树打印结果而不是只看「没报错」，否则后续阶段出错的位置离根因很远。',
      version: '以斯坦福课程页当前学期为准；配套视频录制于较早一轮，使用前请核对作业编号是否一致。'
    }
  },
  'system-security/MIT6.858': {
    updatedAt: '2026-10-23',
    source: 'https://css.csail.mit.edu/6.858/',
    related: ['operating-systems/MIT6.S081', 'parallel-distributed-systems/MIT6.824', 'system-security/CS161', 'computer-systems-basics/CSAPP'],
    en: {
      title: 'MIT 6.858 System Security Study Guide: Zoobar Labs & SecFS',
      description: 'MIT 6.858, now numbered 6.5660, teaches computer systems security by attacking and then repairing a real web application called zoobar. Difficulty is five stars with an estimated one hundred fifty hours, and there is no textbook: lectures are built on recent research papers about threat models, operating system security, capabilities, information flow control, language security, network protocols, hardware security, and web application security. The labs are unusually concrete. The first uses buffer overflow attacks to break the application, the second adds privilege separation, the third builds a symbolic execution tool that finds bugs in Python code, and the fourth hardens the application against browser attacks. A group final project asks you to implement SecFS, a remote file system that keeps confidentiality and integrity against a completely untrusted server. Prerequisites are computer architecture and basic systems knowledge, in C and Python.',
      prerequisites: 'Computer architecture plus basic computer systems knowledge is the stated prerequisite: you should be able to read C for the attacks and write Python for the analysis tooling.',
      steps: ['Read the threat model lectures first, then complete the buffer overflow lab and write down the exact stack layout you exploited.', 'Do the privilege separation lab by splitting the application into components and documenting the trust boundary between them.', 'Build the symbolic execution tool for the third lab, testing it on deliberately buggy Python before running it against zoobar.', 'For the final project, read the SUNDR paper and define the SecFS security properties before implementing anything.'],
      pitfalls: 'Security work rewards the attacker mindset, so reading the labs as ordinary programming assignments misses the point; if you cannot state the attack your fix blocks, the fix is probably incomplete.',
      version: 'The course moved to the 6.5660 number in 2023, and Spring 2023 is the latest public archive, with a 2022 archive also available.'
    },
    zh: {
      title: 'MIT 6.858 系统安全中文资料：Zoobar 实验与难度',
      description: 'MIT 6.858（6.5660）中文资料：先攻击再加固 zoobar 应用，四个 Lab 做溢出攻击、特权分离、符号执行与浏览器攻击，五星难度约 150 小时。无教材、以论文为主，附先修与 SecFS 项目说明。',
      prerequisites: '先修要求是计算机体系结构与计算机系统基础：攻防部分要读得懂 C，分析工具部分要写得出 Python。',
      steps: ['先读威胁模型相关讲义，再完成缓冲区溢出实验，并把利用的栈布局完整写下来。', '做特权分离实验时把应用拆成多个组件，明确记录它们之间的信任边界。', '第三个 Lab 实现符号执行工具，先在有 bug 的小型 Python 程序上验证，再对 zoobar 运行。', '期末项目先读 SUNDR 论文，把 SecFS 的机密性与完整性目标定义清楚再动手。'],
      pitfalls: '安全课考的是攻击者视角，把 Lab 当普通编程作业做就失去了意义：如果你说不清自己修掉的补丁挡住了哪种攻击，这个修复多半不完整。',
      version: '课程 2023 年改用 6.5660 编号，Spring 2023 是最新公开归档，另有 2022 归档可查。'
    }
  },
  'parallel-distributed-systems/CS149': {
    updatedAt: '2026-10-23',
    source: 'https://gfxcourses.stanford.edu/cs149/fall21',
    related: ['computer-architecture/CS61C', 'computer-systems-basics/CSAPP', 'parallel-distributed-systems/MIT6.824', 'operating-systems/CS162'],
    en: {
      title: 'CS149 / 15-418 Parallel Computing Study Guide & Assignments',
      description: 'CS149 at Stanford and 15-418 at CMU are the same course taught by the same instructor in two places, and the difference matters for self-study: 15-418 has complete lecture recordings and broader coverage, while CS149 has the more modern programming assignments. Difficulty is five stars with an estimated one hundred fifty hours. The course explains the design principles and engineering trade-offs behind modern parallel machines, then teaches you to exploit them with CUDA, MPI, OpenMP, and higher-level frameworks. The five assignments range from analysing the bottlenecks of an existing parallel program, through writing multithreaded synchronisation code, to CUDA, OpenMP, and a Spark-style dataflow task. Content is genuinely low level, covering memory hierarchies, coherence, and network communication, so it pairs well with a systems background. There is no textbook.',
      prerequisites: 'Computer architecture and working C++ are the stated prerequisites: you need to reason about caches, coherence, and SIMD before profiling a parallel program means anything.',
      steps: ['Watch the 15-418 lectures on parallel machine models, then use the performance analysis assignment to profile an existing program with a profiler.', 'Write the multithreaded synchronisation assignment from scratch, and prove your lock or barrier cannot deadlock.', 'Learn CUDA for the GPU assignment, starting with a correct kernel and only then optimising occupancy.', 'Finish with the OpenMP and dataflow assignments, reporting speedup curves against thread or core count for each one.'],
      pitfalls: 'Parallel code that gives the right answer once is not finished; without running under thread sanitizers and scaling tests, race conditions and false sharing stay hidden until a machine with more cores arrives.',
      version: 'The linked CS149 site is the Fall 2021 offering and the 15-418 recordings are from Spring 2018, which is why the recommended path mixes both.'
    },
    zh: {
      title: 'CS149 / 15-418 并行计算中文资料与作业路线',
      description: 'CS149 / 15-418 中文课程资料：讲现代并行架构的权衡，用 CUDA、OpenMP、MPI 写高性能程序，五星难度约 150 小时。五个作业从瓶颈分析到数据流框架，无教材，附先修与录像混搭方案。',
      prerequisites: '先修要求是计算机体系结构与熟练的 C++：你要先理解缓存、一致性与 SIMD，做性能剖析才有意义。',
      steps: ['看 15-418 关于并行机器模型的几讲，再用性能分析作业拿 profiler 剖析一个现成程序。', '从零完成多线程同步作业，并证明你写的锁或屏障不会死锁。', '学 CUDA 做 GPU 作业，先保证 kernel 正确，再优化 occupancy。', '最后做 OpenMP 与数据流两个作业，为每一个作业画出加速比随线程数或核数变化的曲线。'],
      pitfalls: '并行程序偶尔跑对一次并不算完成：不过线程检查工具、不做扩展性测试，竞态与伪共享会一直藏到你换到核数更多的机器上才爆发。',
      version: '链接的是 CS149 Fall 2021 站点，15-418 录影为 Spring 2018，所以推荐路线是把两者搭配使用。'
    }
  },
  'operating-systems/NJUOS': {
    updatedAt: '2026-10-23',
    source: 'https://jyywiki.cn/OS/2026/',
    related: ['operating-systems/MIT6.S081', 'operating-systems/CS162', 'computer-systems-basics/CSAPP', 'parallel-distributed-systems/CS149'],
    en: {
      title: 'NJU OS Study Guide: MiniLabs, OSTEP & Chinese Lectures',
      description: 'NJU OS, the Operating System Design and Implementation course at Nanjing University, is the first Chinese course on this site and it takes a genuinely different angle from the American offerings. Difficulty is four stars and the estimate is one hundred fifty hours. The lectures start from the idea that a program is a state machine, which turns concurrency into a model you can reason about, and then treat the operating system as a set of objects, namely processes and threads, address spaces, files, and devices, together with the system calls that manipulate them. The persistence section builds storage from a single bit upwards and abstracts device drivers before designing a file system. The textbook is Operating Systems: Three Easy Pieces. Assessment is five MiniLabs plus four OSLabs, and the MiniLabs run locally, so the closed grading server does not block self-study. The language is C.',
      prerequisites: 'Computer architecture plus solid C programming is the stated prerequisite: you need pointer arithmetic, manual memory management, and the willingness to read a hardware manual.',
      steps: ['Watch the concurrency lectures first, then do the second MiniLab on coroutines to see context switching in under a hundred lines.', 'Study the object model lectures on processes and address spaces, and finish the corresponding MiniLab with your own tests.', 'Read the persistence lectures and complete the file system MiniLab, consulting the FAT specification rather than a tutorial.', 'Attempt at least one OSLab, and record the invariants each one depends on as a short checklist.'],
      pitfalls: 'The labs are deliberately small and easy to test locally, so it is tempting to rush them; the coroutine and file system labs only pay off if you can explain every register the context switch saves.',
      version: 'The Spring 2026 offering is the current version, with a 2022 archive available; lab lists change between years.'
    },
    zh: {
      title: '南大 NJU OS 中文课程资料：MiniLab 与 OSTEP',
      description: '南大 NJU OS 中文课程资料：以「程序就是状态机」讲并发，再把操作系统看作对象与系统调用，四星难度约 150 小时。教材 OSTEP，5 个 MiniLab 加 4 个 OSLab，附先修与实验顺序。',
      prerequisites: '先修要求是计算机体系结构加扎实的 C 语言功底：需要熟练的指针运算、手动内存管理，以及愿意去读硬件手册的耐心。',
      steps: ['先看并发部分，再做第二个协程 MiniLab，在不到百行代码里看清上下文切换。', '学进程与地址空间的对象模型，用自己写的测试完成对应 MiniLab。', '读可持久化部分并完成文件系统 MiniLab，直接查 FAT 规范而不是看教程。', '至少做满一个 OSLab，并把每个实验依赖的不变量整理成一份清单。'],
      pitfalls: '实验刻意做得很小、本地就能测，容易一路快进；协程与文件系统两个 Lab 只有在你讲得清上下文切换保存了哪些寄存器时才算学到。',
      version: 'Spring 2026 为当前版本，另有 2022 归档；实验列表逐年调整。'
    }
  },
  'advanced-mathematics/The_Information_Theory_Pattern_Recognition_and_Neural_Networks': {
    updatedAt: '2026-10-23',
    source: 'http://www.inference.org.uk/mackay/itila/',
    related: ['machine-learning/CS229', 'deep-learning/CS224n', 'data-structures-algorithms/6.006', 'machine-learning-systems/MLC'],
    en: {
      title: 'Cambridge Information Theory & Neural Networks Study Guide',
      description: 'This is the Cambridge information theory course taught by Sir David MacKay, and it is the rare case where the recordings, the textbook, and the exercises all come from the same author. Difficulty is three stars and the estimate is only thirty to fifty hours, which makes it one of the best value theory courses here. The prerequisites are calculus, linear algebra, and probability and statistics; any language is acceptable, with Python preferred. The textbook, Information Theory, Inference, and Learning Algorithms, is downloadable free from the course site, and every lecture ends by pointing at the exercises to attempt from it. Work through entropy and coding first, then inference and neural networks.',
      prerequisites: 'The stated prerequisites are calculus, linear algebra, and probability and statistics; any language is acceptable for the exercises, with Python preferred.',
      steps: ['Read the chapters on entropy and source coding while watching the matching lectures, and do the textbook exercises the lecturer sets at the end of each video.', 'Work the channel capacity and coding chapters next, proving the bounds on paper before writing any code.', 'Move to the inference chapters and implement one message passing algorithm by hand on a small graph first.', 'Finish with the neural network and clustering chapters, noting which ideas later became standard deep learning practice.'],
      pitfalls: 'The lectures are gentle but the textbook is not: watching every video without working the exercises leaves you able to recite entropy but unable to compute a channel capacity.',
      version: 'Use the version currently published on the official inference.org.uk site; the recordings released there match that textbook.'
    },
    zh: {
      title: '剑桥 信息论与模式识别：课程资料',
      description: '剑桥信息论与模式识别中文资料：从熵与编码讲到聚类、神经网络与推理，三星难度 30–50 小时。经典教材在官网可免费下载，附先修与看视频做课后题的路线。',
      prerequisites: '官方先修要求是微积分、线性代数与概率统计；编程语言不限，课程建议用 Python。',
      steps: ['看熵与信源编码部分视频时同步读对应章节，并做完每讲结尾指定的教材习题。', '接着读信道容量与编码章节，先把不等式证明写在纸上，再写代码验证。', '进入推理章节，选一个消息传递算法在小图上手工推一遍，再用代码复现。', '最后看神经网络与聚类部分，记录其中哪些想法后来成了深度学习的标准做法。'],
      pitfalls: '视频讲得温和但教材很难：只看视频不做课后题，最后能背出熵的定义，却算不出一个信道容量。',
      version: '以 inference.org.uk 官方页面当前版本为准，视频与教材配套发布。'
    }
  },
  'programming-introduction/c/Duke-Coursera-Intro-C': {
    updatedAt: '2026-10-23',
    source: 'https://www.coursera.org/specializations/c-programming',
    related: ['programming-introduction/c/CS50', 'data-structures-algorithms/CS61B', 'computer-systems-basics/CSAPP', 'operating-systems/MIT6.S081'],
    en: {
      title: 'Duke C Programming Specialization Study Guide',
      description: 'The Duke C specialisation is the course to take when you can write C but do not really understand what the machine does with your variables. It is rated four stars and estimated at about one hundred ten hours, with no formal prerequisites, and it spends real time on frames, stack memory, and heap memory before attacking pointers, the part most beginners never properly learn. The debugging training is the other reason to take it: you work hands on with GDB and Valgrind instead of being told to add print statements, and the assignments include basic Git practice. The instructor suggests Emacs for the homework, so it doubles as an editor introduction.',
      prerequisites: 'The stated prerequisite is none, so this is a genuine entry point, though you will move faster if you have written code in some language before.',
      steps: ['Work the memory model material first: draw the frame, stack, and heap layout for every example until you can do it without looking.', 'Do the pointer and string assignments before any linked structure work, and run every program under Valgrind to read the errors it reports.', 'Learn the debugger properly with the GDB exercises: set breakpoints, inspect frames, and step through a program you did not write.', 'Use Emacs for at least one full assignment as the instructor suggests, and commit the work to Git as the course asks.'],
      pitfalls: 'The course is labelled introductory, so it is tempting to skim the memory chapters, which are precisely the material that later makes pointers and heap bugs legible.',
      version: 'Use the current version of the Coursera specialisation; the course may require payment according to the course page.'
    },
    zh: {
      title: '杜克 C 程序设计专项：指针与 GDB 训练',
      description: '杜克 C 程序设计专项中文资料：把 frame、栈与堆内存、指针讲透，配 GDB 与 Valgrind 调试训练和少量 Git 练习，四星难度约 110 小时。课程在 Coursera、可能收费，作业建议用 Emacs，附先修与推进建议。',
      prerequisites: '官方写的是无先修要求，因此可以作为 C 语言起点；但若写过任何语言，推进会明显更快。',
      steps: ['先啃内存模型部分，为每个例子画出 frame、栈与堆的布局，直到不看笔记也能画对。', '指针与字符串作业放在链表类作业之前做，每个程序都用 Valgrind 跑一遍，看清它报什么错。', '用 GDB 练习把调试器学会：打断点、看栈帧、单步执行一段不是你写的代码。', '至少有一个完整作业按老师建议用 Emacs 完成，并按课程要求用 Git 提交。'],
      pitfalls: '课名带「入门」容易让人略过内存那几章，而后面读不懂指针和堆错误，缺的正是这部分。',
      version: '以 Coursera 专项课程当前版本为准；课程可能需要付费，具体以平台页面为准。'
    }
  },
  'computer-architecture/DDCA': {
    updatedAt: '2026-10-23',
    source: 'https://safari.ethz.ch/digitaltechnik/spring2026/',
    related: ['computer-architecture/CS61C', 'computer-systems-basics/CSAPP', 'operating-systems/MIT6.S081', 'parallel-distributed-systems/CS149'],
    en: {
      title: 'ETH Digital Design & Computer Architecture Guide',
      description: 'The ETH digital design course is taught from the perspective of someone building a processor, and it starts lower than most architecture courses do: transistors and logic gates first, then combinational and sequential circuits, and only then microarchitecture, caches, and virtual memory. Difficulty is three stars with an estimate of one hundred hours, and the stated preparation is CS50 or an equivalent course, ideally with some C. There are nine labs using a Basys 3 FPGA board and AMD Vivado software, and by the end you deploy a complete CPU. The language work spans Verilog, MIPS and LC3 assembly, and C. Both textbooks are named on the site.',
      prerequisites: 'CS50 or an equivalent course, ideally with basic C, is the stated preparation; the labs also assume you are willing to learn Verilog from scratch.',
      steps: ['Start with the combinational and sequential logic labs and keep the Basys 3 board or the Vivado simulator in the loop from the very first circuit.', 'Read the corresponding Harris and Harris chapter before each lab, since the design style in the book is what the labs expect.', 'Work the MIPS single cycle, multicycle, and pipelined CPU labs in that order and record the critical path for each design.', 'Finish with the cache and virtual memory labs, then compare your measured numbers against the claims in the textbook.'],
      pitfalls: 'Skipping the Verilog and timing basics to reach the full CPU lab faster backfires: a processor that fails on hardware is almost always a timing or reset problem, not a decode bug.',
      version: 'Spring 2026 is the current offering, with Spring 2023 and Spring 2020 archives still online.'
    },
    zh: {
      title: 'ETH 数字设计与体系结构：DDCA 教材与实验',
      description: 'ETH 数字设计与体系结构中文资料：从晶体管、逻辑门讲到微架构、缓存与虚存，三星难度约 100 小时。9 个 Lab 用 Basys 3 与 Vivado 搭出完整 MIPS CPU，教材 Harris 与 Patt，附先修与实验顺序。',
      prerequisites: '先修要求是 CS50 或同阶课程，最好有 C 语言基础；实验还需要你愿意从零学 Verilog。',
      steps: ['从组合电路与时序电路实验开始，第一个电路起就让 Basys 3 开发板或 Vivado 仿真器参与验证。', '每个实验前先读 Harris 教材的对应章节，实验要求的设计风格就来自这本书。', '按单周期、多周期、流水线的顺序做 MIPS CPU 实验，每个版本都记录关键路径。', '最后做缓存与虚拟内存实验，把实测数据与教材给出的结论对照一遍。'],
      pitfalls: '为了快点做到完整 CPU 实验而跳过 Verilog 与时序基础，结果板子上跑不通时往往不是译码写错，而是时序或复位问题。',
      version: '官网当前学期为 Spring 2026，另有 Spring 2023 与 Spring 2020 归档可查。'
    }
  },
  'computer-networks/topdown': {
    updatedAt: '2026-10-23',
    source: 'https://gaia.cs.umass.edu/kurose_ross/index.php',
    related: ['computer-networks/CS144', 'computer-networks/topdown_ustc', 'operating-systems/MIT6.S081', 'computer-systems-basics/CSAPP'],
    en: {
      title: 'Computer Networking Top-Down: Kurose & Ross Guide',
      description: 'This is the companion site for the Kurose and Ross textbook Computer Networking: A Top-Down Approach, and it is unusual in how much the authors give away free: their own recorded lectures, interactive chapter questions, and Wireshark labs that have you capture and analyse real traffic. Difficulty is three stars and the estimate is forty hours, with no programming language required beyond basic computer systems knowledge. The honest caveat is that there are no hardcore programming assignments here, so treat it as the theory and protocol half of a networking education and pair it with Stanford CS144 for the implementation half. Read a chapter, watch the lectures, then do the lab.',
      prerequisites: 'Basic computer systems knowledge is the stated prerequisite, and no programming language is required, because the work is reading, online questions, and packet analysis.',
      steps: ['Read the application layer chapter and run the matching Wireshark lab on your own traffic before moving on.', 'Do the transport layer labs and deliberately inspect a TCP handshake, a retransmission, and a congestion window change.', 'Work the network and link layer labs next, and for each protocol capture the header fields you just read about.', 'Finish with wireless and security, then write one page on how a packet actually gets from your machine to a server.'],
      pitfalls: 'These labs are easy to do mechanically, clicking through a capture without predicting what you should see, which teaches nothing; predict the header fields first, then check them.',
      version: 'Use the current material on the gaia.cs.umass.edu companion site, whose textbook edition is the one the lectures follow.'
    },
    zh: {
      title: 'UMass 自顶向下计算机网络：教材与 Wireshark',
      description: 'UMass 自顶向下计算机网络中文资料：Kurose 与 Ross 的教材配套站，含录制视频、在线章节测试与 Wireshark 抓包 Lab，三星难度约 40 小时。没有硬核编程作业，适合先建立全貌，再用 CS144 补实现能力。',
      prerequisites: '先修要求是有一定计算机系统基础；课程不要求编程语言，作业是阅读、在线测试与抓包分析。',
      steps: ['先读应用层章节，并用自己的流量把对应 Wireshark 实验跑一遍再往下走。', '做传输层实验，刻意观察一次 TCP 三次握手、一次重传和一次拥塞窗口变化。', '接着做网络层与链路层实验，每读一个协议就去抓包里找出刚学的头部字段。', '最后看无线与安全部分，写一页纸说明一个包从本机到服务器究竟经历了什么。'],
      pitfalls: '抓包实验很容易变成机械点鼠标：先想清楚该看到什么字段再去抓，否则做完一遍什么也没学到。',
      version: '以 gaia.cs.umass.edu 配套站当前版本为准，视频对应的就是该站的教材版次。'
    }
  },
  'computer-networks/topdown_ustc': {
    updatedAt: '2026-10-23',
    source: 'http://staff.ustc.edu.cn/~qzheng/teaching.html',
    related: ['computer-networks/topdown', 'computer-networks/CS144', 'operating-systems/MIT6.S081', 'computer-systems-basics/CSAPP'],
    en: {
      title: 'USTC Computer Networking: Top-Down Approach Course',
      description: 'The USTC version of the top-down networking course is the one to pick if you want to be taught in Chinese, and it has become one of the better known networking courses on the Chinese internet for good reason. It follows the seventh edition of Computer Networking: A Top-Down Approach, covers most of the textbook plus the material the exam tests, and stays practical rather than purely theoretical. Difficulty is three stars and the estimate is forty hours; an operating systems course helps but is explicitly not required. The lectures were uploaded to Bilibili by the instructor and the slides come as one downloadable archive. Read the textbook section before each lecture or the pace feels fast.',
      prerequisites: 'An operating systems course helps but is explicitly not required, and no programming language is needed since the course is driven by lectures and the textbook.',
      steps: ['Read the textbook section for a lecture before watching it, because the instructor teaches practically and assumes you have seen the material once.', 'Follow the Bilibili lectures with the slide archive open, annotating the slides rather than taking a fresh set of notes.', 'After each chapter, write out the protocol behaviour from memory, especially the TCP state machine and the routing algorithms.', 'Return to the comment section for the lectures you found hard, since the instructor has been answering questions there since 2020.'],
      pitfalls: 'Starting the videos cold, without the textbook preview that the course itself recommends, makes the pace feel far faster than it is and leaves you nodding along without retaining it.',
      version: 'The textbook is the seventh edition of Computer Networking: A Top-Down Approach from 2016; use the current Bilibili recordings.'
    },
    zh: {
      title: '中科大 计算机网络自顶向下：中文视频',
      description: '中科大计算机网络中文课程资料：郑烇、杨坚讲授，教材为自顶向下方法第 7 版，三星难度约 40 小时。B 站视频配全套课件，覆盖教材大部分内容与考试重点，建议先读教材再听课，附使用路线。',
      prerequisites: '先修要求是操作系统，但明确标注为非必需；课程不涉及编程语言，以听课与读教材为主。',
      steps: ['每讲之前先读教材对应小节：老师讲课偏实际，默认你已经见过这些内容。', '对着 B 站视频打开课件压缩包，直接在课件上批注，不要另起一份笔记。', '每章结束后凭记忆写出协议行为，尤其是 TCP 状态机与各类路由算法。', '卡住的讲次回到评论区翻，老师从 2020 年起一直在那里答疑。'],
      pitfalls: '不按课程自己建议先读教材就直接开视频，会觉得节奏快得反常，而且很容易点头听懂、合上就忘。',
      version: '教材为《计算机网络（自顶向下方法）》第 7 版（2016），视频以 B 站当前版本为准。'
    }
  },
  'programming-languages-design/Cambridge-Semantics': {
    updatedAt: '2026-10-23',
    source: 'https://www.cl.cam.ac.uk/teaching/2324/Semantics/',
    related: ['compilers/CS143', 'compilers/USTC-Compilers', 'data-structures-algorithms/CS170', 'system-security/MIT6.858'],
    en: {
      title: 'Cambridge Semantics of Programming Languages Guide',
      description: 'Cambridge teaches programming language semantics the structural way, and this is one of the few courses in programming language theory with recordings available to the public. Difficulty is three stars and the estimate is twenty to thirty hours, with about twelve hours of lecture, so it is short but dense. The prerequisite is elementary discrete mathematics including logic and proof method, plus some basic functional programming, because the exercises are in OCaml. The course starts from the operational semantics of a small imperative language defined by BNF, builds formal type systems and rule based proofs by structural induction, then moves to subtyping, functions, and concurrency. Only past exam questions are public.',
      prerequisites: 'Elementary discrete mathematics, including logic and proof method, plus some basic functional programming is the stated preparation, and the work is done in OCaml.',
      steps: ['Watch the opening lectures on the operational semantics of the BNF defined imperative language, and write the derivation rules out yourself.', 'Do the structural induction exercises until a proof by rule induction feels routine, since everything later depends on it.', 'Study the typing rules and the progress and preservation arguments next, reading the matching chapter of Types and Programming Languages.', 'Finish with subtyping, function handling, and concurrency semantics, then attempt the public past paper questions under time pressure.'],
      pitfalls: 'This is only about twelve hours of lecture, so it is easy to watch in a week and assume you understood it; without writing the proofs yourself the induction never becomes mechanical.',
      version: 'Taught in the 2023/24 academic year according to the latest course page; tutorial sheets and solutions are visible to Cambridge students only.'
    },
    zh: {
      title: '剑桥 程序语言语义学：OCaml 与类型系统',
      description: '剑桥程序语言语义学中文资料：用 BNF、结构归纳与类型系统严谨地讲操作语义与指称语义，三星难度 20–30 小时。教材为 TAPL 与 Winskel，习题只公开历年考题、答案不公开，附先修与阅读顺序。',
      prerequisites: '先修要求是基础离散数学（含逻辑与证明方法）加上一点函数式编程基础；课程作业用 OCaml 完成。',
      steps: ['先看 BNF 定义的简单命令式语言的操作语义几讲，把推导规则自己抄写一遍。', '把结构归纳相关习题做到熟练，后面所有证明都建立在这一步上。', '接着学类型规则与 progress、preservation 论证，同步读 Types and Programming Languages 的对应章节。', '最后处理子类型、函数与并发语义，再限时做公开的历年考题。'],
      pitfalls: '正课只有约 12 小时，很容易一周刷完就以为懂了；不亲手写证明，结构归纳永远停留在「看得懂」的层面。',
      version: '官网 Latest 页面为 2023/24 学年；习题（supervision）与答案仅校内可见。'
    }
  },
  'system-security/Bitcoin-Cryptocurrency': {
    updatedAt: '2026-10-23',
    source: 'https://www.coursera.org/learn/cryptocurrency',
    related: ['system-security/MIT6.858', 'parallel-distributed-systems/MIT6.824', 'computer-networks/CS144', 'database-systems/CS186'],
    en: {
      title: 'Princeton Bitcoin & Cryptocurrency Technologies Guide',
      description: 'The Princeton Bitcoin course explains cryptocurrency as a technical system rather than an investment, which is why it still holds up. Difficulty is three stars and the estimate is a modest twenty hours, and the prerequisites are basic data structures, probability, and computer networking; no blockchain background is assumed. It begins with hash functions, hash pointers, and digital signatures, then studies distributed consensus and proof of work, how transactions and scripts actually work, mining and mining pools, and finally anonymity, regulation, and alternative currencies. The accompanying textbook is free to read online as a PDF, and the Coursera version organises videos, quizzes, and assignments into self paced modules.',
      prerequisites: 'Basic data structures, probability, and computer networking are the stated prerequisites, and no blockchain background is required or assumed.',
      steps: ['Work the cryptographic primitives module first and implement a hash pointer chain so the tamper evidence argument stops being abstract.', 'Study distributed consensus and proof of work, then write down what exactly breaks if the majority of hash power turns adversarial.', 'Walk through the transaction and script module, decoding a real transaction field by field from the textbook diagrams.', 'Finish with mining, anonymity, and regulation, reading the free textbook PDF chapters that the Coursera modules follow.'],
      pitfalls: 'Treating the course as an introduction to trading misses the point and the exam style questions: the value here is the security model, not price prediction.',
      version: 'Use the current Coursera offering; the textbook PDF is freely downloadable while certificates and some features may require payment.'
    },
    zh: {
      title: '普林斯顿 比特币与加密货币技术：教材免费',
      description: '普林斯顿比特币与加密货币技术中文资料：从哈希、数字签名、共识讲到交易脚本、挖矿与匿名性，三星难度约 20 小时。教材 PDF 可免费下载，Coursera 按模块组织视频与测验，附先修与学习路线。',
      prerequisites: '先修要求是基础数据结构、概率与计算机网络知识；不需要区块链基础。',
      steps: ['先学密码学原语模块，自己实现一条哈希指针链，让防篡改这件事不再停留在说法上。', '学分布式共识与工作量证明时，逐条写下算力多数作恶时究竟哪里会崩。', '读交易与脚本模块时，照教材图示把一个真实交易逐字段拆解一遍。', '最后看挖矿、匿名性与监管，并同步读免费教材 PDF 里对应章节。'],
      pitfalls: '把它当成炒币入门会错过全部考试型内容：这门课的价值在于安全模型，而不是价格预测。',
      version: '以 Coursera 当前开放情况为准：教材 PDF 可直接下载，证书与部分功能可能收费。'
    }
  },
  'compilers/USTC-Compilers': {
    updatedAt: '2026-10-23',
    source: 'https://ustc-compiler-principles.github.io/2023',
    related: ['compilers/CS143', 'programming-languages-design/Cambridge-Semantics', 'computer-architecture/CS61C', 'operating-systems/MIT6.S081'],
    en: {
      title: 'USTC Compiler Principles: LightIR & Six Labs',
      description: 'The USTC compiler course is the most complete free compiler construction sequence in this collection, because it does not stop at the frontend. Theory covers lexical and syntax analysis, syntax directed translation, intermediate code, runtime management, and both machine independent and machine specific optimisation. The labs then build a real compiler for Cminusf in C++, using LightIR, a subset of LLVM, as the intermediate representation, which is far closer to industry practice than a toy three address code. Across six labs you write the Flex and Bison frontend, generate LightIR, emit Loongson assembly, optimise the IR, and finish with register allocation. Difficulty is four stars at around one hundred hours.',
      prerequisites: 'Data structures, a computer systems foundation, and C++ are the stated prerequisites, and the Cminusf framework itself is written in C++.',
      steps: ['Do Lab 1 with Flex and Bison for the frontend, and diff your token and parse output against the automated test scripts before continuing.', 'Move to Lab 2 and generate LightIR, reading the LLVM subset documentation the course provides rather than guessing at the IR syntax.', 'Do Lab 3, the Loongson assembly backend, and check it against the reference outputs over the full script suite.', 'Finish Labs 4 to 6 in order: intermediate code optimisation, machine independent optimisation, then register allocation, measuring every change.'],
      pitfalls: 'Chasing the automated test score without reading the tutorial makes the later optimisation labs unmanageable, because a semantically wrong IR passes shallow tests and fails the deep ones.',
      version: 'The 2023 course site and its textbook pages are the current public release; slides and lab frameworks are open source.'
    },
    zh: {
      title: '中科大 编译原理：LightIR 与 6 个实验',
      description: '中科大编译原理中文资料：理论覆盖词法到机器相关优化，实验用 C++ 的 Cminusf 框架分 6 个 Lab 做出带 LLVM 子集 LightIR 与龙芯后端的编译器，四星难度约 100 小时，附先修与实验顺序。',
      prerequisites: '先修要求是数据结构、计算机系统基础与 C++ 编程基础；实验框架 Cminusf 本身也用 C++ 编写。',
      steps: ['Lab 1 用 Flex 与 Bison 实现前端，词法与语法输出先与自动化测试脚本逐条对齐再往下做。', 'Lab 2 生成 LightIR 前先读课程给的 LLVM 子集文档，不要靠猜 IR 语法。', 'Lab 3 实现龙芯汇编后端，用课程提供的参考输出把整套脚本跑通。', 'Lab 4 到 Lab 6 依次做中间代码优化、机器无关优化与寄存器分配，每步都量化前后差异。'],
      pitfalls: '只盯着自动化测试分数而不读实验教程，后面的优化实验会完全做不动：语义错的 IR 能骗过浅层测试，却过不了完整用例。',
      version: '以 2023 版课程网站与教材页面为准，课件与实验框架均开源。'
    }
  },
  'machine-learning-systems/MLC': {
    updatedAt: '2026-10-23',
    source: 'https://mlc.ai/summer22-zh/',
    related: ['deep-learning/CS231', 'deep-learning/CS224n', 'machine-learning/CS229', 'parallel-distributed-systems/CS149'],
    en: {
      title: 'Machine Learning Compilation: TVM Notebook Course',
      description: 'Machine learning compilation barely existed as a taught subject when Chen Tianqi recorded this course in the summer of 2022, which is exactly why it is worth your time. Difficulty is three stars and the estimate is thirty hours, and the prerequisite is a foundation in machine learning or deep learning; Python is the working language. The course uses Apache TVM, which Chen co-created, to show how models written in TensorFlow, PyTorch, or JAX are transformed through a set of abstractions and optimisation algorithms into higher performance deployment code for varied hardware. It deliberately stays at the level of macro concepts, and every lecture ships with a Jupyter Notebook that demonstrates the idea in code. All materials are open source in Chinese and English.',
      prerequisites: 'A foundation in machine learning or deep learning is the stated prerequisite, and Python is the working language since every lecture ships as a Jupyter Notebook.',
      steps: ['Start with the lecture on how a model becomes an executable graph, and run its notebook locally instead of reading the stored output.', 'Work the abstraction lectures next, tracing how a TensorFlow, PyTorch, or JAX model is expressed in the TVM abstractions.', 'Do the scheduling and optimisation notebooks, measuring latency before and after each transformation on your own machine.', 'Finish with the deployment and integration lectures, and complete at least two of the assignment notebooks in the public repository.'],
      pitfalls: 'Reading the notebooks like slides feels productive but teaches almost nothing, because the whole point is seeing which optimisation actually changes measured performance on your hardware.',
      version: 'Recorded in the summer of 2022; both Chinese and English versions of the materials and recordings are open source.'
    },
    zh: {
      title: 'MLC 机器学习编译：陈天奇 TVM 课程',
      description: 'MLC 机器学习编译中文资料：陈天奇 2022 暑期课，讲如何把 PyTorch、JAX 等模型用 Apache TVM 的抽象与优化变换成适配硬件的部署形态，三星难度约 30 小时。每讲配 Notebook，中英文资源全开源。',
      prerequisites: '先修要求是机器学习或深度学习基础；编程语言为 Python，每讲都以 Jupyter Notebook 代码演示。',
      steps: ['先看模型如何变成可执行计算图那一讲，并在本地跑通它的 notebook，而不是只看输出。', '接着看抽象相关的几讲，追踪一个 TensorFlow 或 PyTorch 模型怎样被表达成 TVM 的抽象。', '做调度与优化的 notebook，在本机测每次变换前后的时延。', '最后看部署与集成部分，并在公开仓库里至少完成两个作业 notebook。'],
      pitfalls: '把 notebook 当课件读很轻松，但学不到东西：这门课的关键是看到哪个优化真正改变了你自己硬件上的实测性能。',
      version: '2022 年暑期录制；中英文课程资源与录像均已开源。'
    }
  },
  'web-development/mitweb': {
    updatedAt: '2026-10-23',
    source: 'https://weblab.is/',
    related: ['programming-introduction/c/CS50', 'database-systems/CS186', 'computer-networks/CS144', 'programming-introduction/python/CS61A'],
    en: {
      title: 'MIT Web Development Crash Course: IAP Guide',
      description: 'MIT runs a four week Independent Activities Period every January, and this web development crash course is one of the things that comes out of it: a month in which you design, build, style, and wire up a website from nothing. Difficulty is three stars and the time commitment genuinely varies by learner, since the course is built for people who want a working full stack toolkit rather than a systematic theory of the web. The stack is JavaScript with HTML and CSS plus a NoSQL database, so the prerequisite is simply fluency in at least one programming language. Everything lives on the course site, including the schedule that maps assignments to weeks.',
      prerequisites: 'Fluency in at least one programming language is the stated prerequisite; there is no web experience requirement because the course starts from an empty page.',
      steps: ['Pick a small site idea in week one and build it as you go, instead of waiting until all the lectures are finished.', 'Get HTML and CSS working first with static pages, then add JavaScript behaviour once the layout survives a resize.', 'Add the NoSQL database layer in the later weeks and wire it to a form so the site actually stores something.', 'Deploy what you built and keep the schedule page open, since assignments are listed there rather than in a separate syllabus.'],
      pitfalls: 'Tutorial hell is the real risk: following along without rebuilding the site from an empty folder means you finish with a working demo that you cannot reproduce.',
      version: 'Taught during the four week January IAP period; use the current material on the course site.'
    },
    zh: {
      title: 'MIT Web 开发速成课：全栈建站四周',
      description: 'MIT Web 开发速成课中文资料：在 1 月 IAP 的四周里从零做完一个网站的设计、搭建、美化与交互，覆盖 JavaScript、HTML/CSS 与 NoSQL，三星难度、学时因人而异。官网提供资料与 Schedule，附推进路线。',
      prerequisites: '先修要求是掌握至少一门编程语言；不要求 Web 经验，课程从空白页面开始。',
      steps: ['第一周就定一个很小的站点想法，边学边写，不要等所有课看完再动手。', '先把 HTML/CSS 静态页面做到缩放不塌，再加 JavaScript 交互。', '后几周接上 NoSQL 数据库，并把它接到表单上，让站点真的能存数据。', '把做出来的站点部署上线，并始终对照课程 Schedule，作业是按周列在那里的。'],
      pitfalls: '最大的坑是跟着视频抄：不从空文件夹自己重做一遍，最后只会得到一个自己复现不出来的 demo。',
      version: '课程在每年 1 月的四周 IAP 期间开设，以官网当前资料为准。'
    }
  }
}
