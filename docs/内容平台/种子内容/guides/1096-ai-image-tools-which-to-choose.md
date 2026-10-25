---
title: AI 生图工具怎么选：ChatGPT 图片、Gemini（Nano Banana）、Grok Imagine 按官方说明对比额度、水印和 API 价格
slug: ai-image-tools-which-to-choose
products: [ai-tools]
models: []
accountTier: OTHER
excerpt: AI 生图工具怎么选？按官方页面对比：ChatGPT 免费版有限、Plus 更精细、Pro 无限；Gemini 免费版就有图片生成与编辑；Grok 带水印；Claude 不生成照片和插画。附 Gemini 和 Grok 的 API 单价（2026-10 查询）。
checkedOn: 2026-10-25
sources:
  - https://chatgpt.com/pricing
  - https://gemini.google/subscriptions/
  - https://ai.google.dev/gemini-api/docs/pricing
  - https://x.ai/grok
  - https://docs.x.ai/developers/pricing
  - https://docs.x.ai/grok/faq
  - https://platform.openai.com/docs/pricing
verify:
  - 本文只引各家官方写明的功能、额度和价格，不比较出图质量或风格，官方没有可比口径；「按需求挑」部分是本站整理，依据是官方功能描述
  - ChatGPT 定价页写：Free「有限的图片创作」、Go「更多图片创作」、Plus「更复杂、更准确的图片创作」、Pro「无限且更快的图片创作」（无限受滥用防护限制）；OpenAI API 价格页的图片模型（如 gpt-image-2）按 token 计价，图片输出每百万 tokens 30 美元（标准档），没有统一的「每张」价格，本文不换算
  - Gemini：订阅页写免费版有图片生成与编辑，Plus 为免费版 2 倍用量；API 定价页的图片模型按输出 token 计价并给出折算：Nano Banana 2.1 约 0.0336（1K）、0.0504（2K）、0.113（4K）美元每张；Nano Banana Pro 约 0.134（1K 或 2K）、0.24（4K）美元每张；本文引用的是页面写明的折算值
  - Grok：官方 x.ai/grok 写 Imagine 最高 2K 图片；API 价格页 grok-imagine-image 每张 0.02 美元，grok-imagine-image-2.0 按分辨率和质量每张 0.04 到 0.08 美元；官方 FAQ 写明生成的图片和视频带 Grok 水印，没有去除设置
  - Claude 官方帮助中心写 Claude 不像生图工具那样生成照片和插画，详见本站 1053 号文章；是否有生图 API，本文没有查到官方说明，不下结论
  - Gemini 生成的图片带 SynthID 水印，见本站 331 号文章；ChatGPT 生图的水印或标识，本次没有取得官方页面依据，不写
  - 本文不涉及 Midjourney、可灵、即梦等其他生图产品，它们的官方信息本次没有核对
---

> 本文根据 ChatGPT、Gemini、Grok 和 Claude 的官方定价页、帮助中心和 API 价格页整理，资料核对于 2026-10-25，价格为「2026-10 查询」。**不比较出图好不好看**，只摆官方写明的额度、水印和价格。图为本站整理的示意图。

## 适用于谁

- 搜「ai生图工具怎么选」「哪个ai画图好用」的人；
- 想知道免费版能不能画图、付费版多了什么的人；
- 做批量生图、关心 API 价格的开发者。

## 结论先说

1. **三家免费版都能生图，但都有限额**：ChatGPT 免费版「有限的图片创作」；Gemini 免费版有图片生成与编辑（用 Nano Banana）；Grok 免费版有限量的 Imagine。
2. **付费后的差别**：ChatGPT 从 Go 的「更多」、Plus 的「更复杂、更准确」到 Pro 的「无限且更快」；Gemini Plus 是免费版 2 倍用量，Pro 4 倍，Ultra 更高；Grok 是共享周用量池，Plus 起含 Imagine。
3. **Claude 不是生图工具**：官方帮助中心说 Claude 不生成照片和插画（能做图表和示意图），见 [/guides/claude-image-generation](/guides/claude-image-generation)。
4. **水印**：Gemini 生成的图带 SynthID 隐形水印；Grok 生成的图片和视频带 Grok 水印，官方明确没有去除设置。
5. **API 价格**：Gemini 的 Nano Banana 系列每张约 0.03 到 0.24 美元；Grok 的 Imagine 图片每张 0.02 到 0.08 美元；OpenAI 的图片模型按 token 计价。

![四家生图能力的官方说明对比](seed:g1096-ai-image-tools-compare.png)
*图：本站根据各家官方定价页与帮助中心整理的示意图*

## 一、各家怎么说

### ChatGPT

官方定价页：Free 有限的图片创作；Go 更多图片创作；Plus 更复杂、更准确的图片创作；Pro 无限且更快的图片创作（无限受滥用防护限制）。额度、失败排查、提示词见 [/guides/chatgpt-image-limits](/guides/chatgpt-image-limits)、[/guides/chatgpt-image-failed](/guides/chatgpt-image-failed) 和 [/guides/chatgpt-image-prompt-commands](/guides/chatgpt-image-prompt-commands)。需要开通可看 [/chongzhi/chatgpt-plus](/chongzhi/chatgpt-plus)。

API 里，OpenAI 价格页列有 gpt-image 系列模型，按文本和图像 token 分别计价，例如 gpt-image-2 的图像输出是每百万 tokens 30 美元（标准档），具体每张多少钱取决于尺寸和质量，官方提供了计算器。

### Gemini（Nano Banana）

官方订阅页：免费版有图片生成与编辑；Plus 是 2 倍用量，并有更多 Nano Banana 在搜索里的使用；Pro 4 倍；Ultra 更高。次数规则见 [/guides/gemini-image-limits](/guides/gemini-image-limits)，生不出图见 [/guides/gemini-cant-generate-images](/guides/gemini-cant-generate-images)，水印见 [/guides/gemini-image-watermark-synthid](/guides/gemini-image-watermark-synthid)。需要谷歌账号相关服务可看 [/chongzhi/google-zhanghao](/chongzhi/google-zhanghao)。

API 定价页（美元每张，页面折算值）：

| 模型 | 1K | 2K | 4K |
| --- | --- | --- | --- |
| Nano Banana 2.1 | 约 0.0336 | 约 0.0504 | 约 0.113 |
| Nano Banana Pro | 约 0.134 | 约 0.134 | 约 0.24 |
| Nano Banana 2 Lite | 约 0.0336 | 官方页未列 | 官方页未列 |

### Grok Imagine

官方 x.ai/grok：文生图、文生视频在同一个对话里，最高 2K 图片，可以用后续指令编辑；官方 FAQ 说明所有生成内容带 Grok 水印。API 价格：grok-imagine-image 每张 0.02 美元，grok-imagine-image-2.0 按分辨率和质量每张 0.04 到 0.08 美元，图片编辑的输入图另计。详见 [/guides/grok-imagine-image-video](/guides/grok-imagine-image-video) 和 [/guides/grok-imagine-video-15-image-20](/guides/grok-imagine-video-15-image-20)。需要开通可看 [/chongzhi/grok-super](/chongzhi/grok-super)。

## 二、按需求挑

![按需求挑生图工具](seed:g1096-ai-image-tools-decide.png)
*图：本站根据各家官方文档整理的示意图*

| 需求 | 可以先看 |
| --- | --- |
| 先免费试 | 三家免费版都有生图，额度各家不同且有限，用一两天看够不够 |
| 在对话里反复改图 | Gemini、Grok 官方写明可编辑；ChatGPT 的改图指令见上面链接的文章 |
| 做批量或高分辨率 | 看 API：Gemini 有 4K 档，Grok 官方写最高 2K |
| 在意 AI 标识 | Gemini 有 SynthID，Grok 有 Grok 水印 |
| 要真实风格照片或插画 | Claude 官方说不生成，选别家 |

## 三、使用时要注意

- **额度口径不同**：ChatGPT 官方只写「有限、更多、无限」；Gemini 按计算量折算，每 5 小时刷新；Grok 是每周共享用量池；
- **生成内容的使用规则**：各家都有使用政策，不要用于侵犯他人权利或误导性内容；
- **别信「无水印」承诺**：Grok 官方明确写没有去除水印的设置，去除、修改或遮挡水印违反使用政策；
- **想对比其他生图或视频工具**：本站另有 [/guides/ai-video-tools-which-to-choose](/guides/ai-video-tools-which-to-choose)。

## 常见问题

**Q：哪个出图最好？**
官方没有可比的口径，本文不下结论。建议拿同一个提示词在三家免费版里各试几张。

**Q：会员怎么选？**
见 [/guides/ai-subscription-which-to-choose-four-vendors](/guides/ai-subscription-which-to-choose-four-vendors)。

**Q：Claude 能画图吗？**
官方说不生成照片和插画，但能做图表、SVG 和 Mermaid 图，见开头链接。

## 参考资料

- ChatGPT 官方：Pricing — https://chatgpt.com/pricing
- Gemini 官方：订阅 — https://gemini.google/subscriptions/
- Gemini API：定价 — https://ai.google.dev/gemini-api/docs/pricing
- Grok 官方：Grok — https://x.ai/grok
- docs.x.ai：API 价格 — https://docs.x.ai/developers/pricing
- docs.x.ai：Grok FAQ — https://docs.x.ai/grok/faq
- OpenAI：API 价格 — https://platform.openai.com/docs/pricing
