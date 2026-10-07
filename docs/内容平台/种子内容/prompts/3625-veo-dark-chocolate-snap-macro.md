---
title: veo 3 提示词：巧克力广告视频（掰断脆响 + 流心慢动作 · 暗调微距 16:9）
slug: veo-dark-chocolate-snap-macro
model: veo
topics: [product-video, food]
modelLabel: Veo 3.1
aspectRatio: "16:9"
needsRefImage: false
useCase: 黑巧克力、甜点、烘焙、坚果的高级感美食广告：手掰断一格巧克力的断面和可可粉、松露流心慢动作、举起迎向一盏暖光，配真实的断裂声，适合品牌片和节日礼盒宣传。
prompt: |
  暗调、私密的微距镜头：一块高级[黑巧克力]放在温暖的哑光大理石上，16:9，约 6 秒。
  0–2 秒：一只手掰下一格，一道干净的断裂纹迅速划过整块巧克力，细细的可可粉扬进一道低角度的光束里。
  2–4 秒：一颗[松露巧克力]裂开，丝滑的甘纳许在慢动作中流出光亮的缎带，一粒可可碎在石面上弹了一下。
  4–6 秒：镜头上摇，掰下的那块被举起，迎向一盏温暖的聚光，表面的光泽拖出一道移动的高光，背景里的锡纸包装柔和虚化。
  镜头：85mm 微距，缓慢推进加轻微上摇。
  光线：一盏硬质暖色主光，暗部迅速衰减，浓缩咖啡般的深棕阴影。
  声音：清脆的断裂声，甘纳许被拉开的绵软声，安静的室内声。
  巧克力的形状和光泽保持一致，断裂与流动符合物理：没有融化故障、拖影、变形或漂移。
negativePrompt: 融化故障，拖影，巧克力变形，手指畸形，塑料质感，过曝，文字，水印
source:
  repo: LichAmnesia/awesome-ad-video-prompts
  url: https://github.com/LichAmnesia/awesome-ad-video-prompts#chocolate-fold-and-crackle
  author: "awesome-ad-video-prompts contributors"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文；原文品牌改为变量；负面提示词写成名词短语"
images:
  - 3625-veo-dark-chocolate-snap-macro-1.jpg
imageCredit:
  by: "LichAmnesia/awesome-ad-video-prompts"
  url: https://github.com/LichAmnesia/awesome-ad-video-prompts/blob/main/images/chocolate-fold-and-crackle.png
  license: CC BY 4.0
verify:
  - Veo 3.1 实测 3 次：断裂声与画面是否同步
  - 示例图是仓库提供的关键帧图（已转 JPG 压缩）
---
**时长与镜头**：6 秒三段：掰断 → 流心 → 举起迎光。美食广告里"声音"占一半效果，Veo 能生成同期声，所以把断裂、拉丝这类拟声写进提示词，并单独成句（官方建议音频描述用单独的句子）。选 Veo 8 秒档时，可以在结尾加"一只手把它送到嘴边，画面切走前停住"。

**怎么填变量**：[黑巧克力] 换成"牛奶巧克力""焦糖饼干""牛角包"；[松露巧克力] 流心段可以换成"熔岩蛋糕被勺子切开""芝士拉丝"。暗调适合高端礼盒，想做年轻零食风就把光线改成"明亮的高调光，彩色背景"。

**常见失败与调整**：
- 断面像橡皮一样弯折：写"断面干脆，带细小的颗粒质感"。
- 流心到处都是：写"只从裂口缓慢流出一小股"。
- 声音变成背景音乐：写"没有背景音乐，只有真实拟音"。

> 改编自 [LichAmnesia/awesome-ad-video-prompts](https://github.com/LichAmnesia/awesome-ad-video-prompts)（awesome-ad-video-prompts contributors），许可证 CC BY 4.0。

### 英文原版

```
Intimate dark-mood macro of a premium [brand] dark chocolate bar on warm honed marble. 0-2s: a hand snaps a square and a clean fracture races across the bar, fine cocoa dust puffing into a low raking beam; 2-4s: molten ganache oozes from a split truffle in glossy slow ribbons, a stray cocoa nib bouncing once on the stone; 4-6s: the camera tilts up as the broken piece rises toward a single warm spotlight, the surface gloss dragging a moving highlight, foil wrapper soft-blurred behind. 85mm macro on a slow push paired with a delicate tilt. Single hard warm key, deep falloff, espresso-brown shadow. The chocolate holds consistent shape and sheen, the fracture and the melt flow read physically true with no melt-glitch, smearing, deformation, drift, or artifacts. Implied sound: a sharp snap, the soft creamy pull of ganache, quiet room tone.
```
