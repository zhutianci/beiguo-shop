---
title: "SkillsMP 是什么、怎么用：收录 340 万个 SKILL.md 的 Agent Skills 搜索站（Claude / Codex Skills 市场）"
slug: skillsmp-agent-skills-index
name: SkillsMP（Agent Skills Marketplace）
url: https://skillsmp.com/
pricing: 免费浏览（第三方独立站点）
platforms: 通用（网页索引站，适用工具取决于各技能本身）
trialNote: 打开 skillsmp.com 搜索关键词，进入技能对应的 GitHub 仓库后按仓库说明安装
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, ai-agent]
excerpt: "SkillsMP 是一个独立的社区站点，自动收录 GitHub 上公开的 SKILL.md（首页显示约 340 万个），可按关键词、分类、职业和作者浏览。它只做索引，不审核、不安装，也与 Anthropic、OpenAI 无关。"
checkedOn: 2026-10-10
sources:
  - https://skillsmp.com/
  - https://skillsmp.com/docs/faq
  - https://agentskills.io/home
---

> 本文根据 SkillsMP 站点首页与常见问题页面整理，资料核对于 2026-10-10。站点数据每天变化，以站点为准。

## 是什么

搜「claude skills 市场」「codex skills 市场」时，经常会搜到 SkillsMP。它是一个**第三方的技能搜索站**：自动从 GitHub 的公开仓库里收集 `SKILL.md` 文件，建立索引，让你按关键词、分类、职业或作者去找「别人把什么工作做成了技能」。

站点常见问题里写得很清楚：SkillsMP 是独立的社区项目，**与 Anthropic、OpenAI 没有隶属关系**；官方文档和官方技能应当到对应厂商的网站查看。它也不是应用商店——不托管安装包、不替你安装，每个条目都链接回 GitHub 上的原始仓库。

规模方面，2026-10-10 首页显示「已收集 3,403,118 个 SKILL.md 文件」。这是自动抓取的总量，站点自己也说明，被收录或被索引并不代表这个技能在真实工作中被使用或采用。它没有 GitHub 仓库可供统计 Star，所以这里不给 Star 数。

## 包含哪些 Skill

站点本身不写技能，提供的是几种浏览入口：

- **关键词搜索**：用具体的任务、工具或领域词查找；
- **按分类**：首页显示的大类有 Tools（约 78 万）、Business（约 62 万）、Development（约 44 万）、Testing & Security（约 36 万）等；
- **按职业**：参照美国标准职业分类，分成 23 个职业大类、867 个细分职业，其中计算机与数学类最多（约 213 万）。站点注明这个排序只反映收录数量，不代表质量、安全性或某个领域的价值；
- **精选合集**：编辑挑选的仓库，2026-10-10 首页展示的有 Matt Pocock 的 Skills For Real Engineers、Jesse Vincent 的 Superpowers、Corey Haines 的 Marketing Skills、Lauren Tan 的 pstack；
- **示例卡片**：如 anthropics/skills 的 `frontend-design`、`skill-creator`，`ui-ux-pro-max`，obra/superpowers 的 `brainstorming`，mattpocock/skills 的 `grill-me`，vercel-labs/agent-browser 等，每张卡片带 GitHub Star 数和更新日期；
- **社区动态**：汇总 X 上分享技能的帖子及其对应仓库；
- 界面支持简体中文等多种语言，并提供 API 文档。

## 怎么安装

SkillsMP 不提供安装命令。站点常见问题给出的做法是：**打开技能在 GitHub 上的来源，按该仓库的说明安装**；很多情况下就是把技能文件夹复制到你所用智能体的技能目录。各家官方文档给出的目录是：

- Claude Code：`~/.claude/skills/<技能名>/`（个人）或项目里的 `.claude/skills/<技能名>/`；
- Codex：仓库内 `.agents/skills`，或用户级 `$HOME/.agents/skills`；
- claude.ai：把技能文件夹打成 ZIP，在 Customize → Skills 里上传。

如果来源仓库自己提供了插件市场命令或 `npx skills add …`，以仓库 README 为准。

## 怎么用

- **找现成的**：搜索「weekly report」「contract review」这类具体任务词，打开几个结果，对比它们的 Star 数、更新日期和来源仓库，再点进 GitHub 看完整内容。
- **写技能前找参考**：准备给自己的工作写技能时，按职业入口找同行的做法，看别人怎么划定范围、怎么写步骤和检查清单、带了哪些辅助文件。站点建议把这些当作「需要改写和验证的参考」，而不是可以直接照搬的模板。
- **看生态**：通过精选合集和社区动态了解最近大家在讨论哪些技能库，再回到本目录或官方渠道核实。

## 适合谁 / 不适合谁

**适合：**
- 想知道「某个领域有没有人做过技能」的人，尤其是非编程岗位；
- 写技能时想多看几个同类例子的作者；
- 做技能生态调研的人。

**不适合：**
- 想要「装上就能放心用」的精选清单的人——几百万条自动收录的结果，质量差别极大；
- 对安全要求高的团队：应当优先用官方仓库和知名作者的技能；
- 只想要一条安装命令的人——skills.sh 配合 `npx skills` 更直接。

## 注意事项

- **没有审核**：站点明确说明它索引公开的 GitHub 仓库，**不保证每个技能安全或高质量**，建议像对待任何开源代码一样：看源码、检查脚本和权限、看最近是否还在维护，只安装自己看得懂的东西。
- **数量不等于可用**：340 万这个数字包含大量重复、自动生成和无人维护的技能；Star 数显示的是所在仓库的 Star，不是单个技能的质量评分。
- **许可证各不相同**：每个技能的许可证由来源仓库决定，被收录不代表可以自由转载或商用。
- **非官方**：名字里的 Marketplace 容易让人误以为是官方市场。Claude 的官方入口是 claude.com 的插件目录和 Claude Code 里的 `/plugin`，OpenAI 的是 ChatGPT / Codex 的 Plugins 目录。
- **安全**：技能可以带脚本、读写文件、执行命令。从这类聚合站找到的技能，安装前务必通读 `SKILL.md` 和所有脚本，留意其中访问外部网址、读取环境变量或密钥的部分；可以先用 NVIDIA 的 SkillSpector 这类扫描工具过一遍。
- 站点有登录、合作与广告入口，浏览和搜索本身不需要登录。
