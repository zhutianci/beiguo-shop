---
title: "drawio-skill 是什么、怎么安装使用：让 AI 生成可编辑 draw.io 架构图的 Skill（自检重叠、支持 Mermaid 转换）"
slug: drawio-skill-agents365-diagrams
name: drawio-skill（Agents365-ai/drawio-skill）
url: https://github.com/Agents365-ai/drawio-skill
pricing: "开源免费（MIT）"
platforms: "Claude Code / Cursor / GitHub Copilot / OpenCode 等；需本机安装 draw.io 桌面版"
trialNote: "npx skills add Agents365-ai/drawio-skill -g"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, coding, infographic]
excerpt: "drawio-skill 是一个生成 draw.io 图表的 Skill：把自然语言或真实的系统来源变成可继续编辑的 .drawio 文件，导出后自查重叠与文字截断并自动修正，还能把 Mermaid 转成原生 draw.io 图、从代码与配置生成架构图。"
checkedOn: 2026-10-11
sources:
  - https://github.com/Agents365-ai/drawio-skill
  - https://github.com/Agents365-ai/drawio-skill/blob/main/README_CN.md
  - https://github.com/vercel-labs/skills
---

> 本文根据 Agents365-ai/drawio-skill 仓库中英文 README 整理，资料核对于 2026-10-11。功能较多且更新快，以仓库 README 为准。

## 是什么

draw.io（diagrams.net）是使用最广的免费画图工具之一，文件格式是 XML。drawio-skill 让智能体直接写出 `.drawio` 文件——关键词是**可编辑**：产物不是一张图片，而是你可以在 draw.io 里继续拖拽修改的源文件。

README 给它的定位比「画图」更进一步：把自然语言和真实的系统来源变成可维护的架构模型。除了生成和导出，它还能在不丢弃你手工调整过的布局的前提下做增量同步、从同一个模型投影出多个视图、检查架构约束、查询依赖关系等。GitHub 仓库描述里列的来源包括代码、Terraform、Kubernetes、SQL、OpenAPI 等。

流程上有一个实用的设计——**自检**：技能先规划布局、写 XML、导出，然后检查自己导出的 PNG，自动修复元素重叠、标签被截断、连线堆叠等问题（README 说最多两轮），之后再接受你最多五轮的修改意见。

截至 2026-10-11，GitHub 显示该仓库约 1.0 万 Star、707 Fork，最近一次推送在 2026-10-02。

## 包含哪些 Skill

仓库提供一个技能，README 列举的能力包括：

- **从描述生成**：一句话得到可编辑的 `.drawio`；
- **Mermaid 转原生 draw.io**（需要较新版本的 draw.io）：把思维导图、甘特图、时间线、用户旅程、饼图、桑基图、看板等 28 种 Mermaid 标准图转成带布局、可编辑的 draw.io 图；
- **从真实来源生成**：先把来源解析成图的中间数据，再排布成图；
- 导出为图片等格式，以及生成可交互的讲解页面。

## 怎么安装

分两步。**第一步**，安装 draw.io 桌面版（技能通过它的命令行导出），macOS 上是：

```bash
brew install --cask drawio
```

其他系统的安装方式见 README。

**第二步**，安装技能：

```bash
npx skills add Agents365-ai/drawio-skill -g
```

也可以手动克隆到技能目录。

## 怎么用

- 「画一张我们系统的架构图：网关、三个微服务、消息队列、两个数据库，存成 `arch.drawio`」；
- 「根据这个仓库的 Terraform 配置生成部署架构图」；
- 「把这段 Mermaid 流程图转成 draw.io 文件，我要手动调整」；
- 「图里的日志服务和监控服务重叠了，调一下布局」。

## 适合谁 / 不适合谁

**适合：** 团队本来就用 draw.io 画架构图、希望 AI 出初稿后人工精修的工程师；需要让图和基础设施配置保持同步的平台团队。

**不适合：** 不想在本机装 draw.io 桌面版的人；只要一张好看的示意图、不需要继续编辑的场景（本站介绍过的 Diagram Design、Archify 更直接）；没有图形界面的服务器环境，导出步骤可能需要额外配置。

## 注意事项

- **许可证**：MIT。
- **会执行命令**：调用本机的 draw.io 命令行导出文件，并读取你指定的代码和配置作为来源。
- **图是模型的理解**：从代码或配置生成的架构图可能漏掉或画错依赖，用于文档和评审前要人工核对。
- **维护状态**：最近推送 2026-10-02，有中文 README 和在线文档。
- 第三方技能安装前浏览 `SKILL.md`。
