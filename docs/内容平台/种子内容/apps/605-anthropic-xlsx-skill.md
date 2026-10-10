---
title: "Claude xlsx skill 是什么、怎么安装使用：Anthropic 官方 Excel 技能（公式、格式、清洗表格数据）"
slug: anthropic-xlsx-skill
name: xlsx（anthropics/skills）
url: https://github.com/anthropics/skills/tree/main/skills/xlsx
pricing: "免费使用（源码可见，非开源；条款见 LICENSE.txt）"
platforms: "Claude Code / claude.ai / Claude API"
trialNote: "`/plugin marketplace add anthropics/skills` 然后 `/plugin install document-skills@anthropic-agent-skills`"
products: [claude]
models: [claude-llm]
topics: [agent-skills, office, data-analysis]
excerpt: "xlsx 是 Anthropic 官方的电子表格 Skill：用 openpyxl 写公式和格式、pandas 处理批量数据，要求交付前重算并做到公式零报错，也覆盖 .csv / .tsv 的清洗与转换。"
checkedOn: 2026-10-11
sources:
  - https://github.com/anthropics/skills/tree/main/skills/xlsx
  - https://github.com/anthropics/skills
  - https://github.com/anthropics/skills/blob/main/.claude-plugin/marketplace.json
  - https://code.claude.com/docs/en/skills
---

> 本文根据 anthropics/skills 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。skills.sh 榜单当日显示该技能累计安装约 18.0 万次；所在仓库 anthropics/skills 在 GitHub 约 18.0 万 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

xlsx 技能管的是「以表格文件为主要输入或输出」的任务。`description` 给的范围是：打开、读取、编辑、修复已有的 `.xlsx`、`.xlsm`、`.xltx`、`.csv`、`.tsv`（加列、算公式、调格式、画图表、清洗脏数据），从零或从其他数据源新建表格，以及在各种表格格式之间转换。它也写明了不该触发的情况：最终交付物是 Word 文档、HTML 报告、独立 Python 脚本或数据库管道时，即使涉及表格数据也不用它。

工具选择很明确：带公式和格式的新建、编辑用 `openpyxl`；大批量数据进出用 `pandas`；想快速看一眼内容用 `markitdown`。它对成品有硬性要求：统一使用专业字体；**公式零错误**——只要文件里有公式，就必须运行目录里的重算脚本，在它报告仍有错误时不能交付；并且优先写公式而不是把算好的数字硬填进单元格，这样你改了输入，结果会跟着变。SKILL.md 里还有一节专门讲财务模型的惯例。

## 怎么安装

`xlsx` 属于 anthropics/skills 仓库的 document-skills 插件包（docx、xlsx、pptx、pdf 四个一起）。在 Claude Code 会话中输入（命令来自仓库 README）：

```text
/plugin marketplace add anthropics/skills
/plugin install document-skills@anthropic-agent-skills
```

claude.ai 网页版和 App 不用安装：README 说明文档类技能已内置，生成或读取对应文件时会自动启用。

仓库整体介绍和其他安装方式，详见本站《anthropics/skills 是什么、怎么安装：Anthropic 官方 Skills 仓库（docx / pptx / xlsx / pdf、skill-creator）》。

## 怎么用

- 「把 sales.csv 按地区和月份汇总，做成带合计公式和条件格式的 Excel」。
- 「这个表头错位、夹着空行的导出文件，帮我整理成规范的表格」。
- 「在这份预算表里加一列同比增长率，用公式，不要写死数值」。

目录里带有重算与校验用的脚本，以及 Office 文件格式的 schema。

## 适合谁 / 局限

适合财务、运营、数据分析这类天天和表格打交道的岗位。它生成的是真实可编辑的工作簿，但透视表、宏、Power Query 这类高级功能不在它的强项里；`markitdown` 读出来的内容没有单元格坐标，技能自己也提醒不要据此规划修改位置。

## 注意事项

- **许可**：`license` 字段为 Proprietary（源码可见、非开源），条款见目录内 LICENSE.txt。
- **依赖**：Python 的 openpyxl、pandas、markitdown；重算公式要用到 LibreOffice，清单见 SKILL.md 的 Dependencies 一节。
- **核对数字**：公式零报错不等于业务逻辑正确，涉及金额的表格务必抽查。
- 原始数据文件建议另存副本后再让它修改。
