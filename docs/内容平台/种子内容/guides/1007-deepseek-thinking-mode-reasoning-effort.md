---
title: DeepSeek API 思考模式怎么开：reasoning_effort 三档、reasoning_content 与 deepseek-reasoner 的现状
slug: deepseek-thinking-mode-reasoning-effort
products: [ai-tools]
models: [deepseek]
accountTier: OTHER
excerpt: DeepSeek API 怎么开关思考模式、reasoning_effort 的 low / high / max 怎么选、reasoning_content 要不要回传、deepseek-reasoner 还能不能用？按官方思考模式文档与更新日志（2026-10-24 查询）整理，附三种接口写法对照。
checkedOn: 2026-10-24
sources:
  - https://api-docs.deepseek.com/zh-cn/guides/thinking_mode
  - https://api-docs.deepseek.com/zh-cn/updates
  - https://api-docs.deepseek.com/zh-cn/quick_start/pricing
  - https://api-docs.deepseek.com/zh-cn/guides/responses_api
  - https://api-docs.deepseek.com/zh-cn/guides/anthropic_api
verify:
  - 开关与强度的参数名、默认值、映射表取自官方思考模式文档（2026-10-24）
  - deepseek-chat 与 deepseek-reasoner：官方 2026-04-24 的更新说明称这两个旧模型名将于 2026-07-24 停止使用，过渡期内分别指向 deepseek-v4-flash 的非思考与思考模式；当前价格页只列出 deepseek-flash 和 deepseek-v4-pro，没有再提这两个旧名，本文不断言它们现在能否调用，新代码请使用新模型名
  - 官方没有给出各档位的耗时或 token 消耗数字，也没有给出「哪一档质量更高多少」的数据，本文只转述官方的使用建议
---

> 本文根据 DeepSeek 官方思考模式文档和更新日志整理，资料核对于 2026-10-24。参数可能调整，以官方文档为准。图为本站整理的示意图。

## 适用于谁

- 搜「deepseek reasoning effort」「deepseek reasoner」的开发者；
- 想知道 `deepseek-reasoner` 现在该换成什么的人；
- 调用时思考内容怎么取、多轮对话要不要回传，搞不清楚的人。

## 结论先说

1. **现在不需要单独的「推理模型」**：`deepseek-flash` 和 `deepseek-v4-pro` 都同时支持思考与非思考模式，**默认开启思考，强度默认 high**。
2. **强度有三档：low、high、max**。官方 2026-08-13 的更新日志建议：简单任务用 low，日常 Agent 任务用 high，更复杂的任务用 max。
3. **`deepseek-reasoner` 是旧模型名**。官方 2026-04-24 说它将于 2026-07-24 停用（过渡期内指向 deepseek-v4-flash 的思考模式）；价格页现在只列新名字。新项目请直接用 `deepseek-flash` 并按需开关思考。
4. **思考模式下 temperature 等采样参数不生效**，不会报错也不起作用；要靠它们控制随机性，请关闭思考模式。
5. **只要请求带了 tools，就必须把历史的 reasoning_content 完整回传**，否则返回 400。

![三种接口里怎么开关思考和设强度](seed:g1007-deepseek-thinking-params-compare.png)
*图：本站根据 [DeepSeek 官方思考模式文档](https://api-docs.deepseek.com/zh-cn/guides/thinking_mode) 整理的示意图*

## 一、怎么开、怎么设

官方文档按三种接口给出参数：

| | OpenAI 格式 | Anthropic 格式 | Responses API 格式 |
| --- | --- | --- | --- |
| 思考开关 | `{"thinking": {"type": "enabled/disabled"}}` | 同左 | `{"reasoning": {"effort": "none/low/high/max"}}`（none 表示关闭） |
| 思考强度 | `{"reasoning_effort": "low/high/max"}` | `{"output_config": {"effort": "low/high/max"}}` | 同上，写在 `reasoning.effort` 里 |

注意几点：

- **默认开启，默认 high**；
- 在 OpenAI SDK 里用 Chat Completion 时，`thinking` 参数要放进 `extra_body`，而 `reasoning_effort` 是普通参数：

```python
response = client.chat.completions.create(
    model="deepseek-flash",
    messages=messages,
    reasoning_effort="high",
    extra_body={"thinking": {"type": "enabled"}},
)
```

- Anthropic 格式里 `thinking` 被支持，但 `budget_tokens` 会被忽略，`output_config` 只支持 `effort`（Anthropic API 兼容性文档）；
- 关闭思考的写法是 `{"thinking": {"type": "disabled"}}`（Responses 格式则是 effort 设成 none）。

## 二、传了别的档位名会怎样

官方给了一张映射表，你传的 effort 会被映射到实际档位：

| 请求传入 | 实际映射 |
| --- | --- |
| minimal | low |
| low | low |
| medium | high |
| high | high |
| xhigh | high |
| max | max |
| ultra | max |

也就是说，实际只有 low、high、max 三档，其他名字都是别名。这样设计是为了兼容别的工具里常见的档位名。

![思考强度怎么选（官方建议）](seed:g1007-deepseek-effort-decide.png)
*图：本站根据 [DeepSeek 官方更新日志](https://api-docs.deepseek.com/zh-cn/updates) 整理的示意图*

## 三、思考模式下哪些参数没用

官方文档写明，**思考模式不支持 temperature、presence_penalty、frequency_penalty**，设置了不会报错，但也不会生效（为了兼容已有软件）。`top_p` 的行为因模型而异：

- **deepseek-flash**：只在思考模式下生效，有效范围 0.95–1.0，低于 0.95 按 0.95 处理；非思考模式下恒为 1.0，传入值会被忽略；
- **deepseek-v4-pro**：思考模式下忽略传入值（携带 tools 时固定为 0.95，否则 1.0）；非思考模式下生效。

## 四、reasoning_content 怎么取、要不要回传

思考模式下，思维链内容通过 `reasoning_content` 返回，和 `content` 同级。后续轮次是否需要回传它，取决于请求有没有带 `tools`：

- **没有带 tools**：`reasoning_content` 不需要回传；即使传了也会被忽略，不会拼进上下文。你只需要把 `content` 放回对话历史；
- **带了 tools**：历史轮次的 `reasoning_content` **都要回传**，并且会被拼进上下文。官方强调，带了 tools 的请求，在后续所有请求里都必须完整回传，即使那一轮模型没有真的调用工具。没有正确回传，API 返回 400。

最稳妥的写法，是直接把返回的 `message` 整个追加到 messages：

```python
messages.append(response.choices[0].message)
```

这一行等价于手动追加 `content`、`reasoning_content` 和 `tool_calls`。工具调用的更多内容见 [/guides/deepseek-json-output-function-calling](/guides/deepseek-json-output-function-calling)，报错 400 的其他原因见 [/guides/deepseek-api-error-codes](/guides/deepseek-api-error-codes)。

## 五、什么时候该开、什么时候该关

官方没有给「必须开 / 必须关」的规则，下面是根据官方参数说明整理的思路：

- **需要多步推理、写代码、数学、规划**：保持默认开启，从 high 开始；觉得慢或贵，试 low；
- **简单问答、改写、翻译、分类**：可以关闭思考，响应通常更快、输出更短；
- **想调 temperature 控制风格**：关闭思考；
- **JSON 输出 / 工具调用**：两种模式都可以用，但带 tools 时要注意回传。

思考相关的使用技巧，见 [/guides/chain-of-thought-thinking-mode-when-to-use](/guides/chain-of-thought-thinking-mode-when-to-use)；网页版的「深度思考」开关见 [/guides/deepseek-deep-thinking-web-search](/guides/deepseek-deep-thinking-web-search)。

## 常见问题

**Q：`deepseek-reasoner` 还能用吗？**
官方 2026-04-24 公告说 2026-07-24 停用，当前价格页没有这个名字。建议改成 `deepseek-flash` 并保持思考开启（默认就是）。

**Q：思考内容算钱吗？**
价格页按输入和输出的总 token 计费，官方没有把思维链单独列出来；Responses API 文档里 usage 会返回 `reasoning_tokens`（思维链 token 数），可用来观察。具体费用以官方价格页为准，见 [/guides/deepseek-v4-pro-vs-flash-api-price](/guides/deepseek-v4-pro-vs-flash-api-price)。

**Q：我只想要最终答案，不想要思考内容？**
读取 `content` 即可，`reasoning_content` 是单独字段，不会混进 `content`。

**Q：Python 完整示例在哪？**
见 [/guides/deepseek-api-python-quickstart](/guides/deepseek-api-python-quickstart)。

## 参考资料

- DeepSeek API 文档：思考模式 — https://api-docs.deepseek.com/zh-cn/guides/thinking_mode
- DeepSeek API 文档：更新日志 — https://api-docs.deepseek.com/zh-cn/updates
- DeepSeek API 文档：模型 & 价格 — https://api-docs.deepseek.com/zh-cn/quick_start/pricing
- DeepSeek API 文档：使用 Responses API — https://api-docs.deepseek.com/zh-cn/guides/responses_api
- DeepSeek API 文档：使用 Anthropic API — https://api-docs.deepseek.com/zh-cn/guides/anthropic_api
