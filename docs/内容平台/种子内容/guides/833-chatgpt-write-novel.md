---
title: ChatGPT 怎么写小说：用项目放设定、自定义指令定文风、一章章写，附可复制的指令和模型怎么选
slug: chatgpt-write-novel
products: [chatgpt]
models: []
accountTier: FREE
excerpt: 想让 ChatGPT 帮你写小说，又怕写到后面前后矛盾、文风漂移？本文用官方说明的项目、自定义指令、写作块、模型思考档位这几个功能，给出一套从设定到大纲到逐章写作的做法，附 6 条可以直接复制的指令，并说明写小说该选哪个模型档位。
checkedOn: 2026-10-14
sources:
  - https://help.openai.com/en/articles/20001246-working-with-writing-blocks-and-code-blocks-in-chatgpt
  - https://help.openai.com/en/articles/8096356-chatgpt-custom-instructions
  - https://help.openai.com/en/articles/9260256-chatgpt-capabilities-overview
  - https://help.openai.com/en/articles/20001354-gpt-6-and-other-models-in-chatgpt
verify:
  - 官方没有写「写小说」的专门说明，也没有哪个模型更适合写小说的结论；本文只用官方写明的功能（项目、自定义指令、写作块、模型档位），工作流程和指令是本站的写法建议
  - 项目的文件数量上限随套餐而不同，文中不写具体数字，见官方文件上传说明
  - 小说内容请遵守 OpenAI 的使用政策；本文不涉及任何违规题材的写法
---

> 本文根据 OpenAI 帮助中心《Working with writing blocks and code blocks in ChatGPT》《ChatGPT Custom Instructions》《ChatGPT capabilities overview》《GPT-6 and other models in ChatGPT》整理，资料核对于 2026-10-14。官方文章没有配界面截图，文中配图为本站整理的示意图。工作流程和指令是本站的建议，不是官方文案。

## 适用于谁

- 搜「ChatGPT 写小说」「ChatGPT 写小说指令」「ChatGPT 写小说用哪个模型」的人；
- 写长篇，担心 ChatGPT 写到后面忘记前面的设定、人物性格变来变去的人；
- 想知道怎么把整本稿子存下来、一段一段改的人。

长对话为什么会「忘事」，见 [/guides/chatgpt-context-length-limits](/guides/chatgpt-context-length-limits)。

## 结论先说

1. **没有「写小说」按钮，用几个通用功能搭起来**：**项目（Projects）**放设定资料，**自定义指令**定文风，**写作块**写和改正文，**模型菜单**选思考档位。
2. **官方对项目的定位是**：把聊天、文件和背景放在同一个目标下，适合多次对话、长期推进的工作。写长篇小说正好符合。
3. **自定义指令对所有对话立即生效**；Free 和 Go 最多 1,500 字符，Plus、Pro、Business、Enterprise、Education 最多 5,000 字符。
4. **长文会进入写作块**：官方说写作块是可编辑的文稿区域，可以选中直接编辑、复制、让 ChatGPT 修改选中的部分或整篇、全屏编辑、撤销重做，以及（可用时）保存到文件库。
5. **模型选哪个**：官方没有给「写小说用哪个」的结论。按官方对档位的描述：日常的段落用 Instant 就行；需要构思大纲、设计伏笔、梳理复杂人物关系时，用 Medium 或 High；Extra High 和 Pro 在 Plus 里没有。模型名字和各套餐可选项见 [/guides/chatgpt-gpt6-sol-terra-luna-astra](/guides/chatgpt-gpt6-sol-terra-luna-astra)。
6. **一定要自己把关**：官方提醒 ChatGPT 会出错，也可能写出和前文矛盾的内容；人物设定、时间线靠你来守。

## 步骤

![用 ChatGPT 写一部小说的 5 步](seed:g833-novel-workflow.png)
*图：本站根据 [OpenAI 帮助中心：ChatGPT capabilities overview](https://help.openai.com/en/articles/9260256-chatgpt-capabilities-overview)、[ChatGPT Custom Instructions](https://help.openai.com/en/articles/8096356-chatgpt-custom-instructions) 与 [Working with writing blocks and code blocks](https://help.openai.com/en/articles/20001246-working-with-writing-blocks-and-code-blocks-in-chatgpt) 整理的示意图*

### 1. 先建项目，把设定放进去

新建一个**项目**，把世界观、人物小传、时间线、已写章节的提要等文件放进去，之后在这个项目里开的对话都能参考它们。项目的用法见 [/guides/chatgpt-projects](/guides/chatgpt-projects)。

### 2. 用自定义指令定文风

在 **Settings → Personalization** 里，确认 **Enable customization** 是打开的，在自定义指令里写。可以抄：

```
我在写一部 [都市悬疑] 小说，第三人称有限视角，只跟随主角 [林舟]。
文风：短句为主，少用形容词，对话占比约三分之一。
规矩：不要替我决定剧情走向；不要总结式的结尾；不要出现「命运的齿轮」这类套话；
遇到我没给的设定，先问我，不要自己编。
```

官方说自定义指令会应用到所有对话，包括已有对话；如果你还有别的用途，自定义指令里只放通用偏好，小说专用的要求可以写成一份文档放进项目资料里。

### 3. 先出人物表和大纲，由你来改定

```
根据项目里的设定资料，先做两样东西：
1. 人物表：每人一行，包含姓名、身份、性格关键词、想要什么、害怕什么、与主角的关系；
2. 分章大纲：共 [20] 章，每章两句话——这章发生什么、章末留什么钩子。
先不要写正文。我改完之后再开始。
```

这一步最值得花时间。大纲定稿后，再让它按章写，能大幅减少跑偏。

### 4. 一章一章写

```
现在写第 [3] 章，约 [2000] 字。
依据：项目里的人物表和大纲，以及上一章的结尾（粘贴在下面）。
要求：延续上一章的文风；本章只推进大纲里写的事件；章末按大纲留钩子；
写完后单独列出：本章新出现的设定（人名、地点、时间点），方便我更新资料。
[粘贴上一章结尾 300 字]
```

长章节会进入**写作块**。你可以：

- 选中某一段，让 ChatGPT 只改这一段：「把这一段改得更克制，删掉心理描写，保留对话」；
- 打开全屏编辑，自己直接改；
- 保存到**文件库**，方便之后找；发布说明还说写作块新增了下载支持。

### 5. 定期整理「前情提要」

```
根据我们已经写好的第 1 到第 [5] 章，整理一份前情提要（不超过 600 字）：
主线进展、每个主要人物目前的状态和关系、已经埋下但还没回收的伏笔、时间线。
只写已经发生的事，不要加新内容。
```

把提要存进项目资料里。对话太长或换新对话时，先贴提要，ChatGPT 就能接上。

## 遇到问题怎么办

![写小说遇到的问题：前后矛盾、文风漂移、局部修改、构思、存成文件](seed:g833-novel-features.png)
*图：本站根据 [OpenAI 帮助中心：Working with writing blocks and code blocks](https://help.openai.com/en/articles/20001246-working-with-writing-blocks-and-code-blocks-in-chatgpt) 与 [ChatGPT capabilities overview](https://help.openai.com/en/articles/9260256-chatgpt-capabilities-overview) 整理的示意图；其中前两条做法是本站建议*

补充：

- **临时聊天里的修改可能不保存**：官方说在临时聊天里，写作块的编辑在对话结束后可能不保留。长篇写作不要用临时聊天，见 [/guides/chatgpt-temporary-chat](/guides/chatgpt-temporary-chat)。
- **想存成 Word 文件**：用 Work 创建，见 [/guides/chatgpt-create-word-excel-ppt](/guides/chatgpt-create-word-excel-ppt)；单个对话的导出方法见 [/guides/chatgpt-export-single-chat-pdf-markdown](/guides/chatgpt-export-single-chat-pdf-markdown)。
- **想要更长的篇幅**：别指望一次写完一整章以上；每次请求控制在 2000 字左右，分段写，质量更稳。

## 常见问题

**Q：ChatGPT 写的小说算我的吗？版权怎么算？**
官方在《What is ChatGPT?》里写：在遵守内容政策和条款的前提下，你拥有自己用 ChatGPT 生成的输出，包括转载、出售和商品化的权利。具体的出版和平台投稿规则，以对方平台的要求为准。

**Q：它写的文字太「AI 味」怎么办？**
在自定义指令里写清楚你不要的东西（套话、总结句、排比），并给它一小段你自己写的样文，让它模仿；仍需要你自己通读修改。

**Q：用免费版能写吗？**
可以。免费版日常文字聊天没有次数上限（有防滥用保护），但自定义指令字数上限更低，文件上传也有限制，见 [/guides/chatgpt-free-plan-limits](/guides/chatgpt-free-plan-limits)。需要更多可以看 [/chongzhi/chatgpt-plus](/chongzhi/chatgpt-plus)。

**Q：能不能让它模仿某位作家的风格？**
可以描述风格特点（句子长短、节奏、常用意象），但不要要求大段复刻在世作家的原文；成稿也要避免与他人作品雷同。

## 参考资料

- OpenAI 帮助中心：Working with writing blocks and code blocks in ChatGPT — https://help.openai.com/en/articles/20001246-working-with-writing-blocks-and-code-blocks-in-chatgpt
- OpenAI 帮助中心：ChatGPT Custom Instructions — https://help.openai.com/en/articles/8096356-chatgpt-custom-instructions
- OpenAI 帮助中心：ChatGPT capabilities overview — https://help.openai.com/en/articles/9260256-chatgpt-capabilities-overview
- OpenAI 帮助中心：GPT-6 and other models in ChatGPT — https://help.openai.com/en/articles/20001354-gpt-6-and-other-models-in-chatgpt
- OpenAI 帮助中心：What is ChatGPT? — https://help.openai.com/en/articles/6783457-what-is-chatgpt
