---
title: "diagram-design 是什么、怎么安装使用：按你的品牌色画「编辑级」图表的 Agent Skill（44 种图，单文件 HTML + SVG）"
slug: diagram-design-editorial-svg-skill
name: Diagram Design（cathrynlavery/diagram-design）
url: https://github.com/cathrynlavery/diagram-design
pricing: "开源免费（MIT）"
platforms: "Claude Code / Codex / Cursor / GitHub Copilot / Gemini CLI / Cline / Windsurf / Amp / Pi"
trialNote: "npx skills add cathrynlavery/diagram-design"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, product-design, infographic]
excerpt: "Diagram Design 是 Cathryn Lavery 开源的画图 Skill：用一句话描述，智能体挑选图表类型并输出一个自包含的 HTML + SVG 文件；内置 44 种图表类型和设计规则，可读取你网站的配色与字体，让图表与品牌一致。"
checkedOn: 2026-10-11
sources:
  - https://github.com/cathrynlavery/diagram-design
  - https://diagramdesign.dev
  - https://github.com/vercel-labs/skills
---

> 本文根据 cathrynlavery/diagram-design 仓库 README 与项目网站整理，资料核对于 2026-10-11。

## 是什么

让大模型画架构图，最常见的产物是一段 Mermaid 代码：能看，但千篇一律，放进文章或演示里很出戏。Diagram Design 走的是另一条路线——README 的说法是画「编辑级」的图表：输出**一个自包含的 HTML + SVG 文件**，按你的品牌来，设计规则内建，「没有阴影，没有 Mermaid 式的敷衍」。

用法就是说人话。智能体会自己选图表类型、先陈述它的计划，再写出一个双击就能打开的 `.html` 文件。README 说目前有 44 种图表类型，另带一套 87 个单色的 IT / 云图标（服务器、数据库、Docker、Kubernetes 等）用于架构图，以及手绘风格的可选滤镜。

它的特色是**品牌接入**：对它说一句「把 diagram-design 接入到某个网址」，它会从你的网站提取配色和字体，此后每张图都与网站风格一致；对比度检查自动进行。

截至 2026-10-11，GitHub 显示该仓库约 4.9 万 Star，最近一次推送在 2026-10-10。

## 包含哪些 Skill

一个技能 `diagram-design`，覆盖的图表类型包括 README 举例的架构图、四象限图、时序图等共 44 种。导出方面，默认产物是 HTML；需要 PNG 时通过 Playwright 以 2 倍分辨率栅格化（要先一次性安装 Playwright 和 Chromium）。它还能读取 Excalidraw 的场景文件，只解析其中的文字。

## 怎么安装

任何支持 Agent Skills 的工具：

```bash
npx skills add cathrynlavery/diagram-design
```

**Claude Code** 走插件市场可以获得更新和斜杠命令：

```text
/plugin marketplace add cathrynlavery/diagram-design
/plugin install diagram-design@diagram-design
```

**Codex**：`codex plugin marketplace add cathrynlavery/diagram-design`，再 `codex plugin add diagram-design@diagram-design`。README 提醒 Claude Code 对第三方市场默认不自动更新，需要在 `/plugin` → Marketplaces 里手动打开。

## 怎么用

README 给的几句示例：

- 「给我的应用画一张架构图：前端、后端、数据库、Redis 缓存」；
- 「我需要一个四象限图，按影响和投入展示第二季度的项目」；
- 「画一个带令牌的接口调用时序图，包含 401 之后刷新令牌的流程」；
- 「把 diagram-design 接入到 https://yoursite.com」——提取你网站的配色和字体。

## 适合谁 / 不适合谁

**适合：**
- 写技术博客、产品文档、对外演示，需要好看且风格统一的配图的人；
- 给多个客户出图、需要在不同品牌之间切换的顾问和设计师（README 有多客户工作方式的说明）。

**不适合：**
- 需要随代码自动更新、放在仓库里以文本形式评审的图——那正是 Mermaid 的强项；
- 需要在白板工具里多人拖拽编辑的场景，成品是静态文件。

## 注意事项

- **许可证**：GitHub 标注为 MIT。
- **联网行为**：README 说明图表默认从 Google Fonts 加载三款字体，这是它发出的唯一网络请求；要求使用系统字体后则完全离线。国内网络下 Google Fonts 可能加载缓慢或失败，建议改用系统字体。品牌接入功能会访问你指定的网址。仓库另有一份 PRIVACY.md 列出技能会通过网络发送的内容。
- **认准官方来源**：README 声明正式版本只来自这个仓库，作者公司 LittleMight 负责在各插件目录上架，其他名字的同名条目是非官方副本。
- **安全**：导出 PNG 会安装并运行 Playwright；安装前浏览 `SKILL.md`。
- 与本站介绍过的 Archify 同属画图类技能，Archify 偏可交互的架构图，这个偏静态、可出版的图表。
