---
title: AI绘画提示词怎么写：主体、风格、构图、光线的通用公式与词汇表
slug: ai-image-prompt-formula
products: [ai-tools, chatgpt]
models: [midjourney, nano-banana]
accountTier: FREE
excerpt: AI 绘画提示词到底怎么写？本文综合 OpenAI、Google、Midjourney 三家官方提示指南，总结一套通用公式（主体 + 动作 + 场景 + 构图 + 光线 + 风格 + 约束），附中英对照词汇表，并讲清 ChatGPT / Nano Banana 与 Midjourney 写法的差别。
checkedOn: 2026-10-07
sources:
  - https://developers.openai.com/api/docs/guides/image-prompting
  - https://ai.google.dev/gemini-api/docs/image-generation
  - https://docs.midjourney.com/hc/en-us/articles/32023408776205-Prompt-Basics
  - https://docs.midjourney.com/hc/en-us/articles/32859204029709-Parameter-List
---

## 适用于谁

- 搜「AI绘画提示词」「AI生图提示词模板」「AI绘画提示词写法」「AI绘图提示词教学」的人；
- 用 ChatGPT、Gemini、Midjourney、即梦等工具画图，但每次都要靠「抽卡」的人；
- 想要一套跨工具通用的写法，再按工具微调的人。

本文综合 OpenAI《Image prompting》、Google Gemini API《Image generation》提示指南和 Midjourney《Prompt Basics》等官方文档整理，资料核对于 2026-10-07。文字类提示词（让 AI 写东西）的写法见本站《提示词怎么写》，本文只讲画图。

## 结论先说

1. **三家官方的共同点**：说清你要的**成品**（用途），具体描述**看得见的东西**（主体、材质、光线、颜色、构图），给出**约束**（画幅、要 / 不要的元素），然后**一次改一处**地迭代。
2. **通用公式**：

```
[成品/用途] + [主体及细节] + [动作/状态] + [场景/时间] + [构图/镜头] + [光线] + [风格/媒介] + [色彩/情绪] + [约束：画幅、文字、排除项]
```

3. **两类工具写法不同**：ChatGPT、Gemini（Nano Banana）擅长读完整的自然语言段落，可以写得像设计需求；Midjourney 官方建议**短而具体**，再用参数（如 `--ar`、`--s`、`--no`）控制。

## 公式逐项拆解

| 要素 | 回答什么 | 写法示例 |
| --- | --- | --- |
| 成品 / 用途 | 这张图拿来干嘛 | 电商主图、公众号封面、绘本插画、PPT 配图 |
| 主体 | 谁 / 什么，长什么样 | 一位戴毛线帽的老渔夫，满脸皱纹，手臂有褪色纹身 |
| 动作 / 状态 | 在做什么 | 低头整理渔网，身旁的狗安静地坐着 |
| 场景 / 时间 | 在哪、什么时候 | 小渔船甲板上，海岸线背景，清晨 |
| 构图 / 镜头 | 怎么拍 | 中近景、平视、50mm 镜头、浅景深 |
| 光线 | 光从哪来、什么质感 | 柔和的海边日光、逆光、窗边自然光 |
| 风格 / 媒介 | 照片还是画 | 35mm 胶片照片、水彩插画、3D 渲染、扁平矢量 |
| 色彩 / 情绪 | 整体感觉 | 自然色彩、低饱和、温暖治愈、冷峻 |
| 约束 | 必须 / 禁止 | 3:4 竖版；不要文字和水印；不要过度修图 |

把它们串起来，就是 OpenAI 官方示例的思路（意译）：

> 一张写实的抓拍照片：一位老水手站在小渔船上，皮肤饱经风霜、皱纹和毛孔清晰，手臂有几处褪色的传统水手纹身。他平静地整理渔网，他的狗坐在甲板上。像 35mm 胶片拍摄，中近景、平视、50mm 镜头。柔和的海岸日光，浅景深，轻微胶片颗粒，自然色彩。画面真实不摆拍，不要美化，不要重度修图。

![按上面这类提示词生成的官方示例：老水手在渔船上整理渔网，身旁坐着一只狗](seed:g336-gpt-photoreal-sailor.jpg)
*图片来源：[OpenAI API 文档 · Image prompting](https://developers.openai.com/api/docs/guides/image-prompting)*

## 常用词汇表（中英对照）

**景别与机位**

| 中文 | 英文 |
| --- | --- |
| 特写 / 大特写 | close-up / extreme close-up |
| 中景 / 中近景 | medium shot / medium close-up |
| 全身 / 远景 | full shot / wide shot |
| 俯拍 / 鸟瞰 | high-angle / bird's-eye view |
| 仰拍 / 虫视 | low-angle / worm's-eye view |
| 平视 | eye-level |
| 过肩 / 第一人称 | over-the-shoulder / POV |

**光线**

| 中文 | 英文 |
| --- | --- |
| 黄金时刻 | golden hour |
| 柔光 / 漫射光 | soft light / diffused light |
| 逆光剪影 | backlit silhouette |
| 伦勃朗光 | Rembrandt lighting |
| 影棚三点布光 | three-point studio lighting |
| 霓虹灯光 | neon lighting |
| 体积光（丁达尔） | volumetric light |

**风格与媒介**

| 中文 | 英文 |
| --- | --- |
| 写实照片 | photorealistic photograph |
| 胶片质感 | 35mm film, film grain |
| 水彩 / 油画 / 炭笔 | watercolor / oil painting / charcoal sketch |
| 扁平插画 / 矢量 | flat illustration / vector |
| 3D 渲染 / 黏土风 | 3D render / claymation style |
| 等距视角 | isometric |

## 三个跨工具通用的技巧

1. **具体胜过形容词**：Google 官方的例子——不写「奇幻盔甲」，写「蚀刻银叶纹的精灵板甲，高领，肩甲形如鹰翼」。
2. **说你要什么，而不是不要什么**：Midjourney 官方提醒，写「没有蛋糕的派对」反而可能出现蛋糕；Google 建议用正面描述代替否定，比如「空无一人的街道」。确实要排除，Midjourney 用 `--no`。
3. **写数量、写位置**：「三只猫」而不是「猫」；「主体放在画面右下角，左侧大面积留白」。

## 按工具微调

| | ChatGPT（Images 2.5） | Gemini（Nano Banana） | Midjourney |
| --- | --- | --- | --- |
| 推荐长度 | 段落式、可分「场景 / 主体 / 细节 / 约束」 | 段落式，越具体越可控 | 短句为主，官方说长清单反而容易混乱 |
| 画幅 | 在提示词里写「16:9 横版」 | 写在提示词里或选比例 | `--ar 16:9` |
| 文字 | 文字放引号，说明位置和字体 | 文字放引号，说明字体 | 英文双引号，拉丁字母效果最好 |
| 排除元素 | 可写「不要文字 / 水印」 | 用正面描述代替否定 | `--no 元素1, 元素2` |
| 风格强弱 | 用描述控制 | 用描述控制 | `--s`（0–1000）、`--raw` |

各工具的详细教程：《ChatGPT 生图提示词与改图指令》《Nano Banana 提示词怎么写》《Midjourney 参数大全》。

## 常见问题

**Q：提示词越长越好吗？**
不一定。Midjourney 官方明确建议短而具体；ChatGPT 和 Gemini 能处理长描述，但关键是信息有用、不自相矛盾。

**Q：一定要用英文吗？**
ChatGPT、Gemini 用中文描述没有问题（Gemini API 文档把简体中文列为推荐语言之一）；Midjourney 官方示例均为英文，建议用英文。

**Q：可以写「某某画家风格」「某动漫风格」吗？**
技术上常常能出效果，但模仿在世艺术家或知名 IP 有版权和平台政策风险，商用尤其要谨慎。用「水彩、粗描边、赛璐璐上色」这类通用风格词描述更稳妥。

**Q：同一个提示词每次出图都不一样？**
这是正常的。想要稳定，固定画风（如 Midjourney 的 `--sref`、参考图），每次只改一个变量，并保存满意的版本作为下一轮的参考。

## 参考资料

- OpenAI API 文档：Image prompting — https://developers.openai.com/api/docs/guides/image-prompting
- Google AI for Developers：Image generation（Prompting guide and strategies）— https://ai.google.dev/gemini-api/docs/image-generation
- Midjourney 官方文档：Prompt Basics — https://docs.midjourney.com/hc/en-us/articles/32023408776205-Prompt-Basics
- Midjourney 官方文档：Parameter List — https://docs.midjourney.com/hc/en-us/articles/32859204029709-Parameter-List
