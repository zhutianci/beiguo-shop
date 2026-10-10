---
title: Gemini 模型有哪些、有什么区别：Flash-Lite、Flash、Pro 与思考等级怎么选
slug: gemini-models-flash-pro-thinking-level
products: [gemini]
models: [gemini-llm]
accountTier: FREE
excerpt: 按官方帮助中心讲清 Gemini App 里的三个模型（Flash-Lite、Flash、Pro）各适合什么、自动选择模型是什么、怎么手动切换和调思考等级、Deep Think 谁能用，以及怎么看某条回答到底用了哪个模型。
checkedOn: 2026-10-10
sources:
  - https://support.google.com/gemini/answer/18648722
  - https://support.google.com/gemini/answer/16275805
  - https://support.google.com/gemini/answer/16345172
  - https://support.google.com/gemini/answer/13275745
  - https://gemini.google/subscriptions/
verify:
  - 思考等级的名称：「About Gemini models」页写 Low / Medium / High（不选默认 Low），「limits & upgrades」页写 Standard / Extended / Deep Think，两处不同，以实际界面为准
  - 手动切换模型的条件：「About Gemini models」写需要 Google AI 方案，「Use Gemini Apps」只写需要登录
  - 各档可用的模型版本：帮助中心表格写四档都能用 Flash-Lite / Flash / Pro（Gemini 3 系列）；订阅页写免费 3.5 Flash-Lite、AI Plus 3.6 Flash + 3.1 Pro、AI Pro / Ultra 3.8 Flash + 3.1 Pro，两处不一致
---

> 本文根据 Google 官方 Gemini 帮助中心整理，核对日期 2026-10-10。官方注明「模型名称、版本和可用性可能变化」，以你在界面上看到的为准。本文讲的是 Gemini App（gemini.google.com 和手机 App）里的模型，不是开发者 API 的模型列表。

## 适用于谁

- 搜「gemini 模型区别」「gemini 模型有哪些」「gemini flash 和 pro 的区别」的人；
- 看到输入框里的模型名和「思考等级」，不知道该选哪个的人；
- 想知道 Deep Think 是什么、谁能用的人。

## 结论先说

1. **Gemini App 目前是三个模型**：Flash-Lite（最快）、Flash（均衡）、Pro（最强，较慢）。
2. **默认不用自己选**：「自动选择模型」会把每条提问分配给合适的模型和思考等级，目的是又好又省额度。
3. **想自己选**：点输入框里的模型名切换，还可以选思考等级；选定后这个对话会一直沿用。
4. **越强越费额度**：更高级的模型、更高的思考等级会消耗更多用量；付费用户额度用完后可以继续用 Flash-Lite。
5. **Deep Think** 是最高一档的推理，只有 Google AI Ultra（或 Ultra for Business）用户能用，需要选 Pro 模型，一次回答可能要几分钟。

## 一、三个模型分别适合什么

| 模型 | 官方说明 | 适合 |
| --- | --- | --- |
| Gemini Flash-Lite | 高效、主打速度的「主力」模型 | 摘要、头脑风暴、简单问答这类日常任务 |
| Gemini Flash | 更强，在速度和推理之间取平衡 | 大多数问题，从简单到较复杂 |
| Gemini Pro | 最先进的模型，擅长复杂数学和编程，对文本、文件、图片、视频理解更深，在编程和学习方面有较大提升 | 难题、长文档分析、写代码；回答一般比其他模型慢 |

帮助中心的「模型可用性」表里，无订阅、AI Plus、AI Pro、AI Ultra 四档对三个模型都标的是「可用」。而官方订阅页（美国版）写得更具体：免费档列的是「3.5 Flash-Lite」，AI Plus 列的是「3.6 Flash」和「3.1 Pro」，AI Pro 和 Ultra 列的是「3.8 Flash」和「3.1 Pro」。两处说法并不完全一致，版本号也会随发布更新，以你在模型菜单里实际看到的为准。区别主要在**额度**（付费档是无订阅的 2 倍、4 倍，Ultra 更高）和**上下文窗口**（无订阅 32k token，AI Plus 128k，AI Pro / Ultra 100 万 token），详见本站《Gemini 怎么看额度》和《Gemini 会员有什么区别》。

## 二、自动选择模型

Gemini 默认开着「自动选择模型（auto model selection）」。按帮助中心的说法，开启时你的提问会被自动分配给**最合适、最省的模型和思考等级**，既保证回答质量，也帮你节省用量。

**开关位置**（网页版）：左下角「设置（Settings）」→「用量限制（Usage limits）」，页面底部有「自动选择模型」的开关。

**想知道某条回答用的是哪个模型**：

1. 打开那个对话；
2. 在回答底部点「更多（More）」；
3. 选「显示思考步骤（Show thinking steps）」；
4. 拉到思考步骤的最底部，会写明所用的模型。

## 三、手动切换模型和思考等级

1. 打开 gemini.google.com 并登录；
2. 点输入框底部当前的模型名；
3. 选想用的模型；带锁图标的更高档模型需要升级到对应方案；
4. （可选）选思考等级。

需要知道的几点：

- 帮助中心写明，有 Google AI 方案的用户可以在「聊天模式」和「任务模式（Task Mode，即 Gemini Spark 的任务）」里手动切换模型；
- 你选定的模型和思考等级会在**当前对话**里一直生效，之后回到这个对话也还是它；
- 思考等级的叫法，官方两个页面不一样：模型说明页写的是 **Low / Medium / High**，不选时默认 Low；额度说明页写的是 **Standard（标准，默认，回答更快）/ Extended（扩展，适合复杂问题，会先思考更久）/ Deep Think**。可以理解为同一件事：等级越高，回答前想得越久、越费额度。以你界面上看到的名称为准。

## 四、Deep Think 是什么

Deep Think 是 Gemini 最高一档的推理能力，官方描述为「最大程度的并行推理」，适合特别复杂的问题。

- **谁能用**：Google AI Ultra 订阅用户，或有 Google AI Ultra for Business 许可的工作账号；须年满 18 岁并登录；
- **怎么开**：点输入框里的模型名选 **Pro**，再点一次模型名，在「思考等级（Thinking Level）」里选 **Deep Think**，然后输入问题发送；
- **要等多久**：通常几分钟。等待时可以离开去开别的对话，好了之后网页版会在对话旁提示，手机上会推送通知；
- **限制**：到达用量上限后 Deep Think 会暂时不可用，等额度刷新；
- 官方把它标为**实验性功能**，可能随时调整或暂停。

Deep Think 和 Deep Research 不是一回事：前者是「想得更深」的回答模式，后者是会联网读大量资料、产出带引用报告的研究功能（见本站《Gemini Deep Research 不见了怎么办》）。

## 五、怎么选（按官方定位整理）

| 场景 | 建议 |
| --- | --- |
| 不想操心 | 保持「自动选择模型」开启 |
| 改写、摘要、翻译、随口一问 | Flash-Lite 或 Flash，标准思考 |
| 多步推理、数学题、分析长文档 | Pro，或提高思考等级 |
| 写代码、调试 | Pro |
| 额度快用完 | 换回 Flash / Flash-Lite、降低思考等级 |

## 常见问题

**Q：免费账号能用 Pro 吗？**
帮助中心的模型可用性表里，无订阅一栏对 Pro 也标了「可用」；但免费账号的总额度是「标准额度」，Pro 和高思考等级消耗更快，用完要等刷新。能否手动指定模型，官方两处说法不完全一致（见文首说明），以界面为准。

**Q：为什么回答变慢了？**
Pro 和更高的思考等级本来就更慢，这是官方明确说明的。日常问题换回 Flash 或标准思考即可。

**Q：额度用完会怎样？**
有 Google AI 方案的用户会自动改用 Flash-Lite 继续对话；也可以等 5 小时刷新，或升级更高档的方案。

**Q：Gemini App 里的模型和 API 里的模型一样吗？**
名字同属 Gemini 家族，但 API 有自己的一套模型 ID、限额和计费，见本站《Gemini API 免费额度是多少》等开发者教程。

## 参考资料

- About Gemini models（Gemini 帮助中心）：https://support.google.com/gemini/answer/18648722
- Gemini Apps limits & upgrades for Google AI subscribers：https://support.google.com/gemini/answer/16275805
- Use Deep Think in Gemini Apps：https://support.google.com/gemini/answer/16345172
- Use Gemini Apps：https://support.google.com/gemini/answer/13275745
- Google AI 订阅方案（各档列出的模型版本）：https://gemini.google/subscriptions/
