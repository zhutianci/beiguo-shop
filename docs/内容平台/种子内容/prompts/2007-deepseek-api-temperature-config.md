---
title: DeepSeek API 参数怎么设：temperature 与思考模式配置建议提示词（按官方推荐表对照你的业务场景）
slug: deepseek-api-temperature-config
model: deepseek
topics: [prompt-engineering, coding]
needsRefImage: false
useCase: 刚接入 DeepSeek API，不确定 temperature 设多少、要不要开思考模式、JSON 输出和 max_tokens 怎么配时用：把你的场景描述给模型，它按提示词里内置的官方推荐表给出一份配置建议和理由，并列出上线前要自己验证的点。
prompt: |
  我在用 DeepSeek API 开发一个功能，请根据下面的「官方参考信息」为我的场景给出调用参数建议。只依据这些参考信息和我的描述来判断，参考信息没有覆盖的地方请明确说「需要自己测试」，不要编造参数或数值。

  【官方参考信息】
  1. temperature 默认值为 1.0。官方按场景推荐：代码生成与数学解题 0.0；数据抽取与分析 1.0；通用对话 1.3；翻译 1.3；创意写作与诗歌 1.5。
  2. 思考模式默认开启，可以通过 thinking 参数关闭，并可用 reasoning_effort 调节推理强度。
  3. 思考模式下，temperature、presence_penalty、frequency_penalty 设置了也不会生效。
  4. 思考内容在 reasoning_content 字段返回，最终回答在 content 字段。
  5. 没有传 tools 的多轮对话，不需要把之前的 reasoning_content 传回；带 tools 的请求必须把 reasoning_content 传回，否则会报 400 错误。
  6. JSON 输出需设置 response_format 为 json_object，提示词中要含有 json 字样和样例，并设置足够的 max_tokens 防止截断。
  7. 上下文缓存默认开启，按请求的前缀匹配；固定不变的内容放在最前面更容易命中。

  【我的场景】
  功能描述：[功能描述]
  输入内容的类型与长度：[输入类型与长度]
  对输出的要求：[输出要求]（例如必须可解析、要稳定一致、要有创意、要快）
  调用方式：[调用方式]（单轮 / 多轮 / 带工具调用）
  我最担心的问题：[最担心的问题]

  【请输出】
  一、配置建议表：参数 | 建议值 | 依据（对应上面第几条）| 备注。
  二、是否开启思考模式的判断与理由；如果建议开启，提醒哪些参数将不起作用。
  三、消息结构建议：哪些内容放 system、哪些放 user，顺序怎么排有利于缓存。
  四、上线前需要我自己验证的 3–5 件事（用什么样本、看什么指标）。
negativePrompt: null
source: null
verify:
  - 核对官方「Temperature 设置」页的推荐表是否有更新（https://api-docs.deepseek.com/zh-cn/quick_start/parameter_settings）
  - 核对思考模式文档中不支持的参数列表（https://api-docs.deepseek.com/zh-cn/guides/thinking_mode）
---
**这条提示词的思路**：模型对「自己的 API 现在怎么配」的记忆不一定是最新的，所以把官方文档里的关键事实直接写进提示词，让它只做「对照你的场景给建议」这件事。上面【官方参考信息】七条整理自 DeepSeek API 文档的参数设置、思考模式、JSON Output、上下文硬盘缓存四个页面，资料核对于 2026-10-10；官方更新后请以文档为准并同步修改这一段。

**怎么填变量**：[功能描述] 写具体，比如「把客服对话归到 12 个投诉类别之一」「给商品标题生成 5 条广告语」。[输出要求] 里「稳定一致」和「有创意」是相反的方向，只选最重要的一个。

**常见问题与调整**：
- 想要每次结果尽量一致，但又开着思考模式 → 按参考信息第 3 条，此时调 temperature 没有作用。可以关闭思考模式再设低温度，或者保留思考模式、靠明确的规则和示例来约束输出。
- 多轮带工具调用时报 400 → 先检查是否按第 5 条把 `reasoning_content` 原样传回。
- 模型名称、上下文长度、价格 → 这些变化较快，本提示词没有写入，请直接查官方「模型与价格」页。

### 示例输出

> 示例，仅供参考（场景：把客服对话归入 12 个投诉类别，要求程序可解析、结果稳定）

| 参数 | 建议值 | 依据 | 备注 |
| --- | --- | --- | --- |
| thinking | 关闭 | 第 2、3 条 | 分类任务规则明确，关闭后 temperature 才能生效，响应也更快 |
| temperature | 1.0 起步，可下调对比 | 第 1 条 | 官方对数据抽取与分析的推荐值是 1.0；一致性不够时用样本对比更低的值，需要自己测试 |
| response_format | json_object | 第 6 条 | 提示词中写明 json 并给样例 |
| max_tokens | 按样例长度的 2–3 倍 | 第 6 条 | 防止截断，具体数值需要自己测试 |

**消息结构**：12 个类别的定义和样例放在 system 开头并保持不变；每条待分类的对话放在 user 消息里。
