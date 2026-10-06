---
title: 可灵提示词：数码产品爆炸图悬浮动画（耳机零件分离再合体）
slug: kling-earbuds-exploded-view
model: kling
topics: [product-video, motion-graphics]
aspectRatio: "16:9"
needsRefImage: true
useCase: 生成"产品零件在失重状态下分开悬浮、旋转，再磁吸合体"的爆炸图动画，适合耳机、充电宝、键盘等数码产品的结构展示和发布会视频。
prompt: |
  以我上传的产品图为准，生成一条约[6]秒的产品爆炸图动画，16:9。
  场景：[无线耳机和充电仓]以爆炸图的方式悬浮在[深海军蓝]渐变的虚空背景中，上方一盏柔光箱照明。
  0–2 秒：零件在失重状态下缓缓分开——[仓盖、两只耳机、硅胶耳塞]悬浮在空中慢慢旋转，拉丝金属和哑光塑料表面闪着清晰的高光。
  2–4 秒：镜头向左做视差环绕，一道[青色]轮廓光沿着每条接缝划过，光滑的耳机柄上滚动着细小的反光。
  4–6 秒：零件像被磁力吸引一样重新聚拢，干净利落地合上，铰链上刻着[品牌名]。
  每个零件的形状、比例和表面质感全程不变：不抖动、不复制、不互相穿插、不扭曲。
  声音：失重般的低频嗡鸣，一声磁吸的"咔哒"，一声轻柔的确认提示音。
negativePrompt: 零件穿插，零件数量变化，多出来的耳机，形状扭曲，画面抖动，文字乱码，水印
source:
  repo: LichAmnesia/awesome-ad-video-prompts
  url: https://github.com/LichAmnesia/awesome-ad-video-prompts#earbuds-exploded-view-levitation
  author: awesome-ad-video-prompts contributors
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: 英文原文译为中文；原文为通用视频模型提示词，本站补充"以上传的产品图为准"和负面提示词；产品、零件、背景色、轮廓光颜色、品牌名改为变量
images:
  - 216-kling-earbuds-exploded-view-1.jpg
imageCredit:
  by: LichAmnesia/awesome-ad-video-prompts
  url: https://github.com/LichAmnesia/awesome-ad-video-prompts/blob/main/images/earbuds-exploded-view-levitation.png
  license: CC BY 4.0
verify:
  - 在可灵实测 3 次，记录零件数量是否保持一致、合体时是否穿模
  - 示例图是仓库提供的关键帧图（已转为 JPG 压缩），不是可灵成片截图
---
**时长与镜头**：分开（2 秒）→ 环绕展示（2 秒）→ 合体（2 秒），在可灵选 5 秒时每段约 1.7 秒，选 10 秒时可把环绕段放慢。想做成循环视频，在结尾加"最后一帧与第一帧相同"。

**怎么用首尾帧**：可灵支持首尾帧时，效果最稳的做法是——首帧放"产品完整合体"的图，尾帧放"零件分开悬浮"的图（可以用图像模型先做一张爆炸图），提示词只写中间的运动过程。

**怎么填变量**：零件写 3–5 个就够，太多会数不清；换成充电宝就写"[外壳、电芯、电路板、按键]"。

**常见失败与调整**：
- 零件越分越多：在零件清单后面写明"一共 4 个零件"。
- 合体时零件穿插：把合体速度写慢，"缓缓聚拢、依次归位"。
- 品牌名乱码：删掉品牌名一句，后期加 Logo。

> 改编自 [LichAmnesia/awesome-ad-video-prompts](https://github.com/LichAmnesia/awesome-ad-video-prompts)（awesome-ad-video-prompts contributors），许可证 CC BY 4.0。

### 英文原版

```
Wireless earbuds and their charging case float in exploded-view layout against a deep-navy gradient void, lit by one soft overhead box. 0-2s: components drift apart in zero gravity — lid, both buds, and silicone tips suspended and slowly rotating, brushed-metal and matte-plastic surfaces catching crisp specular highlights. 2-4s: a parallax orbit left as a cyan accent edge-light traces every seam, micro-reflections rolling along the glossy stems. 4-6s: the parts magnetically draw back together and seat with a clean close, [brand] etched on the hinge. Each part holds constant geometry, scale, and finish — no jitter, duplication, intersection clipping, or warping. Sound: weightless hum, a magnetic click, soft confirmation chime.
```
