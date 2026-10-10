---
title: Gemini API 怎么收费：按 token 计费、预付费充值（Prepay）与支出上限设置
slug: gemini-api-billing-prepay
products: [gemini]
models: [gemini-llm]
accountTier: OTHER
excerpt: Gemini API 按 token 计费，新用户默认预付费：先买额度再扣费，余额为 0 时密钥全部停用。本文讲清计费项目、开通结算步骤、预付与后付的区别、自动充值、支出上限和去哪看账单。
checkedOn: 2026-10-10
sources:
  - https://ai.google.dev/gemini-api/docs/billing
  - https://ai.google.dev/gemini-api/docs/pricing
  - https://ai.google.dev/gemini-api/docs/rate-limits
  - https://ai.google.dev/gemini-api/terms
  - https://ai.google.dev/gemini-api/docs/api-errors
  - https://ai.google.dev/gemini-api/docs/thinking
  - https://ai.google.dev/gemini-api/docs/google-search
  - https://ai.google.dev/gemini-api/docs/google-ai-plans
  - https://blog.google/innovation-and-ai/technology/developers-tools/prepay-gemini-api/
  - https://blog.google/innovation-and-ai/technology/developers-tools/more-control-over-gemini-api-costs/
verify:
  - 本文没有写任何模型的 token 单价，价格以官方定价页为准；正文出现的美元数字只有预付费最低 / 最高充值额和各档位每月账单上限，均为 Billing 页原文的限额数字，如站内规则不允许出现金额可删
  - 预付费能否切换到后付费，Billing 页自相矛盾：正文和 Refunds 一节写「满足条件后可手动升级为 Postpay，余额自动退回」，FAQ 里又写「不支持从 Prepay 切换到 Postpay」；官方博客（2026-04-15）写的是升到较高档位后可以选择切换。正文如实写出两种说法
  - 支持哪些付款方式（信用卡种类、各国家或地区是否可开通结算）官方 Billing 页没有列出，以开通结算时界面显示为准
  - Billing 页写最低充值 5 美元、最高 5,000 美元，FAQ 又写「界面会显示你所在地区和档位要求的最低金额及账户内可持有的最高金额」，实际以购买界面为准
  - 支出上限截图来自 2026-03-16 官方博客，图中金额是示例账号的数据
---

> 本文根据 Gemini API 官方文档（Billing、Pricing、Rate limits、Additional Terms of Service）和 Google 官方博客整理，资料核对于 2026-10-10。本文不抄录价格数字，各模型单价请直接看官方定价页。

## 适用于谁

- 准备从免费层升级到付费、想先弄清楚钱是怎么扣的人；
- 搜「gemini api 怎么收费」「怎么充值」「prepay」的人；
- 担心跑脚本时费用失控，想设置上限的开发者。

## 结论先说

1. **按 token 计费**：输入 token、输出 token（含思考 token）、缓存的 token 及其存储时长，是官方列出的四个计费项。
2. **新用户默认是预付费（Prepay）**：先买额度，调用费用近乎实时地从余额里扣；后付费（Postpay）是按月结算，需要符合条件才能选。
3. **预付费余额归零时，这个结算账号下所有项目的所有 API 密钥同时停用**，请求返回 HTTP 402，充值后才恢复；项目不会自动降回免费层。
4. **能设两层上限**：自己给单个项目设的每月支出上限，以及官方按档位给整个结算账号设的每月上限。两者都有大约 10 分钟的延迟，可能小幅超支。
5. **价格只看官方定价页**（ai.google.dev/gemini-api/docs/pricing），不同模型、不同调用方式价格不同，而且会调整。

## 一、哪些东西收费

官方账单页 FAQ 列出的计费依据：

- **输入 token 数**；
- **输出 token 数**——定价页的表头写的是「输出价格（含思考 token）」，Thinking 文档也说明开启思考时，输出费用是输出 token 与思考 token 之和；
- **缓存的 token 数**；
- **缓存 token 的存储时长**。

除此之外：

- **工具另计**：以 Google 搜索接地为例，官方说明 Gemini 3 及更新的模型按模型实际执行的每次搜索查询计费，一个问题可能触发多次搜索。代码执行本身不额外收费，但生成的代码和运行结果会计入 token。
- **调用方式影响价格**：定价页上同一个模型分 Standard（标准）、Batch（批量）、Flex、Priority 几张表，价格不同。
- **失败的请求**：返回 400 或 500 错误的请求不收 token 费用（但仍计入配额）。
- **统计 token 的请求不收费**，也不占推理配额。

想省钱，最直接的是选更小的模型、调低思考等级、缩短上下文。免费层能用什么见本站《Gemini API 免费额度是多少：免费层级、RPM / TPM / RPD 速率限制与限额查询》。

## 二、开通结算（从免费层到付费层）

官方账单页的步骤：

1. 打开 AI Studio 的 **API keys** 或 **Projects** 页面，或者任何出现「设置结算（Set up billing）」按钮的地方。
2. 找到要升级的免费层项目，在「Billing Tier」一列点 **Set up billing**。
3. 第一次开通：选择国家或地区并同意服务条款，填写或确认联系信息和付款方式。以前开过 Google 结算账号的，可以从已有账号里选，或点「Add new billing account」新建。
4. 接下来会出现三种情况之一：要求**预付至少 5 美元**完成开通（即被分配到预付费方案）；让你在预付费和后付费之间选择；或者在新系统铺开之前暂时被分配到后付费。
5. 预付或选好方案后，开通完成，项目进入 Tier 1。

官方说明，Gemini API 的计费用的是 Google Cloud 的结算账号（Cloud Billing account），只是可以直接在 AI Studio 里完成设置。**档位、速率限制和账单上限都是按结算账号确定的**，挂在同一个结算账号下的项目共享这些属性；API 密钥没有独立的计费设置。

关于新用户赠金，官方写得很明确：Google Cloud 新用户的欢迎赠金（Welcome credit）和免费试用额度，**不能用于 Gemini API 和 AI Studio**（2026 年 3 月之前已获得赠金的账号可用到赠金到期）。

## 三、预付费（Prepay）怎么运作

- **买额度**：在 AI Studio 的 **Billing** 页面点「购买额度（Buy credits）」。官方写的是最低 5 美元，最多可预付 5,000 美元。
- **扣费**：调用产生的费用近乎实时地从余额扣除，通常几分钟内反映出来。
- **有效期**：额度自购买起 12 个月后过期，过期作废。
- **不退款**：官方写明预付费额度不可退款（切换账号类型时除外，见下文）。关闭预付费账号时剩余额度作废。
- **只能用于 Gemini API**：不能拿来付其他 Google Cloud 服务的费用。
- **余额为 0**：这个结算账号下所有项目的所有密钥同时停止工作，请求返回 **HTTP 402**，直到充值。官方特别说明项目不会自动降级到免费层；想回免费层，要手动停用项目的结算。
- **可能出现负数余额**：计费管道大约有 10 分钟延迟，批处理、智能体这类长时间任务可能在系统来得及停用之前多消耗一些。负数部分会从下次充值里扣掉。

**自动充值（Auto-reload）**：在 Billing 页面的「Available credits」卡片里设置，指定「余额低于多少时触发」和「每次充多少」。为了防止自动充值次数过多，还可以设**每月自动扣款上限（Monthly Limit）**：当月自动充值总额达到上限后，自动充值暂停到下个月；你手动发起的充值不算在内。

一个容易踩的坑：结算账号如果同时用于其他 Google Cloud 服务（后付费），那边出现欠费、扣款被拒或付款方式失效，**Gemini API 也会被暂停，不管预付余额还剩多少**。

## 四、后付费（Postpay）

后付费是先用后结：费用累计在结算账号上，月底自动扣款，或者在费用达到档位对应的上限时扣款。官方说明：

- 开通结算时，符合条件的账号才会看到后付费选项；新用户默认是预付费。发票结算（Invoiced / Offline）类型的账号不能用预付费。
- AI Studio 正在把开发者账号从后付费迁移到预付费（只影响 Gemini API，同一结算账号下的其他云服务不变）。收到通知的账号要在通知写明的切换日期前改用预付费并充值，否则服务会中断；只用免费层功能的账号不用处理。操作是在 Billing 页面点「Switch to Prepay」，再购买额度。
- 反过来从预付费换到后付费，官方页面有两种说法：一处写满足条件后可以手动升级，预付余额自动退回原付款方式；FAQ 里又写不支持这种切换。以你在 Billing 页面实际看到的选项为准。

## 五、支出上限：两层保护

![AI Studio 的 Spend 页面：顶部是「每月支出上限（Monthly spend cap）」和修改按钮，下方是按时间段的费用统计（2026 年 3 月官方博客配图，金额为示例）](seed:g451-spend-cap.jpg)
*图片来源：[Google 官方博客《Giving you more transparency and control over your Gemini API costs》](https://blog.google/innovation-and-ai/technology/developers-tools/more-control-over-gemini-api-costs/)*

**1. 项目支出上限（你自己设）**

在 AI Studio 的 **Spend** 页面（aistudio.google.com/spend），找到「Monthly spend cap」→「Edit spend cap」，为每个项目设一个每月金额上限，需要项目的编辑者、所有者或管理员角色。官方标注这项功能是**实验性**的，要点：

- 设定后一直有效，直到你修改或关闭；
- 有大约 10 分钟的数据延迟，这段时间里的超支由你承担；
- 批处理、智能体会话等长任务可能超出上限。

**2. 结算账号档位上限（官方设）**

每个使用档位有一个每月支出上限，按整个结算账号下所有项目的 Gemini API 费用合计。官方表格（美元）：

| 档位 | 每月上限 |
| --- | --- |
| Free | 不适用 |
| Tier 1 | 250 |
| Tier 2 | 2,000 |
| Tier 3 | 20,000 至 100,000 |

合计达到上限后，该结算账号下所有项目的服务会暂停，到下个计费周期（每月 1 日）恢复。可以通过官方表单申请提高。所以会出现「预付余额还有钱，调用却停了」的情况——官方 FAQ 的解释正是撞到了当前档位的用量上限。

## 六、去哪里看用量和账单

| 想看什么 | 去哪里 |
| --- | --- |
| 请求量、token 用量 | AI Studio → Dashboard → Usage |
| 预付余额、充值记录、付款方式 | AI Studio → Billing（官方说明余额只能在这里管理） |
| 每个项目花了多少、支出上限 | AI Studio → Spend |
| 项目的档位和结算状态 | AI Studio → Projects，「Billing Tier」和「Status」两列 |
| 和其他云服务合并的费用报表 | Google Cloud 控制台的 Billing 报表（可能延迟一天以上） |

Projects 页面会直接提示需要处理的状态：没绑结算账号显示「Set up billing」，绑了但需要设置预付费显示「Set up Prepay」，余额用完或预付账号没设好显示「No credits」，点进去按提示操作即可。

官方给出的处理时效：扣费通常几分钟内体现；多数银行卡付款即时到账，银行转账等方式可能要几天，到账确认后服务才恢复或升档；升档一般 10 分钟内生效；Billing 和 Spend 页面的费用分解图最长可能延迟 24 小时。

## 常见问题

**Q：开通结算后，在 AI Studio 网页里聊天也要收费吗？**
官方的说法是 AI Studio 的使用保持免费，除非你关联了付费的 API 密钥去用付费功能；关联后，这把密钥在 AI Studio 里的用量按付费计。可以在付费项目和免费项目的密钥之间切换。

**Q：开通付费后，我的数据还会被用来训练吗？**
按服务条款，付费服务不会用你的提示和回复来改进 Google 的产品。官方还说明，只要账号下至少有一个开通了结算的项目，你在 AI Studio 里的提示也按付费服务的条款处理。

**Q：Google AI Pro / Ultra 会员包含 API 额度吗？**
不包含。官方写明订阅权益只在 AI Studio 网页内有效，直接调用 Gemini API 另行计费。

**Q：调用返回 402 是什么意思？**
预付费余额用完了。官方错误表的建议是充值或开启自动充值，并且**不要重试**——充值之前请求不会成功。

**Q：想停止付费怎么办？**
在 Google Cloud 控制台停用对应项目的结算，项目会回到免费层。

## 参考资料

- Billing（官方）：https://ai.google.dev/gemini-api/docs/billing
- Gemini Developer API pricing（官方定价页）：https://ai.google.dev/gemini-api/docs/pricing
- Rate limits（官方）：https://ai.google.dev/gemini-api/docs/rate-limits
- Gemini API Additional Terms of Service（官方）：https://ai.google.dev/gemini-api/terms
- API errors（官方）：https://ai.google.dev/gemini-api/docs/api-errors
- Gemini thinking（官方）：https://ai.google.dev/gemini-api/docs/thinking
- Grounding with Google Search（官方）：https://ai.google.dev/gemini-api/docs/google-search
- Google AI Plans（官方）：https://ai.google.dev/gemini-api/docs/google-ai-plans
- Prepay for the Gemini API to get more control over your spend（Google 官方博客）：https://blog.google/innovation-and-ai/technology/developers-tools/prepay-gemini-api/
- Giving you more transparency and control over your Gemini API costs（Google 官方博客）：https://blog.google/innovation-and-ai/technology/developers-tools/more-control-over-gemini-api-costs/
