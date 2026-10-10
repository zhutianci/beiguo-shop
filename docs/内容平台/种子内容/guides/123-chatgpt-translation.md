---
title: ChatGPT 翻译怎么用：整篇文档翻译、翻译指令与术语表
slug: chatgpt-translation
products: [chatgpt]
models: []
accountTier: FREE
excerpt: 用 ChatGPT 翻译比普通机翻好在能按语境、风格和术语调整，但也会漏译和自作主张。本文整理文档翻译的上传与分段方法、可复制的翻译指令、术语表用法、校对技巧，以及语音口译和发音帮助的用法，所有功能说明以 OpenAI 官方文档为准。
checkedOn: 2026-10-07
sources:
  - https://help.openai.com/en/articles/9260256-chatgpt-capabilities-overview
  - https://help.openai.com/en/articles/8555545-file-uploads-faq
  - https://help.openai.com/en/articles/6742369-how-do-i-use-the-openai-api-with-text-in-different-languages
  - https://help.openai.com/en/articles/8357869-how-to-change-your-language-setting-in-chatgpt
  - https://help.openai.com/en/articles/6825453-chatgpt-release-notes
verify:
  - 语音实时互译：2024 年发布说明写语音模式可以连续双向翻译，2026 年 GPT-Live 的语音帮助文章未单独提到翻译，上线前在实际语音模式里确认
  - 生成翻译后的 Word 文件下载：取决于套餐和所用模式（Work 等），以实际为准
---

> 本文依据 OpenAI 帮助中心（Capabilities overview、Uploading files、多语言使用建议）和发布说明整理功能事实，资料核对于 2026-10-07；翻译工作流和提示词为本站编写。

## 适用于谁

- 需要翻译邮件、合同、论文摘要、产品说明，觉得普通机翻生硬的人；
- 要翻译整份 PDF 或 Word，不知道怎么传、怎么保证不漏的人；
- 想找一套好用的「ChatGPT 翻译指令」的人。

## 结论先说

1. **翻译是 ChatGPT 的官方基础能力之一**，所有套餐都能用。它的优势是能按你的要求调整语气、风格和术语，而不只是逐字转换。
2. **短文本直接粘贴，长文档上传文件**：支持 PDF、DOCX、TXT、PPTX、XLSX 等。超过 1 万字符的粘贴内容会被自动转成附件。
3. **好译文靠指令**：说清目标读者、用途、语气、格式要求，再附上**术语表**，效果差别很大。
4. **长文档一定分段**：一次翻译太长容易漏句、跳段。按章节或每 1500–2000 字一段进行，最后再统一术语。
5. **重要文件要人工校对**：合同、医疗、法律等内容，ChatGPT 的译文只能当初稿。

## 步骤

### 1. 短文本：一条好指令就够

```
请把下面的中文翻译成英文。
用途：发给美国客户的商务邮件。
要求：语气礼貌但直接，句子简洁；保留原文的段落和编号；人名、产品型号不翻译；
如果原文有歧义，在译文后用中文列出你的理解。
原文：
[粘贴内容]
```

几个实用的追加要求：

- **「先直译，再给一个更地道的意译版本」**——适合拿不准语气的时候；
- **「用表格输出：原文 / 译文 / 备注」**——方便逐句校对；
- **「翻译成简体中文，适合中国大陆读者，不要用台湾用语」**——避免用词地域混杂。

### 2. 整篇文档：上传 + 分段

1. 点 **+** 上传 PDF / Word（Google 文档要先导出为 PDF 或 DOCX）；
2. 先让它确认读到了什么：

```
请先列出这份文件的章节结构和总字数估计，不要翻译。
```

3. 再分段翻译：

```
请翻译第 1 章（到「2. 背景」之前为止）。逐段翻译，不要省略、不要总结；每段译文前标注原文段落序号。
```

4. 每段完成后接着说「继续翻译第 2 章」。

扫描版 PDF 读不出文字时，翻译会出现大量缺漏，先转成可复制文字的版本，见 [/guides/chatgpt-summarize-pdf](/guides/chatgpt-summarize-pdf)。

### 3. 用术语表保持一致

专业文档最怕同一个术语前后译法不同。先建一个术语表：

```
下面是本项目的术语表，翻译时必须严格使用：
- Service Level Agreement → 服务等级协议（SLA）
- Uptime → 可用性
- Incident → 故障事件
- Customer → 客户（不要译为「顾客」）
后续所有翻译都按此表执行；遇到表里没有的专业词，在译文后列出你的译法供我确认。
```

经常翻译同一类材料的话，可以把术语表和风格要求放进一个**项目（Projects）**的说明里，或者写进自定义指令，省得每次重复（见 [/guides/chatgpt-projects](/guides/chatgpt-projects)、[/guides/chatgpt-custom-instructions](/guides/chatgpt-custom-instructions)）。

### 4. 校对

- 让它**回译**：「把你的英文译文再翻回中文，和原文对比，列出意思有偏差的地方」；
- 检查数字、日期、金额、单位是否原样保留；
- 问它「哪些句子你不确定」，往往能定位到真正的难点；
- 最后通读一遍，看是否有它自己「补充」的内容——ChatGPT 有时会顺手润色或加解释，正式文件里要删掉。

## 其他翻译场景

| 场景 | 用法 |
| --- | --- |
| 拍照翻译（菜单、路牌、说明书） | 拍照上传后说「把图片里的文字翻成中文，保持原排版顺序」 |
| 表格翻译 | 上传 Excel，说「只翻译 B 列和 D 列，其他列保持不变，输出为新表格」 |
| 字幕 / 口语稿 | 「翻译成口语化中文，每行不超过 18 个字」 |
| 学外语 | 「先给译文，再解释 3 个最值得学的表达」 |
| 发音 | 2026 年起问「这个词怎么读」，ChatGPT 可以给出音频和文字形式的发音说明（官方称支持 60 多种语言），点一下就能听 |

**语音口译**：在语音对话里可以请 ChatGPT 帮你在两种语言之间来回翻译，比如和外国同事交流时让它把你的中文译成英文、把对方的英文译回中文。语音功能说明见 [/guides/chatgpt-voice-mode](/guides/chatgpt-voice-mode)。

## 常见问题

**Q：ChatGPT 翻译和普通机器翻译哪个准？**
官方没有给出对比数据。实际选择建议：要求「快、字面准确」的短句，两者差别不大；需要按语境、受众、品牌语气调整的内容，ChatGPT 通过指令可控性更强，但更需要校对。

**Q：为什么翻着翻着变成总结了？**
长文本容易被压缩。明确写「逐段翻译、不要省略、不要总结」，并缩短每次翻译的篇幅。

**Q：中英混杂的提示会影响翻译吗？**
OpenAI 在多语言建议里提到，尽量让整段提示保持同一种语言，模型的回答会更一致。翻译时可以把「指令」和「原文」分开写清楚。

**Q：界面语言和翻译有关系吗？**
没关系。界面语言只影响菜单显示，设置方法见 [/guides/chatgpt-language-settings](/guides/chatgpt-language-settings)。

**Q：机密文件可以拿去翻译吗？**
个人套餐的内容可能被用于训练（可以关闭），公司机密请先确认单位规定，或使用默认不训练的 Business / Enterprise，见 [/guides/chatgpt-data-controls-privacy](/guides/chatgpt-data-controls-privacy)。

## 参考资料

- OpenAI 帮助中心：ChatGPT Capabilities Overview — https://help.openai.com/en/articles/9260256-chatgpt-capabilities-overview
- OpenAI 帮助中心：Uploading files and audio to ChatGPT — https://help.openai.com/en/articles/8555545-file-uploads-faq
- OpenAI 帮助中心：How can I use the OpenAI API with text in different languages? — https://help.openai.com/en/articles/6742369-how-do-i-use-the-openai-api-with-text-in-different-languages
- OpenAI 帮助中心：How to change your language setting in ChatGPT — https://help.openai.com/en/articles/8357869-how-to-change-your-language-setting-in-chatgpt
- ChatGPT Release Notes（大段粘贴自动转附件、2026-06-18 发音帮助、2026-08-31 发音改进）— https://help.openai.com/en/articles/6825453-chatgpt-release-notes
