---
slug: veo
name: Veo
kind: MODEL
updated: 2026-10-06
sources:
  - https://deepmind.google/models/veo/
  - https://blog.google/innovation-and-ai/products/veo-updates-flow/
  - https://support.google.com/gemini/answer/16126339?hl=en
  - https://support.google.com/flow/answer/16352836?hl=en
  - https://support.google.com/flow/answer/16526234?hl=en
  - https://blog.google/innovation-and-ai/sundar-pichai-io-2026/
  - https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-omni-flash-nano-banana-2-lite/
  - https://gemini.google/subscriptions/
verify:
  - Gemini App 里「制作视频」现在用的是 Gemini Omni（帮助中心原文），已经不是 Veo 3.1；Gemini App 里是否还能手动选 Veo，需实际登录确认
  - Flow 积分：无订阅每天 50 积分、各档订阅每月额外积分、Veo 3.1 Lite / Fast / Quality 各档消耗，来自 Flow 帮助中心的搜索摘要，未逐条打开核对，所以正文不写数字
  - 「最多 3 张参考图」（Ingredients to Video）来自报道，DeepMind 页面只写「支持参考图」
  - Gemini App 视频时长：旧版帮助中心写 8 秒，换成 Gemini Omni 后的时长需确认
---
## Veo 是什么

Veo 是 Google DeepMind 的视频生成模型，目前最新版本是 Veo 3.1。它的特点是画面和声音一起生成：音效、环境声，甚至人物对白都能直接出来，不用后期再配。所以写「veo 3 提示词」时，声音部分和画面一样值得认真写。

需要注意的是，2026 年 5 月的 Google I/O 上又发布了 Gemini Omni，按 Gemini 帮助中心的说明，Gemini App 里的「制作视频」现在使用的是 Gemini Omni。Veo 3.1 主要在 Google Flow 和 Gemini API 里使用。

## 能做什么

- 文生视频、图生视频
- 原生音频：音效、环境声、对白
- 1080p 和 4K 输出，支持竖屏
- 参考图：用图片锁定人物和画风，保持角色一致
- 场景延长：接着上一段视频的最后一秒继续生成，拼出更长的片段

## 怎么用

| 入口 | 说明 |
|---|---|
| Google Flow | Google 的 AI 影片制作工具，可选 Veo 3.1 的 Lite / Fast / Quality 三档，也能选 Gemini Omni |
| Gemini App | 侧边栏「制作视频」，目前是 Gemini Omni；个人账号需要订阅 Google AI 方案，未满 18 岁不能用 |
| YouTube | 部分创作功能接入了 Veo |
| Gemini API / Google AI Studio | 开发者调用 |

## 免费与付费的区别

Flow 按积分计费：不订阅每天也有少量积分，订阅 Google AI Plus、Pro、Ultra 后每月有额外积分，Veo 3.1 的档位越高，消耗的积分越多。Gemini App 里的视频生成需要 Google AI 订阅。具体数字以 Flow 帮助中心和订阅页面为准。

## 本页的提示词怎么用

Veo 的提示词建议写成一段完整的镜头描述：主体和动作、镜头运动、光线和风格，最后单独写声音（比如「背景是雨声，人物低声说：……」）。对白用引号括起来，并说清楚是谁说的。这些写法换到 Gemini Omni 上应该也能用，效果差异待实测。
