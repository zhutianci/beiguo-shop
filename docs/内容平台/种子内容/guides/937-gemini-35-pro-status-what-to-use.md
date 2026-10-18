---
title: Gemini 3.5 Pro 是什么、发布了吗、怎么用：官方说法梳理，以及现在 Gemini 里该选哪个模型
slug: gemini-35-pro-status-what-to-use
products: [gemini]
models: [gemini-llm]
accountTier: PRO
excerpt: Gemini 3.5 Pro 发布了吗？按 Google 官方博客、Gemini 更新记录和 API 模型列表核对：截至 2026-10-19 官方没有宣布 3.5 Pro 已发布，最新的是 Gemini 4 Argon。讲清官方说过什么，以及 Gemini 应用里各套餐现在能选哪些模型。
checkedOn: 2026-10-19
sources:
  - https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-3-5/
  - https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-3-6-flash-3-5-flash-lite-3-5-flash-cyber/
  - https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-4-argon/
  - https://blog.google/innovation-and-ai/products/gemini-app/gemini-4-argon-availability/
  - https://gemini.google/release-notes/
  - https://support.google.com/gemini/answer/18648722?hl=en
  - https://ai.google.dev/gemini-api/docs/models
verify:
  - 「3.5 Pro 未发布」是 2026-10-19 对官方博客、Gemini 更新记录和 Gemini API 模型文档的核对结果：这三处都没有 3.5 Pro 已发布的记录；官方最新一次提到 3.5 Pro 是 2026-07-21 的博客，说它「正在与合作伙伴测试」
  - 官方没有给出 3.5 Pro 的发布日期、价格或上下文窗口，本文不写任何推测数字
  - 帮助中心「About Gemini models」把应用里的档位写成 Flash-Lite、Flash、Pro、Argon，没有写 Pro 对应的具体版本号；更新记录里最近一次介绍 Pro 的是 2026-02-19 的 Gemini 3.1 Pro
  - 套餐与模型对应表官方注明「可能随时变化」，且工作或学校账号取决于 Workspace 许可
---

> 本文根据 Google 官方博客、Gemini 应用更新记录（gemini.google/release-notes）、Gemini 帮助中心《About Gemini models》和 Gemini API 模型文档整理，资料核对于 2026-10-19。**官方没有宣布 3.5 Pro 已发布**，本文只写官方明确说过的话，不引用传闻。图为本站整理的示意图。

## 适用于谁

- 搜「gemini 3.5 pro」「gemini 3.5」，想知道它是什么、发布没有的人；
- 在 Gemini 里找不到 3.5 Pro，怀疑是账号或地区问题的人；
- 想知道现在 Gemini 里到底该选哪个模型的人；
- 在 Pro、Argon 这些名字里绕晕了的人。

## 结论先说

1. **3.5 Pro 还没有正式发布**：2026-05-19，Google 发布 Gemini 3.5 家族，只先放出了 **3.5 Flash**，同一篇博客说「我们正在全力开发 3.5 Pro，内部已经在用，期待下个月推出」；2026-07-21 的官方博客更新为「3.5 Pro 目前正在与合作伙伴测试，准备好后会广泛开放」。此后到 2026-10-19，Gemini 应用更新记录和 API 官方模型列表里都没有出现 3.5 Pro。所以你在 Gemini 里找不到它，**不是账号或地区问题**。
2. **官方最新的旗舰是 Gemini 4 Argon**：2026-09-30 官方发布，2026-10-13 进入 Gemini 应用，面向 **Google AI Pro 和 Ultra 订阅用户**。
3. **应用里的模型档位**：官方帮助中心列的是 Flash-Lite、Flash、Pro、Argon 四档，具体能选哪几档取决于你的 Google AI 套餐。
4. **怎么选**：日常快问快答用自动选择或 Flash；复杂问题选 Pro；订阅了 Pro 或 Ultra 的，最难的任务用 Argon。

![Gemini 3.5 Pro：官方说法的时间线](seed:g937-gemini-35-pro-timeline.png)
*图：本站根据 [Gemini 3.5 发布博客](https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-3-5/)、[3.6 Flash 等发布博客](https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-3-6-flash-3-5-flash-lite-3-5-flash-cyber/)、[Gemini 4 Argon 博客](https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-4-argon/) 与 [Gemini API 模型文档](https://ai.google.dev/gemini-api/docs/models) 整理的示意图*

## 一、官方到底说过什么

**2026-05-19，「Gemini 3.5：frontier intelligence with action」**：官方介绍 Gemini 3.5 是「把前沿智能和行动结合」的新模型家族，先发布 **3.5 Flash**，面向 Gemini 应用和 Google 搜索 AI 模式的所有人、开发者和企业开放。文中同时说：「我们也在全力开发 3.5 Pro，它已经在内部使用，期待下个月推出。」

**2026-07-21，「Introducing Gemini 3.6 Flash, 3.5 Flash-Lite, and 3.5 Flash Cyber」**：官方发布了三个新模型，并写道：「除了今天的发布，Gemini 3.5 Pro 目前正在与合作伙伴测试，我们计划在准备好后尽快广泛开放。」同一篇博客还提到团队已经开始了 Gemini 4 的预训练。文末又说「期待很快发布 3.5 Pro」。

**之后**：官方更新记录（gemini.google/release-notes）在 2026-07-21 之后，介绍的新模型是 **2026-10-13 的 Gemini 4 Argon**；官方 API 文档的模型列表里，最前面是 Gemini 4 Argon，其下是 3.8 Flash、3.6 Flash、3.5 Flash-Lite 等，**没有 3.5 Pro**。

也就是说，截至 2026-10-19，官方只承诺过「会发布」，没有给出日期，也没有宣布「已发布」。搜到的各种「3.5 Pro 评测」「3.5 Pro 参数」，在官方页面里查不到依据，本文不转述。

## 二、现在 Gemini 应用里到底有什么模型

官方帮助中心《About Gemini models》说，Gemini 应用里的模型分为：

- **Flash-Lite**：快速、省成本，用于日常快问和轻量任务；
- **Flash**：高速且能力不错，在普通对话和任务模式之间平衡速度与响应；
- **Pro**：面向复杂提示、复杂编程和深入解题的高级推理模型；
- **Argon**：顶级智能、动态的深度推理，用于最复杂的工作流，性能最高。

各套餐能选的模型，官方给了一张表（官方注明可能随时变化）：

![Gemini 应用各套餐能选哪些模型](seed:g937-gemini-app-models-by-plan.png)
*图：本站根据 [Gemini 帮助中心：About Gemini models](https://support.google.com/gemini/answer/18648722?hl=en) 整理的示意图*

另外几条官方说明：

- **自动选择**：开启后，Gemini 会把你的提示自动分配给最合适的模型和思考等级；没有 Google AI 套餐时，大多数提示用 Flash-Lite，需要更多推理的可能用 Flash 或 Pro；如果关掉自动选择，所有回答都用 Flash-Lite；
- **思考等级**：Low（快而简洁）、Medium、High（适合复杂多步提示）；不选的话默认 Low；更高级的模型和更高的思考等级会消耗更多用量；
- **用量用完**：有 Google AI 套餐、到达用量上限后，对话会继续用 Flash-Lite；
- **手动切换模型**：有 Google AI 套餐时，在 gemini.google.com 点聊天框底部当前选中的模型，选想要的；带锁的高档模型需要升级到有资格的套餐；
- **工作或学校账号**：模型和功能取决于 Workspace 许可。

模型怎么选，也可以看 [/guides/gemini-models-flash-pro-thinking-level](/guides/gemini-models-flash-pro-thinking-level)；用量的查看和重置见 [/guides/gemini-usage-limits-check-reset](/guides/gemini-usage-limits-check-reset)；套餐区别见 [/guides/gemini-plans-free-plus-pro-ultra](/guides/gemini-plans-free-plus-pro-ultra)。

## 三、Gemini 4 Argon：官方怎么介绍

官方 2026-09-30 的博客说，Gemini 4 Argon 是最新的前沿模型，面向复杂的长流程工作：真实软件工程、法律与金融等企业知识工作、网络安全防御；输出上限扩大到 100 万 token（此前是 6.4 万）。发布时先向「受信任的网络防御者」开放，官方说会采用分阶段方式，再逐步向开发者、企业和普通用户开放。

2026-10-13，官方更新记录和 Gemini 应用博客说，**Gemini 4 Argon 已进入 Gemini 应用，面向 Google AI Pro 和 Ultra 订阅用户**；同一次更新里，Gemini macOS 应用内置了 Google Antigravity，并新增了「Customize」入口、支持连接 40 多个应用。官方还说 Argon「回答更直接、少含糊，不重复，不说套话」。

如果你想在 Gemini 里用 Argon，需要订阅 Google AI Pro 或 Ultra（以官方订阅页面为准）；谷歌账号相关服务可以看本站的 [/chongzhi/google-zhanghao](/chongzhi/google-zhanghao)。

## 四、开发者看 API 模型列表

官方 Gemini API 文档的模型列表（2026-10-19 核对）：

- **Gemini 4**：Gemini 4 Argon（`gemini-4-argon`），官方称旗舰推理模型，统一 100 万上下文窗口，长输出最多 100 万 token；
- **Gemini 3 系列**：3.8 Flash、3.6 Flash、3.5 Flash-Lite、3.1 Flash-Lite，以及 Nano Banana 2.1、Nano Banana 2 等图像模型；
- 没有 3.5 Pro。

调用方式和计费，见 [/guides/gemini-api-key](/guides/gemini-api-key)、[/guides/gemini-api-python-quickstart](/guides/gemini-api-python-quickstart)。

## 常见问题

**Q：3.5 Pro 什么时候发布？**
官方没有给出日期，只说「准备好后会广泛开放」；本文不猜。要看最新消息，以官方博客和 Gemini 更新记录为准。

**Q：我在应用里选「Pro」，是 3.5 Pro 吗？**
不是。官方帮助中心没有写应用里 Pro 档对应的具体版本号；更新记录里最近一次介绍 Pro 是 2026-02-19 的 3.1 Pro。这个版本号以官方说明为准。

**Q：为什么我看不到 Argon？**
官方说 Argon 面向 Google AI Pro 和 Ultra 订阅用户；工作或学校账号看 Workspace 许可；没有套餐时只能用自动选择或 Flash-Lite。

**Q：Gemini 3.5 Flash 还在用吗？**
官方 API 文档里，3.5 Flash-Lite 仍在列，3.6 Flash 被标为「上一代 Flash」，最新的是 3.8 Flash；应用里则直接叫 Flash，官方没有标版本号。

## 参考资料

- Google 官方博客：Gemini 3.5: frontier intelligence with action — https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-3-5/
- Google 官方博客：Introducing Gemini 3.6 Flash, 3.5 Flash-Lite, and 3.5 Flash Cyber — https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-3-6-flash-3-5-flash-lite-3-5-flash-cyber/
- Google 官方博客：Gemini 4 Argon — https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-4-argon/
- Google 官方博客：Gemini 4 Argon comes to the Gemini app — https://blog.google/innovation-and-ai/products/gemini-app/gemini-4-argon-availability/
- Gemini 更新记录 — https://gemini.google/release-notes/
- Gemini 帮助中心：About Gemini models — https://support.google.com/gemini/answer/18648722?hl=en
- Gemini API 文档：Models — https://ai.google.dev/gemini-api/docs/models
