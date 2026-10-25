---
title: Claude 订阅和 API 是两回事：Pro / Max 能不能转 API、怎么另外开通
slug: claude-subscription-vs-api
products: [claude]
models: []
accountTier: PRO
excerpt: Claude 订阅能转成 API 吗？按官方帮助中心讲清：Pro、Max 订阅和 Claude Console 的 API 是两个产品、分开计费；Max / Team 每月附带的 API 额度怎么领、不能用在哪；API 额度怎么买、多久过期。
checkedOn: 2026-10-24
sources:
  - https://support.claude.com/en/articles/9876003-i-have-a-paid-claude-subscription-pro-max-team-can-i-also-use-the-claude-api
  - https://support.claude.com/en/articles/8977456-how-do-i-pay-for-my-api-usage
  - https://support.claude.com/en/articles/12429409-extra-usage-for-paid-claude-plans
  - https://claude.com/pricing
verify:
  - 「API 单独计费」「Max 与 Team 含每月 API 额度」「该额度不能用于 Claude Code 和 Claude 应用」取自 2026-10-24 的官方帮助中心；金额（Max 每月 100 / 200 美元，Team 最多 500 美元）取自 claude.com/pricing，随时可能调整
  - 官方帮助文章没有写 Console 账号和 Claude 账号是否共用登录，文中不下结论，以官方注册页面为准
  - 额度一年到期、不可退款取自官方 Console 付款帮助文；各地区的税费和支付方式官方未在该文展开
---

> 本文根据 Claude 帮助中心《I have a paid Claude subscription… can I also use the Claude API?》《How do I pay for my API usage?》《Extra usage for paid Claude plans》和定价页整理，资料核对于 2026-10-24，价格为「2026-10 查询」。图为本站整理的示意图。**以官方页面为准**。

## 适用于谁

- 搜「claude 订阅 转 api」，想把 Pro / Max 订阅直接当 API 用的人；
- 买了订阅，发现代码里调用 API 还要另外付钱的人；
- 有 Max 或 Team，不知道「每月 API 额度」怎么用的人。

API Key 具体怎么创建，见 [/guides/claude-api-key-console](/guides/claude-api-key-console)，本文只讲「订阅和 API 的关系」。

## 结论先说

1. **订阅不能转成 API**。官方的原话是「Claude API 单独计费」：Pro、Max、Team、Enterprise 是在网页、桌面、手机上使用 Claude 的套餐，Claude Console 是面向开发者的平台，两者是不同的产品，用途不同。订阅提升的是聊天体验，不覆盖 API 调用。
2. **想两个都用，要分别开通**：官方说需要有一个付费套餐，并且「单独设置 Console 访问」。
3. **Max 和 Team 附带每月 API 额度**：按官方定价页，Max 每月 100 到 200 美元（对应 5x、20x 两档），Team 最多每月 500 美元；Pro 没有。
4. **这份额度不能反着用**：官方明确，每月 API 额度不能用在 Claude Code 和 Claude 应用里，包括不能用来抵用量额度（usage credits）。
5. 想开通 Claude 订阅，可以看本站的 [/chongzhi/claude-pro](/chongzhi/claude-pro) 或 [/chongzhi/claude-max](/chongzhi/claude-max)。

![Claude 订阅和 Claude API 的区别](seed:g1051-subscription-vs-api.png)
*图：本站根据 [Claude 帮助中心](https://support.claude.com/en/articles/9876003-i-have-a-paid-claude-subscription-pro-max-team-can-i-also-use-the-claude-api) 与 [定价页](https://claude.com/pricing) 整理的示意图*

## 一、两个产品分别是什么

官方说明：

- **付费套餐**（Pro、Max、Team、Enterprise）：在 Claude 网页、桌面和手机应用里使用，带来更高用量、高峰期优先访问等；
- **Claude Console**：Anthropic 的开发者平台，提供 API Key 和对 Claude 模型的访问，用来做应用和集成。

所以「买了 Max，能不能拿订阅去调 API」的答案是：不能直接用。订阅里的消息额度和 API 的 token 额度是两套账。反过来，你也没法用 API 额度去「充订阅」。如果你只是想在 Claude Code 里省钱或补额度，有专门的办法，见 [/guides/claude-code-pro-max-or-api](/guides/claude-code-pro-max-or-api)。

## 二、Max / Team 的每月 API 额度

官方说明：

- Max 和 Team 套餐包含**每月的 Claude API 额度**，需要**把一个 Console 组织关联到你的套餐**才能领取；
- 每月额度会**先于你购买的额度**被使用；
- **没用完的每月额度在当前计费周期结束时作废**；
- 不能用于 Claude Code 和 Claude 应用，包括不能用于用量额度；
- 如果你的组织走销售开票，超出额度的部分按正常计费。

金额按定价页（2026-10 查询）：Max 5x 每月 100 美元、Max 20x 每月 200 美元，Team 最多每月 500 美元；Pro 不含。具体领取的页面和细则，官方在专门的文章里说明，以官方当天页面为准。Pro 和 Max 的完整对照见 [/guides/claude-pro-vs-max-difference](/guides/claude-pro-vs-max-difference)。

## 三、API 的钱怎么付

![既要聊天又要 API，怎么开通](seed:g1051-open-api-steps.png)
*图：本站根据 [Claude 帮助中心：How do I pay for my API usage?](https://support.claude.com/en/articles/8977456-how-do-i-pay-for-my-api-usage) 整理的示意图*

官方 Console 付款说明：

- **预付额度**：大多数组织预先购买 usage credits，用于 API、playground 和 Claude Code（Console 登录时），按当前价格计；只对成功的请求收费；额度用完就不能再调用；
- **买额度**：用 **Admin** 或 **Billing** 角色登录 Console，进入 **Billing** 页，点 **Buy credits**，输入金额确认，额度立即到账；
- **自动充值**：在 Billing 页的 **Credit balance** 部分点 **Set up auto-reload**，设置「When credit balance reaches」（触发余额）和「Bring credit balance back up to」（目标余额）；
- **到期与退款**：购买的额度自购买日起**一年到期**，不能延期；**所有额度购买不可退款**；
- **月度开票**：与 Anthropic 销售签了开票协议的组织，按月收到 Stripe 发票；
- **支付方式**：官方文章写的是信用卡，发票走 Stripe，没有列出其他方式。

API 价格按模型不同，见官方定价页，模型的价格对照见 [/guides/claude-opus-5-5-guide](/guides/claude-opus-5-5-guide) 与 [/guides/claude-sonnet-5-5-guide](/guides/claude-sonnet-5-5-guide)；提示词缓存能降低成本，见 [/guides/claude-prompt-caching](/guides/claude-prompt-caching)；Python 调用入门见 [/guides/claude-api-python-quickstart](/guides/claude-api-python-quickstart)。

## 四、订阅里的「用量额度」不是 API

名字相近容易混淆：订阅用户可以开启**用量额度（usage credits）**，在达到 5 小时、每周限额后继续使用，按标准 API 价格从额度里扣；它在 **Settings > Usage** 里开启，只能用在 Claude 对话和 Claude Code，**不是 API Key 的额度**。官方说它与 Max / Team 的每月 API 额度也是分开的两件事。如果你是通过 iOS 或 Android 应用订阅的，官方说要在 Claude 网页版上启用并购买用量额度。额度的规则见 [/guides/claude-usage-limits](/guides/claude-usage-limits)。

## 常见问题

**Q：Pro 能直接拿到 API Key 吗？**
不能。官方说 Pro 不含 API 用量，要同时用，需要在 Claude Console 另外开通并单独付费。

**Q：为什么买了 Max 还要付 API 费？**
Max 每月附带的 API 额度有上限，超出部分按 API 价格计费，且用不完当月作废。

**Q：Console 账号和 Claude 账号能共用吗？**
官方帮助文章没有写明，注册和登录以官方页面提示为准。注册方面的说明见 [/guides/claude-how-to-sign-up](/guides/claude-how-to-sign-up)。

**Q：API 额度买多了能退吗？**
官方说所有额度购买不可退款，一年后到期。

## 参考资料

- Claude 帮助中心：I have a paid Claude subscription (Pro, Max, Team), can I also use the Claude API? — https://support.claude.com/en/articles/9876003-i-have-a-paid-claude-subscription-pro-max-team-can-i-also-use-the-claude-api
- Claude 帮助中心：How do I pay for my API usage? — https://support.claude.com/en/articles/8977456-how-do-i-pay-for-my-api-usage
- Claude 帮助中心：Extra usage for paid Claude plans — https://support.claude.com/en/articles/12429409-extra-usage-for-paid-claude-plans
- Claude 官方定价页 — https://claude.com/pricing
