---
title: "agentic-awesome-skills 是什么、怎么安装：2600+ 技能的聚合库 AAS Core（sickn33）用法与风险提醒"
slug: agentic-awesome-skills-sickn33
name: sickn33/agentic-awesome-skills（AAS 聚合技能库）
url: https://github.com/sickn33/agentic-awesome-skills
pricing: 开源免费（代码 MIT，文档内容 CC BY 4.0）
platforms: Claude Code / Codex CLI / Cursor / Gemini CLI / Antigravity / Kiro / GitHub Copilot / OpenCode
trialNote: "npx agentic-awesome-skills --path ./my-skills"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, ai-agent, coding]
excerpt: "agentic-awesome-skills 是 sickn33 维护的大型聚合技能库，README 标称 2600 多个 SKILL.md，配有 npx 安装器、按风险和分类筛选、领域插件包和本地 MCP 目录工具 AAS Core。量大但质量参差，建议只挑读过的少数几个装。"
checkedOn: 2026-10-10
sources:
  - https://github.com/sickn33/agentic-awesome-skills
  - https://github.com/sickn33/agentic-awesome-skills/blob/HEAD/CATALOG.md
  - https://code.claude.com/docs/en/skills
  - https://learn.chatgpt.com/docs/build-skills
  - https://agentskills.io/home
---

> 本文根据 sickn33/agentic-awesome-skills 仓库 README 以及 Claude Code、Codex 官方文档整理，资料核对于 2026-10-10。该仓库版本迭代很快，命令和数量以仓库 README 为准。

## 是什么

agentic-awesome-skills（简称 AAS）是 GitHub 用户 sickn33 维护的一个大型技能库。它和「awesome 清单」不一样：不只是列链接，而是把大量技能的 `SKILL.md` 直接收进自己仓库的 `skills/` 目录，再配一套安装器和目录工具，是一个聚合仓库。README 标称收录 2671 个以上的技能（仓库简介里写的还是 2400 多个），来源在「Credits & Sources」一节有很长的名单，包括各 AI 平台和工具的官方仓库、各领域社区以及独立作者。

README 声明这是独立的社区项目，与 Google 没有隶属或背书关系；提到 Antigravity、Gemini 等名称只是说明兼容和安装目标。

截至 2026-10-10，GitHub 显示该仓库约 4.7 万 Star、6912 Fork，最近一次推送 2026-10-09，README 标注的当前版本是 V19.2.0。

## 包含哪些 Skill

两千多个技能没法逐个介绍，仓库提供了几种组织方式：

- **完整目录**：`CATALOG.md` 和托管的目录网站可以浏览全部技能，`skills_index.json` 供程序读取；
- **AAS Core**：一个本地 MCP 加 `aas` 命令行。让 Codex 或 Claude 在本地搜索整个目录、读取完整文件、记录它选中的技能，再生成一份你可以先审阅的计划。README 特别说明 Core 不做排名和推荐，校验通过也不代表技能适合你的项目或可以安全应用；「应用」和「恢复」两步仍属实验功能；
- **领域插件包**：面向 Claude Code 和 Codex 的十几个专题包，每包 8 到 10 个技能，如 AAS Web App Builder、AAS Product Design Studio、AAS Documents & Presentations、AAS Data Analytics、AAS Agent & MCP Builder、AAS QA & Test Automation、AAS DevOps & Cloud、AAS API Platform Builder；
- **Bundles 与 Workflows**：前者按角色或目标把相关技能归组，后者给出使用顺序。它们只是选择和使用的指引，不是另外的安装包。

README 示例里反复出现的技能名有 `brainstorming` 和 `systematic-debugging`。

## 怎么安装

**先预览、只装指定的几个**（README「Install selected skills directly」一节）：

```bash
npm exec --yes --ignore-scripts --package=agentic-awesome-skills@19.2.0 -- \
  agentic-awesome-skills --release 19.2.0 --path .agents/skills \
  --skills brainstorming,systematic-debugging --dry-run
```

看过预览没问题，去掉 `--dry-run` 再执行一次。`--path` 是目标技能目录，`--skills` 后面是技能 ID。

**按工具安装**（README「Choose Your Tool」表格里的命令）：

- Cursor：`npx agentic-awesome-skills --cursor`
- Gemini CLI：`npx agentic-awesome-skills --gemini`
- Codex CLI：`npx agentic-awesome-skills --codex`，或走 AAS Core 的本地 MCP；
- 自定义目录：`npx agentic-awesome-skills --path ./my-skills`
- 带筛选的写法（表格里 OpenCode 一行）：`npx agentic-awesome-skills --path .agents/skills --category development,backend --risk safe,none`
- Claude Code：表格写的是 AAS Core 本地 MCP、直接安装或 Claude 插件市场三选一，没有给出一行命令，具体步骤在仓库的 `docs/users/claude-code-skills.md`。

不建议一上来就整库安装。README 自己也提到，技能太多会撑爆部分工具的上下文，所以 Antigravity 的默认目标必须先选定技能、加筛选条件或显式加 `--all` 才会安装。

## 怎么用

- **先装到一个单独的目录看内容**：用上面的自定义目录写法把技能放到 `./my-skills`，读过之后只把需要的几个复制进正式的技能目录；
- **调用**：README 给的首次使用示例是，在 Cursor 里输入 `@brainstorming help me plan a feature`，在 Gemini CLI 里说 `Use brainstorming to plan a feature`；Claude Code 和 Codex 则是让智能体通过 AAS Core 自己挑选并组合技能；
- **用筛选缩小范围**：安装器支持 `--risk`、`--category`、`--tags`，优先只取风险标为 safe 或 none 的；
- **出问题时**：README 的 Troubleshooting 一节有上下文过载恢复、Windows 截断、杀毒软件告警等专题文档。

## 适合谁 / 不适合谁

**适合：**
- 已经熟悉 Skills、想在一个地方大范围检索和比较的进阶用户；
- 同时用多种智能体、需要一个统一安装器的人；
- 愿意花时间逐个阅读、只挑少数几个用的人。

**不适合：**
- 新手——两千多个技能里很难判断哪些靠谱，先从官方仓库或小而精的技能库入手更稳；
- 想「全部装上就变强」的人——技能装得越多，占用的上下文越多，README 自己就备有专门的过载恢复文档；
- 对来源和合规要求严格的企业环境，逐个审查的成本很高。

## 注意事项

- **许可证**：README 写明原创代码和工具为 MIT（仓库根目录有 LICENSE 文件），原创文档和其他非代码文字内容为 CC BY 4.0；从上游收录的技能可能带有各自的许可声明，详见仓库的 `docs/sources/sources.md`。再分发时不能简单当成「全部 MIT」。
- **维护状态**：最近一次推送 2026-10-09，版本号已到 V19.2.0，迭代很快；README 说明它跟随主分支，部分功能要等下一个版本才可用。
- **质量参差**：这是聚合库，条目来自大量不同作者，深度、时效和写法差别很大，也难免有功能重叠的技能。数量多不代表每个都经过同等程度的验证，审查负担会落在使用者身上。
- **安全**：技能可以带脚本、读写文件、执行命令。安装器给技能标了风险等级，说明并非全部是低风险内容；AAS Core 会在本机配置 MCP 服务器并修改智能体的配置文件（README 说明首次配置先出预览并返回一个待确认的摘要）。安装前通读 `SKILL.md` 和脚本，带 `--dry-run` 先看会写入什么，不要在存有密钥的生产环境里直接整库安装。
- **兼容性**：各工具的安装参数不同，以 README 表格为准；GitHub Copilot 一行标注为预览。Codex 的技能目录以 Codex 官方文档写的 `.agents/skills` 和 `~/.agents/skills` 为准。
