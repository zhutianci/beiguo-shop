---
title: "exploratory-data-analysis skill 是什么、怎么安装使用：K-Dense 的科研数据探索 Skill（本地、有边界的 EDA）"
slug: kdense-exploratory-data-analysis-skill
name: exploratory-data-analysis（K-Dense-AI 科研技能库）
url: https://github.com/K-Dense-AI/scientific-agent-skills/tree/main/skills/exploratory-data-analysis
pricing: "开源免费（MIT）"
platforms: "Claude Code / Codex / Cursor / Gemini CLI 等支持 Agent Skills 的工具"
trialNote: "npx skills add K-Dense-AI/scientific-agent-skills --skill exploratory-data-analysis"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, research-data, data-analysis]
excerpt: "exploratory-data-analysis 是 K-Dense 科研技能库里的数据探索技能：在建模之前对已授权的本地数据做有边界的探索，生成脱敏的 CSV / JSON 画像，检查缺失、数据泄漏与异常值敏感性，并搭好规范的 EDA 报告骨架。"
checkedOn: 2026-10-11
sources:
  - https://github.com/K-Dense-AI/scientific-agent-skills/tree/main/skills/exploratory-data-analysis
  - https://github.com/K-Dense-AI/scientific-agent-skills
  - https://github.com/vercel-labs/skills
---

> 本文根据 K-Dense-AI/scientific-agent-skills 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。所在仓库 K-Dense-AI/scientific-agent-skills 在 GitHub 约 4.8 万 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

探索性数据分析（EDA）是建模和假设检验之前的摸底。K-Dense 的这个技能特别之处在于它的克制——它明确划出了自己能做和不做的事。`description`：对明确受支持的科研文件进行有边界的本地探索性分析；支持脱敏的 CSV / TSV / JSON 数据画像，可选的 NumPy、HDF5、FASTA / FASTQ 和基础图像元数据检查，缺失与数据泄漏审计，异常值和变换的敏感性分析，以及严谨的 EDA 报告骨架。其他领域格式只提供参考资料，**未知格式一律拒绝处理**。

「范围与不可商量的边界」一节写道：它用于在建模或验证性推断之前检查**已获授权的本地数据**，提供有边界的、确定性的汇总报告；它不为文件做「认证」，不推断科学含义，也不支持领域参考资料里列出的每一种格式。它还要求把数据里的每个单元格、表头、序列标题都当作不可信的内容——也就是防范数据文件里夹带诱导智能体的文字。

工作流五步：确认授权和数据根目录 → 在分析内容之前先建清单 → 运行范围最窄的自动化工具 → 补充科学背景 → 创建报告骨架。

目录里有报告模板、六份按学科划分的文件格式参考（基因组、化学分子、通用科学、显微成像、蛋白质组与代谢组、光谱分析），以及一组分析脚本。

## 怎么安装

仓库 README 的安装方式是 skills CLI。这个库有一百七十多个技能，建议用 CLI 文档里的 `--skill` 参数只装需要的：

```bash
npx skills add K-Dense-AI/scientific-agent-skills --skill exploratory-data-analysis
```

也可以把整个仓库克隆到 `~/.agents/skills/scientific-agent-skills`（用户级）或项目的 `.agents/skills/` 下。

仓库整体介绍和其他安装方式，详见本站《Scientific Agent Skills 是什么、怎么安装使用：K-Dense 的科研 Skill 库（生信、化学、数据分析、科研写作）》。

## 怎么用

- 「对 `data/cohort.csv` 做探索性分析，重点看缺失模式和可能的数据泄漏」。
- 「这几个异常值对均值和相关系数的影响有多大？」
- 「按规范搭一份 EDA 报告，把还没验证的假设单独列出」。

## 适合谁 / 局限

适合处理实验、队列、组学等科研数据的研究者，尤其是数据敏感、希望分析留在本地的场景。它刻意不做「全自动洞察」，结论的科学含义要你来补；专有仪器格式多数只有参考说明而没有自动化支持。

## 注意事项

- **许可**：MIT。
- **本地、不联网**：技能声明核心命令行工具需要 Python 3.11 以上，在本地运行且不访问网络；完整的可选功能需要 Python 3.12、uv 和各格式对应的库。
- **脱敏输出**：画像以汇总统计为主，但含个人信息的数据仍应先确认伦理与合规要求。
- 声明的工具权限含 Bash 与 Write。
