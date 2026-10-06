---
title: 可灵提示词：前后对比转场广告（凌乱书桌一秒变治愈 · 匹配剪辑）
slug: kling-desk-reset-match-cut
model: kling
topics: [product-video]
aspectRatio: "16:9"
needsRefImage: false
useCase: 生成 10 秒"冷色凌乱 → 暖光整洁"的前后对比广告，用匹配剪辑完成转场，适合香薰、台灯、收纳、绿植等"改善氛围"类产品。
prompt: |
  生活氛围广告，16:9，时长[10]秒。
  开场：黄昏时一张混乱的居家书桌——纸张乱堆，显示器刺眼的蓝光，冷清又让人透不过气，画面带轻微的手持抖动。
  0–2 秒：镜头紧张地缓缓扫过这片混乱，未调色的冷灰画面，屏幕光在墙上冷冷地闪。
  2–4 秒：一只手把杂物扫出画面，放下一支点燃的[香薰蜡烛]；火柴的火光让角落变暖，显示器随之熄灭。
  4–7 秒：干净的匹配剪辑，切到同一张书桌——已经整洁，被摇曳的琥珀色烛光笼罩，一缕细烟向上盘旋，柔和的影子在墙上轻轻起伏。
  7–10 秒：镜头缓缓后拉，画面安静下来，火苗在温暖的胶片色调里跳动。
  [香薰蜡烛]的罐身形状、标签和烛芯位置全程一致；火焰物理自然，不闪烁、不拖影、物体不变形。
  声音：划火柴声，低低的噼啪声，然后归于安静。
negativePrompt: 火焰闪烁伪影，物体变形，蜡烛罐形状变化，多出的烛芯，画面拖影，文字，水印
source:
  repo: LichAmnesia/awesome-ad-video-prompts
  url: https://github.com/LichAmnesia/awesome-ad-video-prompts#cluttered-desk-candle-reset
  author: awesome-ad-video-prompts contributors
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: 英文原文译为中文；原文为通用视频模型提示词，本站补充负面提示词；产品和时长改为变量
images:
  - 217-kling-desk-reset-match-cut-1.jpg
imageCredit:
  by: LichAmnesia/awesome-ad-video-prompts
  url: https://github.com/LichAmnesia/awesome-ad-video-prompts/blob/main/images/cluttered-desk-candle-reset.png
  license: CC BY 4.0
verify:
  - 在可灵选 10 秒实测，记录"匹配剪辑"是否真的生成了前后两个状态，还是变成了慢慢溶解
  - 示例图是仓库提供的关键帧图（已转为 JPG 压缩），不是可灵成片截图
---
**时长与镜头**：4 段共 10 秒：混乱（2 秒）→ 产品出场（2 秒）→ 匹配剪辑后的整洁画面（3 秒）→ 收尾（3 秒）。"匹配剪辑"指同一机位、同一构图，前后只换状态，观众一眼就能看出对比。

**更稳的做法**：可灵一次生成前后两种状态并不总是成功。可以先用图像模型做两张同机位的图（凌乱版、整洁版），用可灵的首尾帧功能生成中间过渡；或者分别生成"凌乱段"和"整洁段"两条，剪辑时硬切拼接。

**怎么填变量**：[香薰蜡烛] 换成"[暖光台灯]""[桌面收纳盒]""[一盆绿植]"，同时把"火柴的火光"换成对应的动作，比如"按下台灯开关"。

**常见失败与调整**：
- 转场变成了慢慢溶解：写明"硬切，不要渐变过渡"。
- 火焰忽大忽小：加"火焰稳定，只有轻微摇曳"。

> 改编自 [LichAmnesia/awesome-ad-video-prompts](https://github.com/LichAmnesia/awesome-ad-video-prompts)（awesome-ad-video-prompts contributors），许可证 CC BY 4.0。

### 英文原版

```
Lifestyle ambiance, 16:9. A chaotic home desk at dusk — papers strewn, a harsh blue monitor glow, cold and overwhelming, faint handheld micro-shake. [0-2s] a slow, nervous pan across the mess, ungraded and tense, the screen light flickering cold on the wall. [2-4s] a hand sweeps the clutter from frame and sets down a lit [product] candle; a match flare warms the corner and the monitor dies dark. [4-7s] a clean match-cut to the same desk now tidy, bathed in flickering amber candlelight, a thin ribbon of smoke threading upward, soft shadows breathing across the wall. [7-10s] a gentle dolly-back settles into stillness, the flame dancing in a warm, filmic grade. The candle keeps a consistent jar shape, label, and wick position; flame physics natural — no flicker artifacts, smearing, or object morphing. Implied sound: a struck match, a low crackle, then quiet.
```
