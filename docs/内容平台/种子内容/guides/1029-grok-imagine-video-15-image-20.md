---
title: Grok Imagine 视频 1.5 与图片 2.0：新版本能做什么、规格和价格有什么变化
slug: grok-imagine-video-15-image-20
products: [grok]
models: []
accountTier: OTHER
excerpt: Grok Imagine 新模型 video-1.5 和 image-2.0 有什么不同？按官方文档：视频原生 1080p、最长 15 秒、口型同步、最多 14 张参考图；图片支持 2K、质量档和 5 张参考图改图，附 API 标价（2026-10 查询）。
checkedOn: 2026-10-25
sources:
  - https://docs.x.ai/developers/model-capabilities/video/overview
  - https://docs.x.ai/developers/model-capabilities/imagine
  - https://docs.x.ai/developers/model-capabilities/images/generation
  - https://docs.x.ai/developers/pricing
  - https://docs.x.ai/developers/release-notes
  - https://x.ai/grok
  - https://docs.x.ai/grok/faq
verify:
  - 规格与价格取自 xAI 开发者文档（API），grok.com 和手机 App 里提供的分辨率、时长、入口可能与 API 不同；官方产品页对 App 的说法是「最高 2K 图片、15 秒视频，文生视频 720p」，本文把两处分开写
  - 官方没有公布各订阅档位每周能生成多少张图或多少秒视频，App 里的生成按算力从每周用量池扣
  - 官方发布说明写明 grok-imagine-image-quality 将在 2026-11-02 退役，请求改由 grok-imagine-image-2.0 的 low 质量处理；这是官方已公布的计划，到期后以官方为准
  - 「video-1.5 的文生视频内部先生成首帧再转视频」来自官方 7 月发布说明，视频 1.5 参考图 + 15 秒 + 720p 的组合限制来自官方规格表
  - 生成内容带 Grok 水印、没有去除设置，来自官方 FAQ；本文不涉及去水印
  - 本站已有的 553 号文章写的是 App 内 Imagine 的通用用法，本文只讲新模型版本的差异
---

> 本文根据 xAI 官方开发者文档（docs.x.ai）、产品页和 FAQ 整理，资料核对于 2026-10-25，价格为「2026-10 查询」。模型更新很快，**以官方文档为准**。图为本站整理的示意图。App 内 Imagine 的通用用法见 [/guides/grok-imagine-image-video](/guides/grok-imagine-image-video)。

## 适用于谁

- 搜「grok imagine video 1.5」「grok imagine image 2.0」的人；
- 想知道新版本比旧版多了什么能力、价格差多少的人；
- 要在程序里调用 Grok 生图、生视频接口的开发者。

## 结论先说

1. **视频：grok-imagine-video-1.5** 是官方当前列出的最新视频模型。官方描述：能生成口型同步的语音，文生视频和图生视频原生 1080p，最多 14 张参考图和 3 个声音参考，可以指定首帧、尾帧和中间关键帧，单段最长 15 秒。
2. **还有一个轻量版 video-1.5-lite**：同样 1 到 15 秒、带口型同步音频，1080p 是从 720p 放大得到的，价格明显更低，但不支持参考图、首尾帧、关键帧。
3. **旧模型 grok-imagine-video 没有被取代**：它仍然是官方列出的唯一支持视频编辑和视频延长的模型，最高 720p。
4. **图片：grok-imagine-image-2.0** 支持 1K、1.5K、2K 分辨率，质量参数 low、medium、auto，编辑时最多带 5 张参考图，还支持 21:9 和 5:2 的画幅。
5. **App 里怎么算**：在 Grok 里生成按周用量池扣，见 [/guides/grok-usage-limit-weekly-pool-why](/guides/grok-usage-limit-weekly-pool-why)；需要订阅可看 [/chongzhi/grok-super](/chongzhi/grok-super)。

## 一、视频：1.5 和旧版、lite 版比

![Grok Imagine 三个视频模型的规格与价格对比](seed:g1029-grok-imagine-video-models.png)
*图：本站根据 [docs.x.ai Video Overview](https://docs.x.ai/developers/model-capabilities/video/overview) 与 [Pricing](https://docs.x.ai/developers/pricing) 整理的示意图，价格为 API 标价*

官方规格表里值得注意的点：

- **参考图生视频**：video-1.5 最多 14 张参考图，组合限制是 15 秒、720p；旧版最多 7 张、10 秒。参考图用来提供人物、产品、场景，不固定第一帧；
- **声音参考**：video-1.5 可以给最多 3 个角色指定预设声音，生成口型同步的说话；用自己的音频做声音参考，官方说仅对受信任的合作方按申请开放；
- **首帧、尾帧、关键帧**：video-1.5 可以设首帧、尾帧和最多 4 个中间关键帧，模型补全中间动作；把同一张图设为首帧和尾帧，可以做循环；
- **文生视频的做法**：官方 7 月发布说明提到，video-1.5 的文生视频内部是先文生图、再图生视频；
- **图生视频**：你给的图就是第一帧，输出画幅自动与原图一致；
- **分辨率、时长、画幅**：480p、720p、1080p；1 到 15 秒（默认 8 秒）；画幅有 1:1、16:9、9:16、4:3、3:4、3:2、2:3、21:9、5:2；
- **音频**：默认带音轨，可以要求生成无声视频；
- **接口方式**：异步，提交后用返回的 request_id 轮询，再下载视频。

### 官方 App 里能用到什么

官方 x.ai/grok 页面对 App 里的 Imagine 写的是：文生图、文生视频放在同一个对话里，最高 2K 分辨率、15 秒视频，文生视频 720p。官方 FAQ 还说明：720p 视频在你达到所在档位的 720p 上限后会自动降到 480p；生成的图片和视频都带 Grok 水印，没有去除水印的设置。API 文档里的 1080p 等规格是否在 App 开放，以你界面里实际显示为准。

## 二、图片：image-2.0 的变化

![Grok Imagine 图片模型 2.0 与 1.0 的规格对比](seed:g1029-grok-imagine-image-models.png)
*图：本站根据 [docs.x.ai Pricing](https://docs.x.ai/developers/pricing) 与 [Imagine 文档](https://docs.x.ai/developers/model-capabilities/images/generation) 整理的示意图*

- **分辨率与质量**：1K（默认）、2K 等；质量参数默认是 auto，官方说目前 auto 在生成时用 low、在编辑时用 medium，按实际用到的质量计费；
- **一次多张**：每个请求最多生成 10 张；
- **改图**：8 月起每个请求最多可以带 5 张参考图（原来是 3 张），可以合并主体、迁移风格、组合场景；
- **画幅**：新增 21:9（电影宽屏）和 5:2（宽横幅）；
- **旧版退役**：官方发布说明写明，`grok-imagine-image-quality` 将在 2026 年 11 月 2 日退役，之后的请求由 image-2.0 的 low 质量处理，价格更低；`grok-imagine-image`（1.0）不受影响。

## 三、API 价格速查（2026-10 查询）

官方价格页，美元：

| 模型 | 项目 | 价格 |
| --- | --- | --- |
| grok-imagine-image-2.0 | 1K / 1.5K / 2K，low | 每张 0.04 / 0.05 / 0.06 |
| grok-imagine-image-2.0 | 1K / 1.5K / 2K，medium | 每张 0.06 / 0.07 / 0.08 |
| grok-imagine-image | 1K 或 2K | 每张 0.02 |
| grok-imagine-video-1.5 | 480p / 720p / 1080p | 每秒 0.08 / 0.14 / 0.25 |
| grok-imagine-video-1.5-lite | 480p / 720p / 1080p | 每秒 0.02 / 0.03 / 0.14 |
| grok-imagine-video | 480p / 720p | 每秒 0.05 / 0.07 |

图片编辑按输入图片和输出图片分别计费，输入图每张约 0.01 美元起（image-2.0 与 1.5 视频的输入图价）。具体见官方页面。API Key 怎么拿、其他价格，见 [/guides/grok-api-pricing-api-key](/guides/grok-api-pricing-api-key)。

## 常见问题

**Q：我在 App 里能选到 video-1.5 吗？**
官方产品页没有写 App 里显示的模型名。以界面为准；本文讲的规格来自开发者文档。

**Q：提示词怎么写？**
官方文档建议文生视频要描述镜头、运镜、光线和声音；改视频时要说明哪些东西保持不变。更多 App 内的写法见 [/guides/grok-imagine-image-video](/guides/grok-imagine-image-video)。

**Q：视频带水印能去掉吗？**
官方说没有这个设置，并且去除、修改或遮挡水印违反使用政策。

## 参考资料

- docs.x.ai：Video Overview — https://docs.x.ai/developers/model-capabilities/video/overview
- docs.x.ai：Imagine Overview — https://docs.x.ai/developers/model-capabilities/imagine
- docs.x.ai：Image Generation — https://docs.x.ai/developers/model-capabilities/images/generation
- docs.x.ai：Pricing — https://docs.x.ai/developers/pricing
- docs.x.ai：Release Notes — https://docs.x.ai/developers/release-notes
- Grok 官方：Grok — https://x.ai/grok
- docs.x.ai：Grok FAQ — https://docs.x.ai/grok/faq
