---
title: DeepSeek 提示词怎么写：官方提示库的 13 类场景、官方文档里的硬性规则与可套用模板
slug: deepseek-prompt-writing-official-library
products: [ai-tools]
models: [deepseek]
accountTier: OTHER
excerpt: DeepSeek 提示词怎么写？本文按官方提示库的 13 类场景（2026-10-24 查询）和官方 API 文档里与提示词有关的规则（JSON 输出、多轮对话、system 提示词、前缀续写、思考模式参数），给出六项检查和可套用的模板。
checkedOn: 2026-10-24
sources:
  - https://api-docs.deepseek.com/zh-cn/prompt-library
  - https://api-docs.deepseek.com/zh-cn/guides/json_mode
  - https://api-docs.deepseek.com/zh-cn/guides/multi_round_chat
  - https://api-docs.deepseek.com/zh-cn/guides/chat_prefix_completion
  - https://api-docs.deepseek.com/zh-cn/api/list-models
  - https://api-docs.deepseek.com/zh-cn/guides/thinking_mode
verify:
  - 官方提示库页面（2026-10-24）列出 13 类样例的名称与一句话说明，具体的提示词样例内容在页面里是动态加载的，本文没有抓取到，下文的模板是本站按这些场景写的示例，不是官方模板
  - 「提示词前的 6 项检查」里，JSON 输出、多轮对话无状态、思考模式下 temperature 不生效三项来自官方文档；目标、背景、约束、格式是通用的写法建议，不是官方规定
  - 官方「获取模型列表」示例里，deepseek-flash 的 system_prompt_update 为 in-history（对话中追加的 system 消息可替代此前的提示词），deepseek-v4-pro 为 leading-only（只有开头的 system 提示词生效）；该字段属于 Anthropic Messages 接口的能力说明，其他接口格式下的表现以官方文档为准
  - 本文不写「实测效果」
---

> 本文根据 DeepSeek 官方提示库和 API 文档整理，资料核对于 2026-10-24。模板是本站写的示例，不是官方模板。图为本站整理的示意图。

## 适用于谁

- 搜「deepseek 提示词」「deepseek 提示词怎么写」的人；
- 觉得 DeepSeek 回答太泛、不按格式输出的人；
- 想知道官方提示库有哪些场景、API 里和提示词有关的规则有哪些的开发者。

## 结论先说

1. **官方有一个「提示库」**，列了 13 类样例场景：代码改写、代码解释、代码生成、内容分类、结构化输出、角色扮演（自定义人设）、角色扮演（情景续写）、散文写作、诗歌创作、文案大纲生成、宣传标语生成、模型提示词生成、中英翻译专家。
2. **官方文档里有几条和提示词直接相关的硬规则**：JSON 输出必须在提示词里写「json」并给样例；API 是无状态的，多轮要自己拼历史；思考模式下 temperature 等参数不生效；对话前缀续写和 FIM 是两种特殊的「写提示词」方式。
3. **通用写法**：目标、背景、约束、格式四件事说清楚，比堆形容词有用。

![官方提示库里的 13 类样例](seed:g1023-deepseek-official-prompt-library.png)
*图：本站根据 [DeepSeek 官方提示库](https://api-docs.deepseek.com/zh-cn/prompt-library) 整理的示意图*

## 一、官方提示库的 13 类场景

官方页面对每类的一句话说明：

- **代码改写**：对代码进行修改，实现纠错、注释、调优等；**代码解释**：帮助理解代码内容；**代码生成**：生成完成特定功能的代码；
- **内容分类**：分析文本内容并自动归类；**结构化输出**：把内容转成 JSON，方便后续程序处理；
- **角色扮演（自定义人设）**：自定义人设，与用户角色扮演；**角色扮演（情景续写）**：提供一个场景，让模型模拟该场景下的对话；
- **散文写作**、**诗歌创作**：根据提示词创作；
- **文案大纲生成**：根据主题生成大纲；**宣传标语生成**：生成贴合商品信息的标语；
- **模型提示词生成**：根据需求帮助生成高质量提示词；**中英翻译专家**：中英互译。

页面上的具体样例内容需要在官网里查看，本文没有逐条转抄。

## 二、六项检查

![写 DeepSeek 提示词前的 6 个检查](seed:g1023-deepseek-prompt-checklist.png)
*图：本站根据 DeepSeek 官方 API 文档与通用写法整理的检查清单示意图*

## 三、官方文档里与提示词有关的规则

### JSON 输出

官方 JSON Output 文档：设置 `response_format={'type': 'json_object'}`；用户传入的 system 或 user 提示词里**必须含有「json」字样**，并给出希望模型输出的 JSON 格式样例；合理设置 `max_tokens` 防止被截断；有概率返回空 `content`，可以尝试修改提示词缓解。完整示例见 [/guides/deepseek-json-output-function-calling](/guides/deepseek-json-output-function-calling)。

### 多轮对话

官方多轮对话文档：`/chat/completions` 是「无状态」API，服务端不记录上下文，每次请求要把之前所有对话历史拼好再传。第二轮要把第一轮模型的输出添加到 messages 末尾，再加上新提问。网页版和 App 会替你保存对话，但对话太长时同样会受限。

### system 提示词

官方「获取模型列表」接口的说明里，有一个与 system 提示词相关的字段：在 Anthropic Messages 接口下，`deepseek-flash` 是 `in-history`（可以在对话历史中追加 system 消息，最新一条提供完整的有效提示词并替代此前所有 system 提示词），`deepseek-v4-pro` 是 `leading-only`（只有对话开头的 system 提示词生效，要改提示词需要改开头那条，后续出现的 system 消息不会被视为提示词更新）。另外官方工具调用文档说，Chat Completion 接口支持在对话中间插入 system 消息。如果你的应用需要在对话中途改变角色或规则，要留意这点。system 提示词的写法见 [/guides/system-prompt-how-to-write](/guides/system-prompt-how-to-write)。

### 对话前缀续写（Beta）

官方文档：让 messages 列表里最后一条消息的 `role` 为 `assistant`，并把它的 `prefix` 设为 `True`，模型会接着这个开头补全；需要把 `base_url` 设为 `https://api.deepseek.com/beta`。官方示例把 assistant 开头设为 "```python\n" 来强制模型输出 Python 代码，再设置 `stop=['```']` 避免额外解释。这是一种「用开头约束输出格式」的办法。

### FIM 补全（Beta）

官方文档：FIM（Fill In the Middle）补全让用户提供前缀和可选的后缀，由模型补全中间内容，常用于内容续写、代码补全；最大补全长度 4K；同样需要 `base_url="https://api.deepseek.com/beta"`；价格页写明 FIM 只在非思考模式下支持。

### 思考模式

思考模式不支持 `temperature`、`presence_penalty`、`frequency_penalty`，设置了不报错但不生效。写作类任务想靠温度控制发散程度，请关闭思考模式，见 [/guides/deepseek-thinking-mode-reasoning-effort](/guides/deepseek-thinking-mode-reasoning-effort)。

## 四、可套用的模板

下面是按官方 13 类场景改写的示例，括号里换成你自己的内容。

**代码改写**

```
下面是一段 Python 代码（Python 3.12）。请：1. 找出可能的 bug 并说明原因；2. 给出修改后的完整代码；3. 给关键行加简短注释。不要改动函数名和参数。
【代码】……
```

**内容分类（要求 JSON）**

```
请把下面的用户反馈分类为 bug / 建议 / 咨询 / 其他，并以 JSON 输出。
示例输出：{"category": "bug", "reason": "……"}
【反馈】……
```

**角色扮演（自定义人设）**

```
你扮演一位（职业），说话风格（描述），知识范围限于（范围）。
对话中不要跳出角色；遇到不知道的问题就说不确定，不要编造。
```

**文案大纲**

```
主题：（……）。读者：（……）。请写一篇 5 个小节的文章大纲，每节给标题和 2 个要点，最后给一句结尾建议。
```

**宣传标语**

```
商品：（名称与卖点）。请写 5 条宣传标语，每条不超过 15 个字，风格（……），不要出现夸大功效的词。
```

**中英翻译**

```
请把下面的中文翻译成英文，语气（正式 / 口语），保留专有名词原文，不要添加解释。
【原文】……
```

更多通用写法见 [/guides/how-to-write-prompts](/guides/how-to-write-prompts)、[/guides/few-shot-prompting-examples](/guides/few-shot-prompting-examples)、[/guides/prompt-xml-tags-markdown-structure](/guides/prompt-xml-tags-markdown-structure)；角色设定是否有用见 [/guides/role-prompting-does-it-work](/guides/role-prompting-does-it-work)。

## 五、几个常见问题的处理

- **回答太泛**：补背景和约束，再给一个期望输出的例子；
- **不按格式输出**：把格式写成样例，而不是只写形容词；JSON 场景用 JSON Output；
- **写到一半跑偏**：把任务拆成大纲 → 分段写，每段都带上设定，见 [/guides/deepseek-write-novel-prompts](/guides/deepseek-write-novel-prompts)；
- **想减少编造**：要求它标注「不确定」，并自己核对关键信息，见 [/guides/reduce-ai-hallucination-official-tips](/guides/reduce-ai-hallucination-official-tips)。

## 常见问题

**Q：有没有官方的「万能提示词」？**
官方没有。提示库只是一些场景样例。

**Q：思考模式下要不要写「一步一步思考」？**
官方文档没有这条建议，思考模式本身会先输出思维链；这类提示词技巧见 [/guides/chain-of-thought-thinking-mode-when-to-use](/guides/chain-of-thought-thinking-mode-when-to-use)。

**Q：网页版怎么用？**
见 [/guides/deepseek-how-to-use](/guides/deepseek-how-to-use)。

## 参考资料

- DeepSeek API 文档：提示库 — https://api-docs.deepseek.com/zh-cn/prompt-library
- DeepSeek API 文档：JSON Output — https://api-docs.deepseek.com/zh-cn/guides/json_mode
- DeepSeek API 文档：多轮对话 — https://api-docs.deepseek.com/zh-cn/guides/multi_round_chat
- DeepSeek API 文档：对话前缀续写（Beta）— https://api-docs.deepseek.com/zh-cn/guides/chat_prefix_completion
- DeepSeek API 文档：FIM 补全（Beta）— https://api-docs.deepseek.com/zh-cn/guides/fim_completion
- DeepSeek API 文档：获取模型列表 — https://api-docs.deepseek.com/zh-cn/api/list-models
- DeepSeek API 文档：思考模式 — https://api-docs.deepseek.com/zh-cn/guides/thinking_mode
