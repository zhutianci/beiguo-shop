---
title: "supply-chain-risk-auditor 是什么、怎么安装使用：Trail of Bits 的依赖供应链风险审计 Skill（npm / PyPI / Go）"
slug: trailofbits-supply-chain-risk-auditor-skill
name: supply-chain-risk-auditor（trailofbits/skills）
url: https://github.com/trailofbits/skills/tree/main/plugins/supply-chain-risk-auditor/skills/supply-chain-risk-auditor
pricing: "免费（CC BY-SA 4.0，署名并以相同方式共享）"
platforms: "Claude Code / Codex"
trialNote: "`/plugin marketplace add trailofbits/skills` 然后 `/plugin menu`"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, coding]
excerpt: "supply-chain-risk-auditor 是 Trail of Bits 的依赖审计技能：为项目的直接依赖生成供应链风险报告，并对整个锁文件做漏洞公告排查，关注版本匹配的公告、被弃用或归档的上游、npm 发布者集中度和安装时脚本。"
checkedOn: 2026-10-11
sources:
  - https://github.com/trailofbits/skills/tree/main/plugins/supply-chain-risk-auditor/skills/supply-chain-risk-auditor
  - https://github.com/trailofbits/skills
  - https://creativecommons.org/licenses/by-sa/4.0/
---

> 本文根据 trailofbits/skills 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。所在仓库 trailofbits/skills 在 GitHub 约 7462 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

现代项目的代码大部分来自依赖，近几年的重大安全事件也多发生在这里：维护者账号被盗、包被弃用后遭人接管、安装脚本里藏了东西。supply-chain-risk-auditor 给项目的依赖做一次体检。`description`：审计项目依赖的供应链风险——针对直接依赖和完整锁文件树的、与版本匹配的安全公告，被弃用或已归档的上游，npm 发布者的集中度，以及安装时执行的脚本；被要求审计依赖、评估供应链或第三方包风险，或在正式审计前梳理依赖树时使用。支持 npm、PyPI 和 Go。

它的设计思路写在小节标题里：**为什么由脚本负责测量，而不是你**。报告里的每个数字都是对别人项目的断言，手工收集的数字容易出错，所以由两个确定性的脚本去采集和建模；留给智能体的是脚本拒绝自动化的那部分——判断。

工作流大致是：运行采集脚本拉取依赖的各项数据 → 生成报告 → 智能体阅读报告并补充分析，说明哪些风险真正值得处理。技能对「你补充的内容该怎么写」有专门的风格要求，并有「如何读报告」和要拒绝的开脱说法两节。

## 怎么安装

`supply-chain-risk-auditor` 在 trailofbits/skills 里属于 `supply-chain-risk-auditor` 插件。Claude Code 先登记市场，再在菜单里选择要装的插件（命令来自仓库 README）：

```text
/plugin marketplace add trailofbits/skills
/plugin menu
```

Codex 用 `codex plugin marketplace add trailofbits/skills`，再执行 `codex plugin add supply-chain-risk-auditor@trailofbits`。

仓库整体介绍和其他安装方式，详见本站《trailofbits/skills 是什么、怎么安装：Trail of Bits 的代码安全审计 Skills（静态分析、差异评审、供应链检查）》。

## 怎么用

- 「审计这个项目的依赖，给我一份供应链风险报告」。
- 「我们打算引入这个新包，评估一下它的风险」。
- 「报告里哪三项最该优先处理？给出替换或缓解建议」。

`scripts/` 下是一套带测试的 Python 脚本（采集、建模、渲染、数据源），用 uv 管理依赖。

## 适合谁 / 局限

适合有一定规模依赖树的项目负责人、做安全评估的工程师，以及需要回答客户供应链问卷的团队。它衡量的是可观测的风险信号，「维护者少」不等于「有问题」，结论需要结合实际判断；它不审计依赖的源代码本身，也不是持续监控，只代表运行那一刻的状态。

## 注意事项

- **许可**：CC BY-SA 4.0，改编后须以相同方式共享。
- **会执行脚本并联网**：向包仓库和公告数据库查询公开信息；声明的工具权限含 Bash 与 Write。
- 查询的是公开元数据，不会上传你的源代码，但依赖清单本身会体现在请求里。
