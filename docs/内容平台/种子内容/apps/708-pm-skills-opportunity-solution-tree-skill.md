---
title: "opportunity-solution-tree skill 是什么、怎么安装使用：PM Skills 里的机会解决方案树 Skill（OST）"
slug: pm-skills-opportunity-solution-tree-skill
name: opportunity-solution-tree（phuryn/pm-skills）
url: https://github.com/phuryn/pm-skills/tree/main/pm-product-discovery/skills/opportunity-solution-tree
pricing: "开源免费（MIT）"
platforms: "Claude Code / Claude Cowork / Codex CLI；Gemini CLI、Cursor 等仅技能部分"
trialNote: "`claude plugin marketplace add phuryn/pm-skills` 然后 `claude plugin install pm-product-discovery@pm-skills`"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, product-design]
excerpt: "opportunity-solution-tree 是 phuryn/pm-skills 里的产品探索技能：按 Teresa Torres 的方法，把一个期望的业务成果依次拆成用户机会、可能的解决方案和验证实验，画成一棵树来决定下一步做什么。"
checkedOn: 2026-10-11
sources:
  - https://github.com/phuryn/pm-skills/tree/main/pm-product-discovery/skills/opportunity-solution-tree
  - https://github.com/phuryn/pm-skills
  - https://code.claude.com/docs/en/discover-plugins
---

> 本文根据 phuryn/pm-skills 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。所在仓库 phuryn/pm-skills 在 GitHub 约 2.7 万 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

产品团队常见的病是「功能工厂」：需求一条条做，却说不清每个功能在服务哪个目标。机会解决方案树（Opportunity Solution Tree，简称 OST）是 Teresa Torres 在 Continuous Discovery Habits 一书里提出的框架，用一张树状图把目标和手段连起来。opportunity-solution-tree 技能帮你搭这棵树。`description`：构建机会解决方案树来组织产品探索——把一个期望的成果映射到机会、解决方案和实验；基于 Teresa Torres 的 Continuous Discovery Habits；在梳理探索工作、把机会对应到方案，或决定下一步做什么时使用。

树有四层：

1. **成果**（Outcome）：一个可衡量的业务或产品结果，位于树根；
2. **机会**（Opportunities）：用户的需求、痛点和愿望——从用户的角度描述，而不是功能；
3. **解决方案**（Solutions）：针对每个机会的多个候选方案；
4. **实验**（Experiments）：验证方案背后假设的小测试。

技能说明里称它是现代产品探索的主干，作用是防止团队一上来就跳到方案。使用时要先提供输入——期望的成果以及已有的用户研究材料，然后按流程一层层往下拆，每个机会下至少比较几个方案，而不是只押一个。

## 怎么安装

`opportunity-solution-tree` 属于 phuryn/pm-skills 市场里的 `pm-product-discovery` 插件。Claude Code 里（命令格式来自仓库 README）：

```bash
claude plugin marketplace add phuryn/pm-skills
claude plugin install pm-product-discovery@pm-skills
```

同一个插件里的其他技能和斜杠命令会一起装上。其他支持 Agent Skills 的工具，可以把仓库里的 `pm-product-discovery/skills/opportunity-solution-tree` 文件夹复制到对应的技能目录。

仓库整体介绍和其他安装方式，详见本站《PM Skills 是什么、怎么安装使用：产品经理 Skill 市场（需求探索、PRD、路线图、上市计划）》。

## 怎么用

- 「我们的目标是把新用户七日留存提高，基于这 8 份访谈纪要画一棵机会解决方案树」。
- 「『用户找不到上次编辑的文档』这个机会，给我三个不同方向的方案和对应的验证实验」。
- 同插件里还有识别假设、设计实验、给假设排序等技能，可以沿着树继续往下做。

这个技能只有一份 SKILL.md。

## 适合谁 / 局限

适合实践持续探索的产品三人组（产品、设计、技术负责人）和想摆脱「接需求—排期」模式的团队。树的质量取决于机会是否来自真实的用户研究，没有访谈材料时它只能编出看似合理的机会，这一点要警惕；它输出的是文字结构，要可视化得再用画图工具。

## 注意事项

- **许可**：MIT。
- **不执行脚本、不联网**。
- 树是活的文档，随着新的访谈和实验结果持续更新，而不是画一次就归档。
