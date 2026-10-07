---
title: 可灵提示词：球鞋 360 度旋转展示视频（影棚转台 · 渐变光扫过鞋底）
slug: kling-sneaker-360-turntable-studio
model: kling
topics: [product-video, ecommerce]
aspectRatio: "1:1"
needsRefImage: true
useCase: 用一张鞋子的产品图，生成"低机位推进—转台转半圈—停在四分之三角度"的 6 秒方形展示视频，适合电商主图视频、新品上架和球鞋测评开头；包、水杯、小家电也能套用。
prompt: |
  以我上传的产品图为准，生成一条约 6 秒的 1:1 方形球鞋展示视频。
  场景：一只[针织面运动鞋]放在看不见的透明亚克力转台上，背景是无缝的石墨灰影棚，光束里飘着细小的灰尘。
  0–2 秒：低机位英雄角度，镜头缓慢推近，一束硬质顶光掠过鞋面，每一道针脚和鞋底从哑光到亮面的渐变都清晰可见。
  2–4 秒：鞋子在转台上平稳地转动 180 度，一道[品红到青色]的渐变色光沿着外底纹路扫过。
  4–6 秒：转动慢慢停在正面四分之三角度，鞋底轻轻回弹一下，鞋跟上的[品牌标志]清晰锐利。
  整个旋转过程中鞋带系法、配色和鞋型保持一致：不扭曲、不拖影、鞋眼不重复、画面不闪烁。
  声音：轻柔的气流声，一声细微的橡胶摩擦声，定格时一记低沉的重音。
negativePrompt: 鞋型扭曲，鞋带变化，配色变化，重复的鞋眼，多余的鞋，拖影，闪烁，文字，水印
source:
  repo: LichAmnesia/awesome-ad-video-prompts
  url: https://github.com/LichAmnesia/awesome-ad-video-prompts#sneaker-360-turntable-studio
  author: "awesome-ad-video-prompts contributors"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文；补充\"以上传的产品图为准\"和负面提示词；鞋款材质、光色、品牌标志改为变量"
imageBrief: 仓库示例图鞋款近似知名品牌，未采用。站长用自有或无品牌球鞋图生成 1 条，截取起始、转到侧面、定格三帧。
verify:
  - 在可灵实测 3 次，记录旋转 180 度时鞋型是否稳定、可选时长与模型版本（以官方为准）
  - 首帧用纯色背景产品图与用生活场景图的成功率差异
---
**时长与镜头**：6 秒三段：推近 → 转半圈 → 定格回弹。可灵 5 秒档可以把推近压到 1 秒；10 秒档建议把"转 180 度"改成"转满 360 度"，节奏更从容，转一圈回到正面也方便做循环播放的主图视频。方形 1:1 适合电商主图，投信息流可改 9:16，把鞋子放在画面中下部。

**怎么用**：最好用白底或灰底、侧面 45 度的清晰产品图作首帧，鞋子占画面 60% 左右。转台旋转是图生视频里比较考验一致性的动作，背面细节模型只能"猜"，所以产品图如果有背面图，可以分两条生成再剪辑拼接。

**怎么填变量**：[针织面运动鞋] 换成"皮质板鞋""登山靴"；[品红到青色] 建议取品牌色或与鞋子配色对比强的颜色；没有标志的鞋直接删掉 [品牌标志] 那句。

**常见失败与调整**：
- 转到背面时鞋型崩坏：把旋转角度从 180 度降到 90 度，或改成"镜头绕鞋子缓慢环绕"。
- 色光把鞋子颜色染变了：在最后加一句"色光只照亮鞋底边缘，鞋面颜色保持原样"。
- 标志变乱码：后期贴图，提示词里删掉标志描述。

> 改编自 [LichAmnesia/awesome-ad-video-prompts](https://github.com/LichAmnesia/awesome-ad-video-prompts)（awesome-ad-video-prompts contributors），许可证 CC BY 4.0。

### 英文原版

```
A single hero sneaker rests on an invisible acrylic turntable inside a seamless graphite cyclorama, dust motes drifting in the light. 0-2s: low hero angle, slow dolly-in as a hard top light rakes the knit upper, every stitch and the matte-to-gloss midsole gradient resolving crisply. 2-4s: the shoe makes a controlled 180-degree turntable rotation on its long axis while a magenta-to-teal gel sweep travels the outsole lugs. 4-6s: the spin eases to a clean three-quarter front, the sole flexing once with a subtle natural bounce, the [brand] heel logo tack-sharp. Upper keeps the same lace pattern, colorway, and silhouette across the full turn — no warping, smearing, duplicated eyelets, or temporal flicker. Sound: airy whoosh, faint rubber squeak, a deep sub hit on the lock.
```
