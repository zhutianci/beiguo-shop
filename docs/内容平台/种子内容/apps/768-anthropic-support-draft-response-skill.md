---
title: "draft-response skill 是什么、怎么安装使用：让 Claude 按场景起草给客户的回复（报障、拒绝需求、账单问题）"
slug: anthropic-support-draft-response-skill
name: draft-response（anthropics/knowledge-work-plugins）
url: https://github.com/anthropics/knowledge-work-plugins/tree/main/customer-support/skills/draft-response
pricing: "开源免费（Apache-2.0）"
platforms: "Claude Cowork / Claude Code"
trialNote: "`claude plugin marketplace add anthropics/knowledge-work-plugins` 然后 `claude plugin install customer-support@knowledge-work-plugins`"
products: [claude]
models: [claude-llm]
topics: [agent-skills, office, copywriting]
excerpt: "draft-response 是 Anthropic 开源的 customer-support 插件里的技能：先判断客户、情境、紧急程度、渠道和关系阶段，再起草面向客户的回复，交稿前自查语气、承诺和口径，并附常见场景模板与跟进节奏。"
checkedOn: 2026-10-11
sources:
  - https://github.com/anthropics/knowledge-work-plugins/tree/main/customer-support/skills/draft-response
  - https://github.com/anthropics/knowledge-work-plugins
  - https://claude.com/plugins/
---

> 本文根据 anthropics/knowledge-work-plugins 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。所在仓库 anthropics/knowledge-work-plugins 在 GitHub 约 2.9 万 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

给客户回信难在分寸：功能延期怎么说、明确不做的需求怎么拒、故障期间怎么安抚又不乱承诺。draft-response 让 Claude 先判断情境再下笔。`description`：起草针对具体情境和客户关系的专业客户回复；在回答产品问题、回应升级投诉或故障、传达延期或「不予修复」这类坏消息、婉拒功能需求，或回复账单问题时使用。

**工作流五步**：

1. **理解情境**：客户是谁；属于哪类情况（提问、问题、升级、公告、谈判、坏消息、好消息、跟进）；多紧急、对方已经等了多久；走什么渠道（邮件、工单、聊天，正式程度随之调整）；关系处在什么阶段（新客户、老客户、已经不满）；对方是什么层级（一线使用者、经理、高管、技术或业务人员）。
2. **调研背景**：连接了邮件、聊天、客户管理系统等工具时，查之前的往来、做过的承诺、内部对这位客户的讨论和类似情况的处理方式。
3. **起草**。
4. **质量检查**：语气是否合适；有没有超出授权的承诺；有没有泄露不该对外说的产品规划；对过往沟通的引用是否准确；下一步和责任人是否清楚；深浅是否适合对方层级；长度是否适合渠道。
5. **提供改写选项**。

后面是一套**沟通准则**。七条核心原则：先共情、直截了当、诚实不夸大、具体、敢于担责（说「我们」而不是「系统」）、每次回复都有明确的下一步、情绪上与客户同步。另有回复结构、长度建议、语气光谱、按关系阶段调整语气和写作规则。

还有五个**常见场景模板**：确认收到缺陷报告、确认账单或账户问题、回复不会做的功能需求、故障或事故通报、长时间无回音后的跟进。最后是跟进节奏和何时该升级处理。

## 怎么安装

`draft-response` 属于 anthropics/knowledge-work-plugins 的 `customer-support` 插件，随插件一起安装。Claude Code 里（命令来自仓库 README）：

```bash
claude plugin marketplace add anthropics/knowledge-work-plugins
claude plugin install customer-support@knowledge-work-plugins
```

Claude Cowork 用户在 claude.com/plugins 页面安装同名插件。装好后技能会在相关场景自动触发，也可以用斜杠命令 `/customer-support:draft-response` 手动调用。

仓库整体介绍和其他安装方式，详见本站《knowledge-work-plugins 是什么、怎么安装：Anthropic 开源的 11 个岗位插件（销售 / 法务 / 财务 / 数据）》。

## 怎么用

SKILL.md 自带的例子：

- 「/draft-response 某客户问新的仪表盘功能什么时候上线」。
- 「/draft-response 客户升级投诉——他们的集成已经中断两天」。
- 「/draft-response 回复一个我们不打算做的功能需求」。

补充上之前的往来和你能给出的承诺范围，稿子会更可用。

## 适合谁 / 局限

适合客服、客户成功和小公司里兼做客服的创始人。局限：模板和语气以英文商务沟通为底色，中文回复需要自己把握称呼和客气程度；它不知道你们的真实排期和政策，凡是涉及日期、赔偿、退款的句子都要人工确认；没有连接邮件和客户系统时，背景只能靠你提供。

## 注意事项

- **许可**：Apache-2.0。
- **只起草，不发送**：把稿子发出去仍由你来做。
- **客户信息会进入模型上下文**，按公司的数据规定处理；不要贴入不必要的个人信息。
