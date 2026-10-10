---
title: "vercel-react-native-skills 是什么、怎么安装使用：Vercel 官方的 React Native / Expo 性能最佳实践 Skill"
slug: vercel-react-native-skills-skill
name: vercel-react-native-skills（vercel-labs/agent-skills）
url: https://github.com/vercel-labs/agent-skills/tree/main/skills/react-native-skills
pricing: "免费（技能标注 MIT；仓库根目录无 LICENSE 文件）"
platforms: "Claude Code / Codex / Cursor / OpenCode 等支持 Agent Skills 的智能体"
trialNote: "npx skills add vercel-labs/agent-skills --skill vercel-react-native-skills"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, coding]
excerpt: "vercel-react-native-skills 是 Vercel 官方的 React Native 与 Expo 最佳实践 Skill：按优先级覆盖列表性能、动画、导航、界面模式、状态管理、渲染、Monorepo 与配置八类规则。"
checkedOn: 2026-10-11
sources:
  - https://github.com/vercel-labs/agent-skills/tree/main/skills/react-native-skills
  - https://github.com/vercel-labs/agent-skills
  - https://github.com/vercel-labs/skills
  - https://skills.sh/
---

> 本文根据 vercel-labs/agent-skills 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。skills.sh 榜单当日显示该技能累计安装约 23.6 万次；所在仓库 vercel-labs/agent-skills 在 GitHub 约 3.2 万 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

React Native 应用卡顿，十有八九出在长列表和动画上，而这恰恰是模型凭网页端经验最容易写错的地方。vercel-react-native-skills 是一份移动端专用的规则集。`description`：构建高性能移动应用的 React Native 与 Expo 最佳实践；在构建 React Native 组件、优化列表性能、实现动画或使用原生模块时使用，涉及 React Native、Expo、移动端性能或原生平台 API 的任务会触发。

规则按优先级分八类：

1. **列表性能**（关键）——回调与函数引用的稳定性、列表项里的图片、避免内联对象等；
2. **动画**（高）——使用只走 GPU 的属性、派生值、手势检测；
3. **导航**（高）；
4. **界面模式**（高）；
5. **状态管理**（中）；
6. **渲染**（中）；
7. **Monorepo**（中）——含原生依赖时的工程组织；
8. **配置**（低）——例如用配置插件处理字体。

和同库其他规则类技能一样，每条规则是 `rules/` 下的独立文件，按需加载，另有汇编版 `AGENTS.md`。

## 怎么安装

仓库 README 给的安装方式是 skills CLI。只装这一个技能，加上 CLI 文档里的 `--skill` 参数（技能名是 `vercel-react-native-skills`，与仓库里的文件夹名不完全相同）：

```bash
npx skills add vercel-labs/agent-skills --skill vercel-react-native-skills
```

去掉 `--skill` 会进入选择界面，可以一次勾选多个；加 `-g` 装到用户目录，加 `-a claude-code` 之类的参数指定智能体。

仓库整体介绍和其他安装方式，详见本站《vercel-labs/agent-skills 是什么、怎么安装：Vercel 官方 Agent Skills（React / Next.js 最佳实践、网页界面规范审查）》。

## 怎么用

- 「这个商品列表滑动掉帧，按 React Native 最佳实践排查并修复」。
- 「用 Reanimated 给卡片加一个按压缩放效果，注意只动 GPU 属性」。
- 「评审 `app/` 目录，按优先级列出性能问题」。

## 适合谁 / 局限

适合用 React Native 或 Expo 做应用的团队，特别是从网页端转做移动端的开发者。它聚焦性能与工程实践，不覆盖构建、签名和上架流程——这部分可以看 Expo 官方的技能库；规则以新架构和当前主流库（如 Reanimated）为前提，老项目使用前先确认依赖版本。

## 注意事项

- **许可**：技能的 `license` 字段为 MIT。
- **不执行脚本、不联网**。
- 性能结论要在真机上验证，模拟器和开发模式下的表现不代表发布版本。
