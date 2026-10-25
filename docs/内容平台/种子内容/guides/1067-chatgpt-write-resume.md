---
title: 用 ChatGPT 写简历、改简历：上传简历和岗位信息、对照缺口、逐段改写，附 6 条可复制的指令
slug: chatgpt-write-resume
products: [chatgpt]
models: []
accountTier: FREE
excerpt: 怎么用 ChatGPT 写简历、改简历？按官方提示词四要素（目标、背景、输出、边界），先上传简历和招聘信息做对照，再逐段改写，要求不编造数字。附 6 条可复制指令和发出前的核对清单。
checkedOn: 2026-10-25
sources:
  - https://openai.com/academy/prompting/
  - https://openai.com/academy/writing/
  - https://chatgpt.com/use-cases/students/
  - https://help.openai.com/en/articles/8555545-file-uploads-faq
  - https://help.openai.com/en/articles/10169521-using-projects-in-chatgpt
verify:
  - 官方没有一篇专门的「用 ChatGPT 写简历」帮助文章；正文的方法来自 OpenAI Academy 的提示词指南与写作指南，以及 ChatGPT 学生用例页里的求职类示例（对照简历与岗位、按岗位改求职信、扩展职位名称、面试练习），6 条指令是我们按这些思路写的示范，不是官方原话
  - 官方提醒输出要当草稿、涉及具体数字和事实要自己核实，本文据此要求「不编造数字」
  - 上传文件的大小和数量限制见官方文件上传文章，正文只引用了其中的通用数字
---

> 本文根据 OpenAI Academy 的《Prompting》《Writing with ChatGPT》、ChatGPT 学生用例页（Career 类示例）和官方文件上传、Projects 文章整理，资料核对于 2026-10-25。**官方没有专门写简历的教程**，本文的方法是把官方通用的写作和提示方法，套到简历这件事上。最后的成稿要由你自己核对。

## 适用于谁

- 要写第一份简历，或者很久没更新的人；
- 手上有简历，想针对某个岗位改写的人；
- 搜「chatgpt 写简历」「chatgpt 改简历」的人；
- 担心 ChatGPT 把经历写得太夸张、被面试追问的人。

## 结论先说

1. **官方的提示词四要素：目标（Goal）、背景（Context）、输出（Output）、边界（Boundaries）。** 写简历时：目标是「针对某岗位改写」，背景是你的简历和招聘信息，输出是篇幅和格式，边界是「不编造」。
2. **先对照，后改写。** 官方学生用例页里的求职示例，第一类就是让 ChatGPT 对比简历和岗位要求。先看缺口，再决定改哪里。
3. **边界最重要的一句：「只用我提供的经历，缺信息就标出来，不要猜。」** 官方提示词指南的边界示例里就有这句的意思：只用提供的来源，缺失信息要标出来而不是猜。
4. **把输出当草稿。** 官方写作指南说：把输出当成要自己审阅的草稿，而不是最终的权威；涉及具体数字和事实要核实。
5. **同一个求职，放进一个项目（Project）里反复用。** 官方说项目可以把相关的聊天、文件和指令放在一起，适合重复任务。
6. 想用更长的文件、更多的深度分析，可以看 [/chongzhi/chatgpt-plus](/chongzhi/chatgpt-plus)；免费版做简历改写通常够用，额度见 [/guides/chatgpt-free-plan-limits](/guides/chatgpt-free-plan-limits)。

![用 ChatGPT 改简历的 5 步：上传、先对照、逐段改写写明边界、指定格式、自己核对](seed:g1067-resume-steps.png)
*图：本站根据 [OpenAI Academy：Prompting](https://openai.com/academy/prompting/) 与 [ChatGPT 学生用例页](https://chatgpt.com/use-cases/students/) 整理的示意图*

## 一、第一步：准备材料

1. **简历文件**：点输入框的 **+** 上传 PDF 或文档。文件上传的限制见 [/guides/chatgpt-file-upload-failed](/guides/chatgpt-file-upload-failed)；官方说文档最大 512 MB，通常用不到；
2. **目标岗位的招聘信息**：把岗位描述粘贴进对话，或存成文件上传；
3. **先处理敏感信息**：身份证号、详细住址、银行卡号这类信息和简历质量无关，上传前先删掉。想让这次对话不留在聊天记录里，可以用临时聊天，见 [/guides/chatgpt-temporary-chat](/guides/chatgpt-temporary-chat)；数据用于训练的开关见 [/guides/chatgpt-data-controls-privacy](/guides/chatgpt-data-controls-privacy)；
4. **想反复用**：新建一个项目，把简历和岗位放进去，并在 **Project settings** 里写项目指令（官方说项目指令只在这个项目里生效），见 [/guides/chatgpt-projects](/guides/chatgpt-projects)。

## 二、第二步：6 条可以直接复制的指令

下面每条都对应官方提示词四要素。方括号里是要你自己填的内容。**这些指令是本站的示范，不是官方原话。**

### 1. 先对照：简历和岗位差在哪

> 我上传了我的简历和目标岗位的招聘信息。请先不要改写。分三部分回答：①简历里已经匹配岗位要求的地方；②岗位要求但简历没体现的地方；③简历里和这个岗位无关、可以压缩的内容。只根据我提供的内容判断，不要猜我没写的经历。

### 2. 逐条改写工作经历

> 请改写简历里「[公司名]」这一段的工作内容。要求：每条以动词开头，写清楚做了什么、结果是什么；只使用我提供的信息，不要新增数字、项目或成果；缺少数字的地方用【待补充：…】标出来，我来填。保持原有的时间线和职位名称。

### 3. 把「职责」改成「成果」

> 下面是我写的工作职责：[粘贴]。请把它们改成成果导向的描述。不要编造数据。如果需要数据才能写得有力，请先问我 3 个问题，等我回答后再改。

### 4. 压缩到一页

> 请把这份简历压缩到一页，面向 [岗位名称]。保留和岗位最相关的 3 段经历，其余合并成一句话。给我看压缩前后各部分的删减说明，我来决定保留什么。

### 5. 按岗位写求职信

> 我想写一封求职信。请参考我之前求职信的结构和语气，根据招聘信息调整内容：[粘贴岗位描述]。控制在 300 字内，只写我简历里已有的经历。

官方学生用例页里就有这种思路：沿用过去求职信的结构、风格和语气，内容按岗位调整。

### 6. 面试问题预测

> 根据这份招聘信息和我的简历，列出面试官最可能问我的 10 个问题，并标出哪几个是针对简历里的哪一段经历。先不要给答案。

官方学生用例页里还有一类：基于岗位描述生成可能的面试问题、模拟面试并给反馈。想练习口语，可以配合语音，见 [/guides/chatgpt-voice-mode](/guides/chatgpt-voice-mode)。

## 三、改完之后

![简历发出去之前核对 6 件事：事实一致、数字有来源、不夸大技能、个人信息、关键词、语气](seed:g1067-resume-check.png)
*图：本站根据 [OpenAI Academy：Writing with ChatGPT](https://openai.com/academy/writing/) 整理的示意图*

- **事实**：公司、职位、时间和数字，逐项和自己的记录对一遍；
- **夸大**：不要因为 ChatGPT 写得漂亮就保留你做不到的描述，面试会追问；
- **关键词**：招聘信息里的关键词，只有你确实具备时才放进去；
- **文风**：通读一遍，改成你自己会说的话。官方写作指南建议给出具体反馈，例如「把这一段缩短 25%」比「写得更好」更有效；
- **AI 检测**：有些人担心被判定为 AI 写的，见 [/guides/chatgpt-writing-detected-ai-detector](/guides/chatgpt-writing-detected-ai-detector)。

## 常见问题

**Q：ChatGPT 能直接帮我写一份完整简历吗？**
可以起草，但它只知道你告诉它的信息。官方建议提供起点（哪怕是粗稿）、写明限制，并把输出当草稿。

**Q：它会不会自己编数字？**
有可能。所以每条指令里都要写「不要新增数字，缺的标出来」，并在最后自己核对。

**Q：简历要不要上传原文件？**
上传有助于它参考你原有的结构，但请先删掉敏感信息；也可以只粘贴文字。

**Q：英文简历呢？**
同样的指令可以直接用英文，或者要求「先给中文说明，再给英文版」。翻译相关见 [/guides/chatgpt-translation](/guides/chatgpt-translation)。

**Q：用免费版够吗？**
改写简历的文字量不大，免费版通常够用；需要上传大量文件或做更深的分析时，额度限制才会出现，见 [/guides/chatgpt-usage-limits-check-reset](/guides/chatgpt-usage-limits-check-reset)。

## 参考资料

- OpenAI Academy：Prompting — https://openai.com/academy/prompting/
- OpenAI Academy：Writing with ChatGPT — https://openai.com/academy/writing/
- ChatGPT 学生用例页 — https://chatgpt.com/use-cases/students/
- OpenAI 帮助中心：File uploads FAQ — https://help.openai.com/en/articles/8555545-file-uploads-faq
- OpenAI 帮助中心：Using projects in ChatGPT — https://help.openai.com/en/articles/10169521-using-projects-in-chatgpt
