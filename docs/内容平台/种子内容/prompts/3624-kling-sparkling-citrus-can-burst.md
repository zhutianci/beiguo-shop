---
title: 可灵提示词：气泡饮料广告视频（柑橘片悬浮 + 拉环喷雾 · 易拉罐转台定格）
slug: kling-sparkling-citrus-can-burst
model: kling
topics: [product-video, food]
aspectRatio: "9:16"
needsRefImage: true
useCase: 易拉罐、瓶装饮料、气泡水的清爽夏日广告：水果片和水珠在罐子周围失重漂浮、拉环开启喷出细雾、罐子转正对镜头，适合饮品新品海报动态版、外卖平台和信息流投放。
prompt: |
  以我上传的饮料罐图为准，生成一条约 6 秒的竖屏 9:16 饮料广告，高调明亮风格，背景是柔和的[蜜桃色渐变]。
  0–2 秒：失重的[西柚片和青柠片]在挂着冰霜的易拉罐周围漂浮，水珠在慢动作中环绕旋转。
  2–4 秒：拉环被打开，一股细腻的雾气喷出，气泡丝一缕缕向上涌，一瓣柑橘爆开，果汁四溅。
  4–6 秒：易拉罐转正对着镜头，罐身标签清晰对焦，一颗凝结水珠沿着铝罐慢慢滑下。
  镜头：开场锁定机位，随后转台式缓慢环绕 15 度，85mm 镜头。
  光线：明亮的反射柔光箱主光，罐身干净的高光过渡，边缘带淡淡的彩色轮廓光。
  罐身轮廓和标签图案始终稳定，水果和气泡清晰：不扭曲、不重影、不重复、不漂移。
  声音：拉环"嗤"的一声，气泡嘶嘶声，一声轻微的冰块碰响。
negativePrompt: 罐身变形，标签扭曲，重复的易拉罐，水果穿模，液体凭空出现，乱码文字，水印
source:
  repo: LichAmnesia/awesome-ad-video-prompts
  url: https://github.com/LichAmnesia/awesome-ad-video-prompts#sparkling-citrus-burst
  author: "awesome-ad-video-prompts contributors"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文；补充\"以上传的饮料罐图为准\"和负面提示词；背景颜色、水果改为变量"
images:
  - 3624-kling-sparkling-citrus-can-burst-1.jpg
imageCredit:
  by: "LichAmnesia/awesome-ad-video-prompts"
  url: https://github.com/LichAmnesia/awesome-ad-video-prompts/blob/main/images/sparkling-citrus-burst.png
  license: CC BY 4.0
verify:
  - 可灵实测 3 次：拉环打开时是否出现第二个拉环或罐身变形
  - 示例图是仓库提供的关键帧图（已转 JPG 压缩）
---
**时长与镜头**：6 秒三段：漂浮 → 开罐喷雾 → 转正定格。饮料广告的"爽感"来自三个元素：悬浮的配料、喷发的气泡、滑落的水珠，三段各管一个。可灵 5 秒档可删掉果汁爆开；10 秒档可以在最后加"一只手握住罐子拿出画面"。

**怎么填变量**：[蜜桃色渐变] 背景最好取包装主色的浅色版；[西柚片和青柠片] 换成饮料的真实口味，例如"白桃块""薄荷叶和冰块""咖啡豆"。首帧用白底或纯色底的产品图，让模型补背景和配料。

**常见失败与调整**：
- 罐身标签在转动时扭曲：把"转台环绕 15 度"改成"镜头缓慢推近"，最后一秒用真实产品图定格。
- 水果片穿过罐子：写"水果在罐子周围一圈漂浮，与罐子保持距离"。
- 喷雾太大遮住罐子：写"一小股细雾"。

> 改编自 [LichAmnesia/awesome-ad-video-prompts](https://github.com/LichAmnesia/awesome-ad-video-prompts)（awesome-ad-video-prompts contributors），许可证 CC BY 4.0。

### 英文原版

```
High-key product hero of a chilled [product] sparkling citrus can against a soft peach gradient sweep. 0-2s: weightless grapefruit and lime wheels drift around the frosted can, droplets orbiting in slow motion; 2-4s: the tab cracks and a crisp jet of fine mist erupts, carbonation threads streaming upward as a citrus segment bursts with juice spray; 4-6s: the can rotates to square with the lens, the [brand] label snapping into sharp focus while one bead of condensation traces down the aluminum. Locked-off open, then a slow 15-degree turntable orbit, 85mm. Bright bounced softbox key, clean specular roll-off on the can, faint colored edge light. Can silhouette and label artwork stay perfectly stable, fruit and bubbles resolve cleanly with no warping, ghosting, duplication, drift, or artifacts. Implied sound: the pssht of the tab, effervescent fizz, a faint ice tink.
```
