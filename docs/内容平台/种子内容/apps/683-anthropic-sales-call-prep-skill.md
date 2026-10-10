---
title: "call-prep skill 是什么、怎么安装使用：Anthropic 销售插件里的会前准备 Skill（参会人、客户历史、提问清单）"
slug: anthropic-sales-call-prep-skill
name: call-prep（anthropics/knowledge-work-plugins）
url: https://github.com/anthropics/knowledge-work-plugins/tree/main/sales/skills/call-prep
pricing: "开源免费（Apache-2.0）"
platforms: "Claude Cowork / Claude Code"
trialNote: "`claude plugin marketplace add anthropics/knowledge-work-plugins` 然后 `claude plugin install sales@knowledge-work-plugins`"
products: [claude]
models: [claude-llm]
topics: [agent-skills, marketing, office]
excerpt: "call-prep 是 Anthropic knowledge-work-plugins 销售插件里的会前简报技能：通过已连接的日历、CRM 和通话记录，为即将到来的会议整理参会人背景、客户历史、商机状态和建议的探询问题。"
checkedOn: 2026-10-11
sources:
  - https://github.com/anthropics/knowledge-work-plugins/tree/main/sales/skills/call-prep
  - https://github.com/anthropics/knowledge-work-plugins
  - https://claude.com/plugins/
---

> 本文根据 anthropics/knowledge-work-plugins 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。所在仓库 anthropics/knowledge-work-plugins 在 GitHub 约 2.9 万 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

销售在见客户前应该做的功课——查上次聊了什么、对方是谁、商机进展到哪——常常被压缩成会前五分钟的匆忙翻找。call-prep 让 Claude 替你把简报准备好。`description`：为即将到来的会议生成会前简报——参会人、客户历史、从通话记录中提取的过往沟通背景、未结商机状态和建议的探询问题；用户说「帮我准备和某公司的会」「call prep 某公司」「我要见某公司，帮我准备」「我几点的电话之前需要知道什么」时使用。

技能分六步：

1. **定位**：确认可用的工具和你的身份；
2. **确定是哪场会议**：从日历或你的描述里找到它；
3. **客户历史**：从 CRM 和过往记录里取出往来情况；
4. **参会人画像**；
5. **制定通话计划**：目标、要确认的问题；
6. **输出简报**。

技能开头有一组贯穿所有步骤的规则，其中两条值得知道：你要求它执行的操作（更新记录、发邮件、预约会议）通过连接器完成；而它主动建议、你并没有要求的改动，必须先展示改动内容和依据，由你决定。各工具的权限（允许、询问或禁止）在连接器自己的设置里控制。

## 怎么安装

`call-prep` 属于 anthropics/knowledge-work-plugins 的 `sales` 插件，随插件一起安装。Claude Code 里（命令来自仓库 README）：

```bash
claude plugin marketplace add anthropics/knowledge-work-plugins
claude plugin install sales@knowledge-work-plugins
```

Claude Cowork 用户在 claude.com/plugins 页面安装同名插件。装好后技能会在相关场景自动触发，也可以用斜杠命令 `/sales:call-prep` 手动调用。

仓库整体介绍和其他安装方式，详见本站《knowledge-work-plugins 是什么、怎么安装：Anthropic 开源的 11 个岗位插件（销售 / 法务 / 财务 / 数据）》。

## 怎么用

- 「帮我准备明天下午和星河科技的会」。
- 「我三点的电话之前需要知道什么？」
- 「把简报里的探询问题按优先级排一下，只留五个」。

这个技能只有一份 SKILL.md。

## 适合谁 / 局限

适合客户经理、售前和客户成功团队。效果几乎完全取决于连接了哪些数据源：日历、CRM、邮件、通话转录都接上时才是完整简报，一个都没接时只能基于你口头提供的信息；它整理的是已有记录，记录本身不准，简报也不准。

## 注意事项

- **许可**：Apache-2.0。
- **需要连接器授权**：让 Claude 访问你的日历、CRM 和通话记录，按最小必要原则授权，并遵守公司对客户数据的规定。
- **第三方信息**：参会人画像只应基于业务往来中合法获得的信息。
- 不执行脚本。
