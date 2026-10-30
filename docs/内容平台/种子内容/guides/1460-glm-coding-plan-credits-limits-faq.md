---
title: 智谱 GLM Coding Plan 是什么：Lite、Pro、Max 三档积分额度、5 小时与每周限额、能在哪些工具用、退款和取消
slug: glm-coding-plan-credits-limits-faq
products: [ai-tools]
models: []
accountTier: OTHER
excerpt: GLM Coding Plan 是智谱推出的编程订阅套餐，按积分计量，设每 5 小时和每周两层上限。本文按智谱开放文档讲清 Lite、Pro、Max 的积分额度、非高峰时段 50% 抵扣、可用模型与工具、哪些场景不能用套餐额度，以及取消续费、退款政策和账号规范。
checkedOn: 2026-10-31
sources:
  - https://docs.bigmodel.cn/cn/coding-plan/overview
  - https://docs.bigmodel.cn/cn/coding-plan/faq
  - https://docs.bigmodel.cn/cn/coding-plan/usage-notes
  - https://docs.bigmodel.cn/cn/coding-plan/notice/usage-revision
verify:
  - 套餐价格官方文档没有列在这几页，以套餐订阅页（bigmodel.cn/glm-coding）显示为准，本文不写价格
  - 官方 2026 年 7 月 30 日改为积分制，历史 V1、V2 套餐的额度与价格规则不同，本文只讲新版，老用户权益见官方公告
  - 积分抵扣系数、模型列表、高峰时段都是文档当天内容，官方可能随时调整
---

> 本文根据智谱开放文档（docs.bigmodel.cn）的 GLM Coding Plan 套餐概览、常见问题、使用须知和老用户权益说明整理，资料核对于 2026-10-31。积分数字和规则以官方页面为准。配图为本站整理的示意图，不是网页截图。

## 适用于谁

- 搜「智谱清言 coding plan」「GLM Coding Plan 是什么」「GLM 套餐额度」的人；
- 在用 Claude Code、Codex 等编程工具，想知道智谱的套餐能不能接进去的人。

## 结论先说

1. **GLM Coding Plan 是智谱的编程订阅套餐**，官方描述为覆盖从代码生成、调试修复到任务自主拆解与交付的全流程，Coding 与 Work 一套搞定。它面向开发者，不是智谱清言（聊天网页）的会员。
2. **按积分计量**：套餐有 Lite、Pro、Max 三档，每档同时设**每 5 小时**和**每周**两层上限。
3. **所有套餐支持 GLM-5.3 和 GLM-5.3-Flash**；调用历史模型 GLM-5.2、GLM-5.1 会自动切到 GLM-5.3，调用 GLM-5-Turbo、GLM-4.7 会自动切到 GLM-5.3-Flash。
4. **只能在官方指定的工具里用套餐额度**。在自己的网站、App、机器人、SaaS 里调用，不享受套餐额度，要用智谱标准 API 并按量计费。
5. **订阅不支持退款**，取消自动续费要在下一个扣费日**至少 3 天前**操作。价格以订阅页为准（2026-10 查询）。

![GLM Coding Plan 个人套餐额度](seed:g1460-plans-compare.png)
*图：本站根据 [智谱开放文档：套餐概览](https://docs.bigmodel.cn/cn/coding-plan/overview) 与 [使用须知](https://docs.bigmodel.cn/cn/coding-plan/usage-notes) 整理的示意图*

## 一、额度怎么算

个人套餐额度（2026-10 查询）：

| 套餐 | 5 小时积分 | 每周积分 |
| --- | --- | --- |
| Lite | 2,000 | 10,000 |
| Pro | 12,000 | 60,000 |
| Max | 28,000 | 140,000 |

**刷新规则**：

- 5 小时积分是动态刷新：请求消耗的积分在 5 小时后恢复；
- 每周积分：从下单时起，以 7 天为一个周期刷新；
- 升级套餐后，积分按新档位立即刷新；续费不会重置积分，原有刷新周期不变。

**怎么抵扣**：模型消耗的积分 =（输入 Token × Input 系数 + 缓存命中 Token × Cached Input 系数 + 输出 Token × Output 系数）÷ 10000。官方给的系数里，GLM-5.3 的 Input、Cached Input、Output 分别是 6.9、1.7、24，GLM-5.3-Flash 分别是 2.3、0.56、8；联网搜索、网页读取、开源仓库等 MCP 工具按调用次数乘以 1.2。

**非高峰时段打五折**：非高峰时段内，模型调用按基础积分消耗的 50% 抵扣。官方写明高峰时段是**每周一至周五 14:00 至 18:00（北京时间）**，其余时间是非高峰。官方的老用户公告还说，周末全天按非高峰抵扣。

可以在智谱控制台的「用量统计」里看额度消耗进度。

## 二、能在哪里用

- 套餐仅限在**官方支持的指定工具与产品环境**中使用，官方举的例子包括 ZCode、AutoClaw、Claude Code、Codex、OpenCode、WorkBuddy 等；具体名单以官方「接入工具」页面为准；
- 套餐**支持 OpenClaw**，但采用次级调度和尽力交付：Coding Agent 任务享有资源抢占优先权，高负载下 OpenClaw 任务会触发排队、限流；
- 视觉理解、联网搜索、网页读取、开源仓库这些 MCP 工具，所有等级的套餐都支持，并和模型共享套餐额度；
- 订阅后，按官方接入指南在工具里配置即可使用额度；通用 API 的接入方式不同，见 [/guides/zhipu-glm-api-quickstart](/guides/zhipu-glm-api-quickstart)。

![GLM Coding Plan：用之前想清楚](seed:g1460-decide.png)
*图：本站根据 [智谱开放文档：常见问题](https://docs.bigmodel.cn/cn/coding-plan/faq) 与 [使用须知](https://docs.bigmodel.cn/cn/coding-plan/usage-notes) 整理的示意图*

## 三、额度用完、并发、共享

- **额度用完**：需要等下一个 5 小时周期恢复，**系统不会继续消耗你的其他资源包或账户余额**；
- **并发**：与套餐等级相关，基本原则是 Max > Pro > Lite。官方推荐 Lite 同时进行单个项目的开发，Pro 同时 1 至 2 个，Max 2 个以上；低峰期并发权益会动态提升；
- **不能共享**：套餐为订阅人专享，多人共用一个套餐可能被视为不当使用，官方会限制订阅权益，严重时影响账号。官方还说明，涉及倒卖、中转、套利等严重违规行为，才会执行永久封禁；
- **额度重置卡**：是官方在活动期间发放的权益，不是标准权益，可在用量统计页面查看；
- **体验卡**：每张包含 2,000 积分，可用于 GLM-5.3、GLM-5.3-Flash 及相关能力，用完后本次体验结束。

## 四、订阅管理

| 事项 | 官方说明 |
| --- | --- |
| 扣费顺序 | 优先赠金余额，其次现金余额，再从绑定的第三方支付方式（如微信、支付宝）扣款 |
| 取消自动续费 | 套餐概览页取消，**至少在下一个扣费日前 3 天**；取消后当前周期继续有效 |
| 升级 | 在订阅管理里选「订阅升级」，支付差额，新套餐立即生效 |
| 退款 | 订阅一经购买即视为确认，**不支持退款**，即使没用完 |
| 账单 | 财务中心的费用账单，切到费用明细可看不同类型 Token 数和调用次数 |

## 常见问题

**Q：它和智谱清言的会员是一回事吗？**
官方文档把它定位为「专为大模型调用打造的订阅套餐」，额度只能在指定的编程工具里用，并在智谱开放平台（bigmodel.cn）的控制台管理。智谱清言聊天产品的会员规则，官方这几页没有写，以智谱清言官方页面为准。

**Q：和 Kimi 的编程会员比怎么选？**
两家的计量方式不同，Kimi 的见 [/guides/kimi-k3-coding-plan-kimi-code](/guides/kimi-k3-coding-plan-kimi-code)，工具之间的对比见 [/guides/ai-coding-tools-codex-claude-code-cursor-gemini](/guides/ai-coding-tools-codex-claude-code-cursor-gemini)。

**Q：我用 ChatGPT 或 Claude 订阅，需要它吗？**
各家独立计费。ChatGPT 开通见 [/chongzhi/chatgpt-plus](/chongzhi/chatgpt-plus)，Claude 见 [/chongzhi/claude-pro](/chongzhi/claude-pro)。

**Q：旧版套餐用户怎么办？**
官方 2026 年 7 月 30 日的公告写明：已订阅用户的权益、额度及计算方式不受影响，可使用到当前周期结束；V1 用户在到期前可按调整前的 V2 价格订阅。详情看官方公告。

## 参考资料

- 智谱开放文档：套餐概览 — https://docs.bigmodel.cn/cn/coding-plan/overview
- 智谱开放文档：常见问题 — https://docs.bigmodel.cn/cn/coding-plan/faq
- 智谱开放文档：使用须知 — https://docs.bigmodel.cn/cn/coding-plan/usage-notes
- 智谱开放文档：老用户权益说明 — https://docs.bigmodel.cn/cn/coding-plan/notice/usage-revision

更多 AI 会员开通可看 [/chongzhi](/chongzhi)。
