---
title: "internal-comms skill 是什么、怎么使用：Anthropic 官方的内部沟通写作 Skill（周报、3P 更新、通讯、FAQ）"
slug: anthropic-internal-comms-skill
name: internal-comms（anthropics/skills）
url: https://github.com/anthropics/skills/tree/main/skills/internal-comms
pricing: "免费（Apache-2.0，见技能目录内 LICENSE.txt）"
platforms: "Claude Code / claude.ai / Claude API"
trialNote: "`/plugin marketplace add anthropics/skills` 然后 `/plugin install example-skills@anthropic-agent-skills`"
products: [claude]
models: [claude-llm]
topics: [agent-skills, office, copywriting]
excerpt: "internal-comms 是 anthropics/skills 里写内部沟通材料的 Skill：按类型加载对应的写作指引，覆盖 3P 更新（进展 / 计划 / 问题）、公司通讯、FAQ 回复、状态报告、项目更新和事故报告。"
checkedOn: 2026-10-11
sources:
  - https://github.com/anthropics/skills/tree/main/skills/internal-comms
  - https://github.com/anthropics/skills
  - https://github.com/anthropics/skills/blob/main/.claude-plugin/marketplace.json
  - https://code.claude.com/docs/en/skills
---

> 本文根据 anthropics/skills 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。skills.sh 榜单当日显示该技能累计安装约 7.7 万次；所在仓库 anthropics/skills 在 GitHub 约 18.0 万 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

公司内部的文字——周报、给管理层的更新、全员通讯、事故通报——各有各的格式和语气，写不对就要返工。internal-comms 把这些格式沉淀成了可以按需调取的写作指引。它的 `description` 写得像一句用户自述：这是一组帮我按公司习惯的格式撰写各类内部沟通材料的资源；只要被要求写内部沟通内容，就应该使用它，括号里列了状态报告、管理层更新、3P 更新、公司通讯、FAQ、事故报告、项目更新等。

机制很简单，三步：先判断这次要写的是哪一类；再从 `examples/` 目录加载对应的指引文件；最后按该文件规定的格式、语气和信息收集方式来写。目录里目前有四份指引：

- `3p-updates.md`：3P 更新，即 Progress（进展）、Plans（计划）、Problems（问题）三段式的团队更新；
- `company-newsletter.md`：面向全公司的通讯；
- `faq-answers.md`：常见问题的回复；
- `general-comms.md`：以上都对不上时的通用指引。

## 怎么安装

`internal-comms` 收在 anthropics/skills 仓库的 example-skills 插件包里。在 Claude Code 会话中依次输入（命令来自仓库 README）：

```text
/plugin marketplace add anthropics/skills
/plugin install example-skills@anthropic-agent-skills
```

同一个包里的其他示例技能会一起装上。只想要这一个，可以把仓库里的 `skills/internal-comms` 文件夹复制到 `~/.claude/skills/`（个人）或项目的 `.claude/skills/`；claude.ai 网页版则在 Customize → Skills 里上传这个文件夹的 ZIP。

仓库整体介绍和其他安装方式，详见本站《anthropics/skills 是什么、怎么安装：Anthropic 官方 Skills 仓库（docx / pptx / xlsx / pdf、skill-creator）》。

## 怎么用

- 「根据这周的提交记录和这几条聊天记录，写一份我们组的 3P 更新」。
- 「把这次支付故障的时间线整理成一份给全员的事故说明」。
- 「下周要发季度通讯，这是各部门交上来的素材，帮我编成一期」。

有文件系统或已连接工作工具的环境里，它可以先去读你指定的资料再动笔；否则需要你把素材贴进对话。

## 适合谁 / 局限

适合团队负责人、项目经理、内部沟通与行政岗位。要注意，仓库里的四份指引反映的是 Anthropic 自己偏好的写法，是示例而不是标准。真正的用法是把 `examples/` 里的文件换成**你们公司**的模板和范文——这也是它作为示例技能想演示的模式：一份很短的 SKILL.md 负责分流，具体规范放在按需加载的文件里。

## 注意事项

- **许可**：技能目录内的 LICENSE.txt 为 Apache-2.0。
- **不执行脚本**：只有说明和示例文件。
- **事实核对**：周报和事故报告里的数字、时间点要以原始记录为准，它整理素材时可能合并或遗漏细节。
- **保密**：内部材料贴进对话前，确认符合公司对 AI 工具的使用规定。
