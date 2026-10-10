---
title: "literature-review skill 是什么、怎么安装使用：K-Dense 的文献综述 Skill（PubMed / arXiv 检索、筛选、引用核验）"
slug: kdense-literature-review-skill
name: literature-review（K-Dense-AI/scientific-agent-skills）
url: https://github.com/K-Dense-AI/scientific-agent-skills/tree/main/skills/literature-review
pricing: "开源免费（MIT）"
platforms: "Claude Code / Codex / Cursor / Gemini CLI 等支持 Agent Skills 的工具"
trialNote: "npx skills add K-Dense-AI/scientific-agent-skills --skill literature-review"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, literature, paper-writing]
excerpt: "literature-review 是 K-Dense 科研技能库里的文献综述技能：在 PubMed、arXiv、bioRxiv、Semantic Scholar 等数据库做可复现的检索，按系统综述的流程筛选与综合，核验每条引用，输出 Markdown 和 PDF。"
checkedOn: 2026-10-11
sources:
  - https://github.com/K-Dense-AI/scientific-agent-skills/tree/main/skills/literature-review
  - https://github.com/K-Dense-AI/scientific-agent-skills
  - https://github.com/vercel-labs/skills
---

> 本文根据 K-Dense-AI/scientific-agent-skills 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。所在仓库 K-Dense-AI/scientific-agent-skills 在 GitHub 约 4.8 万 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

让大模型「写一篇综述」，它会给出一篇读起来很像样的文章，引用里却可能混着不存在的论文。literature-review 用流程解决这个问题：先检索、后写作，并且逐条核验引用。`description`：使用 PubMed、arXiv、bioRxiv、Semantic Scholar 及其他合适的来源开展系统综述、范围综述和叙述性综述；用于研究综合、可复现的文献检索、筛选、引用核对，或准备 Markdown 和 PDF 格式的综述。它会记录检索覆盖范围、区分「记录」与「研究」，并说明证据的局限；支持为元分析做规划，但**不提供元分析计算引擎**。

内容按综述的环节组织：检索策略（针对学科选合适的数据库、记录检索式和日期）、记录与研究的区分、筛选与纳入、综合、质量与可复现性、写作，以及一份常见陷阱清单。另有一节讲图示和 PRISMA 流程图的报告方式。

目录里的脚本各司其职：`search_databases.py` 检索、`verify_citations.py` 核验引用（通过 DOI 等确认文献真实存在）、`generate_pdf.py` 导出 PDF，还有两个生成示意图的脚本；配套有综述模板、数据库检索策略、引用格式等参考。

## 怎么安装

仓库 README 的安装方式是 skills CLI。这个库有一百七十多个技能，建议用 CLI 文档里的 `--skill` 参数只装需要的：

```bash
npx skills add K-Dense-AI/scientific-agent-skills --skill literature-review
```

也可以把整个仓库克隆到 `~/.agents/skills/scientific-agent-skills`（用户级）或项目的 `.agents/skills/` 下。

仓库整体介绍和其他安装方式，详见本站《Scientific Agent Skills 是什么、怎么安装使用：K-Dense 的科研 Skill 库（生信、化学、数据分析、科研写作）》。

## 怎么用

- 「做一个关于肠道菌群与抑郁症关系的范围综述，近五年文献，记录检索式」。
- 「核验这份参考文献列表，把查不到的条目标出来」。
- 「把筛选过程整理成 PRISMA 流程的数字」。

## 适合谁 / 局限

适合研究生开题、写综述章节，以及需要快速摸清一个领域的科研人员。它能检索的是开放数据库，很多全文在付费墙后面，只能基于摘要判断；数据库对中文文献（如知网收录的期刊）覆盖有限；筛选标准和质量评价需要研究者自己把关。

## 注意事项

- **许可**：MIT。
- **依赖与联网**：需要 Python 3.10 以上和 requests，检索与 DOI 核验要联网；导出 PDF 需要 Pandoc 和 XeLaTeX。
- **可选的密钥**：AI 示意图功能需要 OpenRouter 的 API Key，可选的并行检索命令行需要另行认证；不用这些功能则不需要。
- 声明的工具权限为 Read、Write、Edit、Bash。综述结论仍须由作者对照原文确认。
