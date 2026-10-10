---
title: NotebookLM 思维导图和报告怎么用：生成、下载、学习指南与数据表格
slug: notebooklm-mind-map-reports-data-table
products: [gemini]
models: [gemini-llm]
accountTier: FREE
excerpt: NotebookLM（现名 Gemini Notebook）怎么生成思维导图、报告和数据表格？本文按官方帮助讲清思维导图的生成、交互与下载，文档报告和互动式报告的区别，学习指南等模板，以及导出到 Google 文档和表格的方法。
checkedOn: 2026-10-10
sources:
  - https://support.google.com/notebooklm/answer/16212283?hl=en
  - https://support.google.com/notebooklm/answer/18323649?hl=en
  - https://support.google.com/notebooklm/answer/16206563?hl=en
  - https://support.google.com/notebooklm/answer/16296687?hl=en
  - https://support.google.com/notebooklm/answer/17670842?hl=en
  - https://blog.google/innovation-and-ai/models-and-research/google-labs/notebooklm-data-tables/
  - https://blog.google/innovation-and-ai/products/gemini-notebook/new-study-tools-september-2026/
verify:
  - 思维导图的入口：帮助中心写「在对话里点 Mind Map 标签（chip），生成后出现在 Studio 面板」，2026 年 3 月官方截图里 Studio 面板也有 Mind Map 按钮，以实际界面为准
  - 思维导图下载得到的文件格式，官方帮助未写明
  - 思维导图能否手动编辑节点、能否导出为第三方思维导图软件格式，官方帮助未提及
  - 互动式报告是 2026 年 9 月公布的新功能，官方博客用的是「将可以」的说法，你的账号可能还没推送到
  - 思维导图、报告的生成次数：个人账号按算力限额计算，官方未列个数
---

> 本文根据 Google 官方 Gemini Notebook（原 NotebookLM）帮助中心和 Google 官方博客整理，核对日期 2026-10-10。这三种成品都由 AI 根据你的来源生成，官方提醒可能有不准确之处，请自行核对。

## 适用于谁

- 资料太多、想先看清整体结构，搜「notebooklm 思维导图」的人；
- 想让它直接写出学习指南、简报、常见问题这类文档，搜「notebooklm 报告功能」「notebooklm 报告是什么」的人；
- 想把散落在多份资料里的信息整理成表格、再导出到 Google 表格的人。

## 结论先说

1. **思维导图（Mind Map）**把来源的主题和子主题画成可展开的分支图，点任意节点可以直接就这个主题提问，支持下载。
2. **报告（Reports）分两类**：文档报告（Document，纯文字的结构化文档）和互动式报告（Interactive，把摘要和信息图、测验、抽认卡等编排在一起）。
3. **报告模板**包括常见问题解答（FAQ）、学习指南（Study guide）、简报文档（Briefing document）、AI 建议的类型，也可以自己描述。
4. **能导出**：报告可以导出到 Google 文档；数据表格可以导出到 Google 表格，引用会单独放在第二个标签页。
5. **手机 App 目前不能生成**笔记、思维导图、报告和数据表格，这几样要在电脑上做。

## 一、思维导图

### 适合什么时候用

帮助中心列了四种场景：快速了解全貌和主线；进入一个新领域时先找到切入点；发现不同观点之间不太明显的关联；整理思路，帮助理解和记忆。

### 怎么生成

1. 打开已有笔记本，或新建并上传来源；
2. 在对话区域点「思维导图（Mind Map）」；
3. 生成后，它会作为一个条目出现在 Studio 面板里，随时可以再打开；
4. 想重新生成：在该条目的「更多」菜单里删除它，然后重新点一次。

### 怎么用

- **缩放和拖动**：在不同区域之间移动，聚焦某一块；
- **展开或收起分支**：展开看细分主题，收起看大结构；
- **点节点提问**：直接点某个节点，对话区会针对这个主题向来源提问——这是思维导图最实用的地方，相当于一张「可以点的目录」；
- 右上角还有全屏、下载和关闭按钮。

### 保存和分享

- 把整个笔记本分享给对方，对方在 Studio 面板里能打开同一张思维导图；
- 或者在思维导图窗口里点「下载」，把文件发给别人。

注意：来源里有 Play 图书电子书时，受出版方限制，可能无法下载。

## 二、报告

### 文档报告

1. 打开 notebook.google.com，进入一个你有编辑权限的笔记本；
2. 在 Studio 面板选「报告（Reports）→ 文档（Document）」；
3. 选一个模板或它建议的格式，用默认设置直接生成。

模板包括：常见问题解答、学习指南、简报文档，以及它根据你的来源建议的报告类型；也可以选「自己创建」，描述你要的结构和侧重点。

**导出**：点报告旁边的三点菜单，选「导出到 Google 文档（Export to Docs）」。如果报告里有表格，选「导出到 Google 表格（Export to Sheets）」时，每个表格会放进各自的标签页。

官方提示：导出后的文档和表格是独立文件，之后的修改不会同步回笔记本，笔记本的分享权限也不会带过去。

### 互动式报告

![2026 年 9 月官方博客视频封面截取：「Create report」对话框里的「Learning Overview」模板，说明是「创建一份总结关键信息并包含 Studio 内容的互动式概览」，下方可选语言、填写描述，并有「Generate later」和「Generate」按钮](seed:g434-interactive-report-dialog.jpg)
*图片来源：[Google 官方博客《Sharpen your study routine with new Gemini Notebook tools》](https://blog.google/innovation-and-ai/products/gemini-notebook/new-study-tools-september-2026/)（视频封面帧，已裁去界面右上角的示意头像）*

互动式报告是 2026 年 9 月官方公布的新形式，目前的模板叫「学习概览（Learning Overview）」：它把摘要和 Studio 里的成品（信息图、测验、抽认卡等）编排在同一份报告里。

1. 在 Studio 面板选「报告 → 互动式（Interactive）」；
2. 在「模板」下选「Learning Overview」，用默认设置生成；
3. 在生成的报告里，对它建议嵌入的成品点「添加（Add）」；这些成品同时也会出现在 Studio 面板里。

官方限制：**只在网页版提供**；互动式报告里的部分内容需要年满 18 岁才能访问；生成报告和其中的成品可能需要一些时间。

### 自定义生成设置（仅网页版）

在模板或建议格式的名称旁点「编辑」图标，修改语言、描述等设置，然后选「立即生成（Generate now）」或「稍后生成（Generate later）」。后者适合用量不够的时候，系统会在之后自动生成。

### 分享报告

在 Studio 面板打开报告，点「分享 → 复制报告链接（Copy link to Report）」。前提是笔记本已经分享给对方，或设为「知道链接的任何人」，并且对方能访问完整笔记本。

## 三、数据表格

![2025 年 12 月官方博客配图：「Customize Data Table」面板，可选语言并描述想要的表格，例如指定列名「标题、作者、关键结论」](seed:g434-data-table-customize.jpg)
*图片来源：[Google 官方博客《Organize your insights with Data Tables in NotebookLM》](https://blog.google/innovation-and-ai/models-and-research/google-labs/notebooklm-data-tables/)*

数据表格（Data Table）把来源里分散的信息整理成结构化的表。官方博客举的用法有：把会议记录整理成按负责人和优先级分类的待办表；汇总多篇论文的研究年份、样本量和统计结果；按日期、人物、影响整理历史事件用于备考；比较几个旅行目的地的最佳季节和预估花费。

- **生成**：在 Studio 面板点「数据表格」直接生成；
- **自定义**：点铅笔图标，选语言，并在提示框里描述你要的**行和列**——官方建议描述得越具体，表格越聚焦；
- **导出**：三点菜单里选「导出到 Google 表格」，表格内容在新表格的第一个标签页，**所有引用在第二个标签页**。

![官方博客配图：生成的数据表格示例，最右一列「Source」是每一行对应的来源编号](seed:g434-data-table-output.jpg)
*图片来源：[Google 官方博客《Organize your insights with Data Tables in NotebookLM》](https://blog.google/innovation-and-ai/models-and-research/google-labs/notebooklm-data-tables/)*

一个可以直接套用的描述：

```
把这些论文整理成一张表，列为：标题、作者、发表年份、样本量、主要结论、局限性。
每篇论文一行，结论控制在两句话以内。
```

## 常见问题

**Q：思维导图里的内容不对怎么办？**
官方提醒它可能不准确。可以点节点追问、对照引用核实；也可以调整勾选的来源后删除重生成，或在思维导图窗口里用点赞 / 点踩提交反馈。

**Q：学习指南在哪里？**
在「报告 → 文档」的模板里选「学习指南（Study guide）」。想要抽认卡和测验这类可以练习的形式，见本站《NotebookLM 学习卡是什么》。

**Q：只有查看权限能生成报告吗？**
帮助中心的步骤写的是打开「你有编辑权限」的笔记本。查看者可以看到所有者或编辑者已经生成的成品。

**Q：怎么知道一份成品是用什么提示生成的？**
Studio 面板里该成品的三点菜单有「查看自定义提示（View custom prompt）」，报告、音频概览、视频概览、抽认卡、测验都支持。

**Q：生成次数有限制吗？**
有。帮助中心在思维导图一文里写明「生成思维导图受用量限额约束」。个人账号现在按算力计算用量，具体见本站《NotebookLM 免费版限制有哪些》。

## 参考资料

- Use Mind Maps in Gemini Notebook（帮助中心）：https://support.google.com/notebooklm/answer/16212283?hl=en
- Generate reports in Gemini Notebook（帮助中心）：https://support.google.com/notebooklm/answer/18323649?hl=en
- Create a notebook in Gemini Notebook（帮助中心，报告模板与数据表格导出）：https://support.google.com/notebooklm/answer/16206563?hl=en
- Get started with the Gemini Notebook mobile app（帮助中心）：https://support.google.com/notebooklm/answer/16296687?hl=en
- Manage your Gemini Notebook usage limits（帮助中心）：https://support.google.com/notebooklm/answer/17670842?hl=en
- Google 官方博客：Organize your insights with Data Tables in NotebookLM（2025-12-18）：https://blog.google/innovation-and-ai/models-and-research/google-labs/notebooklm-data-tables/
- Google 官方博客：Sharpen your study routine with new Gemini Notebook tools（2026-09-15）：https://blog.google/innovation-and-ai/products/gemini-notebook/new-study-tools-september-2026/
