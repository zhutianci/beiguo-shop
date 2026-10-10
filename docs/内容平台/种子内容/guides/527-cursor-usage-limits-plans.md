---
title: Cursor 额度与套餐：免费版和 Pro 有什么区别、额度怎么看、什么时候重置、用完了怎么办
slug: cursor-usage-limits-plans
products: [cursor]
models: []
accountTier: PLUS
excerpt: Cursor 收费标准与额度规则（官方 2026-10-11 版）：Hobby / Pro / Pro Plus / Ultra 的区别、两个用量池怎么扣、在哪查剩余额度、每月何时重置、用完后按量付费还是升级、怎么设消费上限，以及学生优惠的现状。
checkedOn: 2026-10-11
sources:
  - https://cursor.com/docs/models-and-pricing
  - https://cursor.com/help/account-and-billing/pricing
  - https://cursor.com/help/models-and-usage/usage-limits
  - https://cursor.com/help/account-and-billing/overages
  - https://cursor.com/help/account-and-billing/refunds
  - https://cursor.com/help/account-and-billing/student-discount
verify:
  - 各档「包含用量」的具体美元额度，官方文档当天没有给出数字，只说 Pro Plus / Ultra 包含更多
  - Hobby 免费档 Agent 请求与 Tab 补全的月度上限官方未公布具体数字
  - 价格均为官方页面标注的税前美元月付价，实际扣款金额以结算页为准
---

> 本文根据 Cursor 官方文档《Models & Pricing》和帮助中心计费相关页面整理，**所有价格与规则核对于 2026-10-11**。Cursor 的计费方式近两年改过多次，请以你账号 Dashboard 里显示的为准。本站不销售 Cursor 订阅；官方说明 Cursor 订阅只在 cursor.com 直接销售。

## 适用于谁

- 想知道「Cursor 免费能用多少、要不要升 Pro」的人；
- 搜「cursor 额度查看」「cursor 额度重置」「cursor 额度用完了怎么办」「cursor 收费标准」的人；
- 账单里出现订阅费以外的扣款，想弄清楚怎么回事的人。

## 结论先说

1. **按用量计费，不是按次数**。付费档每月包含一笔用量，分成两个池：**Cursor Models**（Grok 4.7 / 4.6 / 4.5、Composer 2.5）和 **Other Models**（第三方模型，按模型 API 价扣）。选的模型越贵，额度掉得越快。
2. **在哪看**：cursor.com/dashboard 的 **Spending** 页，实时显示两个池的用量、剩余额度和按量扣费；编辑器设置里也能看到。
3. **什么时候重置**：跟着你的**计费周期每月重置**，用不完不结转，重置日期显示在 Spending 页。
4. **用完了**：编辑器里会弹通知。两个选择——开启**按量付费（on-demand）**继续用，或升级套餐。个人档的按量付费**默认关闭，要自己手动开**。
5. 官方承诺：超出后请求**不会被降速或降质**；按量部分按同样的 API 价计，不加价。
6. **学生优惠**：旧的学生折扣已于 2026-06-25 停止新申请。

## 各档位（官方 2026-10-11 页面）

| 档位 | 官方标价 | Cursor Models 池 | Other Models 池 | 说明 |
| --- | --- | --- | --- | --- |
| Hobby | 免费 | — | — | 核心功能可用但用量有限；可用 Agent、对话和 Tab，模型为 Auto |
| Pro | 20 美元 / 月 | 包含 | 包含 | Tab 补全不限量、更高的 Agent 用量、Bugbot、云端 Agent |
| Pro Plus | 60 美元 / 月 | 包含 | 包含 | 同上，包含用量更多 |
| Ultra | 200 美元 / 月 | 包含 | 包含 | 同上，包含用量最多 |
| Teams Standard | 40 美元 / 人 / 月 | 包含 | 包含 | 集中计费与管理、团队隐私模式、SSO 等 |
| Teams Premium | 120 美元 / 人 / 月 | 包含 | 包含 | Agent 上限为 Standard 的 5 倍 |

另有只面向印度开发者的 Start 档（只含 Cursor Models 池），以及需要联系销售的 Enterprise。

官方给的选档参考（按每月**总用量**估算）：

- 主要用 Tab 补全：通常不会超出包含用量；
- 偶尔用 Agent：多数不会超出；
- 每天用 Agent：总用量通常在 60–100 美元 / 月；
- 重度用户（多个 Agent 并行、自动化）：常常 200 美元 / 月以上。

## 额度是怎么被扣的

- 用 **Grok、Composer** → 扣 Cursor Models 池。官方说这个池子给的量「明显更多」。
- 直接选 **Claude、GPT、Gemini** 等 → 按该模型的 API 标价扣 Other Models 池。
- 用 **Auto** → 按实际路由到的模型计费，路由到第三方模型就扣 Other Models 池。
- **子代理**可能跑指定的第三方模型，即使主对话选的是 Auto 或 Grok，这部分也从 Other Models 池扣。
- 个人档**自带 API Key** 的请求不占任何一个池，由模型提供方直接向你收费。
- 付费档的 **Tab 补全不限量**，不在两个池里。

所以最直接的省额度办法就是官方写的那条：**日常用 Cursor Models 池里的模型**，难题再换第三方旗舰。模型怎么选见[《Cursor 模型选择》](/guides/cursor-model-selection-auto)。

## 怎么查额度

1. 打开 cursor.com/dashboard；
2. **Spending** 页：两个池的实时用量、剩余额度、重置日期、按量扣费；
3. **Billing & Invoices**：分成 Included Usage（订阅内）和 On-Demand Usage（订阅外扣费）两块，按量部分有单独的发票和明细。

## 用完了怎么办

| 做法 | 效果 | 注意 |
| --- | --- | --- |
| 换用 Cursor Models 池 | 如果只是 Other Models 池见底，Grok / Composer 还能继续用 | 两个池分开计 |
| 开启按量付费 | 立刻继续，按同样的 API 价后付费 | 个人档要在消费设置里手动开启；**建议同时设消费上限** |
| 升级套餐 | 获得更多包含用量，立即生效 | 旧档未用完的包含用量会折算抵扣，与剩余天数无关 |
| 等重置 | 下个计费周期恢复 | 不结转 |

**设消费上限（spend limit）**：在消费设置里给按量付费设一个本周期封顶金额。官方提醒两点：拦截不是瞬时的，用量可能短暂超过上限，超出的那一小部分会以临时额度抵掉；但如果你在同一周期内调高上限，这部分可能被重新计费。

不想有任何额外扣款，就**保持按量付费关闭**——额度用完后请求会停止，直到下个周期。

## 升级、降级与退款

- **升级**：dashboard/billing → 当前套餐卡片上的 **Adjust plan** → 选新档 → 通过 Stripe 结算，立即生效。
- **降级**：同一入口，确认后点 **Schedule Downgrade**，当前档用到本周期结束。
- **自动续费**：付费档到期自动续费，取消只停止以后的扣款。
- **退款**（个人档）：官方条件是最近一次订阅扣款发生在 14 天内，且该周期内**没有使用过**订阅；两条都满足才可能退。周期中途降级不按比例退款。

## 学生优惠还有吗

官方帮助页写明：旧的学生折扣已在 2026-06-25 停止新申请，原因是该项目成了欺诈的目标。已经领过的人，原价格保持到当期到期，之后按常规 Pro 价格续费。官方现在的说法是：本科生可以在校园和线上活动里领取额度与折扣；硕士、博士、研究人员和教师可以填官方表单申请额度。网上各种「学生认证教程」「学生账号」大多已经过时，也不要购买来路不明的账号。

## 常见问题

**Q：免费版和付费版到底差在哪？**
免费 Hobby 档 Agent 和 Tab 都有月度限额、能选的模型少；付费档 Tab 不限量、Agent 用量更高、能用全部模型，并包含 Bugbot 和云端 Agent。

**Q：为什么 Cursor Router 上线后花得更快？**
官方解释：新的 Auto 模式都按路由到的模型标价计费。原来用旧 Auto 的用户会被默认放到 Auto 的 **Cost** 模式；如果你手动切到了 Balance 或 Intelligence，消耗会更快。

**Q：团队成员的额度什么时候重置？**
所有成员按团队的计费周期同时重置。

## 参考资料

- Models & Pricing（官方）：https://cursor.com/docs/models-and-pricing
- Pricing and plans（官方帮助中心）：https://cursor.com/help/account-and-billing/pricing
- Usage and limits（官方帮助中心）：https://cursor.com/help/models-and-usage/usage-limits
- Usage-based charges（官方帮助中心）：https://cursor.com/help/account-and-billing/overages
- Refunds（官方帮助中心）：https://cursor.com/help/account-and-billing/refunds
- Student discount（官方帮助中心）：https://cursor.com/help/account-and-billing/student-discount
