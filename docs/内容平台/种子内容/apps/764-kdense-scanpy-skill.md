---
title: "scanpy skill 是什么、怎么安装使用：让智能体跑单细胞 RNA-seq 分析流程（质控、聚类、UMAP、标记基因）"
slug: kdense-scanpy-skill
name: scanpy（K-Dense-AI/scientific-agent-skills）
url: https://github.com/K-Dense-AI/scientific-agent-skills/tree/main/skills/scanpy
pricing: "开源免费（技能标注 BSD-3-Clause；仓库整体 MIT）"
platforms: "Claude Code / Codex / Cursor / Gemini CLI 等支持 Agent Skills 的工具"
trialNote: "npx skills add K-Dense-AI/scientific-agent-skills --skill scanpy"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, research-data, data-analysis]
excerpt: "scanpy 是 K-Dense 科研技能库里的单细胞分析技能：指导智能体用 Scanpy 完成质控、归一化、高变基因筛选、PCA / UMAP、聚类、标记基因排序和可视化，并支持把 Seurat 等 R 对象转成 h5ad，附一组分步脚本。"
checkedOn: 2026-10-11
sources:
  - https://github.com/K-Dense-AI/scientific-agent-skills/tree/main/skills/scanpy
  - https://github.com/K-Dense-AI/scientific-agent-skills
  - https://github.com/vercel-labs/skills
---

> 本文根据 K-Dense-AI/scientific-agent-skills 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。所在仓库 K-Dense-AI/scientific-agent-skills 在 GitHub 约 4.8 万 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

单细胞转录组分析的标准流程步骤固定，但每一步都有容易用错的地方：拿归一化之后的数据当原始计数、聚类参数随手一填、把探索性的标记基因当成定论。scanpy 技能把这条流程和它的前提条件一起交给智能体。`description`：执行 Scanpy 单细胞 RNA-seq 的质控、归一化、高变基因选择、PCA / UMAP / t-SNE、聚类、探索性的标记基因排序、伪批量数据准备、可视化，以及把 Seurat 或 SingleCellExperiment 的 RDS 文件转换为 h5ad；适用于成熟的探索性单细胞流程，要求明确计数和表达量的来源。scvi-tools 模型和 AnnData 格式细节由配套的其他技能覆盖。

SKILL.md 的要点：

- **版本基线**：写明所针对的 Scanpy 版本和核对日期，并说明这一版要求 Python 3.12 以上。它还坦白了一点：技能里的合成数据测试验证的是数据与接口的约定，不代表生物学上的正确性。
- **安装**：用 `uv` 安装带 `leiden` 附加依赖的版本，脚本里明确选用 igraph 实现的聚类；想复现就把版本钉死。超大数据集可以配合 Dask，需要 GPU 加速则另用 rapids-singlecell。
- **R 对象**：输入是 Seurat 等 R 原生对象时，先用 R 工具转成 `.h5ad`。
- **表示与推断的约定**：这是最长的一节，规定每一步该用哪一层数据（原始计数还是归一化后的表达量），以及哪些结论只能算探索性的。

目录里有二十多个文件：分析模板、细胞类型映射和基因特征的示例配置，标准流程、绘图指南、R 互操作等参考文件，以及查看数据、聚类、找标记基因、批次校正、注释、格式转换、绘图等脚本。

## 怎么安装

仓库 README 的安装方式是 skills CLI。这个库有一百七十多个技能，建议用 CLI 文档里的 `--skill` 参数只装需要的：

```bash
npx skills add K-Dense-AI/scientific-agent-skills --skill scanpy
```

也可以把整个仓库克隆到 `~/.agents/skills/scientific-agent-skills`（用户级）或项目的 `.agents/skills/` 下。

仓库整体介绍和其他安装方式，详见本站《Scientific Agent Skills 是什么、怎么安装使用：K-Dense 的科研 Skill 库（生信、化学、数据分析、科研写作）》。

Scanpy 及其依赖要另外装进你的 Python 环境。

## 怎么用

- 「对 `pbmc.h5ad` 做标准流程：质控、归一化、选高变基因、降维、Leiden 聚类，画 UMAP」。
- 「先检查这个文件里存的是原始计数还是处理过的数据，再决定从哪一步开始」。
- 「把同事给的 Seurat 的 `.rds` 文件转成 h5ad」。

## 适合谁 / 局限

适合刚接触单细胞分析的生物学研究生，以及想把重复流程自动化的生信工程师。局限：细胞类型注释、差异分析结论这类需要生物学判断的环节，它只能给出探索性的结果，发表前必须由懂这个体系的人复核；数据大时对内存要求高；参数没有放之四海皆准的取值，需要结合数据调整。

## 注意事项

- **许可**：该技能标注 BSD-3-Clause，所在仓库整体为 MIT。
- **在本机运行 Python 脚本**，`compatibility` 写明本地分析不需要凭据和网络；R 对象转换需要另装 R。
- 人类样本的测序数据可能受伦理与数据管理规定约束，交给云端模型处理前确认合规。
