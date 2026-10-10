---
title: "triage-nda skill 是什么、怎么安装使用：Anthropic 法务插件里的保密协议快速分诊 Skill（绿 / 黄 / 红）"
slug: anthropic-legal-triage-nda-skill
name: triage-nda（anthropics/knowledge-work-plugins）
url: https://github.com/anthropics/knowledge-work-plugins/tree/main/legal/skills/triage-nda
pricing: "开源免费（Apache-2.0）"
platforms: "Claude Cowork / Claude Code"
trialNote: "`claude plugin marketplace add anthropics/knowledge-work-plugins` 然后 `claude plugin install legal@knowledge-work-plugins`"
products: [claude]
models: [claude-llm]
topics: [agent-skills, legal, office]
excerpt: "triage-nda 是 Anthropic knowledge-work-plugins 法务插件里的保密协议分诊技能：对收到的 NDA 做快速筛查，分为绿色（标准审批）、黄色（法务复核）、红色（完整法律审查）三档并给出流转建议。"
checkedOn: 2026-10-11
sources:
  - https://github.com/anthropics/knowledge-work-plugins/tree/main/legal/skills/triage-nda
  - https://github.com/anthropics/knowledge-work-plugins
  - https://claude.com/plugins/
---

> 本文根据 anthropics/knowledge-work-plugins 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。所在仓库 anthropics/knowledge-work-plugins 在 GitHub 约 2.9 万 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

销售和商务每周都会收到对方发来的保密协议（NDA），绝大多数是标准文本，没必要每份都排队等法务细看——但偶尔有一份里藏着竞业限制或招揽禁止条款。triage-nda 做的是「预筛」。`description`：对收到的 NDA 做快速分诊，分类为 GREEN（标准审批）、YELLOW（法务复核）或 RED（完整法律审查）；适用于销售或商务拿到新 NDA 时、筛查其中是否嵌入了不招揽、竞业限制条款或缺少必要的例外约定，或判断能否按标准授权直接签署时。

和同插件的其他技能一样，它声明自己协助法律工作流但不提供法律意见，分析应由合格的法律专业人士复核。

流程六步：接收 NDA → 加载你们的 NDA 手册 → 按筛查标准快速过一遍 → 分类 → 生成分诊报告 → 给出流转建议。技能里还列了几类常见问题和对应的标准立场，例如：保密信息的定义过宽、缺少「独立开发」例外、夹带员工不招揽条款、宽泛的「残留记忆」条款、无限期的保密义务。

## 怎么安装

`triage-nda` 属于 anthropics/knowledge-work-plugins 的 `legal` 插件，随插件一起安装。Claude Code 里（命令来自仓库 README）：

```bash
claude plugin marketplace add anthropics/knowledge-work-plugins
claude plugin install legal@knowledge-work-plugins
```

Claude Cowork 用户在 claude.com/plugins 页面安装同名插件。装好后技能会在相关场景自动触发，也可以用斜杠命令 `/legal:triage-nda` 手动调用。

仓库整体介绍和其他安装方式，详见本站《knowledge-work-plugins 是什么、怎么安装：Anthropic 开源的 11 个岗位插件（销售 / 法务 / 财务 / 数据）》。

## 怎么用

- `/legal:triage-nda` 后附上文件：「这是客户发来的双向 NDA，能直接签吗？」
- 「这份被判成黄色，把需要法务看的三处单独列出来」。
- 批量场景：「这五份 NDA 逐个分诊，汇总成一张表」。

这个技能只有一份 SKILL.md。

## 适合谁 / 局限

适合 NDA 数量多、法务人手紧的公司，让业务人员先自助筛一轮，把法务的时间留给黄色和红色的那几份。分诊标准默认按通用的商业惯例，没有加载你们自己的手册时，「绿色」不代表符合你公司的政策；条款用语基于英美法实践，中文合同和中国法语境下需要调整标准。

## 注意事项

- **许可**：Apache-2.0。
- **绿色不等于免审**：是否允许业务人员凭绿色结论直接签署，取决于你们公司的授权制度。
- **保密**：NDA 本身可能包含对方信息，上传前确认合规。
- 不执行脚本。
