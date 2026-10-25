---
title: SuperGrok Heavy 是什么：官方文档里的说法、和现在 Super、Ultra 的关系
slug: grok-supergrok-heavy-what-is
products: [grok]
models: []
accountTier: OTHER
excerpt: SuperGrok Heavy 是什么？它是 Grok 较早的高档订阅名。官方现行定价页只列 Free、Plus、Premium、Super、Ultra，没有 Heavy；官方文档只在企业许可证、年订阅账单和 Grok Bot 关联里提到它（2026-10 查询）。
checkedOn: 2026-10-25
sources:
  - https://x.ai/pricing
  - https://docs.x.ai/grok/faq
  - https://docs.x.ai/grok/management
  - https://docs.x.ai/grok-bot/overview
  - https://docs.x.ai/x-subscription/pricing
  - https://docs.x.ai/x-subscription/overview
verify:
  - 官方现行页面没有写「SuperGrok Heavy 对应现在的哪一档」，也没有写 Heavy 的价格和用量；本文不推断 Heavy 等于 Super 或 Ultra，只列官方提到 Heavy 的几处
  - 官方 FAQ 提到 Heavy 的是「大额意外账单常见原因是 SuperGrok Heavy 年订阅」这一处；官方没有写 Heavy 年费具体是多少
  - Grok Business 文档把 Heavy 写作「升级版许可证，面向高强度工作」，属于企业或团队场景，与个人订阅不是同一回事
  - 官方文档说老订阅（Cursor、SuperGrok、X Premium）继续有效，切换到 The X Subscription 是可选的、切换后永久不可撤销；本文照引，不判断你该不该切换
  - 官方定价页同时声明订阅只通过官方渠道直接销售，不授权转售；本文不涉及任何非官方渠道
---

> 本文根据 Grok 官方定价页、FAQ、Grok Business 文档和 Grok Bot 文档整理，资料核对于 2026-10-25。官方现行页面没有给出 Heavy 的价格和用量，**以官方页面和你账号里显示的订阅为准**。图为本站整理的示意图。

## 适用于谁

- 搜「grok super heavy」「supergrok heavy 是什么」的人；
- 看到账单或旧文章里的 Heavy，想知道它对应现在哪一档的人；
- 想知道要不要买 Heavy、现在还能不能买的人。

## 结论先说

1. **现在的官方定价页没有 Heavy**。x.ai/pricing 个人档位只有 Free（0）、Plus（8）、Premium（30）、Super（100）、Ultra（200），单位美元每月、不含税。
2. **官方没有说 Heavy 对应哪一档**。网上常见「Heavy 就是现在的 Ultra」之类的说法，官方文档里找不到依据，所以这里不下结论。
3. **官方文档提到 Heavy 的地方有三处**，见下文：年订阅账单、企业许可证、Grok Bot 关联。
4. **老订阅继续有效**：官方说，已有的 Cursor、SuperGrok、X Premium 订阅，在你切换或取消前，套餐、价格和功能继续不变。
5. **想要更大的用量**：按现在的官方档位，用量是倍数关系，Premium 是 Plus 的 4 倍，Super 15 倍，Ultra 50 倍。需要开通可看 [/chongzhi/grok-super](/chongzhi/grok-super)。

![官方文档里提到 SuperGrok Heavy 的几处](seed:g1027-grok-heavy-where-in-docs.png)
*图：本站根据 [x.ai/pricing](https://x.ai/pricing) 与 [docs.x.ai](https://docs.x.ai/grok/faq) 整理的示意图*

## 一、官方哪几处提到了 Heavy

### 1. FAQ：大额账单可能是 Heavy 年订阅

docs.x.ai 的 Grok FAQ 里有一问：收到一张不认识的大额账单，是不是 API 用量？官方的回答是不一定，**大额意外账单常常是 SuperGrok Heavy 的年订阅，而不是 API 用量**；建议先看购买日期和订阅记录，再带着账单编号联系客服确认，不要急着拒付。

### 2. Grok Business：企业许可证类型

Grok Business（团队、企业版）的许可证管理文档写明，可购买的许可证类型有两种：**SuperGrok**（标准商业访问，更多额度与功能）和 **SuperGrok Heavy**（更高性能，面向高强度工作）。团队工作区还说明，成员享有 SuperGrok 的全部权益，升级后的许可证可用 Heavy。这是团队场景，不是个人订阅。

### 3. Grok Bot：可关联的订阅

Grok Bot 的文档说明，个人的 SuperGrok、SuperGrok Plus 或 SuperGrok Heavy 订阅都可以关联到 Grok Bot 使用；如果同时有 Cursor 和 SuperGrok 订阅，Grok Bot 用额度更多的那个。同一份文档还说明：一旦你切换或注册新的 The X Subscription，Grok Bot 的额度改由新的每周共享用量池提供。

## 二、现在应该看哪一档

现行官方档位：

| 套餐 | 月费（美元，不含税） | 官方写的用量 |
| --- | --- | --- |
| Free | 0 | 有限 |
| Plus | 8 | 共享用量池（基础） |
| Premium | 30 | Plus 的 4 倍 |
| Super | 100 | Plus 的 15 倍，高峰期优先模型访问 |
| Ultra | 200 | Plus 的 50 倍，最早体验新产品和模型 |

官方对档位的选择建议是：新用户用 Premium，每天用代理功能的用 Super，重度用户用 Ultra，Plus 更适合只想要 X 创作者权益的人。订阅怎么选、怎么订，见 [/guides/grok-how-to-subscribe-download](/guides/grok-how-to-subscribe-download)；用量怎么算、用完怎么办，见 [/guides/grok-usage-limit-weekly-pool-why](/guides/grok-usage-limit-weekly-pool-why)。

## 三、如果你账号里有 Heavy 订阅

![怀疑自己有 Heavy 订阅，先查这些地方](seed:g1027-grok-heavy-check-subscription.png)
*图：本站根据 [Grok FAQ](https://docs.x.ai/grok/faq) 与 [订阅管理文档](https://docs.x.ai/x-subscription/manage) 整理的示意图*

- **先弄清是哪里买的**：官方说订阅绑定在购买时的账号和平台上，网页、苹果、谷歌的管理入口各不相同；
- **网页订阅**：grok.com 的 Settings → Billing，已合并到新订阅的在 grok.com/dashboard；
- **要不要切换**：官方说切换是可选的，合并后永久不可撤销，旧订阅会按剩余时间退款；不切换就保持原样；
- **不想续了**：取消方法见 [/guides/grok-cancel-subscription](/guides/grok-cancel-subscription)。

## 常见问题

**Q：Heavy 现在还能买吗？**
官方现行定价页没有 Heavy 这一项，新用户看到的是五档个人订阅。官方文档里的老订阅是否还提供新购买，没有写，请以官方页面为准。

**Q：Heavy 比 Super 强多少？**
官方没有公布 Heavy 的具体用量，所以无法给出倍数。官方只写了现行档位之间的倍数关系。

**Q：Heavy 年订阅被扣款了怎么办？**
先在购买平台里核对订阅记录，再联系官方客服并提供账单编号。退款规则见 [/guides/grok-cancel-subscription](/guides/grok-cancel-subscription)。

## 参考资料

- Grok 官方：Pricing — https://x.ai/pricing
- docs.x.ai：Grok FAQ — https://docs.x.ai/grok/faq
- docs.x.ai：License & User Management — https://docs.x.ai/grok/management
- docs.x.ai：Grok Bot Overview — https://docs.x.ai/grok-bot/overview
- docs.x.ai：The X Subscription Pricing — https://docs.x.ai/x-subscription/pricing
- docs.x.ai：What is The X Subscription? — https://docs.x.ai/x-subscription/overview
