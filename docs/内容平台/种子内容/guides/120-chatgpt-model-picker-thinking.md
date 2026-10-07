---
title: ChatGPT 模型怎么选：Instant、Thinking 思考强度与 Pro 模型（2026 年 10 月版）
slug: chatgpt-model-picker-thinking
products: [chatgpt]
models: []
accountTier: PLUS
excerpt: ChatGPT 的模型选择器 2026 年改成了 Instant、Medium、High、Extra High、Pro 几档思考强度。本文按官方帮助中心讲清各套餐能选哪些、背后是什么模型（GPT-5.6 Luna / Sol、GPT-6 Pro）、什么时候该开高思考、为什么思考很久，以及额度用完后的回退规则。
checkedOn: 2026-10-07
sources:
  - https://help.openai.com/en/articles/20001354-gpt-56-and-gpt-6-pro-in-chatgpt
  - https://help.openai.com/en/articles/12003714-chatgpt-business-models-and-limits
  - https://help.openai.com/en/articles/9793128-about-chatgpt-pro-tiers
  - https://help.openai.com/en/articles/20001053-what-to-expect-when-models-change
  - https://help.openai.com/en/articles/9624314-model-release-notes
  - https://help.openai.com/en/articles/6825453-chatgpt-release-notes
verify:
  - 协调者提供「GPT-5.5 将于 2026-10-14 退役」，但帮助中心的模型发布说明里尚未查到对应条目，正文只写「旧模型会陆续退役」
  - 截图是 2026-06-10 发布说明里的选择器，之后选择器又改为 GPT-5.6 的 Thinking 滑块，实际界面可能不同
  - Business 设置里仍有「Higher intelligence（更高智能）」开关，Plus / Pro 已移除，中文名称以界面为准
---

> 本文根据 OpenAI 帮助中心《GPT-5.6 and GPT-6 Pro in ChatGPT》、Business 模型与限制、Pro 套餐说明和发布说明整理，资料核对于 2026-10-07。**模型名称和档位变化非常快**，请以你账号里的选择器为准。

## 适用于谁

- 打开模型菜单，不知道 Instant、Medium、High、Extra High 有什么区别的人；
- 觉得 ChatGPT「思考很久」或者「回答太浅」，想调一调的人；
- 在网上看到 GPT-5.6、GPT-6、Sol、Luna、Astra 一堆名字，理不清的人。

## 结论先说

1. **现在选的是「思考强度」，不是型号**：付费套餐的选择器是 **Instant → Medium → High → Extra High → Pro**，前四档都由 **GPT-5.6 Sol** 驱动，越往后想得越久；**Pro** 档使用 GPT-5.6 Sol Pro，符合条件的套餐还有 **GPT-6 Pro**（由 GPT-6 Astra 驱动）。
2. **Free 和 Go 没有选择器的高档位**：默认 **GPT-5.6 Luna**，难题点 **Think**，用的仍是 GPT-5.6 Luna。
3. **按套餐能选的**：Plus = Instant、Medium、High；Pro 和 Business = 再加 Extra High 和 Pro；Enterprise 视工作区设置。
4. **2026 年 9 月起 Plus 和 Pro 不再自动切换**：选了 Instant 就一直是 Instant，复杂问题需要你手动调高；在对话里说「多想想」也不会自动换档（出于安全原因的自动切换除外）。
5. **Work 和 Codex 有自己的模型**：GPT-6 Sol、GPT-6.1 Sol、GPT-6 Luna、GPT-5.6 Terra 等只在 Work / Codex 里选，普通对话里看不到。

## 各档位怎么用

| 档位 | 背后模型（付费套餐） | 适合 |
| --- | --- | --- |
| Instant | GPT-5.6 Sol（Free / Go 为 GPT-5.6 Luna） | 日常问答、改写、翻译、闲聊 |
| Medium | GPT-5.6 Sol，标准思考 | 需要一点推理的问题：方案对比、简单数据计算 |
| High | GPT-5.6 Sol，深入思考 | 写复杂代码、数学证明、多步骤规划 |
| Extra High | GPT-5.6 Sol 最高思考强度 | 很难的问题，愿意等更久 |
| Pro | GPT-5.6 Sol Pro / GPT-6 Pro | 高难度任务、长时间运行的工作流 |

![模型选择器（2026 年 6 月版）：Intelligence 下有 Instant、Medium、High、Extra High、Pro（含 Pro Standard / Pro Extended），底部是 GPT-5.5（英文界面）](seed:g120-model-picker-2026-06.png)
*图片来源：[OpenAI 帮助中心《ChatGPT — Release Notes》2026-06-10 条目](https://help.openai.com/en/articles/6825453-chatgpt-release-notes)*

**在哪里切换**：网页版的选择器在输入框里；iOS 和安卓在对话页顶部。Free 和 Go 在输入框 **+** 菜单里选 Think。

## 什么时候该调高

一个简单的判断方法：**如果你自己做这件事需要拿纸笔算一算、或者需要反复推敲，就调到 Medium 或 High。**

- 「帮我把这段话改得更礼貌」→ Instant 足够；
- 「这三个报价方案按五年总成本哪个划算，考虑通胀」→ Medium；
- 「这段 300 行代码偶尔死锁，帮我找原因并修复」→ High；
- 「审阅这份 40 页合同里的风险条款并给出修改建议」→ High 或 Pro（视套餐）。

思考强度越高，等待越久，也越快用完思考额度。日常问题开 Instant 反而又快又好。

## 为什么「思考很久」

- 选了 High、Extra High 或 Pro，本来就会花更长时间；
- 问题本身需要搜索、分析文件或调用工具；
- 高峰期排队。

不想等就把档位调低，或者把问题拆小、把要求说具体。回答进行中也可以随时打断。

## 额度用完会怎样

- **Thinking 额度**：手动选 Medium / High / Extra High 用的是 GPT-5.6 Sol，达到上限后 ChatGPT 可能改用其他可用模型继续，并显示额度何时重置。
- **Pro 模型额度**：GPT-6 Pro 有使用上限，Pro 订阅也**不是**无限用。Pro 200 达到 GPT-6 Pro 每周上限后，会自动切到 GPT-5.6 的 Medium 思考；Pro 100 的 GPT-6 Pro 和 GPT-5.6 Sol Pro 共用一个每周额度，来回切换不会多出次数。Business Standard 每月 15 条、Premium 每周 50 条 Pro 消息，同样两个模型共用。
- **客服不能帮你重置额度**。只有在你认为计数有误、或到了重置时间还不能用时，才需要联系客服。

## 名字太多？一张表理清

| 名字 | 是什么 | 在哪用 |
| --- | --- | --- |
| GPT-5.6 Luna | GPT-5.6 家族里最快、成本最低的 | Free / Go 的默认模型；Work、Codex、API |
| GPT-5.6 Terra | 能力、速度、成本平衡 | Work、Codex、API（普通对话不可选） |
| GPT-5.6 Sol | 面向复杂工作 | 付费套餐 Chat 的 Instant 到 Extra High；Work、Codex、API |
| GPT-5.6 Sol Pro | GPT-5.6 最高能力选项 | Pro、Business、Enterprise 的 Pro 档 |
| GPT-6 Astra | 新一代旗舰，擅长编程、研究、电脑操作 | Chat 中以「GPT-6 Pro」形式提供给 Pro 100 / 200、Business、Enterprise；Plus 在 Work 和 Codex 中可用 |
| GPT-6 Sol / 6.1 Sol / GPT-6 Luna | Work 和 Codex 专用模型 | 仅 Work、Codex |

旧模型会陆续退役（例如 GPT-4o、GPT-4.5、o3 已经下线）。官方说明模型更替时，之前的对话会延续到新模型上；如果你习惯旧模型的语气，可以用个性和自定义指令调整，见 [/guides/chatgpt-custom-instructions](/guides/chatgpt-custom-instructions)。

## 常见问题

**Q：设置里的「Higher intelligence（更高智能）」去哪了？**
Plus 和 Pro 的网页版已经移除这个设置，改用选择器自己选。Business 仍在 **Settings → General** 里，用来控制选 Instant 时是否自动加思考（会消耗思考额度）。

**Q：为什么我看不到 GPT-5.6 Sol？**
Free 和 Go 不包含 Sol；付费用户先确认登录的是正确账号；公司工作区问管理员是否开放了该模型。

**Q：语音对话用的是什么模型？**
语音由 GPT-Live 驱动，需要搜索或推理时可以调用 GPT-5.6 或 GPT-6 Astra，模型和思考强度用和文字对话相同的控件选择，见 [/guides/chatgpt-voice-mode](/guides/chatgpt-voice-mode)。

**Q：哪个套餐适合我？**
见 [/guides/chatgpt-plans-comparison](/guides/chatgpt-plans-comparison)。需要 Plus 可以看 [/chongzhi/chatgpt-plus](/chongzhi/chatgpt-plus)。

## 参考资料

- OpenAI 帮助中心：GPT-5.6 and GPT-6 Pro in ChatGPT — https://help.openai.com/en/articles/20001354-gpt-56-and-gpt-6-pro-in-chatgpt
- OpenAI 帮助中心：ChatGPT Business models and limits — https://help.openai.com/en/articles/12003714-chatgpt-business-models-and-limits
- OpenAI 帮助中心：About ChatGPT Pro tiers — https://help.openai.com/en/articles/9793128-about-chatgpt-pro-tiers
- OpenAI 帮助中心：What to expect when models change — https://help.openai.com/en/articles/20001053-what-to-expect-when-models-change
- OpenAI 帮助中心：Model Release Notes — https://help.openai.com/en/articles/9624314-model-release-notes
- ChatGPT Release Notes（2026-06-10 选择器简化、2026-08-06 GPT-5.6、2026-09-14 停止自动切换）— https://help.openai.com/en/articles/6825453-chatgpt-release-notes
