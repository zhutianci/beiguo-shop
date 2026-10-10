---
title: "PM Skills 是什么、怎么安装使用：产品经理 Skill 市场（需求探索、PRD、路线图、上市计划）"
slug: pm-skills-product-management
name: PM Skills Marketplace（phuryn/pm-skills）
url: https://github.com/phuryn/pm-skills
pricing: 开源免费（MIT）
platforms: Claude Code / Claude Cowork / Codex CLI；Gemini CLI、OpenCode、Cursor、Kiro 仅技能部分
trialNote: "`claude plugin marketplace add phuryn/pm-skills` 然后 `claude plugin install pm-toolkit@pm-skills`"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, product-design, marketing]
excerpt: "PM Skills 是 Paweł Huryn 整理的产品管理 Skill 市场：README 称含 69 个技能、42 条串联工作流，分成 9 个插件，覆盖需求探索、产品战略、PRD 与路线图、市场调研、数据分析和上市计划。面向 Claude Code 与 Cowork。"
checkedOn: 2026-10-10
sources:
  - https://github.com/phuryn/pm-skills
  - https://code.claude.com/docs/en/discover-plugins
  - https://code.claude.com/docs/en/skills
  - https://agentskills.io/home
---

> 本文根据 phuryn/pm-skills 仓库 README 与 Claude Code 官方文档整理，资料核对于 2026-10-10。技能和命令数量随版本变化，以仓库 README 为准。

## 是什么

PM Skills Marketplace 是一个面向产品经理的 Skill 市场，由 The Product Compass 的作者 Paweł Huryn 整理。它的出发点是：通用的 AI 能给你一段像模像样的文字，但产品决策需要的是结构——先列假设、再排优先级、再设计验证实验。仓库把产品管理里成熟的方法论（README 列出的来源有 Teresa Torres 的持续探索、Marty Cagan 的产品方法、Alberto Savoia 的预型验证等）各写成一个技能，让智能体一步步带着你走完框架，而不是直接吐一份文档。

它用了三层结构：**技能**是最小单元，提供某个任务的知识和流程；**命令**是用户主动触发的工作流，把几个技能串起来；**插件**把同一领域的技能和命令打包。README 称目前共 69 个技能、42 条工作流、9 个插件。截至 2026-10-10，GitHub 显示该仓库约 2.7 万 Star、2843 Fork，最近一次推送在 2026-10-09。

## 包含哪些 Skill

README 列出的 9 个插件：

- **pm-product-discovery**（13 个技能、5 条命令）：新老产品的创意发散、识别高风险假设、假设与功能优先级、机会解决方案树、用户访谈提纲与访谈纪要整理；
- **pm-product-strategy**（12 个技能、5 条命令）：愿景、商业模式、定价、竞争格局；
- **pm-execution**（16 个技能、11 条命令）：PRD、OKR、路线图、迭代计划、复盘、发布说明、干系人管理；
- **pm-market-research**（7 个技能、3 条命令）：用户画像、市场细分、用户旅程、市场规模估算、竞品分析；
- **pm-data-analytics**（3 个技能、3 条命令）：生成 SQL、同期群分析、A/B 测试结果分析；
- **pm-go-to-market**（6 个技能、3 条命令）：切入市场、理想客户画像、信息传达、增长循环、竞品对战卡；
- **pm-marketing-growth**（5 个技能、2 条命令）：营销创意、定位、价值主张、命名、北极星指标；
- **pm-toolkit**（4 个技能、5 条命令）：简历评审、文档校对等通用工具；
- **pm-ai-shipping**：针对用 AI 快速搭出来的应用，做文档补全、正确性与安全检查、测试覆盖梳理，汇总成上线前的材料包。

## 怎么安装

**Claude Cowork（README 推荐给非开发者）**：打开左下角 Customize → Browse plugins → Personal → 「+」→ Add marketplace from GitHub，输入 `phuryn/pm-skills`，9 个插件会一起装上。

**Claude Code（命令行）**：

```bash
# Step 1: Add the marketplace
claude plugin marketplace add phuryn/pm-skills

# Step 2: Install individual plugins
claude plugin install pm-toolkit@pm-skills
claude plugin install pm-product-strategy@pm-skills
claude plugin install pm-product-discovery@pm-skills
claude plugin install pm-execution@pm-skills
```

其余插件（pm-market-research、pm-data-analytics、pm-marketing-growth、pm-go-to-market、pm-ai-shipping）用同样的格式安装。

**Codex CLI**：`codex plugin marketplace add phuryn/pm-skills`，再用 `codex plugin add pm-execution@pm-skills` 这样的命令逐个添加。README 说明在 Codex 里技能可用，但斜杠命令不会作为 Codex 命令运行，需要用自然语言把步骤描述出来。

**其他工具**（Gemini CLI、OpenCode、Cursor、Kiro）：把各插件 `skills/` 下的文件夹复制到对应工具的技能目录，只有技能部分生效。

## 怎么用

README 给了几个入口命令，按当前要做的事选：

- 有新想法 → `/discover`（依次执行创意发散、识别假设、假设排序、设计实验）；
- 需要理清战略 → `/strategy`；
- 写需求文档 → `/write-prd`；
- 准备发布 → `/plan-launch`；
- 定指标 → `/north-star`。

每条命令结束后会建议接下来可以运行哪条命令，顺着走即可。技能本身在对话相关时会自动加载；想强制使用某个技能而不是让模型凭通用知识回答，可以输入 `/plugin-name:skill-name` 形式的命令（插件名加技能名）。

实际使用时把背景交代充分：产品是什么、用户是谁、已有哪些数据或访谈记录。框架能保证步骤不漏，但输入空泛，输出也只会是空泛的模板。

## 适合谁 / 不适合谁

**适合：**
- 产品经理、创业者——希望讨论需求和战略时有固定框架可依；
- 独立开发者，自己兼任产品角色，想补上「先验证再开发」这一环；
- 带新人的产品负责人，可以把这些流程当训练材料。

**不适合：**
- 只想要一份现成 PRD 模板的人——这些流程会反复追问，节奏比直接生成慢；
- 主要用 Cursor、Gemini CLI 的用户——只能用技能，串联命令是 Claude 专属；
- 需要中文方法论语境的团队——内容和示例以英文、海外产品实践为主，可以用中文对话，但术语需要自己对应。

## 注意事项

- **许可证**：仓库 LICENSE 为 MIT。
- **维护状态**：更新活跃，最近一次推送 2026-10-09。
- **安全提醒**：技能可以带脚本、读写文件、执行命令；Claude Code 官方文档提醒插件还可能包含 hooks 和 MCP 服务器，安装前在详情页看清每个插件带了什么，并通读要用的 `SKILL.md`。`pm-data-analytics` 会生成 SQL，执行前自己审一遍，别直接对生产库运行；`pm-toolkit` 里涉及法律文档的内容只能当草稿，正式文件要由专业人士把关。
- **数据**：访谈记录、用户数据、未公开的战略材料会被发送给你所用的模型服务，按公司的保密要求决定哪些能贴进去。
- **兼容性**：README 记录了 Windows 上 Cowork 虚拟机服务不稳定的已知问题及临时处理办法；Codex 下斜杠命令不可用。
- 框架输出的是结构化的思考过程，优先级和取舍的最终判断仍然要由了解业务的人来做。
