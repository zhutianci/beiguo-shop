---
title: "receiving-code-review skill 是什么、怎么用：让智能体不再「你说得对」、先核实再改的 Superpowers Skill"
slug: superpowers-receiving-code-review-skill
name: receiving-code-review（obra/superpowers）
url: https://github.com/obra/superpowers/tree/main/skills/receiving-code-review
pricing: "开源免费（MIT）"
platforms: "Claude Code / Codex / Cursor / Gemini CLI / Copilot CLI / OpenCode 等"
trialNote: "/plugin install superpowers@claude-plugins-official"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, coding]
excerpt: "receiving-code-review 是 Superpowers 处理评审意见的技能：收到反馈后先复述技术要求、核实是否成立、不清楚就问，有技术理由时要反驳；禁止「你说得太对了」式的表演性附和和盲目照改。"
checkedOn: 2026-10-11
sources:
  - https://github.com/obra/superpowers/tree/main/skills/receiving-code-review
  - https://github.com/obra/superpowers
  - https://claude.com/plugins/superpowers
---

> 本文根据 obra/superpowers 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。skills.sh 榜单当日显示该技能累计安装约 21.0 万次；所在仓库 obra/superpowers 在 GitHub 约 29.7 万 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

对智能体说一句「这里是不是有问题」，它多半立刻回答「你说得完全正确！」然后开始改——哪怕你其实说错了。receiving-code-review 专治这种条件反射。`description`：收到代码评审反馈时、在动手实现建议之前使用，尤其是反馈不清楚或技术上可疑的时候；它要求的是技术上的严谨和核实，而不是表演式的赞同或盲目执行。

总纲是一句话：先核实再实现，先提问再假设，技术正确优先于社交上的舒服。技能直接列了「禁用回复」：「你说得太对了」「好观点」「我马上改」（在核实之前）都不许说；替代做法是复述技术要求、提出澄清问题、有理由时用技术论据反驳，或者干脆直接开始干活。

后面分情况处理：意见不清楚时，先把所有条目都弄明白再动手，不要只做看懂的那几条；意见来自你本人时可以信任，但范围不明仍要问；来自外部评审者（包括其他 AI 评审）时要逐条对照代码库核实，检查它是否了解完整背景。还有一条 YAGNI 检查：评审者建议「做得更专业」而加功能时，先确认这个功能真的有人用。发现自己反驳错了，也有规定的更正方式——陈述事实并改正，不长篇道歉。

## 怎么安装

`receiving-code-review` 是 Superpowers 插件里的一个技能，不单独发布：作者的设计是整套一起安装，由会话开始时注入的引导指令决定各技能何时触发。Claude Code 里输入（命令来自仓库 README）：

```text
/plugin install superpowers@claude-plugins-official
```

Codex 在 `/plugins` 里搜索 superpowers 安装；Gemini CLI 用 `gemini extensions install https://github.com/obra/superpowers`。装好后在命令菜单里以 `/superpowers:receiving-code-review` 的形式出现，也会按场景自动触发。

仓库整体介绍和其他安装方式，详见本站《Superpowers 是什么、怎么安装和使用：Claude Code / Codex 最热门的 Skills 开发流程框架》。

## 怎么用

- 把同事在 PR 上的评论贴给它：「这是评审意见，逐条处理」——它会先分出哪些成立、哪些需要澄清、哪些不同意及理由。
- 「Copilot 的自动评审提了 8 条，帮我判断哪些该改」。
- 说明里还有一节讲在 GitHub 评论线程里怎么回复。

这个技能只有一份 SKILL.md。

## 适合谁 / 局限

适合经常把评审意见转给智能体处理的人，以及受够了它无原则附和的人。副作用是它会变得「不那么听话」：你确实想让它照做时，需要把理由或决定说明白。它核实的依据是代码库，涉及业务决策的意见它无从判断，仍要你拍板。

## 注意事项

- **许可**：MIT。
- **不执行脚本**：纯行为准则；核实过程中会读代码、跑测试。
- 它改变的是沟通方式，不保证每次反驳都对，分歧较大时让它给出可验证的证据。
