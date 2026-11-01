# 品牌与视觉规范（CS61B & Beyond）

## 构成

全部为**纯色**，不使用渐变。

| 元素 | 说明 |
| --- | --- |
| 标记（mark） | 青色圆角纯色牌 + 深色 `B` 字形：`B` 对应 CS61B，也是整站的记忆点（电脑轮廓版本备选见 `public/brand/mark-monitor.svg`） |
| 字标（wordmark） | `CS61B` 纯白 + `& Beyond` 青色；两段同字号、同字重，只靠颜色区分层级 |
| 辅助信息 | 头部副标题「免费 CS 课程与学习路径」，10px、`tracking-[0.06em]`、`text-white/45` |

色值：

| 用途 | 色值 | Tailwind 近似 |
| --- | --- | --- |
| 标记底色 / 强调色 | `#06B6D4` | cyan-500 |
| 字标强调（`& Beyond`） | `#67E8F9` | cyan-300 |
| 标记内 `B` | `#0B1220` | 近黑（比站点 `slate-950` 略亮一档） |
| 深色底 | `#0B1220` | 用于图标与 OG 背景 |

## 组件

- `src/components/brand/BrandMark.tsx` — 纯 SVG 标记，props：`size`、`gradientId`、`className`、`title`。**同一页面渲染多个标记时必须传不同的 `gradientId`**（头部 `brand-mark-header`、页脚 `brand-mark-footer`），否则 SVG 渐变 id 冲突。
- `src/components/brand/BrandLockup.tsx` — 标记 + 字标组合，props：`size`、`subtitle`、`gradientId`、`variant`（`header` / `footer`）。
- 使用位置：`src/components/Header.tsx`（40px 标记 + 18px 字标 + 副标题）、`src/components/Footer.tsx`（46px 标记 + 20px 字标，整块可点击回首页）。

## 静态资源

| 文件 | 用途 | 说明 |
| --- | --- | --- |
| `public/brand/mark.svg` | 标记源文件 | 所有位图资源都由它生成 |
| `public/brand/og.svg` | 社交分享图源文件 | 1200×630 |
| `public/favicon.svg` | 浏览器图标 | 由 mark 压缩而来，**659B**（旧文件 1.5MB） |
| `public/favicon.ico` | 兼容图标 | 16/32/48 三尺寸，脚本内直接拼 ICO 结构 |
| `public/icon-192.png` / `icon-512.png` | PWA 图标 | manifest 引用 |
| `public/apple-touch-icon.png` | iOS 主屏图标 | 180×180，满幅渐变（系统自行切圆角） |
| `public/logo.png` | 结构化数据 / manifest 兜底 | 512×512 |
| `public/og.jpg` | `og:image` | 1200×630，51KB |

重新生成：

```bash
node scripts/generate-brand-assets.mjs
```

脚本依赖 `sharp`（仓库已安装），会一次性产出上表里的所有位图与 `favicon.ico`。

## 设计约束

1. 标记由底板（`#06B6D4` 圆角方）+ `B` 笔画（6.4/64，圆头）构成；16px 下仍保持 ≥1.5px 笔画，可辨。
2. 只有一个彩色（青色）+ 一个墨色（`#0B1220`），单色印刷可用。
3. 备选：`public/brand/mark-monitor.svg` 是「青色牌 + 电脑简笔画轮廓 + 屏幕内 B」的版本，想换回电脑图标时用它覆盖 `mark.svg` 再跑一次资源脚本即可。
2. 品牌元素只用两种颜色：青色 + 近黑（外加白色文字），**不使用渐变**。
3. 头部品牌区不再使用带边框的「药丸」容器，改为透明背景 + hover 时 6% 白色叠加，避免与导航胶囊抢视觉。
4. 页脚品牌块替换原「渐变文字标题」，改为标记 + 字标 + 描述，保持与头部同一套 token。
5. 头部两条装饰线（顶部发丝线、导航激活下划线）与移动端 CTA 一并改为纯色，避免与扁平品牌冲突。

## 设计系统（2026-10 深色主题收敛）

全站统一为「深色底 + 青色单一强调」，不再使用蓝/紫渐变与浅色卡片。

### 颜色

| 用途 | 值 | Tailwind |
| --- | --- | --- |
| 页面底 | `#020617` → `#0b162f` 渐变（ImmersivePage 内置） | slate-950 |
| 面板/卡片底 | 白色 5% 透明 | `bg-white/5` |
| 面板 hover | 白色 10% 透明 | `hover:bg-white/10` |
| 描边 | 白色 10% / hover 25% | `border-white/10` / `hover:border-white/25` |
| 主强调 | `#22D3EE` | cyan-400（按钮底）、cyan-200（链接/图标）、cyan-300（字标强调） |
| 正文 | 白色 70% | `text-white/70` |
| 次要 | 白色 55% | `text-white/55` |
| 元信息 | 白色 45% | `text-white/45` |
| 语义色 | emerald（入门/免费/成功）、amber（进阶/星级）、rose（高阶） | `bg-{color}-400/15 text-{color}-200` |

### 圆角

只有 4 档：`rounded-lg`(8) / `rounded-xl`(12) / `rounded-2xl`(16) / `rounded-3xl`(24)、以及 `rounded-full`（胶囊/按钮）。
禁止任意值圆角（`rounded-[28px]` 之类已全部清除）。

### 字号

| 层级 | 类 |
| --- | --- |
| H1 | `text-4xl sm:text-5xl font-bold leading-tight` |
| H2 | `text-2xl sm:text-3xl font-semibold` |
| H3 | `text-xl font-semibold` |
| 正文 | `text-base leading-relaxed` |
| 元信息 | `text-xs` / `text-sm` |

### 组件规格

- 面板：`rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-8 backdrop-blur-xl`
- 主按钮：`rounded-full bg-cyan-400 px-5 py-2.5 text-sm font-semibold text-slate-950 hover:bg-cyan-300`
- 次按钮：`rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white hover:border-white/30 hover:bg-white/10`
- 文字链接：`text-cyan-200 underline underline-offset-4 hover:text-cyan-100`
- 图标块：`rounded-2xl bg-cyan-400/15 p-3 text-cyan-200`
