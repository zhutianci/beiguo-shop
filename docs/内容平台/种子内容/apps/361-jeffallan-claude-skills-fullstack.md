---
title: "Jeffallan/claude-skills 是什么、怎么安装：面向全栈开发的 67 个 Claude Code 专家技能"
slug: jeffallan-claude-skills-fullstack
name: Jeffallan/claude-skills（fullstack-dev-skills）
url: https://github.com/Jeffallan/claude-skills
pricing: "开源免费（MIT）"
platforms: "Claude Code（插件）；其他智能体可用 npx skills 安装"
trialNote: "`/plugin marketplace add jeffallan/claude-skills` 然后 `/plugin install fullstack-dev-skills@fullstack-dev-skills`"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, coding]
excerpt: "Jeffallan/claude-skills（fullstack-dev-skills）是一套面向全栈开发者的 Claude Code 技能：67 个按语言、前后端框架、基础设施、测试、安全等 12 类划分的「专家」技能，按请求内容自动激活并加载对应参考资料。"
checkedOn: 2026-10-11
sources:
  - https://github.com/Jeffallan/claude-skills
  - https://github.com/Jeffallan/claude-skills/blob/main/QUICKSTART.md
  - https://github.com/Jeffallan/claude-skills/blob/main/SKILLS_GUIDE.md
  - https://code.claude.com/docs/en/discover-plugins
---

> 本文根据 Jeffallan/claude-skills 仓库 README、QUICKSTART.md、SKILLS_GUIDE.md 与 Claude Code 官方文档整理，资料核对于 2026-10-11。

## 是什么

Jeffallan/claude-skills 是开发者 Jeff Allan 维护的 Claude Code 插件，插件名叫 `fullstack-dev-skills`。它的定位很直接：把 Claude Code 变成懂各门技术栈的结对伙伴。README 的说法是 67 个专门技能、12 个类别，覆盖编程语言、后端与前端框架、基础设施、API、测试、运维、安全、数据与机器学习，以及若干平台专家。

它的组织方式是「技能 + 按需参考」：每个技能是一个角色（如 NestJS Expert、React Expert），下面挂着多份参考文档；你提到 JWT 认证，它只加载认证那一份，不把整套资料读进上下文。

截至 2026-10-11，GitHub 显示该仓库约 1.2 万 Star、1137 Fork，最近一次推送在 2026-10-03。

## 包含哪些 Skill

按 SKILLS_GUIDE.md 的分类：

- **语言专家**、**后端框架**、**前端与移动端**；
- **基础设施与云**、**API 与架构**；
- **质量与测试**、**DevOps 与运维**、**安全**；
- **数据与机器学习**、**平台专家**，以及若干专项和流程类技能。

README 点名的角色包括 Feature Forge（需求梳理）、Architecture Designer、Fullstack Guardian、Test Master、DevOps Engineer、Debugging Wizard、Code Reviewer、Secure Code Guardian、Security Reviewer 等。此外还有两组命令：`/common-ground` 用来把 Claude 对项目的隐含假设摆出来让你确认；9 个工作流命令管理从需求探索到回顾的史诗（epic）流程，并与 Jira、Confluence 集成。

## 怎么安装

**Claude Code**：

```text
/plugin marketplace add jeffallan/claude-skills
/plugin install fullstack-dev-skills@fullstack-dev-skills
```

QUICKSTART.md 还列了另外几种方式，其中用 skills CLI 的是：

```bash
npx skills add jeffallan/claude-skills
```

装完可用 `/plugin list` 确认。

## 怎么用

技能根据请求自动激活，README 的例子：

- 「在我的 NestJS API 里实现 JWT 认证」→ 激活 NestJS Expert，加载认证参考；
- 「用 Server Components 写一个 React 组件」→ 激活 React Expert。

复杂任务会串联多个技能，README 给了三条典型链路：功能开发（Feature Forge → Architecture Designer → Fullstack Guardian → Test Master → DevOps Engineer）、缺陷排查（Debugging Wizard → 框架专家 → Test Master → Code Reviewer）、安全加固（Secure Code Guardian → Security Reviewer → Test Master）。

## 适合谁 / 不适合谁

**适合：**
- 技术栈较杂的全栈开发者，希望不同语言和框架都有对应的最佳实践参考；
- 用 Jira / Confluence 管理项目、想让 Claude Code 参与史诗流程的团队。

**不适合：**
- 只用单一技术栈的人——装 67 个技能大部分用不上，不如选该框架官方出的技能；
- 想要强约束开发流程的人，这里以知识型技能为主，流程约束不如 Superpowers 一类框架。

## 注意事项

- **许可证**：MIT，仓库根目录有 LICENSE。
- **维护状态**：最近推送 2026-10-03，文档站在 jeffallan.github.io/claude-skills。
- **工作流命令需要额外配置**：README 说明 9 个工作流命令依赖 Atlassian MCP 服务器，要先按文档配置并授权，授权后智能体能读写你的 Jira / Confluence，注意权限范围。
- **与框架官方技能的关系**：React、Next.js、Supabase 等已有官方技能库，同一主题装多份容易给出相互矛盾的建议，择一即可。
- 第三方技能安装前建议浏览一遍 `SKILL.md`。
