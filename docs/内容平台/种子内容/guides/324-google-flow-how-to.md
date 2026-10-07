---
title: Google Flow 怎么用：用 Veo 3.1 和 Gemini Omni 做多镜头 AI 视频
slug: google-flow-how-to
products: [gemini, ai-tools]
models: [veo]
accountTier: PRO
excerpt: Google Flow 是 Google 的 AI 影视创作工具，可以选 Veo 3.1 或 Gemini Omni 生成视频、用首尾帧和参考素材保持一致，再在 Scenebuilder 里拼成完整片段。本文按官方帮助中心讲清门槛、积分、各模型差异和完整操作。
checkedOn: 2026-10-07
sources:
  - https://support.google.com/flow/answer/16353333?hl=en
  - https://support.google.com/flow/answer/16352836?hl=en
  - https://support.google.com/flow/answer/16353334?hl=en
  - https://support.google.com/flow/answer/16935718?hl=en
  - https://support.google.com/flow/answer/16526234?hl=en
  - https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-omni/
---

## 适用于谁

- 搜「Google Flow 怎么用」「Google Flow 是什么」「flow veo 3.1」的人；
- 想做的不只是一条 8 秒小视频，而是多个镜头组成的短片、广告、分镜的人；
- 在 Gemini App 里找不到 Veo，想继续用 Veo 的人。

本文根据 Google Flow 官方帮助中心与 Google 官方博客整理，资料核对于 2026-10-07；功能、积分消耗随时可能调整，以产品内显示为准。

## 结论先说

1. **Flow 是 Google 的 AI 影视创作工具**，集成了 Veo 3.1（Lite / Fast / Quality）、Gemini Omni Flash 视频模型和 Nano Banana 图像模型，电脑端功能最全，也有手机 App。
2. **门槛**：年满 18 岁并完成年龄验证、身处支持的地区、订阅 Google AI Plus / Pro / Ultra（符合条件的 Workspace 套餐每天有 50 积分）。官方明确说明 **VPN 不能让不支持地区的用户使用**。
3. **按积分计费**：每个模型每次生成消耗不同积分，失败不扣分；在提示框右上角的设置里能看到当前模型的实时价格。
4. **核心工作流**：先生图做素材 → 用文字 / 首尾帧 / 参考素材（Ingredients）生成镜头 → 编辑或延长 → 在 **Scenebuilder** 里排序剪辑 → 下载。

## 先选模型：Veo 3.1 和 Gemini Omni 有什么不同

按官方「模型与支持功能」页整理：

| 功能 | Veo 3.1 Lite | Veo 3.1 Fast | Veo 3.1 Quality | Gemini Omni Flash 1.1 |
| --- | --- | --- | --- | --- |
| 文字生成视频 | 4/6/8 秒 | 4/6/8 秒 | 4/6/8 秒 | 4/6/8/10 秒 |
| 首帧 / 首尾帧 | 支持 | 支持 | 支持 | 支持（首尾帧目前仅网页版） |
| 参考素材（Ingredients） | 仅 8 秒 | 仅 8 秒 | 不支持 | 支持 |
| 延长视频 | 支持 | 不支持 | 不支持 | 即将推出 |
| 视频改视频 | 不支持 | 不支持 | 不支持 | 支持（最长 10 秒片段） |

补充几点：

- 所有 Veo 3.1 生成的 8 秒视频都可以延长，但延长这一步要用 **Veo 3.1 Lite** 来做；
- Omni 有标准 720p 和草稿 360p 两档，360p 积分减半，Pro / Ultra 用户可以免费把 360p 升到 720p；
- 图像模型：Nano Banana Pro（Ultra 默认）、Nano Banana 2.1、Nano Banana 2 Lite（免费可用的默认模型）。

如果你选的功能当前模型不支持，Flow 会提示并切到兼容的模型。

## 步骤

### 1. 打开 Flow 并新建项目

用 Chrome、Edge 等 Chromium 内核浏览器打开 Google Flow（官方推荐电脑端），新建或打开一个项目。

### 2. 用提示框生成一个镜头

1. 在提示框里详细描述画面：**主体、动作、环境、光线、风格**；
2. 点模型名称（默认是图像模型 Nano Banana Pro），切到 **Video**；
3. 选择画幅、生成数量、模型和时长；
4. 点 **Generate（生成）**。

也可以打开提示框里的 **Agent** 开关，让 Flow 代理帮你生成，比如一次说「给我 5 个不同光线的版本」。

### 3. 用首尾帧做过渡

点模型名称 → **Video → Frames**，把图片拖到「+ Add start frame」和「+ Add end frame」，再在提示词里描述两帧之间发生了什么。适合做变身、转场、产品从包装到展开等效果。

### 4. 用参考素材保持角色和物品一致

点模型名称 → **Video → Ingredients**，把人物、物品、场景图拖进来（或在提示框输入 @ 选择项目里的素材），然后写清楚它们怎么组合。官方示例：用一位女士、一盏熔岩灯和雾中街道三张素材，写「这位女士的上半身是熔岩灯，走在雾气弥漫的街道上」。

官方建议：

- 人物或产品参考图用**纯色或干净的背景**；
- 场景和风格参考里不要混入多余的主体；
- 文字提示要和素材互相补充，不要矛盾；几张素材的风格尽量统一。

在 Omni Flash 下，还可以给参考素材加**声音**：Add → Voices 选择预设音色，提示词里写 `@Voice: 名称`；也能基于预设音色描述口音、质感，创建自定义音色。

### 5. 编辑和延长

- **延长**：点开一条 Veo 生成的视频，点底部 **Extend**，描述接下来的动作。延长后的片段不能再用插入、移除、镜头等其他编辑模式。
- **用 Omni 改视频**：把视频模型切到 Omni Flash，上传 60 秒以内、1GB 以内的 .mov / .mp4 / .avi / .wmv（超过 30 秒要先裁到 30 秒），选取最多 10 秒的片段，写修改指令，例如「把光线改成电影感的日落」。同一条视频最多可以连续对话修改 3 轮而不丢失上下文。
- 每次修改都不会覆盖原片，右侧 **History** 面板里能找回所有版本；暂停在某一帧可以 **Save frame**，存成图片做下一镜的首帧或参考。

### 6. 在 Scenebuilder 里拼成短片

悬停在片段上点 **More → Add to Scene**，进入 Scenebuilder 后可以：拖动排序、用两端手柄裁剪每段、预览整段、下载整个场景。

## 积分怎么算

| 模型 | 每次生成消耗（官方页面） |
| --- | --- |
| Veo 3.1 Lite | 非 Ultra 用户 10，Ultra 用户 5 |
| Veo 3.1 Fast | 非 Ultra 用户 20，Ultra 用户 10 |
| Veo 3.1 Quality | 100 |
| Gemini Omni Flash 720p | 4 秒 7、6 秒 10、8 秒 12、10 秒 15 |
| Gemini Omni Flash 360p | 4 秒 4、6 秒 5、8 秒 6、10 秒 7 |

- 官方说明每个账号每天有 50 个 Flow 积分；订阅用户每月另有额外积分（AI Plus 200、AI Pro 1,000、AI Ultra 更多），月度积分在账单周期开始时刷新，**不结转**；
- 一次请求可能生成多条视频，积分按条计算；
- 未订阅用户在高峰时段（大约 UTC 14:00–17:00）可能无法生成视频；
- 剩余积分在右上角头像下方查看。

## 常见问题

**Q：已经订阅了 Google AI Pro，为什么还是进不去 Flow？**
官方说明 Flow 并非在所有提供 Google AI Pro 的国家都可用，购买前应先查看支持地区列表；VPN 不能解决地区限制。在支持地区仍进不去，联系 Google One 支持。

**Q：生成失败会扣积分吗？**
不会。官方说明失败的生成不扣积分；遇到「Audio Generation Failed」（音频质量不达标）时积分也会退回。

**Q：提示「You're requesting generations too quickly」？**
Flow 会对短时间内大量生成做限流，尤其是零积分模型；当天生成很多次后，每分钟允许的次数会下降。稍等再试。

**Q：提示「We noticed some unusual activity」？**
官方建议过几分钟再试，并关闭 VPN 或代理。

**Q：Flow 生成的视频有水印吗？**
所有用 Veo、Omni、Nano Banana 生成的内容都带不可见的 SynthID 水印；另外可以在头像下拉菜单里开关「Visible watermarking（可见水印）」，居住在印度、韩国、越南的用户会自动加可见水印。

**Q：能商用吗？**
官方 FAQ 引用 Google 服务条款：对于你生成的原创内容，Google 不会主张所有权；但必须完整遵守服务条款和生成式 AI 禁止使用政策。

## 参考资料

- Google Flow Help：Get started with Google Flow — https://support.google.com/flow/answer/16353333?hl=en
- Google Flow Help：Learn about Google Flow models & supported features — https://support.google.com/flow/answer/16352836?hl=en
- Google Flow Help：Create videos in Google Flow — https://support.google.com/flow/answer/16353334?hl=en
- Google Flow Help：Edit videos & build scenes in Google Flow — https://support.google.com/flow/answer/16935718?hl=en
- Google Flow Help：Manage your Google Flow credits — https://support.google.com/flow/answer/16526234?hl=en
- Google 官方博客：Introducing Gemini Omni — https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-omni/
