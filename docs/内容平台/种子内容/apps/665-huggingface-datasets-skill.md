---
title: "huggingface-datasets 是什么、怎么安装使用：让智能体查询 Hugging Face 数据集内容的官方 Skill"
slug: huggingface-datasets-skill
name: huggingface-datasets（huggingface/skills）
url: https://github.com/huggingface/skills/tree/main/skills/huggingface-datasets
pricing: "开源免费（Apache-2.0）；云端任务按 Hugging Face 计费"
platforms: "Claude Code / Codex / Gemini CLI / Cursor"
trialNote: "hf skills add huggingface-datasets"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, data-analysis, coding]
excerpt: "huggingface-datasets 是 Hugging Face 官方的数据集 Skill：通过 Dataset Viewer API 做只读查询——获取子集与划分信息、分页取行、全文搜索、按条件筛选、拿 Parquet 下载地址、读取大小与统计。"
checkedOn: 2026-10-11
sources:
  - https://github.com/huggingface/skills/tree/main/skills/huggingface-datasets
  - https://github.com/huggingface/skills
  - https://huggingface.co/docs/hub/agents-cli
---

> 本文根据 huggingface/skills 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。所在仓库 huggingface/skills 在 GitHub 约 1.1 万 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

想知道 Hub 上某个数据集长什么样，传统做法是把它整个下载下来再用代码打开——几十个 GB 的数据集就为了看前几行。Hugging Face 其实提供了 Dataset Viewer API，可以在线预览和查询。huggingface-datasets 技能教智能体用这套接口。`description`：用于 Hugging Face Dataset Viewer API 的各类工作流——获取子集（subset）与划分（split）的元数据、分页读取行、搜索文本、应用筛选、下载 Parquet 地址，以及读取大小或统计信息。

SKILL.md 把它定位为执行**只读**的 Dataset Viewer API 调用，用于数据集的探索和提取。核心流程是一步步缩小范围：

1. 可选地先确认数据集可用；
2. 查出有哪些配置和划分；
3. 预览前若干行；
4. 需要时分页取更多行、做全文搜索或按条件筛选；
5. 要全量数据时获取 Parquet 文件地址；
6. 读取数据集的大小和各列统计。

后面还有两节：创建和上传数据集的做法，以及如何处理「智能体轨迹」类数据。

## 怎么安装

按仓库 README，Claude Code 先登记市场并安装基础的 CLI 技能，其余技能再用 `hf` 命令行添加：

```text
/plugin marketplace add huggingface/skills
/plugin install hf-cli@huggingface/skills
```

```bash
hf skills add huggingface-datasets
```

Codex 的做法是把仓库 `skills/` 下需要的文件夹复制或软链接到 `.agents/skills`；Gemini CLI 用 `gemini extensions install https://github.com/huggingface/skills.git --consent`。

仓库整体介绍和其他安装方式，详见本站《huggingface/skills 是什么、怎么安装：Hugging Face 官方 Agent Skills（hf-cli、模型训练、数据集、Spaces、Gradio）》。

## 怎么用

- 「看看 `stanfordnlp/imdb` 有哪些划分，各有多少行，给我看训练集的前 5 条」。
- 「在这个数据集里搜索包含 refund 的样本，统计大概有多少」。
- 「我想挑一个中文客服对话数据集，帮我对比这三个的字段和规模」。

这个技能只有一份 SKILL.md。

## 适合谁 / 局限

适合做数据选型、训练前检查数据格式的算法工程师，以及只想快速了解某个数据集内容的人。Dataset Viewer 并非对所有数据集都可用——过大、格式特殊或未处理完成的数据集可能无法预览；它查询的是 Hub 上的公开接口，本地数据文件的分析不在范围内。

## 注意事项

- **许可**：Apache-2.0。
- **会联网**：调用 Hugging Face 的公开 API；访问私有或受限数据集需要访问令牌。
- **数据许可**：数据集各有自己的许可证和使用限制，用于训练或商用前查看数据集卡片。
- 查询结果只是样本，判断数据质量前多看几页、看统计分布。
