---
title: GitHub Copilot 免费版与 Pro、Pro+、Max 的区别：AI credits 额度怎么算、怎么查、用完了怎么办
slug: github-copilot-free-pro-ai-credits
products: [github-copilot]
models: []
accountTier: FREE
excerpt: GitHub Copilot 免费额度有多少、Pro 和 Pro+ 差在哪？按 GitHub 官方文档（2026-10-11）讲清按 AI credits 计费的规则、各档价格与每月额度、哪些功能扣 credits、每月 1 日重置、额度用完的三条路和遇到限流怎么办。
checkedOn: 2026-10-11
sources:
  - https://docs.github.com/en/copilot/get-started/plans
  - https://docs.github.com/en/copilot/concepts/billing-and-usage/individuals/billing
  - https://docs.github.com/en/copilot/concepts/billing-and-usage/individuals/usage-limits
  - https://docs.github.com/en/copilot/concepts/agents/code-review
  - https://code.visualstudio.com/docs/copilot/setup
verify:
  - Copilot Free 与 Copilot Student 每月 AI credits 的具体数量官方未给数字
  - 弹性额度（flex allotment）官方说明会随模型价格等因素调整，表中数字只代表核对当天
  - 额外用量「可能有上限」的具体阈值官方未公布
  - 价格为官方文档标注的美元月价，是否含税、年付价格以结算页为准
---

> 本文根据 GitHub 官方文档《Plans for GitHub Copilot》《Usage-based billing for individuals》整理，**价格与额度核对于 2026-10-11**。网上很多文章还在讲「premium requests（高级请求次数）」，官方文档现在的计量单位是 **GitHub AI Credits**，请以账号里显示的为准。本站不销售 GitHub Copilot 订阅。

## 适用于谁

- 想知道 Copilot 免费版够不够用、要不要升 Pro 的人；
- 搜「github copilot 免费额度」「github copilot pro 和 pro+ 区别」「github copilot 额度用完了怎么办」的人；
- 月中突然提示额度耗尽的人。

## 结论先说

1. Copilot 现在**按用量计费**：每次交互按模型和 token 数折算成 **AI credits**，1 credit = 0.01 美元。
2. 每个档位每月送一笔 credits；**代码补全和「下一处编辑建议」不扣 credits**，付费档不限量。
3. 额度在**每月 1 日 00:00（UTC）重置**，与你的订阅扣款日无关；没用完的**不结转**。
4. 用完了有三条路：升级（只补差价）、设预算买额外用量、等下月重置。
5. Free 和 Student 档只能用**自动选模型**；想自己挑模型至少要 Pro。

## 各档对比（官方 2026-10-11 页面）

| 档位 | 月价 | 每月 AI credits | 代码补全 | 模型 | Agents |
| --- | --- | --- | --- | --- | --- |
| Copilot Free | 免费 | 有一定额度（未公布数字） | 每月 2000 次 | 仅自动选模型 | 有限 |
| Copilot Student | 免费（需学生认证） | 有一定额度（未公布数字） | 不限量 | 仅自动选模型 | 包含，不含第三方智能体 |
| Copilot Pro | 10 美元 | 1,500（基础 1,000 + 弹性 500） | 不限量 | 可选一批模型 | 包含 |
| Copilot Pro+ | 39 美元 | 7,000（基础 3,900 + 弹性 3,100） | 不限量 | 可用高级模型 | 包含 |
| Copilot Max | 100 美元 | 20,000（基础 10,000 + 弹性 10,000） | 不限量 | 优先使用高级模型 | 包含 |

组织用的 Copilot Business 为每席位 19 美元 / 月（每人每月 1,900 credits），Copilot Enterprise 为每席位 39 美元 / 月（每人每月 3,900 credits）。官方注明所有档位都包含 Copilot CLI 和 Copilot app。

**基础额度与弹性额度**：基础额度（base credits）等于订阅价对应的 credits，固定不变；弹性额度（flex allotment）是额外赠送的一块，官方说明它会随模型价格、新模型和效率变化而调整。先扣基础、再自动扣弹性，无需设置。

## 哪些功能扣 credits

**扣**：Copilot Chat、Copilot CLI、Copilot cloud agent、Copilot Spaces、Spark、第三方编程智能体，以及代码审查（每次审查都消耗 credits）。

**不扣**：代码补全、next edit suggestions。

影响消耗的三个因素，官方列得很清楚：

- **对话长度和复杂度**：越长、越复杂，来回越多；
- **智能体功能**：Agent 模式和 cloud agent 一个任务里会多次调用模型，在大代码库里跑一次复杂会话，远比聊天里问一句贵；
- **模型**：能力强的推理模型单价更高，换便宜的模型是延长额度最直接的办法。

付费档还有一条小优惠：在 Chat、CLI、Copilot app 或 cloud agent 里使用**自动选模型**时，模型费用打九折。

## 怎么查用量

- **VS Code**：点状态栏的 Copilot 图标打开状态面板，能看到本月额度用了多少；
- **GitHub 网站**：账号的用量 / 计费页面显示可用额度和已用量；
- 官方建议把 IDE 和插件升到最低版本以上（VS Code 1.120、JetBrains 插件 1.9.1、Copilot CLI 1.0.48 等），旧版本可能显示不准确的用量和价格。

## 额度用完了怎么办

官方给个人用户三个选项：

1. **升级档位**。接近上限时 Copilot 会提示升级。升级只收**两档之间的差价**，不是新档全价；本周期已经用掉的量算在新档更大的额度里，多出来的 credits 立即可用。
2. **留在当前档，设预算买额外用量**。预算以美元设置，按 1 credit = 0.01 美元扣（10 美元预算 = 1,000 credits）。官方提醒额外用量**可能有上限**：到了上限，要先把已经产生的额外用量结清才能继续。
3. **等下个月**。每月 1 日 UTC 零点恢复到满额。

通过公司的 Business / Enterprise 使用 Copilot 的，credits 用完后会在 GitHub.com 上看到横幅，可以向管理员申请更多预算。

预算在 GitHub 的 Billing 设置里配置。**不设预算就不会产生订阅以外的费用**——额度用完后相关功能暂停，补全照常。

## 遇到「限流」不等于额度用完

官方把两件事分开讲：

- **Rate limit（限流）**：为了容量、公平和防滥用，对一段时间内的请求数做的临时限制。热门模型和功能在高峰期更容易触发。处理办法：等一会儿再试；检查自己是不是在高频或自动化地发请求；个人档可以升级。
- **Usage limit（额度）**：本月 credits 用完，见上一节。

## 怎么选

- **只想要补全、偶尔问两句**：Free 先用着，补全每月 2000 次；在读学生走[学生认证](/guides/github-copilot-student-verification)。
- **日常聊天 + 偶尔 Agent**：Pro。
- **每天用 Agent、cloud agent，或想用高级模型**：Pro+；长期高强度使用再看 Max。
- 这只是按官方额度做的粗略对应，不是消费建议。更稳妥的做法是先用一个月，看用量页面的实际数字再决定。

## 常见问题

**Q：我已经有个人 Pro，公司又给我分配了席位？**
官方说明个人订阅会被自动取消，并按剩余时间退还当期费用，之后按公司的策略使用。

**Q：取消订阅什么时候生效？**
随时可以取消，到当前计费周期结束时生效。

**Q：扣款日是哪天？**
之前没有在 GitHub 付过费的，多数情况下从订阅当天开始算周期；已有计费周期的，Copilot 会并入下一张账单，首期按比例收取。注意：扣款日和 credits 重置日（每月 1 日）是两回事。

## 参考资料

- Plans for GitHub Copilot（GitHub 官方）：https://docs.github.com/en/copilot/get-started/plans
- Usage-based billing for individuals（GitHub 官方）：https://docs.github.com/en/copilot/concepts/billing-and-usage/individuals/billing
- Usage limits for GitHub Copilot（GitHub 官方）：https://docs.github.com/en/copilot/concepts/billing-and-usage/individuals/usage-limits
- About GitHub Copilot code review（GitHub 官方）：https://docs.github.com/en/copilot/concepts/agents/code-review
