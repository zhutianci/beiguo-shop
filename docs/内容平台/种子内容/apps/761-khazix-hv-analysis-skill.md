---
title: "hv-analysis（横纵分析法）skill 是什么、怎么安装使用：让智能体联网做一份深度研究报告并导出 PDF"
slug: khazix-hv-analysis-skill
name: hv-analysis（KKKKhazix/khazix-skills）
url: https://github.com/KKKKhazix/khazix-skills/tree/main/hv-analysis
pricing: "开源免费（MIT）"
platforms: "Claude Code / Codex / Cursor / Kimi Code / CodeBuddy 等支持 Agent Skills 的工具"
trialNote: "帮我安装这个 skill：https://github.com/KKKKhazix/khazix-skills/tree/main/hv-analysis"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, office, data-analysis]
excerpt: "hv-analysis 是数字生命卡兹克开源的深度研究技能：用「纵轴追历史、横轴比同类」的横纵分析法研究一个产品、公司、概念或技术，先并行联网搜集资料，再写纵向、横向和交汇洞察三部分，最后转成排版好的 PDF。"
checkedOn: 2026-10-11
sources:
  - https://github.com/KKKKhazix/khazix-skills/tree/main/hv-analysis
  - https://github.com/KKKKhazix/khazix-skills
---

> 本文根据 KKKKhazix/khazix-skills 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。所在仓库 KKKKhazix/khazix-skills 在 GitHub 约 2.1 万 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

「帮我研究一下这家公司」这类请求，模型很容易给出一篇面面俱到却没有判断的概述。hv-analysis 给研究定了一个固定的骨架。`description`（原文是中文）：横纵分析法深度研究技能，由数字生命卡兹克提出；用户想系统性研究一个产品、公司、概念、技术或人物时使用。核心是双轴：纵轴追踪研究对象从诞生到当下的完整历程，以叙事的方式呈现；横轴在当下这个时间截面上与竞品或同类做系统对比；最后把两条轴交叉，产出洞察。简单的名词解释不用它。

流程五步：

1. **联网收集信息**。SKILL.md 强调方法的质量完全取决于信息，必须联网搜索、不能只靠已有知识。建议用子智能体并行：一个查纵向信息（起源、创始人、关键事件、版本、融资、转向），一个查横向信息（竞品、口碑、评测、份额），复杂对象再加一个补充。来源优先级是官方一手资料优于媒体原创，优于转载；学术类对象要求查 arXiv。之后做一次信息充分性自检。
2. **纵向分析**，报告的主体。
3. **横向分析**，先判断竞品情况，再按维度对比。
4. **横纵交汇洞察**，要求给出新的判断。
5. **生成 PDF**：先写成 Markdown，再用技能自带的 `scripts/md_to_pdf.py`（基于 WeasyPrint）转换。

篇幅要求不低：纵向 6000 到 15000 字，横向 3000 到 10000 字，交汇 1500 到 3000 字，全文一万到三万字。还有一节写作风格和一份质检清单，要求「用人话写」。

## 怎么安装

这个库没有安装器，README 的做法是把技能目录的链接直接交给智能体，让它自己下载放好。在 Claude Code、Codex 等工具里说：

```text
帮我安装这个 skill：https://github.com/KKKKhazix/khazix-skills/tree/main/hv-analysis
```

也可以手动把仓库里的 `hv-analysis` 文件夹复制到 `~/.claude/skills/`（Claude Code）或所用工具的技能目录。

仓库整体介绍和其他安装方式，详见本站《khazix-skills 是什么、怎么安装使用：数字生命卡兹克的 Skill 合集（leader、neat-freak 洁癖、横纵分析法）》。

PDF 转换需要 Python 环境里装好 `weasyprint` 和 `markdown` 两个包。

## 怎么用

- 「用横纵分析法研究一下 Cursor」。
- 「帮我摸清楚向量数据库这个赛道，重点看头部几家的差异」。
- 「研究一下这家公司，我下周要去面试，重点关注它最近一年的战略变化」。

说明研究动机和关注点，报告的侧重会更贴合。

## 适合谁 / 局限

适合做行业研究、竞品分析、投资和求职前调研的人。局限：报告的可靠性取决于搜到的资料，时间、数字和引述要自己抽查，不能直接当作事实引用；一次研究会派多个子智能体、读大量网页，用量和耗时都不小；研究对象是个人时，只应基于公开信息，并注意表述分寸。

## 注意事项

- **许可**：MIT。
- **会大量联网检索**，并在本机运行 Python 脚本生成 PDF。
- 转换脚本的示例命令里作者一栏写的是「数字生命卡兹克」，对外使用时用 `--author` 参数换成自己的署名。
- 报告是 AI 整理的二手研究，引用和发布前请核对来源。
