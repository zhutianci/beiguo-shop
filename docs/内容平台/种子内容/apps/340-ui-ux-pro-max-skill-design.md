---
title: "UI UX Pro Max 是什么、怎么安装使用：给 Claude Code / Cursor / Codex 加一套 UI 设计资料库的 Skill"
slug: ui-ux-pro-max-skill-design
name: UI UX Pro Max（ui-ux-pro-max-skill）
url: https://github.com/nextlevelbuilder/ui-ux-pro-max-skill
pricing: 开源免费（MIT）；作者另有付费 Premium 版
platforms: Claude Code / Cursor / Windsurf / Codex CLI / Gemini CLI / GitHub Copilot / Kiro / Trae 等
trialNote: "npx ui-ux-pro-max-cli init --ai claude"
products: [claude, cursor]
models: [any-llm]
topics: [agent-skills, product-design, coding]
excerpt: "UI UX Pro Max 是一个给 AI 编程助手用的 UI/UX 设计技能：内置界面风格、配色、字体搭配、UX 规范等可检索资料，先按产品类型生成一套设计系统，再写页面。支持 Claude Code、Cursor、Codex 等二十多种工具。"
checkedOn: 2026-10-10
sources:
  - https://github.com/nextlevelbuilder/ui-ux-pro-max-skill
  - https://uupm.cc
  - https://code.claude.com/docs/en/discover-plugins
  - https://agentskills.io/home
---

> 本文根据 nextlevelbuilder/ui-ux-pro-max-skill 仓库 README 与 Claude Code 官方文档整理，资料核对于 2026-10-10。仓库更新频繁，条目数量以仓库 README 为准。

## 是什么

UI UX Pro Max 是一个面向 AI 编程助手的设计类 Skill。让 AI 直接写页面，常见的结果是配色、字体、布局千篇一律；这个技能的思路是给 AI 配一份可以检索的设计资料库，让它在动手写代码之前，先查「这类产品通常用什么风格、什么配色、什么字体」，生成一份设计系统，再照着实现。

资料库是一批 CSV 数据加一个 Python 检索脚本（README 说用的是 BM25 检索，只依赖标准库、不联网）。截至 2026-10-10，GitHub 显示该仓库约 13.4 万 Star、1.4 万 Fork，最近一次推送在 2026-10-09，是设计类 Skill 里 Star 数最高的一个。

## 包含哪些 Skill

仓库的核心是一个名为 `ui-ux-pro-max` 的技能，README 列出的资料规模（v2.0 之后）：

- **界面风格**：79 种可检索风格，其中 50 种为常规推荐（玻璃拟态、极简、新拟态、Bento Grid、深色模式等）；
- **配色方案**：192 套，按产品类型一一对应；
- **字体搭配**：74 组，附 Google Fonts 引入方式；
- **图表类型**：25 种，用于仪表盘和数据页面；
- **UX 规范**：119 条，含无障碍、长文本换行、标签截断等常见反例；
- **行业推理规则**：192 条，用来根据「美容院官网」「金融 App」这类描述推导出整套设计系统；
- **技术栈指引**：22 种，包括 React、Next.js、Vue、Svelte、SwiftUI、Flutter、Jetpack Compose、HTML + Tailwind 等。

README 还说明仓库是基础版，作者另有付费的 Premium 版（品牌识别、Logo、演示文稿等扩展技能），详情在官网 uupm.cc。

## 怎么安装

**Claude Code 插件市场**（README 原文两条命令）：

```text
/plugin marketplace add nextlevelbuilder/ui-ux-pro-max-skill
/plugin install ui-ux-pro-max@ui-ux-pro-max-skill
```

**命令行安装器（README 推荐，支持多种工具）**：

```bash
npm install -g ui-ux-pro-max-cli
uipro init --ai claude      # Claude Code
uipro init --ai cursor      # Cursor
uipro init --ai codex       # Codex CLI
uipro init --ai gemini      # Gemini CLI
```

`--ai` 后面还可以换成 windsurf、copilot、kiro、trae、opencode 等，`--ai all` 一次装全部；加 `--global` 装到用户目录（如 `uipro init --ai claude --global` 装到 `~/.claude/skills/`）。不想全局装 npm 包，可以用 `npx ui-ux-pro-max-cli init --ai claude`。

前置条件：本机要有 Python 3，检索脚本靠它运行。

**claude.ai 网页版**：README 明确说不要上传整个仓库的 ZIP（文件数超过上传上限），项目目前也没有提供单独的上传包，所以网页版暂时没有官方安装方式。

## 怎么用

- **自动触发**：在 Claude Code、Cursor、Codex CLI 等工具里直接描述需求即可，例如 `Build a landing page for my SaaS product`，技能会在识别到 UI/UX 任务时自动加载。中文描述同样可以，最好说明产品类型和技术栈，不说技术栈时默认按 HTML + Tailwind 出。
- **斜杠命令**：Kiro、GitHub Copilot、Roo Code、KiloCode 里用 `/ui-ux-pro-max` 加需求来调用。
- **直接跑脚本**：想先看设计系统再决定，可以运行 README 给的命令，例如 `python3 .claude/skills/ui-ux-pro-max/scripts/search.py "fintech banking" --design-system -f markdown`；加 `--persist -p "MyApp"`（引号里是项目名）会把结果写进 `design-system/` 目录，后续会话可以继续沿用。

## 适合谁 / 不适合谁

**适合：**
- 用 AI 写前端、但自己没有设计背景的开发者；
- 需要快速给不同行业的产品定一个「不出错」的视觉方向的独立开发者和小团队；
- 想让多个页面保持同一套配色和字体规则的项目。

**不适合：**
- 已经有成熟设计规范和设计师把关的团队——资料库给的是通用推荐，不会替你遵守公司品牌规范；
- 只用 claude.ai 网页版的用户；
- 期待它直接产出设计稿或图片素材的人——基础版输出的是设计规则和代码。

## 注意事项

- **许可证**：仓库 LICENSE 为 MIT。Premium 版是另外的付费产品，不在这个仓库里。
- **维护状态**：持续更新，最近一次推送 2026-10-09。README 提醒旧的 `uipro-cli` 包已经过时，要装 `ui-ux-pro-max-cli`。
- **安全提醒**：技能会在本机运行 Python 脚本并可往项目里写 `design-system/` 文件。README 称脚本不安装任何东西、不发起网络请求，但安装前仍建议自己看一遍 `SKILL.md` 和 `scripts/`；通过 npm 全局安装 CLI 也等于执行第三方代码，留意包名别装错。
- **兼容性**：README 提到 v2.5.1 之前的版本在插件市场安装时可能因符号链接报错，遇到就改用 CLI 安装；Trae 需要先切到 SOLO 模式。
- 资料库给出的是经验性推荐，不等于设计评审；无障碍和品牌一致性仍要人工检查。
