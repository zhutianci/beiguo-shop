---
title: DeepSeek 能识别图片吗、多模态现状如何：按官方更新日志梳理识图与「没有生图」的事实
slug: deepseek-multimodal-image-recognition
products: [ai-tools]
models: [deepseek]
accountTier: OTHER
excerpt: DeepSeek 能识别图片吗？为什么早期不支持多模态？按官方更新日志（2026-10-24 查询）梳理：2026 年 8 月出现视觉理解实验模型，9 月 V4.1 Flash 原生支持多模态，Pro 不支持；输出仍只有文本，没有生图。
checkedOn: 2026-10-24
sources:
  - https://api-docs.deepseek.com/zh-cn/updates
  - https://api-docs.deepseek.com/zh-cn/news/news260910
  - https://api-docs.deepseek.com/zh-cn/guides/vision
  - https://api-docs.deepseek.com/zh-cn/quick_start/pricing
  - https://apps.apple.com/cn/app/deepseek/id6737597349
verify:
  - 时间线取自官方更新日志与 2026-09-10 公告；官方没有解释「为什么早期模型不支持图像输入」，本文只列出官方在哪个时间点发布了哪种能力，不做原因推测
  - 官方更新日志对多模态的表述是「视觉理解」「原生多模态视觉理解能力」；没有任何一处提到生成图片
  - App Store 版本记录里能看到「支持识图模式」以及 9 月版本的「快速、专家、识图模式合并升级」；网页版 / App 的具体入口和限制以官方界面为准，本文不描述按钮
  - 图片限制数字（格式、大小、数量）取自官方图像理解文档（2026-10-24）
---

> 本文根据 DeepSeek 官方更新日志、公告和 API 文档整理，资料核对于 2026-10-24。功能变化快，以官方页面为准。图为本站整理的示意图。

## 适用于谁

- 搜「deepseek为什么不支持多模态」「deepseek能识别图片吗」的人；
- 看到老教程说「DeepSeek 不能识图」，想知道现在是不是变了的人；
- 想弄清「识图」和「生图」区别的人。

## 结论先说

1. **现在能识图，但只有 `deepseek-flash`**。官方价格页功能表：图像理解 deepseek-flash 支持，deepseek-v4-pro 不支持。
2. **不是一直能识图**：官方更新日志显示，2026-04-24 的 V4 预览版公告和价格图里没有提图像输入；2026-08-21 才发布实验性的视觉理解模型；2026-09-10 的 V4.1-Flash 起「原生支持多模态」。老教程里「不支持识图」的说法在当时是对的，现在需要更新。
3. **官方没有解释早期为什么不支持**，所以「为什么」这一问，本文只能给出时间线，不能给原因。
4. **输出仍然只有文本**：官方文档里所有「多模态」都指「看懂图片」，没有生成图片的功能。生图需求见 [/guides/deepseek-generate-image](/guides/deepseek-generate-image)。

![DeepSeek 识图能力的官方时间线](seed:g1016-deepseek-multimodal-timeline.png)
*图：本站根据 [DeepSeek 官方更新日志](https://api-docs.deepseek.com/zh-cn/updates) 整理的示意图*

## 一、官方时间线

- **2026-04-24 · V4 预览版**：官方公告介绍 V4-Pro 与 V4-Flash，强调 1M 上下文、Agent 能力，价格图里只有模型名、价格和上下文长度，没有图像相关的内容；
- **2026-08-21 · DeepSeek-V4-Flash-Vision-Exp**：官方更新日志写，「全新的多模态视觉理解模型」上线，是实验性质的模型，通过 `model='deepseek-v4-flash-vision-exp'` 访问；纯文本能力与 V4-Flash 正式版持平，在需要视觉理解的 Agent 基准上相比 V4-Flash 大幅提升；
- **2026-09-10 · DeepSeek-V4.1-Flash**：官方公告称它是新模型结构系列中最小尺寸的模型，「具备原生多模态视觉理解能力」；API 里把模型名改成 `deepseek-flash` 即可调用；旧的 V4 Flash 与 V4 Flash Vision Exp 下线，旧模型名暂时路由到 V4.1 Flash；
- **2026-10-17 · V4.1-Flash-1017**：官方说网页端、App 和 API 的模型同步更新为新版本，API 调用方式和价格不变。

对于网页版和 App，App Store 的版本记录里出现过「支持识图模式」，9 月版本又写「新模型上线，快速、专家、识图模式合并升级」。也就是说，App 上曾经把识图做成一个单独的模式，之后和快速、专家模式合并。具体怎么用，见 [/guides/deepseek-upload-file-image](/guides/deepseek-upload-file-image)。

## 二、现在能让它看图做什么

官方图像理解文档写：`deepseek-flash` 支持在文本之外输入图片，你可以让模型**描述图片、识别截图中的文字、分析图表**等。

- **格式**：JPEG、PNG、GIF、WebP，由文件实际内容判断，不看文件名或声明的类型；
- **三种传入方式**：base64 内联、外部图片 URL、通过 Files API 上传后用 `file_id` 引用；
- **限制**：请求体 48 MiB；外部 URL 或 base64 的单张图最大 32 MiB，通过 Files API 的单张最大 64 MiB；单请求最多 600 张；图片最长边最多 8192 像素；
- **token**：每张图片会自动缩放，消耗的 token 有上限 1024，和图片原始尺寸无关；
- **位置**：图片只能放在 user 消息里，放进 system 或 assistant 消息会返回 400；
- **detail**：`low` 把图缩到 512×512，更快更省 token；`high`、`original`、`auto` 保留原图。

数字的汇总见 [/guides/deepseek-context-length-output-limit](/guides/deepseek-context-length-output-limit)。

![想让 DeepSeek 看图，先对照这张表](seed:g1016-deepseek-image-input-decide.png)
*图：本站根据 [DeepSeek 官方图像理解文档](https://api-docs.deepseek.com/zh-cn/guides/vision) 整理的示意图*

## 三、识图能力的边界

官方文档没有给「识别准确率」这类数字，所以下面是使用上的提醒，不是官方保证：

- **别把重要信息只交给识图**：金额、日期、药品剂量这类内容，识别后要人工核对原图；
- **截图尽量清晰、裁剪到相关区域**：区域越小，越省 token，也更不容易看错；
- **提问要具体**：「把表格里第三列的数字抄出来」比「看看这张图」更容易得到可用的结果；
- **不要上传含隐私的图片**：身份证、银行卡、他人照片等不要上传。

## 四、用 API 传图的最小示例

官方文档的 base64 示例（Python，节选）：

```python
import base64
from openai import OpenAI

client = OpenAI(api_key="<你的 Key>", base_url="https://api.deepseek.com")
with open("image.jpg", "rb") as f:
    b64 = base64.b64encode(f.read()).decode("utf-8")

response = client.chat.completions.create(
    model="deepseek-flash",
    messages=[{"role": "user", "content": [
        {"type": "text", "text": "这张图片里有什么？"},
        {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{b64}"}},
    ]}],
)
print(response.choices[0].message.content)
```

在 Anthropic 接口和 Responses API 里传图的写法稍有不同，见 [/guides/deepseek-responses-api-anthropic-compatible](/guides/deepseek-responses-api-anthropic-compatible)。API Key 的获取见 [/guides/deepseek-api-key](/guides/deepseek-api-key)。

## 常见问题

**Q：网页版能识别图片吗？**
官方 App 和网页版近期的更新说明里有识图相关的模式和合并升级，具体入口以官方界面为准，见 [/guides/deepseek-upload-file-image](/guides/deepseek-upload-file-image)。

**Q：Pro 为什么不支持图像？**
官方价格页只写「不支持」，没有解释原因。要识图请用 `deepseek-flash`，两者对比见 [/guides/deepseek-v4-pro-vs-flash-api-price](/guides/deepseek-v4-pro-vs-flash-api-price)。

**Q：DeepSeek 和 ChatGPT 的识图有什么不同？**
ChatGPT 的图片能力见 [/guides/chatgpt-image-recognition](/guides/chatgpt-image-recognition)，整体对比见 [/guides/chatgpt-vs-deepseek-difference](/guides/chatgpt-vs-deepseek-difference)。

**Q：想要能生成图片的产品？**
可看 [/guides/gpt-image-2-how-to](/guides/gpt-image-2-how-to)，需要开通 ChatGPT 会员见 [/chongzhi/chatgpt-plus](/chongzhi/chatgpt-plus)。

## 参考资料

- DeepSeek API 文档：更新日志 — https://api-docs.deepseek.com/zh-cn/updates
- DeepSeek-V4.1-Flash 发布公告（2026-09-10）— https://api-docs.deepseek.com/zh-cn/news/news260910
- DeepSeek API 文档：图像理解 — https://api-docs.deepseek.com/zh-cn/guides/vision
- DeepSeek API 文档：模型 & 价格 — https://api-docs.deepseek.com/zh-cn/quick_start/pricing
- App Store：DeepSeek - AI 智能助手（版本记录）— https://apps.apple.com/cn/app/deepseek/id6737597349
