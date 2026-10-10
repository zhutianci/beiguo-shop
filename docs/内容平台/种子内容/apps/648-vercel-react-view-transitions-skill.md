---
title: "vercel-react-view-transitions 是什么、怎么安装使用：用 React View Transition API 做页面过渡动画的官方 Skill"
slug: vercel-react-view-transitions-skill
name: vercel-react-view-transitions（vercel-labs/agent-skills）
url: https://github.com/vercel-labs/agent-skills/tree/main/skills/react-view-transitions
pricing: "免费（技能标注 MIT；仓库根目录无 LICENSE 文件）"
platforms: "Claude Code / Codex / Cursor / OpenCode 等支持 Agent Skills 的智能体"
trialNote: "npx skills add vercel-labs/agent-skills --skill vercel-react-view-transitions"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, coding, product-design]
excerpt: "vercel-react-view-transitions 是 Vercel 官方的过渡动画 Skill：指导用 React 的 ViewTransition 组件、过渡类型和 CSS 伪元素实现页面切换、共享元素、进出场与列表重排动画，含 Next.js 集成。"
checkedOn: 2026-10-11
sources:
  - https://github.com/vercel-labs/agent-skills/tree/main/skills/react-view-transitions
  - https://github.com/vercel-labs/agent-skills
  - https://github.com/vercel-labs/skills
  - https://skills.sh/
---

> 本文根据 vercel-labs/agent-skills 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。skills.sh 榜单当日显示该技能累计安装约 14.8 万次；所在仓库 vercel-labs/agent-skills 在 GitHub 约 3.2 万 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

页面切换时让缩略图平滑放大成详情图、列表重排时条目滑到新位置——这类效果过去要靠动画库，现在浏览器原生的 View Transition 加上 React 的新 API 就能做，但写法新、坑多，模型的旧知识基本不可靠。vercel-react-view-transitions 是专门的实现指南。按 `description`，用户想加页面过渡、给路由切换做动画、做共享元素动画、组件进出场、列表重排、带方向（前进 / 后退）的导航动画，或在 Next.js 里集成 view transitions 时使用；提到 `startViewTransition`、`ViewTransition`、过渡类型等字眼也会触发。

核心模型是三句话：用 `<ViewTransition>` 声明**什么**要动，用 `startTransition`、`useDeferredValue` 或 `Suspense` 决定**什么时候**动，用 CSS 类控制**怎么**动；不支持的浏览器会优雅地跳过动画。

技能开头先讲「什么时候该加动画」：每个过渡都应该传达一种空间关系或连续性，说不清它传达了什么就别加，并给出一张按优先级排列的模式表。后面覆盖可用性、实现流程、放置位置的关键规则、过渡类型、浏览器后退按钮的处理、共享元素、常见模式（进出场、列表重排、Suspense 回退到内容）以及多个过渡之间如何相互作用。

## 怎么安装

仓库 README 给的安装方式是 skills CLI。只装这一个技能，加上 CLI 文档里的 `--skill` 参数（技能名是 `vercel-react-view-transitions`，与仓库里的文件夹名不完全相同）：

```bash
npx skills add vercel-labs/agent-skills --skill vercel-react-view-transitions
```

去掉 `--skill` 会进入选择界面，可以一次勾选多个；加 `-g` 装到用户目录，加 `-a claude-code` 之类的参数指定智能体。

仓库整体介绍和其他安装方式，详见本站《vercel-labs/agent-skills 是什么、怎么安装：Vercel 官方 Agent Skills（React / Next.js 最佳实践、网页界面规范审查）》。

## 怎么用

- 「给商品列表到详情页加共享元素过渡，图片平滑放大」。
- 「路由前进和后退用相反方向的滑动动画」。
- 「搜索结果重新排序时让条目平滑移动到新位置」。

`references/` 下有 CSS 配方、实现细节、Next.js 集成、模式和排障五份资料。

## 适合谁 / 局限

适合使用较新版本 React 与 Next.js、想用原生能力做过渡而不引入动画库的前端。这套 API 较新，技能里有专门的「可用性」一节，旧版本 React 用不了；复杂的手势驱动动画、物理弹性效果仍是动画库的领域。

## 注意事项

- **许可**：技能的 `license` 字段为 MIT。
- **不执行脚本、不联网**。
- 动画要尊重系统的「减少动态效果」设置，并在主流浏览器里实际验证降级表现。
