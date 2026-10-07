---
title: ChatGPT 读 PDF、总结长文档：上传、提问与核对原文的方法
slug: chatgpt-summarize-pdf
products: [chatgpt]
models: []
accountTier: FREE
excerpt: 怎么让 ChatGPT 读 PDF、总结论文、合同和长报告，而且总结得准？本文按官方帮助中心讲清它能读哪些文档、为什么扫描件读不出来、长文档怎么分步问，并附一套「先结构、再细节、最后核对」的提问模板。
checkedOn: 2026-10-07
sources:
  - https://help.openai.com/en/articles/8555545-file-uploads-faq
  - https://help.openai.com/en/articles/20001052-using-library-to-manage-files-in-chatgpt
  - https://help.openai.com/en/articles/8313428-does-chatgpt-tell-the-truth
  - https://help.openai.com/en/articles/6825453-chatgpt-release-notes
verify:
  - 「从文件库添加」「扫描」等中文菜单名以实际界面为准
  - Enterprise 的 PDF 视觉检索是否扩展到其他套餐，以帮助中心最新说明为准
---

> 本文根据 OpenAI 帮助中心《Uploading files and audio to ChatGPT》《Using Library to manage files》等文章和发布说明整理，资料核对于 2026-10-07。文中的提问模板为本站编写。上传失败的排查见 [/guides/chatgpt-file-upload-failed](/guides/chatgpt-file-upload-failed)。

## 适用于谁

- 想让 ChatGPT 快速读完一篇论文、一份合同、一本几十页的报告并总结要点的人；
- 总结出来的内容不准、漏重点，或者怀疑它「没看完」的人；
- 搜「ChatGPT 能读 PDF 吗」的人。

## 结论先说

1. **能读**：PDF、DOCX、TXT、PPTX、XLSX/CSV 等都支持，Free 也能上传（有次数限制）。Google 文档要先导出成 PDF 或 DOCX 再传。
2. **只读得到「文字层」**：除 Enterprise 的 PDF 视觉检索外，其他套餐读 PDF 时提取的是文档里的数字文字，**不看嵌入的图片**。扫描件、拍照转的 PDF 往往读不准——先确认 PDF 能不能选中复制文字。
3. **长文档分步问更准**：先让它给结构和目录，再逐章深入，最后要求标注出处页码、自己抽查原文。
4. **AI 总结会出错**：官方明确说 ChatGPT 可能给出看似可信但错误的内容。数字、条款、引用一定回原文核对。
5. **传一次，反复用**：上传过的文件会保存在**文件库（Library）**，下次用 **+ → 从文件库添加**，不必再传。

## 步骤

### 1. 准备文件

- **检查文字层**：在电脑上打开 PDF，试着选中一段文字复制。复制不了，就是图片型 PDF，ChatGPT 很可能只能读到零星内容。可以先用你手头的软件做 OCR 转成文字版，或者把关键页截图单独发（图片会按图片识别）。
- **控制大小**：单个文档最大 512 MB，文本类文件每个最多 200 万 token。超长的书或报告，可以按章节拆开。
- **手机扫描**：iOS 版 ChatGPT 相机里的 **Scan（扫描）**（2026 年 10 月起逐步推出）可以连拍多页纸质文档，自动合成一个 PDF 再上传。

### 2. 上传并说明背景

点输入框的 **+** 添加文件，或直接拖进对话框。上传时一起说清楚：**这是什么文件、你是谁、你要拿总结做什么**。同一份文件，给老板看的总结和准备考试的总结完全不同。

### 3. 先要结构，再要细节

不要一上来就说「总结一下」。推荐分三步：

**第一步：摸清结构**

```
这是一份 [某公司 2025 年年报]。请先列出它的章节结构（带页码），并用一句话说明每章讲什么。暂时不要总结细节。
```

**第二步：按需深入**

```
请重点总结第 3 章「经营情况讨论」：列出 5 个最重要的结论，每个结论后面注明出自第几页，并引用原文中的关键一句。
```

**第三步：针对性提问**

```
文中提到的「毛利率下降」，原因是什么？如果文件里没有明确写原因，请直接说没有，不要推测。
```

官方帮助中心列举的用法也包括：把研究论文用更浅显的话总结、找出关于某个主题的所有引用、提取作者和创建日期等元数据、提取章节标题或列表、比较两份文档、把一份文档里的框架套用到另一份上。

### 4. 核对

- 让它给出**页码和原文引用**，挑几条回 PDF 里搜一下；
- 对关键数字说「请把这几个数字和原文逐一核对」；
- 问一句「有哪些重要内容你在总结里省略了？」，常能补出遗漏；
- 涉及法律、财务、医疗的文件，总结只能当阅读辅助，结论请找专业人士确认。

## 不同文件的提问思路

| 文件类型 | 推荐问法 |
| --- | --- |
| 学术论文 | 「用 300 字说明研究问题、方法、主要发现和局限；再列出 3 个我可以追问作者的问题」 |
| 合同 | 「列出付款、违约、解约、保密条款的要点和所在条款号，标出对乙方不利的地方」 |
| 行业报告 | 「提取所有数据点，做成表格：指标 / 数值 / 时间 / 页码」 |
| 会议纪要 | 「列出决定事项、待办（负责人、截止时间）和未解决的问题」 |
| 两份版本对比 | 「对比这两份文件，列出新增、删除和修改的条款」 |

## 常见问题

**Q：为什么总结里漏了文件后半部分？**
文件太长或结构太乱时，分析可能不完整。按章节拆开上传，或者明确指定「请总结第 20–35 页」。2026 年 8 月官方也改进了 ChatGPT 对附件内容的利用，让总结、查找细节时更贴近原文，但仍建议分段核对。

**Q：PDF 里的图表它能看懂吗？**
大多数套餐用的是文字检索，会提取文字、丢弃嵌入图片，所以图表里的信息可能读不到。可以把图表截图单独上传，让它按图片识别。

**Q：免费版能传几个文件？**
帮助中心写明 Free 每天最多 3 次文件上传；所有用户每 3 小时最多 80 个文件，高峰期可能下调。

**Q：上传的文件会被拿去训练吗？**
个人套餐取决于数据控制里的「为所有人改进模型」开关；Enterprise、API 等企业产品默认不用于训练，见 [/guides/chatgpt-data-controls-privacy](/guides/chatgpt-data-controls-privacy)。

**Q：可以一次让它读好几个 PDF 吗？**
可以，网页版一条消息最多可附 20 个文件。多文件时最好给每个文件起个代号（「文件 A 是去年合同，文件 B 是今年合同」），再让它比较。经常用同一批资料的话，放进项目里更方便，见 [/guides/chatgpt-projects](/guides/chatgpt-projects)。

## 参考资料

- OpenAI 帮助中心：Uploading files and audio to ChatGPT — https://help.openai.com/en/articles/8555545-file-uploads-faq
- OpenAI 帮助中心：Using Library to manage files in ChatGPT — https://help.openai.com/en/articles/20001052-using-library-to-manage-files-in-chatgpt
- OpenAI 帮助中心：Does ChatGPT tell the truth? — https://help.openai.com/en/articles/8313428-does-chatgpt-tell-the-truth
- ChatGPT Release Notes（2026-02 单条消息 20 个文件、2026-08-07 附件理解改进、2026-10-01 相机扫描）— https://help.openai.com/en/articles/6825453-chatgpt-release-notes
