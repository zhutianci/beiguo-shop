---
title: ChatGPT 工作模式一直「Working」不动怎么办：先看是不是在等你批准，再按官方卡住排查
slug: chatgpt-work-stuck-working
products: [chatgpt]
models: []
accountTier: PLUS
excerpt: ChatGPT 的 Work 任务一直显示 Working、没有结果？官方没有专门写这个提示，但 Work 文章说明了任务要你批准重要操作、可以查看进度和改方向，卡住另有通用排查。本文先判断是不是在等你，再按官方顺序处理。
checkedOn: 2026-10-28
sources:
  - https://help.openai.com/en/articles/20001275-chatgpt-work-and-codex
  - https://help.openai.com/en/articles/10291617-scheduled-tasks-in-chatgpt
  - https://help.openai.com/en/articles/7996703-troubleshooting-chatgpt-error-messages
verify:
  - 官方帮助中心没有专门写「Work 一直 Working 不动」，也没有写停止运行中任务的步骤；正文套用官方 Work 文章中的批准、查看进度说明和通用卡住排查，开头已说明
  - 官方 Work 文章没有给任务的预期耗时，也没有写具体任务示例
  - 官方说 Work 与 Codex 用同一套用量结构，没有给具体额度数字
  - 官方文章页面没有给出更新日期
---

> 本文根据 OpenAI 帮助中心《ChatGPT Work and Codex》《Scheduled tasks in ChatGPT》《Troubleshooting ChatGPT Error Messages》整理，资料核对于 2026-10-28。**官方没有专门写「Work 一直 Working」，也没有写怎样停止运行中的任务，**本文用官方对批准、进度的说明加通用卡住排查来回答。怎么开始一个 Work 任务见 [/guides/chatgpt-work-how-to-use-steps](/guides/chatgpt-work-how-to-use-steps)。配图为本站整理的示意图，不是界面截图。

## 适用于谁

- 在 Work 里下了任务，一直显示 **Working**（工作中）的人；
- 不知道任务是在跑、在等你，还是卡死了的人；
- 桌面版里的本地 Work 没有进展的人。

## 结论先说

1. **先看是不是在等你。** 官方说，重要操作要你**批准**；网页和手机上用屏幕上的控件批准或拒绝，**不支持语音批准**。计划任务文章也写了，任务可能需要额外操作，比如批准，才能继续。
2. **Work 本来就处理更长的多步骤任务**，官方说它最终交付文档、表格、演示文稿、报告或 Site，所以比普通聊天慢是正常的。官方没有给耗时。
3. **你可以介入**：官方说任务运行时可以**查看进度、回答问题、改变方向、批准重要操作**。
4. **确实没有任何进展**，按官方对卡住的通用做法：先等 30 到 60 秒，停止并重新生成；新开对话；刷新或退出重登；关闭扩展和 VPN；换浏览器或网络；看状态页。
5. **桌面版**先更新：官方说桌面版要手动 **Check for Updates**；本地 Work 要看文件夹和应用权限。
6. **用量**：官方说 Work 与 Codex 使用同一套用量结构，每个任务消耗不同。

![Work 一直 Working：对照表](seed:g1203-work-decide.png)
*图：本站根据 [OpenAI 帮助中心：ChatGPT Work and Codex](https://help.openai.com/en/articles/20001275-chatgpt-work-and-codex) 与 [Troubleshooting ChatGPT Error Messages](https://help.openai.com/en/articles/7996703-troubleshooting-chatgpt-error-messages) 整理的示意图*

## 一、官方说的几个相关事实

官方《ChatGPT Work and Codex》：

- **Work 与 Chat 的区别**：Chat 做快速问答，Work 做更长、多步骤、交付成品的任务，区别见 [/guides/chatgpt-chat-vs-work-difference](/guides/chatgpt-chat-vs-work-difference)；
- **云端与本地**：网页和手机上的 Work 在云端运行，不能读你电脑上的文件；桌面版里的 Work 经你允许后可以使用本地文件和桌面应用。本地的 Work 在你的电脑上运行，消息和任务上下文可能存在云端；
- **批准**：在网页和手机上，用屏幕上的控件批准或拒绝，不支持语音批准；
- **用量**：Work 与 Codex 用同一套用量结构，用量因任务而异；
- **计划任务**：可以运行一次、按计划重复、被触发或监控变化，你可以查看进度、回答问题、改变方向、批准重要操作。

## 二、判断：是在跑、在等你，还是卡住

1. **打开任务，看最新一条记录**：有没有向你提问、有没有等待批准的操作；
2. **有提问或待批准**：回答或批准，任务才会往下走；
3. **没有任何提问，也没有新的进展**：超过一两分钟，按官方的卡住顺序处理，官方没有给 Work 的专门时间线，30 到 60 秒是官方对一般卡住状态给的判断线。

## 三、官方的卡住排查顺序

1. **等 30 到 60 秒**，然后**停止**并**重新生成**；
2. **新开一个对话**；
3. **重新加载页面**，或强制刷新；**退出登录再登录**；
4. **关闭扩展和 VPN**；
5. **换浏览器或网络**；
6. **看官方状态页**，读法见 [/guides/chatgpt-down-check-status-page](/guides/chatgpt-down-check-status-page)。

桌面版：先**更新**（菜单 → Check for Updates），找不到 Work 或功能异常，也见 [/guides/chatgpt-cant-find-new-model-gpt-6-codex](/guides/chatgpt-cant-find-new-model-gpt-6-codex)。

![Work 任务不动的处理顺序](seed:g1203-work-steps.png)
*图：本站根据 [OpenAI 帮助中心：ChatGPT Work and Codex](https://help.openai.com/en/articles/20001275-chatgpt-work-and-codex) 整理的示意图*

## 四、用量不够会怎样

官方说 Work 与 Codex 用同一套用量结构，GPT-6 Astra 从套餐的内含额度里扣，Plus 和 Business 标准席位的 Astra 用量有限，用完后可以选用积分。额度够不够，先看 [/guides/chatgpt-usage-limits-check-reset](/guides/chatgpt-usage-limits-check-reset)。套餐的区别见 [/guides/chatgpt-plans-comparison](/guides/chatgpt-plans-comparison)，想开通可以看 [/chongzhi/chatgpt-plus](/chongzhi/chatgpt-plus)，具体额度以官方为准。

## 五、联系官方客服

仍然没有进展，联系官方客服，见 [/guides/chatgpt-contact-support](/guides/chatgpt-contact-support)。建议带上：任务链接、时间、你的套餐和设备、桌面版或 App 的版本，以及你已经做过的步骤。网页上还可附 HAR 文件和控制台错误。

## 官方没说的

- **Work 任务要多久**，官方没有给时间；
- **怎样停止运行中的任务**，官方 Work 文章没有写步骤；
- 官方通用步骤让你**关闭** VPN，没有说换地区能解决，本文不介绍绕开地区限制的做法；
- 工作区的管理员可以分别管理 Work Cloud、Work Local 和 Codex Local，你没有 Work 时先问管理员。

## 常见问题

**Q：Working 是不是一定卡住了？**
不一定。Work 处理的是长任务，也可能在等你批准。先看任务里有没有待处理的提问。

**Q：能不能用语音批准？**
不能，官方说网页和手机上不支持语音批准。

**Q：停止后之前的进度会没吗？**
官方没有说明，建议先把任务的链接和已有结果保存下来。

**Q：本地 Work 读不到文件？**
官方说桌面版的 Work 经你允许才能使用本地文件和应用，要看权限设置。

## 参考资料

- OpenAI 帮助中心：ChatGPT Work and Codex — https://help.openai.com/en/articles/20001275-chatgpt-work-and-codex
- OpenAI 帮助中心：Scheduled tasks in ChatGPT — https://help.openai.com/en/articles/10291617-scheduled-tasks-in-chatgpt
- OpenAI 帮助中心：Troubleshooting ChatGPT Error Messages — https://help.openai.com/en/articles/7996703-troubleshooting-chatgpt-error-messages
