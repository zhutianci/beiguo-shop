---
title: ChatGPT 生图一直「Creating image」、卡在 One last tweak 怎么办：官方没写这些进度提示，按卡住排查和额度提示处理
slug: chatgpt-image-stuck-creating-image
products: [chatgpt]
models: []
accountTier: FREE
excerpt: ChatGPT 生图一直显示 Creating image，或停在 One last tweak？官方没有收录这些进度文字，但有卡住的通用排查、生图额度提示和下载类说明。本文按官方顺序整理，帮你分清是卡住、额度还是内容问题。
checkedOn: 2026-10-28
sources:
  - https://help.openai.com/en/articles/7996703-troubleshooting-chatgpt-error-messages
  - https://help.openai.com/en/articles/9047779-why-is-my-chatgpt-taking-so-long-to-respond
verify:
  - 官方帮助中心没有收录「Creating image」「One last tweak」这类生图进度文字，也没有解释它们的含义；正文套用官方对卡住状态的通用步骤，开头已说明
  - 官方没有给生图的预期耗时，正文不写具体秒数，只引用官方「先等 30 到 60 秒」的通用判断线
  - 生图额度和失败原因的细节指向本站另外两篇文章，本文不重复数字
  - 官方文章页面只显示相对的更新时间
---

> 本文根据 OpenAI 帮助中心《Troubleshooting ChatGPT Error Messages》《Why is my ChatGPT taking so long to respond?》整理，资料核对于 2026-10-28。**官方没有收录「Creating image」「One last tweak」这类生图进度文字，**本文只写官方对卡住状态的通用排查，没有依据的不编。配图为本站整理的示意图，不是界面截图。

## 适用于谁

- 让 ChatGPT 画图，一直停在 **Creating image**（正在生成图片）的人；
- 看到 **One last tweak** 之类的文字后长时间没有出图的人；
- 分不清是卡住、额度用完，还是内容被拒的人。

## 结论先说

1. **官方没有解释这些进度文字。** 它们是生图过程中的状态，官方对同类卡住（Thinking、Generating、Working）有通用做法：**先等 30 到 60 秒，再停止并重新生成**。
2. **先看有没有别的提示**：如果同时出现**额度已用完**，那是额度问题，看恢复时间，见 [/guides/chatgpt-image-limits](/guides/chatgpt-image-limits)；如果提示**内容不合要求**，要改写要求，见 [/guides/chatgpt-image-failed](/guides/chatgpt-image-failed)。
3. **不要连续点很多次重新生成**，一次一次地试，才知道哪一步有用，也不会白白消耗额度。
4. 接着按官方顺序：**新开对话** → 强制刷新或退出重登 → 关闭扩展和 VPN → 换浏览器或网络 → 看状态页。
5. 图出来了但**下载失败**，见 [/guides/chatgpt-network-error-image-download](/guides/chatgpt-network-error-image-download)。
6. **仍然不行**，联系官方客服，附时间和你的提示词（去掉隐私内容）。

![生图一直 Creating image：对照表](seed:g1202-image-decide.png)
*图：本站根据 [OpenAI 帮助中心：Troubleshooting ChatGPT Error Messages](https://help.openai.com/en/articles/7996703-troubleshooting-chatgpt-error-messages) 与 [Why is my ChatGPT taking so long to respond?](https://help.openai.com/en/articles/9047779-why-is-my-chatgpt-taking-so-long-to-respond) 整理的示意图*

## 一、先分清是哪一种

| 你看到的 | 更可能是 | 看哪篇 |
| --- | --- | --- |
| Creating image 很久，没有别的提示 | 卡住 | 本文 |
| 提示已达生图上限、写明恢复时间 | 额度 | [/guides/chatgpt-image-limits](/guides/chatgpt-image-limits) |
| 提示无法生成、不符合要求 | 内容被拒或生成失败 | [/guides/chatgpt-image-failed](/guides/chatgpt-image-failed) |
| 图出来了，下载不了 | 下载或网络 | [/guides/chatgpt-network-error-image-download](/guides/chatgpt-network-error-image-download) |

官方没有给「Creating image」这类文字的含义，所以靠上表按其他提示来判断更可靠。生图的基本用法见 [/guides/chatgpt-image-generation-beginner-guide](/guides/chatgpt-image-generation-beginner-guide)。

## 二、官方的卡住排查顺序

对卡在 Thinking…、Generating…、Working… 或转圈的状态，官方的顺序是：

1. **等 30 到 60 秒**，然后**停止**并**重新生成**；
2. **新开一个对话**；
3. **重新加载页面**，或强制刷新；**退出登录再登录**；
4. **关闭扩展和 VPN**；
5. **换浏览器或网络**；
6. **看官方状态页**；
7. 仍然不行，**联系客服前收集诊断信息**。

官方《Why is my ChatGPT taking so long to respond?》还提到：用 **Shift + 刷新**强制刷新，或开启关闭了扩展的**无痕窗口**；退出登录再登录并**清除站点数据**；换一个模型新开对话，判断是模型还是账号的问题。

![生图卡住的处理顺序：等待、重新生成、看额度、新对话、关扩展、联系客服](seed:g1202-image-steps.png)
*图：本站根据 [OpenAI 帮助中心：Troubleshooting ChatGPT Error Messages](https://help.openai.com/en/articles/7996703-troubleshooting-chatgpt-error-messages) 整理的示意图*

## 三、生图本身的几点提醒

- **一次只做一张**：同时要很多张、要求很复杂，更容易久等，这是本文的经验提示，不是官方原话；
- **提示词里不要夹带大量文字要求**，中文文字的处理见 [/guides/chatgpt-image-chinese-text](/guides/chatgpt-image-chinese-text)；
- 想用更强的生图，可以看 [/guides/gpt-image-2-how-to](/guides/gpt-image-2-how-to)，提示词写法见 [/guides/chatgpt-image-prompt-commands](/guides/chatgpt-image-prompt-commands)。

## 四、联系官方客服

官方要求联系客服前先收集：出问题那次会话的 **HAR 文件**、浏览器**控制台错误**、**请求 ID**、**时间戳**、**对话网址**。入口见 [/guides/chatgpt-contact-support](/guides/chatgpt-contact-support)。别在提示词里放不想让别人看到的隐私。

## 官方没说的

- **生图要多久算正常**，官方没有给时间；
- **这些进度文字的含义**，官方没有解释；
- 官方通用步骤让你**关闭** VPN，没有说换地区能解决，本文不介绍绕开地区限制的做法；
- 想有更多生图额度，可以看 [/chongzhi/chatgpt-plus](/chongzhi/chatgpt-plus)，具体次数以官方为准。

## 常见问题

**Q：Creating image 一直不动会不会白扣额度？**
官方没有说明。先看界面有没有额度提示，额度怎么看见 [/guides/chatgpt-usage-limits-check-reset](/guides/chatgpt-usage-limits-check-reset)。

**Q：One last tweak 是什么意思？**
官方没有解释，字面看是最后调整的进度文字，是否卡住按等 30 到 60 秒的线判断。

**Q：手机上卡？**
手机 App 的排查见 [/guides/chatgpt-app-crash-troubleshooting](/guides/chatgpt-app-crash-troubleshooting)。

**Q：怎么确认是不是官方故障？**
看 [/guides/chatgpt-down-check-status-page](/guides/chatgpt-down-check-status-page)。

## 参考资料

- OpenAI 帮助中心：Troubleshooting ChatGPT Error Messages — https://help.openai.com/en/articles/7996703-troubleshooting-chatgpt-error-messages
- OpenAI 帮助中心：Why is my ChatGPT taking so long to respond? — https://help.openai.com/en/articles/9047779-why-is-my-chatgpt-taking-so-long-to-respond
