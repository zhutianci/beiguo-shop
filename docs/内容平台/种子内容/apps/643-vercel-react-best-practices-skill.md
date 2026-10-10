---
title: "vercel-react-best-practices 是什么、怎么安装使用：Vercel 官方的 React / Next.js 性能优化 Skill（70 条规则）"
slug: vercel-react-best-practices-skill
name: vercel-react-best-practices（vercel-labs/agent-skills）
url: https://github.com/vercel-labs/agent-skills/tree/main/skills/react-best-practices
pricing: "免费（技能标注 MIT；仓库根目录无 LICENSE 文件）"
platforms: "Claude Code / Codex / Cursor / OpenCode 等支持 Agent Skills 的智能体"
trialNote: "npx skills add vercel-labs/agent-skills --skill vercel-react-best-practices"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, coding]
excerpt: "vercel-react-best-practices 是 Vercel 工程团队维护的 React / Next.js 性能 Skill：8 个类别共 70 条规则，按影响大小排序，从消除请求瀑布、压缩包体积到减少重渲染，供智能体写代码和评审时参照。"
checkedOn: 2026-10-11
sources:
  - https://github.com/vercel-labs/agent-skills/tree/main/skills/react-best-practices
  - https://github.com/vercel-labs/agent-skills
  - https://github.com/vercel-labs/skills
  - https://skills.sh/
---

> 本文根据 vercel-labs/agent-skills 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。skills.sh 榜单当日显示该技能累计安装约 78.6 万次；所在仓库 vercel-labs/agent-skills 在 GitHub 约 3.2 万 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

智能体写的 React 代码通常能跑，但性能问题很隐蔽：串行的 await 造成请求瀑布、从桶文件（barrel file）整包导入、无意义的重渲染。vercel-react-best-practices 把 Vercel 工程团队的经验整理成了规则集。按 `description`，在编写、评审或重构 React / Next.js 代码时使用，涉及组件、Next.js 页面、数据获取、包体积优化或性能改进的任务会触发它。

SKILL.md 自述包含 8 个类别、70 条规则，按影响排序：

1. 消除瀑布（关键）；2. 包体积优化（关键）；3. 服务端性能（高）；4. 客户端数据获取（中高）；5. 重渲染优化（中）；6. 渲染性能（中）；7. JavaScript 性能（中低）；8. 进阶模式（低）。

每条规则是 `rules/` 目录下的一个独立文件，带错误写法与正确写法的对照，按需读取；另有一份汇编好的完整文档 `AGENTS.md`。

## 怎么安装

仓库 README 给的安装方式是 skills CLI。只装这一个技能，加上 CLI 文档里的 `--skill` 参数（技能名是 `vercel-react-best-practices`，与仓库里的文件夹名不完全相同）：

```bash
npx skills add vercel-labs/agent-skills --skill vercel-react-best-practices
```

去掉 `--skill` 会进入选择界面，可以一次勾选多个；加 `-g` 装到用户目录，加 `-a claude-code` 之类的参数指定智能体。

仓库整体介绍和其他安装方式，详见本站《vercel-labs/agent-skills 是什么、怎么安装：Vercel 官方 Agent Skills（React / Next.js 最佳实践、网页界面规范审查）》。

## 怎么用

- 「按 Vercel 的 React 最佳实践评审 `app/dashboard` 目录，按严重程度列出问题」。
- 「这个页面首屏很慢，看看有没有请求瀑布，改成并行」。
- 平时写新组件时它会自动生效，例如主动把相互独立的请求放进 `Promise.all`。

## 适合谁 / 局限

适合用 Next.js（尤其是 App Router）和 React 做产品的团队，也适合拿来给存量代码做一轮性能体检。规则带有 Vercel 的技术取向，部分条目只对 Next.js 的服务端组件有意义；它是静态经验，不会替你测量真实性能，优化前后仍应以实际指标为准。

## 注意事项

- **许可**：技能的 `license` 字段为 MIT；仓库根目录没有 LICENSE 文件。
- **不执行脚本、不联网**：纯规则文档。
- 规则数量多，评审大目录时会读入不少文件，注意上下文占用。
