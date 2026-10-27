---
title: Gemini 怎么切换模型：Flash-Lite、Flash、Pro、Argon 的选择步骤、思考等级和自动选择
slug: gemini-how-to-switch-models
products: [gemini]
models: []
accountTier: PRO
excerpt: Gemini 网页版怎么手动切换模型？官方步骤是点聊天框底部当前模型再选，需要有 Google AI 方案，带锁图标的要升级。本文按官方说明整理各方案可选模型、思考等级默认值和自动模型选择。
checkedOn: 2026-10-27
sources:
  - https://support.google.com/gemini/answer/18648722
  - https://support.google.com/gemini/answer/16275805
  - https://support.google.com/gemini/answer/14517446
verify:
  - 官方页面里「怎么开关自动模型选择」「怎么查看某条回答用的模型」两节在核对时内容没有显示，本文不写这两处的操作步骤，以官方页面为准
  - 各方案可选的模型和任务模式的可选项是官方当天的写法，官方注明可能不经通知调整
  - 工作或学校账号的模型和功能取决于 Workspace 许可，本文只写个人谷歌账号的情况
---

> 本文根据 Gemini Apps 帮助中心《About Gemini models》整理，资料核对于 2026-10-27，只适用于个人谷歌账号；工作或学校账号的可用模型取决于 Workspace 许可。官方页面里「开关自动选择」和「查看回答用了哪个模型」两节核对时没有显示内容，本文不写这两处的步骤。配图为本站整理的示意图，不是网页截图。

## 适用于谁

- 想在 Gemini 里手动换成 Flash、Pro 等模型的人；
- 找不到模型选项，或模型旁边有锁图标的人；
- 想知道思考等级 Low、Medium、High 怎么选的人。

## 结论先说

1. **手动切换需要 Google AI 方案**，聊天模式和任务模式都可以切。没有方案的用户，官方写的是「自动选择或 Flash-Lite」。
2. **步骤**：打开 gemini.google.com → 点聊天框底部当前选中的模型 → 点想用的模型 → （可选）选思考等级。带**锁图标**的模型需要升级到对应方案。
3. **思考等级不选，默认是 Low。** Low 适合直接的问题，Medium 平衡速度和推理深度，High 用于复杂的多步骤提示。
4. **选定后会一直用到这个对话结束**，包括你之后回到这个对话。
5. **更高级的模型和更高的思考等级更耗额度。** 有 AI 方案的用户用完限额后，对话会继续用 Flash-Lite。

![在网页版切换 Gemini 模型](seed:g1182-switch-steps.png)
*图：本站根据 [Gemini Apps 帮助中心：About Gemini models](https://support.google.com/gemini/answer/18648722) 整理的示意图*

## 一、四个模型的官方定位

- **Gemini Flash-Lite**：又快又省的模型，用于日常问题和轻量任务；
- **Gemini Flash**：高速且能力均衡，兼顾聊天和任务模式；
- **Gemini Pro**：高级推理模型，用于复杂提示、复杂编码和深入解决问题；
- **Gemini Argon**：官方的描述是顶级智能、动态深度推理，面向复杂工作流的最高性能。

## 二、各方案能选哪些

![各方案可选的模型（聊天）](seed:g1182-models-compare.png)
*图：本站根据 [Gemini Apps 帮助中心：About Gemini models](https://support.google.com/gemini/answer/18648722) 整理的示意图*

任务模式的官方可选项：Google AI Pro 和 Ultra 有 Flash 和 Argon，Plus 和没有方案的用户为「N/A」。官方在表下写明：开启自动模型选择时，Gemini 会为每条提示选合适的模型，多数提示用 Flash-Lite 快速回答，需要更多推理的可能用 Flash 或 Pro；关闭自动选择时，所有回答都用 Flash-Lite（指没有方案的情形，表里带星号的条目）。想了解各方案区别，见 [/guides/gemini-plans-free-plus-pro-ultra](/guides/gemini-plans-free-plus-pro-ultra)，模型对比见 [/guides/gemini-models-flash-pro-thinking-level](/guides/gemini-models-flash-pro-thinking-level)。

## 三、自动模型选择

官方说明：自动选择会把提示自动路由到最高效的模型和思考等级，在保证回答质量的同时节省你的额度。手动切换的好处是你想要固定用某个模型，坏处是更费额度。怎么开关自动选择、怎么看一条回答用了哪个模型，官方页面核对时没有显示步骤，请以页面为准。

## 四、找不到模型、模型是灰的

- **带锁图标**：需要升级到对应方案，见 [/guides/gemini-cancel-subscription-google-ai-plan](/guides/gemini-cancel-subscription-google-ai-plan) 里的方案管理，官方的升级入口是网页版 **Settings & help** 里的升级选项；
- **没有 Google AI 方案**：官方说是自动选择或 Flash-Lite，没有手动切换；
- **用完限额**：有方案会转 Flash-Lite，额度见 [/guides/gemini-usage-limits-check-reset](/guides/gemini-usage-limits-check-reset)；
- **工作或学校账号**：取决于 Workspace 许可，问管理员。

## 常见问题

**Q：手机 App 里也能切换吗？**
本文依据的是官方电脑端的步骤，手机端的步骤官方页面有对应标签，以其为准。

**Q：Deep Think 怎么用？**
官方说使用 Deep Think 时上下文窗口是 192 thousand tokens，见 [/guides/gemini-response-stopped-interrupted](/guides/gemini-response-stopped-interrupted)。

**Q：回答中途变慢变短？**
可能是用完限额转了 Flash-Lite，也可能是别的原因，见 [/guides/gemini-keeps-loading-no-response](/guides/gemini-keeps-loading-no-response)。

## 参考资料

- Gemini Apps 帮助中心：About Gemini models — https://support.google.com/gemini/answer/18648722
- Gemini Apps 帮助中心：Gemini Apps limits & feature availability — https://support.google.com/gemini/answer/16275805
- Gemini Apps 帮助中心：Manage your Google AI plan from Gemini Apps — https://support.google.com/gemini/answer/14517446
