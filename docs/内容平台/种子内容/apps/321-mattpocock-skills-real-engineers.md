---
title: "mattpocock/skills 是什么、怎么安装：Matt Pocock 的工程师 Skills（grill-me、tdd、to-spec）"
slug: mattpocock-skills-real-engineers
name: mattpocock/skills（Skills For Real Engineers）
url: https://github.com/mattpocock/skills
pricing: 开源免费（MIT）
platforms: Claude Code / Codex / GitHub Copilot / Gemini CLI / Cursor / OpenCode 等
trialNote: "claude plugin install mattpocock-skills@claude-plugins-official"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, coding, ai-agent]
excerpt: "mattpocock/skills 是 TypeScript 讲师 Matt Pocock 公开的日常工程技能：grill-me 追问需求、tdd 红绿重构、to-spec 写规格、improve-codebase-architecture 查架构。小而可组合，支持 Claude Code、Codex 等。"
checkedOn: 2026-10-10
sources:
  - https://github.com/mattpocock/skills
  - https://skills.sh/mattpocock/skills
  - https://skills.sh/
  - https://code.claude.com/docs/en/discover-plugins
---

> 本文根据 mattpocock/skills 仓库 README 和 skills.sh 榜单整理，资料核对于 2026-10-10。技能增减频繁，以仓库 README 为准。

## 是什么

Matt Pocock 是知名的 TypeScript 讲师（Total TypeScript、AI Hero 的作者）。这个仓库是他自己每天在用的智能体技能，口号是「给真正做工程的人，而不是凭感觉写代码」。README 里他的立场很明确：一些大而全的流程框架接管了整个过程，出了问题反而难排查；所以他的技能刻意做得**小、容易改、可以互相组合**，不绑定某个模型。

他把技能对应到用智能体写代码时最常见的四种失败：智能体没做你想要的（用追问来对齐）、智能体太啰嗦（建立项目术语表）、代码跑不通（测试驱动和调试循环）、越写越乱（关注模块设计）。

截至 2026-10-10，GitHub 显示该仓库约 28.3 万 Star、2.4 万 Fork，最近一次推送在 2026-10-09。在 skills.sh 的总榜上（2026-10-10），它的 `grill-me`、`grill-with-docs`、`tdd`、`improve-codebase-architecture` 等多个技能都在前十，安装量各约 110 万至 130 万次。

## 包含哪些 Skill

技能分工程（engineering）和效率（productivity）两组，又分「只能由你输入触发」和「模型也可以自动调用」两类。常用的有：

- **对齐需求**：`grill-me`（围绕一个计划不停追问，直到每个分支都有答案）、`grill-with-docs`（追问的同时整理项目术语表 `GLOSSARY.md` 和架构决策记录）；
- **从讨论到任务**：`to-spec`（把当前对话整理成规格并发到 issue 系统）、`to-tickets`（拆成有依赖关系的小任务）、`wayfinder`（一次会话装不下的大工程，拆成决策清单逐个解决）；
- **实现**：`implement`（按规格实现，中途调用 tdd，最后做代码评审）、`tdd`（红绿重构，一次一个纵向切片）、`prototype`（做用完即弃的原型回答设计问题）；
- **质量**：`diagnosing-bugs`（搭一个能复现问题的反馈回路再逐步定位）、`code-review`（按规范和按规格两条线并行评审）、`improve-codebase-architecture`（扫描代码库找可以加深的模块，给出候选）、`codebase-design`、`domain-modeling`；
- **协作**：`triage`（给 issue 分流）、`pr`（PR 描述该写成什么样）、`handoff`（把当前对话压缩成交接文档）、`retro`（会话结束后建议怎么改进智能体的工作环境）；
- **通用**：`teach`（跨多次会话教你一个新概念）、`wait-what`（没看懂时让它换个说法）、`ask-matt`（不知道该用哪个技能时问它）。

## 怎么安装

README 提醒：插件方式会自动更新，`npx skills` 方式是把可编辑的文件复制进项目、需要手动更新，**每种智能体只选一种**，否则每个技能会出现两份。命令均来自 README。

```bash
# Claude Code
claude plugin install mattpocock-skills@claude-plugins-official

# Codex
codex plugin marketplace add mattpocock/skills
codex plugin add mattpocock-skills@mattpocock

# GitHub Copilot CLI
copilot plugin marketplace add mattpocock/skills
copilot plugin install mattpocock-skills@mattpocock

# Gemini CLI（手动更新）
gemini skills install https://github.com/mattpocock/skills.git --path skills/engineering
gemini skills install https://github.com/mattpocock/skills.git --path skills/productivity

# 其他智能体，或想要可编辑的文件
npx skills@latest add mattpocock/skills -a <agent>
```

最后一种方式里 `<agent>` 可以是 cursor、opencode、windsurf、amp 等，安装器询问时记得勾选 `setup-matt-pocock-skills`。

装完后**每个仓库运行一次** `/setup-matt-pocock-skills`：它会问你用哪种 issue 系统（GitHub、GitLab、本地文件等）、分流时用什么标签、文档存在哪里。README 没有提供 claude.ai 网页版的安装方式。

## 怎么用

- **改动之前先对齐**：输入 `/grill-with-docs`，再说你想做的改动。它会像面试一样逐条追问边界和取舍，同时把项目里的专有名词记进术语表。作者建议每次动手前都用一次。
- **按测试驱动实现**：对齐之后输入 `/to-spec` 生成规格，再用 `/implement`；它会在约定好的位置调用 `tdd`，先写失败的测试再写实现，收尾时自动做一次 `code-review`。
- **定期体检**：每隔几天运行 `/improve-codebase-architecture`，它会生成一份 HTML 报告列出值得重构的模块，你挑一个再深入讨论。README 强调它是「勘察」而不是「救援」，不会替你把烂代码一次理顺。

## 适合谁 / 不适合谁

**适合：**
- 有一定工程经验、想保留对流程的控制、只在关键环节借助技能的开发者；
- 重视需求对齐、测试和模块设计的团队；
- 想把技能改成自己风格的人——这些技能短小，容易读懂和修改。

**不适合：**
- 想要「装上就全自动」的一体化流程的人——那更像 Superpowers 的定位；
- 不用 issue 系统、不写测试的小型脚本项目；
- 编程新手：技能默认你理解 TDD、领域建模、ADR 这些概念。

## 注意事项

- **许可证**：MIT。
- **维护状态**：非常活跃（最近推送 2026-10-09）；技能名称和约定时有调整（例如术语表文件曾经叫 `CONTEXT.md`，现在是 `GLOSSARY.md`），旧教程里的命令可能已改名。
- **会写入外部系统**：`to-spec`、`to-tickets`、`triage` 等会在你的 issue 系统里创建或修改内容，首次使用先在测试仓库试一下，并确认智能体拿到的令牌权限。
- **不要重复安装**：插件和 `npx skills` 两种方式同时装会出现重复技能。
- **安全**：来源知名；但技能能执行命令、读写仓库文件，装进团队仓库前仍建议过一遍 `SKILL.md`。skills.sh 的审计页对其中个别技能给出过「中等风险」评级，可以作为参考。
