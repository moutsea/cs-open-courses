# 流量与转化统计（2026-10）

## 0. 先说现状：之前其实没在采集

排查时发现两个问题，等于「以为有数据，其实一条都没有」：

| 原配置 | 问题 |
|---|---|
| `@vercel/analytics` + `@vercel/speed-insights` | 只在 `process.env.VERCEL` 时渲染。本站跑在 Cloudflare（OpenNext + Workers），这个条件永远为假 → **从未上报过一条数据**，还白背了两个依赖 |
| `GoogleAnalytics` 组件 | 挂在 `NEXT_PUBLIC_GA_ID` 上，但 `.env.local` 里把 GA4 衡量 ID（`G-E4K4FYZ0EG`）写进了 `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` 这个变量名里 → GA 一直没被注入。而站点验证早在 `src/app/[locale]/layout.tsx` 里硬编码了 `verification.google`，那个变量名是多余的 |

已修：删掉两个 Vercel 依赖，新增 `NEXT_PUBLIC_GA_ID`，并保留 GA 作为可选（`NODE_ENV=production` 才注入）。

## 1. 三层方案（各管一件事）

| 层 | 工具 | 采集什么 | 成本 |
|---|---|---|---|
| 流量 | **本站 D1 `page_views` 表**（2026-10 新增） | PV / 日 UV / 来源 / 落地页 / 国家 / 设备，爬虫单独计数 | 免费（D1 免费额度内） |
| 转化 | **本站 D1 `analytics_events` 表** | 出站点击、搜索词、分类筛选、收藏、进度、切语言 | 免费（D1 免费额度内） |
| 兜底 | GA4（可选） | 与上面类似，但会被广告拦截挡掉 | 免费 |
| （可选）| Cloudflare Web Analytics | 第三方的 PV/UV 视角，可与自建数交叉验证 | 免费 |

流量改成自建，是为了和「转化」用同一个库：算「出站点击 / PV」这种比率时不用跨两个后台对数字。实现照抄 gpthubs.net 的做法（同一套表结构与采集链路），细节见第 10 节。

为什么不全用 GA：**做联盟变现时最关键的是「出站点击」**，而 GA 在国内命中率低、还会被 uBlock 挡；站内第一方请求基本不受影响，数据在自己库里也能直接算转化率。

## 2. 事件表设计

`migrations/0004_analytics_events.sql`：

```sql
CREATE TABLE analytics_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  occurred_at INTEGER NOT NULL,  -- unix ms
  day TEXT NOT NULL,             -- YYYY-MM-DD（Asia/Shanghai 自然日；历史 UTC 日用分批命令回填）
  name TEXT NOT NULL,            -- 事件名（白名单）
  path TEXT NOT NULL,            -- 站内路径（不含 query）
  locale TEXT NOT NULL DEFAULT '',
  target_host TEXT NOT NULL DEFAULT '',  -- 出站目标域名
  props_json TEXT NOT NULL DEFAULT '{}',
  country TEXT NOT NULL DEFAULT '',
  device TEXT NOT NULL DEFAULT ''
);
```

**明确不存**：IP、User-Agent、Cookie、任何跨站标识。国家取 `cf-ipcountry`，设备只分 `mobile` / `desktop`。

## 3. 六个事件

| 事件 | 触发点 | props |
|---|---|---|
| `outbound_click` | `src/components/AnalyticsListener.tsx` 全局捕获阶段监听，覆盖所有外链 | `host` `label` `href` `page` |
| `search` | `src/components/SearchBox.tsx` 提交时 | `q` `source` |
| `course_filter` | `src/components/CoursesContent.tsx` 侧栏筛选 | `category` `subcategory` |
| `course_favorite` | `src/components/CourseLearningActions.tsx` | `course` `action` |
| `course_progress` | 同上，进度下拉 | `course` `status` `from` |
| `language_switch` | `src/components/Header.tsx` | `from` `to` |

出站点击放在**全局捕获**而不是逐链接埋点，原因是站内有 1000+ 外链（课程官网、教材、视频），逐个埋点既难维护也容易漏。

## 4. 上传与防滥用

- 客户端 `src/lib/analytics.ts`：攒 500ms 批量，每批最多 20 条、UTF-8 请求体不超过 8 KiB。`sendBeacon` 拒绝或抛错时改用 keepalive fetch；发送失败保留有界队列，等待下一次互动或 `online` 事件重试，`visibilitychange`/`pagehide` 时排空待发送批次。**用户开了 DNT 就完全不发**。
- 服务端 `src/app/api/track/route.ts`：**拒绝明确跨站的请求**（`Sec-Fetch-Site` 非 `same-origin`/`none`，或 `Origin` 与本站不同 → 403；声明了 `content-type` 却不是 JSON → 415，跨站 no-cors 只能发简单类型）、白名单校验、字段截断（path 200 / props JSON 600 字符 / targetHost 80）、单请求 ≤20 条、单 IP 120 次/分钟（`src/lib/rateLimit.ts`，带过期清理与键数上限）。流式读取请求体，按 UTF-8 字节累计，超过 8 KiB 立即取消读取；无效 JSON、`null` 和中断上传静默 204。开发环境缺少 Cloudflare 上下文或 D1 绑定时返回 204；生产环境配置缺失，以及任意环境的 D1 写入失败均返回空响应 503，错误详情只记服务端日志。
- fetch 兜底能根据 503 保留事件，待恢复后补发；浏览器接受 `sendBeacon` 仅代表请求已排队，客户端无法读取其 HTTP 响应，因此该路径不保证数据库故障后的补发。
- **日历日口径**：两张统计表的 `day` 都按 **Asia/Shanghai（UTC+8，无夏令时）** 切分，统一由 `src/lib/calendarDay.ts` 的 `shanghaiDay()` 生成；报表窗口 `sinceDay()`、保留期截止日 `analyticsCutoffDay()` 也用同一套函数。旧版 `analytics_events.day` 写的是 UTC 日。0006/0007 仅安装幂等的 SQLite INSERT 触发器，纠正部署窗口内旧 Worker 的后续写入；迁移不再执行全表 UPDATE。历史数据由 `scripts/backfill-analytics-days.ts` 按主键顺序分批修复，每批默认 500 行（上限 1000，可调小），提交后打印恢复游标；重复运行只改仍不一致的 `day`。触发器会一直保留，新 Worker 写入正确日期时不会产生额外更新。
- **写临时 SQL 注意时区**：`day` 是北京时间自然日，而 SQLite 的 `date('now')` 是 UTC ——
  00:00–08:00 北京时间用 `date('now')` 算窗口会少一天。所有按 `day` 过滤的查询都写成
  `date('now', '+8 hours', '-N day')`（本文示例已按此修正）；按 `created_at` / `occurred_at`
  （epoch）过滤的时间戳不受影响。
- **保留期**：埋点表原先没有 TTL。`src/lib/analyticsRetention.ts` 的 `purgeAnalyticsEvents()` 按 `day < 今天-180天` 分块删除（rowid 子查询，避免依赖 `DELETE ... LIMIT` 编译开关），挂在 `worker.ts` 已有的每日 cron `17 3 * * *` 上，与 GitHub 项目同步并行执行。
- **出站 href 只记 `origin + pathname`**（`src/lib/analytics.ts` 的 `trackOutbound`）：query 里可能有邮箱、token、来源追踪参数，不该进埋点表。
- `props_json` 里会有用户输入（搜索词、筛选分类、外站路径），迁移注释已改成直说这一点，别把它当匿名聚合数据来用。
- `npm run test:analytics` 覆盖字段校验、真实 POST 处理、字节边界、上传取消、Beacon/fetch 兜底、离线恢复和页面离开时的批量发送；同时验证真实客户端经 POST 遇到 D1 故障、恢复补发及成功后清空队列。

## 5. 数据在哪看（后台 + 两个外部入口）

| 入口 | 能看到什么 | 位置 |
| --- | --- | --- |
| **站内后台** | PV / 日 UV / 爬虫 / 人均页数、访问趋势、热门页面、来源、国家、设备，以及出站点击（域名/来源页）、搜索词、分类筛选、收藏与进度、语言、每日事件量 | `/admin` → `/admin/analytics?days=7\|30\|90` |
| Cloudflare Web Analytics（可选） | 第三方的 PV/UV 视角 | dash.cloudflare.com → 选 `cs61bbeyond.com` → Analytics → Web Analytics |
| Google Analytics 4（可选） | 实时访问、渠道、留存 | analytics.google.com（需要 `NEXT_PUBLIC_GA_ID`，且只在生产构建注入） |

后台现在自己就能回答「来了多少人」（`page_views`）和「这些人点了什么」（`analytics_events`），联盟/订阅的转化只看得到后者。

### 5.1 结构

```
/admin/login      登录页（唯一公开的 admin 路由）
/admin            概览：4 个指标卡 + 近 7 天趋势 + Top10 + 跳完整看板
/admin/analytics  流量看板：5 个指标卡 / 出站 / 搜索词 / 筛选 / 趋势 / 语言·设备·国家
/admin/gaps       内容缺口：搜了但站内没答上来的词 → 该补哪几门课（见第 9 节）
```

导航在顶部（概览 · 流量看板 · 内容缺口 · 退出）。以后要加「订阅列表」「死链报告」之类，直接加 `src/app/admin/<section>/page.tsx` 并在 `src/components/admin/AdminNav.tsx` 的 `LINKS` 里加一行即可。

### 5.2 密码

密码只来自环境变量 `ADMIN_PASSWORD`（**没配置时登录页会明确报「服务器没有配置密码」并拒绝登录**，不会静默放行）。

```bash
# 线上
npx wrangler secret put ADMIN_PASSWORD
npm run deploy:cf

# 本地：写进 .dev.vars（已 gitignore）
ADMIN_PASSWORD=你的密码
```

**可选的独立签名密钥** `ADMIN_SESSION_SECRET`（推荐线上配一个）：

```bash
npx wrangler secret put ADMIN_SESSION_SECRET
```

不配时签名密钥就是密码本身（旧行为）；配了之后 cookie 的 HMAC 密钥是 `密钥 + 密码`：

- 光拿到密码不足以离线伪造 cookie（还得知道 secret）；
- **改密码仍然让所有旧 cookie 失效**（密码还在材料里，这个特性保留）；
- 换 secret 等于强制所有人重新登录（相当于「吊销全部会话」的手段，见下）。

### 5.2.1 登录失败节流

`src/lib/loginThrottle.ts`：**只统计失败**，同一 IP 10 分钟内失败 8 次后锁定，登录成功即刻清零。

- 键是客户端 IP（`cf-connecting-ip`，回退 `x-forwarded-for` 第一段）；拿不到 IP 时退化成一个共享桶，避免出现「没 IP 就不限流」的空档。
- 被锁定时登录页显示「失败次数太多了，等 10 分钟再试」（`?error=throttled`），并且**先查节流再比密码**，不在锁定期间做无谓的恒定时间比较。
- 计数器在 isolate 内存里，多 isolate 会放大额度；要精确就得上 Durable Object。
- 仍不解决的问题：cookie 是无状态的，**退出登录只删客户端 cookie，不能吊销已泄露的 token**。要真吊销需要会话表或 epoch 声明；目前最接近的手段是换 `ADMIN_SESSION_SECRET`（全员重登，最多 7 天窗口）。

### 5.3 实现要点

- **不再是 Basic Auth**：Basic Auth 需要 route handler 才能返回 401，做不了「退出登录」和错误提示。现在用「登录页 + 无状态 cookie」：
  - cookie `cs61b_admin` 使用带版本、签发时间、过期时间和随机 nonce 的 HMAC-SHA256 签名凭证（`httpOnly` + `SameSite=Lax` + 7 天），服务端同时验证签名和有效期；
  - 服务端不存 session、不加表；**改密码 → 所有旧 cookie 立即失效**；
  - 密码本身不进 cookie。
- 旧版永久哈希 Cookie 不再接受；部署这一变更后，已有后台登录需要重新登录。`npm run test:admin` 覆盖到期边界、篡改、密码轮换及旧凭证拒绝。
- `src/lib/adminAuth.ts`：`getAdminPassword()`（先读 Cloudflare 绑定，再回落 `process.env`）、`isAuthenticated()`、`requireAdmin()`（未登录 → `redirect('/admin/login?next=…')`）。
- `src/app/admin/actions.ts`：`loginAction` / `logoutAction` 两个 server action；`next` 参数只允许 `/admin` 开头的站内路径，防开放重定向；比较密码用恒定时间比较。
- `src/app/admin/layout.tsx`：`/admin` 是独立于 `[locale]` 的一棵路由树，自带 `<html>/<body>`（项目没有 `src/app/layout.tsx`），所以后台不受 next-intl 语言前缀影响。
- 三个 admin 页面都是 `force-dynamic`，并带 `robots: { index: false }`；`src/app/robots.txt/route.ts` 也加了 `Disallow: /admin/`。
- `src/middleware.ts` 的 matcher **包含** `admin`：`/admin/*` 会先过一层主机检查再 `NextResponse.next()` 放行（不交给 next-intl，否则会被加上语言前缀而 404）。
- **后台只在正式域名和本地可见**：`allowsAdminHost()`（`src/lib/canonicalRedirect.ts`）允许 `cs61bbeyond.com` / `www` / `localhost` / `127.0.0.1` / `*.local`，其余主机（`*.workers.dev`、`*.pages.dev` 之类的副本）访问 `/admin` 直接 404。`wrangler.jsonc` 的 `workers_dev` / `preview_urls` 已经关掉，这条规则作为纵深防御保留；非正式域名的响应还会被 `worker.ts` 打上 `X-Robots-Tag: noindex`，避免同一内容在多个域名下重复收录。
- `src/lib/analyticsReport.ts`：聚合 SQL 单独放常量，方便本地用 sqlite 直接验证语法（已用种子数据跑通全部 10 条）。
- `days` 只接受 7 / 30 / 90，其它值回落 30，避免别人拿参数让 D1 扫全表。

### 5.4 想自己写 SQL

```bash
# 命令行
npx wrangler d1 execute cs-courses --remote --command "SELECT day, COUNT(*) FROM analytics_events GROUP BY day ORDER BY day DESC LIMIT 7"

# 或者 Cloudflare 后台 → Storage & Databases → D1 → cs-courses → Console（有表格界面，可导出 CSV）
```

本地也有 D1：`npm run db:migrate:local` 之后，`next dev` 和 `wrangler dev` 都能读到 `.wrangler/state/v3/d1` 里的同一份数据，所以本地也能对着真表调后台。

## 6. 上线步骤

```bash
# 1) 建表并安装日期纠正触发器（生产库；不执行历史全表 UPDATE）
npm run db:migrate:prod

# 1.5) 分批修复历史 UTC 日，每批独立提交（默认最多 500 行）
#      必须先执行 migration；触发器会保护回填期间旧 Worker 的新写入。
npm run db:backfill:analytics-days -- --remote
# 若中断，用最后一条 Committed 日志给出的 after-id/through-id 续跑；
# 也可不传游标从头重跑（幂等，但会重新扫描已完成的主键范围）。
# npm run db:backfill:analytics-days -- --remote --batch-size 100 --after-id <id> --through-id <id>

# 2) Cloudflare 后台 → Analytics → Web Analytics → 添加站点，拿到 token
#    写进环境变量（构建时注入）
#    NEXT_PUBLIC_CF_ANALYTICS_TOKEN=<token>

# 3) 后台密码（不设的话 /admin 登录页会拒绝登录）
npx wrangler secret put ADMIN_PASSWORD

# 3.5) 可选：PV/UV 访客哈希的盐（不配则复用 ADMIN_SESSION_SECRET）
npx wrangler secret put ANALYTICS_SALT

# 4) 重新构建部署；0006/0007 INSERT 触发器会纠正部署期间旧 Worker 写入的 UTC 日期
npm run deploy:cf
```

本地验证（`wrangler dev` 有真实 D1）：

```bash
npm run db:migrate:local
npm run cf:dev
curl -X POST localhost:8787/api/track -H 'content-type: application/json' \
  -d '{"events":[{"name":"outbound_click","path":"/zh/courses","locale":"zh","targetHost":"cs61b.org","props":{"host":"cs61b.org"}}]}'
npx wrangler d1 execute cs-courses --local --command "SELECT name, path, target_host FROM analytics_events"

# 打开后台看一遍（本地密码在 .dev.vars 的 ADMIN_PASSWORD）
open http://localhost:3000/admin
```

### 6.1 图表浏览器烟测

需要 Node 22+、已配置 `ADMIN_PASSWORD` 的本地 Next 服务，以及导出 `launchChrome()` 的 browser-safe helper。helper 必须使用独立浏览器二进制和临时 profile；可放在 `tools/browser-safe/chrome.mjs`，或通过 `SMOKE_CHROME_HELPER` 指定路径。可用 `DSH_CHROME_BIN` 指向独立的 `chrome-headless-shell`。

```bash
# 在一个终端启动本地服务（与烟测使用相同的 ADMIN_PASSWORD）
npm run dev -- --port 3101

# 在另一个终端运行；.dev.vars 中的 ADMIN_PASSWORD 仅用于真实登录表单
SMOKE_CHROME_HELPER=/path/to/browser-safe/chrome.mjs \
SMOKE_BASE_URL=http://localhost:3101 \
node --env-file=.dev.vars tools/verify-tab.mjs

# 无需真实密码或 Next 服务的烟测回归：15 个成功/失败/中断用例
SMOKE_CHROME_HELPER=/path/to/browser-safe/chrome.mjs node tools/test-verify-tab.mjs
```

烟测只接受 loopback 地址。每次从未登录的新 profile 开始，提交真实登录表单，再验证受保护页、hydration、Tab/Shift+Tab、方向键/Home/End、tooltip 和触屏点按。tooltip 除了有尺寸，也必须自身及祖先可见且 opacity 大于 0。登录失败、缺 helper、断言失败、控制台 error/warning 或未捕获异常均退出 1，全部通过才退出 0。正常结束或收到 SIGINT/SIGTERM 时均等待关闭自己启动的浏览器并清理 profile；中断分别退出 130/143，重复信号共享一次清理。回归还覆盖启动中、CDP 连接中、页面加载中和清理中的中断，检查实际进程和 profile 都已移除。

## 7. 周报用的 SQL

```sql
-- 出站点击排行（联盟转化先看这个）
SELECT target_host, COUNT(*) AS clicks, COUNT(DISTINCT path) AS pages
FROM analytics_events
WHERE name = 'outbound_click' AND day >= date('now', '+8 hours', '-6 day')
GROUP BY target_host ORDER BY clicks DESC LIMIT 20;

-- 哪类页面最能把人送出去（内容转化率）
SELECT path, COUNT(*) AS clicks
FROM analytics_events
WHERE name = 'outbound_click' AND day >= date('now', '+8 hours', '-6 day')
GROUP BY path ORDER BY clicks DESC LIMIT 20;

-- 搜索词（发现内容缺口，也是以后做关键词的依据）
SELECT json_extract(props_json, '$.q') AS q, COUNT(*) AS times
FROM analytics_events
WHERE name = 'search' AND day >= date('now', '+8 hours', '-29 day')
GROUP BY q ORDER BY times DESC LIMIT 50;

-- 筛选热力（决定哪些分类值得做落地页 / 加内容）
SELECT json_extract(props_json, '$.category') AS category, COUNT(*) AS uses
FROM analytics_events
WHERE name = 'course_filter' AND day >= date('now', '+8 hours', '-29 day')
GROUP BY category ORDER BY uses DESC;

-- 收藏 / 进度：验证「用户真的在学」而不只是路过
SELECT json_extract(props_json, '$.action') AS action, COUNT(*) FROM analytics_events
WHERE name = 'course_favorite' AND day >= date('now', '+8 hours', '-29 day') GROUP BY action;

-- 语言分布（决定英文内容值不值得继续投）
SELECT locale, COUNT(*) FROM analytics_events
WHERE name = 'outbound_click' AND day >= date('now', '+8 hours', '-29 day') GROUP BY locale;
```

## 8. 隐私口径

站内不弹 Cookie 同意框，因为：

- Cloudflare Web Analytics 无 Cookie、无指纹，官方定位为隐私友好分析；
- 第一方两张表（`analytics_events` / `page_views`）都不存 IP / User-Agent / Cookie，也没有跨会话 ID，无法反查到个人；
- `page_views` 的访客标识是 `sha256(IP + UA + 当日 + 盐)`：盐每天参与运算，同一个人昨天和今天的哈希不同，所以库里凑不出「某个人的历史轨迹」，也就不能做跨天去重（报表里的 UV 一律是「日 UV 合计」）。

GA4 如果启用，则属于第三方 Cookie 范畴；考虑到主要受众在中文区（GA 命中率低），建议**先不上 GA，等需要做归因再开**，开之前补一句隐私说明。

## 9. 内容缺口：搜索词倒推「该补什么」

看板只告诉你「用户搜了 csapp 中文 pdf」，但不会告诉你「这句话我们答不上来」。`/admin/gaps` 把这件事自动化：拿搜索词去比站内 198 个页面，能答上的标 `covered`，答不上的算缺口并给出补法。

### 9.1 判定逻辑（`src/lib/searchGaps.ts`，纯函数）

| 步骤 | 做什么 | 例子 |
| --- | --- | --- |
| 归一化 | 小写、去空白与标点；只有识别出的课程编号和意图也相同时才合并 | `CS 61B` / `cs-61b` 合并计数；`Java 6.031` 与 `Java6.031`、`notebook` 与 `note book` 分开统计 |
| 认页面 | 从目录识别完整编号、简称及带空格的编号；解析资源文件名时优先保留目录编号和带明确院系或学校前缀的编号（含前缀与数字间的下划线），只过滤其余资源序号、数字分段及说明；版本标记跨文件名分隔符生效，数字编号先读完整再匹配，不从版本或更长编号中截取简称；不跨越空白、斜杠或逗号等查询分隔符；资源词后的数字课程编号仍保留，目录已有完整标识优先；同一页面需兼容查询中的所有编号，共享编号再按完整标题和关键词消歧；未知编号直接算缺课；其他词依次匹配标题、长标题词、分类、大学、枢纽和弱词 | `lab03-CS_61B.pdf` 匹配 CS61B 并报告下载缺口，`CS61B lab03-CS_999` 仍报 CS_999 缺课；`CS61B lab03-v_6.031` 不引入另一门课程，`video-6031.2.mp4` 不截短为 6031；`lab03-part01-MIT6.S081-part02.pdf` 保留课程匹配并过滤分段说明，`lab-6.828-part01.pdf` 仍报 6.828 缺课；`CS50: This is CS50x` 指向入门课，`CS50 AI` 指向 AI 课 |
| 排除版本 | 排除常见语言、运行时和软件库版本（含 NumPy、SciPy、JRE、MATLAB），支持 `==`、`>=`、`~=` 等约束及连续范围；名称后仅有空格分隔、数字为单段或以一个点/连字符分隔的两段且对应目录课程时，才保留课程号；多段版本、连写、明确 v/version 标记及版本约束仍按版本处理 | `CS229 NumPy==1.26.4`、`CS229 NumPy>=1.26.4,<2.0.0` 不会产生假缺课，后面的 `CS999` 仍报缺课；`Java 6.031` 保留课程号，`Java 6.0.31` 不会误认成 6.031 |
| 读意图 | 中文按词表识别；英文按字母边界匹配，保留常用复数、短语、资源序号及中英文相邻写法；复合词别名允许连写、空格、连字符和下划线 | `cheat sheet` / `cheat-sheet` / `cheatsheet` 都识别笔记需求，`e-book` / `ebook` 都识别下载需求；`MATLAB` / `Colab` 不触发实验需求，`lab03` 仍识别为实验 |
| 比能力 | 用规范课程路径查指南，合并人工视频目录，只计入有链接且未标记不可用的资源 | 已整理的 CS70 视频算覆盖；CS242 的「无视频」仍算缺口 |
| 定优先级 | 已覆盖恒 P2；否则 3 次以上 P0、2 次 P1；缺的全是「已决定不做」素材的词降一档；同优先级缺口按搜索次数降序 | `mit 6.824 笔记` 再热也停在 P1，不挤占可行动项 |
| 截取明细 | 可行动项上限 200 条；政策缺口（50）和已覆盖行（100）各自另算额度，不吃这 200 | 词表被缺口占满时，「一直有人搜笔记」和「报表说覆盖、搜索却搜不到」不会被整段截掉 |

三种缺口状态：`page_gap`（页面在，但缺这块内容）、`missing_course`（搜的课程码站内没有，如 `6.828`）、`missing_page`（既不是课也不是分类，如 `csdiy`）。

### 9.2 站内已明确不做的四类：降一档、单独归组

「笔记 / 历年题」站内没有，「作业答案 / PDF 下载」明确不做。这四类**恒为缺口**且补不了，所以优先级降一档（P0→P1），报表里归到「已决定不做」分组。它们不计入明细上限——`xx 笔记` 被搜 1000 次这件事本身还是有用的信号，不能被截掉。

- `笔记 / 讲义/notes` → 改成指向官方讲义 / 社区笔记的外链，或明写「本站不提供笔记」。
- `历年题/past exam/真题` → 改成说明「不提供历年题」并链到官方 archive / 课程主页。
- `答案/题解/solution` → 建议改成「卡住了怎么办」指引（官方 FAQ / 讨论区 / 调试方法），不提供答案。
- `pdf/电子书/下载` → 建议改成「教材获取方式」，链到官方或出版社，不做 PDF 分发。

### 9.3 覆盖 ≠ 搜得到（最容易踩的坑）

`covered` 只说明**页面具备该能力**（比如 CS61B 页有 video 条目），它不代表 `/api/search` 能搜到：搜索走的是另一套生成索引（`src/data/generated/course-search-index.json`），按 token 做字段匹配，索引里没有「视频」「笔记」这类字眼。实测 360 条「课程码 + 意图词」组合里，153 条判 `covered`，其中 **142 条真实搜索返回 0 条**。

所以报表多了一列命中数：`analyzeSearchGaps` 接受 `countSearchHits`（后台用 `searchCourses` 注入），行上带 `searchHits`，`summary.searchMiss` 统计「判定已覆盖但搜索 0 条」的词数，页面上单列一块「报表说覆盖，搜索却搜不到」。这类词该修的是搜索索引，不是新建页面。

### 9.4 实测（本地灌了 94 条模拟搜索）

| 搜索词 | 判定 | 建议 |
| --- | --- | --- |
| `操作系统 lab`（10 次，P0） | 分类页缺 `作业 / Lab` | 补 Lab 入口与题量说明 |
| `csapp 中文 pdf`（8 次，P1） | CSAPP 缺 `PDF 下载` | 不做 PDF，改「教材获取方式」；已决定不做 → 降一档 |
| `mit 6.824 笔记`（6 次，P1） | MIT6.824 缺 `笔记 / 讲义` | 补社区笔记链接 + 本课要点摘要；已决定不做 → 降一档 |
| `mit 6.s081 lab 答案`（3 次，P1） | 缺 `作业答案` | 改「卡住了怎么办」指引；已决定不做 → 降一档 |
| `6.828 中文`（2 次，P1） | 站内没有这门课 | 新增课程页 |

覆盖情况：25 个词里 16 个已命中（`cs61b 教材`→课程页、`数据库 课程推荐`→分类、`计算机 学习路线`→枢纽、`斯坦福 计算机 课程`→大学页），说明匹配没跑偏。

### 9.5 什么时候看

搜索量小时（<50 次/周）别急着补内容——先看「已覆盖的词」确认匹配没跑偏（带「搜不到」红标的要留神），再看 P0 那几行。真正值得动手的是「同一个词被搜 3 次以上、且落地页确实缺」的项。

截图：`reports/analytics-preview/admin-gaps.png`（桌面）、`admin-gaps-mobile.png`（390px）。

## 10. PV / UV：自己在 `page_views` 里数（2026-10 新增）

照抄 gpthubs.net 的采集链路，因为那边已经趟过一遍坑。核心取舍：**不引第三方、不弹 Cookie 同意框、不存原始 IP/UA**。

### 10.1 为什么不直接用 Cloudflare Web Analytics / GA

| 方案 | 好处 | 为什么不选 |
|---|---|---|
| Cloudflare Web Analytics | 零代码、免 Cookie | 只能看它的固定几个视图；算「出站点击 ÷ PV」得跨后台对数字 |
| GA4 | 生态最全 | 国内命中率低、被广告拦截挡、属于第三方 Cookie（要补同意框） |

自己存 D1 的代价是要写采集代码，好处是 PV/UV 和转化事件在同一张库、同一套 SQL 里，比率随手算。

### 10.2 表结构（`migrations/0005_page_views.sql`）

```sql
CREATE TABLE page_views (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  day TEXT NOT NULL,                -- Asia/Shanghai 自然日（不是 UTC）
  path TEXT NOT NULL,               -- 已归一：去 query/hash、合并重复斜杠、去 /index 与末尾斜杠
  referrer_host TEXT NOT NULL DEFAULT '',  -- 收敛成主机名；站内跳转记空串
  utm_source TEXT NOT NULL DEFAULT '',
  utm_medium TEXT NOT NULL DEFAULT '',
  utm_campaign TEXT NOT NULL DEFAULT '',
  visitor_hash TEXT NOT NULL,       -- sha256(IP + UA + 当日 + 盐)，跨天失效
  country TEXT NOT NULL DEFAULT '',
  device TEXT NOT NULL DEFAULT 'desktop',
  is_bot INTEGER NOT NULL DEFAULT 0,
  collection_method TEXT NOT NULL DEFAULT 'browser', -- browser / bot / legacy
  event_id TEXT,                    -- 每次浏览一个 UUID，唯一索引用来吞掉重传
  created_at INTEGER NOT NULL
);
CREATE UNIQUE INDEX page_views_event_id_idx ON page_views(event_id);
```

四种索引各管一个查询：`(collection_method, day, is_bot)` 给概览、`(day, path)` 给热门页面、`(day, visitor_hash)` 给 UV、`created_at` 给清理。

### 10.3 采集链路

```
浏览器（PageViewTracker）
  └─ POST /api/analytics/page-view  ── 同源校验 → content-type → 爬虫跳过 → 限流 → 去重入库
爬虫（middleware）
  └─ recordPageView({collectionMethod:'bot'}) ── 只计数，不进 PV
每日 cron（worker.scheduled）
  └─ purgePageViews() 删 180 天前的行（另有 2% 概率在写入时顺手清理）
```

- **只在页面真的展示后上报**：`PageViewTracker` 检查 `document.visibilityState === 'visible'`，后台标签页不算；`pageshow`（BFCache 恢复）会换新 eventId 再报一次。
- **路由观察器单独放在 Suspense 中**：主采集器仍按 pathname 计 PV；查询参数或纯锚点导航只同步历史条目的来源快照，不增加 PV，也不让页面整体退化为客户端渲染。观察器保留 `useSearchParams()` 对象依赖，确保连续 Next Link 锚点导航的每个历史条目都能保存来源；入口 UTM 从 `window.location.search` 读取。
- **来源绑定到当前历史条目**：站内导航沿用入口来源；刷新和历史恢复只读取当前条目的来源快照。若新入口在 hydration 前刷新、尚无快照，则使用当前文档的 UTM/referrer；不会借用 `sessionStorage` 中上一次入口的来源。快照缺失且文档没有外部来源信息时记为未知。
- **只发 pathname + referrer + 3 个 UTM**：筛选参数（`?filter=os`）、订单号之类不会进采集请求，也不入库。
- **去重靠 `event_id` 唯一索引**：React StrictMode 双跑 effect、重传、BFCache 都不会把 PV 数翻倍。
- **爬虫两条路**：执行 JS 的爬虫在接口层被 `isBotUserAgent()` 挡掉（`204`），不执行 JS 的由 middleware 单独记账；预加载（`rsc` / `next-router-prefetch` / `purpose: prefetch`）不计。

### 10.4 指标口径（看报表时要记住的三件事）

1. **UV 是「日 UV 合计」，不是独立访客数。** 标识每天换盐，跨天无法去重，所以把 7 天的日 UV 加起来会重复计数。想要严格 UV 必须有跨会话 ID（= 指纹/Cookie），本站在隐私上不这么做。
2. **PV 只统计「真的看到」的访问。** 脚本被拦截、无 JS、屏幕阅读器/文本浏览器、`prefetch` 都不计；所以自建 PV 一般略低于服务端访问日志，属于正常。
3. **爬虫单独一列，绝不混进 PV。** 否则一个 Googlebot 扫站点就能把 PV 打爆，趋势图完全失真。

### 10.5 常用 SQL

```sql
-- 最近 7 天的 PV / 日 UV 合计（爬虫不算）
SELECT COUNT(*) AS pv, COUNT(DISTINCT day || ':' || visitor_hash) AS visitor_days
FROM page_views
WHERE collection_method = 'browser' AND is_bot = 0 AND day >= date('now', '+8 hours', '-6 day');

-- 每日趋势（含爬虫）
SELECT day,
       SUM(CASE WHEN collection_method = 'browser' AND is_bot = 0 THEN 1 ELSE 0 END) AS pv,
       COUNT(DISTINCT CASE WHEN collection_method = 'browser' AND is_bot = 0 THEN visitor_hash END) AS uv,
       SUM(CASE WHEN collection_method = 'bot' THEN 1 ELSE 0 END) AS bots
FROM page_views WHERE day >= date('now', '+8 hours', '-29 day') GROUP BY day ORDER BY day;

-- 热门页面
SELECT path, COUNT(*) AS pv FROM page_views
WHERE collection_method = 'browser' AND is_bot = 0 AND day >= date('now', '+8 hours', '-29 day')
GROUP BY path ORDER BY pv DESC LIMIT 20;

-- 转化率：出站点击 ÷ PV（这才是自建两个表的用处）
SELECT
  (SELECT COUNT(*) FROM analytics_events
    WHERE name = 'outbound_click' AND day >= date('now', '+8 hours', '-29 day')) AS outbound,
  (SELECT COUNT(*) FROM page_views
    WHERE collection_method = 'browser' AND is_bot = 0 AND day >= date('now', '+8 hours', '-29 day')) AS pv;
```

### 10.6 已知限制

- **限流是 isolate 内存**（120 次/分钟/IP）：多 isolate 时实际阈值会被放大。要全局限流得换 Durable Object 或 D1 计数表。
- **没有跨天 UV**：设计如此（见 10.4）。
- **`page_views` 会随访问量增长**：靠每日 cron 的 180 天保留期 + 写入时 2% 概率顺手清理来抑制；单条约 100 字节。
- **接口层的爬虫判定是正则**：`BOT_PATTERN` 漏掉的爬虫会被算进 PV，反过来名字里带 `bot` 的正常浏览器（极少）会被漏计。
- **同一次浏览的多标签页算多次**：`event_id` 是每个标签页各生成一个，用户在两个标签页看同一门课就是 2 PV（这是 PV 的正常口径，不是 bug）。

### 10.7 测试

`tests/page-views.test.ts`（14 例）+ `tests/page-view-route.test.ts`（7 例），都跑在**真实的 D1** 上（`miniflare`，已是 devDependency，见 `tests/helpers/d1.ts`）：迁移直接跑 `migrations/0005_page_views.sql`，断言的是「库里真的多了几行、聚合结果对不对」，而不是 SQL 字符串长什么样。覆盖：路径归一、来源收敛、设备/爬虫分类、北京时间日切、同日同人同哈希而隔日不同、PV/UV/来源/页面聚合与补零、重传去重、越界区间夹取、保留期分块清理、接口的同源/类型/爬虫/畸形请求/限流。
