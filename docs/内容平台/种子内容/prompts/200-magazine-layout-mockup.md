---
title: nano banana 杂志排版提示词：把一篇文章原样排成摆在桌上的杂志内页照片
slug: magazine-layout-mockup
model: nano-banana
topics: [poster, photography]
modelLabel: Nano Banana Pro
needsRefImage: false
aspectRatio: "4:3"
useCase: 公众号文章、个人博客、访谈稿想做一张"被杂志刊登"效果的封面或宣传图，把正文粘进去，生成一张摆在桌上的光面杂志内页照片，带配图、标题和引语排版。
prompt: |
  把下面这篇文章一字不改地排进一本光面杂志的跨页里，并拍成一张杂志摊开放在[木质书桌]上的照片。
  排版要求：
  - 漂亮的版式设计：醒目的大标题、作者署名、分栏正文；
  - 至少一处放大的引语（pull quote），以及大胆的排版处理（首字下沉、超大字号、色块）；
  - 配 2～3 张与文章内容相关的照片；
  - 杂志纸张有光泽和轻微弯曲，桌面上有[一杯咖啡和一支钢笔]，自然窗光。
  文章正文如下：
  [在这里粘贴文章全文]
negativePrompt: null
source:
  repo: ZeroLu/awesome-nanobanana-pro
  url: https://x.com/fofrAI/status/1991530971800182929
  author: "@fofrAI"
  license: MIT
  licenseUrl: https://raw.githubusercontent.com/ZeroLu/awesome-nanobanana-pro/main/LICENSE
  changes: 译成中文；把原文"照片、漂亮的排版、引语、大胆的格式"拆成具体排版清单；新增桌面与道具变量
imageBrief: 用本站一篇自己的教程（约 800 字）生成 1 张中文杂志内页照片，另用其英文摘要生成 1 张作对比（仓库示例图单张超过 1.2MB，未下载）。
images:
  - 200-magazine-layout-mockup-1.jpg
imageCredit:
  by: "@fofrAI"
  url: https://x.com/fofrAI/status/1991530971800182929
  license: MIT
verify:
  - 实测 Nano Banana Pro 能完整排进多少字的中文正文、错字率如何
  - 确认原帖仍可访问、作者未另行声明保留权利
---
**怎么用**：把文章正文粘到最后一行的方括号位置。原作者的关键词是 verbatim（逐字照搬），意思是要求模型**不要改写、不要删减**。这条提示词能出圈，正是因为 Nano Banana Pro 的长文本排版能力比上一代强很多。

**常见问题**：
- 文字太长排不下：Pro 版能排几百字的短文，超过 1000 字时会被截断或出现错字。建议只放导语 + 精选段落，或者把"跨页"改成"三联页"。
- 中文错字：标题和引语最显眼，出图后先检查这两处；正文小字作为"氛围"即可，正式发布请提供可复制的原文链接。
- 风格：可以指定杂志调性，例如"像科技商业杂志""像时尚杂志""像独立文艺刊物"。

**适合**：文章宣传图、作者作品集、访谈 / 报道的社媒预告。只排版你自己有权发布的文章。

### 英文原版

```
Put this whole text, verbatim, into a photo of a glossy magazine article on a desk, with photos, beautiful typography design, pull quotes and brave formatting. The text: [...the unformatted article]
```

> 改编自 [@fofrAI](https://x.com/fofrAI/status/1991530971800182929) 发布、[ZeroLu/awesome-nanobanana-pro](https://github.com/ZeroLu/awesome-nanobanana-pro) 收录的提示词，仓库许可证 MIT（Copyright (c) 2025 ZeroLu）。
