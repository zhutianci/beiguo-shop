---
title: "incident-response skill 是什么、怎么安装使用：线上出故障时，让 Claude 帮你定级、写通报和复盘"
slug: anthropic-engineering-incident-response-skill
name: incident-response（anthropics/knowledge-work-plugins）
url: https://github.com/anthropics/knowledge-work-plugins/tree/main/engineering/skills/incident-response
pricing: "开源免费（Apache-2.0）"
platforms: "Claude Cowork / Claude Code"
trialNote: "`claude plugin marketplace add anthropics/knowledge-work-plugins` 然后 `claude plugin install engineering@knowledge-work-plugins`"
products: [claude]
models: [claude-llm]
topics: [agent-skills, coding, office]
excerpt: "incident-response 是 Anthropic 开源的 engineering 插件里的技能：把一次线上事故分成分诊、沟通、缓解、复盘四个阶段，提供 SEV1–SEV4 的定级标准、状态通报模板和不追究个人责任的复盘文档结构。"
checkedOn: 2026-10-11
sources:
  - https://github.com/anthropics/knowledge-work-plugins/tree/main/engineering/skills/incident-response
  - https://github.com/anthropics/knowledge-work-plugins
  - https://claude.com/plugins/
---

> 本文根据 anthropics/knowledge-work-plugins 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。所在仓库 anthropics/knowledge-work-plugins 在 GitHub 约 2.9 万 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

线上故障时最缺的是脑力：一边排查，一边还得定级、拉人、给上级和客户写通报，事后再补复盘。incident-response 把后面这些「文书工作」的结构准备好了。`description`：运行一套事故响应流程——分诊、沟通、撰写复盘；在「我们出事故了」「生产环境挂了」、需要给告警定级、事故中途要发状态更新，或解决后写无责复盘时使用。

三种调用方式：

- `/incident-response new [描述]`：开始一个新事故；
- `/incident-response update [状态]`：发一次状态更新；
- `/incident-response postmortem`：根据事故数据生成复盘。

不指定时，它会先问事故处在哪个阶段。

流程四个阶段：**分诊**（评估严重级别、确认受影响的系统和用户、分配事故指挥、对外沟通、处置等角色）→ **沟通**（起草内部状态通报，必要时起草客户通知，建立作战群和更新节奏）→ **缓解**（记录采取的措施、维护时间线、确认恢复）→ **复盘**（无责复盘文档、重建时间线、用「五个为什么」做根因分析、带负责人的行动项）。

**定级表**：SEV1 是服务不可用、全部用户受影响，立即全员响应；SEV2 是主要功能受损、大量用户受影响，15 分钟内响应；SEV3 是次要功能问题，1 小时内；SEV4 是外观类或低影响问题，下一个工作日。

沟通上的要求是按固定节奏给出清楚、基于事实的更新，每次都包含：发生了什么、谁受影响、正在做什么、下次更新是什么时候。几条提示也很实在：信息不全也要立刻开始写；只写已知的、做过的和接下来要做的，不猜测；复盘对事不对人。

## 怎么安装

`incident-response` 属于 anthropics/knowledge-work-plugins 的 `engineering` 插件，随插件一起安装。Claude Code 里（命令来自仓库 README）：

```bash
claude plugin marketplace add anthropics/knowledge-work-plugins
claude plugin install engineering@knowledge-work-plugins
```

Claude Cowork 用户在 claude.com/plugins 页面安装同名插件。装好后技能会在相关场景自动触发，也可以用斜杠命令 `/engineering:incident-response` 手动调用。

仓库整体介绍和其他安装方式，详见本站《knowledge-work-plugins 是什么、怎么安装：Anthropic 开源的 11 个岗位插件（销售 / 法务 / 财务 / 数据）》。

## 怎么用

- 「/incident-response new 支付回调从十分钟前开始大量超时」。
- 「/incident-response update 已回滚上一个版本，错误率在下降」。
- 「/incident-response postmortem」，然后把时间线和聊天记录贴给它。

## 适合谁 / 局限

适合还没有成型事故流程的小团队，拿它当模板和记录员；也适合值班的人在压力下保证通报不漏项。局限：它不替你排查故障——定位和修复还得靠人和监控；定级标准是通用版，应当按自己的业务调整；连接了监控、事故管理或聊天工具时它才能自动拉取告警、创建事故单和发群消息，否则只产出文字。

## 注意事项

- **许可**：Apache-2.0。
- **不带脚本**；连接事故管理工具后，它可以创建或更新事故并呼叫值班人员——这类会打扰到人的动作，先确认再让它执行。
- 给客户的通知涉及对外口径和合同承诺，发出前应由负责人审阅。
- 事故材料里常含内部系统信息和用户数据，注意贴给模型的范围。
