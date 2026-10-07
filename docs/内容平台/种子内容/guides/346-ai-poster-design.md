---
title: AI海报制作教程：从需求、版式到文字排版的完整流程与提示词
slug: ai-poster-design
products: [chatgpt, gemini]
models: [gpt-image-2, nano-banana]
accountTier: FREE
excerpt: 用 ChatGPT 或 Gemini 做海报，怎么一次就接近能用？本文按 OpenAI、Google 官方提示指南，拆解「写需求 → 定版式 → 处理文字 → 迭代 → 导出印刷」五步，给出活动海报、促销海报、信息海报三类模板和常见翻车的修法。
checkedOn: 2026-10-07
sources:
  - https://developers.openai.com/api/docs/guides/image-prompting
  - https://help.openai.com/en/articles/11084440-images-in-chatgpt
  - https://ai.google.dev/gemini-api/docs/image-generation
  - https://support.google.com/gemini/answer/14286560?hl=en
  - https://www.samr.gov.cn:8085/zw/zfxxgk/fdzdgknr/fgs/art/2023/art_5474cf75173c45d6a0379730fb4e8d97.html
---

## 适用于谁

- 搜「AI海报制作教学」「AI海报指令」「AI海报提示词」的人；
- 需要经常做活动海报、促销图、公众号头图，但不会 PS 的运营、店主、老师；
- 用 AI 做过海报，但总是文字错、版式乱、风格不统一的人。

本文根据 OpenAI 官方图像提示指南与帮助中心、Google Gemini 图像生成文档整理，资料核对于 2026-10-07。

## 结论先说

1. **先写需求，再写画面**：OpenAI 帮助中心的建议很直接——做海报时，**说明它是做什么用的，以及要包含哪些文字**。
2. **文字是最大难点**：标题短、文字放引号、写明位置和字体、要求不要多余文字；正式物料的小字建议后期排版。
3. **版式要说出来**：标题在哪、主体在哪、留白在哪，AI 不会自动替你做「设计决策」。
4. **一次只改一处**：版面基本满意后，用局部修改调字、调色，而不是整张重画。

## 第 1 步：写一份「设计需求」

把下面几项想清楚，直接写进提示词：

| 项目 | 例子 |
| --- | --- |
| 用途与场景 | 社区咖啡店周末市集活动，张贴在门口 + 发朋友圈 |
| 尺寸比例 | 竖版 3:4（朋友圈）/ 9:16（手机海报）/ A4 竖版（打印） |
| 文字内容 | 主标题、副标题、时间地点、二维码留位 |
| 风格 | 手绘插画 / 扁平几何 / 摄影合成 / 复古印刷 |
| 配色 | 品牌色或 2～3 种主色 |
| 必须避免 | 不要多余文字、水印、无关 logo |

OpenAI 官方提示指南把这称为「定义成品」：说清主体和用途、构图、画幅和关键元素的位置，复杂需求可以按「场景 / 主体 / 细节 / 约束」分段写。

## 第 2 步：套模板生成初稿

**活动海报**

```
做一张竖版活动海报，比例 3:4，用于[用途]。
版式：上方三分之一放主标题"[主标题]"（粗体、[颜色]），中间是[主视觉描述]，
底部一行小字"[时间 · 地点]"，右下角留出一块空白方形区域用于放二维码。
风格：[风格]，配色[主色]，干净留白。画面里只出现上述文字，不要其他文字、水印或 logo。
```

**促销海报**

```
为[店铺/品牌]做一张促销海报，16:9 横版，用于店铺首页横幅。
左侧放商品[商品描述]，右侧大字"[促销语]"，下方小字"[活动时间]"。
风格：明亮、干净的电商风，[主色]为主色。文字清晰易读，只出现这两段文字。
```

**信息海报 / 科普海报**

```
做一张竖版科普海报，标题"[标题]"，面向[受众]。
用 3～4 个带图标的模块分别说明：[要点1]、[要点2]、[要点3]，每个模块一句短说明。
扁平插画风格，白色背景，配色[颜色]，排版整齐、留白充足，避免小字和多余装饰。
```

![OpenAI 官方示例：按「教学讲义」需求写的科普海报——标题、三个分区模块、箭头和总方程式，文字清晰（英文）](seed:g346-gpt-edu-poster.jpg)
*图片来源：[OpenAI API 文档 · Image prompting](https://developers.openai.com/api/docs/guides/image-prompting)*

Google 官方在「留白构图」模板里也建议：需要后期叠加文字的背景图，可以明确要求主体放在画面一角、其余为大面积空白。

## 第 3 步：处理文字

- 标题控制在一个短语，副标题一行；
- 所有文字放在引号里，写清位置、字体风格、颜色；
- 文字多的海报，在 ChatGPT 里可以用带思考生图（Plus），在 Gemini 里付费用户可以「Redo with Pro」，官方都说明对文字和信息图更好；
- 小字、价格、日期等关键信息，**建议后期在设计工具里用真实字体排版**，保证 100% 准确。

文字出错的详细修法见《ChatGPT 生成图片中文乱码怎么办》。

## 第 4 步：迭代

- 版式不满意：「保持风格和配色不变，把主标题移到画面上方居中，主视觉缩小一些」；
- 局部问题：在 ChatGPT 编辑器里框选区域，「只把这里的字改成『周六见』，其他不变」；
- 风格统一：做系列海报时，把第一张满意的海报作为参考图上传，写「沿用这张海报的版式、字体风格和配色，换成新的主题『xxx』」。

OpenAI 官方的迭代原则：把上一张结果作为下一次输入，一次只提一个修改，并重复强调要保留的部分。

## 第 5 步：导出与印刷

- 线上使用：下载原图即可；Gemini 订阅用户可下载 2K、免费用户 1K（官方帮助中心）。
- 打印：AI 图的分辨率通常不够大幅印刷，A4 以上建议用更高分辨率输出（如 API 的 2K / 4K），或请设计师按 AI 稿重做矢量版本（分辨率说明见《AI图片放大与高清修复》）。
- 二维码不要让 AI 画——AI 画的二维码扫不出来，留出空白位置后期贴上真实二维码。

## 合规提醒

- 不要在海报中使用他人的商标、明星照片或知名 IP 角色；
- 促销信息要真实，《广告法》规定广告不得含有虚假或引人误解的内容；
- 在国内平台发布时，按平台要求标注 AI 生成内容（见《AI生成图片有版权吗、能商用吗》）。

## 常见问题

**Q：ChatGPT 和 Gemini 做海报哪个好？**
官方没有可比较的数据。两者都支持图中文字和多轮修改；文字多、信息密集的海报可以分别试 ChatGPT 的带思考生图和 Gemini 的 Pro 重做，选更准的那张。

**Q：AI 海报的字体可以商用吗？**
AI 渲染的字形可能模仿某种字体，但不附带字体授权。正式商用物料建议用有授权的字体重新排版。

**Q：可以批量做一套风格统一的海报吗？**
可以：定好一张「母版」后，每次上传母版作为风格参考，只替换主题和文字。

## 参考资料

- OpenAI API 文档：Image prompting — https://developers.openai.com/api/docs/guides/image-prompting
- OpenAI 帮助中心：Images in ChatGPT — https://help.openai.com/en/articles/11084440-images-in-chatgpt
- Google AI for Developers：Image generation（Minimalist & negative space design、Accurate text in images）— https://ai.google.dev/gemini-api/docs/image-generation
- Gemini Apps Help：Generate & edit images with Gemini Apps — https://support.google.com/gemini/answer/14286560?hl=en
- 国家市场监督管理总局：《中华人民共和国广告法》— https://www.samr.gov.cn:8085/zw/zfxxgk/fdzdgknr/fgs/art/2023/art_5474cf75173c45d6a0379730fb4e8d97.html
