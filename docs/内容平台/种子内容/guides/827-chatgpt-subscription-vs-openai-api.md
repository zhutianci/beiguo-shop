---
title: ChatGPT 会员和 OpenAI API 有什么区别：为什么 ChatGPT 里没有地方设置 API Key、两边账单怎么分开看
slug: chatgpt-subscription-vs-openai-api
products: [chatgpt]
models: []
accountTier: FREE
excerpt: 搜「ChatGPT 设置 API Key」「OpenAI 和 ChatGPT 区别」的人，多半是把两件事混在一起了。按 OpenAI 帮助中心讲清：ChatGPT 订阅和 API 平台是两套独立的计费系统，账单分别在哪看，在 Codex 里用 ChatGPT 账号和用 API Key 的区别。
checkedOn: 2026-10-14
sources:
  - https://help.openai.com/en/articles/9039756-managing-billing-for-chatgpt-and-the-api-platform
  - https://help.openai.com/en/articles/20001275-chatgpt-work-and-codex
  - https://help.openai.com/en/articles/8096356-chatgpt-custom-instructions
  - https://help.openai.com/en/articles/6783457-what-is-chatgpt
verify:
  - 官方文章没有写「在 ChatGPT 网页或 App 里不能填 API Key」这样一句话；本文的说法依据是：官方把 ChatGPT 与 API 平台描述为各自独立的产品和计费，唯一提到「用自己的 API Key」的位置是 Codex，以及自定义指令文章里「没有自定义指令的 API，请用系统消息」
  - API 具体价格官方让看 API pricing 页面，本文不写数字
---

> 本文根据 OpenAI 帮助中心《Managing billing for ChatGPT and the API platform》《ChatGPT Work and Codex》《ChatGPT Custom Instructions》整理，资料核对于 2026-10-14。官方文章没有配界面截图，文中配图为本站整理的示意图。

## 适用于谁

- 搜「ChatGPT 设置 API Key」，在 ChatGPT 设置里翻了半天没找到填密钥位置的人；
- 搜「OpenAI 和 ChatGPT 区别」，想弄清楚两者关系的人；
- 买了 ChatGPT 会员，却发现 API 调用要另外付费，想知道为什么的人。

创建 API Key 的步骤见 [/guides/openai-api-key](/guides/openai-api-key)，API 的计费见 [/guides/openai-api-pricing-billing](/guides/openai-api-pricing-billing)。这篇只回答：**这是两样东西。**

## 结论先说

1. **ChatGPT 是面向个人和团队的聊天产品，API 是给开发者调用模型的接口。** 它们都是 OpenAI 的，但官方明确说：**ChatGPT 和 API 平台有各自独立的计费系统**，各自的费用和账单记录要在各自的设置里管理。
2. **ChatGPT 会员不含 API 用量。** 官方原话是：API 的使用与你的 ChatGPT 订阅**分开计费**。要开始付费使用 API，需要在 API 账号的计费设置里添加付款方式。
3. **所以 ChatGPT 里没有「填 API Key」的地方。** 我核对的官方页面里，ChatGPT 的设置只有 Billing 等管理订阅的选项，没有填 API 密钥的功能；API Key 是在 API 平台创建，用在你自己的程序或第三方工具里。
4. **API 怎么收费**：取决于你用的模型和功能，包括 token 用量，以及适用的工具或存储费用，具体价格看官方的 API 定价页面。
5. **唯一例外的地方是 Codex**：在 Codex 里用 ChatGPT 账号登录，用的是你 ChatGPT 套餐的用量和计费；用你自己的 API Key，则按 API 定价。

## 一、两样东西各管什么

![ChatGPT 订阅和 OpenAI API 的区别](seed:g827-chatgpt-vs-api.png)
*图：本站根据 [OpenAI 帮助中心：Managing billing for ChatGPT and the API platform](https://help.openai.com/en/articles/9039756-managing-billing-for-chatgpt-and-the-api-platform) 整理的示意图*

## 二、账单分别去哪看

**ChatGPT（Free、Go、Plus、Pro 个人账号）：**

1. 登录 ChatGPT 网页；
2. 打开 **Settings**；
3. 选 **Billing**；
4. 如果你是在网页订阅的，可以在这里管理订阅、付款方式和可用的账单记录。

**ChatGPT Business、Enterprise、Edu：** 工作区的所有者和管理员在 **Workspace settings → Billing**（Business）里看；只有工作区所有者能更新账单信息、付款方式或查看发票。Enterprise 和 Edu 则是在全局管理控制台里选工作区再打开 Billing，可用的控制取决于套餐和权限。

**API：** API 组织的所有者可以在 API billing overview 里看账单详情。预付费额度和自动充值的设置，官方有专门文章（Setting up prepaid billing）。

**订阅可能在多个平台：** 官方提醒，ChatGPT 订阅可以通过网页、Apple App Store 或 Google Play 付款；在多个平台订阅可能产生多笔扣费。要弄清楚订阅归哪个平台管理、避免重复扣费，见官方的跨设备管理订阅说明。账单和发票的问题可以先看 [/guides/chatgpt-cancel-subscription](/guides/chatgpt-cancel-subscription)。

## 三、什么情况该用哪个

![我该用 ChatGPT 还是 API：6 种情况的选择](seed:g827-which-to-use.png)
*图：本站根据 [OpenAI 帮助中心：Managing billing for ChatGPT and the API platform](https://help.openai.com/en/articles/9039756-managing-billing-for-chatgpt-and-the-api-platform) 与 [ChatGPT Work and Codex](https://help.openai.com/en/articles/20001275-chatgpt-work-and-codex) 整理的示意图*

- **只是自己用 ChatGPT 聊天、写东西、做文件**：用 ChatGPT 就行，不需要 API Key。想升级套餐看 [/guides/chatgpt-plans-comparison](/guides/chatgpt-plans-comparison)，开通见 [/chongzhi/chatgpt-plus](/chongzhi/chatgpt-plus)。
- **要把模型接进自己的网站、脚本或某个第三方工具**：去 API 平台创建密钥、单独添加付款方式。入门见 [/guides/openai-api-python-quickstart](/guides/openai-api-python-quickstart)。
- **想在 Codex 里写代码**：官方说，用 ChatGPT 登录就用你 ChatGPT 套餐的用量和计费；用自己的 API Key 就按 API 定价。Work 与 Codex 的关系见 [/guides/chatgpt-work-vs-codex](/guides/chatgpt-work-vs-codex)。
- **想要「自定义指令」的接口**：官方说明自定义指令**没有对应的 API**，用 API 时应该用 Chat Completions 的系统消息（system message）达到类似的效果。

## 四、API 密钥的安全

- API Key 相当于密码，不要贴进聊天、公开代码仓库或截图里；
- 怀疑泄露了，立刻在 API 平台删除并重新创建；
- 第三方工具要求你提供 API Key 时，确认它是你信任的、官方集成的工具；
- 更多保管方式见 [/guides/openai-api-key](/guides/openai-api-key)。

## 常见问题

**Q：我买了 ChatGPT Plus，可以用它的额度调用 API 吗？**
不可以。官方说 ChatGPT 订阅和 API 是分开计费的，API 要单独添加付款方式。

**Q：我只想用 Codex，需要 API Key 吗？**
不一定。官方说用 ChatGPT 账号登录 Codex，会使用你的 ChatGPT 套餐的用量和计费；用自己的 API Key 时按 API 价格。

**Q：为什么「ChatGPT 的账单」里找不到 API 的扣费？**
因为它们是两个独立的账单。API 的账单要去 API 账号的计费页面看。

**Q：我在 App Store 订阅了，网页上看不到账单？**
官方说订阅可能由网页、App Store 或 Google Play 管理，要在对应平台管理；见官方「跨设备管理订阅」文章和本站 [/guides/chatgpt-cancel-subscription](/guides/chatgpt-cancel-subscription)。

**Q：账号和 API 账号是同一个登录吗？**
官方在旧版常见问题里写过：已有 platform.openai.com 账号的用户，可以用同一登录信息直接登录 chatgpt.com；但计费仍然是各管各的。

## 参考资料

- OpenAI 帮助中心：Managing billing for ChatGPT and the API platform — https://help.openai.com/en/articles/9039756-managing-billing-for-chatgpt-and-the-api-platform
- OpenAI 帮助中心：ChatGPT Work and Codex — https://help.openai.com/en/articles/20001275-chatgpt-work-and-codex
- OpenAI 帮助中心：ChatGPT Custom Instructions — https://help.openai.com/en/articles/8096356-chatgpt-custom-instructions
- OpenAI 帮助中心：What is ChatGPT? — https://help.openai.com/en/articles/6783457-what-is-chatgpt
