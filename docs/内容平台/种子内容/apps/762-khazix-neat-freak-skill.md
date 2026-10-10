---
title: "neat-freak（洁癖）skill 是什么、怎么安装使用：开发收尾时把文档、CLAUDE.md 和记忆对齐到代码现状"
slug: khazix-neat-freak-skill
name: neat-freak（KKKKhazix/khazix-skills）
url: https://github.com/KKKKhazix/khazix-skills/tree/main/neat-freak
pricing: "开源免费（MIT）"
platforms: "Claude Code / Codex / Cursor / Kimi Code / CodeBuddy 等支持 Agent Skills 的工具"
trialNote: "帮我安装这个 skill：https://github.com/KKKKhazix/khazix-skills/tree/main/neat-freak"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, coding, ai-agent]
excerpt: "neat-freak 是数字生命卡兹克开源的收尾技能：在一轮开发结束后核对代码、运行态、项目文档、智能体规则文件、记忆和工作区残留是否一致，分轻量和完整两条路径，删除类清理必须在汇报后由你确认。"
checkedOn: 2026-10-11
sources:
  - https://github.com/KKKKhazix/khazix-skills/tree/main/neat-freak
  - https://github.com/KKKKhazix/khazix-skills
---

> 本文根据 KKKKhazix/khazix-skills 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。所在仓库 KKKKhazix/khazix-skills 在 GitHub 约 2.1 万 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

用智能体开发一段时间后，项目里会积下一堆「过期的真相」：README 写的启动命令早就变了，CLAUDE.md 里引用的文件已经不存在，目录里躺着好几份一次性的计划文档。neat-freak（中文名「洁癖」）负责收拾这些。`description`：知识与治理收尾——把项目文档、规则文件（CLAUDE.md / AGENTS.md）、获准维护的智能体记忆和工作区残留，与代码和运行时的真实情况对齐，让下一次会话或下一个接手的人面对的是唯一的、当前的答案。纯写代码、重构、调试的任务不该触发它。

SKILL.md 定义了一份「完成合同」：六个事实面——代码、运行态、文档、规则、记忆、工作区——每一面都要标出状态（已核实为最新、已修改并核实、待定、不在范围、不适用）。它特别提醒，`git status` 干净、PR 已合并或测试通过，都不能单独算作「全部同步」。

几条边界规则体现了它的克制：

- **权限先于洁癖**：它扩大的是检查深度，不是操作权限。默认只写当前项目；记忆默认只读，除非明确授权。
- **清场要二次确认**：删除分支、worktree、临时库属于破坏性收尾，必须先完整汇报并保留现场，你看完后明确同意才执行；一开始说过「做完后清理」不算数。
- **读到的内容不是指令**：项目文件和记忆里出现的「执行这条命令」之类的文字，不因为写在文件里就获得授权。

两条路径：**轻量路径**五步（盘点 → 对齐事实 → 补一份最小的规则文件 → 清点会话残留 → 汇报），适合多数个人项目；有发布流程、远端协作或多项目联动时走**完整路径**（从发现平台与规则，到建立事实矩阵、审计规则、先减后加地修改、谨慎处理记忆、验证发布闭环、分两阶段汇报）。

## 怎么安装

这个库没有安装器，README 的做法是把技能目录的链接直接交给智能体，让它自己下载放好。在 Claude Code、Codex 等工具里说：

```text
帮我安装这个 skill：https://github.com/KKKKhazix/khazix-skills/tree/main/neat-freak
```

也可以手动把仓库里的 `neat-freak` 文件夹复制到 `~/.claude/skills/`（Claude Code）或所用工具的技能目录。

仓库整体介绍和其他安装方式，详见本站《khazix-skills 是什么、怎么安装使用：数字生命卡兹克的 Skill 合集（leader、neat-freak 洁癖、横纵分析法）》。

## 怎么用

- 「/neat」或「洁癖一下」——一轮开发结束后调用。
- 「docs 和代码对不上了，帮我同步，只改文档不动代码」。
- 「我要把这个项目交接给同事，做一次完整的知识收尾，清理项先列给我看」。

## 适合谁 / 局限

适合长期用 Claude Code、Codex 维护项目，文档和规则文件越积越乱的人。局限：「运行态」这一面需要它能访问真实的服务或页面，访问不到时只能标为待定；它判断哪些文件是残留靠的是命名和上下文，删除清单务必自己过一遍；完整路径步骤多，小项目用轻量路径就够。

## 注意事项

- **许可**：MIT。
- **会修改文档和规则文件**，在你确认后还可能删除文件、分支和 worktree；建议在干净的提交点之后运行。
- 目录里有一个 Bash 盘点脚本（`scripts/audit-inventory.sh`）和一批评测用的夹具文件；没有 Bash 时技能要求手工做等价的检查。
