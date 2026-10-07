---
title: seedance 提示词：二选一分屏对比广告（普通鞋 vs 你的跑鞋 · 同步起跑慢动作）
slug: seedance-sneaker-split-screen-comparison
model: seedance
topics: [product-video, ecommerce]
modelLabel: Seedance 2.0
aspectRatio: "9:16"
needsRefImage: true
useCase: 社交平台常见的"This or That / 左右分屏对比"格式：左边普通产品、右边你的产品，同步做同一个动作，差异一眼可见，最后右边吃掉整屏。适合跑鞋、床垫、锅具、背包等有可视化卖点的产品。
prompt: |
  竖屏 9:16，约 6 秒，硬分屏，中间一条固定分割线；左半边冷灰色水泥地，右半边暖色木地板。@图片1 为右侧产品外观参考。
  0–2 秒：左右两边是完全相同的低机位镜头，两只脚踩在起跑线上静止不动——左边穿着一双[磨旧的普通帆布鞋]，右边穿着 @图片1 的[跑鞋]。
  2–4 秒：两边同步蹬地起跑；左脚平拍落地，一声沉闷的"咚"和一小团灰尘，右脚从脚跟滚动到脚尖，泡棉中底在清晰的慢动作中明显压缩又回弹。
  4–6 秒：分割线向左滑走，右半边铺满全屏，变成跑者大步奔跑的跟拍英雄镜头，针织鞋面弯折，鞋带在侧逆光里绷紧。
  光线：强对比、有冲击力；声音：球馆地板的吱声，一声有弹性的落地声。
  两双鞋的轮廓、鞋底纹路和配色在每一个镜头都保持一致：不变形、不漂移、左右不互换。
negativePrompt: 左右互换，鞋子变形，多余的脚，腿部畸形，分割线消失，乱码，文字，水印
source:
  repo: LichAmnesia/awesome-ad-video-prompts
  url: https://github.com/LichAmnesia/awesome-ad-video-prompts#this-or-that-sneaker-split
  author: "awesome-ad-video-prompts contributors"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文；增加 @图片1 产品参考写法；左右两侧产品改为变量"
imageBrief: 仓库示例图两双鞋均近似知名品牌款，未采用。站长用无品牌鞋款生成，截取分屏同步起跑和右侧铺满全屏两帧。
verify:
  - 在 Seedance 2.0 入口实测 3 次，分屏构图能否稳定保持 4 秒
  - 分割线滑走的转场是否被执行
---
**时长与镜头**：6 秒三段：静止对照 → 同步动作 → 右侧吞屏。分屏对比的要点是"两边只差一个变量"：同样的机位、同样的动作、同样的节奏，只有产品不同。Seedance 2.0 官方说明支持 4–15 秒，想加口播可以做到 10 秒，在最后加一句旁白"[同样一步，差距一目了然]"。

**怎么填变量**：左边写"普通款 / 旧款"，不要点名竞品品牌（广告法禁止贬低其他品牌）；右边上传你的产品图。换品类：锅具可以写"左边煎蛋粘锅、右边一推就滑"；床垫写"左边放一杯水后被震洒、右边纹丝不动"。

**常见失败与调整**：
- 分屏变成一个画面：开头单独写一句"整个视频前 4 秒保持左右分屏"。
- 两边动作不同步：写"两边动作完全同步，像镜像一样"。
- 吞屏转场没做出来：把第三段单独生成，后期用剪辑软件做滑动转场更可控。

> 改编自 [LichAmnesia/awesome-ad-video-prompts](https://github.com/LichAmnesia/awesome-ad-video-prompts)（awesome-ad-video-prompts contributors），许可证 CC BY 4.0。

### 英文原版

```
Hard vertical split-screen with a fixed center divider; left half cool-grey concrete, right half warm-toned hardwood. 0-2s: identical low-angle shots of two feet — left in a generic scuffed canvas trainer, right in crisp [product] performance runners — both planted at the start line, still. 2-4s: synchronized push-off; left foot lands flat with a dull heavy thud and a puff of dust, right foot rolls heel-to-toe as the foam midsole visibly compresses then rebounds in crisp slow motion. 4-6s: the divider slides left and the right side floods the frame for a hero tracking shot of the runner mid-stride, knit upper flexing and laces snapping taut in directional rim light. Punchy high-contrast lighting, gym-floor squeak and a springy impact thump. Both shoes hold consistent silhouette, tread pattern, and colorway across every cut — no deformation, drift, swapped sides, or artifacts.
```
