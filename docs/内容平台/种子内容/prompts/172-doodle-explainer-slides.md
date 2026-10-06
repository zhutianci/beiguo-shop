---
title: nano banana 科普漫画 PPT 提示词：用手绘涂鸦风一组图讲清一个概念
slug: doodle-explainer-slides
model: nano-banana
topics: [ppt, infographic, comic]
needsRefImage: false
aspectRatio: "16:9"
useCase: 老师备课、科普号做内容、给新人讲业务概念时，让 nano banana 生成一组风格统一的 16:9 手绘涂鸦卡片，像 PPT 一样一页讲一个点。
prompt: |
  请生成[4]张 16:9 的涂鸦风格图片，向[初中生]解释"[期货]"这个概念。
  每张图讲一个要点，顺序为：[是什么] → [生活中的例子] → [有什么用] → [有什么风险]。
  统一的视觉规范：
  - 彩色粗铅笔手绘风格，线条稚拙可爱，配简单的人物和图标；
  - 纯色背景，内容放在带描边的圆角卡片里；
  - 每张顶部有统一样式的大标题，正文用短句，信息量充足但不拥挤；
  - 文字使用[简体中文]，字迹清晰。
  所有图片风格、配色、标题样式保持一致，像同一套 PPT。
negativePrompt: null
source:
  repo: PicoTrex/Awesome-Nano-Banana-images
  url: https://x.com/op7418/status/1961811274683310110
  author: "@op7418"
  license: Apache-2.0
  licenseUrl: https://www.apache.org/licenses/LICENSE-2.0
  changes: 修正仓库中文版把 futures 误译为"未来"的问题（应为"期货"）；新增张数、受众、概念、每页要点、文字语言变量；整理成视觉规范清单
images:
  - 172-doodle-explainer-slides-1.jpg
imageCredit:
  by: "@op7418"
  url: https://github.com/PicoTrex/Awesome-Nano-Banana-images/tree/main/images/case76
  license: Apache-2.0
verify:
  - 实测 nano banana 能否在一次对话里连续输出多张风格一致的图
  - 检查中文标题和正文的错字率
  - 确认原帖仍可访问、作者未另行声明保留权利
---
**怎么用**：替换 [期货] 为任何想讲的概念（"复利""光合作用""API 是什么"），[初中生] 换成目标受众。示例图是原作者生成的英文版其中一页（"What are futures?"）。

**常见问题**：
- 一次只出了一张：在 Gemini 里继续说"继续生成第 2 张，保持完全相同的风格"；也可以每次只要一张，在提示词里写清"这是第 N 张，讲 XX"。
- 中文错字：标题和关键词尽量短；错字多时改用"中英双语，英文为主"，或出图后在 PPT 里覆盖文字。
- 风格不统一：把第一张满意的图重新上传，加一句"严格参照这张图的风格"。

**适合**：课件、科普图文、内部培训、小红书知识卡片。想把整篇文章变成 PPT，可以看 20 号"文章一键生成 PPT"。

### 英文原版

```
Help me generate multiple 16:9 doodle-style images to explain the concept of "futures" to middle school students. The images should have a consistent colorful, thick-pencil hand-drawn style, be rich in information, feature English text, use solid color backgrounds, have outlines around the cards, and include uniform titles, similar to a PowerPoint presentation.
```

> 改编自 [@op7418](https://x.com/op7418/status/1961811274683310110) 发布、[PicoTrex/Awesome-Nano-Banana-images](https://github.com/PicoTrex/Awesome-Nano-Banana-images) 收录的提示词，仓库许可证 Apache-2.0。
