---
title: "statistical-analysis skill 是什么、怎么安装使用：K-Dense 的科研统计分析 Skill（选检验、查假设、报告效应量）"
slug: kdense-statistical-analysis-skill
name: statistical-analysis（K-Dense-AI/scientific-agent-skills）
url: https://github.com/K-Dense-AI/scientific-agent-skills/tree/main/skills/statistical-analysis
pricing: "开源免费（MIT）"
platforms: "Claude Code / Codex / Cursor / Gemini CLI 等支持 Agent Skills 的工具"
trialNote: "npx skills add K-Dense-AI/scientific-agent-skills --skill statistical-analysis"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, research-data, data-analysis]
excerpt: "statistical-analysis 是 K-Dense 科研技能库里的统计技能：引导完成检验方法选择、前提假设检查、效应量、功效分析和贝叶斯替代方案，按 APA 格式报告结果，覆盖 t 检验、方差分析、卡方、相关、回归和非参数方法。"
checkedOn: 2026-10-11
sources:
  - https://github.com/K-Dense-AI/scientific-agent-skills/tree/main/skills/statistical-analysis
  - https://github.com/K-Dense-AI/scientific-agent-skills
  - https://github.com/vercel-labs/skills
---

> 本文根据 K-Dense-AI/scientific-agent-skills 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。所在仓库 K-Dense-AI/scientific-agent-skills 在 GitHub 约 4.8 万 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

科研数据分析里最常见的错误不在计算，而在选择：该用哪种检验、数据满不满足前提、只报 p 值不报效应量。statistical-analysis 把一位严谨的统计顾问会问的问题变成了流程。`description`：面向科研数据的引导式统计分析——检验选择、假设检查、效应量、功效分析、贝叶斯替代方案和 APA 格式的报告；只要用户想比较组间差异、检验假设、分析实验或问卷数据、检查统计假设、计算所需样本量或撰写结果，就应使用，即使用户没有说出具体的检验名称。覆盖 t 检验、方差分析、卡方、相关、回归、非参数与贝叶斯方法。

概述里有两句值得注意的话：要先明确估计目标和抽样单位；数值筛查并不能「认证」假设成立，也不能替代科学判断。

主要内容：

- **检验选择指南**与速查表；
- **假设检查**，以及假设不满足时怎么办；
- **运行检验**的完整范例：带完整报告的 t 检验、带事后比较的方差分析、带诊断的线性回归、贝叶斯 t 检验；
- **效应量**：常用指标、计算方法和置信区间；
- **功效分析**：研究设计阶段的先验分析和事后的敏感性分析；
- **结果报告**。

目录里有一个假设检查脚本和五份参考文件。

## 怎么安装

仓库 README 的安装方式是 skills CLI。这个库有一百七十多个技能，建议用 CLI 文档里的 `--skill` 参数只装需要的：

```bash
npx skills add K-Dense-AI/scientific-agent-skills --skill statistical-analysis
```

也可以把整个仓库克隆到 `~/.agents/skills/scientific-agent-skills`（用户级）或项目的 `.agents/skills/` 下。

仓库整体介绍和其他安装方式，详见本站《Scientific Agent Skills 是什么、怎么安装使用：K-Dense 的科研 Skill 库（生信、化学、数据分析、科研写作）》。

## 怎么用

- 「三个处理组的数据在这个 CSV 里，帮我比较组间差异，并检查前提假设」。
- 「想检测中等大小的效应，每组需要多少样本？」
- 「把这个回归结果写成论文里的结果段落，按 APA 格式」。

## 适合谁 / 局限

适合心理学、医学、生物、社会科学等领域需要做常规统计的研究生和科研人员。复杂的实验设计、多层模型、因果推断超出了它的引导范围，描述里把底层建模指向同库的 statsmodels 和 pymc 技能；统计方法选对了，也不能弥补研究设计本身的缺陷。

## 注意事项

- **许可**：MIT。
- **环境**：技能声明需要 Python 3.12 以上和文档里说明的隔离科学计算环境，联网仅用于安装和查文档。
- **会执行代码**：分析在本地运行，数据不必上传到别处，但内容会进入模型上下文。
- 涉及临床或政策决策的分析，应由专业统计人员复核。
