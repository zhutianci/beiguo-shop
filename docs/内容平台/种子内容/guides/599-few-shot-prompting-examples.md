---
title: 少样本提示（Few-shot）怎么写：给几个例子、怎么挑、怎么排版（官方建议汇总）
slug: few-shot-prompting-examples
products: [claude, gemini]
models: []
accountTier: FREE
excerpt: 少样本提示（few-shot prompting）是什么、例子该给几个？本文汇总 Anthropic、Google、OpenAI 官方文档的说法：为什么示例比文字描述管用、3–5 个的建议从哪来、示例要相关多样且格式一致，以及推理模型什么时候可以不给例子。
checkedOn: 2026-10-11
sources:
  - https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices
  - https://ai.google.dev/gemini-api/docs/prompting-strategies
  - https://developers.openai.com/api/docs/guides/prompt-engineering
  - https://developers.openai.com/api/docs/guides/reasoning-best-practices
---

## 适用于谁

- 搜「少样本提示」「few shot 提示词」「few-shot prompt 例子」的人；
- 用文字怎么描述都得不到想要的格式和语气，想知道「给例子」到底该怎么给的人。

本文根据 Anthropic、Google、OpenAI 的官方提示词文档整理，资料核对于 2026-10-11。

## 结论先说

1. **少样本提示就是在提示词里放几组「输入 → 期望输出」的例子**，让模型照着这个模式做；一个例子都不给叫零样本（zero-shot）。
2. **例子主要用来管格式、措辞、范围和风格**，这些东西用文字很难描述清楚，用例子一看就懂。
3. **给几个**：Anthropic 的建议是 3–5 个。Google 说需要自己试，并提醒例子太多模型可能「过拟合」到例子上。
4. **怎么挑**：贴近真实场景、彼此有差异、覆盖边界情况。
5. **怎么排**：所有例子的结构和格式必须一致，并且和指令明确分隔开。
6. **推理模型可以先不给例子试试**，这是 OpenAI 对推理模型的建议。

## 三家官方怎么说

| | 态度 | 关键建议 |
| --- | --- | --- |
| Anthropic | 示例是引导输出格式、语气和结构最可靠的方法之一 | 3–5 个；相关、多样、有结构；用 `<example>` 标签包起来 |
| Google | 建议**始终**在提示词里包含少样本示例，没有示例的提示词效果可能更差 | 例子足够清楚时甚至可以去掉指令；注意数量和格式一致 |
| OpenAI | 通过少量输入输出示例把模型引向新任务，不用微调 | 示例要覆盖多样的输入；推理模型先试零样本 |

三家的共同点是：例子有用，而且比多数人以为的更有用。分歧只在「是不是每次都要给」。

## 步骤

### 1. 判断需不需要例子

适合给例子的情况：

- 输出有固定格式（表格列、JSON 字段、固定句式）；
- 有特定的语气和文风（品牌口吻、某种报告体例）；
- 分类、打标签、信息抽取这类「同一种操作重复做」的任务；
- 你发现自己写了一大段话在描述「我想要的样子」。

可以先不给的情况：用的是推理模型（开启思考的模型），任务本身说得清楚。OpenAI 的原话是：推理模型往往不需要少样本示例就能给出好结果，先写不带例子的提示词；输出要求比较复杂时再加几个，并且**确保例子和指令高度一致**，两者有出入会导致结果变差。

### 2. 挑例子：相关、多样

Anthropic 给的三个标准：

- **相关（Relevant）**：贴近你的真实使用场景；
- **多样（Diverse）**：覆盖边界情况，彼此差别足够大，免得模型学到你没打算教的规律；
- **有结构（Structured）**：见下一步。

「多样」最容易被忽略。常见的翻车方式：

- 三个例子的答案都是「正面」，模型就倾向于什么都判正面；
- 三个例子的输出都是恰好三句话，模型就认为必须三句话；
- 例子的输入都很短，遇到长输入时表现失常。

所以挑的时候刻意放进：不同类别的各一个、长短不一的、至少一个「难判断」的或者「应该拒绝 / 应该说不知道」的。

Anthropic 还提到一个省事的办法：让模型帮你评估这组例子够不够相关和多样，或者基于你已有的几个再生成一些。

### 3. 排版：格式一致，和指令分开

Google 的提醒：加例子的主要目的之一就是向模型展示回答的格式，所以所有例子的结构和格式必须相同，尤其要注意 XML 标签、空格、换行和例子之间的分隔符。

Anthropic 的做法是用标签把例子包起来，让模型能分清哪些是例子、哪些是指令：单个用 `<example>`，多个再套一层 `<examples>`。OpenAI 官方示例的排法类似，把例子放在开发者消息的「Examples」一节，每组用成对的标签标出输入和输出。

一个完整的例子（给用户评论打标签）：

```
把下面的用户评论归为「好评」「中评」「差评」之一，只输出这两个字，不要解释。

<examples>
<example>
<review>音质很好，降噪也不错，就是充电盒有点大。</review>
<label>好评</label>
</example>
<example>
<review>续航还行，耳垫感觉比较廉价。</review>
<label>中评</label>
</example>
<example>
<review>客服态度太差，再也不买了。</review>
<label>差评</label>
</example>
<example>
<review>东西还没到，先来占个位。</review>
<label>中评</label>
</example>
</examples>

<review>［待分类的评论］</review>
```

第四个例子是特意放的边界情况：没有实际评价内容时该怎么归。

### 4. 控制数量

- Anthropic：3–5 个效果最好；
- Google：模型通常用几个例子就能抓住规律，但需要你自己试出合适的数量；例子太多时，模型可能过拟合，回答变得过于贴近例子本身。

实际做法是从 3 个开始，输出不稳定就针对出错的类型补例子，而不是盲目加量。

### 5. 让例子「压过」默认倾向

Google 文档里有个很有启发的演示：同一个选择题，零样本时模型选了较长的解释；在提示词里放两个「都偏向简短答案」的例子之后，模型改选了较短的那个。也就是说，例子不只是示范格式，还能改变模型的偏好。想让回答更短、更口语、更谨慎，就让例子体现出来。

## 配合思考模式

Anthropic 文档说明，少样本示例在思考模式下同样有效：提示词里的完整解题范例会影响模型在思考过程中处理类似问题的方式。官方建议把每个例子写成「问题 + 应该用的方法 + 期望的答案」。

## 常见问题

**Q：例子和指令冲突时听谁的？**
没有可靠的规则，结果会变得不稳定。OpenAI 专门提醒了例子与指令不一致会导致结果变差。写完后检查一遍：例子里的每个输出，是否都严格符合你写的指令？

**Q：模型总是照抄例子里的内容怎么办？**
这是例子太少或太相似的信号。增加差异；在指令里说明「例子只用于展示格式，不要复用其中的具体内容」。

**Q：聊天界面里怎么用少样本？**
直接在消息里写「参考下面几个例子的格式」再贴例子即可。要长期使用，就放进自定义指令、项目说明或智能体的系统提示词里，见《系统提示词怎么写》。

**Q：例子很长，占了太多上下文怎么办？**
固定不变的例子放在提示词的开头部分，配合各家的提示词缓存可以降低重复调用的成本，见站内《Claude 提示词缓存入门》。

**Q：去哪里找现成的例子？**
站内提示词库（/prompts）的文本类提示词都附有「示例输出」，可以直接拿来当少样本示例改写。

## 参考资料

- Anthropic 文档：Prompting best practices（Use examples effectively）— https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices
- Google 文档：Prompt design strategies（Zero-shot vs few-shot prompts）— https://ai.google.dev/gemini-api/docs/prompting-strategies
- OpenAI 文档：Prompt engineering（Few-shot learning）— https://developers.openai.com/api/docs/guides/prompt-engineering
- OpenAI 文档：Reasoning best practices — https://developers.openai.com/api/docs/guides/reasoning-best-practices
