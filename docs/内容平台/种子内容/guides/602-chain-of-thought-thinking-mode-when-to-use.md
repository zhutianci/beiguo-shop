---
title: 思维链提示词还有用吗：「一步一步思考」什么时候写、思考模式什么时候开
slug: chain-of-thought-thinking-mode-when-to-use
products: [chatgpt, claude]
models: []
accountTier: FREE
excerpt: 「请一步一步思考」这句思维链提示词现在还要不要写？本文按 OpenAI、Anthropic、Google 官方文档讲清：带思考能力的模型不需要你教它分步，什么任务值得开思考、什么任务开了只是变慢，以及没有思考模式时怎么手动引导。
checkedOn: 2026-10-11
sources:
  - https://developers.openai.com/api/docs/guides/reasoning-best-practices
  - https://developers.openai.com/api/docs/guides/prompt-engineering
  - https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices
  - https://ai.google.dev/gemini-api/docs/prompting-strategies
  - https://ai.google.dev/gemini-api/docs/thinking
---

## 适用于谁

- 搜「思维链提示词」「思维链提示词模板」「cot 思维链和提示词的区别」的人；
- 不确定该不该在提示词里写「请一步一步思考」，也不确定「思考 / 深度思考 / Thinking」开关什么时候该开的人。

本文根据 OpenAI、Anthropic、Google 的官方文档整理，资料核对于 2026-10-11。各产品界面里思考开关的具体位置，见站内《ChatGPT 模型怎么选》《Gemini 模型有哪些》等文章。

## 结论先说

1. **思维链（Chain of Thought，CoT）指让模型在给出答案前先写出推理过程**。早期模型没有内置的思考能力，所以需要在提示词里写「请一步一步思考」。
2. **现在的主流模型大多内置了思考能力**。对这类模型，三家官方的说法一致：不需要再教它一步步想。
3. **OpenAI 说得最直接**：对推理模型，避免使用思维链提示词，因为模型在内部完成推理，让它「一步一步思考」或「解释你的推理」是不必要的。
4. **该做的是把目标和成功标准说清楚**，以及在需要时调高思考强度，而不是规定思考步骤。
5. **没有思考能力、或者思考被关掉的时候**，手动思维链仍然有用，写法见下文。

## 三家官方怎么说

| | 对「让模型分步思考」的态度 |
| --- | --- |
| OpenAI | 推理模型在内部推理，提示「think step by step」没有必要；提示词保持简单直接 |
| Anthropic | 泛泛的一句「仔细想清楚」往往比你手写的分步计划效果更好，模型的推理经常超出人会规定的步骤；思考关闭时，可以用手动思维链作为后备 |
| Google | Gemini 2.5 和 3 系列会自动生成内部的「思考」文本来提升推理表现，一般不需要让模型在回答里列提纲、做计划或写推理步骤 |

OpenAI 文档里有个好记的比喻：推理模型像一位资深同事，给他一个目标，相信他能自己把细节搞定；普通的 GPT 模型像一位新人同事，给出明确的指令时表现最好。

## 步骤

### 1. 判断这个任务值不值得开思考

OpenAI 文档列举了推理模型擅长的任务类型，可以作为「该开思考」的清单：

- **处理模糊的任务**：信息不全、需要先弄清意图；
- **大海捞针**：从大量非结构化信息里找出最相关的那一点；
- **在大量资料中找关联和细微差别**：比如通读多份合同找出冲突的条款；
- **多步骤的规划**：把一个大任务拆成步骤并安排顺序；
- **看图推理**：图表、结构复杂的表格、画质不好的照片；
- **审查、调试和改进代码**；
- **评估其他模型的回答**。

反过来，OpenAI 也给了取舍标准：最看重**速度和成本**、任务**定义明确**时，用普通模型更合适；最看重**准确和可靠**、问题**复杂多步**时，用推理模型。

不值得开思考的典型任务：改写润色、翻译、格式转换、简单问答、按模板生成内容。开了也能做，只是更慢、更费额度。

### 2. 用带思考的模型时，这样写提示词

OpenAI 给推理模型的提示词建议：

- **保持简单直接**，模型擅长理解简短清晰的指令；
- **不要写思维链提示**；
- **用分隔符**（Markdown、XML 标签、小标题）标明输入的不同部分；
- **先试不带例子的写法**，要求复杂时再加少量例子，并确保例子和指令一致；
- **写明具体的限制条件**，例如「给出预算在 500 美元以内的方案」；
- **把最终目标说得非常具体**：给出「成功的回答」的明确标准，并鼓励模型持续推理和迭代，直到满足这些标准。

所以提示词的重心从「怎么想」移到了「想到什么程度算完成」。对比：

- 旧写法：「请一步一步思考：第一步分析需求，第二步列出方案，第三步比较优劣……」
- 新写法：「给出一个迁移方案。成功标准：停机时间不超过 10 分钟；可以随时回滚；列出你做的每个假设。」

### 3. 需要它想得更深时

- **OpenAI**：API 里用 `reasoning` 的 `effort` 参数调节推理强度；
- **Claude**：新模型使用自适应思考，由模型自己决定什么时候思考、思考多少，整体力度用 `effort` 控制。官方文档说明，旧的 `budget_tokens` 写法在 Claude 4.7 及之后的模型上会返回 400 错误；
- **Gemini**：默认动态思考，按请求的复杂程度自动调整，用 `thinking_level` 参数控制（多数模型可选 minimal、low、medium、high）。Google 文档还提到，对推理量很大的问题，加一句「回答前请认真思考」这样的简单请求可以提升表现，代价是多消耗思考 token。

聊天产品里对应的就是模型选择器或输入框旁的思考强度选项。

Anthropic 还给了两个用提示词影响思考的例子：

- 觉得模型**想得太多**（系统提示词又长又复杂时容易出现），可以加一句：思考会增加延迟，只在确实能提升回答质量时才使用，典型情况是需要多步推理的问题；拿不准时直接回答；
- 想让它**在拿到工具结果后先反思再行动**：在提示词里要求它收到工具结果后，先评估结果的质量、确定下一步的最佳做法再继续。

### 4. 让它自己检查

Anthropic 文档推荐的做法：在提示词末尾加一句类似「结束之前，请对照［检验标准］核对你的答案」。官方称这对代码和数学尤其有效。文档同时提醒，个别新模型不用提示就会很好地自查，对它们再加核查指令反而会导致过度核查，增加耗时和 token。

### 5. 没有思考能力时：手动思维链

用不带思考的小模型、本地模型，或者为了省钱关掉了思考时，手动思维链仍然管用。Anthropic 给的写法是：让模型在回答前先把问题想一遍，并把最终答案放进 `<answer>` 标签，方便你提取。

```
先在 <thinking> 标签里逐步分析这个问题：
已知条件是什么、要求的是什么、可能的解法有哪些、各自的风险。
然后在 <answer> 标签里给出最终答案，只写结论。
```

程序里只取 `<answer>` 里的内容；人工看的时候，`<thinking>` 部分可以帮你判断它是不是在某一步想岔了。

## 常见问题

**Q：对带思考的模型写了「一步一步思考」会有坏处吗？**
OpenAI 的用词是「没有必要」。实际的代价主要是回答变长、变慢；如果你手写的步骤不如模型自己规划的好，还会限制它。直接删掉，把篇幅用在说明目标和约束上。

**Q：能看到模型的思考过程吗？**
各家都只展示思考的摘要或部分内容，具体形式以产品界面和 API 文档为准。Anthropic 建议在答案看起来不对时去看思考摘要，往往能发现错误的假设。

**Q：思考强度是不是开到最高最好？**
不是。强度越高越慢、消耗越多。Anthropic 文档甚至专门讲了「过度思考」的问题，建议在模型过于发散时调低 `effort`。先用默认档，结果不够好再往上调。

**Q：让模型把推理过程写进 JSON 字段里可以吗？**
谨慎。Anthropic 的结构化输出文档提醒，要求输出思考过程的字段可能导致拒答，建议改成要一段简短的说明。

**Q：思维链和提示词链是一回事吗？**
不是。思维链是在**一次**回答里先推理后作答；提示词链是把任务拆成**多次**调用，前一步的输出交给后一步。

## 参考资料

- OpenAI 文档：Reasoning best practices — https://developers.openai.com/api/docs/guides/reasoning-best-practices
- OpenAI 文档：Prompt engineering（Prompting reasoning models）— https://developers.openai.com/api/docs/guides/prompt-engineering
- Anthropic 文档：Prompting best practices（Thinking and reasoning）— https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices
- Google 文档：Prompt design strategies — https://ai.google.dev/gemini-api/docs/prompting-strategies
- Google 文档：Gemini thinking — https://ai.google.dev/gemini-api/docs/thinking
