---
title: 提示词怎么写：ChatGPT / Claude 官方提示词技巧与万能公式
slug: how-to-write-prompts
products: [chatgpt, claude]
models: [gpt, claude-llm]
accountTier: FREE
excerpt: 提示词怎么写才有效？本文把 OpenAI 和 Anthropic 官方提示词指南的要点整理成一个「目标 / 背景 / 输出 / 边界」通用公式，附改写前后对比、迭代追问方法和两家模型各自的注意点。
checkedOn: 2026-10-07
sources:
  - https://learn.chatgpt.com/docs/prompting
  - https://help.openai.com/en/articles/10032626-prompt-engineering-best-practices-for-chatgpt
  - https://developers.openai.com/api/docs/guides/prompt-engineering
  - https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/overview
  - https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/claude-4-best-practices
  - https://claude.com/blog/best-practices-for-prompt-engineering
  - https://claude.com/blog/prompt-improver
  - https://help.openai.com/en/articles/6825453-chatgpt-release-notes
verify:
  - OpenAI 的提示词教程页现在的规范地址是 learn.chatgpt.com/docs/prompting（openai.com/academy/prompting 会跳转过去），上线前确认链接仍有效
  - ChatGPT「设置 → 个性化 → 自定义指令」的中文界面名称以实际显示为准
---

> 本文根据 OpenAI 官方提示词教程（ChatGPT Learn）、OpenAI 帮助中心与开发者文档、Anthropic 官方提示词文档和博客整理，核对日期 2026-10-07；截图引用自 OpenAI 帮助中心发布说明和 Anthropic 官方博客并注明出处。文中示例提示词为本站编写，仅供参考。

## 适用于谁

- 搜「提示词怎么写」「ChatGPT 提示词技巧」「提示词公式」，觉得 AI 回答总是泛泛而谈、跑题、格式不对的人；
- 同时用 ChatGPT 和 Claude，想知道两家官方各自推荐怎么写的人；
- 想先学会一个通用写法，再去本站[文本提示词库](/prompts/text)里挑现成模板改的人。

Free 账号就能照着做，提示词写法和套餐无关。

## 先回答：提示词工程是什么

OpenAI 帮助中心的定义很直白：提示词（prompt）是你输入给模型、让它开始回应的内容；**提示词工程**就是设计和优化这些输入，让模型更稳定地给出你要的结果。Anthropic 的文档补充了一点：在改提示词之前，先想清楚「什么样的结果算成功」，否则你没法判断改得好不好。

## 结论先说

1. **没有必须照抄的格式。** OpenAI 的官方教程明确说，写提示词不需要技术语法或固定公式，先用自己的话说，再根据回答追问。
2. **重要任务补齐四件事：目标、背景、输出、边界。** 这是 OpenAI 官方教程列出的四个部分，用得上的写，用不上的省略。
3. **两家共同强调的三点：** 说清楚要什么（具体）、说明为什么（背景和用途）、给一个例子（格式最难描述时最有效）。
4. **第一版不完美很正常。** 两家都把「看结果 → 改提示词」当成标准流程。

## 步骤

### 1. 先用一句话说清「要什么结果」

OpenAI 建议从**结果**写起，而不是一上来列一长串步骤；读者是谁、用在哪里，如果会影响产出就写上。

> 把这份会议记录整理成发给项目组的简短进展通报，决定事项和下一步放在最前面。

这一句就包含了「做什么」「给谁看」「重点放哪」。Anthropic 的说法类似：把 Claude 当成一位很聪明、但不了解你们规矩的新同事，你说得越准，结果越好；写完可以想象把提示词交给一个不了解情况的同事，他看不懂，模型也会犯迷糊。

### 2. 套用通用公式：目标 / 背景 / 输出 / 边界

下面这个结构就是把 OpenAI 教程里的四部分写成中文模板（「万能公式」只是个方便记的说法，官方并不要求每次都填满）：

```text
【目标】我要你帮我……（一句话说清要的结果）
【背景】这是给……看的 / 用在……；可参考的资料是……（只放会影响结果的信息）
【输出】格式（表格 / 要点 / 邮件 / 300 字以内……），先写什么后写什么
【边界】哪些不能改、不确定时怎么办、哪些事先问我再做
```

改写前后对比（示例，仅供参考）：

- 改写前：「帮我写个请假条。」
- 改写后：「【目标】写一封向直属领导请 3 天年假的微信消息。【背景】下周三到周五，手头的周报已安排同事代交。【输出】100 字以内，语气礼貌但不卑微，最后一句说明紧急情况可以电话联系。【边界】不要编造请假理由，只写『家里有事』。」

如果你还想设定「角色」，可以放在最前面一句。但 Anthropic 2026 年的博客提醒：现在的模型不太需要夸张的角色设定，与其写「你是世界顶级专家」，不如直接说明你要它从什么角度分析。

### 3. 用「为什么」代替生硬的禁令

Anthropic 的博客举过一个例子：与其只写「绝对不要用列表」，不如说明「我更喜欢自然段落，因为读起来更像对话」，模型理解了原因，就能在相关情况下做出更合适的判断。它的官方文档还建议**告诉模型该做什么，而不是只说不要做什么**，比如把「不要用 Markdown」改成「用连贯的段落来写」。

同样，OpenAI 建议把边界控制在最重要的一两条，例如「保留已确认的日期和预算数字」「只用我给的资料，缺信息就标出来，不要猜」。

### 4. 格式难描述，就给一个例子

两家文档都把「给例子」（少样本，few-shot）列为最可靠的手段之一。Anthropic 的建议是：例子要贴近真实用途、彼此有差异，避免模型学到你不想要的模式；先给一个，不够再加。

> 下面是我想要的摘要风格：
> 原文：……
> 摘要：一句话结论 + 两条关键数据 + 影响谁。
> 现在按同样风格总结这篇：……

![Anthropic 开发者控制台的 Workbench：左侧「Examples」区放了 3 个示例，下方是提示词，右侧是模型回答（2024 年的开发者界面，以实际为准）](seed:g13-claude-examples.jpg)
*图片来源：[Claude 官方博客《Improve your prompts in the developer console》](https://claude.com/blog/prompt-improver)。这是面向开发者的控制台，普通用户在聊天框里直接把例子写进提示词即可。*

### 5. 长资料放前面，问题放后面

把长文档、表格一起发给模型时，Anthropic 的文档建议：**长资料放在提示词上方，问题和要求放在最后**；多份资料可以用标签或标题分开，并先让模型引用原文中相关的段落再作答。OpenAI 开发者文档也建议用 Markdown 标题和 XML 标签划清「说明」和「资料」的边界。在聊天框里可以简单写成：

```text
<资料>
（粘贴内容）
</资料>
请根据上面的资料回答：……；先列出你依据的原文句子，再给结论。
```

### 6. 允许它说「不知道」，再迭代

Anthropic 的博客建议明确告诉模型「数据不足就直说，不要猜」，以减少编造。拿到第一版后，不必重写整段提示词，直接说要改哪里，例如 OpenAI 教程里的示范：「开头更直接，保留证据，把建议移到背景之前」。重要的工作，可以最后让它自查一遍，比如「检查每个待办是否都有负责人和截止日期」，然后你自己再核对。

### 7. 长期偏好放进设置，别每次重复

OpenAI 建议把所有对话都适用的偏好写进 **设置 → 个性化** 的自定义指令，只和当前对话有关的再写进提示词。Claude 也有对应的账号级设置（「Instructions for Claude」，在 设置 里填写）。某一个课题的固定规则，则更适合放进项目说明（见本站《ChatGPT 项目功能有什么用、怎么用》）。

![ChatGPT「自定义 ChatGPT」窗口：怎么称呼你、你的职业、希望 ChatGPT 具备的特质、还需要了解你的什么（2025 年 1 月的界面，以实际为准）](seed:g13-custom-instructions.png)
*图片来源：[OpenAI 帮助中心：ChatGPT Release Notes（2025-01-17）](https://help.openai.com/en/articles/6825453-chatgpt-release-notes)*

## ChatGPT 和 Claude 写法有区别吗

大方向一致，细节上有几处值得注意：

| 要点 | ChatGPT（OpenAI 官方） | Claude（Anthropic 官方） |
| --- | --- | --- |
| 基本结构 | 目标、背景、输出、边界，用得上的才写 | 清晰直接、说明原因、给例子 |
| 结构化标记 | 可用 Markdown 标题和 XML 标签分隔 | XML 标签可用；2026 年博客称多数场景用清楚的标题就够 |
| 角色设定 | 未作为必需项 | 一句话角色可以，但不要过度限定 |
| 让它动手 | — | 想让它直接修改，就说「改这段」，而不是「能不能给点建议」 |

## 常见问题

**Q：提示词越长越好吗？**
不是。Anthropic 的博客把「过度设计」列为常见错误：最好的提示词不是最长的，而是用最少的必要结构稳定达到目的。先写简单版，结果不对再加。

**Q：网上的「万能提示词模板」能直接用吗？**
可以当起点，但要换成你自己的目标、资料和边界。本站[文本提示词库](/prompts/text)按「角色 / 背景 / 任务 / 约束 / 输出格式」整理了科研、写作、编程、职场等模板，方括号里的部分替换成你的内容即可。

**Q：同一个提示词，ChatGPT 和 Claude 结果不一样？**
正常。不同模型的默认风格不同，Anthropic 文档也专门列了各型号的差异（比如有的型号默认回答更长）。如果对长度、格式有要求，直接写明。

**Q：AI 还是编造内容怎么办？**
给它资料、要求它只依据资料回答、允许说「不知道」，并要求列出依据。涉及事实、数字的内容，最后都要自己核对。

## 参考资料

- ChatGPT Learn：Prompting — https://learn.chatgpt.com/docs/prompting
- OpenAI 帮助中心：Prompt engineering best practices for ChatGPT — https://help.openai.com/en/articles/10032626-prompt-engineering-best-practices-for-chatgpt
- OpenAI API 文档：Prompt engineering — https://developers.openai.com/api/docs/guides/prompt-engineering
- Claude 文档：Prompt engineering overview — https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/overview
- Claude 文档：Prompting best practices — https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/claude-4-best-practices
- Claude 博客：Best practices for prompt engineering — https://claude.com/blog/best-practices-for-prompt-engineering
- 截图来源：OpenAI 帮助中心发布说明、Claude 官方博客（见各图下方链接）
