---
title: ChatGPT 的 GPT-4o 不见了怎么办：2026 年 2 月已下线，旧对话和自建 GPT 现在用什么、还能不能选回来
slug: chatgpt-gpt-4o-missing-retired
products: [chatgpt]
models: []
accountTier: FREE
excerpt: ChatGPT 模型菜单里找不到 GPT-4o？按 OpenAI 帮助中心，GPT-4o 等模型已在 2026 年 2 月 13 日从 ChatGPT 下线，4 月 3 日起所有套餐彻底下线。本文列出下线时间表、旧对话和自建 GPT 的去向，以及官方说它在 API 里仍保留。
checkedOn: 2026-10-27
sources:
  - https://help.openai.com/en/articles/20001051-retiring-gpt-4o-and-other-chatgpt-models
  - https://help.openai.com/en/articles/20001354-gpt-6-and-other-models-in-chatgpt
verify:
  - 官方文章写的替代模型是 GPT-5.3 Instant 和 GPT-5.4 Thinking、Pro，这是文章当时的写法；现在模型菜单里的模型已经更新（GPT-6、GPT-5.6 Sol 等），旧对话实际落到哪个模型以界面为准
  - 官方文章页面只显示相对的更新时间，没有给出准确日期
  - 官方没有写 ChatGPT 里有「找回旧模型」的开关，正文只写官方明确说过的内容
  - GPT-4o 在 API 里仍可用是官方文章的说法，之后是否下线以官方公告为准
---

> 本文根据 OpenAI 帮助中心《Retiring GPT-4o and other ChatGPT models》和《GPT-6 and other models in ChatGPT》整理，资料核对于 2026-10-27。模型更新很快，请以官方文章和你账号里实际显示的为准。配图为本站整理的示意图，不是界面截图。

## 适用于谁

- 打开 ChatGPT，模型菜单里再也找不到 GPT-4o 的人；
- 以前习惯用 GPT-4o 聊天，发现回答风格变了的人；
- 自己建的 GPT 原来选的是 GPT-4o，不知道现在跑在哪个模型上的人；
- 想知道 GPT-4o 还能不能「选回来」的人。

## 结论先说

1. **不是你的账号出了问题，也不是你没有权限，是官方把它下线了。** OpenAI 帮助中心写明：GPT-4o 等模型已在 **2026 年 2 月 13 日**从 ChatGPT 下线。
2. **一起下线的还有** GPT-4.1、GPT-4.1 mini、OpenAI o4-mini，以及 GPT-5（Instant 和 Thinking，官方说这条之前已经公告过）。
3. **在 Business、Enterprise、Edu 的自建 GPT 里，GPT-4o 保留到 2026 年 4 月 3 日**，这一天之后，所有套餐都不再有 GPT-4o。
4. **旧对话没有丢**：官方说用过这些旧模型的对话和项目，会默认转到较新的模型；自建 GPT 会自动换成最接近的新模型。
5. **ChatGPT 里选不回来**：官方文章没有提供恢复入口。如果你是开发者，官方说这些模型在 **OpenAI API** 里暂时仍保留，将来下线会提前通知。
6. **语音和生图不受影响**：官方说 ChatGPT Voice 和 ChatGPT Images 这次不变，它们的底层模型虽然和 GPT-4o 相近，但不是同一个文字模型。

![找不到 GPT-4o 时的情况对照：旧对话、自建 GPT、语音生图、API](seed:g1120-gpt4o-decide.png)
*图：本站根据 [OpenAI 帮助中心：Retiring GPT-4o and other ChatGPT models](https://help.openai.com/en/articles/20001051-retiring-gpt-4o-and-other-chatgpt-models) 整理的示意图*

## 一、下线时间表

官方文章按时间列了几批：

- **2026-02-13**：GPT-4o、GPT-4.1、GPT-4.1 mini、OpenAI o4-mini、GPT-5（Instant 与 Thinking）从 ChatGPT 下线；
- **2026-02-19**：这是官方写的「保留期截止日」，Enterprise 工作区可以保留 GPT-5 系列到这一天，所有付费用户的 GPT-5 Pro 也保留到这一天；
- **2026-03-11**：GPT-5.1 Instant、GPT-5.1 Thinking、GPT-5.1 Pro 下线；
- **2026-04-03**：Business、Enterprise、Edu 客户在自建 GPT 里使用 GPT-4o 的权限到期，此后 GPT-4o 在所有套餐都彻底下线。

![ChatGPT 模型下线时间表：2 月 13 日、2 月 19 日、3 月 11 日、4 月 3 日](seed:g1120-retire-timeline.png)
*图：本站根据 [OpenAI 帮助中心：Retiring GPT-4o and other ChatGPT models](https://help.openai.com/en/articles/20001051-retiring-gpt-4o-and-other-chatgpt-models) 整理的示意图*

今天是 2026 年 10 月 27 日，上面几个日期都已经过去了。所以如果你现在才发现 GPT-4o 不在，原因就是这个：它不是临时消失，而是**已经正式退出 ChatGPT**。

## 二、旧对话、项目和自建 GPT 现在怎么样

官方的说法很具体：

- 曾经用这些旧模型的**对话和项目**，会默认落到较新的模型上，也就是文章里写的 GPT-5.3 Instant 和 GPT-5.4 Thinking、Pro 的对应版本；
- 使用旧模型的**自建 GPT**，会自动换成最接近的新版本。

这意味着：

1. 对话记录还在，翻出来继续聊没有问题；
2. **继续聊下去时，回答会由新模型来写**，所以语气、长短、格式和以前不一样，是正常现象；
3. 官方只说自建 GPT 会自动换成最接近的新模型，没有说要你重做；但它背后的模型换了，**效果可能和原来不同**，需要的话重新调一下指令，可以参考 [/guides/chatgpt-gpts-retirement](/guides/chatgpt-gpts-retirement)。

要注意：官方这篇文章写的是 2026 年 2 到 4 月的情况，里面提到的 GPT-5.3、GPT-5.4 之后又有了新一代模型。现在模型菜单里有哪些选择，请看 [/guides/chatgpt-gpt6-sol-terra-luna-astra](/guides/chatgpt-gpt6-sol-terra-luna-astra) 和 [/guides/chatgpt-model-picker-thinking](/guides/chatgpt-model-picker-thinking)。

## 三、觉得「回答变差了、变冷淡了」怎么办

官方没有就「风格变化」写专门的建议，下面是本站根据官方行为做的整理，不是官方原话：

1. **在对话里直接说明你想要的语气和长度**，比如要简短、要口语化、不要列太多条目。想一劳永逸，可以在设置里写自定义指令，见 [/guides/chatgpt-custom-instructions](/guides/chatgpt-custom-instructions)，回答太啰嗦的处理见 [/guides/chatgpt-too-wordy-answer-style](/guides/chatgpt-too-wordy-answer-style)；
2. **换思考档位**：模型菜单里有 Instant、Medium、High 等不同档位，输出风格和长度会不同，套餐决定能选哪些档位，见 [/guides/chatgpt-plans-comparison](/guides/chatgpt-plans-comparison)；
3. 觉得质量整体下降，先看 [/guides/chatgpt-answer-quality-dropped](/guides/chatgpt-answer-quality-dropped)。

想用到更高档的模型和更多额度，可以看 [/chongzhi/chatgpt-plus](/chongzhi/chatgpt-plus)。具体每个套餐含哪些档位，以官方页面和模型菜单为准。

## 四、语音和生图是不是也没了

没有。官方在文章里专门说明：**ChatGPT Voice 不变，ChatGPT Images 也不变**。官方给的理由是，它们虽然底层模型和 GPT-4o 相近，但**不是被下线的那个文字模型**。语音功能用不了时见 [/guides/chatgpt-voice-unavailable-not-supported](/guides/chatgpt-voice-unavailable-not-supported)。

## 五、开发者：API 里还能用吗

官方文章写明，这些模型**仍可以通过 OpenAI API 使用**，如果将来要在 API 里下线，官方说会提前通知。注意 ChatGPT 订阅和 API 是两套独立的东西，区别见 [/guides/chatgpt-subscription-vs-openai-api](/guides/chatgpt-subscription-vs-openai-api)。本文不介绍任何第三方「还原旧模型」的工具或镜像站，那些不是官方渠道。

## 常见问题

**Q：我能在设置里把 GPT-4o 开回来吗？**
官方文章没有提供这样的开关，也没有写 ChatGPT 里有恢复入口。

**Q：GPT-4o 是不是只对我下线了？**
不是，官方是对所有套餐下线，Business、Enterprise、Edu 的自建 GPT 多保留到 2026 年 4 月 3 日。

**Q：以前和 4o 聊的对话还能看吗？**
官方说对话和项目会默认转到较新的模型，记录本身不会因为模型下线而消失。

**Q：现在该选哪个模型？**
看你的套餐和需求，见 [/guides/chatgpt-model-picker-thinking](/guides/chatgpt-model-picker-thinking)。模型菜单里没有想要的新模型，见 [/guides/chatgpt-cant-find-new-model-gpt-6-codex](/guides/chatgpt-cant-find-new-model-gpt-6-codex)。

## 参考资料

- OpenAI 帮助中心：Retiring GPT-4o and other ChatGPT models — https://help.openai.com/en/articles/20001051-retiring-gpt-4o-and-other-chatgpt-models
- OpenAI 帮助中心：GPT-6 and other models in ChatGPT — https://help.openai.com/en/articles/20001354-gpt-6-and-other-models-in-chatgpt
