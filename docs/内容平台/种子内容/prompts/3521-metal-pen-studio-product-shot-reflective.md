---
title: "ai产品图提示词：金属签字笔影棚主图，深灰渐变背景 + 反光台面的极简质感（Nano Banana）"
slug: metal-pen-studio-product-shot-reflective
model: nano-banana
topics: [ecommerce, photography]
modelLabel: Nano Banana Pro
aspectRatio: "3:4"
needsRefImage: false
useCase: "给笔、手表、刀具、电子烟杆这类细长的金属小件做一张干净的\"白底图进阶版\"：产品斜放在反光台面上，深色渐变背景，柔和的条形高光把金属质感和刻纹带出来，适合详情页首图。"
prompt: |
  请拍一张像品牌官网首图那样的影棚产品照，超写实，竖版 3:4。
  - 拍的是：[一支高级按动式签字笔]，位于画面中央，斜向摆放（笔尖朝左下、笔帽朝右上），角度优雅；笔身是[枪灰色拉丝金属]，能看到细密的拉丝纹理、笔夹、笔身中段的装饰环和浅浅的几何刻纹。
  - 台面：干净的深色反光台面，笔身下方有一段清晰而柔和的倒影。
  - 光线：柔和的电影感布光，一条长长的条形柔光沿笔身形成连续的高光，暗部保留细节，突出做工。
  - 背景：极简的[深灰到暖灰]平滑渐变，没有任何杂物。
  - 质感：高端商业广告风格，材质细节极其丰富，产品全身对焦清晰，背景略有景深；现代、克制、有品牌感。
  - 画面中不出现文字和水印，产品不能有任何虚焦。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-nano-banana-pro-prompts
  url: https://x.com/Milo_Bahi_02/status/2012843154928783620
  author: "@Milo_Bahi_02"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文并整理为分条；产品、材质颜色、背景色调改为变量；按示例图补充了摆放角度、台面倒影和条形柔光"
images:
  - 3521-metal-pen-studio-product-shot-reflective-1.jpg
imageCredit:
  by: "@Milo_Bahi_02"
  url: https://youmind.com/nano-banana-pro-prompts?id=6647
  license: CC BY 4.0
verify:
  - "上线前在 Nano Banana 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：产品换成任何细长或小巧的硬质单品，如"一把折叠小刀""一只机械腕表""一支金属外壳的口红"；材质颜色一栏写"颜色 + 表面工艺"（镜面银、磨砂黑、玫瑰金拉丝）；背景色调跟产品走，冷色金属配"深灰到蓝灰"，暖色金属配"深棕到香槟色"。需要放品牌刻字时，加一句"笔夹上有极小的刻字 XXX"，但小字容易出错，建议后期添加。

示例图是一支枪灰色的金属按动笔，从右上斜向左下摆在深灰色的反光台面上，笔身上能看到拉丝纹理、中段的金属环和浅浅的六边形刻纹，笔下方有一条柔和的倒影；背景是从深灰过渡到暖灰的渐变，右下角有生成工具自带的四角星标记。

**常见问题**：
- 高光过曝成一片白：写"高光是柔和的长条形，不过曝，保留金属纹理"。
- 产品被裁掉一端：强调"产品完整入镜，四周留白"。
- 形状走样（笔尖、笔夹不合理）：上传一张实物图，让模型按实物还原再套用这套布光。

**适合**：文具、腕表、小型数码和金属配件的详情页首图、品牌社媒图。

### 英文原版

```text
Ultra-realistic professional studio product photography of a premium ballpoint pen, perfectly centered on a clean reflective surface.
The pen is angled slightly for elegance, showcasing metallic texture, engraved details, and realistic reflections.
Soft cinematic lighting with subtle highlights and shadows to emphasize craftsmanship.
Minimalist luxury background with smooth gradient tones.
High-end commercial advertising style, hyper detailed materials, sharp focus, depth of field, editorial product shot.
No text, no watermark, no blur.
Image Size: 3:4
Resolution: 8K
Style: Premium, modern, minimalist, luxury branding
```

> 改编自 [@Milo_Bahi_02](https://x.com/Milo_Bahi_02/status/2012843154928783620) 发布、[YouMind-OpenLab/awesome-nano-banana-pro-prompts](https://github.com/YouMind-OpenLab/awesome-nano-banana-pro-prompts) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
