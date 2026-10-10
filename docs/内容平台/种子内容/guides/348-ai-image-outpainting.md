---
title: AI扩图怎么做：ChatGPT、Gemini、Midjourney 把图片补全成更大画幅
slug: ai-image-outpainting
products: [ai-tools, chatgpt]
models: [midjourney, nano-banana]
accountTier: FREE
excerpt: 竖图想改横图、主体太满想往外扩一圈？本文按官方文档讲清 ChatGPT 改宽高比、Gemini 用文字扩图、Midjourney 的 Zoom Out / Pan / 编辑器三种扩图方式，附扩图指令模板和「扩出来的部分不自然」的修法。
checkedOn: 2026-10-07
sources:
  - https://help.openai.com/en/articles/11084440-images-in-chatgpt
  - https://developers.openai.com/api/docs/guides/image-prompting
  - https://ai.google.dev/gemini-api/docs/image-generation
  - https://docs.midjourney.com/hc/en-us/articles/32595476770957-Zoom-Out
  - https://docs.midjourney.com/hc/en-us/articles/32570788043405-Pan
  - https://docs.midjourney.com/hc/en-us/articles/32764383466893-Editor
---

## 适用于谁

- 搜「AI扩图」「AI扩图指令」「AI扩图提示词」「AI扩图免费」的人；
- 手机竖拍的照片想做成横版封面、电脑壁纸的人；
- 主体被裁得太紧，想往外补一些背景的人。

本文根据 OpenAI、Google、Midjourney 官方文档整理，资料核对于 2026-10-07。Midjourney 扩图的完整操作见《Midjourney 局部重绘和扩图怎么用》，本文只做对比和要点。

## 结论先说

1. **扩图（outpainting）= 保留原图，补出画面外的内容**。补出来的部分是 AI 根据原图「推测」的，不是真实拍到的。
2. **三种工具的入口**：
   - **ChatGPT**：编辑器里点 **Aspect ratio（宽高比）** 换比例，或直接说「扩展成 16:9 横版」；
   - **Gemini（Nano Banana）**：上传图片，用文字描述要往哪个方向扩、扩出来是什么；
   - **Midjourney**：**Zoom Out**（向四周扩 1.0–2.0 倍）、**Pan**（向某一方向扩）、编辑器里拖大画布。
3. **写清三件事**：扩到什么比例 / 往哪个方向、扩出来的区域应该是什么、原图部分保持不变。

## 方法一：ChatGPT

1. 点开图片进入编辑器（网页端），点 **Aspect ratio（宽高比）**，选新比例重新生成；
2. 或者上传图片直接写：

```
把这张图扩展成 16:9 横版：原图内容和位置保持不变，
在左右两侧自然延伸背景——左边是延续的沙滩和海浪，右边是礁石和远处的灯塔，
光线、色调、透视与原图一致，不要添加人物和文字。
```

OpenAI 官方说明 ChatGPT 可以生成任意宽高比的图片；同时提醒多轮编辑可能改动你想保留的细节，必须像素级不变的区域，应把编辑结果合成回原图。

## 方法二：Gemini（Nano Banana）

Gemini 没有专门的「扩图按钮」，用文字描述即可。可以套用 Google 官方「加 / 改元素」模板的思路：

```
使用这张图片，把画面向上方扩展，使其成为 9:16 竖版。
扩展部分是傍晚渐变的天空和几缕云，与原图的光线、色调和透视自然衔接。
原图中的所有内容保持完全不变。
```

在 Gemini API 里还可以直接指定输出比例（Nano Banana 系列支持 1:1、3:2、16:9、21:9 等多种比例）。

## 方法三：Midjourney

| 功能 | 作用 | 要点 |
| --- | --- | --- |
| Zoom Out | 像镜头后退一样向四周补画面 | 预设 1.5x / 2x，悬停 2x 可输入 1.0–2.0 自定义；不改变图片像素尺寸 |
| Pan | 向上下左右某个方向扩展画布 | 点方向箭头；想同时改提示词进编辑器 |
| 编辑器 | 拖动画布边缘、改画幅、配合擦除重绘 | 可以上传外部图片扩图 |
| Make Square（Discord） | 把非方形图补成方形 | 按原图方向自动横向或纵向扩展 |

官方提示：V7 / V8.1 下 Zoom Out 和 Pan 仍调用 V6.1 处理；在 HD 图上扩图，结果会降为 SD 分辨率，需要时再放大。

![Midjourney 官方示意：红框为原图，2x 与 1.5x Zoom Out 后补出的周边画面](seed:g319-zoom-out.jpg)
*图片来源：[Midjourney 官方文档 · Zoom Out](https://docs.midjourney.com/hc/en-us/articles/32595476770957-Zoom-Out)*

## 扩图指令模板

```
把这张图扩展为[目标比例]，向[方向]延伸。
扩展区域：[具体描述，如延续的木地板和窗边绿植 / 晴朗的蓝天 / 城市街景]。
要求：原图部分不变；光线方向、色调、透视、颗粒感与原图一致；不要添加新的人物、文字或 logo。
```

## 扩出来不自然怎么办

| 现象 | 调整 |
| --- | --- |
| 接缝明显、颜色断层 | 强调「光线方向、色调、透视与原图一致」；减小一次扩展的幅度，分两次扩 |
| 扩出奇怪的人或物 | 明确写「不要添加人物」，并具体描述扩展区域该有的内容 |
| 原图主体被改了 | 写「原图内容和位置保持完全不变」；必要时把原图贴回去 |
| 透视错乱（地面、建筑） | 描述地平线高度和建筑延伸方向；Midjourney 可改用 Pan 单方向扩 |

## 常见问题

**Q：扩图能用在新闻、证据照片上吗？**
不能。扩出来的内容是 AI 编造的，用在需要真实性的场合会误导他人。

**Q：别人的照片可以扩吗？**
只处理你有权使用的图片。各平台都要求你对上传的图片拥有必要的权利。

**Q：哪个工具扩图最自然？**
官方没有给出横向对比。风景、背景类简单扩展几个工具都能胜任；需要精确控制方向和画布时，Midjourney 编辑器更直观；需要用一句话描述扩展内容时，ChatGPT 和 Gemini 更方便。

## 参考资料

- OpenAI 帮助中心：Images in ChatGPT — https://help.openai.com/en/articles/11084440-images-in-chatgpt
- OpenAI API 文档：Image prompting — https://developers.openai.com/api/docs/guides/image-prompting
- Google AI for Developers：Image generation — https://ai.google.dev/gemini-api/docs/image-generation
- Midjourney 官方文档：Zoom Out — https://docs.midjourney.com/hc/en-us/articles/32595476770957-Zoom-Out
- Midjourney 官方文档：Pan — https://docs.midjourney.com/hc/en-us/articles/32570788043405-Pan
- Midjourney 官方文档：Editor — https://docs.midjourney.com/hc/en-us/articles/32764383466893-Editor
