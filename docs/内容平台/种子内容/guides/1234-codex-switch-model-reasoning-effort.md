---
title: Codex 怎么切换模型和思考强度：命令行 /model、桌面 App 模型选择器、config.toml 默认值与官方选择建议
slug: codex-switch-model-reasoning-effort
products: [codex, chatgpt]
models: []
accountTier: PLUS
excerpt: Codex 怎么换模型、调思考强度？命令行里输入 /model 回车选择，用 /status 确认；桌面 App 用模型选择器；想固定默认值在 config.toml 里设 model。本文按官方文档整理步骤，并附官方对 Luna、GPT-6.1 Sol、Astra 的选择建议。
checkedOn: 2026-10-28
sources:
  - https://learn.chatgpt.com/docs/developer-commands
  - https://learn.chatgpt.com/docs/model-selection
  - https://help.openai.com/en/articles/20001275-chatgpt-work-and-codex
  - https://learn.chatgpt.com/docs/config-file/config-basic
verify:
  - 模型的可用性取决于套餐、工作区设置和推出进度，/model 选择器只显示你账号可用的模型，官方明确 GPT-6.1 Sol 在推出中，不是每个账号都有
  - 官方对 Astra 在 Plus 里的说法是 Work 和 Codex 里包含，其他套餐的额度以官方页面为准，本文不写额度数字
  - 模型名称和建议来自官方文档当天的写法，之后可能调整
---

> 本文根据 Codex 官方文档《Slash commands》《Model selection》《Config basics》和 OpenAI 帮助中心《ChatGPT Work and Codex》整理，资料核对于 2026-10-28。模型的可用性随套餐和推出进度变化，选择器里没有的就是你的账号暂时没有。配图为本站整理的示意图，不是软件截图。

## 适用于谁

- 想在 Codex 里换模型、调整思考强度的人；
- 在模型选择器里找不到 GPT-6.1 Sol、Astra 的人；
- 不知道该用哪个模型、哪个强度的人。

## 结论先说

1. **命令行**：启动 Codex，在输入框输入 `/model` 回车，在弹窗里选模型（官方例子是 `gpt-6-luna`、`gpt-6.1-sol`）；Codex 会在记录里确认新模型，再用 `/status` 核对。
2. **选择器只显示你账号和工作区能用的模型。** 官方明说：如果 GPT-6.1 Sol 没列出来，就选别的模型。
3. **桌面 App**：用模型选择器选 **Default** 或指定的模型。Default 把模型和思考强度合在一条滑块上；选了指定模型，再从该模型可用的思考强度里挑。命令行**没有滑块**。
4. **Codex 会保留你手动选的模型。**
5. **想固定默认值**：在 `config.toml` 里写 `model = "gpt-6.1-sol"`，思考强度用 `model_reasoning_effort = "medium"`。
6. **看不到 Astra**：官方说要把桌面 App 更新到最新，Codex CLI 需要 0.153.0 或更新版本；菜单里点 **Check for Updates**，即使刚自动更新过也要手动检查一次。

![在 Codex 里切换模型](seed:g1234-switch-steps.png)
*图：本站根据 [Codex 官方文档：Slash commands](https://learn.chatgpt.com/docs/developer-commands) 整理的示意图*

## 一、命令行里切换

官方步骤：

1. 启动 Codex，打开输入框；
2. 输入 `/model`，按回车；
3. 从弹窗里选一个模型。

另一个相关命令是 `/fast`：开关当前模型的 Fast 服务档位，再输一次就关掉；官方说明 Fast 档位是按目录提供的，当前模型不提供 Fast 档时 `/fast` 不会显示。想在底部状态栏看到 Fast 状态，用 `/statusline`。命令行其他命令见 [/guides/codex-cli-commands-cheatsheet](/guides/codex-cli-commands-cheatsheet)。

也可以在启动时指定，官方的 `config.toml` 示例：

```toml
model = "gpt-6.1-sol"
model_reasoning_effort = "medium"
```

用 `-c` 做一次性覆盖也是官方给的方式，例如 `codex --config model='"gpt-6.1-sol"'`（TOML 值要注意引号）。

## 二、桌面 App 里切换

官方帮助中心的说法：用模型选择器选 **Default** 或指定模型；Default 把模型和思考强度合在一条滑块上；选定模型后可以选它的思考强度，具体选项取决于你的套餐和工作区设置。Work 和 Codex 的模型控制是**独立于聊天**的，聊天里的模型选择和用量限制与它们分开。模型可见性的更多排查见 [/guides/chatgpt-cant-find-new-model-gpt-6-codex](/guides/chatgpt-cant-find-new-model-gpt-6-codex)。

## 三、该选哪个模型和强度

官方《Model selection》的说法：Luna 是最高效的模型，Astra 是最先进、最强的模型；如果不用考虑用量和耗时，可以默认用 Astra；要优化用量，按下面的建议选。

![官方的模型与思考强度建议](seed:g1234-guide-compare.png)
*图：本站根据 [Codex 官方文档：Model selection](https://learn.chatgpt.com/docs/model-selection) 整理的示意图*

官方还写了几点：

- **GPT-6.1 Terra**：适合基于给定材料的简洁写作、有明确结果的电脑操作任务和范围明确的代码修复；
- **GPT-6.1 Sol**：适合成本敏感的复杂项目，比如用财务结果做董事会演示稿，或根据产品简报做网站，建议在同一任务上和 Astra 对比质量和成本；
- **实验方法**：用相同的输入对比不同模型和强度，保留**满足质量要求的最轻设置**；代码和界面要跑回归测试，界面还要在桌面和手机上看渲染结果。

## 四、模型和额度的关系

官方说明：Astra 可能比 GPT-5.6 Sol 消耗额度更快，取决于任务、输入输出大小、思考强度和速度设置。Plus 套餐在 Work 和 Codex 里含有限的 Astra 用量，用完后可选购买点数。GPT-6.1 Sol 在 Work 和 Codex 里默认上下文窗口是 50 万 token；订阅包含的用量下没有额外的长上下文附加费，但更长的对话和任务仍计入使用限额。额度怎么看、怎么省，见 [/guides/codex-usage-limits](/guides/codex-usage-limits)；想开通 Plus 可以看 [/chongzhi/chatgpt-plus](/chongzhi/chatgpt-plus)，高额度看 [/chongzhi/chatgpt-pro](/chongzhi/chatgpt-pro)。

## 常见问题

**Q：我在聊天里选了 GPT-6，Codex 里为什么不一样？**
官方说明 Work 和 Codex 有独立的模型控制，GPT-6.1 Sol、GPT-6.1 Terra 等只在 Work 和 Codex 里，普通聊天不可选。

**Q：用第三方模型行不行？**
官方有自定义模型提供方的配置，见 [/guides/codex-third-party-models-deepseek-gemini-grok](/guides/codex-third-party-models-deepseek-gemini-grok)。

**Q：切换后额度会变吗？**
会，不同模型和强度消耗额度的速度不同，以官方页面和用量页为准。

## 参考资料

- Codex 官方文档：Slash commands — https://learn.chatgpt.com/docs/developer-commands
- Codex 官方文档：Model selection — https://learn.chatgpt.com/docs/model-selection
- Codex 官方文档：Config basics — https://learn.chatgpt.com/docs/config-file/config-basic
- OpenAI 帮助中心：ChatGPT Work and Codex — https://help.openai.com/en/articles/20001275-chatgpt-work-and-codex
