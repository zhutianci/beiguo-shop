---
slug: nano-banana
name: Nano Banana
kind: MODEL
updated: 2026-10-06
sources:
  - https://blog.google/products/gemini/updated-image-editing-model/
  - https://blog.google/innovation-and-ai/technology/ai/nano-banana-2/
  - https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-omni-flash-nano-banana-2-lite/
  - https://deepmind.google/models/gemini-image/
  - https://ai.google.dev/gemini-api/docs/image-generation
  - https://gemini.google/subscriptions/
  - https://support.google.com/gemini/answer/16275805?hl=en
verify:
  - Free 与各档订阅每天能生成几张：Google 帮助中心只说「生图更消耗额度、每 5 小时刷新、有周上限」，没给数字，需实测
  - 「Pro / Ultra 订阅可在三点菜单用 Nano Banana Pro 重新生成」出自 2026-02-26 官方博客，之后是否调整需在 Gemini App 里实际看一下
  - 参考图数量：API 文档写 Nano Banana 2 最多 14 张参考图，但分项（物体 10 / 人物 4 / 风格 3）相加不等于 14，以文档原文为准
  - Gemini App 中文界面里生图入口的名称（如「制作图片」）和位置，配截图
---
## Nano Banana 是什么

Nano Banana 是 Google Gemini 图像模型的昵称，现在已经是一个系列：

| 昵称 | 正式名称 | 发布时间 |
|---|---|---|
| Nano Banana | Gemini 2.5 Flash Image | 2025-08 |
| Nano Banana Pro | Gemini 3 Pro Image | 2025-11 |
| Nano Banana 2 | Gemini 3.1 Flash Image | 2026-02-26 |
| Nano Banana 2 Lite | Gemini 3.1 Flash Lite Image | 2026-06-30 |

按官方博客，Nano Banana 2 已成为 Gemini App 各模式下的默认生图模型；Google AI Pro 和 Ultra 订阅用户还可以在图片的三点菜单里选择用 Nano Banana Pro 重新生成。

## 能做什么

它最擅长的是「改图」和「保持一致」：上传几张参考图，就能把人物、商品、风格合到一张新图里，同时尽量保持人物长相不变。Nano Banana 2 支持从 512px 到 4K 的分辨率，画幅可选 1:1、3:4、9:16、16:9、21:9 等。手办图、换装、多图合成这些常见玩法，大多可以用它来做。生成的图片都带 SynthID 隐形水印。

## 怎么用

- **Gemini App**：网页 gemini.google.com 或手机 App，直接描述要画的内容，也可以先上传图片再说怎么改
- **Google 搜索、Google Flow** 等产品里也接入了 Nano Banana
- **开发者**：在 Google AI Studio 或 Gemini API 中调用，模型名见上表

## 免费与付费的区别

按 Gemini 官方订阅页：免费版就能生图和改图；Google AI Plus、Pro、Ultra 的整体用量分别更高（Plus 是免费版的 2 倍，Pro 是 4 倍）。额度每 5 小时刷新一次，另有每周上限；生图比文字对话更消耗额度。每天具体能生成几张，官方没有给出数字。

## 本页的提示词怎么用

大部分条目需要上传参考图，单条里会写清楚要传几张、每张起什么作用（比如「图 1 是人物，图 2 是服装」）。提示词里先说清楚「哪些地方保持不变」，再写要改什么，人脸和商品细节会稳定很多。
