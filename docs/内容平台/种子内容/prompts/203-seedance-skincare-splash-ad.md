---
title: seedance 提示词：护肤品广告视频（水花包裹面霜瓶 · 补水主题）
slug: seedance-skincare-splash-ad
model: seedance
topics: [product-video, ecommerce]
modelLabel: Seedance 2.0
aspectRatio: "16:9"
needsRefImage: true
useCase: 用一张面霜 / 精华的产品图，生成"冰蓝氛围—乳霜波浪—水花包裹—主视觉定格"的 15 秒补水主题广告，适合详情页视频、新品预热。
prompt: |
  生成一条 15 秒的超写实高端护肤品广告。产品是一个玻璃面霜瓶，瓶身标签写着"[品牌名]"，外观以我上传的产品图为准。
  0–3 秒：柔和的[冰蓝色]氛围背景，几束柔光和细小的水汽，营造干净、清爽、高级的感觉。
  3–6 秒：面霜瓶缓缓出现，立在光滑如镜的水面上，倒影真实，电影感景深；镜头慢慢推近，高光扫过[银色金属瓶盖]和玻璃瓶身。
  6–9 秒：丝滑的白色乳霜状波浪围绕瓶身优雅流动，水滴和细小气泡按真实物理漂浮。
  9–12 秒：一道晶莹的水花猛然包裹产品，瓶身始终清晰、居中、不变形；水花周围点缀[白色小花和嫩绿叶片]。
  12–15 秒：主视觉定格，面霜瓶居中，四周是水滴、花叶和柔和光晕，高端广告布光，焦点始终在产品上。
  产品的形状、标签和颜色全程保持一致；不要额外文字和水印。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-seedance-2-prompts
  url: https://x.com/Aiwithmaha/status/2101887507059351894
  author: "@Aiwithmaha"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: 英文原文译为中文并按 3 秒一段拆成时间轴；原文中的虚构产品名、主色、瓶盖、点缀元素改为变量；补充"以上传的产品图为准"和防变形约束
imageBrief: 原帖封面是纯色首帧，没有收录。请用一张白底面霜或乳液产品图（遮挡真实商标）作参考图，生成 1 条视频，截取"水面倒影"和"水花包裹"两帧作展示图。
verify:
  - 在提供 Seedance 2.0 的入口实测 3 次，记录水花段瓶身是否变形、标签文字是否保真
  - 确认原帖仍可访问、作者未另行声明保留权利
---
**时长与镜头**：五段各 3 秒，节奏是"氛围—出场—质地—高潮—定格"，这是护肤广告最常用的结构。换成精华、爽肤水时，把"乳霜波浪"换成"[透明凝胶滴落]"或"[清透水流]"即可。

**怎么填变量**：[冰蓝色] 补水类常用冰蓝、薄荷绿，修护类可用暖米色、奶油白；[白色小花和嫩绿叶片] 写你的成分卖点，比如"切开的柑橘片""芦荟叶"。

**常见失败与调整**：
- 水花一来瓶子就变形或被"吞掉"：在水花那段再强调一次"瓶身完整可见"，或把水花改成"在瓶子后方溅起"。
- 标签文字乱码：标签简单的英文名最稳；中文品牌名建议后期贴字。
- 画面太花：点缀元素只留一种，水滴和花叶不要同时堆满。

**注意**：护肤品广告要遵守广告法和化妆品宣传规定，不要用画面暗示产品没有的功效。

> 改编自 [@Aiwithmaha](https://x.com/Aiwithmaha/status/2101887507059351894) 发布、[YouMind-OpenLab/awesome-seedance-2-prompts](https://github.com/YouMind-OpenLab/awesome-seedance-2-prompts) 收录的提示词，许可证 CC BY 4.0。

### 英文原版

```
Create a 15-second ultra-realistic luxury skincare commercial featuring an elegant glass jar labeled "AQUA LUXE – DEEP HYDRATION" in a cool blue, refreshing environment. Start with a soft blue atmospheric background as gentle light rays and subtle water particles create a clean premium mood. Slowly reveal the skincare jar standing on a glossy water surface, with realistic reflections and cinematic depth of field. Gradually move the camera closer while soft highlights glide across the metallic silver lid and glass packaging. Surround the jar with smooth, silky white cream-like waves flowing gracefully around it, creating a luxurious skincare texture. Add floating water droplets and tiny bubbles moving naturally through the scene with realistic physics. Transition into a dramatic splash of crystal-clear water wrapping around the product while keeping the jar perfectly sharp and centered. Introduce delicate white flowers and fresh green leaves around the splash for a fresh hydration-inspired atmosphere. End with a beautiful hero shot of the AQUA LUXE DEEP HYDRATION jar centered against the blue background, surrounded by water droplets, flowers, and soft glowing light, with premium cinematic lighting and flawless product focus.
```
