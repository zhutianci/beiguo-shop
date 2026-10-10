---
title: "addyosmani/agent-skills 是什么、怎么安装：Addy Osmani 的 25 个生产级工程 Skills（/spec、/plan、/build）"
slug: addyosmani-agent-skills-engineering
name: addyosmani/agent-skills
url: https://github.com/addyosmani/agent-skills
pricing: 开源免费（MIT）
platforms: Claude Code / Codex / Cursor / Gemini CLI / Antigravity / OpenCode / Copilot / Kiro 等
trialNote: "npx skills add addyosmani/agent-skills"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, coding, ai-agent]
excerpt: "addyosmani/agent-skills 是 Addy Osmani 开源的 25 个工程技能，按「定义、计划、构建、验证、评审、发布」六个阶段组织，配 9 个斜杠命令，把 Google 工程文化里的规格先行、小步提交、代码评审标准写成智能体能照做的流程。"
checkedOn: 2026-10-10
sources:
  - https://github.com/addyosmani/agent-skills
  - https://github.com/vercel-labs/skills
  - https://code.claude.com/docs/en/discover-plugins
  - https://learn.chatgpt.com/docs/build-skills
---

> 本文根据 addyosmani/agent-skills 仓库 README 和相关官方文档整理，资料核对于 2026-10-10。技能数量和命令会更新，以仓库 README 为准。

## 是什么

Addy Osmani 是在 Google 工作多年的知名工程师和技术作者。这个仓库把资深工程师做软件时的流程、质量关卡和最佳实践，打包成智能体每个阶段都会一致遵守的技能。README 的出发点是：编程智能体默认走最短路径，常常跳过规格、测试、安全评审这些让软件可靠的环节；技能用带步骤和验证关卡的流程把这些环节补回来。

内容大量取自 Google 的工程文化（README 提到《Software Engineering at Google》和 Google 的工程实践指南）：API 设计里的海勒姆定律、测试金字塔、每次改动约 100 行的评审粒度、主干开发、把代码视为负债的弃用流程等。

截至 2026-10-10，GitHub 显示该仓库约 10.4 万 Star、1.1 万 Fork，最近一次推送在 2026-10-03。

## 包含哪些 Skill

共 25 个技能（24 个生命周期技能 + 1 个引导技能 `using-agent-skills`），按阶段分组：

- **定义**：`interview-me`（一次只问一个问题，问到把握足够为止）、`idea-refine`、`spec-driven-development`（先写 PRD 再写代码）、`constraint-driven-development`（定下质量门槛写进 CONSTRAINTS.md）；
- **计划**：`planning-and-task-breakdown`（拆成带验收标准的小任务）；
- **构建**：`incremental-implementation`（薄的纵向切片，做一片、测一片、提交一片）、`test-driven-development`、`context-engineering`、`source-driven-development`（框架用法以官方文档为据并标注来源）、`doubt-driven-development`（对关键决定做对抗式复核）、`frontend-ui-engineering`、`api-and-interface-design`；
- **验证**：`browser-testing-with-devtools`（用 Chrome DevTools MCP 看真实运行数据）、`debugging-and-error-recovery`；
- **评审**：`code-review-and-quality`（五个维度的评审）、`code-simplification`、`security-and-hardening`（OWASP Top 10）、`performance-optimization`；
- **发布**：`git-workflow-and-versioning`、`ci-cd-and-automation`、`deprecation-and-migration`、`documentation-and-adrs`、`observability-and-instrumentation`、`shipping-and-launch`。

另外有 9 个斜杠命令作为入口：`/spec`、`/plan`、`/build`、`/test`、`/constraints`、`/review`、`/webperf`、`/code-simplify`、`/ship`；以及 4 个评审用的智能体角色（代码评审、测试、安全审计、Web 性能审计）。

## 怎么安装

命令均来自 README。

**任意智能体，一条命令**（通过开源的 skills CLI）：

```bash
npx skills add addyosmani/agent-skills            # install all 25 skills
npx skills add addyosmani/agent-skills --list     # browse before installing
```

只装单个技能时加 `--skill 技能名`。README 提醒：单装一个技能不会带上仓库级的 `references/` 检查清单目录，技能仍可用，但引用的共享清单读不到。

**Claude Code（README 推荐）**：

```text
/plugin marketplace add addyosmani/agent-skills
/plugin install agent-skills@addy-agent-skills
```

如果因为没配 SSH 密钥报错，把第一条换成 `/plugin marketplace add https://github.com/addyosmani/agent-skills.git`。

**Codex**（CLI v0.122 以上）：

```bash
codex plugin marketplace add addyosmani/agent-skills
codex plugin add agent-skills@agent-skills
```

**Gemini CLI**：`gemini skills install https://github.com/addyosmani/agent-skills.git --path skills`。Cursor、OpenCode、Windsurf、Copilot、Kiro、Antigravity 的做法见 README 和仓库 docs 目录。README 没有提供 claude.ai 网页版的安装方式。

## 怎么用

- **按生命周期走命令**：新功能从 `/spec` 开始（先出规格），`/plan` 拆任务，`/build` 一次做一个切片，`/test` 证明它能工作，`/review` 合并前评审，`/ship` 上线前检查。每个命令会自动激活对应的技能。
- **少一点手动步骤**：规格确定后输入 `/build auto`，它会生成计划并在你批准一次之后连续实现所有任务；每个任务仍然是测试驱动、单独提交，遇到失败或高风险步骤会停下。
- **自动触发**：不输命令也行——设计接口时会触发 `api-and-interface-design`，做界面时触发 `frontend-ui-engineering`。在 Codex 里按 README 的写法用 `@` 提及技能，例如 `@spec-driven-development`。

## 适合谁 / 不适合谁

**适合：**
- 要把智能体用在正式上线项目上、看重规格、测试、评审和发布纪律的团队；
- Web 前端和全栈项目（性能、可访问性、浏览器调试相关技能比较完整）；
- 想要一套「数量适中、结构清晰」的工程技能的人——25 个，比几百个的大合集容易掌握。

**不适合：**
- 快速原型和一次性脚本，完整流程显得偏重；
- 非 Web 领域（嵌入式、数据科学等）针对性不强；
- 已经装了 Superpowers 或 mattpocock/skills 的项目——三者定位重叠，README 的 docs/comparison.md 有对比，建议选一套。

## 注意事项

- **许可证**：MIT。
- **维护状态**：活跃（最近推送 2026-10-03）。
- **依赖 MCP 的技能**：`browser-testing-with-devtools` 需要 Chrome DevTools MCP，会让智能体操作真实浏览器，注意不要在登录了重要账号的浏览器配置里跑。
- **安全**：技能是纯 Markdown 流程加少量参考清单，风险面相对小；但 `/build auto` 会让智能体连续提交代码，务必在 Git 仓库里用并审查提交。第三方技能安装前通读 `SKILL.md` 的习惯同样适用。
- **兼容性**：各工具支持程度不同，README 提到 Antigravity CLI 某些版本里旧式命令找不到，需要直接调用技能；Codex 需要较新的 CLI 版本。
