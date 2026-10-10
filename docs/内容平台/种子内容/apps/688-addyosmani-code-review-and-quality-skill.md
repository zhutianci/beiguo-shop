---
title: "code-review-and-quality skill 是什么、怎么安装使用：Addy Osmani 的五维度代码评审 Skill"
slug: addyosmani-code-review-and-quality-skill
name: code-review-and-quality（addyosmani/agent-skills）
url: https://github.com/addyosmani/agent-skills/tree/main/skills/code-review-and-quality
pricing: "开源免费（MIT）"
platforms: "Claude Code / Codex / Cursor / Gemini CLI / OpenCode / Copilot 等"
trialNote: "npx skills add addyosmani/agent-skills --skill code-review-and-quality"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, coding]
excerpt: "code-review-and-quality 是 addyosmani/agent-skills 里的代码评审技能：合并前从正确性、可读性与简洁、架构、安全、性能五个维度评审改动，先看测试再看实现，并对发现的问题分级。"
checkedOn: 2026-10-11
sources:
  - https://github.com/addyosmani/agent-skills/tree/main/skills/code-review-and-quality
  - https://github.com/addyosmani/agent-skills
  - https://github.com/vercel-labs/skills
---

> 本文根据 addyosmani/agent-skills 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。skills.sh 榜单当日显示该技能累计安装约 6.0 万次；所在仓库 addyosmani/agent-skills 在 GitHub 约 10.4 万 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

「帮我 review 一下」得到的往往是一串不分轻重的意见。code-review-and-quality 给评审定了结构和标准。`description`：进行多维度的代码评审；在合并任何改动之前使用，评审自己、另一个智能体或人写的代码时使用，被要求评审 diff 或 PR 时使用——即便 diff 是直接贴在对话里的。

技能先立了一条**批准标准**：只要改动确实改善了代码库的整体健康度，即使不完美也应批准——完美的代码不存在，目标是持续改进。

评审的**五个维度**：正确性、可读性与简洁性、架构、安全、性能。

**评审流程**五步：理解背景 → **先看测试** → 再看实现 → 给发现分级 → 「验证那个验证」（作者声称测过的东西是否真的测到了）。

其他小节同样实用：改动的大小该怎么控制、改动说明怎么写、多模型交叉评审的做法、死代码清理、评审速度、出现分歧如何处理、评审中的诚实，以及引入新依赖时的纪律。末尾是完整的评审清单。

## 怎么安装

仓库 README 给出了单独安装某个技能的写法：

```bash
npx skills add addyosmani/agent-skills --skill code-review-and-quality
```

想整套安装，Claude Code 用 `/plugin marketplace add addyosmani/agent-skills` 加 `/plugin install agent-skills@addy-agent-skills`，Codex 用 `codex plugin marketplace add addyosmani/agent-skills` 加 `codex plugin add agent-skills@agent-skills`。README 提示，插件安装遇到 SSH 权限报错时改用仓库的 HTTPS 地址。

仓库整体介绍和其他安装方式，详见本站《addyosmani/agent-skills 是什么、怎么安装：Addy Osmani 的 25 个生产级工程 Skills（/spec、/plan、/build）》。

## 怎么用

- 「按五个维度评审当前分支相对 main 的改动」。
- 把一段 diff 贴进对话：「合并前帮我看看」。
- 「另一个智能体写了这个 PR，重点核实它说通过的测试是否真的覆盖了改动」。

这个技能只有一份 SKILL.md，是该库在 skills.sh 当日榜单上安装量最高的一个。

## 适合谁 / 局限

适合独立开发者做合并前自查，也适合团队把它当作统一的评审口径。与 Superpowers 的评审技能相比，它不规定「派子智能体去审」的机制，重点在评审的内容标准，两者可以配合。它看的是代码，不了解业务背景和线上状况，结论需要人来权衡。

## 注意事项

- **许可**：MIT。
- **不执行脚本**；评审中可能运行测试来核实。
- 安全维度只是常规检查，不能代替专门的安全审计。
