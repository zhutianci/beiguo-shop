---
title: "citation-management skill 是什么、怎么安装使用：让智能体查文献、核对引用并生成 BibTeX"
slug: kdense-citation-management-skill
name: citation-management（K-Dense-AI/scientific-agent-skills）
url: https://github.com/K-Dense-AI/scientific-agent-skills/tree/main/skills/citation-management
pricing: "开源免费（MIT）"
platforms: "Claude Code / Codex / Cursor / Gemini CLI 等支持 Agent Skills 的工具"
trialNote: "npx skills add K-Dense-AI/scientific-agent-skills --skill citation-management"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, paper-writing, literature]
excerpt: "citation-management 是 K-Dense 科研技能库里的引用管理技能：检索 OpenAlex、PubMed 和 Google Scholar，从 CrossRef 等来源提取准确的元数据，把 DOI、PMID、arXiv 编号转成规范的 BibTeX，并逐条验证已有引用是否属实。"
checkedOn: 2026-10-11
sources:
  - https://github.com/K-Dense-AI/scientific-agent-skills/tree/main/skills/citation-management
  - https://github.com/K-Dense-AI/scientific-agent-skills
  - https://github.com/vercel-labs/skills
---

> 本文根据 K-Dense-AI/scientific-agent-skills 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。所在仓库 K-Dense-AI/scientific-agent-skills 在 GitHub 约 4.8 万 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

让大模型写论文，最危险的不是文笔，而是参考文献：作者、年份、期刊看着像模像样，其实根本不存在。citation-management 的思路是不让模型凭记忆写引用，一切以数据库查到的为准。`description`：面向学术研究的全面引用管理——检索 OpenAlex、PubMed 和 Google Scholar，提取准确的元数据，验证引用，生成格式规范的 BibTeX 条目；在需要找论文、核实引用信息、把 DOI 转成 BibTeX 或确保参考文献准确时使用。

核心流程分几个阶段：

1. **发现与检索**：按主题或线索在学术数据库里找论文，可以找某个领域的高被引文献。
2. **元数据提取**：通过 DOI、PMID 或 arXiv 编号，从 CrossRef、PubMed、arXiv 等来源取回作者、标题、期刊、年份等完整信息；必要时再从网页补全。
3. **BibTeX 格式化**：生成并清理条目，统一格式，检查重复。
4. **引用验证**：核对已有的参考文献列表是否与真实出版物一致。
5. **融入写作流程**：与同库的 `literature-review`、`scientific-writing`、`venue-templates` 配合。

目录里有二十多个文件：BibTeX 模板和引用检查清单；接口约定、最佳实践、BibTeX 格式、引用验证、Google Scholar 与 PubMed 检索、检索策略等参考文件；以及 DOI 转 BibTeX、提取元数据等 Python 脚本。

frontmatter 的 `compatibility` 把依赖交代得很清楚：需要 Python 3.9 以上和 `requests`，Google Scholar 检索另需 `scholarly`；需要访问 OpenAlex、CrossRef、NCBI、doi.org、arXiv、DataCite 这些站点。四个环境变量都是可选的：NCBI 的邮箱和密钥、OpenAlex 的邮箱和密钥，用来表明身份或提高调用额度。SKILL.md 另有一节说明这些凭据会被发送到哪里。

## 怎么安装

仓库 README 的安装方式是 skills CLI。这个库有一百七十多个技能，建议用 CLI 文档里的 `--skill` 参数只装需要的：

```bash
npx skills add K-Dense-AI/scientific-agent-skills --skill citation-management
```

也可以把整个仓库克隆到 `~/.agents/skills/scientific-agent-skills`（用户级）或项目的 `.agents/skills/` 下。

仓库整体介绍和其他安装方式，详见本站《Scientific Agent Skills 是什么、怎么安装使用：K-Dense 的科研 Skill 库（生信、化学、数据分析、科研写作）》。

## 怎么用

- 「把这十个 DOI 转成 BibTeX，键名用『第一作者姓 + 年份』」。
- 「核对 `refs.bib` 里的每一条，标出查不到的、信息对不上的和重复的」。
- 「找近五年关于 RAG 评测的高被引论文，给我带 DOI 的清单」。

## 适合谁 / 局限

适合写论文、学位论文和综述的研究者，尤其适合拿来检查由 AI 起草的稿件里的参考文献。局限：只能验证文献是否存在、信息是否一致，判断不了「这篇文献是否真的支持你那句话」，这一步必须自己读原文；Google Scholar 没有官方接口，检索不稳定；中文数据库（如知网）不在覆盖范围内。

## 注意事项

- **许可**：MIT。
- **会联网调用多个学术数据库的公开接口**，并在本机运行 Python 脚本；请遵守各数据库的使用频率要求。
- 密钥只通过环境变量提供，不要写进稿件仓库。
