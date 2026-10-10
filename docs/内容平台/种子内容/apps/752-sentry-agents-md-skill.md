---
title: "agents-md skill 是什么、怎么安装使用：让智能体写出不超过 60 行的 AGENTS.md / CLAUDE.md"
slug: sentry-agents-md-skill
name: agents-md（getsentry/skills）
url: https://github.com/getsentry/skills/tree/main/skills/agents-md
pricing: "开源免费（Apache-2.0）"
platforms: "Claude Code（插件）；Cursor / Cline / GitHub Copilot 等用 npx skills"
trialNote: "`claude plugin marketplace add getsentry/skills` 然后 `claude plugin install sentry-skills@sentry-skills`"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, coding, ai-agent]
excerpt: "agents-md 是 Sentry 工程团队开源的技能：先检查仓库的包管理器、命令、文档和代码约定，再写出简短、可执行的 AGENTS.md，目标 60 行以内、绝不超过 100 行，并用软链接让 CLAUDE.md 指向同一份文件。"
checkedOn: 2026-10-11
sources:
  - https://github.com/getsentry/skills/tree/main/skills/agents-md
  - https://github.com/getsentry/skills
  - https://github.com/vercel-labs/skills
---

> 本文根据 getsentry/skills 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。所在仓库 getsentry/skills 在 GitHub 约 1045 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

项目里的 AGENTS.md（或 CLAUDE.md）是每次会话都会加载的说明，写得越长，占的上下文越多，模型反而越抓不住重点。agents-md 的立场很明确：短。`description`：创建并维护简洁的 AGENTS.md 和 CLAUDE.md 项目说明文件；用于新建或更新 AGENTS.md、设置 CLAUDE.md、记录仓库的智能体约定，或让编程智能体的说明保持最小、以引用为主。

SKILL.md 第一句就是目标：简洁、可执行，**力争 60 行以内，绝不超过 100 行**。

工作流四步：

1. **先检查再动笔**：从锁文件和清单文件确认包管理器；从 `package.json`、Makefile、任务运行器和 CI 配置里找出真实命令；看 README、贡献指南、`docs/`、安全策略等现有文档；看当前的代码模式、测试布局、生成文件和不该碰的遗留区域。
2. **选范围**：根目录的文件写全仓库的默认规则；只有某个子目录的命令或规则确实不同时才在那里再放一份，离代码最近的那份优先，而且要比根文件更短。
3. **写出最小够用的文件**。
4. **核对**写进去的每个路径和命令都真实存在。

文件设置上，在仓库根目录建 AGENTS.md；需要兼容 Claude 的入口时，把 CLAUDE.md 做成指向它的软链接，不维护两份内容不同的副本。写作规则包括：用标题、列表和表格，不写大段文字；路径用仓库相对路径，不写「见文档」这种含糊的指向；已有的文档和规范用引用，不要抄一遍；测试、检查类命令优先给能针对单个文件运行的写法。后面还有外部引用规则和一组反面例子。

## 怎么安装

`agents-md` 收在 Sentry 的 `sentry-skills` 插件里。Claude Code 里（命令来自仓库 README）：

```bash
claude plugin marketplace add getsentry/skills
claude plugin install sentry-skills@sentry-skills
```

装好后以 `/sentry-skills:agents-md` 的形式出现，也会按场景自动触发。其他智能体用 `npx skills add getsentry/skills`，想只装这一个就按 skills CLI 文档加上 `--skill agents-md`。

仓库整体介绍和其他安装方式，详见本站《getsentry/skills 是什么、怎么安装：Sentry 工程团队自用的 Agent Skills（代码评审、提交规范、Django 审查）》。

## 怎么用

- 「给这个仓库写一份 AGENTS.md」。
- 「现在的 CLAUDE.md 有三百多行，按 agents-md 的标准精简，重复文档的部分改成引用」。
- 「`packages/mobile` 的构建命令和别处不一样，给它单独加一份说明」。

## 适合谁 / 局限

适合刚开始在团队里推广编程智能体、需要一份像样的项目说明的人，也适合清理越写越长的旧文件。局限：行数上限是 Sentry 团队的取舍，规则确实多的项目需要把细节拆到被引用的文档里；Windows 上软链接需要额外权限或设置，可以改用内容相同的文件并自行保持同步；它只能写出仓库里看得出来的约定，口头规矩要你补充。

## 注意事项

- **许可**：Apache-2.0。
- **会新建或改写仓库根目录的说明文件**，改完看一遍差异再提交。
- 不带脚本，目录里另有两份说明其依据和规格的文档。
