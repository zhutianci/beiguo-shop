---
title: "lark-sheets skill 是什么、怎么安装使用：让 Claude Code 等智能体读写飞书电子表格（公式、图表、透视表）"
slug: lark-sheets-skill-feishu-spreadsheet
name: lark-sheets（larksuite/cli）
url: https://github.com/larksuite/cli/tree/main/skills/lark-sheets
pricing: "开源免费（MIT）；调用飞书开放平台须遵守其协议"
platforms: "命令行（需 Node.js）；技能供 Claude Code、Codex、Cursor 等使用"
trialNote: "npx @larksuite/cli@latest install"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, office, data-analysis]
excerpt: "lark-sheets 是飞书官方 CLI 自带的电子表格技能：让智能体创建和编辑飞书表格，读写单元格与公式、排序筛选、做图表和透视表、条件格式，并支持本地 Excel / CSV 的导入导出，附一套「最小改动」的编辑准则。"
checkedOn: 2026-10-11
sources:
  - https://github.com/larksuite/cli/tree/main/skills/lark-sheets
  - https://github.com/larksuite/cli
  - https://github.com/larksuite/cli/blob/HEAD/README.zh.md
---

> 本文根据 larksuite/cli 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。skills.sh 榜单当日显示该技能累计安装约 46.1 万次；所在仓库 larksuite/cli 在 GitHub 约 1.8 万 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

让智能体改表格，最怕两件事：把原来的格式弄乱，以及把该是公式的地方写成一个死数字。lark-sheets 的大部分篇幅都在防这两件事。`description`（原文是中文）：飞书电子表格，创建和操作电子表格；支持工作表与行列结构、单元格读写（值、公式、样式、批注、单元格图片）、区域复制移动排序填充、查找替换、批量更新，图表、透视表、条件格式、筛选器、下拉列表、迷你图、浮动图片的创建与维护，以及公式校验、历史版本回滚、本地 Excel / CSV 与飞书表格的导入导出；创建或编辑表格、统计汇总与可视化、公式计算（含 Excel 公式迁移）、财务建模时使用。多维表格不归它，走 `lark-base`。

SKILL.md 开头是一张「场景 → 命令」速查表，每行对应一份必须先读的参考文件：读数据用 `+csv-get` 或 `+cells-get`，写数据按类型分 `+csv-put`、`+table-put`、`+cells-set`，排序用 `+range-sort`，画图用 `+chart-create-basic` 等。

接着是七条**编辑准则**，摘几条：

- **最小改动**：你没点名要删、要改名的，已有的工作表一张不动；
- **公式闭环**：能推导的值要写成引用其他单元格的公式，不许先在外面算好再把数字填进去；
- **完整继承样式**：新增行列要延续原表的字体、对齐、底色和边框；
- **原子操作**：排序、删除用专门的命令，不许「读出来改完再整块覆盖」；
- **产物可核对**：你点名的表名、表头、口径逐字保留，没做到的要逐项说明。

目录里有近三十份参考文件，包括公式翻译、公式校验和历史版本。

## 怎么安装

`lark-sheets` 依赖飞书官方命令行工具 `lark-cli`，技能随 CLI 的安装向导一起装好（命令来自仓库 README）：

```bash
npx @larksuite/cli@latest install
```

它会安装 CLI 和配套技能；之后按 README 依次运行 `lark-cli config init`（配置飞书应用）和 `lark-cli auth login --recommend`（完成授权）。只想补装技能，可以用 `npx skills add larksuite/cli -y -g`。这组技能都要求本机有 `lark-cli` 命令，认证与权限处理统一由公共技能 `lark-shared` 负责，两者要一起装上。

仓库整体介绍和其他安装方式，详见本站《飞书 CLI（lark-cli）是什么、怎么安装：飞书官方命令行工具与 Agent Skills，让 AI 智能体操作飞书》。

## 怎么用

- 「把这个飞书表格（贴链接）按销售额降序排，再加一个各区域占比的饼图」。
- 「把本地的 `q3.xlsx` 导入成飞书表格，保留公式」。
- 「在这张预算表后面加一列同比增长，用公式，样式和前面的列一致」。

## 适合谁 / 局限

适合日常在飞书表格里做报表、台账和预算的团队。局限：复杂的版式调整和大批量写入要分多步执行，速度不如手工拖拽直观；它能访问的范围受你授权的飞书身份和应用权限限制；涉及重要数据时，让它先说明打算怎么改再执行。

## 注意事项

- **许可**：MIT；调用飞书开放平台须遵守其协议。
- **会真实修改线上表格**：技能支持历史版本回滚，但动手前给关键表格留个副本更稳妥。
- **需要飞书应用凭据和授权**：由 `lark-cli` 在本机管理；表格内容会进入模型上下文，敏感数据注意范围。
