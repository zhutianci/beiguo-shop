---
title: "obsidian-cli skill 是什么、怎么安装使用：让智能体通过 Obsidian CLI 操作笔记库、调试插件"
slug: obsidian-cli-skill-kepano
name: obsidian-cli（kepano/obsidian-skills）
url: https://github.com/kepano/obsidian-skills/tree/main/skills/obsidian-cli
pricing: "开源免费（MIT）"
platforms: "Claude Code / Codex / OpenCode"
trialNote: "`/plugin marketplace add kepano/obsidian-skills` 然后 `/plugin install obsidian@obsidian-skills`"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, office, coding]
excerpt: "obsidian-cli 是 kepano/obsidian-skills 里的命令行 Skill：教智能体用 Obsidian 官方 CLI 读取、创建、搜索和管理笔记、任务与属性，并支持插件和主题开发时的重载、执行脚本、截图与 DOM 检查。"
checkedOn: 2026-10-11
sources:
  - https://github.com/kepano/obsidian-skills/tree/main/skills/obsidian-cli
  - https://github.com/kepano/obsidian-skills
  - https://help.obsidian.md/cli
---

> 本文根据 kepano/obsidian-skills 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。skills.sh 榜单当日显示该技能累计安装约 7.8 万次；所在仓库 kepano/obsidian-skills 在 GitHub 约 4.9 万 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

直接读写笔记库里的 Markdown 文件能解决不少事，但有些操作只有 Obsidian 应用自己做才可靠：按它的索引搜索、处理任务、改属性、打开某篇笔记。Obsidian 官方提供了命令行工具，obsidian-cli 技能教智能体使用它。`description`：使用 Obsidian CLI 与笔记库交互，读取、创建、搜索和管理笔记、任务、属性等；同时支持插件和主题开发，提供重载插件、运行 JavaScript、捕获错误、截图和检查 DOM 的命令。用户要求与笔记库交互、管理或搜索笔记、从命令行执行库操作，或开发调试插件和主题时使用。

一个关键前提写在最前面：`obsidian` 命令是和**正在运行的 Obsidian 实例**交互的，**需要 Obsidian 处于打开状态**。

技能没有把命令全部抄一遍，而是告诉智能体运行 `obsidian help` 查看全部可用命令——这份帮助总是最新的。它重点讲了几条规则：参数用 `=` 赋值、带空格的值要加引号、布尔开关不带值、多行内容用转义字符；怎样指定目标文件和目标笔记库；几种常见用法；以及插件开发时「改代码 → 重载 → 检查」的循环。

## 怎么安装

`obsidian-cli` 随 kepano/obsidian-skills 的 `obsidian` 插件一起安装。Claude Code 里输入（命令来自仓库 README）：

```text
/plugin marketplace add kepano/obsidian-skills
/plugin install obsidian@obsidian-skills
```

其他智能体用 `npx skills add https://github.com/kepano/obsidian-skills`，在选择界面里勾选 `obsidian-cli`；也可以把仓库里的 `skills/obsidian-cli` 文件夹直接复制到所用工具的技能目录。

仓库整体介绍和其他安装方式，详见本站《obsidian-skills 是什么、怎么安装：Obsidian CEO kepano 写的 Agent Skills，让 Claude Code 读写 Obsidian 笔记库》。

## 怎么用

- 「在我的笔记库里搜索所有提到『续约』的笔记，列出标题和所在文件夹」。
- 「给今天的日记追加一条待办：周五前回复供应商」。
- 「我在开发一个 Obsidian 插件，改完代码后帮我重载并看看控制台有没有报错」。

这个技能只有一份 SKILL.md。

## 适合谁 / 局限

适合希望智能体像使用应用本身那样操作笔记库的重度用户，以及 Obsidian 插件和主题的开发者。电脑上必须装有带 CLI 功能的 Obsidian 版本并保持运行；在服务器或没有图形界面的环境里用不了；claude.ai 网页版访问不到你本机的 Obsidian。

## 注意事项

- **许可**：MIT。
- **会执行命令**：CLI 能操作整个笔记库，也包含「运行 JavaScript」这类开发用命令，权限很大——让它执行前看清命令，重要的库先备份。
- CLI 的具体命令以 `obsidian help` 和 Obsidian 官方帮助文档为准。
