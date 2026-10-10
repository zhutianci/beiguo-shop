---
title: "vercel-composition-patterns 是什么、怎么安装使用：Vercel 官方的 React 组件组合模式 Skill（告别一堆布尔 props）"
slug: vercel-composition-patterns-skill
name: vercel-composition-patterns（vercel-labs/agent-skills）
url: https://github.com/vercel-labs/agent-skills/tree/main/skills/composition-patterns
pricing: "免费（技能标注 MIT；仓库根目录无 LICENSE 文件）"
platforms: "Claude Code / Codex / Cursor / OpenCode 等支持 Agent Skills 的智能体"
trialNote: "npx skills add vercel-labs/agent-skills --skill vercel-composition-patterns"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, coding]
excerpt: "vercel-composition-patterns 是 Vercel 官方的 React 组件设计 Skill：用复合组件、状态上提和内部组合替代不断增加的布尔 props，覆盖组件架构、状态管理、实现模式和 React 19 的 API 变化。"
checkedOn: 2026-10-11
sources:
  - https://github.com/vercel-labs/agent-skills/tree/main/skills/composition-patterns
  - https://github.com/vercel-labs/agent-skills
  - https://github.com/vercel-labs/skills
  - https://skills.sh/
---

> 本文根据 vercel-labs/agent-skills 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。skills.sh 榜单当日显示该技能累计安装约 38.4 万次；所在仓库 vercel-labs/agent-skills 在 GitHub 约 3.2 万 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

一个组件起初很简单，后来加了 `isCompact`、`showHeader`、`hideFooter`、`variant`……十几个布尔开关组合出上百种状态，没人敢动。vercel-composition-patterns 针对的就是这种「布尔 props 泛滥」。`description`：可扩展的 React 组合模式；在重构布尔 props 泛滥的组件、构建灵活的组件库或设计可复用 API 时使用，涉及复合组件、render props、Context Provider 或组件架构的任务会触发，并包含 React 19 的 API 变化。

SKILL.md 的概述是：通过复合组件、上提状态和组合内部结构来避免布尔 props 泛滥，这些模式让代码库在变大时对人和 AI 智能体都更容易处理。规则分四类：

- **组件架构**（高）：避免布尔 props、使用复合组件；
- **状态管理**（中）：把状态上提、用 Context 定义接口、让实现与状态解耦；
- **实现模式**（中）：用 children 代替 render props、显式的变体组件；
- **React 19 API**（中）：例如不再需要 `forwardRef`。

规则文件在 `rules/` 下，另有汇编版 `AGENTS.md`。

## 怎么安装

仓库 README 给的安装方式是 skills CLI。只装这一个技能，加上 CLI 文档里的 `--skill` 参数（技能名是 `vercel-composition-patterns`，与仓库里的文件夹名不完全相同）：

```bash
npx skills add vercel-labs/agent-skills --skill vercel-composition-patterns
```

去掉 `--skill` 会进入选择界面，可以一次勾选多个；加 `-g` 装到用户目录，加 `-a claude-code` 之类的参数指定智能体。

仓库整体介绍和其他安装方式，详见本站《vercel-labs/agent-skills 是什么、怎么安装：Vercel 官方 Agent Skills（React / Next.js 最佳实践、网页界面规范审查）》。

## 怎么用

- 「这个 `Modal` 组件有 14 个布尔 props，按组合模式重构，保持现有用法可迁移」。
- 「我们要做一套内部组件库，先帮我设计 `Tabs` 和 `Select` 的 API」。
- 「把项目里的 `forwardRef` 按 React 19 的写法清理掉」。

## 适合谁 / 局限

适合维护组件库或设计系统的前端工程师，以及组件 API 越改越乱的业务项目。对只有少量简单组件的小项目，复合组件反而增加理解成本；React 19 部分只适用于已升级的项目，旧版本不要照搬。

## 注意事项

- **许可**：技能的 `license` 字段为 MIT。
- **不执行脚本、不联网**。
- 重构组件 API 属于破坏性改动，让它同时列出调用方需要修改的位置，并分步提交。
