/**
 * 搜索词 → 内容缺口。
 *
 * 后台能看到用户在搜什么（`analytics_events` 里 `search` 事件的 `props.q`），
 * 但「搜了却没有对应内容」才是能直接变成行动的信息。这个模块做两件事：
 *
 * 1. **匹配**：把一个搜索词落到站内某一页（课程 / 分类 / 大学 / 枢纽）；
 * 2. **判定**：把词里的意图（教材、视频、笔记、lab、中文、pdf…）和落地页已有的能力对比，
 *    列出缺什么、该补什么。
 *
 * 纯函数，不碰数据库也不碰 fs —— 索引由 `searchGapIndex.ts` 构建后传进来，方便单测。
 */

export type PageKind = 'course' | 'category' | 'university' | 'hub'

/** 页面「具备什么」——判断缺口用的能力标签。 */
export type SearchCapability =
  | 'guide' // 手写学习指南（先修 + 步骤 + 坑）
  | 'textbook'
  | 'video'
  | 'assignment'
  | 'github'
  | 'chinese'
  | 'prerequisite'
  | 'difficulty'
  | 'roadmap' // 学习顺序 / 衔接课程
  | 'notes' // 站内笔记（目前一律没有）
  | 'exam' // 历年题（目前一律没有）
  | 'answers' // 作业答案（明确不做）
  | 'download' // PDF / 电子书下载（明确不做）

/** 用户搜一个课程名时附带想要的东西。 */
export type SearchIntent =
  | 'textbook'
  | 'video'
  | 'notes'
  | 'assignment'
  | 'github'
  | 'chinese'
  | 'prerequisite'
  | 'difficulty'
  | 'exam'
  | 'answers'
  | 'download'
  | 'roadmap'
  | 'none'

export type MatchVia = 'code' | 'title' | 'category' | 'university' | 'hub' | 'token'

export type GapStatus = 'covered' | 'page_gap' | 'missing_course' | 'missing_page'

export type GapPriority = 'P0' | 'P1' | 'P2'

export interface ContentEntry {
  kind: PageKind
  /** 站点路由，已带语言前缀，例如 /zh/course/data-structures-algorithms/CS61B */
  path: string
  /** 展示名，例如 CS61B 或 操作系统 */
  label: string
  /** 归一化后的匹配键，越长越具体；顺序无关，匹配时按长度择优 */
  keys: string[]
  /** Full normalized course identifiers, separate from broad title tokens. */
  codes?: string[]
  capabilities: SearchCapability[]
}

export interface ContentIndex {
  entries: ContentEntry[]
  /** 站内已有的课程码（归一化），用来判断「这门课站内没有」 */
  courseCodes: Set<string>
}

export interface SearchTermInput {
  term: string
  count: number
}

export interface MatchedPage {
  kind: PageKind
  path: string
  label: string
  via: MatchVia
  key: string
}

export interface GapRow {
  term: string
  count: number
  intents: SearchIntent[]
  matched: MatchedPage | null
  status: GapStatus
  missing: SearchCapability[]
  /** 站内没有的课程码（status = missing_course 时才有） */
  missingCourse: string | null
  suggestion: string
  priority: GapPriority
  /**
   * 缺的全是站内明确不做的素材（笔记 / 历年题 / 答案 / 下载）。
   * 这类词恒为缺口但补不了，报表里单独分组，不跟真能补的缺口抢 P0。
   */
  policy: boolean
  /** 站内搜索（/api/search）能搜到几门课；没注入 `countSearchHits` 时为 null */
  searchHits: number | null
}

export interface GapSummary {
  terms: number
  searches: number
  covered: number
  pageGap: number
  missingCourse: number
  missingPage: number
  /** 只缺政策素材的词数（computed over all rows, 不受 maxRows 截断影响） */
  policyGap: number
  /** 判定已覆盖、但站内搜索一条都搜不到的词数 */
  searchMiss: number
}

export interface CapabilityGap {
  capability: SearchCapability
  searches: number
  terms: string[]
}

export interface MissingCourseGap {
  code: string
  searches: number
  terms: string[]
}

export interface GapReport {
  rows: GapRow[]
  summary: GapSummary
  /** 最缺的能力，按搜索次数降序 */
  topMissing: CapabilityGap[]
  /** 站内完全没有的课程，按搜索次数降序 */
  missingCourses: MissingCourseGap[]
}

const INTENT_LEXICON: { intent: SearchIntent; words: string[] }[] = [
  { intent: 'textbook', words: ['教材', '教科书', '课本', '参考书', '用书', 'textbook', 'textbooks', 'text book', 'text books'] },
  { intent: 'video', words: ['视频', '网课', '公开课', '录像', 'lecture', 'lectures', 'video', 'videos', 'b站', 'bilibili', 'youtube', '中文字幕', '中字'] },
  { intent: 'notes', words: ['笔记', '讲义', 'note', 'notes', '总结', '速记', '复习资料', 'cheat sheet', 'cheat sheets'] },
  { intent: 'assignment', words: ['作业', '实验', 'lab', 'labs', 'project', 'projects', '项目', 'homework', '大作业', 'practical', 'practicals'] },
  { intent: 'github', words: ['github', '源码', '代码', '仓库', 'repo', 'repos', 'repository', 'repositories'] },
  { intent: 'answers', words: ['答案', '题解', '解答', 'solution', 'solutions'] },
  { intent: 'chinese', words: ['中文', '汉语', '翻译', '汉化', '中字'] },
  { intent: 'exam', words: ['考试', '期末', '期中', '真题', 'exam', 'exams', 'examination', 'examinations', 'midterm', 'midterms', 'final', 'finals', 'past paper', 'past papers', 'quiz', 'quizzes'] },
  { intent: 'prerequisite', words: ['先修', '前置', 'prerequisite', 'prerequisites', 'prereq', 'prereqs', '要求'] },
  { intent: 'difficulty', words: ['难度', '耗时', '学时', '多难', '难吗', 'workload', 'workloads', 'difficulty'] },
  { intent: 'download', words: ['pdf', 'pdfs', '电子书', '下载', 'e book', 'e books', 'epub', 'epubs', 'mobi'] },
  { intent: 'roadmap', words: ['路线', '路线图', '怎么学', '自学', '顺序', '先学', 'roadmap', 'roadmaps', '学习路径', '转码'] }
]

/** 意图 → 需要页面具备的能力。`none` 表示只是想知道这课是什么。 */
const INTENT_CAPABILITY: Record<SearchIntent, SearchCapability | undefined> = {
  textbook: 'textbook',
  video: 'video',
  notes: 'notes',
  assignment: 'assignment',
  github: 'github',
  chinese: 'chinese',
  prerequisite: 'prerequisite',
  difficulty: 'difficulty',
  exam: 'exam',
  answers: 'answers',
  download: 'download',
  roadmap: 'roadmap',
  none: undefined
}

export const CAPABILITY_LABELS: Record<SearchCapability, string> = {
  guide: '学习指南',
  textbook: '教材',
  video: '视频',
  assignment: '作业 / Lab',
  github: 'GitHub 代码',
  chinese: '中文内容',
  prerequisite: '先修要求',
  difficulty: '难度与学时',
  roadmap: '学习顺序',
  notes: '笔记 / 讲义',
  exam: '历年题',
  answers: '作业答案',
  download: 'PDF 下载'
}

/**
 * 站内明确不做的素材。带这些意图的词恒为 page_gap，但「补内容」这个动作永远不会有结果，
 * 所以优先级降一档、报表里单独分组，别让它把真能补的缺口挤出 P0。
 */
export const POLICY_CAPABILITIES: ReadonlySet<SearchCapability> = new Set<SearchCapability>([
  'notes',
  'exam',
  'answers',
  'download'
])

const INTENT_LABELS: Record<SearchIntent, string> = {
  textbook: '教材',
  video: '视频',
  notes: '笔记',
  assignment: '作业 / Lab',
  github: '代码',
  chinese: '中文',
  prerequisite: '先修',
  difficulty: '难度',
  exam: '考试',
  answers: '答案',
  download: 'PDF',
  roadmap: '学习路线',
  none: ''
}

/**
 * 缺口对应的具体动作，写成能直接开工的一句话。
 * 笔记 / 历年题 / 答案 / 下载这四项按 `POLICY_CAPABILITIES` 一律不做，
 * 所以这里的措辞是「改成什么」，而不是「补什么」。
 */
const CAPABILITY_ACTIONS: Record<SearchCapability, string> = {
  guide: '补一份手写学习指南（先修 + 学习步骤 + 常见坑）',
  textbook: '补教材条目：书名 + 作者 + 官方/出版社链接',
  video: '补视频入口：官方播放列表或 B 站中文字幕版',
  assignment: '补作业 / Lab 入口与题量说明',
  github: '补 GitHub 仓库或参考实现链接',
  chinese: '补中文内容（翻译页或中文导读）',
  prerequisite: '补先修要求',
  difficulty: '补难度与预计学时',
  roadmap: '补学习顺序与衔接课程',
  notes: '站内不做笔记：改成指向官方讲义 / 社区笔记的外链，或明写「本站不提供笔记」',
  exam: '站内不做历年题：改成说明「不提供历年题」并链到官方 archive / 课程主页',
  answers: '不提供作业答案：改为「卡住了怎么办」指引（官方 FAQ / 讨论区 / 调试方法）',
  download: '不做 PDF 下载：改为「教材获取方式」说明，链到官方或出版社'
}

/** 太泛的词不单独作为匹配键，否则什么都能命中。 */
const GENERIC_TOKENS = new Set([
  '课程', '学习', '入门', '进阶', '简介', '介绍', '大学', '中文', '推荐', '设计', '分析',
  '技术', '基础', '原理', '实践', '专题', '高级', '应用', '系统', '理论', '方法', '教程',
  'course', 'courses', 'introduction', 'intro', 'advanced', 'the', 'and', 'for', 'with',
  'systems', 'system', 'design', 'analysis', 'theory', 'learning'
])

const PUNCTUATION = /[\s\u3000\-_./·:：、，,。()（）[\]「」【】"'’“”!！?？+*~`|<>&=]/g

/**
 * 归一化：NFKC、小写、去空白与标点。`CS 61B`、`cs61b`、`cs-61b` 都变成 `cs61b`。
 *
 * 先做 NFKC：中文输入法下敲出来的全角字母数字（`ＣＳ６１Ｂ`、`６．８２４`）在 Unicode 里
 * 是另一组码点，不做兼容分解就既匹配不上索引、也抽不出课程号。
 */
export function normalizeTerm(value: string): string {
  return value.normalize('NFKC').toLowerCase().replace(PUNCTUATION, '')
}

export function isCjk(value: string): boolean {
  return /[\u3400-\u9fff]/.test(value)
}

/**
 * 建索引时单个词的最短长度：中文 2 个字（操作系统），英文 3 个字符。
 * 这里必须守住 3——英文标题里有 to / of / in / an 这类两字母虚词，
 * 放进索引就会被任意查询命中。
 */
function minimumKeyLength(key: string): number {
  return isCjk(key) ? 2 : 3
}

/**
 * 匹配时允许的最短键长。
 *
 * 英文缩写只有 2 个字符——`os` / `ai` / `db` / `ml` / `cg` / `ca` / `pl` / `dl` 都是分类
 * 别名表里人工维护的简称。它们本来就进了索引（别名不过 `tokenizeForKeys`），却被
 * 「英文 3 个字符」的匹配下限挡掉，于是 `os 教材`、`ml 视频` 被判成「站内没有这类页面」。
 *
 * 降到 2 不会再到处误命中：`containsKey` 对纯字母键要求词边界，`macos` 里切不出 `os`。
 */
const MINIMUM_MATCH_KEY_LENGTH = 2

/**
 * 归一化后的查询串 + 每个字符在原文里是否处在词首。
 *
 * `normalizeTerm` 会把空白和标点全删掉，`java 教材` 和 `javascript` 都变成一串字母，
 * 光看归一化结果分不出「词」的边界；这里顺手记下来，供 `containsKey` 判断。
 */
interface BoundaryText {
  text: string
  /** starts[i] === 1 表示 text[i] 在原文里是新词的第一个字符。 */
  starts: Uint8Array
}

const PUNCTUATION_CHAR = new RegExp(PUNCTUATION.source)

function normalizeTermWithBoundaries(value: string): BoundaryText {
  // 与 normalizeTerm 保持同一套变换（NFKC → 小写 → 去标点），否则两边算出来的键对不上。
  const lower = value.normalize('NFKC').toLowerCase()
  const starts: number[] = []
  let text = ''
  let atWordStart = true
  for (const char of lower) {
    // PUNCTUATION 带 g 标志，逐字符判断要用非全局副本，否则 lastIndex 会串。
    if (PUNCTUATION_CHAR.test(char)) {
      atWordStart = true
      continue
    }
    text += char
    starts.push(atWordStart ? 1 : 0)
    atWordStart = false
  }
  return { text, starts: Uint8Array.from(starts) }
}

/**
 * 纯字母的英文键要落在词边界上：`java` 是 Java 课的键，不能顺带命中 `javascript`；
 * `cos` 也不能命中 `macos`。中文键没有空格分词，仍按子串匹配（`机器学习` ⊂ `机器学习视频`）；
 * 含数字的键是课程码或编号，用户常连写（`cs61b视频`、`mit6824`），也不做边界要求。
 *
 * 数字旁边放宽：`java17` 仍算命中 Java（版本号不算新词）。
 */
function containsKey(target: BoundaryText, key: string): boolean {
  const { text, starts } = target
  if (!isLetterOnlyKey(key)) return text.includes(key)
  for (let at = text.indexOf(key); at >= 0; at = text.indexOf(key, at + 1)) {
    const before = at > 0 ? text[at - 1] : ''
    const after = text[at + key.length] ?? ''
    const leftOk = !/[a-z]/.test(before) || starts[at] === 1
    const rightOk = !/[a-z]/.test(after) || starts[at + key.length] === 1
    if (leftOk && rightOk) return true
  }
  return false
}

/**
 * 索引里的键是固定的一千多个字符串，每次匹配都跑一遍正则不划算，缓存判断结果。
 * 只影响速度，不影响结果。
 */
const letterOnlyKeys = new Map<string, boolean>()

function isLetterOnlyKey(key: string): boolean {
  let cached = letterOnlyKeys.get(key)
  if (cached === undefined) {
    cached = /^[a-z]+$/.test(key)
    letterOnlyKeys.set(key, cached)
  }
  return cached
}

// Attached resource ordinals (lab03, exam01) are not department/course identifiers.
// Consume lettered numeric segments such as 6.S081 before testing the boundary.
// Read filename suffixes together, then preserve explicit course identifiers within them.
// Suffixes cannot cross whitespace, slashes or other query separators.
const NUMBERED_RESOURCE_WORDS = INTENT_LEXICON
  .filter(({ intent }) => ['video', 'notes', 'assignment', 'exam'].includes(intent))
  .flatMap(({ words }) => words)
  .filter(word => /^[a-z ]+$/.test(word))
  .map(word => word.split(' ').join('[\\s_-]*'))
const NUMBERED_RESOURCE_PATTERN = new RegExp(
  `(?<![A-Za-z0-9])(?:${NUMBERED_RESOURCE_WORDS.join('|')})([_-]*)(\\d+[A-Za-z]{0,2})((?:[._-]+[A-Za-z0-9]+)*)(?![A-Za-z0-9])`,
  'gi'
)
const RESOURCE_WORD_PATTERN = new RegExp(`^(?:${NUMBERED_RESOURCE_WORDS.join('|')})$`, 'i')
// Read each whole numeric/alphanumeric segment before validating it as a course number.
// An underscore before a letter starts a separate token (_N2T / _CS_999).
const RESOURCE_NUMBER_PATTERN = /^\d[A-Za-z0-9]*(?:(?:[.\-][A-Za-z]?|_+)\d[A-Za-z0-9]*)*(?![A-Za-z0-9]|(?:[.\-][A-Za-z]?|_+)\d)/

// A bare five-digit course number (15213 / 15799) never starts with 0, while `00042` is a
// zero-padded resource ordinal. Keep the leading digit in one place so both the bare-number
// pattern below and isCourseNumber cannot drift apart again.
const BARE_COURSE_NUMBER_SOURCE = '[1-9]\\d{4}'
const BARE_COURSE_NUMBER = new RegExp(`^${BARE_COURSE_NUMBER_SOURCE}$`)
// Scanning variant of the same shape: compiled once, not on every extractCodes call.
// matchAll clones a global regex, so the shared instance never carries a stale lastIndex.
const BARE_COURSE_NUMBER_PATTERN = new RegExp(`(?<![A-Za-z0-9])${BARE_COURSE_NUMBER_SOURCE}(?![A-Za-z0-9])`, 'g')

// Filename suffixes must not be read as course-number continuations: `6.824.7z` merged `.7z`
// into the number and `video-6.824.3gp` swallowed it. Shape alone cannot separate the two,
// because `.S081` in 6.S081 has exactly the shape of `.mp4`, so suffixes are masked out before
// parsing. Masking keeps the length, so every span index below stays valid.
//
// Three shape rules cover everything except suffixes that mix digits and letters after a
// compound number, which stay an explicit list:
//   1. dot + letters can never end a course number (`6.S081`, `6.042J`, `18.06SC` all carry
//      digits in their last segment), so it is a suffix — this one rule covers hundreds of
//      extensions nobody would think to list;
//   2. a dot after a bare catalog number that continues with letters separates a suffix too,
//      because such a number has no dot segment of its own (6031.bz2, 15213.mpeg2);
//   3. years, dates and numeric split-archive parts belong to the surrounding number.
const ALPHABETIC_EXTENSION = /\.[A-Za-z]+(?![A-Za-z0-9])(?![.\-][A-Za-z]{0,2}\d)/g
// The guard above keeps code segments such as `.CS-61B` (lab03.CS-61B.pdf) from being read as
// an extension while `.tar.gz` still masks the leading segment: what follows the letters must
// not continue a course number.
// A digit-only tail is a longer identifier (6031.2 ≠ 6031), so rule 2 requires a letter.
const BARE_NUMBER_EXTENSION = /(?<=[1-9]\d{3,4})\.[A-Za-z][A-Za-z0-9]*(?![A-Za-z0-9])/g
// Suffixes that mix digits and letters after a compound number cannot be told apart by shape —
// `.S081` in 6.S081 looks exactly like `.h264` — so this half still needs the list.
const DIGIT_EXTENSION = /\.(?:7z|bz2|bzip2|3g[2p]|3gpp|av1|ac3|eac3|h26[3-5]|x26[3-5]|m2ts|m2v|m2p|m3u8?|m4[abrv]|mp[1-4]|mp4[abv]|mpeg[124]|azw3|par2|lz4|lzma|ps1|qcow2)(?![A-Za-z0-9])/gi
// A bare `.264` / `.265` is ambiguous: after a compound number or a four-digit catalog number
// it is an H.264 stream (6.824.264 / 6031.264), on its own it is a course number (6.264), so
// it needs the surrounding shape. Round numbers such as `6.824.2` stay course continuations.
const AMBIGUOUS_NUMERIC_EXTENSION = /(?<=(?:\d{1,3}(?:[.\-][A-Za-z]?\d{1,4})+|\d{4}))[.\-]26[45](?![A-Za-z0-9])/g
// Years and ISO dates behave like continuations too (6.824.2024.pdf, MIT6.824-2024-10-01.pdf).
const DATE_SUFFIX = /[.\-](?:19|20)\d{2}(?:[.\-]\d{1,2}){0,2}(?![A-Za-z0-9])/g
// Numeric split-archive parts (`.001`, `.z01`, `.r01`) continue a number as well, but only next
// to an already complete course number: 6.824.001 / 6031.z01. A single extra digit stays a
// course continuation on purpose (6.824.2 is lab 2), and 21M.301 never matches the lookbehind.
const SPLIT_ARCHIVE_SUFFIX = /(?<=(?:\d{1,3}(?:[.\-][A-Za-z]?\d{1,4})+|\d{4}))[.\-](?:\d{3}|[zr]\d{2})(?![A-Za-z0-9])/g

// hw03 / week03 / part02 / ps02: 资源序数标签，和 lab03 / video10 一样属于资源元信息。
// 只按标签名判断，不按「字母 + 补零数字」的形状判断 —— CLAB03 这类未知课号形状完全相同。
const ORDINAL_LABELS = 'hw|hws|ps|pset|part|week|wk|slide|slides|unit|ep|episode|day|ta|rec|recit|sec|sect|chap|ch|mod|tut|lesson|set'
const ORDINAL_TOKEN = new RegExp(`^(?:${ORDINAL_LABELS})0?\\d{1,2}[a-z]{0,2}$`)
// 点分四段、每段 1-3 位：IPv4 的形状。课程号最多三段（6.824.2 / 6.824.2.1 极少见），
// 且第一段不会恰好落在 1-255 之外的巧合上，直接把四段纯数字排除掉最省事。
const DOTTED_QUAD_NUMBER = /^\d{1,3}(?:\.\d{1,3}){3}$/

// 点分四段纯数字是 IPv4，不是课程号。必须最先掩掉：后面的分卷规则（.255）会把
// 255.255.255.0 切成「255.255」，剩下的半截又会被当成课程号。
const DOTTED_QUAD = /(?<![A-Za-z0-9])\d{1,3}(?:\.\d{1,3}){3}(?![A-Za-z0-9])/g

function maskKnownSuffixes(text: string): string {
  return text
    .replace(DOTTED_QUAD, match => ' '.repeat(match.length))
    .replace(ALPHABETIC_EXTENSION, match => ' '.repeat(match.length))
    .replace(BARE_NUMBER_EXTENSION, match => ' '.repeat(match.length))
    .replace(DIGIT_EXTENSION, match => ' '.repeat(match.length))
    .replace(AMBIGUOUS_NUMERIC_EXTENSION, match => ' '.repeat(match.length))
    .replace(DATE_SUFFIX, match => ' '.repeat(match.length))
    .replace(SPLIT_ARCHIVE_SUFFIX, match => ' '.repeat(match.length))
}

function isCourseNumber(value: string, knownCodes?: ReadonlySet<string>): boolean {
  return Boolean(knownCodes?.has(normalizeTerm(value))) || BARE_COURSE_NUMBER.test(value) ||
    /^\d{1,3}(?:[.\-][A-Za-z]?\d{1,4})+[A-Za-z]?$/.test(value)
}

/**
 * 从一段文本里抽课程码：`6.824`、`15-445`、`6.S081`、`CS61B`、`15213`。
 * 比 `courseCode()` 宽松，因为它只服务于搜索匹配。
 * 短简称和四位纯数字码只接受目录中已有的完整标识，避免把年份猜成课程。
 */
export function extractCodes(rawText: string, knownCodes?: ReadonlySet<string>): string[] {
  // NFKC first: 全角输入（ＣＳ６１Ｂ、６．８２４）在 Unicode 里是另一组码点，不做兼容分解
  // 下面的 ASCII 形状规则一条都匹配不上。全角字母/数字/标点都是 1:1 映射，长度不变，
  // 所有 span 下标仍然对得上。
  const nfkcText = rawText.normalize('NFKC')
  // 全角字符做 1:1 兼容分解时长度不变，所以能把结果再映射回原文，报出来仍是用户输入的样子。
  const sameLength = nfkcText.length === rawText.length
  const text = maskKnownSuffixes(nfkcText)
  const found = new Map<string, string>()
  // A plain space can separate a language from a course: Java 6.031 names an existing course.
  // Joined/hyphenated versions, v/version markers and dependency constraints remain versions.
  const operator = '(?:===|==|!=|~=|>=|<=|=|>|<|\\^|~)'
  const versionNumber = '\\d+(?:[._-]\\d+)*'
  const softwareVersions = new RegExp(
    '(?<![A-Za-z0-9])(?:python|java|(?:open)?jdk|jre|node(?:\\.?js)?|c\\+\\+|c#|golang|go|rust|react|cuda|numpy|scipy|matlab)' +
    `([\\s_-]*(?:${operator}\\s*)?)(v(?:ersion)?\\s*)?(${versionNumber})(?![A-Za-z0-9])` +
    // Consume bounds together (NumPy>=1.26.4,<2.0.0), stopping before adjacent course codes.
    `((?:\\s*,?\\s*${operator}\\s*v?${versionNumber}(?![A-Za-z0-9]))*)`,
    'gi'
  )
  const spans = [...text.matchAll(softwareVersions)]
    .filter(match => {
      const [, separator, marker, version, bounds] = match
      // Course numbers may be undivided or have one dot/hyphen (6031, 6.031, 15-445).
      // Do not collapse multi-part versions such as 6.0.31 into the known course 6.031.
      const courseNumber = /^\d+(?:[.\-]\d+)?$/.test(version)
      return !(/^\s+$/.test(separator) && !marker && !bounds && courseNumber && knownCodes?.has(normalizeTerm(version)))
    })
    .map(match => ({ start: match.index!, end: match.index! + match[0].length }))

  // Recognize spacing for catalog prefixes too (GAMES 101, Data 100, N 2T).
  // Unknown numbers under these prefixes must still count as missing courses.
  const spacedPrefixes = new Set(['cs', 'cos', 'ee', 'eecs', 'ece', 'cse', 'comp', 'math'])
  for (const code of knownCodes || []) {
    const prefix = code.match(/^[a-z]+(?=\d)/)?.[0]
    if (prefix) spacedPrefixes.add(prefix)
  }
  // A resource label such as lab04 remains metadata unless it is itself in the catalog.
  const suffixPrefixes = [...new Set([...spacedPrefixes, 'mit', 'cmu', 'ucb'])]
    .filter(prefix => !RESOURCE_WORD_PATTERN.test(prefix))
  const suffixPrefix = `(?:${suffixPrefixes.join('|')})[._-]*`
  const suffixPrefixStart = new RegExp(`^${suffixPrefix}\\d`, 'i')
  const suffixCourseCode = new RegExp(`^${suffixPrefix}\\d{1,4}(?:[.\\-][A-Za-z]?\\d{1,4})*[A-Za-z]{0,2}$`, 'i')
  // Keep separators inside a recognized prefix/number pair (CS_61B, MIT_6.S081).
  const suffixTokens = new RegExp(`(?:${suffixPrefix}\\d+[A-Za-z0-9]*|[A-Za-z0-9]+)(?:[.\\-][A-Za-z]?\\d+[A-Za-z0-9]*)*`, 'gi')
  const resourceCourseCandidates: { raw: string, start: number }[] = []
  for (const match of text.matchAll(NUMBERED_RESOURCE_PATTERN)) {
    const [, separator, number, suffix] = match
    const base = match[0].slice(0, match[0].length - suffix.length)
    const end = match.index! + match[0].length
    // Mark versions before splitting filename segments, so v_6.031 / version_6.0.31
    // cannot become a catalog alias after the marker and number are tokenized separately.
    for (const version of suffix.matchAll(/(?<![A-Za-z0-9])v(?:ersion)?[._-]*\d+(?:[._-]\d+)*(?![A-Za-z0-9]|[._-]\d)/gi)) {
      const start = end - suffix.length + version.index!
      spans.push({ start, end: start + version[0].length })
    }
    // Prefer the longest complete catalog identifier, including compound names before .pdf.
    const catalogIdentifier = [match[0], ...[...suffix.matchAll(/[._-]+/g)]
      .map(part => match[0].slice(0, base.length + part.index!)).reverse()]
      .find(raw => knownCodes?.has(normalizeTerm(raw)))
    // A separator can introduce a full course number, including an unknown one (lab-6.828).
    // Preserve known numeric aliases too: the normal token scan sees video-6031 as one token.
    // Read the entire number before deciding whether it names a course. A four/five-digit
    // start with further numeric segments must not fall back to its known shorter prefix.
    const numericPrefix = (number + suffix).match(RESOURCE_NUMBER_PATTERN)?.[0]
    const courseNumber = separator && numericPrefix && isCourseNumber(numericPrefix, knownCodes) ? numericPrefix : undefined
    // A short, non-catalog ordinal may precede a numeric course: video-0010_6031.
    // Ignore zero padding only for ordinal length; catalog identifiers retain their zeros.
    // A known or long numeric base must retain the continuation guard (video-6031_2).
    const ordinalSeparator = /^0*\d{1,3}[A-Za-z]{0,2}$/.test(number) && !knownCodes?.has(normalizeTerm(number))
      ? suffix.match(/^_+(?=\d)/)?.[0] : undefined
    const preserved: { raw: string, start: number }[] = []
    let suffixStart = end - suffix.length
    if (catalogIdentifier) {
      preserved.push({ raw: catalogIdentifier, start: match.index! })
      suffixStart = match.index! + catalogIdentifier.length
    } else if (courseNumber) {
      const start = match.index! + base.length - number.length
      preserved.push({ raw: courseNumber, start })
      suffixStart = start + courseNumber.length
    } else if (ordinalSeparator) {
      const start = suffixStart + ordinalSeparator.length
      const raw = text.slice(start, end).match(RESOURCE_NUMBER_PATTERN)?.[0]
      if (raw) {
        // Validate the entire suffix number too; 6031_2 must never fall back to 6031.
        if (knownCodes?.has(normalizeTerm(raw))) preserved.push({ raw, start })
        suffixStart = start + raw.length
      }
    } else if (separator && numericPrefix) {
      // Do not reconsider the rejected number's continuation as a separate catalog alias.
      suffixStart = match.index! + base.length - number.length + numericPrefix.length
    }

    if (suffixStart < end) {
      // Keep numeric continuations intact: MIT6.S081 is one code, v11.22.33 one version.
      // Only catalog identifiers and recognized department prefixes survive resource metadata.
      for (const token of text.slice(suffixStart, end).matchAll(suffixTokens)) {
        const raw = token[0]
        const start = suffixStart + token.index!
        if (knownCodes?.has(normalizeTerm(raw)) || suffixCourseCode.test(raw)) {
          preserved.push({ raw, start })
          continue
        }
        // A catalog alias can follow a label (part01-6031 / part01-N2T), but never shorten
        // a course identifier (N2T-2) or turn an explicit version into a course.
        const labeledCode = raw.match(/^[A-Za-z][A-Za-z0-9]*[.\-]([A-Za-z]?\d+(?:[.\-][A-Za-z]?\d+)?[A-Za-z]{0,2})$/)?.[1]
        if (labeledCode && !suffixPrefixStart.test(raw) && !/^v(?:ersion)?\d*[.\-]/i.test(raw) &&
          knownCodes?.has(normalizeTerm(labeledCode))) {
          preserved.push({ raw: labeledCode, start: start + raw.length - labeledCode.length })
        }
      }
    }

    // Exclude only the intervals between course identifiers, not the entire filename.
    let excludedStart = match.index!
    for (const candidate of preserved) {
      if (excludedStart < candidate.start) spans.push({ start: excludedStart, end: candidate.start })
      excludedStart = candidate.start + candidate.raw.length
      resourceCourseCandidates.push(candidate)
    }
    if (excludedStart < end) spans.push({ start: excludedStart, end })
  }
  const spacedCode = new RegExp(`(?<![A-Za-z0-9])(?:${[...spacedPrefixes].join('|')})[\\s-]+\\d{1,4}(?:[.\\-][A-Za-z]?\\d{1,4})*[A-Za-z]{0,2}(?![A-Za-z0-9.\\-])`, 'gi')
  const patterns = [
    /(?<![A-Za-z0-9])[A-Za-z]{0,6}\d{1,3}(?:[.\-][A-Za-z]?\d{1,4})+[A-Za-z]?(?![A-Za-z0-9])/g,
    spacedCode,
    /(?<![A-Za-z0-9])[A-Za-z]{2,6}\d{2,4}[A-Za-z]{0,2}(?![A-Za-z0-9])/g,
    /(?<![A-Za-z0-9])(?:MIT)?\d{1,3}S\d{2,4}(?![A-Za-z0-9])/gi,
    BARE_COURSE_NUMBER_PATTERN
  ]
  const candidates = [...resourceCourseCandidates, ...patterns.flatMap(pattern => [...text.matchAll(pattern)])
    .map(match => ({ raw: match[0], start: match.index! }))]
  if (knownCodes) {
    // Keep compound identifiers intact too: N2T-2 must not match the known N2T course.
    for (const match of text.matchAll(/[A-Za-z0-9]+(?:[.\-][A-Za-z0-9]+)*/g)) {
      const token = match[0]
      const start = match.index!
      if (knownCodes.has(normalizeTerm(token))) {
        candidates.push({ raw: token, start })
        continue
      }
      // 6031-final / 6031_hw2: 纯数字目录编号后面接分隔符再跟说明词时，编号本身仍是课程号。
      // 说明词必须以字母开头，所以 6031-2 这类更长的编号不会被截短；字母简称也不参与
      // （Nand2Tetris-extra、N2T-2 是一个更长的标识，不是「课程 + 说明」）。
      for (const separator of token.matchAll(/[-_]/g)) {
        const cursor = separator.index!
        const tail = token.slice(cursor + 1)
        if (!/^[A-Za-z]/.test(tail)) continue
        const head = token.slice(0, cursor)
        if (!/^[1-9]\d{3,4}$/.test(head)) continue
        if (!knownCodes.has(head)) continue
        candidates.push({ raw: head, start })
        break
      }
    }
  }
  for (const match of candidates) {
    const raw = match.raw.trim()
    const start = match.start
    const end = start + match.raw.length
    // NFKC 长度不变时用原文切片，保留全角空格这类用户输入过的写法。
    const display = sameLength ? rawText.slice(start, end) : raw
    if (spans.some(span => start < span.end && end > span.start)) continue
    const key = normalizeTerm(raw)
    if (key.length < 4 && !knownCodes?.has(key)) continue
    if (ORDINAL_TOKEN.test(key) && !knownCodes?.has(key)) continue
    // 192.168.1.1 这类点分四段纯数字是 IP，不是课程号；真正的编号最多三段（6.824.2）。
    if (DOTTED_QUAD_NUMBER.test(raw) && !knownCodes?.has(key)) continue
    spans.push({ start, end })
    if (!found.has(key)) found.set(key, display)
  }
  return [...found.values()]
}

/** MIT6.824 / 6.824 and CMU10-414 / 10-414 name the same complete course code. */
export function courseCodeAliases(code: string): string[] {
  const normalized = normalizeTerm(code)
  return [...new Set([normalized, normalized.replace(/^(?:mit|cmu|ucb)(?=\d)/, '')])]
}

// English words need letter boundaries; digits and Chinese can adjoin lab3 / 中文lab.
// Compile once and keep phrase separators, rather than stripping boundaries from the query.
const INTENT_MATCHERS = INTENT_LEXICON.map(({ intent, words }) => ({
  intent,
  patterns: words.map(word => /^[a-z ]+$/.test(word)
    ? new RegExp(`(?<![a-z])${word.split(' ').join('[\\s_-]*')}(?![a-z])`, 'i')
    : normalizeTerm(word))
}))

/** 词里的意图；按词表顺序去重。 */
export function detectIntents(term: string): SearchIntent[] {
  const normalized = normalizeTerm(term)
  const intents: SearchIntent[] = []
  for (const { intent, patterns } of INTENT_MATCHERS) {
    const hit = patterns.some(pattern => typeof pattern === 'string'
      ? normalized.includes(pattern)
      : pattern.test(term))
    if (hit) intents.push(intent)
  }
  return intents.length > 0 ? intents : ['none']
}

/** 把词切成可能用作匹配键的片段（标题分词、路径分段）。 */
export function tokenizeForKeys(text: string): string[] {
  const tokens = text
    .split(/[^\p{L}\p{N}]+/u)
    .map(token => token.trim())
    .filter(Boolean)
  const keys: string[] = []
  for (const token of tokens) {
    const normalized = normalizeTerm(token)
    if (normalized.length < minimumKeyLength(normalized)) continue
    if (GENERIC_TOKENS.has(normalized)) continue
    keys.push(normalized)
  }
  return keys
}

/**
 * 匹配顺序即优先级：先认课程码（最确定的意图），再认完整标题，再分类、大学、枢纽，
 * 最后才退回单个词。
 */
export function matchTerm(term: string, index: ContentIndex): { entry: ContentEntry; via: MatchVia; key: string } | undefined {
  const normalizedTerm = normalizeTermWithBoundaries(term)
  if (!normalizedTerm.text) return undefined

  const ofKind = (kind: PageKind) => index.entries.filter(entry => entry.kind === kind)
  const search = (
    entries: ContentEntry[],
    accept: (key: string) => boolean
  ): { entry: ContentEntry; key: string } | undefined => {
    let best: { entry: ContentEntry; key: string } | undefined
    for (const entry of entries) {
      for (const key of entry.keys) {
        if (!accept(key)) continue
        if (!containsKey(normalizedTerm, key)) continue
        if (!best || key.length > best.key.length) best = { entry, key }
      }
    }
    return best
  }

  const courseEntries = ofKind('course')
  const requestedCodes = extractCodes(term, index.courseCodes)
  if (requestedCodes.length > 0) {
    const requestedAliases = requestedCodes.map(courseCodeAliases)
    const matches = courseEntries.flatMap(entry => {
      const codes = entry.codes ?? extractCodes(entry.label, index.courseCodes).flatMap(courseCodeAliases)
      const keys = requestedAliases.flatMap(aliases => {
        const key = codes.find(candidate => aliases.includes(candidate))
        return key ? [key] : []
      })
      // Every requested identifier must refer to this page, including shared identifiers such as CS50.
      if (keys.length !== requestedAliases.length) return []
      const key = keys.sort((a, b) => b.length - a.length)[0]
      return [{ entry, key, via: 'code' as const }]
    })
    // A specific missing course must not fall back to a school name, title or partial code.
    if (matches.length <= 1) return matches[0]

    // Use title evidence only among pages compatible with all codes; AI/Python distinguish CS50 AI.
    const lowerTerm = term.toLowerCase()
    const queryTokens = new Set([
      ...lowerTerm.split(/[^\p{L}\p{N}]+/u),
      ...(lowerTerm.match(/[a-z0-9]+/g) || []) // Also recognize AI in Chinese-adjacent queries such as AI视频.
    ])
    return matches.map(match => {
      const title = normalizeTerm(match.entry.label)
      const titleTokens = new Set(match.entry.label.toLowerCase().split(/[^\p{L}\p{N}]+/u))
      const tokenScore = [...titleTokens]
        .filter(token => token.length >= 2 && !/\d/.test(token) && !GENERIC_TOKENS.has(token) && queryTokens.has(token))
        .reduce((sum, token) => sum + token.length, 0)
      return { match, titleLength: containsKey(normalizedTerm, title) ? title.length : 0, tokenScore }
    }).sort((a, b) => b.titleLength - a.titleLength || b.tokenScore - a.tokenScore)[0].match
  }

  const titleHit = search(courseEntries, key => key.length >= 8 && !/\d/.test(key))
  if (titleHit) return { ...titleHit, via: 'title' }

  // 足够长的标题词（李宏毅机器学习）比分类（机器学习）更能代表用户想找的那门课。
  const strongTokenHit = search(courseEntries, key => key.length >= (isCjk(key) ? 5 : 7) && !/\d/.test(key))
  if (strongTokenHit) return { ...strongTokenHit, via: 'title' }

  const categoryHit = search(ofKind('category'), key => key.length >= MINIMUM_MATCH_KEY_LENGTH)
  if (categoryHit) return { ...categoryHit, via: 'category' }

  const universityHit = search(ofKind('university'), key => key.length >= MINIMUM_MATCH_KEY_LENGTH)
  if (universityHit) return { ...universityHit, via: 'university' }

  const hubHit = search(ofKind('hub'), key => key.length >= MINIMUM_MATCH_KEY_LENGTH)
  if (hubHit) return { ...hubHit, via: 'hub' }

  const tokenHit = search(courseEntries, key => key.length >= MINIMUM_MATCH_KEY_LENGTH && !/\d/.test(key))
  if (tokenHit) return { ...tokenHit, via: 'token' }

  return undefined
}

function missingCapabilities(entry: ContentEntry | undefined, intents: SearchIntent[]): SearchCapability[] {
  if (!entry) return []
  const owned = new Set(entry.capabilities)
  const missing: SearchCapability[] = []
  for (const intent of intents) {
    const capability = INTENT_CAPABILITY[intent]
    if (!capability) continue
    if (owned.has(capability)) continue
    if (!missing.includes(capability)) missing.push(capability)
  }
  return missing
}

function capabilityList(capabilities: SearchCapability[]): string {
  return capabilities.map(capability => CAPABILITY_LABELS[capability]).join('、')
}

function intentList(intents: SearchIntent[]): string {
  return intents
    .map(intent => INTENT_LABELS[intent])
    .filter(Boolean)
    .join('、')
}

function buildSuggestion(
  status: GapStatus,
  matched: MatchedPage | null,
  missing: SearchCapability[],
  missingCourse: string | null,
  intents: SearchIntent[]
): string {
  if (status === 'missing_course') {
    const code = missingCourse || '该课程码'
    return `站内没有 ${code}：新增课程页（path 建议 <分类>/${code.replace(/\s+/g, '')}）`
  }
  if (status === 'missing_page') {
    const intent = intentList(intents)
    return intent
      ? `没有对应页面：考虑新增「${intent}」方向的分类页或学习路线`
      : '没有对应页面：考虑新增分类页或学习路线'
  }
  if (status === 'page_gap' && matched) {
    return `${matched.label} 页缺${capabilityList(missing)}：${missing
      .map(capability => CAPABILITY_ACTIONS[capability])
      .join('；')}`
  }
  return matched ? `已覆盖：${matched.label}` : '已覆盖'
}

function priorityOf(status: GapStatus, count: number, policy: boolean): GapPriority {
  if (status === 'covered') return 'P2'
  const base: GapPriority = count >= 3 ? 'P0' : count >= 2 ? 'P1' : 'P2'
  // 政策缺口（笔记 / 历年题 / 答案 / 下载）降一档：它们不会因为「做内容」而消失。
  if (!policy) return base
  return base === 'P0' ? 'P1' : 'P2'
}

interface AnalyzeOptions {
  /** 少于这个搜索次数的词直接忽略（长尾太多时清屏用）。默认 1。 */
  minCount?: number
  /** 明细行上限，默认 200。政策缺口单独另算，不吃这个额度。 */
  maxRows?: number
  /**
   * 站内搜索命中数。后台页面传进来（`searchCourses`），报表用它把「判定已覆盖但用户搜不到」
   * 的词标出来 —— 这里的 covered 只代表页面具备该能力，不代表搜索能搜到。
   * 只对 `covered` 行调用：其他行的命中数没有用处，省掉一次无谓的搜索。
   */
  countSearchHits?: (term: string) => number
}

/** 政策缺口行最多保留多少条（它们不计入 maxRows，避免被截断后看不见）。 */
const POLICY_ROW_LIMIT = 50
/** 已覆盖行最多保留多少条（同样不吃 maxRows，否则「覆盖但搜不到」会被整段截掉）。 */
const COVERED_ROW_LIMIT = 100

export function analyzeSearchGaps(
  input: SearchTermInput[],
  index: ContentIndex,
  options: AnalyzeOptions = {}
): GapReport {
  const minCount = options.minCount ?? 1
  const maxRows = options.maxRows ?? 200

  // 仅合并同词、同课程含义、同意图的查询；notebook 与 note book 的意图不同。
  const merged = new Map<string, { term: string; count: number }>()
  for (const item of input) {
    const count = Number.isFinite(item.count) ? Math.max(0, Math.trunc(item.count)) : 0
    const term = (item.term || '').trim()
    if (!term || count < minCount) continue
    const normalized = normalizeTerm(term)
    if (!normalized) continue
    const codes = [...new Set(extractCodes(term, index.courseCodes).map(code => courseCodeAliases(code).at(-1)!))].sort()
    const key = JSON.stringify([normalized, codes, detectIntents(term)])
    const existing = merged.get(key)
    if (existing) {
      existing.count += count
      if (term.length < existing.term.length) existing.term = term
    } else {
      merged.set(key, { term, count })
    }
  }

  const rows: GapRow[] = []
  for (const { term, count } of merged.values()) {
    const intents = detectIntents(term)
    const matched = matchTerm(term, index)
    const matchedPage: MatchedPage | null = matched
      ? { kind: matched.entry.kind, path: matched.entry.path, label: matched.entry.label, via: matched.via, key: matched.key }
      : null

    let status: GapStatus
    let missing: SearchCapability[] = []
    let missingCourse: string | null = null

    if (matched) {
      missing = missingCapabilities(matched.entry, intents)
      status = missing.length > 0 ? 'page_gap' : 'covered'
    } else {
      const codes = extractCodes(term, index.courseCodes).filter(code => !courseCodeAliases(code).some(alias => index.courseCodes.has(alias)))
      if (codes.length > 0) {
        status = 'missing_course'
        missingCourse = codes[0]
      } else {
        status = 'missing_page'
      }
    }

    // 缺的东西全在「不做」清单里：这是政策缺口，补内容这条路走不通。
    const policy =
      status === 'page_gap' && missing.length > 0 && missing.every(capability => POLICY_CAPABILITIES.has(capability))
    // 只有已覆盖的行需要命中数（用来暴露「报表说覆盖、搜索却搜不到」），其余行固定 null。
    const searchHits = status === 'covered' && options.countSearchHits ? options.countSearchHits(term) : null

    rows.push({
      term,
      count,
      intents,
      matched: matchedPage,
      status,
      missing,
      missingCourse,
      suggestion: buildSuggestion(status, matchedPage, missing, missingCourse, intents),
      priority: priorityOf(status, count, policy),
      policy,
      searchHits
    })
  }

  rows.sort((a, b) => {
    const priorityOrder: Record<GapPriority, number> = { P0: 0, P1: 1, P2: 2 }
    const byPriority = priorityOrder[a.priority] - priorityOrder[b.priority]
    if (byPriority !== 0) return byPriority
    const byPolicy = Number(a.policy) - Number(b.policy)
    if (byPolicy !== 0) return byPolicy
    const byCoverage = Number(a.status === 'covered') - Number(b.status === 'covered')
    return byCoverage || b.count - a.count || a.term.localeCompare(b.term)
  })

  // 三类行各有各的额度：政策缺口和已覆盖行都不吃 maxRows —— 否则词表被缺口占满时，
  // 「一直有人在搜笔记」和「报表说覆盖、搜索却搜不到」会被整段截掉，而 summary 还在报这个数。
  const budget = { actionable: maxRows, policy: POLICY_ROW_LIMIT, covered: COVERED_ROW_LIMIT }
  const used = { actionable: 0, policy: 0, covered: 0 }
  const limited: GapRow[] = []
  for (const row of rows) {
    const bucket = row.status === 'covered' ? 'covered' : row.policy ? 'policy' : 'actionable'
    if (used[bucket] >= budget[bucket]) continue
    used[bucket] += 1
    limited.push(row)
  }

  const summary: GapSummary = {
    terms: rows.length,
    searches: rows.reduce((total, row) => total + row.count, 0),
    covered: rows.filter(row => row.status === 'covered').length,
    pageGap: rows.filter(row => row.status === 'page_gap').length,
    missingCourse: rows.filter(row => row.status === 'missing_course').length,
    missingPage: rows.filter(row => row.status === 'missing_page').length,
    policyGap: rows.filter(row => row.policy).length,
    searchMiss: rows.filter(row => row.status === 'covered' && row.searchHits === 0).length
  }

  const capabilityTotals = new Map<SearchCapability, { searches: number; terms: string[] }>()
  for (const row of rows) {
    for (const capability of row.missing) {
      const bucket = capabilityTotals.get(capability) ?? { searches: 0, terms: [] }
      bucket.searches += row.count
      if (bucket.terms.length < 8) bucket.terms.push(row.term)
      capabilityTotals.set(capability, bucket)
    }
  }
  const topMissing: CapabilityGap[] = [...capabilityTotals.entries()]
    .map(([capability, bucket]) => ({ capability, searches: bucket.searches, terms: bucket.terms }))
    .sort((a, b) => b.searches - a.searches)

  const courseTotals = new Map<string, { searches: number; terms: string[] }>()
  for (const row of rows) {
    if (!row.missingCourse) continue
    const bucket = courseTotals.get(row.missingCourse) ?? { searches: 0, terms: [] }
    bucket.searches += row.count
    if (bucket.terms.length < 6) bucket.terms.push(row.term)
    courseTotals.set(row.missingCourse, bucket)
  }
  const missingCourses: MissingCourseGap[] = [...courseTotals.entries()]
    .map(([code, bucket]) => ({ code, searches: bucket.searches, terms: bucket.terms }))
    .sort((a, b) => b.searches - a.searches)

  return { rows: limited, summary, topMissing, missingCourses }
}
