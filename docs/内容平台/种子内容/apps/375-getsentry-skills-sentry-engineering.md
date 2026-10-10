---
title: "getsentry/skills 是什么、怎么安装：Sentry 工程团队自用的 Agent Skills（代码评审、提交规范、Django 审查）"
slug: getsentry-skills-sentry-engineering
name: getsentry/skills（Sentry 团队的工程技能）
url: https://github.com/getsentry/skills
pricing: "开源免费（Apache-2.0）"
platforms: "Claude Code（插件）；Cursor / Cline / GitHub Copilot 等用 npx skills"
trialNote: "`claude plugin marketplace add getsentry/skills` 然后 `claude plugin install sentry-skills@sentry-skills`"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, coding, ai-agent]
excerpt: "getsentry/skills 是 Sentry 公开的内部工程技能库：代码评审、提交与分支规范、AGENTS.md 维护、Claude Code 权限审计、Django 访问控制与性能审查等，是观察一家成熟工程团队如何写技能的样本。"
checkedOn: 2026-10-11
sources:
  - https://github.com/getsentry/skills
  - https://github.com/getsentry/sentry-for-ai
  - https://github.com/vercel-labs/skills
---

> 本文根据 getsentry/skills 仓库 README 整理，资料核对于 2026-10-11。

## 是什么

getsentry/skills 的 README 第一句就把定位说清了：这是给 **Sentry 员工**用的 Agent Skills。也就是说，它是 Sentry 把自己工程团队日常使用的技能直接公开了出来，而不是面向 Sentry 产品用户的集成包——README 顶部专门提示，想在项目里接入 Sentry 或排查线上问题，应该去另一个仓库 `getsentry/sentry-for-ai`。

这反而是它的价值所在：你能看到一家以工程文化著称的公司，是怎样把「我们这儿怎么做代码评审、怎么写提交信息」固化成技能的。很多技能去掉 Sentry 特有的部分后可以直接借用。

截至 2026-10-11，GitHub 显示该仓库约 1045 Star、53 Fork，最近一次推送在 2026-10-09。

## 包含哪些 Skill

README 的技能表里有（节选）：

- `code-review`：按 Sentry 的工程实践做代码评审；
- `commit`：提交代码时必须使用的技能，规范提交信息；`create-branch`：按命名约定建分支；
- `agents-md`：创建和维护简洁、有据可查的 AGENTS.md 与 CLAUDE.md；
- `claude-settings-audit`：分析仓库，生成推荐的 Claude Code `settings.json` 权限配置；
- `code-simplifier`：在不改变功能的前提下简化代码；
- `django-access-review`：Django 访问控制与越权（IDOR）安全审查；`django-perf-review`：Django 性能评审；
- `blog-writing-guide`、`brand-guidelines`：Sentry 工程博客的写作标准和品牌文案规范；
- `doc-coauthoring`：协作写文档的流程。

仓库还提供若干子智能体，并有一节专门讲怎样新增技能、技能应该放在哪里。

## 怎么安装

**Claude Code**：

```bash
claude plugin marketplace add getsentry/skills
claude plugin install sentry-skills@sentry-skills
```

安装后重启 Claude Code，技能在相关场景自动触发。更新用 `claude plugin marketplace update` 和 `claude plugin update sentry-skills@sentry-skills`。

**其他智能体**：

```bash
npx skills add getsentry/skills
```

## 怎么用

- 「按 code-review 技能评审这次改动」；
- 「提交这些改动」——`commit` 技能会接管提交信息的格式；
- 「分析这个仓库，给我一份推荐的 Claude Code 权限配置」；
- 「审查这个 Django 视图有没有越权访问的问题」。

## 适合谁 / 不适合谁

**适合：** 想参考成熟团队做法、给自己团队写工程规范技能的技术负责人；使用 Django 的后端团队；正在整理 AGENTS.md 和权限配置的 Claude Code 用户。

**不适合：** 想找「开箱即用、与公司无关」的通用技能的人——提交规范、分支命名、品牌文案都带着 Sentry 自己的约定，直接照搬会和你团队的习惯冲突，应当挑着用或改写后再用。

## 注意事项

- **许可证**：Apache-2.0。
- **会改变提交行为**：`commit` 技能的描述要求「提交时总是使用它」，装上后智能体的提交信息会按 Sentry 的格式来，不需要的话不要启用这一个。
- **维护状态**：最近推送 2026-10-09，由 Sentry 员工维护，内容随他们内部实践变化。
- 仓库里的 `brand-guidelines` 是 Sentry 的品牌规范，不要用来制作冒充 Sentry 的材料。
- 第三方技能安装前浏览 `SKILL.md`。
