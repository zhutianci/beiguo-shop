---
title: Gemini 生成的图片有水印吗：可见水印、SynthID 与发布时的合规要求
slug: gemini-image-watermark-synthid
products: [gemini]
models: [nano-banana]
accountTier: FREE
excerpt: Gemini / Nano Banana 生成的图片和视频带什么水印？可见的星形标记能不能关？看不见的 SynthID 是什么、怎么验证？本文按 Google 官方资料讲清两类水印，并说明在国内发布 AI 图片时删除标识可能违反的规定。
checkedOn: 2026-10-07
sources:
  - https://support.google.com/gemini/answer/16722517?hl=en
  - https://support.google.com/flow/answer/16353333?hl=en
  - https://ai.google.dev/gemini-api/docs/image-generation
  - https://blog.google/innovation-and-ai/technology/ai/nano-banana-2/
  - https://gemini.google/overview/video-generation/
  - https://policies.google.com/terms/generative-ai/use-policy
  - https://www.cac.gov.cn/2025-03/14/c_1743654684782215.htm
---

## 适用于谁

- 搜「Gemini 水印长怎样」「Gemini 生图浮水印」「Gemini nano banana 水印」的人；
- 用 Gemini 做了图，想知道能不能放进商业设计、发到社交平台的人；
- 想核实一张图是不是 Google AI 生成的人。

本文根据 Google 官方帮助中心、官方博客、Gemini API 文档，以及国家网信办《人工智能生成合成内容标识办法》整理，资料核对于 2026-10-07。**本文不提供任何去除水印的工具或方法**；涉及合规问题请以法规原文和平台规则为准。

## 结论先说

1. **Google 的 AI 内容有两类标记**：
   - **SynthID 不可见水印**：嵌在像素 / 画面 / 音频里，肉眼看不见。官方说明 Gemini App 生成的视频、所有 Nano Banana 生成的图片、Flow 里用 Veo / Omni / Nano Banana 生成的内容，都带 SynthID；
   - **可见水印**：画面角落的星形标记。Flow 官方帮助中心写明，可以在头像下拉菜单里通过「Visible watermarking（可见水印）」开关控制，居住在印度、韩国、越南的用户会自动加可见水印。
2. **SynthID 不能靠裁剪、调色、压缩轻易抹掉**：官方说明图片被缩放、改色、压缩或做其他修改后，水印通常仍然存在。
3. **Google 还在推进 C2PA 内容凭证**：官方博客称将 SynthID 与可互操作的 C2PA Content Credentials 结合，不仅说明「是否用了 AI」，还说明「怎么用的」。
4. **在国内发布要主动声明**：按《人工智能生成合成内容标识办法》，发布 AI 生成内容时应主动声明并使用平台的标识功能，**任何组织和个人不得恶意删除、篡改、伪造、隐匿 AI 内容标识**。

## 两类水印分别是什么

| | SynthID | 可见水印 |
| --- | --- | --- |
| 看得见吗 | 看不见 | 看得见（角落小标记） |
| 作用 | 让工具识别「由 Google AI 生成或编辑」 | 让观众一眼知道是 AI 生成 |
| 能否关闭 | 不能，官方说明生成内容都会嵌入 | Flow 有官方开关；部分地区强制显示 |
| 和对方关系 | 识别依据，修改后通常仍可检测 | 只是画面上的提示，有没有它都不影响 SynthID |

关于 Gemini App 里的可见标记：有媒体报道 Gemini 新增了关闭可见水印的设置，但截至本文核对时，Gemini 帮助中心的生图页面没有对应说明，请以你账号里实际看到的设置为准。

## 怎么验证一张图是不是 Google AI 生成的

Gemini App 内置了验证工具（需登录）：

1. 打开 gemini.google.com，点 **Add files（添加文件）**，上传要检查的图片、视频或音频（一次一个文件，100MB 以内；视频不超过 90 秒，音频不超过 1 小时）；
2. 提问：「这张图是 Google AI 生成或编辑的吗？」「这是 AI 生成的吗？」；
3. 查看结果。

结果怎么读：

- **检测到 SynthID**：整张或部分内容由 Google AI 生成或编辑；视频会标出检测到水印的片段；
- **没检测到**：说明不是 Google AI 生成或编辑的，但**可能是其他 AI 工具生成的**——Gemini 目前只能识别 Google AI 工具生成的内容；
- **无法判断**：常见原因是画面太简单抽象「细节不足以嵌入水印」，或者「改动太小」；
- 如果文件带 C2PA 内容凭证，还能看到素材构成、编辑历史和是否用了 AI（网页版和 Android 已支持，iOS 即将支持）。

截图验证时，官方建议**紧贴图片裁剪**，不要上传多张不同图片拼成的拼图。验证功能有每日次数限制。

## 用在商业设计、社交平台前要注意什么

1. **不要试图去掉 SynthID 或伪造来源**。Google 生成式 AI 禁止使用政策明确禁止「为了欺骗，谎称生成内容完全由人类创作」，也禁止规避安全保护措施。
2. **国内平台发布要标注**。《人工智能生成合成内容标识办法》要求：
   - 服务提供者在生成内容中添加显式标识（如图片上的提示标识）和隐式标识（文件元数据）；
   - 用户发布生成合成内容时，应**主动声明**并使用平台提供的标识功能；
   - 不得恶意删除、篡改、伪造、隐匿标识，也不得为他人提供这类工具或服务。
   如果你需要不带显式标识的版本用于正当用途，办法规定可以由服务提供者在用户协议明确用户标识义务后提供，并留存日志——也就是说，应通过**官方提供的选项**获得，而不是自行抹除。
3. **可见水印 ≠ 版权声明**。去掉可见标记不会改变作品是 AI 生成的事实；作品能否受著作权保护、是否侵犯他人权利，需要另行判断（见《AI生成图片有版权吗、能商用吗》）。

## 常见问题

**Q：Gemini 生成的图片上那个小星星就是水印吗？**
那是可见标记；真正用于识别的是看不见的 SynthID。即使画面上没有可见标记，文件里通常仍有 SynthID。

**Q：我把 AI 图片截图、裁剪、加滤镜后，还能被识别吗？**
官方说明 SynthID 在缩放、改色、压缩等修改后通常仍可检测，但多次修改后也有可能检测不到。

**Q：别人用其他 AI 工具生成的图，Gemini 能识别吗？**
官方说明虽然其他公司开始采用 SynthID，但 Gemini 目前只能识别由 Google AI 工具生成的内容。对于其他图片，可以结合 C2PA 凭证、反向搜图和元数据来判断。

**Q：有没有官方不带可见水印的出图方式？**
Flow 提供「Visible watermarking」开关（部分地区强制开启）。无论是否显示可见标记，SynthID 都会保留；在国内发布时仍需按规定声明 AI 生成。

## 参考资料

- Gemini Apps Help：Verify AI-generated images, videos, and audio — https://support.google.com/gemini/answer/16722517?hl=en
- Google Flow Help：Get started with Google Flow（水印说明）— https://support.google.com/flow/answer/16353333?hl=en
- Google AI for Developers：Image generation（Limitations）— https://ai.google.dev/gemini-api/docs/image-generation
- Google 官方博客：Nano Banana 2（SynthID 与 C2PA）— https://blog.google/innovation-and-ai/technology/ai/nano-banana-2/
- Gemini 官网：Gemini Omni 视频生成（SynthID）— https://gemini.google/overview/video-generation/
- Google：Generative AI Prohibited Use Policy — https://policies.google.com/terms/generative-ai/use-policy
- 国家网信办等：《人工智能生成合成内容标识办法》— https://www.cac.gov.cn/2025-03/14/c_1743654684782215.htm
