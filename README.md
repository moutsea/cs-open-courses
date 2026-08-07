# CS61B & Beyond

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4-38B2AC)](https://tailwindcss.com/)
[![Website](https://img.shields.io/badge/Website-cs61bbeyond.com-blue)](https://www.cs61bbeyond.com/)

**English** | [中文](#中文)

**🌐 Official Website:** [https://www.cs61bbeyond.com/](https://www.cs61bbeyond.com/) | [中文版](https://www.cs61bbeyond.com/zh/)

## English

### 🎓 Project Overview

CS61B & Beyond is a modern, beautifully designed computer science learning platform built upon the excellent open-source project [cs-self-learning](https://github.com/pkuflyingpig/cs-self-learning/) by **pkuflyingpig**. This platform transforms comprehensive CS educational resources into an engaging, user-friendly web experience with enhanced features and optimizations.

### 🌟 Features

#### 📚 Rich Course Content
- **130+ Courses**: Comprehensive coverage across 26+ CS categories
- **Top Universities**: Curated content from MIT, Stanford, Berkeley, CMU, Princeton, and more
- **Bilingual Support**: Full Chinese and English language support
- **Structured Learning**: Organized by categories and skill levels

#### 🎨 Modern UI/UX Design
- **Responsive Design**: Seamless experience across all devices
- **Beautiful Interface**: Clean, modern design with smooth animations
- **Dark/Light Mode**: Comfortable viewing in any environment
- **Interactive Components**: Engaging user interactions and micro-animations

#### 🔍 Advanced Search & Navigation
- **Smart Search**: Real-time search across all course content
- **Intuitive Navigation**: Easy browsing by category, university, or difficulty
- **Learning Paths**: Guided learning journeys for beginners
- **Course Metadata**: Detailed information including duration, difficulty, and programming languages

#### 🚀 Technical Excellence
- **Next.js 15**: Cutting-edge React framework with App Router
- **TypeScript**: Type-safe development for better code quality
- **Tailwind CSS 4**: Utility-first CSS framework for rapid styling
- **MDX Support**: Enhanced markdown with React components
- **Optimized Performance**: Fast loading and smooth interactions

### 🏗️ Architecture

Built with modern web technologies for optimal performance and maintainability:

- **Frontend**: Next.js 15 with App Router and TypeScript
- **Styling**: Tailwind CSS 4 with custom design system
- **Content**: MDX for rich documentation with React components
- **Internationalization**: Built-in i18n support for multiple languages
- **Search**: Custom search implementation with real-time indexing

### 📊 Content Statistics

- 📖 **266+ Course Documents**: Comprehensive learning materials
- 🎯 **26 Categories**: From programming basics to advanced topics
- 🌍 **26 Universities**: Top-tier institutions worldwide
- 🗣️ **2 Languages**: Complete Chinese and English support
- 🎓 **130+ English Courses**: Optimized for English learners
- 🎓 **128+ Chinese Courses**: Native language content

### 🙏 Acknowledgments

This project would not be possible without the incredible work of **pkuflyingpig** and the [cs-self-learning](https://github.com/pkuflyingpig/cs-self-learning/) community. Their dedication to creating comprehensive, high-quality CS educational resources has been invaluable.

Special thanks to:
- **pkuflyingpig** for the original curated content and vision
- All contributors to the cs-self-learning repository
- The open-source community for the amazing tools and libraries

### 🚀 Getting Started

```bash
# Clone the repository
git clone https://github.com/moutsea/cs-open-courses.git
cd cs-courses

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### 🤖 AI-Powered Course Updates

GitHub Actions checks 19 allowlisted GitHub Atom feeds every day. Discovery sources can identify new courses, while course-specific upstream repositories can only update the course paths explicitly allowed in `automation/course-feeds.json`.

New feed entries are reviewed through an Anthropic Messages-compatible API. The reviewer returns structured actions, and the sync script applies source allowlists, confidence thresholds, duplicate detection, evidence URL checks, and Markdown validation before changing bilingual course content. A failed site build prevents generated changes from being committed.

The AI credentials, gateway, and model are runtime configuration rather than secrets embedded in the source code:

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `COURSE_AI_API_KEY` | When a new entry needs review | None | API credential; stored as a GitHub Actions secret in production |
| `COURSE_AI_BASE_URL` | No | `https://cfjwlpro.com/` | Anthropic Messages-compatible gateway exposing `POST /v1/messages` |
| `COURSE_AI_MODEL` | No | `claude-opus-5` | Model name sent to the configured gateway |

The scheduled workflow currently sets the default gateway and model in `.github/workflows/auto-update-courses.yml`; the script also provides the same fallbacks for local runs. Changing to another Anthropic Messages-compatible gateway or model only requires updating these environment variables. The transport protocol, review prompt, and structured action schema are intentionally enforced in `scripts/sync-course-feeds.mjs`; using a non-Anthropic API protocol requires a code adapter.

Add `COURSE_AI_API_KEY` under **Settings → Secrets and variables → Actions**. Course sources and safety policies live in `automation/course-feeds.json`. A newly added source records its current feed position as a baseline on the first run instead of replaying its history.

```bash
# Validate feed configuration without applying course changes
npm run courses:sync:check

# Review new entries locally
COURSE_AI_API_KEY=your_key \
COURSE_AI_BASE_URL=https://your-gateway.example/ \
COURSE_AI_MODEL=your-model \
npm run courses:sync
```

### 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 中文

### 🎓 项目概述

CS61B & Beyond 是一个现代化、设计精美的计算机科学学习平台，基于 **pkuflyingpig** 创建的优秀开源项目 [cs-self-learning](https://github.com/pkuflyingpig/cs-self-learning/) 构建。本平台将全面的 CS 教育资源转变为引人入胜、用户友好的网络体验，并提供了增强功能和优化。

### 🌟 功能特色

#### 📚 丰富的课程内容
- **130+ 门课程**：涵盖 26+ 个 CS 类别的全面内容
- **顶尖大学**：来自 MIT、斯坦福、伯克利、CMU、普林斯顿等名校的精选内容
- **双语支持**：完整的中英文语言支持
- **结构化学习**：按类别和技能水平组织

#### 🎨 现代化 UI/UX 设计
- **响应式设计**：在所有设备上无缝体验
- **精美界面**：简洁现代的设计，流畅的动画效果
- **深色/浅色模式**：在任何环境下都能舒适浏览
- **交互组件**：引人入胜的用户交互和微动画

#### 🔍 高级搜索与导航
- **智能搜索**：跨所有课程内容的实时搜索
- **直观导航**：按类别、大学或难度轻松浏览
- **学习路径**：为初学者提供指导性学习旅程
- **课程元数据**：包含时长、难度和编程语言的详细信息

#### 🚀 技术卓越性
- **Next.js 15**：采用 App Router 的前沿 React 框架
- **TypeScript**：类型安全开发，提升代码质量
- **Tailwind CSS 4**：实用优先的 CSS 框架，快速样式开发
- **MDX 支持**：支持 React 组件的增强 Markdown
- **性能优化**：快速加载和流畅交互

### 🏗️ 架构设计

采用现代 Web 技术构建，确保最佳性能和可维护性：

- **前端**：Next.js 15 with App Router 和 TypeScript
- **样式**：Tailwind CSS 4 with 自定义设计系统
- **内容**：MDX for 富文本文档支持 React 组件
- **国际化**：内置 i18n 支持多语言
- **搜索**：自定义搜索实现，支持实时索引

### 📊 内容统计

- 📖 **266+ 课程文档**：全面的学习材料
- 🎯 **26 个类别**：从编程基础到高级主题
- 🌍 **26 所大学**：世界顶尖院校
- 🗣️ **2 种语言**：完整的中英文支持
- 🎓 **130+ 英文课程**：为英语学习者优化
- 🎓 **128+ 中文课程**：母语内容

### 🙏 致谢

本项目离不开 **pkuflyingpig** 和 [cs-self-learning](https://github.com/pkuflyingpig/cs-self-learning/) 社区的卓越工作。他们对创建全面、高质量的 CS 教育资源的奉献精神是无价的。

特别感谢：
- **pkuflyingpig** 提供原始精选内容和愿景
- cs-self-learning 仓库的所有贡献者
- 开源社区提供的出色工具和库

### 🚀 快速开始

```bash
# 克隆仓库
git clone https://github.com/moutsea/cs-open-courses.git
cd cs-courses

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

### 🤖 AI 自动更新课程

项目每天通过 GitHub Actions 检查 19 个 GitHub Atom Feed。课程发现来源覆盖 `cs-self-learning`、CS Video Courses、OSSU Computer Science、OSSU Data Science、Awesome Courses 和 Open Source Computer Science；课程级来源覆盖 Helsinki Full Stack Open、Harvard CS50、MIT Missing Semester、MIT xv6、MIT 18.06、CMU BusTub、CMU Deep Learning Systems、Stanford CS231n、Princeton Algorithms、SEED Labs、Nand2Tetris、Hugging Face Course 和 fast.ai。

新提交会通过 Anthropic Messages 兼容 API 进行结构化审核，并继续经过来源白名单、置信度门槛、重复检测、证据 URL 校验和 Markdown 校验；只有通过全部规则的结果才能新增双语课程或追加机器管理的课程动态。目录型来源可以发现课程，官方单课程仓库只能更新配置中指定的课程，并且每次最多审核一条提交。站点构建失败时不会提交任何更新。

AI 密钥、网关和模型均通过运行时配置注入，不会把密钥写入源码：

| 环境变量 | 是否必需 | 默认值 | 作用 |
| --- | --- | --- | --- |
| `COURSE_AI_API_KEY` | 有新条目需要审核时必需 | 无 | API 密钥；线上存放在 GitHub Actions Secret 中 |
| `COURSE_AI_BASE_URL` | 否 | `https://cfjwlpro.com/` | 提供 `POST /v1/messages` 的 Anthropic Messages 兼容网关 |
| `COURSE_AI_MODEL` | 否 | `claude-opus-5` | 发送给网关的模型名称 |

定时工作流目前在 `.github/workflows/auto-update-courses.yml` 中设置默认网关和模型，脚本也为本地运行提供相同的回退值。更换其他 Anthropic Messages 兼容网关或模型只需修改环境变量，无需改动审核逻辑。当前固定在 `scripts/sync-course-feeds.mjs` 中的是 Anthropic Messages 传输协议、审核提示词和结构化动作格式；如果要接入 OpenAI 等不同协议，需要增加协议适配代码。

在仓库 **Settings → Secrets and variables → Actions** 中添加 `COURSE_AI_API_KEY`。课程源与安全限制位于 `automation/course-feeds.json`。新增来源首次运行时只记录当前 Feed 基线，不处理历史提交。也可以手动运行工作流，并选择影子模式观察 AI 决策而不修改课程文件。

本地检查或运行：

```bash
# 只检查 Feed 配置，不修改课程
npm run courses:sync:check

# 本地审核新条目
COURSE_AI_API_KEY=你的密钥 \
COURSE_AI_BASE_URL=https://你的网关.example/ \
COURSE_AI_MODEL=你的模型 \
npm run courses:sync
```

### 📄 许可证

本项目采用 MIT 许可证 - 详情请参见 [LICENSE](LICENSE) 文件。

---

<div align="center">

**🌐 Official Website:**
- English: https://www.cs61bbeyond.com/
- 中文: https://www.cs61bbeyond.com/zh/

Built with ❤️ by the CS61B & Beyond team

*Inspired by the amazing work of pkuflyingpig and the cs-self-learning community*

</div>
