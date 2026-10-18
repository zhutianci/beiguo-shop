---
title: DeepSeek V4 Pro 和 Flash 的区别与 API 价格：官方价格页逐项对照（高峰与空闲时段）
slug: deepseek-v4-pro-vs-flash-api-price
products: [ai-tools]
models: [deepseek]
accountTier: OTHER
excerpt: DeepSeek V4 Pro 和 Flash 有什么区别、API 怎么收费？按 DeepSeek 官方价格页（2026-10-19 查询）列出两个模型的版本、上下文、图像理解、并发和每百万 token 价格，说明高峰与空闲时段的计费差别和旧模型名怎么处理。
checkedOn: 2026-10-19
sources:
  - https://api-docs.deepseek.com/zh-cn/quick_start/pricing
  - https://api-docs.deepseek.com/quick_start/pricing
  - https://api-docs.deepseek.com/zh-cn/updates
verify:
  - 价格取自 DeepSeek 官方中文和英文价格页 2026-10-19 的内容：人民币价格来自中文页，美元价格来自英文页，官方保留调整价格的权利，下单前请再看一次官方价格页
  - 官方 2026-09-10 的更新说明：2026-09-14 之后继续提供 V4 Pro 的 API 调用服务、计费方式不变，「如有变动将另行通知」；本文不预测 Pro 今后是否调整
  - Search 与 Fetch 的价格取自价格页：目前在 DeepSeek Harness、Claude Code、Codex 中使用时的服务端调用不计费，按次收费将自北京时间 2026-11-01 00:00 起
  - 官方没有给出「Pro 在所有任务上都比 Flash 强」的结论，本文也不下这个结论；官方更新页里两个模型的基准测试成绩口径不同，不能直接比较
---

> 本文根据 DeepSeek 官方 API 文档（价格页与更新日志）整理，资料核对于 2026-10-19，价格为「2026-10-19 查询」。**价格随时可能调整**，以官方价格页为准。图为本站整理的示意图。如果你想了解网页版怎么用，见 [/guides/deepseek-how-to-use](/guides/deepseek-how-to-use)。

## 适用于谁

- 搜「deepseek v4 pro 价格」「deepseek v4 flash 价格」的人；
- 在 deepseek-flash 和 deepseek-v4-pro 之间不知道怎么选的开发者；
- 想估算 API 成本、不知道高峰和空闲怎么算的人；
- 代码里还在用旧模型名的人。

## 结论先说

1. **现在有两个主力模型**：`deepseek-flash`（当前版本 DeepSeek-V4.1-Flash-1017）和 `deepseek-v4-pro`（当前版本 DeepSeek-V4-Pro-0813）。
2. **规格几乎一样**：官方价格页写明，两者上下文长度都是 1M，最大输出都是 384K，都支持 JSON 输出、工具调用、Responses API、Anthropic API 格式；区别是 **Flash 支持图像理解，Pro 不支持**，并发上限 Flash 是 2500，Pro 是 500。
3. **价格差别很大**：按官方价格页，Flash 的各项价格都明显低于 Pro；例如输出每百万 token，空闲时段 Flash 4 元、Pro 13.5 元。
4. **有高峰和空闲两档价格**：官方说空闲时段价格是高峰时段的一半；高峰是**北京时间周一至周五（不含中国法定节假日）9:00–12:00 和 14:00–18:00**，其余时间（含周末和法定节假日全天）都是空闲。
5. **旧名字**：`deepseek-v4-flash`、`deepseek-v4-flash-vision-exp` 仍可调用，但对应模型已下线，官方说请求由 V4.1 Flash 提供服务、按 Flash 价格计费，建议改用 `deepseek-flash`。

![DeepSeek V4 Flash 与 Pro 的规格和价格（官方价格页，2026-10-19 查询）](seed:g943-deepseek-v4-flash-pro-price.png)
*图：本站根据 [DeepSeek 官方价格页（中文）](https://api-docs.deepseek.com/zh-cn/quick_start/pricing) 整理的示意图*

## 一、价格表（人民币，每百万 token）

| 项目 | deepseek-flash 空闲 | deepseek-flash 高峰 | deepseek-v4-pro 空闲 | deepseek-v4-pro 高峰 |
| --- | --- | --- | --- | --- |
| 输入（缓存命中） | 0.02 元 | 0.04 元 | 0.15 元 | 0.30 元 |
| 输入（缓存未命中） | 1 元 | 2 元 | 4.5 元 | 9 元 |
| 输出 | 4 元 | 8 元 | 13.5 元 | 27 元 |

英文价格页给的是美元价（每百万 token）：

| 项目 | Flash 空闲 | Flash 高峰 | Pro 空闲 | Pro 高峰 |
| --- | --- | --- | --- | --- |
| 输入（缓存命中） | $0.003 | $0.006 | $0.022 | $0.044 |
| 输入（缓存未命中） | $0.15 | $0.3 | $0.66 | $1.32 |
| 输出 | $0.6 | $1.2 | $1.98 | $3.96 |

几条计费规则（官方价格页）：

- **按 token 计费**：费用 = token 数量 × 单价，按输入和输出的总 token 数计量；
- **余额扣减**：从充值余额或赠送余额里扣，两者同时有时**优先扣赠送余额**；
- **缓存命中**：输入里命中缓存的部分单价低得多，所以重复的系统提示和长文档放在前面更省钱；
- **并发**：Flash 2500、Pro 500；更多细节见官方「限速与隔离」文档。

## 二、Flash 和 Pro 怎么选

![DeepSeek V4：Flash 和 Pro 怎么选](seed:g943-deepseek-v4-choose-decide.png)
*图：本站根据 [DeepSeek 官方价格页](https://api-docs.deepseek.com/zh-cn/quick_start/pricing) 整理的示意图*

- **要识图**：只有 Flash 支持图像理解，Pro 在价格页里标注「不支持」；
- **要省钱、量大**：先用 Flash；
- **复杂 Agent、编码任务**：官方更新日志里，V4 Pro 正式版（2026-08-13）强调了 Agent 能力的大幅提升；Flash 在 2026-10-17 升级为 V4.1-Flash-1017，官方公布了一组基准成绩。官方没有写两者谁更强，更新页里两边的测试口径也不同，所以**不要拿两组数字直接比**，用你自己的任务各跑几次最可靠；
- **思考强度**：官方说，两个模型的思考模式都支持 low、high、max 三档：简单任务用 low，日常 Agent 任务用 high，更复杂的用 max；也可以用非思考模式（Flash 价格页写明支持思考与非思考两种，默认思考）。设置方法见官方的「思考模式」文档，思考相关的使用技巧见 [/guides/chain-of-thought-thinking-mode-when-to-use](/guides/chain-of-thought-thinking-mode-when-to-use)；
- **错开高峰**：能放到空闲时段跑的批量任务，价格直接减半。

## 三、价格变化时间线（来自官方更新日志）

- **2026-08-13**：DeepSeek-V4-Pro 正式版上线；官方宣布采用**峰谷定价**，空闲价是高峰价的一半，新价格自北京时间 **2026-08-17 0 点**起生效；
- **2026-09-10**：DeepSeek-V4.1-Flash 发布，原生支持多模态；API 价格**同步下调**；官方说 2026-09-14 之后继续提供 V4 Pro 的 API 调用，计费方式不变；
- **2026-10-17**：V4.1 Flash 升级为 DeepSeek-V4.1-Flash-1017，网页端和 App 同步更新；官方说 **API 调用方式与价格保持不变**，仍用 `deepseek-flash`；同日开放自研的搜索 API。

## 四、Search 与 Fetch 单独计费

价格页另列了两个独立 API：

- **Search**：每 1000 次成功请求 5 元（英文页 0.75 美元）；
- **Fetch**：每 1000 次成功请求 5 元（英文页 0.75 美元）。

官方说，通过 DeepSeek Harness、Claude Code 或 Codex 使用 DeepSeek API 时，服务端工具调用已经会用到 Search 和 Fetch，**这部分目前免费，将自北京时间 2026-11-01 0 点起按次收费**。

## 五、怎么开始调用

1. 在 DeepSeek 开放平台创建 API Key，见 [/guides/deepseek-api-key](/guides/deepseek-api-key)；
2. 用官方的 Base URL：OpenAI 格式 `https://api.deepseek.com`，Anthropic 格式 `https://api.deepseek.com/anthropic`；
3. 模型名填 `deepseek-flash` 或 `deepseek-v4-pro`；
4. Python 示例见 [/guides/deepseek-api-python-quickstart](/guides/deepseek-api-python-quickstart)；想在 Claude Code 里用，见 [/guides/deepseek-claude-code-setup](/guides/deepseek-claude-code-setup)。

## 常见问题

**Q：「Flash 价格」是不是比 Pro 便宜很多？**
是。以空闲时段输出为例，Flash 每百万 token 4 元，Pro 13.5 元；输入未命中缓存是 1 元对 4.5 元。具体以官方价格页为准。

**Q：我用的是网页版，要付费吗？**
本文只讲 API 价格；网页版和 App 的使用见 [/guides/deepseek-how-to-use](/guides/deepseek-how-to-use)。

**Q：返回「服务器繁忙」怎么办？**
见 [/guides/deepseek-server-busy](/guides/deepseek-server-busy)。

**Q：和 ChatGPT 比有什么区别？**
见 [/guides/chatgpt-vs-deepseek-difference](/guides/chatgpt-vs-deepseek-difference)。

## 参考资料

- DeepSeek API 文档：模型 & 价格（中文）— https://api-docs.deepseek.com/zh-cn/quick_start/pricing
- DeepSeek API 文档：Models & Pricing — https://api-docs.deepseek.com/quick_start/pricing
- DeepSeek API 文档：更新日志 — https://api-docs.deepseek.com/zh-cn/updates
