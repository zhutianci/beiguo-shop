---
title: seedance 提示词：香薰蜡烛氛围生活方式短片（点烛—读书—黑胶唱片 · 横屏 8 秒）
slug: seedance-candle-cozy-night-lifestyle
model: seedance
topics: [product-video, cinematic]
modelLabel: Seedance 2.0
aspectRatio: "16:9"
needsRefImage: true
useCase: 不讲功能、只卖"感觉"的品牌氛围片：烛芯点燃—人陷进沙发读书—黑胶唱片转动—回到火苗，适合蜡烛、香薰、毛毯、茶具等居家品牌的宣传片和店铺首页视频。
prompt: |
  横屏 16:9，约 8 秒，温暖舒适的夜间居家氛围片。@图片1 为蜡烛产品外观参考。
  0–2 秒：微距，木质烛芯点燃第一朵火苗，轻微噼啪，暖琥珀色的光沿着 @图片1 的[哑光陶瓷烛杯]向上晕开，蜡面刚开始泛光。
  2–4 秒：镜头在柔和阴影中缓慢后拉，一位男士陷进深色[丝绒扶手椅]，膝上盖着粗针织毛毯，手里拿着一本精装书，火光在他脸上轻轻跳动。
  4–6 秒：镜头缓缓升起，露出更大的房间——转盘上一张黑胶唱片在转，几盏台灯错落亮着，蜡烛已融出一圈香蜡。
  6–8 秒：从房间移焦回到稳定的火苗，然后缓慢黑场。
  声音：烛芯噼啪声，黑胶唱片轻微的底噪，低低的室内安静声。
  色调：深棕、余烬橙、温暖的低调阴影；情绪：宁静、金色、慵懒。
  蜡烛杯形状、标签和比例全程一致，火苗稳定，不闪烁、不变形、不漂移。
negativePrompt: 火焰闪烁异常，烛杯变形，人物脸部漂移，手部畸形，多余的蜡烛，乱码文字，水印
source:
  repo: LichAmnesia/awesome-ad-video-prompts
  url: https://github.com/LichAmnesia/awesome-ad-video-prompts#candlelit-vinyl-wind-down
  author: "awesome-ad-video-prompts contributors"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文；增加 @图片1 产品参考写法；烛杯材质与座椅改为变量"
images:
  - 3605-seedance-candle-cozy-night-lifestyle-1.jpg
imageCredit:
  by: "LichAmnesia/awesome-ad-video-prompts"
  url: https://github.com/LichAmnesia/awesome-ad-video-prompts/blob/main/images/candlelit-vinyl-wind-down.png
  license: CC BY 4.0
verify:
  - 在 Seedance 2.0 入口实测 3 次，记录"后拉—升起—移焦"三段运镜是否都被执行
  - 人物出镜时脸部是否稳定；不需要人物时可删掉第二段
  - 示例图是仓库提供的关键帧图（已转 JPG 压缩）
---
**时长与镜头**：8 秒四段，运镜是"微距 → 后拉 → 升起 → 移焦回微距"，首尾都落在火苗上，天然适合循环播放。Seedance 2.0 可选时长较长（具体范围以官方当前说明为准），想更从容可以做到 12 秒，每段各加 1 秒。横屏适合官网和店铺首页，做竖屏时把"升起露出房间"改成"向上摇到墙上的串灯"。

**怎么填变量**：上传自家蜡烛产品图作 @图片1，[哑光陶瓷烛杯] 写成产品的真实外观；[丝绒扶手椅] 可换成"榻榻米坐垫""窗边飘窗"，人物可换成"一位女士"或干脆不出现人，只拍房间和物件，品牌片会更"安静"。

**常见失败与调整**：
- 人物脸部在火光下变形：把人物改成背影或只拍手和书页。
- 黑胶唱片转动时标签扭曲：写"唱片中央是纯色标签"。
- 火苗闪得像故障：保留"火苗稳定"并在负面提示词写"火焰闪烁异常"。

> 改编自 [LichAmnesia/awesome-ad-video-prompts](https://github.com/LichAmnesia/awesome-ad-video-prompts)（awesome-ad-video-prompts contributors），许可证 CC BY 4.0。

### 英文原版

```
A cozy night-time wind-down in a rustic apartment as warm lamplight layers the room. 0-2s: a macro on a wooden wick catching its first flame — a tiny crackle, an amber glow blooming up the matte vessel of a [brand] candle, wax just beginning to gloss. 2-4s: a slow dolly-back through soft shadow reveals a man sinking into a deep velvet armchair with a hardback, a chunky wool throw over his knees, firelight flickering across his face. 4-6s: a gentle crane-up exposes the wider room — a record spinning on a turntable, scattered table lamps, the candle pooling fragrant wax. 6-8s: rack focus from the room back to the steady flame, then a slow blink to black. The candle keeps a consistent vessel shape, label, and proportions; the flame stays physically stable; no flicker glitches, warping, drift, or artifacts. Audio: a crackling wick, faint vinyl surface hiss, low ambient hush. Mood: tranquil, golden, indulgent. Palette: deep browns, ember orange, warm low-key shadow.
```
