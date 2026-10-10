---
title: "incremental-implementation skill 是什么、怎么安装使用：让 AI 一小片一小片地改代码，每片都能跑"
slug: addyosmani-incremental-implementation-skill
name: incremental-implementation（addyosmani/agent-skills）
url: https://github.com/addyosmani/agent-skills/tree/main/skills/incremental-implementation
pricing: "开源免费（MIT）"
platforms: "Claude Code / Codex / Cursor / Gemini CLI / OpenCode / Copilot 等"
trialNote: "npx skills add addyosmani/agent-skills --skill incremental-implementation"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, coding, ai-agent]
excerpt: "incremental-implementation 是 addyosmani/agent-skills 里的执行纪律技能：要求智能体把改动切成薄的、可验证的切片，按「实现 → 测试 → 验证 → 提交」循环推进，并遵守先求简单、不越界、保持可编译等规则。"
checkedOn: 2026-10-11
sources:
  - https://github.com/addyosmani/agent-skills/tree/main/skills/incremental-implementation
  - https://github.com/addyosmani/agent-skills
  - https://github.com/vercel-labs/skills
---

> 本文根据 addyosmani/agent-skills 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。所在仓库 addyosmani/agent-skills 在 GitHub 约 10.4 万 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

编程智能体的一个通病是「一口气写完」：一次改十几个文件，最后发现跑不起来，也分不清是哪一步出的错。incremental-implementation 规定了另一种节奏。`description`：以薄的、可验证的切片增量交付改动；在实现任何涉及多个文件的功能或改动、从计划里领取下一个任务、用功能开关逐步放出改动、正准备一次写大量代码，或任务大到没法一步落地时使用。

**增量循环**五步：实现最小的一块完整功能 → 跑测试（没有就先写一个）→ 验证这一片确实可用 → 提交 → 进入下一片，接着往前走而不是推倒重来。SKILL.md 给了一个经验信号：在测试之前想写超过一百行左右的代码时，就该切片了。

**三种切法**：

- **纵向切片**（首选）：每一片都打通一条从界面到数据的完整路径，做完就能用；
- **契约先行**：前后端要并行开发时，先定接口再各自实现；
- **风险先行**：先做最没把握的那一块，失败了也是在投入更多之前发现。

**实施规则**从 0 号开始编号：

- 规则 0，简单优先——先写最朴素、明显正确的版本；三行相似的代码好过一个过早的抽象。
- 规则 0.5，范围纪律——只碰任务需要的地方；不顺手「清理」旁边的代码，不整理没在改的文件里的导入，不删自己没看懂的注释，不加规格里没有的功能。发现值得改的地方就记下来，不动手。
- 规则 1，一次只做一件事。
- 规则 2，保持可编译——每一片之后项目都能构建、已有测试都通过。
- 规则 3，没做完的功能放在功能开关后面。
- 规则 4，安全的默认值。
- 规则 5，便于回滚。

之后是与智能体协作的要点、每片的检查清单，以及这个库每个技能都有的「常见的自我开脱」「危险信号」「验证」三节。

## 怎么安装

仓库 README 给出了单独安装某个技能的写法：

```bash
npx skills add addyosmani/agent-skills --skill incremental-implementation
```

想整套安装，Claude Code 用 `/plugin marketplace add addyosmani/agent-skills` 加 `/plugin install agent-skills@addy-agent-skills`，Codex 用 `codex plugin marketplace add addyosmani/agent-skills` 加 `codex plugin add agent-skills@agent-skills`。README 提示，插件安装遇到 SSH 权限报错时改用仓库的 HTTPS 地址。

仓库整体介绍和其他安装方式，详见本站《addyosmani/agent-skills 是什么、怎么安装：Addy Osmani 的 25 个生产级工程 Skills（/spec、/plan、/build）》。

## 怎么用

- 「按 incremental-implementation 的方式实现这份计划，每完成一片就停下来让我看」。
- 「这个重构涉及二十多个文件，先告诉我你打算怎么切」。
- 整套安装后，它通常由 `/build` 命令在实现阶段带出来。

## 适合谁 / 局限

适合让智能体做中等以上规模改动的人，尤其是被「改完一大堆却跑不起来」折腾过的。局限：切片越细，测试和提交的次数越多，速度会慢一些；项目没有测试时，「验证」只能靠构建和手工检查，效果打折扣；单文件的小修改用不着它，SKILL.md 自己也这么说。

## 注意事项

- **许可**：MIT。
- **不带脚本**：纯说明文字。
- **会频繁提交**：如果你对提交历史有要求，事先说明提交信息的规范，或让它在独立分支上工作，合并前再整理。
