---
title: "rdkit skill 是什么、怎么安装使用：让 Claude Code 用 RDKit 做化学信息学（SMILES、描述符、子结构搜索）"
slug: kdense-rdkit-skill
name: rdkit（K-Dense-AI/scientific-agent-skills）
url: https://github.com/K-Dense-AI/scientific-agent-skills/tree/main/skills/rdkit
pricing: "开源免费（技能标注 BSD-3-Clause；仓库整体 MIT）"
platforms: "Claude Code / Codex / Cursor / Gemini CLI 等支持 Agent Skills 的工具"
trialNote: "npx skills add K-Dense-AI/scientific-agent-skills --skill rdkit"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, research-data, coding]
excerpt: "rdkit 是 K-Dense 科研技能库里的化学信息学技能：指导智能体用 RDKit 解析 SMILES / SDF、计算分子量与 LogP 等描述符、生成指纹、做子结构与相似性搜索、生成 2D / 3D 构象和处理反应，附三个可直接运行的脚本。"
checkedOn: 2026-10-11
sources:
  - https://github.com/K-Dense-AI/scientific-agent-skills/tree/main/skills/rdkit
  - https://github.com/K-Dense-AI/scientific-agent-skills
  - https://github.com/vercel-labs/skills
---

> 本文根据 K-Dense-AI/scientific-agent-skills 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。所在仓库 K-Dense-AI/scientific-agent-skills 在 GitHub 约 4.8 万 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

RDKit 是药物化学和计算化学里最常用的开源工具库，接口很多、坑也不少。这个技能让智能体按经过核对的方式使用它。`description`：用于精细分子操控的化学信息学工具包——SMILES / SDF 解析、描述符（分子量、LogP、极性表面积）、指纹、子结构搜索、2D / 3D 生成、相似性、反应；标准流程想要更简单的接口可以用 datamol（RDKit 的封装），需要高级控制、自定义净化或专门算法时用 rdkit。

SKILL.md 的结构：

- **概述与版本基线**：技能写明了它核对所依据的 RDKit 稳定版本和核对日期，并解释了包名的变迁——现在 PyPI 上的包名是 `rdkit`，`rdkit-pypi` 是旧名，只在维护老环境时才该出现。
- **安装**：往现有环境里装用 `uv`；需要可复现的化学环境、尤其是和其他编译型科学计算包混用时，仍然推荐上游建议的 conda-forge；不要把两种来源的 RDKit 装进同一个环境。
- **核心能力**：读写分子结构、描述符计算、指纹、子结构搜索、化学反应、坐标生成和分子可视化。
- **保持化学含义**：一节专门提醒处理分子时不要破坏其化学意义。
- **常见陷阱**。

目录里有十个文件：接口参考、核心能力、描述符参考、SMARTS 模式、工作流与最佳实践等参考文件，以及三个脚本——计算分子性质、相似性搜索、子结构过滤。frontmatter 的 `compatibility` 说明：装好之后不需要任何凭据，也不需要联网。

## 怎么安装

仓库 README 的安装方式是 skills CLI。这个库有一百七十多个技能，建议用 CLI 文档里的 `--skill` 参数只装需要的：

```bash
npx skills add K-Dense-AI/scientific-agent-skills --skill rdkit
```

也可以把整个仓库克隆到 `~/.agents/skills/scientific-agent-skills`（用户级）或项目的 `.agents/skills/` 下。

仓库整体介绍和其他安装方式，详见本站《Scientific Agent Skills 是什么、怎么安装使用：K-Dense 的科研 Skill 库（生信、化学、数据分析、科研写作）》。

RDKit 本身要另外装进你的 Python 环境，技能只是使用说明和脚本。

## 怎么用

- 「读入 `compounds.sdf`，算出每个分子的分子量、LogP 和极性表面积，存成 CSV」。
- 「在这批分子里找出含磺酰胺基团的，用 SMARTS 匹配」。
- 「以这个 SMILES 为参照，按 Tanimoto 相似度给库里的分子排序，取前 20 个」。

## 适合谁 / 局限

适合做药物发现、化学数据清洗的研究生和工程师，尤其是会化学但不常写代码的人。局限：它保证的是工具用法正确，化学结论仍然要懂行的人判断；计算出的性质是经验模型的估计值，不能替代实验；大规模的库筛选要考虑运行时间和内存。

## 注意事项

- **许可**：该技能的 frontmatter 标注 BSD-3-Clause（与 RDKit 本身的许可一致），所在仓库整体为 MIT。
- **会在本机执行 Python 脚本**并读写你指定的数据文件；`allowed-tools` 为读、写、编辑和 Bash。
- 未公开的化合物结构会进入模型上下文，涉及保密项目时注意所用模型服务的数据条款。
