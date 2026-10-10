---
title: 长文档怎么问 AI：资料放前面、问题放最后、先引用再回答（官方长文本提示词技巧）
slug: long-document-prompting-tips
products: [claude, gemini]
models: []
accountTier: FREE
excerpt: 把几十页的报告、合同丢给 AI，为什么总是答得笼统或漏掉重点？本文整理 Anthropic、Google、OpenAI 官方文档里针对长文本的提示词建议：资料与问题的摆放顺序、多份文档怎么用标签区分、先摘录原文再作答，并给出可照抄的模板。
checkedOn: 2026-10-11
sources:
  - https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices
  - https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/reduce-hallucinations
  - https://ai.google.dev/gemini-api/docs/prompting-strategies
  - https://developers.openai.com/api/docs/guides/prompt-engineering
  - https://lmstudio.ai/docs/app/basics/rag
---

## 适用于谁

- 搜「长文本提示词」「长文本处理时提示词需注意什么」的人；
- 经常让 AI 读论文、财报、合同、会议记录，结果要么泛泛而谈、要么张冠李戴的人。

本文根据 Anthropic、Google、OpenAI 的官方提示词文档整理，资料核对于 2026-10-11。文中的写法在聊天界面和 API 里都适用。

## 结论先说

1. **长资料放在提示词的最前面，问题和要求放在最后**。Anthropic 和 Google 的文档给出了同样的建议。
2. **多份文档各自用标签包起来，并写上来源**，后面才能要求模型说明每句话出自哪里。
3. **先让模型摘录相关原文，再基于摘录作答**。这一步能让它聚焦在相关内容上，也方便你核对。
4. **明确允许它说「资料里没有」**，否则它倾向于补全一个看似合理的答案。
5. **资料超过上下文窗口时，换方法而不是硬塞**：分块处理、让工具做检索，或者只提供相关章节。

## 为什么顺序很重要

Anthropic 文档针对大文档或大量数据（官方给的量级是 2 万 token 以上）的第一条建议就是：把长文档和输入放在提示词靠上的位置，在问题、指令和示例之前。文档里注明，在测试中把问题放在末尾最多可以把回答质量提高 30%，在多文档的复杂输入上尤其明显。

Google 对 Gemini 3 的建议几乎一样：提供大量上下文（文档、代码）时，先给出全部上下文，把具体的指令或问题放在提示词的**最后**；并且在大段资料之后，用一句过渡语把资料和问题衔接起来，例如「基于以上信息……」。

OpenAI 的说法角度不同但方向一致：在它推荐的开发者消息结构里，上下文（Context）这一段通常放在靠后的位置，并用 XML 标签标明一段参考内容的起止。

换成聊天界面里的操作就是：**先上传或粘贴资料，最后再写问题**；不要先写一长串要求，再在末尾贴上几万字的原文。

## 步骤

### 1. 给每份资料贴上标签

Anthropic 推荐的多文档结构是：每份文档用 `<document>` 标签包住，里面再用子标签分别放来源和正文。

```xml
<documents>
  <document index="1">
    <source>2025年度报告.pdf</source>
    <document_content>
    ［粘贴年报正文］
    </document_content>
  </document>
  <document index="2">
    <source>竞品分析_Q2.xlsx</source>
    <document_content>
    ［粘贴竞品分析内容］
    </document_content>
  </document>
</documents>

基于以上两份资料，分析我们的战略优势，并给出第三季度的重点方向。
```

直接上传文件时不需要手动包标签，但在问题里仍然要**用文件名指代**，比如「《2025 年度报告》第三章和《竞品分析》的结论有没有矛盾」。

### 2. 先摘录，再回答

Anthropic 的建议：处理长文档任务时，先让模型把与任务相关的部分**逐字摘录**出来，再执行任务。这样它会聚焦在相关内容上，忽略文档的其余部分。官方在「减少幻觉」一文里把这一步的适用场景写得更具体：对于超过 2 万 token 的长文档，先提取原文引用再执行任务。

模板：

```
第一步：从上面的资料中，逐字摘录与「［你的问题］」直接相关的原文，
       放在 <quotes> 标签里并编号。找不到相关原文就写「未找到相关原文」。
第二步：只根据这些摘录回答问题，在每个结论后面标注所依据的摘录编号。
```

好处有两个：一是回答有据可查，你只需要核对摘录；二是当它写出「未找到相关原文」时，你就知道资料里确实没有，而不是得到一段编出来的内容。

### 3. 把问题问具体

长文档 + 模糊问题 = 泛泛的摘要。对比：

- 模糊：「总结一下这份报告。」
- 具体：「为没读过这份报告的销售总监写一页摘要：三句话说清结论；列出 5 个支撑数据并标页码；列出报告自己承认的局限。」

按 Anthropic 的通用原则，说清楚输出的格式和约束、读者是谁、用来做什么。顺序或完整性重要时，把要求写成编号步骤。

### 4. 分阶段提问

一份长文档通常值得问不止一次。常用的顺序：

1. **先要结构**：「列出这份文档的章节结构和每章的一句话概述，读不到的部分请说明。」用来确认它真的读到了全文；
2. **再按章节深入**：「第 4 章提出了哪几种方案？做成表格对比。」
3. **最后交叉核对**：「第 2 章的预测数据和附录 B 的原始数据是否一致？逐项列出。」

这也是 Google 文档里「拆分提示词」的做法：复杂任务拆成一连串步骤，前一步的输出作为后一步的输入。

### 5. 资料太长放不下怎么办

OpenAI 文档提醒，模型一次能处理的内容受上下文窗口限制，各模型的窗口大小不同，要查模型文档确认。放不下时：

- **只给相关章节**：自己先筛一遍，比把整本手册丢进去效果好；
- **分块处理再汇总**：Google 文档称之为聚合（对数据的不同部分分别处理，再把结果合并）；
- **用带检索的工具**：把资料放进知识库或文件检索功能里，每次只取出相关片段交给模型，也就是检索增强生成（RAG）。

用检索型工具时有一个窍门，出自 LM Studio 官方文档对文档问答的说明：问题里尽量带上你预期原文中会出现的术语和说法，命中正确片段的概率更高。

## 可照抄的模板

```
<documents>
  <document index="1">
    <source>［文件名或来源］</source>
    <document_content>
    ［资料全文］
    </document_content>
  </document>
</documents>

基于以上资料完成下面的任务。

任务：［具体要做什么，给谁看，用来干什么］

要求：
1. 先在 <quotes> 标签里逐字摘录与任务相关的原文并编号；
2. 再给出回答，每个结论后标注摘录编号；
3. 资料里没有涉及的内容，写「资料中未提及」，不要用常识补充；
4. 输出格式：［表格 / 要点列表 / 多少字以内］。
```

## 常见问题

**Q：聊天界面上传文件和粘贴文本，哪个好？**
能上传就上传，表格、图片和版式信息保留得更完整。但上传后要用第一问确认它读到了什么，扫描件和图片型 PDF 常常只识别出一部分。

**Q：对话越长，它是不是越容易忘记前面的资料？**
长对话确实会让早期内容的影响变弱，也可能触发上下文压缩。重要的任务，开一个新对话重新提供资料，比在一个很长的对话里反复追问更可靠。见站内《ChatGPT 上下文长度与字数限制》。

**Q：让它标页码，标出来的页码可信吗？**
不一定，页码是最容易出错的信息之一。要求它「逐字引用原文」比要求页码可靠，因为引文可以直接在原文里搜索验证。

**Q：这些建议对所有模型都适用吗？**
「资料在前、问题在后」和「用标签区分内容」在三家文档里都有体现，可以当作通用做法。具体效果仍然建议用你自己的资料试一次再定。

## 参考资料

- Anthropic 文档：Prompting best practices（Long context prompting）— https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices
- Anthropic 文档：Reduce hallucinations — https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/reduce-hallucinations
- Google 文档：Prompt design strategies — https://ai.google.dev/gemini-api/docs/prompting-strategies
- OpenAI 文档：Prompt engineering — https://developers.openai.com/api/docs/guides/prompt-engineering
- LM Studio 文档：Chat with Documents — https://lmstudio.ai/docs/app/basics/rag
