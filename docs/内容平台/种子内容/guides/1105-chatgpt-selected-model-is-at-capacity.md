---
title: ChatGPT 提示「Selected model is at capacity. Please try a different model」怎么办：官方状态页怎么说，换模型与排查顺序
slug: chatgpt-selected-model-is-at-capacity
products: [chatgpt]
models: []
accountTier: FREE
excerpt: ChatGPT 提示 Selected model is at capacity？OpenAI 帮助中心没有这句话的专门文章，但官方状态页出现过相关事件，提示本身也建议换模型。本文说明官方有依据的部分、排查顺序，以及哪些官方没说。
checkedOn: 2026-10-27
sources:
  - https://status.openai.com/incidents/01KT204M76EYZYJX7WYG1B2QPH
  - https://help.openai.com/en/articles/7996703-troubleshooting-chatgpt-error-messages
  - https://help.openai.com/en/articles/20001354-gpt-6-and-other-models-in-chatgpt
verify:
  - 官方帮助中心没有「Selected model is at capacity」这句话的专门文章，本文开头已说明；「容量暂时不够」是根据提示字面和状态页的 Limited capacity 事件做的理解，不是官方对这句话的逐字解释
  - 状态页 2026-06-01 的事件标题是「Decreased ChatGPT availability for Free users」，更新文字是「Limited capacity is causing ChatGPT availability to be reduced」，它不是这句提示的专门事件
  - 2026-07-09 那起「多个模型报这句提示」的事件，是从状态页的第三方镜像读到的，没有在官方状态页原页核实，正文已标明
  - 官方没有写恢复需要多久，正文不写具体分钟数
  - 页面时间没有标时区
---

> 本文根据 OpenAI 状态页、帮助中心《Troubleshooting ChatGPT Error Messages》《GPT-6 and other models in ChatGPT》整理，资料核对于 2026-10-27。**官方帮助中心没有为「Selected model is at capacity. Please try a different model」写专门文章，**所以本文只写官方有依据的部分，其余明确标注。配图为本站整理的示意图，不是界面截图。

## 适用于谁

- 在 ChatGPT 里发消息，看到 **Selected model is at capacity. Please try a different model**（中文大意：所选模型当前已满，请换一个模型试试）的人；
- 在 Codex 里也遇到同样提示的人；
- 想知道这是自己的问题还是官方的问题的人。

## 结论先说

1. **提示本身就是建议**：原文后半句是「Please try a different model」，也就是请**换一个模型**试试。
2. **官方没有写这句话的专门说明**，也没有写恢复需要多久。我能核实到的官方依据是**状态页**：官方状态页出现过一起事件，更新文字写的是「Limited capacity is causing ChatGPT availability to be reduced」，意思是容量有限导致可用性下降（2026 年 6 月 1 日，影响 Free 用户的 Conversations 组件，约一个小时后恢复）。这不是这句提示的专门事件，只能说明**容量问题在官方状态页上确实会被当成事件公布**。
3. **多个模型同时报这句话的情况也出现过**：状态页的第三方镜像记录了 2026 年 7 月 9 日的一起事件，标题是「Users are experiencing elevated errors when selecting models」，更新文字写的是用户收到这句提示，影响多个模型，约 58 分钟后恢复。这条来自镜像，没有在官方状态页原页核实，仅供参考。
4. **处理顺序**：换一个模型 → 稍等一会儿再回原模型 → 看状态页 → 状态页没事就新开对话、刷新、换浏览器或网络 → 仍然不行联系官方客服。
5. **这不是账号问题**：提示里没有任何账号受限的字样。账号层面的限制一般有明确提示，见 [/guides/chatgpt-suspicious-activity-alert](/guides/chatgpt-suspicious-activity-alert)。

![「模型已满」提示：看到什么、对应怎么办的对照表](seed:g1105-capacity-decide.png)
*图：本站根据 [OpenAI 状态页](https://status.openai.com/) 的事件与 [Troubleshooting ChatGPT Error Messages](https://help.openai.com/en/articles/7996703-troubleshooting-chatgpt-error-messages) 整理的示意图*

## 一、先换一个模型

提示让你换模型，就在模型菜单里换一个。你能选哪些，取决于套餐：

- Free 和 Go 用的是 GPT-5.6 Luna，难题选 **Think**；
- Plus 含 Medium 和 High 档位，不含 Extra High 和 Pro；
- Pro、Business、Enterprise 含更多档位。

套餐与档位的官方对照见 [/guides/chatgpt-cant-find-new-model-gpt-6-codex](/guides/chatgpt-cant-find-new-model-gpt-6-codex)，怎么选见 [/guides/chatgpt-model-picker-thinking](/guides/chatgpt-model-picker-thinking)。官方在 GPT-6 说明里还写了：达到某个模型的思考额度上限时，ChatGPT 可能继续用另一个可用模型，这是**额度**问题，和本文的**容量**提示不是一回事，额度见 [/guides/chatgpt-usage-limits-check-reset](/guides/chatgpt-usage-limits-check-reset)。

换模型后能发出去，就说明问题出在原来那个模型上，先用别的，**过一阵再切回来**。官方没有写要等多久，本文不编具体时间。

## 二、看看是不是官方的问题

打开 [status.openai.com](https://status.openai.com/)，看 **ChatGPT** 下的 **Conversations** 等组件，Codex 有单独的组件。官方有事件时，每条更新都有时间和进展，怎么读见 [/guides/chatgpt-down-check-status-page](/guides/chatgpt-down-check-status-page)。

- **有事件**：等官方恢复，状态页上会更新进展；
- **没有事件**：再按下面的通用排查做。

## 三、状态页没事件，只有你报错

官方《Troubleshooting ChatGPT Error Messages》给的通用排查（针对「Something went wrong」「生成回答出错」这类提示，不是专门针对这一句）：

1. **新开一个对话**，再发一次；
2. **刷新页面**，或重启 App；
3. **换一个浏览器，或开无痕窗口**，关闭扩展；
4. **关闭 VPN 和代理**；
5. **换一个网络**，例如换成手机热点。

其中前几步见 [/guides/chatgpt-something-went-wrong](/guides/chatgpt-something-went-wrong)，网络相关见 [/guides/chatgpt-network-error](/guides/chatgpt-network-error)。

![遇到「模型已满」的处理顺序：换模型、稍等、看状态页、通用排查、联系客服](seed:g1105-capacity-steps.png)
*图：本站根据 [OpenAI 状态页](https://status.openai.com/) 与 [Troubleshooting ChatGPT Error Messages](https://help.openai.com/en/articles/7996703-troubleshooting-chatgpt-error-messages) 整理的示意图*

## 四、联系官方客服

反复出现、而且状态页上没有对应事件时，联系官方客服，见 [/guides/chatgpt-contact-support](/guides/chatgpt-contact-support)。官方在其他排查文章里建议附上：账号邮箱、报错的截图、第一次出现的时间（带时区）、设备和浏览器信息。在 Codex 里遇到，也一样说明是在 Codex 里。

## 五、官方没说的，别当成结论

- **为什么偏偏是我**：官方没有说明哪些用户更容易遇到，也没有说和套餐的关系。状态页里确实有一起事件写明影响 Free 用户，但这不代表付费用户不会遇到；
- **要等多久**：官方没有给时间；
- **能不能靠换账号、换地区解决**：官方没有这样说，本文也不介绍任何绕开限制的做法；
- 想要更宽裕的使用，可以看 [/chongzhi/chatgpt-plus](/chongzhi/chatgpt-plus)，但套餐不能保证不遇到容量提示。

## 常见问题

**Q：这是不是我的额度用完了？**
不是。额度用完的提示一般会写明已达上限和重置时间，见 [/guides/chatgpt-too-many-requests-limit](/guides/chatgpt-too-many-requests-limit)。这句提示说的是所选模型当前容量不够。

**Q：为什么换了模型也不行？**
可能多个模型同时受影响，先看状态页；没有事件的话，按第三节通用排查。

**Q：官方有这句话的说明吗？**
帮助中心没有专门文章。状态页上有容量相关的事件，提示本身也让你换模型。

## 参考资料

- OpenAI 状态页事件（2026-06-01，Limited capacity）— https://status.openai.com/incidents/01KT204M76EYZYJX7WYG1B2QPH
- OpenAI 帮助中心：Troubleshooting ChatGPT Error Messages — https://help.openai.com/en/articles/7996703-troubleshooting-chatgpt-error-messages
- OpenAI 帮助中心：GPT-6 and other models in ChatGPT — https://help.openai.com/en/articles/20001354-gpt-6-and-other-models-in-chatgpt
