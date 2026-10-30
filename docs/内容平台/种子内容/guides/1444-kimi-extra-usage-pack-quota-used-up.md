---
title: Kimi 额度已用尽怎么办：「加油包」怎么充、怎么开、先扣哪种额度、能不能开发票
slug: kimi-extra-usage-pack-quota-used-up
products: [kimi]
models: []
accountTier: OTHER
excerpt: Kimi 订阅额度用尽后，可以等月度刷新、升级档位，或开启「加油包」按实际用量继续用。本文按 Kimi 官方帮助中心讲清加油包的充值入口、开关和每月消费上限、不同额度的扣除顺序、充值限制、与 Kimi Code 是否共用，以及开发票。
checkedOn: 2026-10-30
sources:
  - https://www.kimi.com/help/membership/membership-extra-usage
  - https://www.kimi.com/help/membership/membership-overview
verify:
  - 充值金额限制（单次最低 25 元、每日最多 10 次、累计 3000 元、余额上限 10000 元）是帮助中心当天的数字，官方可能调整
  - 帮助中心写明计费示例只是量级参考（约 0.03 元和约 1.6 元），实际以平台为准
  - 加油包费率官方只说「近似于开放平台 API 价格」「以平台展示为准」，本文不写更具体的单价
---

> 本文根据 Kimi 帮助中心《加油包：额外用量购买》整理，资料核对于 2026-10-30，价格、限额数字标「2026-10 查询」，官方可能调整。配图为本站整理的示意图，不是软件截图。

## 适用于谁

- 搜「Kimi 额度已用尽」「Kimi 加油包是什么」「Kimi 额度不够用怎么办」的人；
- 订阅了 Kimi 会员，但额度被 Agent、深度研究或 Kimi Code 很快用完的人。

## 结论先说

1. **加油包（Extra Usage）**：订阅额度用尽后，用加油包余额继续发起请求，不用等额度刷新。**只有订阅会员能开启**。
2. 余额**网页版、浏览器插件、桌面端、移动端与 Kimi Code 之间共享**，充一次全端通用；仅限个人账户，不与团队或企业账户共享。
3. **按实际用量扣费**，余额以人民币显示。官方说加油包价格近似于 Kimi 开放平台的官方 API 价格，**用量较大时，升级订阅通常更划算**。
4. 余额**不过期、可叠加**，订阅失效后仍能继续消费，但失效期间无法再充值。
5. **充值入口**：Kimi 订阅页面滚动到底部的「额度加油包」模块；充值后记得打开「额度加油包」开关。

![Kimi 额度用尽：看到什么，怎么办](seed:g1444-quota-decide.png)
*图：本站根据 [Kimi 帮助中心：加油包](https://www.kimi.com/help/membership/membership-extra-usage) 整理的示意图*

## 一、怎么充、怎么开

![Kimi 加油包怎么充、怎么开](seed:g1444-extra-steps.png)
*图：本站根据 [Kimi 帮助中心：加油包](https://www.kimi.com/help/membership/membership-extra-usage) 整理的示意图*

- **主站充值**：打开 Kimi 订阅页面，滚动到底部的「额度加油包」模块，选择充值金额，完成支付；
- **从 Kimi Code 控制台充值**：当滚动 5 小时额度（或旧套餐的周额度）消耗超过 80% 时，进度条卡片上会出现「加油包购买」按钮，点击会跳到订阅页完成购买；
- **打开开关**：充值后打开「额度加油包」开关，订阅额度用尽时系统才会自动从余额扣减。关闭开关后余额保留，重新开启即可继续用。**开关管理目前只有网页版支持**，桌面端和手机 App 暂不支持；
- **每月消费上限**：点模块的「设置」可以开启，默认关闭。设置的金额必须高于单笔最低充值金额（25 元），当月消费达到上限后，系统暂停当月继续消耗加油包。

充值限制（2026-10 查询）：单次最低 25 元，每日最多 10 次、累计 3000 元，余额上限 10000 元。

## 二、先扣哪种额度

官方的规则是：**加油包不过期，所以优先级最低，最后扣**。

| 情形 | 扣除顺序 |
| --- | --- |
| 各类额度过期时间相同 | 赠送次数 > 赠送额度 > 订阅或免费额度 > 加油包 |
| 过期时间不同 | 谁先过期先扣谁，加油包仍排最后 |

还有一点：当你触发了**频控限制**（短时间用得太多），开启加油包后可以直接消耗余额突破频控；没开启时系统会引导你购买。因频控触发的加油包消耗，只扣加油包，不影响会员额度刷新。

## 三、一次大概多少钱

官方只给了「感受量级」的示例：一次简单请求（如推荐一首摇滚歌曲）约 0.03 元，一次复杂的多步任务（如规划一周成都到川西的自驾行程）约 1.6 元。**读取和生成的内容越多、任务越复杂，花费越高**，具体以平台展示为准（2026-10 查询）。

省钱的办法见 [/guides/kimi-membership-plans](/guides/kimi-membership-plans)：简单问题把思考强度调到「标准」，不需要产出文件时不用大模型。

## 四、查余额、开发票

- **查余额与明细**：Kimi 网页或 App 里：设置 → 订阅和发票 → 我的额度；
- **Kimi Code**：控制台查看余额与用量，命令行里输入 `/usage` 也可以；用法见 [/guides/kimi-code-cli-getting-started](/guides/kimi-code-cli-getting-started)；
- **开发票**：充值订单可以开，路径是「我的 → 订阅 → 额度和发票 → 账单与发票」，找到对应充值订单点「开发票」，**按单笔充值订单开具**。

## 常见问题

**Q：加油包和 Kimi 开放平台（API）的余额是一个钱包吗？**
不是。官方在 API 帮助里写明：开放平台、Kimi Code 和 Kimi 会员的余额与 API Key **不互通**；这里的加油包只在 Kimi 网页版、插件、桌面、移动端和 Kimi Code 之间共享。

**Q：企业版能用吗？**
暂不支持。

**Q：不想充钱，还有什么办法？**
官方给的四个选择见 [/guides/kimi-membership-plans](/guides/kimi-membership-plans)：等刷新、升级、加油包、参加官方活动。如果你更常用 ChatGPT，会员开通见 [/chongzhi/chatgpt-plus](/chongzhi/chatgpt-plus)。

**Q：提示「排队」「算力不足」也是额度问题吗？**
不是，那是高峰期限流，见 [/guides/kimi-queue-busy-compute-shortage](/guides/kimi-queue-busy-compute-shortage)。

## 参考资料

- Kimi 帮助中心：加油包，额外用量购买 — https://www.kimi.com/help/membership/membership-extra-usage
- Kimi 帮助中心：会员权益概览 — https://www.kimi.com/help/membership/membership-overview

更多 AI 会员开通可看 [/chongzhi](/chongzhi)。
