---
title: Claude Free、Pro、Max 有什么区别：套餐功能对比（含 Team / Enterprise）
slug: claude-plans-free-pro-max
products: [claude]
models: []
accountTier: FREE
excerpt: 按官方定价页和帮助中心整理 Claude 各套餐的区别：Free 能做什么、Pro 多了哪些功能、Max 5x 和 20x 差在哪、Team 标准 / 高级席位与 Enterprise 的管理能力，以及订阅不含 API、怎么选。不含价格。
checkedOn: 2026-10-07
sources:
  - https://claude.com/pricing
  - https://support.claude.com/en/articles/8325606-what-is-the-pro-plan
  - https://support.claude.com/en/articles/11049741-what-is-the-max-plan
  - https://support.claude.com/en/articles/12004354-purchase-and-manage-seats-on-team-plans
  - https://support.claude.com/en/articles/15424964-claude-fable-models-on-your-plan
  - https://support.claude.com/en/articles/9876003-i-have-a-paid-claude-subscription-pro-max-team-or-enterprise-plans-why-do-i-have-to-pay-separately-to-use-the-claude-api-and-console
verify:
  - 功能对照表取自 2026-10-07 的 claude.com/pricing；定价页顶部提示「Claude Cowork 已并入 Claude、正向 Pro 和 Max 推送」，各功能入口名称以实际界面为准
  - 各套餐每 5 小时 / 每周具体能发多少条消息官方未公开
---

> 本文根据 Claude 官方定价页（claude.com/pricing）和帮助中心整理，核对日期 2026-10-07。本站不列价格，具体价格请以官方页面或应用商店显示为准；套餐和功能可能随时调整。

## 适用于谁

- 在犹豫「Claude 免费版够不够用」「要不要升级 Pro」「Pro 和 Max 差在哪」的人；
- 想给团队开通 Claude、搞不清 Team 和 Enterprise 区别的人；
- 搜「claude free pro max 区别」「claude pro 和 max 区别」「claude team plan」的人。

## 结论先说

1. **Free**：网页、桌面、手机都能聊，能联网搜索、建文件、运行代码、用记忆、连接应用、做 Artifacts，可用 Sonnet 和 Haiku；**最多 5 个项目**，没有 Claude Code、深度研究（Research）、Opus。
2. **Pro**：在 Free 基础上**更多用量**，加上 **Claude Code、Research、Opus 模型、无限项目、Claude Design / Slides / Docs 模板、Claude in Chrome、Microsoft 365 集成**，以及后台交办和定时任务；Fable 模型需用付费的用量额度。
3. **Max**：在 Pro 基础上选择 **5 倍或 20 倍于 Pro 的用量**、所有任务更高的输出上限、新功能和新模型抢先体验、高峰时段**优先访问**；Fable 可用到每周额度的 50%。
4. **Team**（2～150 人）：所有 Claude 功能 + 集中计费管理、SSO、项目共享协作、企业搜索、组织级技能部署、默认不用你的内容训练模型；分**标准席位**和**高级席位**（高级席位用量为标准席位的 5 倍），可混搭。
5. **任何订阅都不包含 Claude API**：API 要在 Claude Console 单独开通付费。

## 一、个人套餐功能对比

以下根据 2026-10-07 的官方定价页整理（✓ 有，— 无）：

| 功能 | Free | Pro | Max 5x | Max 20x |
| --- | --- | --- | --- | --- |
| 网页 / iOS / Android / 桌面版聊天 | ✓ | ✓ | ✓ | ✓ |
| 联网搜索 | ✓ | ✓ | ✓ | ✓ |
| 用代码执行创建、编辑文件 | ✓ | ✓ | ✓ | ✓ |
| Artifacts（作品） | ✓ | ✓ | ✓ | ✓ |
| 记忆 | ✓ | ✓ | ✓ | ✓ |
| 技能（Skills） | ✓ | ✓ | ✓ | ✓ |
| 连接器（Connectors） | ✓ | ✓ | ✓ | ✓ |
| 桌面扩展 | ✓ | ✓ | ✓ | ✓ |
| 语音模式 | ✓ | ✓ | ✓ | ✓ |
| 无痕对话 | ✓ | ✓ | ✓ | ✓ |
| 项目（Projects） | 最多 5 个 | ✓ | ✓ | ✓ |
| Research（深度研究） | — | ✓ | ✓ | ✓ |
| Claude Code | — | ✓ | ✓ | ✓ |
| Claude Design、Slides、Docs 模板 | — | ✓ | ✓ | ✓ |
| Claude in Chrome | — | ✓ | ✓ | ✓ |
| Claude for Microsoft 365 / Outlook | — | ✓ | ✓ | ✓ |
| 用量额度（usage credits，超出后按量付费） | — | ✓ | ✓ | ✓ |
| 高峰时段优先访问 | — | — | ✓ | ✓ |

**模型：**

| 模型 | Free | Pro | Max 5x / 20x |
| --- | --- | --- | --- |
| Haiku、Sonnet | ✓ | ✓ | ✓ |
| Opus | — | ✓ | ✓ |
| Fable | — | 需用量额度 | 每周额度的 50% 以内 |

上下文窗口各套餐都标注为「最高 100 万 token，因模型而异」。官方定价页的「模型训练」一项四个个人套餐都是「Opt-out」（可选择不参与），设置方法详见本站《Claude 隐私设置：模型训练开关、删除对话与删除账号》。

## 二、Pro 和 Max 到底差在哪

帮助中心对 Max 的说明：

- **用量**：Max 5x 是 Pro 的 5 倍、Max 20x 是 Pro 的 20 倍；
- **更少打断**：额度更高，可以做更深入、更长的工作；
- **优先访问**：最先体验新模型、新功能和新产品；
- **更长的多步骤任务**：把报告、表格、演示稿交给 Claude，它会在后台持续完成；
- **计费**：Max 目前只有月付；从低档升到高档按剩余周期折算；从 Pro 年付升到 Max 时，Pro 剩余金额会转为账户余额（需账单地址一致）。

简单判断：**偶尔用、额度够用选 Pro；每天长时间用、经常碰到额度上限、或者大量用 Claude Code / Fable，选 Max**。

Pro 的用量规则（帮助中心）：每 5 小时一个会话额度，另有一个跨所有模型的**每周额度**，每周在固定时间重置；能发多少条消息取决于消息长度、附件大小、对话长度、所用的模型和功能。详见本站《Claude 使用限制与额度：用量怎么看、什么时候重置（Free / Pro / Max / Claude Code）》。

## 三、Team 和 Enterprise

**Team（团队版）**：面向 2～150 人的团队。

- 席位类型：**标准席位**（基础功能、用量和 Claude Code）、**高级席位**（标准席位全部内容 + 更高用量，官方标注为标准席位的 5 倍），可以混搭，例如给重度用户分高级席位；
- 包含：Claude Code 与 Cowork、Design / Slides / Docs、Microsoft 365 等集成、**企业搜索**、**集中计费与管理**、**SSO 单点登录**、远程 / 本地连接器的管理员控制、桌面版企业部署、**默认不用你的内容训练模型**、项目共享协作、使用分析、组织级技能部署；
- 只有 Owner / Primary Owner 能购买席位和查看账单，管理员可以调整成员的席位类型。

**Enterprise（企业版）**：在 Team 全部功能基础上，增加管理员设置个人和组织消费上限、细粒度的基于角色的权限、SCIM、审计日志、合规 API、自定义数据保留、网络级访问控制、IP 白名单、HIPAA 合规方案（可选）等。计费方式是「席位费 + 按 API 价格计算的用量」。

另有面向高校的 **Education（教育版）**，需联系官方。

## 四、订阅不包含 API

帮助中心明确：Claude 付费订阅（Pro / Max / Team / Enterprise）提升的是聊天体验（网页、桌面、手机），**不包含 Claude API 或 Console 的使用权**；两者都要的话，需要分别开通。API 的开通方法详见本站《Claude API Key 怎么获取：Claude Console 创建密钥、充值与用量查看》。

## 五、怎么选

| 你的情况 | 建议 |
| --- | --- |
| 偶尔问问题、写点东西 | Free 先用起来 |
| 天天用、需要 Opus、深度研究、项目管理资料 | Pro |
| 写代码要用 Claude Code | 至少 Pro |
| 一天用好几个小时、Claude Code 重度用户、常碰额度上限 | Max 5x 或 20x |
| 公司团队使用、需要统一管理和 SSO | Team |
| 大型组织，需要审计、SCIM、合规 | Enterprise |

还没有订阅的话，可以在本站开通：[/chongzhi/claude-pro](/chongzhi/claude-pro)。

## 常见问题

**Q：Claude 有学生优惠或折扣码吗？**
帮助中心说明 Pro 和 Max 都**没有常设折扣**，客服也不能单独发优惠券；官方偶尔会做限时活动，通过官方渠道公布。高校可以了解 Education 计划。

**Q：在手机 App 里订阅和网页订阅价格一样吗？**
帮助中心说明网页价格之外，移动端价格可能因应用商店平台而不同；通过 App Store / Google Play 订阅的，付款、发票和取消都在应用商店里管理。

**Q：Pro 能用 Fable 吗？**
能，但 Fable 不计入 Pro 的套餐额度，需要用按量付费的用量额度。Max 和 Team 高级席位可以在每周额度的 50% 以内使用。详见本站《Claude 模型有哪些、有什么区别：Opus、Sonnet、Haiku 怎么选（2026）》。

**Q：Claude 在中国大陆能订阅吗？**
帮助中心说明 Pro 只在部分受支持的地区提供。中国大陆目前不在 Anthropic 支持的国家和地区列表中（https://www.anthropic.com/supported-countries ），请遵守所在地法律和服务条款。

## 参考资料

- Claude 定价与套餐对比（官方）：https://claude.com/pricing
- What is the Pro plan?（帮助中心）：https://support.claude.com/en/articles/8325606-what-is-the-pro-plan
- What is the Max plan?（帮助中心）：https://support.claude.com/en/articles/11049741-what-is-the-max-plan
- Purchase and manage seats on Team plans（帮助中心）：https://support.claude.com/en/articles/12004354-purchase-and-manage-seats-on-team-plans
- Claude Fable models on your plan（帮助中心）：https://support.claude.com/en/articles/15424964-claude-fable-models-on-your-plan
- 为什么付费订阅还要单独为 API 付费（帮助中心）：https://support.claude.com/en/articles/9876003
