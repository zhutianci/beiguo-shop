---
title: 可灵提示词：手表礼盒开箱视频（胡桃木抽屉滑开—上弦—表扣咔哒 · 腕表 ASMR）
slug: kling-watch-box-drawer-unboxing
model: kling
topics: [product-video, ecommerce]
aspectRatio: "9:16"
needsRefImage: true
useCase: 手表、首饰、钢笔等高客单价礼品的开箱视频：木质表盒抽屉滑开、拿起手表让光扫过表盘、拧表冠秒针走动、表扣扣上，适合礼品季营销和直播间展示素材。
prompt: |
  以我上传的手表图为准，生成一条约 8 秒的竖屏 9:16 开箱视频。
  场景：低角度四分之三微距，一只亮漆[胡桃木]表盒，里面是一块[自动机械腕表]，深炭灰色丝绒衬底，暖色布光。
  0–2 秒：指尖勾住黄铜拉环，衬着毛毡的抽屉平滑地滑开，发出低沉顺滑的声响，露出躺在弧形表枕上的手表。
  2–4 秒：手表被拿起、轻轻倾斜，一道硬质主光扫过拉丝钢表壳和[太阳纹表盘]，一道亮光沿着表镜移动。
  4–6 秒：拇指和食指拧动表冠，发出细密的棘轮"嗒嗒"声，秒针开始连续地扫动。
  6–8 秒：表带被平放，折叠表扣"咔哒"一声精准扣上，镜头移焦到刻字的表背。
  画面：低调的产品布光，丰富的反射，清脆的制表 ASMR。
  表壳形状、表盘刻度和指针数量每一帧都一致：不变形、不出现双指针、刻字不糊。
negativePrompt: 表盘变形，指针数量错误，双指针，刻字模糊，手指畸形，多余的手，抽屉穿模，水印
source:
  repo: LichAmnesia/awesome-ad-video-prompts
  url: https://github.com/LichAmnesia/awesome-ad-video-prompts#watch-drawer-slide
  author: "awesome-ad-video-prompts contributors"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文；补充\"以上传的手表图为准\"和负面提示词；表盒材质、表款、表盘改为变量"
images:
  - 3621-kling-watch-box-drawer-unboxing-1.jpg
imageCredit:
  by: "LichAmnesia/awesome-ad-video-prompts"
  url: https://github.com/LichAmnesia/awesome-ad-video-prompts/blob/main/images/watch-drawer-slide.png
  license: CC BY 4.0
verify:
  - 可灵实测 3 次：拧表冠时手指与表冠是否穿模、秒针是否连续
  - 示例图是仓库提供的关键帧图（已转 JPG 压缩）
---
**时长与镜头**：8 秒四拍：抽屉滑开 → 拿起倾斜扫光 → 上弦秒针走 → 表扣扣上 + 移焦表背。每一拍都配一个"声音点"（滑动、无、棘轮声、咔哒），这是开箱 ASMR 的节奏。可灵 5 秒档建议只做前两拍；后两拍用手表特写图另做一条。本站另有一条"制表师组装机芯"的品牌工艺片，那条讲匠心，这条是电商开箱展示。

**怎么填变量**：[自动机械腕表] 和 [太阳纹表盘] 按实物写清楚，最好加上"三根指针""12 个刻度"等细节帮助模型保持表盘结构；首饰把"拧表冠"换成"把项链从表枕上提起，吊坠轻轻晃动"。

**常见失败与调整**：
- 表盘指针变成四根：在提示词写明指针数量，负面提示词保留"双指针"。
- 拿起手表后表带消失：写"手表连着表带一起被拿起"。
- 表背刻字变乱码：移焦到表背那句可以删掉，用真实产品图做最后的定格。

> 改编自 [LichAmnesia/awesome-ad-video-prompts](https://github.com/LichAmnesia/awesome-ad-video-prompts)（awesome-ad-video-prompts contributors），许可证 CC BY 4.0。

### 英文原版

```
Low three-quarter macro on a lacquered walnut presentation box for [brand] [product], an automatic wristwatch, lit warm against deep charcoal velvet. 0-2s: a fingertip hooks the brass pull and a felt-lined drawer glides open with a smooth low rumble, revealing the watch nested in a curved pillow. 2-4s: the watch is lifted out and tilted so a hard key light sweeps across the brushed steel case and sunburst dial, sending a bright reflection traveling over the crystal. 4-6s: a thumb and forefinger wind the crown with a fine ratcheting tick, the second hand sweeping to life in a continuous glide. 6-8s: the strap is laid flat and the deployant clasp snaps shut with a precise metallic click as the camera racks focus to the engraved caseback. Moody product lighting, rich reflections, crisp horological ASMR. The watch keeps consistent case geometry, dial markings, and hand count across frames; no morphing, doubled hands, smeared engraving, or artifacts.
```
