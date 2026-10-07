---
title: AI图片放大与高清修复：Midjourney、ChatGPT、Gemini 怎么出高分辨率图
slug: ai-image-upscale
products: [ai-tools, gemini]
models: [midjourney, nano-banana]
accountTier: FREE
excerpt: AI 生成的图不够清晰，想打印或做大图怎么办？本文按官方文档讲清 Midjourney 的 Subtle / Creative 放大和 HD 直出、Gemini 与 ChatGPT 的分辨率选项、Flow 的视频放大，以及「AI 放大会编造细节」的注意事项。
checkedOn: 2026-10-07
sources:
  - https://docs.midjourney.com/hc/en-us/articles/32804058614669-Upscalers
  - https://docs.midjourney.com/hc/en-us/articles/32199405667853-Version
  - https://support.google.com/gemini/answer/14286560?hl=en
  - https://ai.google.dev/gemini-api/docs/image-generation
  - https://developers.openai.com/api/docs/guides/image-prompting
  - https://support.google.com/flow/answer/16352836?hl=en
---

## 适用于谁

- 搜「AI图片放大」「AI高清修复」「AI图片无损放大」「midjourney upscale subtle 什么意思」的人；
- 用 AI 生成了海报、壁纸、插画，想打印或用在大屏上，发现分辨率不够的人；
- 想知道各工具最大能出多大图的人。

本文根据 Midjourney、Google、OpenAI 官方文档整理，资料核对于 2026-10-07。

## 结论先说

1. **能「直出」高分辨率就别事后放大**：Midjourney V8.1 起可以直接出 2048px 的 HD 图；Gemini API 的 Nano Banana 2 / Pro 支持 1K / 2K / 4K；OpenAI 的 GPT Image 2.5 API 支持最高单边 3840 像素。
2. **Midjourney 放大分两种**：**Subtle（细微）**尽量保持原样，**Creative（创意）**会改动一些并补充新细节，两者都把尺寸放大到 2 倍。
3. **AI 放大不是「无损」**：它是根据模型的理解「补」出细节，可能改变文字、纹理甚至五官。用于证件、证据、需要真实性的场合要慎重。
4. **只放大你有权使用的图片**：Midjourney 条款写明，放大别人的图片，图片仍归原作者所有。

## 各工具的分辨率与放大方式

| 工具 | 默认输出 | 更高分辨率的方式 |
| --- | --- | --- |
| Midjourney V8.2 | SD：1:1 为 1024×1024 | Subtle / Creative 放大到 2048×2048；或直接用 HD（`--hd`）出 2048px |
| Gemini App（Nano Banana） | — | 下载原尺寸：订阅 Google AI 套餐 2K，免费 1K |
| Gemini API（Nano Banana 2 / Pro） | — | 生成时选 1K / 2K / 4K（3.1 Flash Image 另有 512px） |
| ChatGPT（Images 2.5） | 官方未公开 ChatGPT 内的输出分辨率 | 可在提示词里要求比例；高分辨率需求可用 API |
| OpenAI API（GPT Image 2.5） | — | 自定义尺寸，单边最长 3840、长短边比不超过 3:1；超过 2560×1440 为实验性 |
| Google Flow（Omni 视频） | 360p 草稿 / 720p 标准 | Pro / Ultra 用户可把 360p 免费放大到 720p |

## Midjourney 放大详解

### Subtle 和 Creative 有什么区别

官方说明：

- **Subtle（细微放大）**：尽量少改动，保持初始图片的样子；
- **Creative（创意放大）**：放大时会改变一些地方、增加新细节。官方提示它有时能顺便修正小问题，比如别扭的手势、奇怪的表情；同一张图可以多次 Creative 放大，每次结果略有不同。

![官方示意：同一张插画分别用 Subtle 和 Creative 放大后的局部对比，Creative 补充了更多笔触细节](seed:g340-mj-upscalers.jpg)
*图片来源：[Midjourney 官方文档 · Upscalers](https://docs.midjourney.com/hc/en-us/articles/32804058614669-Upscalers)*

两种都会把原图尺寸翻倍，消耗的 GPU 时间约为初次出图的两倍（官方速查表约 2 分钟）。

### 操作

1. 在 Create 或 Organize 页点开图片；
2. 在 Creation Actions 区找到 **Upscale**，点 **Subtle** 或 **Creative**；找不到时点 **More options** 勾选 Upscale；
3. 完成后的放大图会出现在 Create 页。

Discord 中：先用 U1–U4 拆出单张（V5 及以后不消耗 GPU 时间），再点 Upscale (Subtle) 或 Upscale (Creative)。

### V8.2 的尺寸参考（官方表）

| 画幅 | SD | 放大后 / HD |
| --- | --- | --- |
| 1:1 | 1024×1024 | 2048×2048 |
| 4:3 | 1232×928 | 2464×1856 |
| 2:3 | 896×1344 | 1792×2688 |
| 16:9 | 1456×816 | 2912×1632 |

注意：HD 图已经是 2048px，**目前不能再放大**；在 HD 图上做 Pan、Zoom Out、局部重绘，结果会降回 SD，需要时再放大。官方也说，需要比这更大的尺寸，可以借助第三方放大工具。

## Gemini 与 ChatGPT

- **Gemini App**：悬停图片点「Download full size」下载原尺寸，订阅用户为 2K、免费用户为 1K。需要更多细节（尤其是文字、信息图）时，付费用户可以「Redo with Pro」。
- **Gemini API**：直接在生成参数里选 2K 或 4K，比事后放大更清晰。
- **ChatGPT**：官方未公布 ChatGPT 内生图的具体像素；需要指定尺寸（如 2K、4K）的场景可以使用 OpenAI 图像 API，按用量计费。

## 用 AI 放大时的注意事项

1. **先挑好图再放大**：放大不会修好构图和主体问题，只会放大它们。
2. **文字和标志要复查**：Creative 类放大可能改写小字、logo。
3. **人像谨慎**：放大可能改变五官细节，不适合证件照、证据照片。
4. **印刷尺寸心里有数**：按常见的 300dpi 印刷标准，2048px 约可印 17cm 宽；做大幅海报时优先选 4K 输出或矢量重绘。
5. **版权**：只放大自己生成或有权使用的图片，别人的作品放大后仍归原作者。

## 常见问题

**Q：Midjourney upscale subtle 是什么意思？**
Subtle 是「细微放大」：把图放大到 2 倍，同时尽量保持原图不变；对应的 Creative 会在放大时补充新细节。

**Q：放大一次会扣很多额度吗？**
Midjourney 官方说明放大可能消耗约为初次出图两倍的 GPU 时间；Gemini、ChatGPT 的额度规则见《Gemini 生图次数限制》《ChatGPT 生图额度与限制》。

**Q：AI 能把老照片修复成高清吗？**
可以做修复和上色，但本质是「重绘」，可能和原貌有出入，适合做纪念、不适合当作史料原件。修复后想让照片动起来，可参考《图生视频提示词怎么写》。

**Q：有免费的 AI 图片放大工具吗？**
很多第三方工具提供免费放大，但要留意上传图片的隐私条款，不要上传身份证件、私密照片。

## 参考资料

- Midjourney 官方文档：Upscalers — https://docs.midjourney.com/hc/en-us/articles/32804058614669-Upscalers
- Midjourney 官方文档：Version（HD 图与编辑后的分辨率）— https://docs.midjourney.com/hc/en-us/articles/32199405667853-Version
- Gemini Apps Help：Generate & edit images with Gemini Apps — https://support.google.com/gemini/answer/14286560?hl=en
- Google AI for Developers：Image generation — https://ai.google.dev/gemini-api/docs/image-generation
- OpenAI API 文档：Image prompting（GPT Image 2.5 尺寸参数）— https://developers.openai.com/api/docs/guides/image-prompting
- Google Flow Help：Learn about Google Flow models & supported features — https://support.google.com/flow/answer/16352836?hl=en
