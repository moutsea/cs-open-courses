# cs61bbeyond.com SEO 目标与改造方案

日期：2026-10-23 ｜ 站点：https://www.cs61bbeyond.com ｜ 技术栈：Next.js App Router + OpenNext/Cloudflare

## 1. 站点现状（事实）

- 132 门课程（每门 en + zh 两版 markdown，共 264 个文件），25 个分类，31 个大学，6 个静态枢纽页。
- URL 结构：en 无前缀（`/course/...`），zh 用 `/zh` 前缀（`/zh/course/...`）；`/en/*` 307 跳回无前缀，无重复内容。
- sitemap 276 条：6 枢纽 ×2 语言 + 132 课程 ×2 语言 + 25 分类 ×2 语言 + 31 大学 ×2 语言（本地新版，线上尚未部署分类/大学页）。
- 页面数据源：markdown 头部元信息（所属大学 / 先修要求 / 编程语言 / 课程难度 / 预计学时）+ 课程资源区（课程网站 / 课程视频 / 课程教材 / 课程作业）。

## 2. 需求证据（autocomplete 实采，非推测）

采集方式：Google suggest API（`client=firefox&hl=zh-CN`）与 Baidu suggest API，共 3 轮、50+ 种子词；SERP 抽样用 web_search 交叉验证。

**课程码类（逐课页面的核心）**
`cs61b`（+ fall 2026 / spring 2026 / textbook / sp21 / berkeley / cs61bl）、`cs61a`（+ 中文教材 / github / youtube / past exams / midterm / 是什么）、`cs61c`（+ homework / lab / notes / textbook）、`6.s081`（+ lab / github）、`6.824`（+ 笔记 / 翻译 / lab1 / raft / 学习）、`cs144`（+ lab / github）、`cs231n 中文 笔记`、`cs224n`（+ 作业 / 笔记）、`csapp`（+ 中文 / 中文 pdf / lab）、`cs170`、`cs186`、`15-445`。

**分类 + 推荐类（分类页的核心）**
`机器学习 课程推荐`、`算法 课程 推荐`、`数据库 课程`（+ cmu / mit / 数据库 原理）、`计算机 组成 原理 课程 推荐`、`计算机 网络 课程 推荐`、`编程入门课程推荐` / `编程入门课程教材`、`深度学习 课程大纲`、`操作系统 课程`、`编译原理 课程`、`数据结构 课程 推荐`。

**路径类（首页 / tutorial）**
`计算机学习路线`、`计算机 自学 路线`、`计算机自学路线图`、`转码 路线`、`计算机专业 课程 先后顺序`。

**大学类（大学页）**
`斯坦福 计算机 课程`、`斯坦福 cs 课程`、`mit 开放式课程 中文`、`cmu 大学 CS 课程`、`ucb 课程`。

**SERP 抽样结论**（`cs61b 中文 课程 资源`）
排名前列：B 站中英字幕视频、GitHub `cs-self-learning`（北大版自学指南，即 csdiy.wiki 生态）、博客转载。**没有**任何页面以「课程属性速览（先修/难度/学时）+ 资源聚合 + 双语」的结构化形式覆盖该 query。

## 3. 目标 Query 分组与页面映射

优先级按「页面已存在 × 需求确定性 × 竞争强度」排。

| 组 | 目标 query | 承接页面 | 现状缺口 | 优先级 |
|---|---|---|---|---|
| **T1 课程码 + 材料修饰词** | `cs61b 中文`、`cs61b 教材`、`csapp 中文`、`6.824 笔记`、`cs231n 中文 笔记`、`cs144 lab` | `/course/<category>/<slug>` ×132（双语） | 标题/H1 无修饰词；无先修/学时结构化；无 FAQ；Course schema 缺字段 | **P0** |
| **T2 分类 + 课程/推荐** | `机器学习 课程推荐`、`数据库 课程`、`算法 课程 推荐`、`编程入门课程推荐` | `/courses/<category>` ×25 | 仅一句导语 + 课程网格，内容厚度不足；无对比表；无 FAQ | **P0** |
| **T3 大学 + 课程** | `斯坦福 计算机 课程`、`mit 开放式课程 中文`、`cmu 大学 CS 课程` | `/universities/<university>` ×31 | 标题未含「计算机课程」类词；正文薄 | P1 |
| **T4 学习路线** | `计算机学习路线`、`计算机自学路线图`、`转码 路线` | `/`、`/tutorial` | 路线内容未按 query 组织；无 FAQ | P1 |
| **T5 品牌/长尾** | `cs61b`、`cs61bbeyond`、`<课程名> 是什么` | `/`、全站 | 首页 title 偏泛；缺 Organization/WebSite 结构化 | P2 |

**明确不做**（避免 doorway / 版权 / 质量风险）：学期页（`cs61b fall 2026`）、作业答案页、PDF 下载页、纯聚合 doorway 页。

### 竞品定位
csdiy.wiki 及 `cs-self-learning` 以「长文自学路线 + 每课一段中文点评」占据大词。本站不该正面竞争长文，而应打**结构化差异**：每门课的属性表（大学/先修/语言/难度/学时/资源链接）+ 双语 + 视频资源 + 学习路径串联。这类内容可被 rich result 与 AI 摘要直接引用。

## 4. 页面改造清单

### 4.1 逐课页（P0，132×2 页面）

| 位置 | 改造 |
|---|---|
| `<title>` | 模板改为 `{课程名} 中文课程资料｜{大学} 先修/难度/教材 - CS61B & Beyond`（zh）/ `{Course} Study Guide & Materials｜{University} - CS61B & Beyond`（en），控制在 60 字符内，含 query 修饰词 |
| H1 | 保持课程名，副标题补「中文课程资料 / 先修要求 / 教材与视频」 |
| 正文首屏 | 新增**课程速览表**：所属大学 / 先修要求 / 编程语言 / 课程难度 / 预计学时 / 官方资源（官网、视频、教材、作业）——直接从 markdown 解析，已有数据 |
| FAQ 模块 | 4–6 条，由真实字段生成（如「CS61B 的先修要求是什么？」「CS61B 有中文教材吗？」「CS61B 需要多少学时？」），答案逐课不同，避免模板化重复内容 |
| 结构化数据 | Course schema 补 `coursePrerequisites`、`timeRequired`（ISO 8601）、`educationalLevel`、`inLanguage`、`isAccessibleForFree`、`offers`、`teaches`；新增 `FAQPage` |
| 内链 | 「先修/后续课程」链到同分类其它课 + 所属大学页 + 分类页 |

### 4.2 分类页（P0，25×2 页面）

- 导语扩到 120–180 字（zh）/ 80–120 词（en），覆盖「X 课程推荐」「X 怎么选」意图。
- 新增**课程对比表**：课程 / 大学 / 语言 / 难度 / 学时，天然适合 featured snippet。
- 新增**建议学习顺序**（先修链）与 3–4 条 **FAQ**（如「数据库课程先学哪门？」）。
- 结构化数据：`CollectionPage` + `ItemList` + `BreadcrumbList` + `FAQPage`。

### 4.3 大学页（P1）

- title 改为 `{大学} 计算机课程（CS 公开课汇总）- CS61B & Beyond`。
- H1 与首段明确「{大学} 计算机科学课程列表」，列出课程数、覆盖方向。

### 4.4 枢纽页（P1）

- `/tutorial`：按「零基础 → 编程入门 → 数据结构 → 系统 → 方向选修」组织，覆盖「计算机学习路线」。
- `/`：title 收敛到主 query，补 `WebSite` + `Organization` 结构化（含 `potentialAction` SearchAction）。

## 5. 实施与验收

1. 解析层：`src/lib/courseParser.ts` 增补 `prerequisites` 与资源链接抽取。
2. 生成层：新增 `src/lib/courseFacts.ts`（速览表 + FAQ 生成，纯函数、确定性）。
3. 渲染层：新增 `CourseFactSheet.tsx`、`CourseFaq.tsx`，接入课程页与分类页。
4. 元数据层：`src/lib/courseSeo.ts` 重写 title/description 模板；扩展 `courseSchema`。
5. 内容层：`src/data/category-guides.ts` 扩到 25 个分类；`src/data/course-guides.ts` 扩到高频课程。

**验收**：`tsc --noEmit` 通过；`npm run test:seo` 全绿；抽样页面 HTML 含 FAQPage/Course 字段；`npm run build` 成功；sitemap 无新增死链。

## 6. 已落地改动（本次实现）

| 层 | 文件 | 改动 |
| --- | --- | --- |
| 解析 | `src/lib/courseFacts.ts`（新增） | `extractCourseFacts()` 从课程 markdown 的「课程简介 / 课程资源」区抽取先修、语言、学时与四类资源链接（官网 / 视频 / 教材 / 作业）；`courseKey()` 生成 `CS61B`、`6.824`、`GAMES101` 这类短名；`factSheetRows()`、`buildCourseFaq()` 产出结构化速览与 3–5 条 FAQ，全部为确定性纯函数 |
| 组件 | `src/components/CourseFactSheet.tsx`（新增） | 首屏「课程速览」网格 + 官方资源 chips，解决「课程码 + 先修 / 教材 / 视频」query 的即时答案 |
| 组件 | `src/components/CourseFaq.tsx`（新增） | `<details>` 形式的 FAQ 区块，课程页 / 分类页 / 大学页共用 |
| 组件 | `src/components/CourseComparisonTable.tsx`（新增） | 分类页课程对比表（课程 / 大学 / 语言 / 难度 / 学时 / 先修），面向 featured snippet |
| 元数据 | `src/lib/courseSeo.ts` | title 改为 `{课程码} 中文课程资料：先修要求、教材与视频`；`courseSchema` 增补 `courseCode`、`availableLanguage`、`isAccessibleForFree`、`educationalLevel`、`timeRequired`、`coursePrerequisites`、`about`、`sameAs`、`offers`；新增 `faqSchema()` |
| 页面 | `src/app/[locale]/course/[...path]/page.tsx` | 接入速览表 + FAQ + 增强 `Course` schema + `FAQPage` |
| 页面 | `src/app/[locale]/courses/[...category]/page.tsx` | title 改为「{分类}课程推荐：公开课资料、先修要求与学习顺序」，新增对比表、分类导语与 FAQ |
| 页面 | `src/app/[locale]/universities/[university]/page.tsx` | 31 所大学中文名补全，title 改为「{大学}计算机课程推荐：资料与先修要求」，新增 3–4 条动态 FAQ 与 `CollegeOrUniversity` schema |
| 页面 | `src/app/[locale]/courses/page.tsx` | 枢纽页 title/描述收敛到「计算机课程推荐」类 query |
| 内容 | `src/data/category-guides.ts` | 25 个分类导语（zh 212–301 字 / en 81–92 词）+ 新增 `categoryFaqs`（每分类 3–4 条，zh/en 各 87 条） |
| 内容 | `src/data/course-guides.ts` | 手写指南从 4 条扩到 21 条（CS61B、CS61A、CS50、6.S081、CS61C、6.824、CS144、15-445、CSAPP、CS231n、CS224n、CS170、CS186、GAMES101、6.006、CS229、CS162、CS143、6.858、CS149、NJUOS） |

**事实约束**：速览表与 FAQ 中的所有先修、语言、学时、资源链接均来自课程 markdown 原文，不做推测；markdown 未写「先修要求」的课程不生成对应 FAQ 条目。

## 7. Code review 修复记录

对本次实现逐层（解析 → 元数据 → 页面 → 渲染 → 构建产物）做了自查，按影响排序记录：

| 级别 | 问题 | 影响 | 处理 |
| --- | --- | --- | --- |
| P0 | 课程页 H1 被换成 SEO 标题 | 无手写指南的课 H1 变成「Data100 中文课程资料：先修要求、教材与视频」，关键词堆砌且与正文不符 | H1/面包屑恢复 `course.title`，SEO 标题只用于 `<title>` 与 `WebPage.name` |
| P0 | 元数据行按冒号重拼，破坏 `https://` | 速览表出现 `https：//` | 只按第一个冒号切分（`bullet.search(/[:：]/)`） |
| P0 | markdown 链接漏进速览表 / FAQ | 显示 `[DDCA](https://…)` 原文（zh/en 各有 1 例） | `cleanValue()` 剥离内联链接与 autolink，只保留标签文字 |
| P1 | 空 URL 资源挤掉真实链接 | 89/132 门课有至少 1 条无链接资源，`slice(0,8)` 会截断真链接 | 有 URL 的优先排序，无 URL 的最多保留 2 条 |
| P1 | 全数字 slug 生成错误课程码 | 15445/15462/15799/17803/6031 的短名变成 `15445` | `courseCode()` 先看标题（`CMU 15-445`），并跳过纯数字 slug |
| P1 | 缩写 slug 当作课程名 | `CA`、`ML`、`LHY` 这类 slug 对搜索者无意义，title 变成「CA 中文课程资料」 | `courseKey()` 只接受含课程号或在标题中出现的 slug，否则回落课程号 / 课程名 |
| P1 | 长课程名的 title 过长 | 最长 76 字符 + 品牌后缀 | title 后缀按 key 长度分三档（≤16 全量关键词 / ≤34 精简 / >34 只留「中文课程资料」） |
| P1 | 分类/子分类 title 过长 | 「深度生成模型 · 大语言模型课程推荐：公开课资料、先修要求与学习顺序」 | 子分类只用子分类名（父级留在面包屑），后缀缩短为「先修、教材与学习顺序」 |
| P1 | `/zh/courses` 的 JSON-LD 135KB | 页面 593KB，132 个完整 Course 嵌在 ItemList 里 | 新增 `courseListSummarySchema()`（只列 url + name）：JSON-LD → 26KB，页面 → 281KB |
| P2 | `CollegeOrUniversity.url` 用了本站地址 | schema 语义错误 | 改为官网 `url` + `sameAs`，本站页放 `mainEntityOfPage` |
| P2 | `availableLanguage` 硬编码两种语言 | 对未来只有单语版本的课不成立 | 按 `course.hasEnglishVersion` 动态生成 |
| P2 | 大学页 title「MIT计算机课程推荐」缺空格 | 中英混排可读性 | 拉丁字母结尾时补空格 |
| P2 | 分类页 description 用 slug 当示例 | 「含 CS61B、CS61A、15445」 | 改用 `courseKey()`：「含 CMU 15-445、CMU 15-799、CS122」 |
| P2 | 对比表「先修要求」整段塞入单元格 | CMU 15-445 的先修说明有 60+ 字，撑坏表格 | 截断到 46 字符 + 省略号 |
| P2 | FAQ 里 bilibili 链接带 `vd_source` 追踪参数 | 60+ 字符噪音 | `cleanUrl()` 统一剥离 `vd_source`/`utm_*`/`spm` 等参数 |
| P2 | 速览表学时显示「70 小时 +」 | 源 markdown 带 `+` | 展示前去掉尾部 `+` |
| P2 | FAQ 文案重复语言名、视频措辞生硬 | 「即使之前没写过 C/C++，verilog，课程…」 | 重写为「如果还不熟悉，课程通常会提供从环境配置讲起的基础材料」 |
| P2 | 大学页入门课统计比较了本地化标签 | 拿「入门」去比 `beginner` 永远不命中 | 改按原始难度值匹配 |

**验证**：`tsc --noEmit` 0 错；`npm run test:seo` 39/39；`npm run build` 成功并全量 SSG；抽样预渲染 HTML 每页恰好 1 个 `<h1>`，schema 类型正确（课程页 Course + FAQPage + BreadcrumbList，分类页 ItemList + FAQPage + Course + Offer，大学页 CollegeOrUniversity + ItemList + Course + FAQPage）。

**仍未处理（有意留给后续）**：FAQ 答案里的 URL 仍是纯文本不可点；`CourseFaq` 的 `id` 固定为 `course-faq`（当前每页只有一个 FAQ 区块，暂无冲突）；15 门课程名很长的课（如 `The Information Theory, Pattern Recognition, and Neural Networks`）建议补手写 `course-guides` 条目以获得更短的 title。

## 8. Code review 第二轮（用户：「发现的其他问题也修了吧」）

针对上一轮遗留的三条建议继续修，并顺带处理复查中新发现的问题：

| 问题 | 处理 |
| --- | --- |
| FAQ 答案里的 URL 是纯文本，不可点 | `CourseFaq.tsx` 新增 `renderAnswer()`：按 `https?://` 切分，渲染成 `<a target="_blank" rel="noopener noreferrer">`，显示时隐藏 `https://` 前缀，答案容器加 `break-words`；全文 132 门课里有 107 门 FAQ 含链接 |
| `CourseFaq` 的 id 固定为 `course-faq` | 新增 `id?: string` prop（默认 `course-faq`），分类页传 `category-faq`、大学页传 `university-faq`，避免以后同页多个 FAQ 区块时 aria 冲突 |
| 15 门长标题课程 SEO title 过长（最长 71 字符） | 两手：① `courseKey()` 增加发布者前缀剥离（`PUBLISHER_WITH_COLON` / `PUBLISHER_BARE` / `LEADING_CODE`），仅在 title > 30 字符时剥离，并保留 ≤30 字符标题的校名前缀以避免「ETH / Princeton Computer Architecture」撞名；② 为 10 门最长的课补手写 `course-guides`（现有 31 条），title 压到 18–29 字符，如 `ETH 数字设计与体系结构：DDCA 教材与实验`、`剑桥 信息论与模式识别：课程资料` |
| 速览表 chip 出现「课程官网 · 课程网站」这类重复 | `CourseFactSheet.tsx` 增加 `GENERIC_LABEL` 判断：label 本身只是类型词（课程网站/官网/课程视频/课程作业…）时隐藏 kind 徽章，label 为空时用 kind 兜底 |
| 语言值带限定词，FAQ 读作「主要使用 Python preferred」 | `cleanLanguage()` 去掉尾部 `preferred`/`（推荐）`；语言值不是单一词（如 `C, Python, x86 assembly`、`Anything would be OK`）时改用「课程说明里的编程语言要求是「…」」句式 |
| 分类页 description 用 slug 当示例（含 `15445`） | 改用 `courseKey()` 且过滤长度 >18 的键，示例变成「含 CMU 15-445、CMU 15-799、CS122」；无合格示例时整句省略 |

**标题长度变化**：>30 字符的课程 title 从 24 条 → 23 条 → **13 条**，最长从 71 → **38 字符**（`ETH: Computer Architecture - 课程资料与先修要求`）。剩余 13 条均为课程本名较长或标题同时含先修/教材关键词的情况，属可接受范围。

**验证**：`tsc --noEmit` 0 错；`npm run test:seo` 39/39；`npm run build` 成功（411 个静态页面）；预渲染抽样确认 DDCA / MLC / mitweb / topdown / 信息论等页面 title 已是新手写短标题、FAQ 内链接可点、chip 无重复徽章、`category-faq` / `university-faq` id 生效。dev 已重启在 `http://localhost:3000`。

### 8.1 顺带修掉的课程源数据缺陷

补指南时发现 markdown 本身有 4 处问题，一并清理（改完已跑 `npm run data:generate` 重新生成索引与 revision 哈希）：

| 文件 | 问题 | 处理 |
| --- | --- | --- |
| `course-content/zh/machine-learning-systems/MLC.md` | 残留作者模板 HTML 注释（「用一两段话介绍这门课程…」）被当作正文解析进 search index | 删除注释块 |
| `course-content/zh/machine-learning-systems/CMU10-414.md` | 同上 | 删除注释块 |
| `course-content/en/machine-learning-systems/MLC.md` | `--Difficulty:` 破折号笔误，导致英文难度解析不到 | 改为 `- Difficulty:` |
| `course-content/en/compilers/USTC-Compilers.md` | `Prerequisites` 与 `Programming Languages` 两栏为空 | 按中文侧事实补齐（Data Structures, Computer Systems Fundamentals, C++ / C++） |

重新生成后 `src/data/generated/course-search-index.json` 变更 11 行，除上述 3 门外还把此前 `git pull` 时手工解决的 15799 描述同步成了本地 markdown 的版本，属预期。
