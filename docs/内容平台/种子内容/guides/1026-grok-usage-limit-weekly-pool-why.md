---
title: Grok 为什么有限制：每周用量池怎么算、在哪看剩余、用完了怎么办
slug: grok-usage-limit-weekly-pool-why
products: [grok]
models: []
accountTier: OTHER
excerpt: Grok 为什么有限制、SuperGrok 上限怎么看？官方现在用「每周共享用量池」：聊天、图片视频、语音、Build 共用一个额度，在 设置 → Usage 查看百分比和重置时间。用完后可以买额外额度、升级或开自动充值（2026-10 查询）。
checkedOn: 2026-10-25
sources:
  - https://docs.x.ai/grok/faq
  - https://docs.x.ai/x-subscription/usage-limits
  - https://docs.x.ai/x-subscription/extra-usage
  - https://docs.x.ai/x-subscription/spending-caps
  - https://x.ai/pricing
verify:
  - 官方 FAQ 写「Rolling out in June 2026」，即周用量池是 2026 年 6 月起逐步推出的；是否已覆盖到你的账号，以你设置里有没有 Usage 页为准
  - 官方没有公布各档位每周的绝对数字，只写倍数（Premium 是 Plus 的 4 倍、Super 15 倍、Ultra 50 倍）和「用量以百分比显示」
  - Extra Usage Credits「最低 5 美元」「一年后过期」「目前只能在网页端购买」均来自官方 FAQ 当前版本，可能变化
  - 官方 FAQ 与 X Subscription 文档的命名略有不同（SuperGrok 周限额 / The X Subscription 共享周用量池），本文两处都引，并按各自页面的说法写
  - 图片是官方 FAQ 里的示例截图（金额、日期是示例数据），不是真实账号
  - 本文不写任何绕过或解除限制的方法
---

> 本文根据 Grok 官方 FAQ、The X Subscription 文档和定价页整理，资料核对于 2026-10-25。限额规则可能调整，**以官方页面和你账号里显示的为准**。本文只讲官方允许的查看和处理方式。

## 适用于谁

- 搜「grok为什么有限制」「grok supergrok 上限」的人；
- 聊着聊着提示用量用完、不知道什么时候恢复的人；
- 想知道该买额外额度还是升级套餐的人。

## 结论先说

1. **有限制是正常的**：官方的做法是给每个付费账号一个「每周用量池」，聊天、Imagine（图片视频）、语音、Build 都从同一个池里扣，而不是各自一个每日上限。
2. **不同功能扣得不一样**：官方说一条聊天消耗很少，高质量视频或长时间编程任务则多得多，所以做视频会比聊天更快用完。
3. **在哪看**：设置 → Usage，网页和手机都有。会显示已用百分比、按功能（API、Build、Chat、Imagine、Voice）的占比、每周重置的日期时间，以及额外额度余额。
4. **用完不是死路**：付费功能暂停到下次重置，但可以买额外额度立刻继续、升级到更高档，或者开自动充值。免费档的 Chat 和 Voice 限额还可以继续用。
5. **长期不够用**：官方说，经常超限的话升级套餐比反复买额外额度更划算，因为额外额度按标准价计算，单次成本高于套餐里包含的用量。需要开通或升级可看 [/chongzhi/grok-super](/chongzhi/grok-super)。

![官方示例：Usage 页显示周限额、按功能占比和额外额度余额](seed:g1026-grok-usage-tab.jpg)
*图片来源：[docs.x.ai：Grok FAQ](https://docs.x.ai/grok/faq)，为官方示例截图，金额与日期是示例数据*

## 一、周用量池是怎么回事

官方 FAQ 的说明：

- 从 2026 年 6 月起，付费用户改用更简单的系统：不再给聊天、Imagine、语音、Build 各设一个每日上限，而是给一个**共享的每周用量池**，怎么花都行；
- 以前常见的情况是 Imagine 用完了，聊天还有余量，现在可以集中花在你最常用的功能上；
- 用量池每周重置，重置时间在设置的 Usage 页显示；
- The X Subscription 的文档补充：这个池只算官方自家（first-party）模型的用量，在 Grok 和 Cursor 之间共享；Cursor 里的第三方模型（比如 Claude、GPT）不在池里，按另付的额外用量计费。

各档位的池有多大，官方定价页只写倍数：Plus 是基础用量，Premium 是 Plus 的 4 倍，Super 是 15 倍，Ultra 是 50 倍。免费档只写「有限」。各档价格见 [/guides/grok-how-to-subscribe-download](/guides/grok-how-to-subscribe-download)。

## 二、怎么看自己还剩多少

1. 打开 Grok（网页或手机 App），进入 **设置（Settings）**；
2. 点 **Usage**；
3. 看进度条的已用百分比，下面是按产品的占比，右上角是重置时间；
4. 如果已在 The X Subscription 下，也可以在 grok.com/dashboard 左侧打开 Usage，Current plan 卡片上也会显示已用量。

## 三、用完之后怎么办

![Grok 用量用完后的几种处理方式](seed:g1026-grok-limit-decide.png)
*图：本站根据 [docs.x.ai Grok FAQ](https://docs.x.ai/grok/faq) 与 [spending caps 文档](https://docs.x.ai/x-subscription/spending-caps) 整理的示意图*

| 选项 | 官方说明 |
| --- | --- |
| 等重置 | 付费功能暂停，直到每周重置；免费档的 Chat、Voice 限额仍可用 |
| 买额外额度（Extra Usage Credits） | 立即生效，在周用量用完后才开始扣；最低 5 美元；一年后过期；目前只能在网页端买，手机内购「将来提供」 |
| 升级套餐 | 周用量更大，每次动作成本比额外额度低 |
| 自动充值（Auto Top Up） | 余额低于你设的值时自动补，可设金额和每月上限，官方说不会自动开启 |

**特别提醒：设月度上限。** 官方文档说明，「月度额外用量上限」和充值余额是两件事：加钱不会提高上限，所以可能出现余额还有、但月度上限到了而被停用的情况；反过来，只设了提醒（alerts）并不会真的停止扣费，要真正封顶必须设月度上限。管理入口在 grok.com/dashboard/billing 的 Additional usage credits 一栏。

## 四、几个常见疑问

**Q：免费版的限制和这个一样吗？**
不一样。免费档官方只写「有限的聊天和代理请求」，没有公布次数，见 [/guides/grok-free-usage-how-much](/guides/grok-free-usage-how-much)。

**Q：为什么我的视频变成 480p 了？**
官方 FAQ 说，720p 视频在你达到所在档位的 720p 上限后，会自动降到 480p。视频怎么做见 [/guides/grok-imagine-image-video](/guides/grok-imagine-image-video)。

**Q：提示「升级」但我明明已经订阅了？**
官方说已订阅就不该出现这类提示，先重启或重装 App、退出重登、清缓存，并确认登录的是购买订阅的账号。

**Q：能不能绕过限制？**
本文不涉及。官方给的正规办法就是上面几条：等重置、买额度、升级。

## 参考资料

- docs.x.ai：Grok FAQ（Usage & Limits） — https://docs.x.ai/grok/faq
- docs.x.ai：Usage limits — https://docs.x.ai/x-subscription/usage-limits
- docs.x.ai：Extra usage credits and top-ups — https://docs.x.ai/x-subscription/extra-usage
- docs.x.ai：Spending caps — https://docs.x.ai/x-subscription/spending-caps
- Grok 官方：Pricing — https://x.ai/pricing
