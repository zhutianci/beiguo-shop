---
title: "obsidian-bases skill 是什么、怎么安装使用：让 AI 生成 Obsidian Bases 数据视图（.base 文件、筛选、公式）"
slug: obsidian-bases-skill-kepano
name: obsidian-bases（kepano/obsidian-skills）
url: https://github.com/kepano/obsidian-skills/tree/main/skills/obsidian-bases
pricing: "开源免费（MIT）"
platforms: "Claude Code / Codex / OpenCode"
trialNote: "`/plugin marketplace add kepano/obsidian-skills` 然后 `/plugin install obsidian@obsidian-skills`"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, office, data-analysis]
excerpt: "obsidian-bases 是 kepano/obsidian-skills 里的数据视图 Skill：教智能体创建和编辑 Obsidian Bases 的 .base 文件，写对筛选条件、公式与汇总，配置表格、卡片、列表、地图四种视图。"
checkedOn: 2026-10-11
sources:
  - https://github.com/kepano/obsidian-skills/tree/main/skills/obsidian-bases
  - https://github.com/kepano/obsidian-skills
  - https://help.obsidian.md/cli
---

> 本文根据 kepano/obsidian-skills 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。skills.sh 榜单当日显示该技能累计安装约 7.7 万次；所在仓库 kepano/obsidian-skills 在 GitHub 约 4.9 万 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

Bases 是 Obsidian 的数据库式视图功能：一个 `.base` 文件定义「挑哪些笔记、显示哪些属性、怎么排」，就能把散落的笔记变成表格或卡片墙。它的文件是 YAML，筛选和公式有自己的一套语法，而这项功能比较新，模型的知识往往不全。obsidian-bases 填补的就是这块。`description`：创建和编辑带视图、筛选、公式和汇总的 Obsidian Bases（`.base` 文件）；处理 `.base` 文件、为笔记创建类似数据库的视图，或用户提到 Bases、表格视图、卡片视图、筛选、公式时使用。

工作流程五步：创建 `.base` 文件并写入合法的 YAML → 用 `filters` 限定范围（按标签、文件夹、属性或日期）→ 可选地在 `formulas` 里定义计算属性 → 配置一个或多个视图（`table`、`cards`、`list`、`map`），用 `order` 指定显示哪些属性 → 校验 YAML 语法。

后面的参考内容相当完整：筛选的结构与运算符、三类属性（笔记属性、文件属性、公式属性）、`this` 关键字、公式语法与常用函数、时长类型与日期运算、默认汇总公式，三个完整示例（任务跟踪、阅读清单、日记索引），怎样把 Base 嵌入笔记，以及 YAML 引号规则和常见报错。函数清单单独放在一份参考文件里。

## 怎么安装

`obsidian-bases` 随 kepano/obsidian-skills 的 `obsidian` 插件一起安装。Claude Code 里输入（命令来自仓库 README）：

```text
/plugin marketplace add kepano/obsidian-skills
/plugin install obsidian@obsidian-skills
```

其他智能体用 `npx skills add https://github.com/kepano/obsidian-skills`，在选择界面里勾选 `obsidian-bases`；也可以把仓库里的 `skills/obsidian-bases` 文件夹直接复制到所用工具的技能目录。

仓库整体介绍和其他安装方式，详见本站《obsidian-skills 是什么、怎么安装：Obsidian CEO kepano 写的 Agent Skills，让 Claude Code 读写 Obsidian 笔记库》。

## 怎么用

- 「建一个 Base，列出所有带 #读书 标签的笔记，显示作者、评分和读完日期，按评分排序」。
- 「给项目文件夹做一个卡片视图，只显示状态不是『已完成』的」。
- 「加一个公式列，算出每个任务距离截止日期还有几天」。

## 适合谁 / 局限

适合用 Obsidian 做任务管理、阅读记录、客户或项目台账的人。前提是你的笔记已经有比较规整的属性——属性乱，视图也乱，可以先让智能体配合 obsidian-markdown 统一属性；Bases 功能还在演进，语法以 Obsidian 官方帮助文档为准。

## 注意事项

- **许可**：MIT。
- **不执行脚本、不联网**：只生成和修改 `.base` 文件。
- 生成后在 Obsidian 里打开确认；公式报错时把错误信息贴回去让它修。
