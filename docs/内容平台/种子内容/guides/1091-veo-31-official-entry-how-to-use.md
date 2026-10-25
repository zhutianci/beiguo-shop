---
title: Veo 3.1 官网入口与怎么用：Flow、Gemini 应用和 API 现在各是什么状态
slug: veo-31-official-entry-how-to-use
products: [gemini]
models: [veo]
accountTier: PRO
excerpt: Veo 3.1 官网在哪、怎么用？模型介绍页是 DeepMind 的 Veo 页面，创作入口是 Google Flow。Flow 里有 Veo 3.1 Lite、Fast、Quality；Gemini 应用的视频已换成 Omni；Gemini API 的 Veo 3.1 预览版 2026-10-22 已下线。
checkedOn: 2026-10-25
sources:
  - https://deepmind.google/models/veo/
  - https://support.google.com/flow/answer/16353333
  - https://support.google.com/flow/answer/16352836
  - https://support.google.com/flow/answer/16353334
  - https://ai.google.dev/gemini-api/docs/video
  - https://ai.google.dev/gemini-api/docs/veo
verify:
  - Flow 的入口地址取自 Flow 帮助中心当次页面（labs.google/fx/tools/flow）；DeepMind 的 Veo 页面上的按钮指向 gemini.google.com/veo、labs.google/flow 和 ai.google.dev 的视频文档，按钮目标可能变化
  - Flow 帮助中心写明使用条件：年满 18 岁且完成年龄验证、位于支持地区、订阅 Google AI Plus、Pro 或 Ultra；符合条件的 Workspace 套餐每天有 50 积分；官方推荐用 Chromium 内核浏览器；本文不涉及地区限制的绕过方法
  - Flow 模型功能表取自官方「Learn about Google Flow models & supported features」页：该页写 Flow 由多种 Veo 模型驱动，另有 Gemini Omni（标准 720p 与草稿 360p）；各模型的积分价格以产品内设置里显示为准，官方说成本在快速变化
  - 官方帮助中心说 Gemini Omni 取代 Gemini 应用里的 Veo（本站 323 号文章已引用）；Gemini API 的 Veo 3.1 Preview（三个预览模型）已于 2026-10-22 下线，官方让迁移到 Gemini Omni Flash 或通过 Gemini Enterprise Agent Platform 提供的正式版模型，企业平台上的具体模型与价格本文未核对
  - 官方说明 Flow 的所有输出都带不可见的 SynthID 水印，可见水印可通过账号菜单里的开关控制，印度、韩国和越南的非 Ultra 20x 用户会自动加可见水印
  - 本文不写 Veo 的 API 价格（官方 Veo 页已写明预览版下线），也不引用测评对比
---

> 本文根据 Google DeepMind 的 Veo 页面、Flow 官方帮助中心和 Gemini API 官方文档整理，资料核对于 2026-10-25。**Veo 在 Gemini API 里的预览版已于 2026-10-22 下线**，下文按这个时间点说明各入口现状。图为本站整理的示意图。

## 适用于谁

- 搜「veo 3.1 官网」「veo3 flow」的人；
- 想用 Veo 3.1 做视频，不知道现在该从哪个入口进的人；
- 以前用 Gemini API 调 Veo，现在报错下线的开发者。

## 结论先说

1. **官方入口有两个**：模型介绍页是 DeepMind 的 Veo 页面（deepmind.google/models/veo/），页内有「在 Gemini 试用」「在 Google Flow 试用」「用 Veo 构建」三个按钮；实际创作的主要入口是 **Google Flow**（labs.google/fx/tools/flow）。
2. **Flow 里能选 Veo 3.1**：官方帮助中心写明有 Veo 3.1 的 Lite、Fast、Quality 三档，同时还有 Gemini Omni Flash 1.1。
3. **Flow 的使用门槛**：年满 18 岁并完成年龄验证；位于支持的地区；订阅 Google AI Plus、Pro 或 Ultra。推荐用 Chrome、Edge 这类 Chromium 内核浏览器。订阅差别见 [/guides/gemini-ultra-vs-pro-difference](/guides/gemini-ultra-vs-pro-difference)，需要谷歌账号相关服务可看 [/chongzhi/google-zhanghao](/chongzhi/google-zhanghao)。
4. **Gemini 应用里的视频**：官方帮助中心说 Gemini Omni 已取代应用里的 Veo，详见 [/guides/gemini-video-generation](/guides/gemini-video-generation)。
5. **Gemini API**：官方文档写明 Veo 3.1 Preview（三个预览模型）已在 2026-10-22 下线，请迁移到 Gemini Omni Flash（`gemini-omni-1.1-flash`）或通过 Gemini Enterprise Agent Platform 提供的正式版模型。

![Veo 3.1 现在从哪里进](seed:g1091-veo31-entry-decide.png)
*图：本站根据 [DeepMind Veo 页面](https://deepmind.google/models/veo/)、[Flow 帮助中心](https://support.google.com/flow/answer/16353333) 与 [Gemini API 视频文档](https://ai.google.dev/gemini-api/docs/video) 整理的示意图*

## 一、在 Flow 里用 Veo 3.1

官方 Flow 帮助中心的步骤：

1. 用 Chromium 内核浏览器打开 Google Flow（labs.google/fx/tools/flow）；
2. 点已有项目或新建项目；
3. **用 Flow Agent**：在提示框里打开 Agent，详细描述想要的场景，可以让它一次做多个变体；或者**用标准提示框**：描述场景后点模型名，选 **Video**；
4. 可选：添加参考素材（ingredients）或起止帧；
5. 选择画幅、输出数量、模型和时长，点 Generate。

官方提示：提示词要具体，写清主体、动作、环境、光线和风格。官方默认模型是 Nano Banana Pro（图片），要生成视频需要点模型名切换到 Video。提示词写法见 [/guides/veo-prompt-guide](/guides/veo-prompt-guide)，Flow 的完整用法见 [/guides/google-flow-how-to](/guides/google-flow-how-to)。

### Flow 里各视频模型支持什么

![Flow 里 Veo 3.1 与 Omni 的功能对比](seed:g1091-veo31-flow-models.png)
*图：本站根据 [Flow 帮助中心：模型与支持功能](https://support.google.com/flow/answer/16352836) 整理的示意图*

要点（官方页面）：

- **Veo 3.1 Lite**：文生视频 4、6、8 秒；首帧、首尾帧；参考素材仅 8 秒；可延长（仅 8 秒）；不支持视频改视频；
- **Veo 3.1 Fast**：同样 4、6、8 秒；首帧、首尾帧；参考素材仅 8 秒；不支持延长和视频改视频；
- **Veo 3.1 Quality**：4、6、8 秒；首帧、首尾帧；不支持参考素材、延长和视频改视频；
- **Gemini Omni Flash 1.1**：4、6、8、10 秒；首帧、首尾帧、参考素材；支持视频改视频（最长 10 秒）；延长视频「即将推出」；
- 如果你选了所选模型不支持的功能，Flow 会提示并自动切到兼容的模型；
- 每次生成的积分以提示框设置里显示的为准，生成失败不扣积分。

## 二、其他入口的现状

| 入口 | 现状（2026-10-25 官方说明） |
| --- | --- |
| DeepMind Veo 页面 | 介绍 Veo 3.1，页内提供「在 Gemini 试用」「在 Flow 试用」「用 Veo 构建」按钮 |
| Gemini 应用 | 官方帮助中心说 Gemini Omni 取代了应用里的 Veo；新建视频走 Omni |
| Gemini API | Veo 3.1 Preview 三个预览模型 2026-10-22 下线；Gemini Omni Flash 用于视频生成和对话式编辑 |
| Gemini Enterprise Agent Platform | 官方说有正式版 Veo 模型，具体型号与价格请看企业平台文档 |

官方 Gemini API 文档里的 Veo 3.1 说明（下线前）提到：生成 8 秒视频，720p、1080p 或 4K（Lite 不支持 4K），带原生音频；支持横屏 16:9 和竖屏 9:16；最多 3 张参考图；支持首尾帧插值。这些是旧预览版的规格，现已不能通过 Gemini API 使用。

## 三、水印和使用规范

- Flow 里用 Veo、Omni 或 Nano Banana 生成的内容，官方说都带不可见的 SynthID 水印；
- 可见水印可以通过头像菜单里的「Visible watermarking」开关控制；印度、韩国、越南的非 Ultra 20x 用户会自动加可见水印；
- Flow 禁止生成有害、违法或不当内容，对未成年人和上传的人像有保护措施，详见官方「Generative AI Prohibited Use Policy」。

## 常见问题

**Q：Veo 3.1 的官网到底是哪个？**
官方的模型介绍页是 deepmind.google/models/veo/，创作入口是 Flow；不要在来历不明的「Veo 官网」里输入账号或付款信息。

**Q：免费账号能用 Veo 3.1 吗？**
官方 Flow 帮助中心写的使用条件是订阅 Google AI Plus、Pro 或 Ultra，或符合条件的 Workspace 套餐。免费用户没有列出。

**Q：之前用 Gemini API 的 Veo，现在怎么办？**
按官方提示迁移到 Gemini Omni Flash 或企业平台的正式版模型。

**Q：Gemini 为什么找不到 Veo？**
见 [/guides/gemini-not-working-official-changes](/guides/gemini-not-working-official-changes)。

## 参考资料

- Google DeepMind：Veo — https://deepmind.google/models/veo/
- Flow 帮助中心：Get started with Google Flow — https://support.google.com/flow/answer/16353333
- Flow 帮助中心：Models & supported features — https://support.google.com/flow/answer/16352836
- Flow 帮助中心：Create videos in Google Flow — https://support.google.com/flow/answer/16353334
- Gemini API：视频生成 — https://ai.google.dev/gemini-api/docs/video
- Gemini API：Veo 3.1 — https://ai.google.dev/gemini-api/docs/veo
