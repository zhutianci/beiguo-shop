---
title: "copy-editing skill 是什么、怎么安装使用：用「七轮扫描」法修改营销文案的 Skill"
slug: marketingskills-copy-editing-skill
name: copy-editing（coreyhaines31/marketingskills）
url: https://github.com/coreyhaines31/marketingskills/tree/main/skills/copy-editing
pricing: "开源免费（MIT）"
platforms: "Claude Code / Codex / Cursor / Windsurf / claude.ai（ZIP 上传）"
trialNote: "npx skills add coreyhaines31/marketingskills --skill copy-editing"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, copywriting, marketing]
excerpt: "copy-editing 是 marketingskills 里的文案修改技能：不推倒重写，而是按清晰度、语气、「所以呢」、证据、具体性、情绪、零风险七轮依次扫描现有文案，并去掉 AI 腔，另有专家小组打分法。"
checkedOn: 2026-10-11
sources:
  - https://github.com/coreyhaines31/marketingskills/tree/main/skills/copy-editing
  - https://github.com/coreyhaines31/marketingskills
  - https://github.com/vercel-labs/skills
---

> 本文根据 coreyhaines31/marketingskills 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。skills.sh 榜单当日显示该技能累计安装约 14.0 万次；所在仓库 coreyhaines31/marketingskills 在 GitHub 约 5.4 万 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

手里已经有一版文案，问题是「读着别扭」「太啰嗦」「不够有说服力」，这时需要的是编辑而不是重写。copy-editing 负责这件事，与同库的 copywriting 分工明确。`description`：用户想编辑、评审或改进已有的营销文案，或刷新过时内容时使用；提到校对、润色、「收紧一点」「读着别扭」「太啰嗦」「更新这个页面」「内容过时了」，以及「这听起来像 AI」「去掉 AI 味」都会触发。描述里写明，每次编辑都会移除几类典型的 AI 痕迹句式。

核心是**七轮扫描框架**——每一轮只盯一个问题，从头到尾过一遍：

1. **清晰**：读者能一遍看懂吗；
2. **语气**：前后一致吗；
3. **所以呢**：每个说法对读者意味着什么；
4. **证明它**：断言有没有证据支撑；
5. **具体**：含糊的词能否换成具体的数字和例子；
6. **情绪**：有没有触动读者在意的东西；
7. **零风险**：读者行动的顾虑有没有被化解。

另有一套**专家小组打分**：设想几位不同视角的专家给文案打分并指出问题；以及词、句、段三个层面的快速检查和一组「常见毛病与改法」——功能堆砌、官腔、开头无力、行动按钮被埋没、没有证据、说法空泛等。

## 怎么安装

仓库 README 支持用 `--skill` 只装指定的技能：

```bash
npx skills add coreyhaines31/marketingskills --skill copy-editing product-marketing
```

这里顺带装上了 `product-marketing`：README 说明它是整个库的基础，其他技能动手前都会先读它生成的产品背景文件（`.agents/product-marketing.md`），了解你的产品、受众和定位，有了它就不必每次重复回答同样的问题。Claude Code 也可以整库安装：`/plugin marketplace add coreyhaines31/marketingskills` 后 `/plugin install marketing-skills`。

仓库整体介绍和其他安装方式，详见本站《marketingskills 是什么、怎么安装使用：Corey Haines 的营销 Skill 库（CRO、文案、SEO、投放、邮件）》。

## 怎么用

- 「按七轮扫描改这段落地页文案，每轮告诉我改了什么」。
- 「这个页面是两年前写的，帮我做一次内容刷新」。
- 「用专家小组的方式给这封发布邮件打分」。

目录里有三份参考：检查清单、内容刷新流程、平实用语对照。

## 适合谁 / 局限

适合要反复打磨官网、落地页、邮件的市场人员和创始人，也适合编辑拿来当检查清单。它保留原文的核心信息，所以救不了定位本身就错的文案；规则源于英文营销写作，中文语境下「平实用语对照」这类参考的适用性有限。

## 注意事项

- **许可**：MIT。
- **不执行脚本、不联网**。
- 「证明它」这一轮如果发现缺证据，应该去补真实的证据，而不是让它编一个。
