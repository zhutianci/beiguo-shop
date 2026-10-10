---
title: "Scientific Agent Skills 是什么、怎么安装使用：K-Dense 的科研 Skill 库（生信、化学、数据分析、科研写作）"
slug: scientific-agent-skills-k-dense
name: Scientific Agent Skills（K-Dense-AI）
url: https://github.com/K-Dense-AI/scientific-agent-skills
pricing: 开源免费（MIT；各技能另有自己的许可证字段）
platforms: Claude Code / Codex / Cursor / Gemini CLI / Google Antigravity 等支持 Agent Skills 的工具
trialNote: "npx skills add K-Dense-AI/scientific-agent-skills"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, research-data, data-analysis]
excerpt: "Scientific Agent Skills 是 K-Dense 维护的科研技能库，README 称共 177 个技能，覆盖生物信息、化学与药物发现、医学影像、机器学习、数据可视化和科研写作，并整理了上百个科学数据库的查询方法。原名 Claude Scientific Skills。"
checkedOn: 2026-10-10
sources:
  - https://github.com/K-Dense-AI/scientific-agent-skills
  - https://github.com/K-Dense-AI/scientific-agent-skills/blob/main/docs/security-report.md
  - https://github.com/vercel-labs/skills
  - https://agentskills.io/home
---

> 本文根据 K-Dense-AI/scientific-agent-skills 仓库 README 与 agentskills.io 整理，资料核对于 2026-10-10。技能数量随版本变化，以仓库 README 为准。

## 是什么

Scientific Agent Skills 是 K-Dense 公司维护的一套面向科研工作的 Skill 库。智能体本来就能调用任意 Python 包，但面对 Scanpy、RDKit 这类专业库，常常记错参数、漏掉质控步骤，或者不清楚某个数据库该查哪个接口。这个仓库把每个专业库、数据源或分析流程写成一个技能：用途、推荐流程、该领域的惯例和校验步骤都写清楚，让智能体照着做。

仓库原名 Claude Scientific Skills，README 顶部说明现已改名，技能不变，改为面向所有支持 Agent Skills 开放标准的工具。README 称当前共有 177 个技能。截至 2026-10-10，GitHub 显示该仓库约 4.8 万 Star、4338 Fork，最近一次推送在 2026-10-05。

## 包含哪些 Skill

README 按领域分类（一个技能可能同时属于多个类别），主要有：

- **生物信息与基因组学**：序列分析、单细胞 RNA-seq（Scanpy、scvi-tools）、差异表达（PyDESeq2）、CRISPR 筛选、引物设计、系统发育等；
- **化学信息学与药物发现**：RDKit、Datamol、DeepChem、分子对接（DiffDock）、分子动力学（OpenMM + MDAnalysis）；
- **临床研究、医学影像与数字病理**：pydicom、PathML、药代药效建模等，README 多处标注「仅供研究，非临床用途」；
- **机器学习、材料与物理、工程仿真**：scikit-learn、PyTorch Lightning、pymatgen、Qiskit、QuTiP 等；
- **数据分析与可视化**：统计分析、GeoPandas、科研图表；
- **科学数据库**：`database-lookup` 技能整理了 PubChem、ChEMBL、UniProt、ClinicalTrials.gov 等数十个数据库的接口选择与分页方法，加上其他专用技能，README 称合计覆盖 100 多个数据库；
- **科研写作与交流**：文献综述、带证据追溯的写作、同行评审、基金申请、海报与幻灯片、Mermaid 图；
- **实验室平台集成**：Benchling、DNAnexus、Opentrons、Protocols.io 等。

## 怎么安装

**npx skills（README 的第一种方式）**：

```bash
npx skills add K-Dense-AI/scientific-agent-skills
```

README 说明它适用于 Claude Code、Codex、Gemini CLI、Google Antigravity、Cursor 等。

**GitHub CLI（v2.90.0 及以上）**：

```bash
# Install a specific skill directly
gh skill install K-Dense-AI/scientific-agent-skills scanpy

# Target a specific agent host
gh skill install K-Dense-AI/scientific-agent-skills --agent claude-code
```

可以加 `--pin v2.71.0` 这样的参数固定到某个发布版本，便于复现。

**手动克隆**（适用于按 `.agents/skills/` 约定读取技能的工具）：`git clone https://github.com/K-Dense-AI/scientific-agent-skills.git ~/.agents/skills/scientific-agent-skills`。

前置条件：README 要求安装 `uv` 作为 Python 包管理器；装技能文件并不会装好各技能依赖的科学计算包，需要按每个技能的说明另行安装。系统方面支持 macOS、Linux 和 Windows 的 WSL2。

## 怎么用

装好后，用自然语言描述完整的分析目标，智能体会自行挑选相关技能；也可以在提示里直接点名技能。README 给的药物发现示例是这样开头的：`Use available skills you have access to whenever possible. Query ChEMBL for EGFR inhibitors (IC50 < 50nM), analyze structure-activity relationships with RDKit...`，一段话里串起了数据库查询、构效分析、虚拟筛选、文献检索和报告生成。

实际使用时建议：

- 在提示里写上「尽量使用已安装的技能」，并说明数据在哪、想要什么输出；
- 每个分析流程用独立的 Python 环境——README 指出不同技能可能要求不同的 Python 版本或互相冲突的包版本；
- 只装和自己方向相关的那部分技能，技能目录越精简，匹配越准。

## 适合谁 / 不适合谁

**适合：**
- 生物信息、计算化学、数据科学方向的研究生和科研人员，已经在用编程智能体跑分析；
- 需要频繁查询多个公共科学数据库、不想每次翻接口文档的人；
- 想了解「一个领域的操作规范如何写成技能」的开发者。

**不适合：**
- 没有 Python 和命令行基础的用户——技能提供的是指导，环境和依赖要自己配；
- 希望直接拿结果做临床决策的人——这些技能定位是研究辅助，分析结论必须由具备资质的人审核；
- 只在 claude.ai 网页版里使用的人——README 的安装方式都面向本地工具。

## 注意事项

- **许可证**：仓库 LICENSE 为 MIT。但 README 强调每个技能在自己的 `SKILL.md` 里有独立的 `license` 字段，可能与仓库不同；技能所封装的第三方库和数据库也各有许可与使用条款，商用前逐个确认。
- **维护状态**：持续发版，最近一次推送 2026-10-05。
- **安全提醒**：README 专门有一节安全声明——技能可以让智能体运行任意代码、安装软件包、发起网络请求、修改文件。仓库现在包含不少社区贡献，维护方会做审查并定期扫描（结果公开在 `docs/security-report.md`），但不保证逐一彻查。官方建议：**不要一次全装**，只装需要的；安装前读 `SKILL.md`；必要时自己再扫描一遍。
- **联网与密钥**：许多技能会访问外部数据库或云平台（如 Benchling、NCBI、Exa 等），部分需要注册账号或 API Key；涉及未发表数据或受试者数据时，先确认数据能否离开本机。
- **兼容性**：Windows 需通过 WSL2 使用；不同工具对技能可选元数据的处理不一致，安装路径以所用工具的官方文档为准。
- 科研结论的责任在研究者本人，智能体给出的分析和引用都需要人工核对。
