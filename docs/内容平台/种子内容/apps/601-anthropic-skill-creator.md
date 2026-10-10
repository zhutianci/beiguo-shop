---
title: "skill-creator 是什么、怎么安装使用：Anthropic 官方「写 Skill 的 Skill」，带测试、评分和触发描述优化"
slug: anthropic-skill-creator
name: skill-creator（anthropics/skills）
url: https://github.com/anthropics/skills/tree/main/skills/skill-creator
pricing: "免费（Apache-2.0，见技能目录内 LICENSE.txt）"
platforms: "Claude Code / claude.ai / Claude API"
trialNote: "`/plugin marketplace add anthropics/skills` 然后 `/plugin install example-skills@anthropic-agent-skills`"
products: [claude]
models: [claude-llm]
topics: [agent-skills, ai-agent, prompt-engineering]
excerpt: "skill-creator 是 anthropics/skills 里用来创建和改进技能的 Skill：访谈需求、起草 SKILL.md、用测试提示词跑有无技能的对比、汇总评分并迭代，还能优化 description 提高触发准确率。"
checkedOn: 2026-10-11
sources:
  - https://github.com/anthropics/skills/tree/main/skills/skill-creator
  - https://github.com/anthropics/skills
  - https://github.com/anthropics/skills/blob/main/.claude-plugin/marketplace.json
  - https://code.claude.com/docs/en/skills
---

> 本文根据 anthropics/skills 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。skills.sh 榜单当日显示该技能累计安装约 40.2 万次；所在仓库 anthropics/skills 在 GitHub 约 18.0 万 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

写一个 Skill 并不难，难的是知道它到底有没有用：会不会在该触发的时候不触发，装上之后结果是不是真的更好。skill-creator 把这件事做成了一个可重复的流程。按它的 `description`，你想从零创建技能、修改或优化已有技能、跑评测、做带方差分析的基准对比，或者想改进技能的触发描述时，Claude 会加载它。

流程大致是：先弄清意图并访谈细节，写出 `SKILL.md` 初稿；准备几条测试提示词，分别让「带技能」和「不带技能」的 Claude 跑一遍；用目录里的评分、汇总脚本生成结果，并打开一个本地评审页面让你逐条看输出、留反馈；再根据反馈改写，循环到满意为止。另有一段专门讲 description 优化：生成一批「应该触发 / 不应该触发」的查询，跑优化循环挑出触发最准的写法。

## 怎么安装

`skill-creator` 收在 anthropics/skills 仓库的 example-skills 插件包里。在 Claude Code 会话中依次输入（命令来自仓库 README）：

```text
/plugin marketplace add anthropics/skills
/plugin install example-skills@anthropic-agent-skills
```

同一个包里的其他示例技能会一起装上。只想要这一个，可以把仓库里的 `skills/skill-creator` 文件夹复制到 `~/.claude/skills/`（个人）或项目的 `.claude/skills/`；claude.ai 网页版则在 Customize → Skills 里上传这个文件夹的 ZIP。

仓库整体介绍和其他安装方式，详见本站《anthropics/skills 是什么、怎么安装：Anthropic 官方 Skills 仓库（docx / pptx / xlsx / pdf、skill-creator）》。

## 怎么用

- 「帮我把每周整理销售数据、出周报的流程做成一个 skill」——它会追问输入是什么、输出长什么样、什么情况下该触发，然后起草。
- 「我这个 skill 经常不触发，帮我优化 description」——走触发评测与优化循环。
- 「给这个 skill 跑一轮评测，对比装和不装的差别」——并行跑测试、评分、出对比报告。

它会用到目录里的 `scripts/`（跑评测、聚合基准、打包、快速校验等 Python 脚本）、`agents/`（评分、对比、分析三个子智能体的说明）和 `eval-viewer/`（评审页面）。

## 适合谁 / 局限

适合想把重复工作沉淀成技能的个人和团队，尤其是准备把技能分享给别人、需要拿出效果证据的作者。只想快速写一份简单 `SKILL.md` 的话，完整评测流程偏重：要并行跑多轮对话，耗时也耗 token，可以只用它的起草部分。

## 注意事项

- **许可**：技能目录内的 LICENSE.txt 为 Apache-2.0。
- **会执行脚本**：评测依赖 Python 脚本和子智能体，在 Claude Code 这类有文件系统的环境里才完整可用；claude.ai 网页版里只能用到写作指导部分。
- **费用**：一轮评测等于多次完整对话，按订阅额度或 API 用量计。
- 写出的技能发布前，建议再用 agentskills.io 的校验工具检查格式。
