---
title: "scientific-visualization skill 是什么、怎么安装使用：K-Dense 的科研绘图 Skill（Matplotlib / Seaborn 出版级图）"
slug: kdense-scientific-visualization-skill
name: scientific-visualization（K-Dense-AI/scientific-agent-skills）
url: https://github.com/K-Dense-AI/scientific-agent-skills/tree/main/skills/scientific-visualization
pricing: "开源免费（MIT）"
platforms: "Claude Code / Codex / Cursor / Gemini CLI 等支持 Agent Skills 的工具"
trialNote: "npx skills add K-Dense-AI/scientific-agent-skills --skill scientific-visualization"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, research-figure, research-data]
excerpt: "scientific-visualization 是 K-Dense 科研技能库里的绘图技能：用 Matplotlib、Seaborn 或 Plotly 制作并审核真实、无障碍、可发表的科研图，覆盖多面板布局、不确定性与缺失数据的呈现、配色对比检查和期刊导出规划。"
checkedOn: 2026-10-11
sources:
  - https://github.com/K-Dense-AI/scientific-agent-skills/tree/main/skills/scientific-visualization
  - https://github.com/K-Dense-AI/scientific-agent-skills
  - https://github.com/vercel-labs/skills
---

> 本文根据 K-Dense-AI/scientific-agent-skills 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。所在仓库 K-Dense-AI/scientific-agent-skills 在 GitHub 约 4.8 万 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

科研图表有两道门槛：一是「诚实」，不能因为好看而扭曲数据；二是满足期刊对尺寸、字体、分辨率和配色的要求。scientific-visualization 两头都管。`description`：使用 Matplotlib、Seaborn 或 Plotly 创建并审核真实、无障碍、可直接发表的科研图；用于图的设计、多面板布局、不确定性与缺失数据的展示、配色与对比度审查、图像元数据校验和期刊导出规划。

开篇的立场是：先保住科学含义，再优化外观。要区分普遍适用的原则和会过时的出版社规定，保留原始数据与变换过程，颜色之外要有冗余编码（比如同时用形状或线型区分），并且**检查实际导出的文件**，而不是相信绘图库的默认值。

「不可商量的护栏」第一条就是：绝不为了让图更有说服力而篡改、隐藏、编造或选择性地增强数据。

工作流从「明确证据和投放目的地」开始，然后是选择诚实的编码方式、把无障碍设计放在前面而不是事后补、用限定作用域的样式来实现。

目录里的资源很实用：三套 Matplotlib 样式文件（通用出版、Nature 风格、演示用）、配色方案、出版社规格档案，以及一组脚本——导出规划、图像导出、元数据检查、调色板审计、样式预览。

## 怎么安装

仓库 README 的安装方式是 skills CLI。这个库有一百七十多个技能，建议用 CLI 文档里的 `--skill` 参数只装需要的：

```bash
npx skills add K-Dense-AI/scientific-agent-skills --skill scientific-visualization
```

也可以把整个仓库克隆到 `~/.agents/skills/scientific-agent-skills`（用户级）或项目的 `.agents/skills/` 下。

仓库整体介绍和其他安装方式，详见本站《Scientific Agent Skills 是什么、怎么安装使用：K-Dense 的科研 Skill 库（生信、化学、数据分析、科研写作）》。

## 怎么用

- 「把这组实验数据画成两行三列的多面板图，带误差线，按单栏宽度导出」。
- 「检查这张图对色觉障碍读者是否友好，换一套配色」。
- 「审核这个 PDF 图的字体和分辨率是否符合投稿要求」。

## 适合谁 / 局限

适合要给论文、学位论文和学术报告出图的研究者。期刊的具体规格经常变，技能把这类信息标为有时效的资料，投稿前仍要看期刊现行的作者指南；它负责画和查，不替你决定「这张图该不该这样呈现数据」之外的科学问题。

## 注意事项

- **许可**：MIT。
- **环境**：技能声明需要 Python 3.11 以上和 uv；自带的命令行工具不联网；用 Plotly 导出静态图需要本机有兼容的 Chrome 或 Chromium。
- **会执行绘图代码并写文件**，声明的工具权限含 Bash。
- 图像处理须遵守期刊关于图像完整性的规定。
