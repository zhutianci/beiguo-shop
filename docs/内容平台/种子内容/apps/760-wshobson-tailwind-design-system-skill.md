---
title: "tailwind-design-system skill 是什么、怎么安装使用：按 Tailwind CSS v4 的写法搭设计系统"
slug: wshobson-tailwind-design-system-skill
name: tailwind-design-system（wshobson/agents）
url: https://github.com/wshobson/agents/tree/main/plugins/frontend-mobile-development/skills/tailwind-design-system
pricing: "开源免费（MIT）"
platforms: "Claude Code / Codex CLI / Cursor / OpenCode / GitHub Copilot 等"
trialNote: "npx skills add wshobson/agents --skill tailwind-design-system"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, coding, product-design]
excerpt: "tailwind-design-system 是 wshobson/agents 里的前端技能：面向 Tailwind CSS v4，讲在 CSS 里用 @theme 定义设计令牌、令牌分层、组件变体、暗色模式和响应式模式，并列出 v3 到 v4 的写法对照。"
checkedOn: 2026-10-11
sources:
  - https://github.com/wshobson/agents/tree/main/plugins/frontend-mobile-development/skills/tailwind-design-system
  - https://github.com/wshobson/agents
  - https://github.com/vercel-labs/skills
---

> 本文根据 wshobson/agents 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。skills.sh 榜单当日显示该技能累计安装约 6.8 万次；所在仓库 wshobson/agents 在 GitHub 约 4.0 万 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

Tailwind CSS 从 v3 到 v4 改动很大：配置从 JavaScript 文件搬进了 CSS，引入方式、暗色模式、动画的写法都变了。模型的训练数据里 v3 的代码更多，所以经常给 v4 项目写出 v3 的配置。这个技能专门纠正这一点。`description`：用 Tailwind CSS v4、设计令牌、组件库和响应式模式构建可扩展的设计系统；在创建组件库、落地设计系统或统一界面模式时使用。SKILL.md 开头注明它只针对 v4，v3 项目请看官方升级指南。

最实用的是那张 **v3 → v4 对照表**：

- `tailwind.config.ts` → 在 CSS 里写 `@theme`；
- 三条 `@tailwind` 指令 → 一句 `@import "tailwindcss"`；
- `darkMode: "class"` → 用 `@custom-variant` 定义暗色变体；
- `theme.extend.colors` → 在 `@theme` 里写 `--color-*` 变量；
- 动画插件 → 把关键帧写进 `@theme`，入场动画用 `@starting-style`。

之后是快速上手，以及两个核心概念：**设计令牌分层**（从基础值到语义令牌再到组件令牌）和**组件架构**（变体、尺寸、状态怎么组织）。适用场景还包括用原生 CSS 能力做暗色模式、构建响应式且无障碍的组件，以及从 v3 迁移。

SKILL.md 本身只有五千多字符，是一个导航层：详细的模式和完整示例放在 `references/details.md`，进阶内容在 `references/advanced-patterns.md`，按需读取。

## 怎么安装

仓库 README 给了两种装法。只要这一个技能，用 skills CLI：

```bash
npx skills add wshobson/agents --skill tailwind-design-system
```

在 Claude Code 里则是装它所在的插件 `frontend-mobile-development`，同插件的其他技能、子智能体和命令会一起装上：

```text
/plugin marketplace add wshobson/agents
/plugin install frontend-mobile-development@claude-code-workflows
```

仓库整体介绍和其他安装方式，详见本站《wshobson/agents 是什么、怎么安装：94 个插件、184 个 Skills 的多工具插件市场》。

## 怎么用

- 「这个项目是 Tailwind v4，帮我把品牌色、圆角和字号定义成设计令牌，支持暗色模式」。
- 「做一个按钮组件，有主要、次要、危险三种变体和三种尺寸」。
- 「把现在的 `tailwind.config.ts` 迁移成 v4 的 CSS 配置」。

开头说清 Tailwind 的版本，能避免它按旧写法出代码。

## 适合谁 / 局限

适合新起 v4 项目或正在从 v3 迁移的前端团队。局限：仍在用 v3 的项目不适用；它讲的是工程组织方式，不提供成品组件，也不替你做视觉决策——配色和风格要另外定，或配合设计类技能使用；Tailwind 更新快，细节以官方文档为准。

## 注意事项

- **许可**：MIT。
- **不带脚本**：SKILL.md 加两份参考文件。
- 通过 Claude Code 插件安装时，会连同 `frontend-mobile-development` 插件里的其他技能和子智能体一起装上。
