---
title: 可灵提示词：眼镜 / 墨镜产品广告视频（暗场光带扫过 · 运动控制镜头）
slug: kling-eyewear-light-streaks
model: kling
topics: [product-video, ecommerce]
aspectRatio: "16:9"
needsRefImage: true
useCase: 上传一张眼镜或墨镜的产品图，生成 5–6 秒"暗场光带扫过镜腿—镜片拉出光晕—环绕定格"的高级感产品视频，适合详情页主图视频、新品预告；手表、首饰也能套用。
prompt: |
  以我上传的产品图为准，生成一条约[6]秒的高级感产品广告视频，16:9。
  场景：一副[玳瑁色板材墨镜]放在抛光的黑色亚克力台座上，暗色摄影棚里穿过几道细细的彩色光带，台面映出清晰的镜面倒影。
  0–2 秒：运动控制微距镜头沿着镜腿平移，一道[琥珀色]光带从头扫到尾，显出板材纹理和倒角抛光，镜片映出这道光。
  2–4 秒：镜框慢慢转向镜头，上方[珊瑚色]、下方[电光蓝]两组渐变光源滑过镜片，拉出一道干净的水平变形宽银幕光晕。
  4–6 秒：近距离环绕，停在四分之三角度的主视觉画面，镜腿上的[品牌标识]闪过一下锐利的高光。
  镜框形状、铰链位置和镜片颜色全程不变：镜腿不弯曲、不拖影，反射不出现伪影。
  声音：空灵的合成器渐强，细微的玻璃闪烁声，一声共鸣的铃音。
negativePrompt: 镜腿弯曲，镜框变形，镜片颜色变化，拖影，反射伪影，多余的镜腿，文字，水印
source:
  repo: LichAmnesia/awesome-ad-video-prompts
  url: https://github.com/LichAmnesia/awesome-ad-video-prompts#eyewear-motion-control-light-streaks
  author: awesome-ad-video-prompts contributors
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: 英文原文译为中文；原文是通用视频模型提示词（适用 Seedance / Veo / 可灵 / Runway），本站按可灵图生视频的用法补充"以上传的产品图为准"和负面提示词；产品、光色、品牌标识改为变量
images:
  - 215-kling-eyewear-light-streaks-1.jpg
imageCredit:
  by: LichAmnesia/awesome-ad-video-prompts
  url: https://github.com/LichAmnesia/awesome-ad-video-prompts/blob/main/images/eyewear-motion-control-light-streaks.png
  license: CC BY 4.0
verify:
  - 在可灵（网页版或 App）实测 3 次，记录所用模型版本、可选时长（5 秒 / 10 秒等，以官方为准）和是否生成音效
  - 示例图是仓库提供的关键帧图（已转为 JPG 压缩），不是可灵成片截图；站长实测后可替换
---
**时长与镜头**：原作是 6 秒三段。可灵常见的时长档位是 5 秒和 10 秒：选 5 秒就把三段各压到约 1.5 秒；选 10 秒可以在 2–4 秒那段之后加一段"镜片特写，光带缓缓扫过"。

**怎么用**：产品图建议用深色或纯色背景、正侧 45 度角的清晰照片作首帧，模型只需要"加光、加运镜"，比从零生成稳定得多。没有产品图时，删掉第一句，当作文生视频使用。

**怎么填变量**：三种光色最好取品牌色；换成手表就把"沿镜腿平移"改成"沿表带平移"，"镜片光晕"改成"表镜反光"。

**常见失败与调整**：
- 镜腿在环绕时弯折：把"近距离环绕"改成"缓慢推近"，环绕角度越大越容易崩。
- 光带太乱：只保留一种颜色的光带。
- 标识变成乱码：删掉"[品牌标识]"一句，后期叠加。

> 改编自 [LichAmnesia/awesome-ad-video-prompts](https://github.com/LichAmnesia/awesome-ad-video-prompts)（awesome-ad-video-prompts contributors），许可证 CC BY 4.0。

### 英文原版

```
Acetate sunglasses rest on a polished black acrylic plinth in a dark studio threaded with thin colored light streaks, the plinth giving a crisp mirror reflection beneath. 0-2s: a motion-control macro slide tracks along the temple arm as a sweeping amber streak runs its full length, revealing tortoiseshell grain and bevel polish, the lenses mirroring the beam. 2-4s: the frame tilts to face camera while twin gradient sources — coral above, electric blue below — glide across the lenses and pull a clean horizontal anamorphic flare. 4-6s: a tight orbit lands on a hero three-quarter, the [brand] temple emblem catching one sharp glint. Frame holds constant shape, hinge position, and lens tint — no bending arms, smearing, or reflection artifacts. Sound: an airy synth swell, a subtle glass shimmer, one resonant chime.
```
