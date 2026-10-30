---
title: ChatGPT 没有 5 小时限额了吗：官方页面仍提到 5 小时和每周两档，怎么查你自己的用量
slug: chatgpt-5-hour-limit-still-exists
products: [chatgpt]
models: []
accountTier: PLUS
excerpt: 有人说 ChatGPT 的 5 小时限额没了。官方帮助中心当前的文章仍把「5 小时」和「每周」用量并列提到，Codex、ChatGPT Work 共用一份额度。本文说明怎么在设置里看自己的用量，以及哪些限额是独立的。
checkedOn: 2026-10-30
sources:
  - https://help.openai.com/en/articles/20001507-paid-weekly-work-and-codex-rate-limit-resets
  - https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan
verify:
  - 官方这两篇文章没有明确说「是否取消了 5 小时限额」，本文只能说官方仍在文章里提到它，不能断言它对每个套餐一直存在
  - 官方这些文章里没有写任何套餐的具体额度数字，以用量页为准
  - 5 小时限额针对的是 Codex、Work 等共用额度的功能，普通聊天的限额口径官方没有在这里写
---

> 本文根据 OpenAI 帮助中心《Paid weekly Work and Codex rate limit resets》《Using Codex with your ChatGPT plan》整理，资料核对于 2026-10-30。配图为本站整理的示意图。

## 适用于谁

- 听说「没有 5 小时限额了」，想确认真假的人；
- 用 Codex、ChatGPT Work，想知道额度怎么算的人；
- 想知道怎么查自己还剩多少的人。

## 结论先说

1. **官方当前的文章仍然把「5 小时」和「每周」用量并列提到。** 例如购买即时重置的说明里写的是：买完立刻**恢复 5 小时和每周用量**。所以不能说官方已经取消 5 小时限额。
2. **官方没有一句话回答「有没有取消」**，也没有给出数字。是否对你的账号生效、是哪一档先用完，以**你自己账号的用量页**为准。
3. **这套额度针对的是 Codex、ChatGPT Work 等功能**。官方说，在使用共享额度和 credits 的套餐里，Codex、ChatGPT Work、ChatGPT for Excel 和 Workspace Agents 共用同一份额度与 credits 池。
4. **图片、语音、文件上传的限额是另外一套**，有各自的重置周期和提示条，不占 Codex 额度。
5. **官方客服不会帮你重置用量。**

![5 小时与每周额度：官方怎么写、哪些功能受影响、怎么查、即时重置恢复什么](seed:g1346-5hour-weekly-compare.png)
*图：本站根据 [OpenAI 帮助中心：Paid weekly Work and Codex rate limit resets](https://help.openai.com/en/articles/20001507-paid-weekly-work-and-codex-rate-limit-resets) 与 [Using Codex with your ChatGPT plan](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan) 整理的示意图*

## 一、怎么看自己的用量

![自己查额度：设置、用量、哪一档用完、重置时间、Codex 命令行 /status](seed:g1346-check-usage-steps.png)
*图：本站根据 [OpenAI 帮助中心：Using Codex with your ChatGPT plan](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan) 整理的示意图*

官方说：快要或已经达到 Codex 限额时，打开 **Settings** 或用量页，看是**哪一档额度用完了**、你的 credits 余额和页面显示的**重置时间**；在进行中的 Codex CLI 会话里，输入 **/status**。

买过即时重置的收据，可以在桌面应用的 **Settings > Usage & Billing** 或网页版的 **Settings > Billing** 看到。

## 二、5 小时和每周怎么配合

官方的描述里，5 小时和每周是**两个不同的窗口**：

- 即时重置**同时恢复**两个窗口的用量；
- 重置之后，**新的每周周期**从你之后在 Work 或 Codex 的第一次请求开始，下次自动重置在那之后 **7 天**；
- 官方的购买入口说明里区分了两种情形：只用完 5 小时额度，**不会**弹出每周额度的付费重置提示条，但桌面用量设置里可能仍可买；用完每周额度则会出现应用内的重置提示。

怎么买、值不值得，见 [/guides/chatgpt-usage-not-enough-what-to-do](/guides/chatgpt-usage-not-enough-what-to-do)。

## 三、普通聊天的限额

普通对话、图片、语音的限额口径不同，官方的概述见 [/guides/chatgpt-plus-usage-limits-overview](/guides/chatgpt-plus-usage-limits-overview)，怎么查、什么时候重置见 [/guides/chatgpt-usage-limits-check-reset](/guides/chatgpt-usage-limits-check-reset)，Codex 的额度见 [/guides/codex-usage-limits](/guides/codex-usage-limits)。

## 官方没说的

- 官方**没有宣布取消**也没有宣布保留 5 小时限额的时间表；
- 各套餐 5 小时窗口里**能用多少**，官方文章没有写数字，说看定价页；
- 5 小时窗口**从什么时刻开始算**，这几篇文章没有展开。

## 常见问题

**Q：为什么我感觉没有被 5 小时限额卡过？**
用量少、没有用到共用额度的功能，就不会碰到。具体以你的用量页为准。

**Q：Free、Go 用户有这套限额吗？**
官方说 Codex 包含在各套餐里，包括 Free 和 Go，用量限额因套餐而异，具体数字官方没有写在这些文章里。

**Q：想多用一点，要升级吗？**
先看你是不是用在了共用额度的功能上，再决定，套餐对比见 [/guides/chatgpt-plans-comparison](/guides/chatgpt-plans-comparison)，想了解会员可以看 [/chongzhi/chatgpt-plus](/chongzhi/chatgpt-plus)。

## 参考资料

- OpenAI 帮助中心：Paid weekly Work and Codex rate limit resets — https://help.openai.com/en/articles/20001507-paid-weekly-work-and-codex-rate-limit-resets
- OpenAI 帮助中心：Using Codex with your ChatGPT plan — https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan
