---
title: "frontend-ui-engineering skill 是什么、怎么安装使用：Addy Osmani 的生产级前端界面 Skill（组件架构、无障碍、去 AI 审美）"
slug: addyosmani-frontend-ui-engineering-skill
name: frontend-ui-engineering（addyosmani/agent-skills）
url: https://github.com/addyosmani/agent-skills/tree/main/skills/frontend-ui-engineering
pricing: "开源免费（MIT）"
platforms: "Claude Code / Codex / Cursor / Gemini CLI / OpenCode / Copilot 等"
trialNote: "npx skills add addyosmani/agent-skills --skill frontend-ui-engineering"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, coding, product-design]
excerpt: "frontend-ui-engineering 是 addyosmani/agent-skills 里的前端界面技能：从组件架构、状态管理、遵循设计系统、避开「AI 审美」、WCAG 2.1 AA 无障碍、响应式到加载与过渡，指导做出可上线质量的界面。"
checkedOn: 2026-10-11
sources:
  - https://github.com/addyosmani/agent-skills/tree/main/skills/frontend-ui-engineering
  - https://github.com/addyosmani/agent-skills
  - https://github.com/vercel-labs/skills
---

> 本文根据 addyosmani/agent-skills 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。skills.sh 榜单当日显示该技能累计安装约 5.4 万次；所在仓库 addyosmani/agent-skills 在 GitHub 约 10.4 万 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

frontend-ui-engineering 给自己定的目标很具体：做出来的界面要像是一位懂设计的工程师在一流公司里写的，而不是 AI 生成的——这意味着真正遵循设计系统、做好无障碍、交互经过推敲，没有千篇一律的「AI 审美」。`description`：构建生产质量、无障碍、响应式的面向用户的界面；在构建或修改界面和页面、创建组件、实现布局、满足 WCAG 无障碍要求、管理状态，或需要成品看起来是生产级而不是 AI 生成时使用。

和 Anthropic 的 frontend-design 相比，它的重心不在审美方向，而在**工程质量**。内容包括：

- **组件架构**：文件结构、组件模式；
- **状态管理**；
- **遵循设计系统**与以参考为准的界面质量；
- **避开 AI 审美**：间距与布局、字体排印、颜色；
- **无障碍（WCAG 2.1 AA）**：键盘导航、ARIA 标签、焦点管理；
- **有意义的空状态和错误状态**；
- **响应式设计**、**加载与过渡**。

末尾照例是该库统一的三张表：常见的开脱说法、危险信号、完成前核对项。

## 怎么安装

仓库 README 给出了单独安装某个技能的写法：

```bash
npx skills add addyosmani/agent-skills --skill frontend-ui-engineering
```

想整套安装，Claude Code 用 `/plugin marketplace add addyosmani/agent-skills` 加 `/plugin install agent-skills@addy-agent-skills`，Codex 用 `codex plugin marketplace add addyosmani/agent-skills` 加 `codex plugin add agent-skills@agent-skills`。README 提示，插件安装遇到 SSH 权限报错时改用仓库的 HTTPS 地址。

仓库整体介绍和其他安装方式，详见本站《addyosmani/agent-skills 是什么、怎么安装：Addy Osmani 的 25 个生产级工程 Skills（/spec、/plan、/build）》。

## 怎么用

- 「给订单列表页加上空状态、加载骨架和错误重试」。
- 「按 WCAG 2.1 AA 检查这个表单组件的键盘操作和读屏标签」。
- 「用项目现有的设计令牌重写这个页面，不要引入新的颜色和间距」。

这个技能只有一份 SKILL.md。

## 适合谁 / 局限

适合用 React 等组件化框架做产品界面的前端与全栈开发者，特别是已有设计系统、希望智能体守规矩的团队。它不提供组件库和视觉方向，也看不到渲染结果，无障碍和响应式仍要在浏览器和辅助技术里实际验证。

## 注意事项

- **许可**：MIT。
- **不执行脚本、不联网**。
- 和审美类技能（frontend-design、Taste Skill 等）可以搭配：一个定方向，一个管落地质量。
