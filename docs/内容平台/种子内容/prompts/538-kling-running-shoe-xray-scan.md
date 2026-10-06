---
title: 可灵提示词：跑鞋 X 光透视广告（扫描线透视中底 · 慢动作压缩回弹）
slug: kling-running-shoe-xray-scan
model: kling
topics: [motion-graphics, product-video, image-to-video]
aspectRatio: "16:9"
needsRefImage: true
useCase: 上传一张跑鞋产品图，生成 8 秒"扫描线扫过、鞋面变透明、露出发光的中底泡棉，脚跟落地时泡棉压缩又回弹"的科技感卖点视频；适合跑鞋、气垫、床垫、头盔等"内部结构是卖点"的产品。
prompt: |
  以我上传的跑鞋图为准，生成一条约[8]秒的跑鞋 X 光透视卖点广告，16:9 横屏。
  0–2 秒：低机位英雄角度，[黑色跑鞋]立在湿漉漉的黑色沥青地面上，一道[青色]轮廓光勾出鞋身，地面映出倒影；低沉的贝斯脉冲声。
  2–3 秒：一条细细的水平扫描线从左扫到右，扫过的地方只有鞋面变成半透明，中底保持实体，并显露出内部层层叠叠、由内发光的泡棉结构。
  3–5 秒：一记慢动作的脚跟着地，泡棉结构明显压缩、再弹回，从冲击点向外荡开一圈柔和的光波；镜头同时推近到鞋跟特写。
  5–8 秒：鞋面恢复不透明，镜头沿鞋带向上摇，焦点干脆地落到鞋侧的[品牌标识]上。
  鞋型、走线密度、中底厚度和双色配色全程不变。青色对炭黑的高反差调色，网面和橡胶质感清晰。
negativePrompt: 鞋型变形，鞋底融化，拖影，多余的鞋带孔，透明与实体之间来回闪烁，乱码文字，水印
source:
  repo: LichAmnesia/awesome-ad-video-prompts
  url: https://github.com/LichAmnesia/awesome-ad-video-prompts#x-ray-energy-return-running-midsole
  author: awesome-ad-video-prompts contributors
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: 英文原文译为中文；原文为通用视频模型提示词（适用 Seedance / Veo / 可灵 / Runway），本站按可灵图生视频的用法补充"以上传的图为准"和负面提示词；鞋款、光色、标识改为变量
images:
  - 538-kling-running-shoe-xray-scan-1.jpg
imageCredit:
  by: LichAmnesia/awesome-ad-video-prompts
  url: https://github.com/LichAmnesia/awesome-ad-video-prompts/blob/main/images/x-ray-energy-return-running-midsole.png
  license: CC BY 4.0
verify:
  - 在可灵图生视频实测 3 次，记录所用模型版本、可选时长（以官方为准）
  - 「只有鞋面变透明、中底保持实体」能否做到，还是整只鞋都变透明
  - 原文写的是"脚跟着地"，但只有鞋没有人：实测模型是否会凭空长出脚，是否需要改成"鞋子从空中落下着地"
  - 示例图是仓库提供的关键帧图（中底透视发光的跑鞋，已转 JPG 压缩），不是可灵成片截图
---
**时长与镜头**：四段是"亮相 → 透视 → 演示 → 回到品牌"。可选时长偏短时，删掉 5–8 秒那段，在 3–5 秒回弹结束时收住；偏长时，在回弹之后加一次"再扫一遍，换个角度看前掌"。

**怎么用**：首帧用一张深色背景、侧面 45 度的清晰产品图，模型只需要"加扫描线、加透视、加运镜"。没有产品图时删掉第一句，当作文生视频使用。原文写"脚跟着地"但画面里没有人，可灵常会凭空长出一只脚，建议改成"鞋子从十几厘米高处落下，鞋跟着地"。

**怎么填变量**：[青色] 建议换成品牌主色；内部结构按实际产品改，例如"气垫里的气柱""床垫里的独立弹簧""头盔里的缓冲层"。

**常见失败与调整**：
- 整只鞋都变透明：写成"只有鞋面像玻璃一样透明，鞋底和中底保持原样"。
- 透视层闪烁：删掉"恢复不透明"那段，让透视状态保持到结尾。

> 改编自 [LichAmnesia/awesome-ad-video-prompts](https://github.com/LichAmnesia/awesome-ad-video-prompts)（awesome-ad-video-prompts contributors），许可证 CC BY 4.0。

### 英文原版

```
High-energy x-ray feature spotlight for a [brand] running sneaker's responsive midsole. 0-2s: low hero angle, the shoe planted on wet black asphalt, a single cyan rim light tracing its silhouette, reflections pooling beneath, a deep bass pulse underneath. 2-3s: a thin horizontal scan line sweeps left to right and only the upper goes translucent — the midsole stays solid and now reveals stacked foam cells inside, lit from within. 3-5s: a hard heel-strike in slow motion, the foam cells visibly compress then spring back, a soft glow ripple radiating outward from the impact point as the dolly pushes in tight on the heel. 5-8s: the upper re-solidifies opaque and the camera tilts up the laces into a clean rack focus that snaps to the side logo. The sneaker keeps identical geometry, stitching density, midsole stack height, and two-tone colorway throughout — no morphing, melting, smearing, extra eyelets, or flicker between transparent and solid states. High-contrast cyan-on-charcoal grade, sharp mesh-and-rubber texture.
```
