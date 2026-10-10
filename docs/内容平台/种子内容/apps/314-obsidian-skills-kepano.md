---
title: "obsidian-skills 是什么、怎么安装：Obsidian CEO kepano 写的 Agent Skills，让 Claude Code 读写 Obsidian 笔记库"
slug: obsidian-skills-kepano
name: kepano/obsidian-skills（Obsidian 技能）
url: https://github.com/kepano/obsidian-skills
pricing: 开源免费（MIT）
platforms: Claude Code / Codex / OpenCode
trialNote: "`/plugin marketplace add kepano/obsidian-skills` 然后 `/plugin install obsidian@obsidian-skills`"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, office]
excerpt: "obsidian-skills 是 Obsidian CEO Steph Ango（kepano）开源的 Agent Skills：教智能体写 Obsidian 风格 Markdown、Bases 数据视图、JSON Canvas 白板，并通过 Obsidian CLI 操作笔记库，共 6 个技能。"
checkedOn: 2026-10-10
sources:
  - https://github.com/kepano/obsidian-skills
  - https://help.obsidian.md/cli
  - https://code.claude.com/docs/en/skills
  - https://learn.chatgpt.com/docs/build-skills
  - https://agentskills.io/home
---

> 本文根据 kepano/obsidian-skills 仓库 README、Obsidian 官方帮助文档以及 Claude Code、Codex 官方文档整理，资料核对于 2026-10-10。

## 是什么

obsidian-skills 是一组给 Obsidian 用的 Agent Skills，作者是 Steph Ango（网名 kepano），也就是笔记软件 Obsidian 的 CEO。Obsidian 的笔记是本地的 Markdown 文件，天然适合让编程智能体直接读写；但 Obsidian 有自己的一套语法和文件格式，比如双链、嵌入、提示框、属性，以及 `.base` 数据视图和 `.canvas` 白板，通用模型经常写得似是而非。这个仓库把这些格式的正确写法教给智能体。

技能遵循 Agent Skills 规范，README 写明可用于任何兼容的智能体，点名了 Claude Code、Codex 和 OpenCode。

截至 2026-10-10，GitHub 显示该仓库约 4.9 万 Star、3500 Fork，最近一次推送 2026-09-15，是笔记类技能里关注度很高的一个。

## 包含哪些 Skill

共 6 个，前三个管文件格式，后三个管工具：

- `obsidian-markdown`：创建和编辑 Obsidian 风格的 Markdown（`.md`），包括双链、嵌入、提示框、属性等 Obsidian 特有语法；
- `obsidian-bases`：创建和编辑 Obsidian Bases（`.base`），含视图、筛选、公式和汇总；
- `json-canvas`：创建和编辑 JSON Canvas 白板文件（`.canvas`），含节点、连线、分组；
- `obsidian-cli`：通过 Obsidian CLI 与笔记库交互，也覆盖插件和主题开发；
- `defuddle`：用 Defuddle 把网页提取成干净的 Markdown，去掉杂乱内容以节省 token；
- `knap`：用 Knap 把 JSON 或 CSV 数据套进 Markdown 模板，支持批量生成文件。

## 怎么安装

**Claude Code 插件市场**（在会话里输入）：

```text
/plugin marketplace add kepano/obsidian-skills
/plugin install obsidian@obsidian-skills
```

**npx skills**：

```text
npx skills add https://github.com/kepano/obsidian-skills
```

README 把 SSH 地址的写法 `npx skills add git@github.com:kepano/obsidian-skills.git` 放在前面，没配 SSH 密钥的用上面的 https 版本即可。

**手动安装**：

- Claude Code：把仓库内容放进笔记库根目录（或你用 Claude Code 打开的那个文件夹）下的 `/.claude` 文件夹；
- Codex：README 写的是把 `skills/` 目录复制到 Codex 技能路径（通常是 `~/.codex/skills`）。Codex 官方文档当前写的用户级目录是 `~/.agents/skills`，以官方文档为准；
- OpenCode：整仓克隆到技能目录，注意不要只复制里面的 `skills/` 文件夹：

```sh
git clone https://github.com/kepano/obsidian-skills.git ~/.opencode/skills/obsidian-skills
```

## 怎么用

在笔记库所在的文件夹里启动智能体，然后直接提要求，技能会按内容自动加载：

- 「把这份会议记录整理成一篇笔记，加上日期和参会人属性，人名用双链」——用到 `obsidian-markdown`；
- 「建一个 Base，列出所有带 #读书 标签的笔记，按评分排序」——用到 `obsidian-bases`；
- 「把这个项目的模块关系画成一张 Canvas」——用到 `json-canvas`；
- 「把这个网页存成笔记，只保留正文」——用到 `defuddle`。

在 Claude Code 里可以用 `/skills` 确认技能已识别。`obsidian-cli`、`defuddle`、`knap` 三个技能分别依赖对应的命令行工具，要先按各自的官方说明装好。

## 适合谁 / 不适合谁

**适合：**
- 重度 Obsidian 用户，想让 AI 帮忙整理、归档、批量改写笔记；
- 用 Obsidian 做知识库或项目管理，需要自动生成数据视图和白板的人；
- 开发 Obsidian 插件、主题的作者。

**不适合：**
- 用 Notion、飞书文档等云端笔记的人——技能针对本地 Markdown 文件；
- 不想在电脑上装命令行智能体、只在手机上记笔记的用户。

## 注意事项

- **许可证**：MIT，仓库根目录有 LICENSE 文件，版权方为 Steph Ango。
- **维护状态**：最近一次推送 2026-09-15；Obsidian 的 Bases、CLI 等功能本身还在演进，语法以 Obsidian 官方帮助文档为准。
- **安全**：智能体会直接改写笔记库里的文件，批量操作前先备份或用 git 管理笔记库，方便回退。`defuddle` 会联网抓取网页，网页里可能夹带诱导智能体的文字，抓回来的内容当资料看，不要让它照着执行；`obsidian-cli` 能操作整个笔记库，执行前看清命令。从别处下载的改版技能，安装前先读 `SKILL.md`。
- **兼容性**：README 只写了 Claude Code、Codex、OpenCode 三种手动安装方式；claude.ai 网页版读不到你本地的笔记库，不适用。
