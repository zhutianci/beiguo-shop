---
title: "context-engineering skill 是什么、怎么安装使用：Addy Osmani 的上下文工程 Skill（给智能体喂对信息）"
slug: addyosmani-context-engineering-skill
name: context-engineering（addyosmani/agent-skills）
url: https://github.com/addyosmani/agent-skills/tree/main/skills/context-engineering
pricing: "开源免费（MIT）"
platforms: "Claude Code / Codex / Cursor / Gemini CLI / OpenCode / Copilot 等"
trialNote: "npx skills add addyosmani/agent-skills --skill context-engineering"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, ai-agent, prompt-engineering]
excerpt: "context-engineering 是 addyosmani/agent-skills 里的上下文管理技能：把智能体需要的信息分成规则文件、规格与架构、相关源码、报错输出、对话管理五层，并给出打包策略、预算取舍和冲突处理方法。"
checkedOn: 2026-10-11
sources:
  - https://github.com/addyosmani/agent-skills/tree/main/skills/context-engineering
  - https://github.com/addyosmani/agent-skills
  - https://github.com/vercel-labs/skills
---

> 本文根据 addyosmani/agent-skills 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。所在仓库 addyosmani/agent-skills 在 GitHub 约 10.4 万 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

同一个模型，有时输出精准，有时胡说八道，差别常常不在模型而在它「看到了什么」。context-engineering 把这件事系统化。技能的概述是：在正确的时间给智能体正确的信息——上下文是影响输出质量最大的杠杆，太少它会臆造，太多它会失焦。`description`：优化智能体的上下文配置；开始新会话、输出质量下降、在任务之间切换，或需要为项目配置规则文件和上下文时使用。

主体是一个**五层上下文层级**：

1. **规则文件**：项目级的长期约定（如 CLAUDE.md、AGENTS.md）；
2. **规格与架构**；
3. **相关的源文件**；
4. **报错输出**；
5. **对话管理**：包括怎样设置可以重新开始的会话边界。

之后是三种打包策略——「倾倒式」、选择性包含、分层摘要——以及**上下文预算管理**：空间不够时先砍什么、什么要保到最后、丢弃之前先压缩、把重要内容放在靠后的位置。还有 MCP 集成、遇到上下文相互矛盾或需求不完整时怎么办、内联规划模式，以及一组反模式。

## 怎么安装

仓库 README 给出了单独安装某个技能的写法：

```bash
npx skills add addyosmani/agent-skills --skill context-engineering
```

想整套安装，Claude Code 用 `/plugin marketplace add addyosmani/agent-skills` 加 `/plugin install agent-skills@addy-agent-skills`，Codex 用 `codex plugin marketplace add addyosmani/agent-skills` 加 `codex plugin add agent-skills@agent-skills`。README 提示，插件安装遇到 SSH 权限报错时改用仓库的 HTTPS 地址。

仓库整体介绍和其他安装方式，详见本站《addyosmani/agent-skills 是什么、怎么安装：Addy Osmani 的 25 个生产级工程 Skills（/spec、/plan、/build）》。

## 怎么用

- 「帮我给这个仓库写一份规则文件，把构建命令、目录约定和禁区写清楚」。
- 「这个会话越做越乱，按上下文工程的做法整理一下，准备开新会话」。
- 「要修这个 bug，你需要我提供哪些文件和信息？」

这个技能只有一份 SKILL.md。

## 适合谁 / 局限

适合已经在日常使用编程智能体、想把效果稳定下来的开发者，以及负责给团队配置规则文件的人。它讲的是方法而不是工具，具体的文件名和加载机制因智能体而异，需要对照你所用工具的文档落地。

## 注意事项

- **许可**：MIT。
- **不执行脚本、不联网**。
- 规则文件写得越长并不越好，它自己就把「信息过载」列为反模式。
