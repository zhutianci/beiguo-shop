---
title: "launch skill 是什么、怎么安装使用：规划产品发布与功能上线的营销 Skill（ORB 渠道框架、五阶段发布）"
slug: marketingskills-launch-skill
name: launch（coreyhaines31/marketingskills）
url: https://github.com/coreyhaines31/marketingskills/tree/main/skills/launch
pricing: "开源免费（MIT）"
platforms: "Claude Code / Codex / Cursor / Windsurf / claude.ai（ZIP 上传）"
trialNote: "npx skills add coreyhaines31/marketingskills --skill launch"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, marketing]
excerpt: "launch 是 marketingskills 里的发布策略技能：用「自有、租用、借用」三类渠道的 ORB 框架和从内部发布到全面发布的五个阶段规划上线，含 Product Hunt 打法、发布清单和日常更新的公告方式。"
checkedOn: 2026-10-11
sources:
  - https://github.com/coreyhaines31/marketingskills/tree/main/skills/launch
  - https://github.com/coreyhaines31/marketingskills
  - https://github.com/vercel-labs/skills
---

> 本文根据 coreyhaines31/marketingskills 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。skills.sh 榜单当日显示该技能累计安装约 7.1 万次；所在仓库 coreyhaines31/marketingskills 在 GitHub 约 5.4 万 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

产品做完了，「发布」往往只是发一条动态然后等待。launch 技能把发布当成一个可以分阶段积累势能的过程。`description`：用户想规划产品发布、功能公告或发行策略时使用；提到发布、Product Hunt、功能上线、公告、上市计划、内测、抢先体验、等候名单、「怎么发布这个」、发布清单、更新日志、「这周我们发了什么」等都会触发。发布之后的持续营销由 marketing-ideas 负责。

两个核心框架：

**ORB 渠道框架**——把渠道分成三类：自有渠道（邮件列表、博客、社区，你完全控制）、租用渠道（社交平台、应用市场，规则归平台）、借用渠道（别人的受众，如播客、合作伙伴、媒体）。思路是用租用和借用的渠道把人引到自有渠道上。

**五阶段发布**——内部发布 → Alpha → Beta → 抢先体验 → 全面发布，每个阶段的目的和做法不同。在此之前有一道「就绪关卡」：你真的准备好发布了吗？

此外有 Product Hunt 专题（利弊、怎样发布成功、案例），发布后的产品营销（当天之后做什么、怎样保持势头），以及把日常功能更新也当作小型发布来经营的方法——如何决定哪些值得公告、用什么方式公告。最后是发布前、发布当天、发布后三段清单。

## 怎么安装

仓库 README 支持用 `--skill` 只装指定的技能：

```bash
npx skills add coreyhaines31/marketingskills --skill launch product-marketing
```

这里顺带装上了 `product-marketing`：README 说明它是整个库的基础，其他技能动手前都会先读它生成的产品背景文件（`.agents/product-marketing.md`），了解你的产品、受众和定位，有了它就不必每次重复回答同样的问题。Claude Code 也可以整库安装：`/plugin marketplace add coreyhaines31/marketingskills` 后 `/plugin install marketing-skills`。

仓库整体介绍和其他安装方式，详见本站《marketingskills 是什么、怎么安装使用：Corey Haines 的营销 Skill 库（CRO、文案、SEO、投放、邮件）》。

## 怎么用

- 「下个月要发布 2.0，帮我排一个六周的发布计划」。
- 「我们没有邮件列表，只有 800 个社交媒体粉丝，怎么用 ORB 框架起步？」
- 「把这周合并的功能整理成一份对外的更新说明」。

目录里有两份参考：整理已发布的改动、网站上线前的质量检查。

## 适合谁 / 局限

适合独立开发者和早期团队规划第一次公开发布，或给后续每次功能上线建立固定节奏。框架和案例以海外 SaaS 与 Product Hunt 生态为背景，国内的发布渠道（各类社区、公众号、应用商店）需要自行对应到三类渠道里；它给的是计划，执行要靠人。

## 注意事项

- **许可**：MIT。
- **不执行脚本**；整理更新说明时会读取你的提交记录或发布记录。
- 发布内容里的功能描述和上线时间要与实际一致，别让计划里的话术变成兑现不了的承诺。
