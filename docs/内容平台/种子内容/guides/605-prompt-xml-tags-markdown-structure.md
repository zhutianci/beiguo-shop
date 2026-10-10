---
title: 提示词 XML 标签怎么用：用标签和 Markdown 给长提示词分区（官方写法与模板）
slug: prompt-xml-tags-markdown-structure
products: [claude, chatgpt]
models: []
accountTier: FREE
excerpt: 提示词里的 XML 标签有什么用？本文按 Anthropic、OpenAI、Google 官方文档讲清为什么要给提示词分区、标签和 Markdown 标题各适合做什么、标签怎么命名和嵌套，并附通用模板。
checkedOn: 2026-10-11
sources:
  - https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices
  - https://developers.openai.com/api/docs/guides/prompt-engineering
  - https://developers.openai.com/api/docs/guides/reasoning-best-practices
  - https://ai.google.dev/gemini-api/docs/prompting-strategies
---

## 适用于谁

- 搜「提示词 xml标签」「提示词 分隔符」的人；
- 看到别人的提示词里写满了 `<context>`、`<instructions>` 这样的尖括号，想知道这是不是必须、该怎么写的人；
- 提示词越写越长，模型开始把资料里的话当成指令、或者把例子当成正文的人。

本文根据 Anthropic、OpenAI、Google 的官方提示词文档整理，资料核对于 2026-10-11。

## 结论先说

1. **标签的作用是「分区」**：告诉模型哪一段是指令、哪一段是资料、哪一段是例子，避免混淆。
2. **不是只有 Claude 才用**。三家官方文档都推荐用 XML 风格的标签或 Markdown 来组织提示词。
3. **没有「官方规定的标签名」**。标签名自己取，要求是有描述性、前后一致。
4. **Markdown 标题适合划分大的章节，XML 标签适合包住一整块内容**，两者可以配合使用；Google 则建议在一个提示词里选定一种并保持一致。
5. **短提示词不需要标签**。一句话能说清的事，加标签只是添乱。

## 三家官方怎么说

| | 说法 |
| --- | --- |
| Anthropic | XML 标签帮助模型无歧义地解析复杂的提示词，尤其是当提示词里混合了指令、上下文、示例和可变输入时。把每种内容包在各自的标签里，可以减少误解 |
| OpenAI | 用 Markdown 和 XML 标签的组合帮助模型理解提示词和上下文数据的逻辑边界。Markdown 的标题和列表用来标出不同部分并表达层级；XML 标签用来界定一段内容（比如参考文档）从哪里开始、到哪里结束，标签的属性还可以用来放关于内容的元数据 |
| Google | 用清晰的分隔符把提示词的不同部分分开，XML 风格的标签（如 `<context>`、`<task>`）或 Markdown 标题都有效；选一种格式，在同一个提示词里保持一致 |

OpenAI 在给推理模型的建议里也专门有一条：用 Markdown、XML 标签和小标题这样的分隔符，清楚地标明输入的不同部分。

## 步骤

### 1. 判断要不要分区

需要分区的信号：

- 提示词里有**大段粘贴的资料**（文档、邮件、代码、聊天记录）；
- 同时有**指令 + 例子 + 待处理的内容**三样东西；
- 资料里本身含有祈使句（比如一封邮件里写着「请尽快回复」），你担心模型把它当成给自己的指令；
- 你需要程序化地**从输出里提取**某一部分。

反之，「把这句话翻译成英文」这种一句话的任务，不需要任何标签。

### 2. 给每种内容一个标签

Anthropic 举的例子是 `<instructions>`、`<context>`、`<input>`。常用的一组：

| 标签 | 放什么 |
| --- | --- |
| `<role>` 或 `# 身份` | 角色和定位 |
| `<instructions>` | 要做什么、规则、步骤 |
| `<context>` | 背景信息 |
| `<document>` / `<documents>` | 参考资料 |
| `<example>` / `<examples>` | 少样本示例 |
| `<input>` 或具体名称如 `<email>` | 这一次要处理的内容 |
| `<output_format>` | 期望的输出格式 |

Anthropic 的两条最佳实践：

- **标签名要一致、有描述性**。整个提示词乃至你所有的提示词里，同一种内容用同一个名字；
- **内容有天然层级时就嵌套**。例如多份文档放在 `<documents>` 里，每份再用带编号的 `<document index="1">` 包起来。

标签名用中文还是英文，官方文档没有规定，示例都是英文。重要的是前后一致、成对闭合。

### 3. 在指令里按名字引用

标签的好处是可以指名道姓。与其写「根据上面的内容」，不如写：

```
请根据 <contract> 中的条款，逐条检查 <checklist> 里的每一项是否满足。
```

资料很多时，这种引用方式能明显减少模型「看错对象」的情况。

### 4. Markdown 和 XML 怎么配合

OpenAI 官方示例的排法是：**大章节用 Markdown 标题，具体内容块用 XML 标签**。

```
# 身份
你是帮助团队统一代码风格的编程助手。

# 指令
* 变量名一律用 snake_case。
* 只返回代码，不要解释。

# 示例
<user_query>
怎么声明一个存名字的字符串变量？
</user_query>
<assistant_response>
var first_name = "Anna";
</assistant_response>
```

Google 的模板则是全程用 XML 风格的标签（`<role>`、`<constraints>`、`<context>`、`<task>`），并说明把用户输入放进 `<context>` 之后，模型会知道这是数据而不是指令。两种都可以，关键是一个提示词内部风格统一。

Anthropic 还有一条相关的提醒：提示词本身的格式风格会影响回答的风格。提示词里满是 Markdown，回答也更容易满是 Markdown；想要成段的文字，就少用列表和加粗来写提示词。

### 5. 让输出也进标签

标签不只用于输入。让模型把不同部分的输出放进指定的标签里，后续提取和核对都更方便：

```
先在 <quotes> 标签里摘录相关原文，再在 <answer> 标签里给出结论。
```

Anthropic 文档里把这种做法用在好几个地方：用 `<quotes>` 和 `<info>` 分开摘录与分析；思考关闭时把最终答案放进 `<answer>` 标签以便提取；想控制写作风格时，让模型把正文写在一个以风格命名的标签里。

程序里用简单的字符串匹配就能取出标签内的内容。但如果你需要的是**严格合法的 JSON**，应该用结构化输出功能而不是靠标签，见《如何让大模型稳定输出 JSON》。

## 通用模板

```
<role>
［一两句话：它是谁、为谁服务、什么口吻］
</role>

<instructions>
1. ［第一步］
2. ［第二步］
3. ［规则与限制；重要的规则写上原因］
</instructions>

<examples>
<example>
<input>［示例输入］</input>
<output>［示例输出］</output>
</example>
</examples>

<documents>
<document index="1">
<source>［来源］</source>
<document_content>
［资料正文］
</document_content>
</document>
</documents>

<task>
［这一次的具体请求。资料很长时，把这一段放在最后］
</task>
```

按需删减：没有例子就删掉 `<examples>`，没有资料就删掉 `<documents>`。

## 常见问题

**Q：必须是合法的 XML 吗？要不要写声明、转义特殊字符？**
不需要。这里只是借用尖括号的形式做分隔，不会被当作 XML 解析。成对闭合、不要交叉嵌套就可以。

**Q：用三个引号、三个反引号或者 `###` 做分隔行不行？**
可以，它们同样是分隔符。标签的优势在于有名字，能在指令里引用，也能嵌套。资料本身包含代码块或 Markdown 时，用标签包住更不容易混淆。

**Q：资料里的内容会不会被当成指令执行？**
分区能降低这种风险，Google 的模板也是这样说明的。但它不是安全机制：处理不可信的外部内容（网页、陌生邮件）时，仍然要假设其中可能有人为设计的指令，重要操作要有人工确认。

**Q：聊天界面里也能这么写吗？**
能，直接把带标签的文本粘进输入框即可。上传文件时文件本身就是一个独立的块，不用再包标签，在问题里用文件名指代就行。

**Q：标签用得越多越好吗？**
不是。每加一个标签都要问：它区分开了两种不同的内容吗？只包住一句话的标签通常是多余的。

## 参考资料

- Anthropic 文档：Prompting best practices（Structure prompts with XML tags、Control the format of responses）— https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices
- OpenAI 文档：Prompt engineering（Message formatting with Markdown and XML）— https://developers.openai.com/api/docs/guides/prompt-engineering
- OpenAI 文档：Reasoning best practices — https://developers.openai.com/api/docs/guides/reasoning-best-practices
- Google 文档：Prompt design strategies（Structured prompting examples）— https://ai.google.dev/gemini-api/docs/prompting-strategies
