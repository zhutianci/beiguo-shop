---
title: 可灵提示词：产品剖面透视讲解视频（冷萃杯玻璃变透明露出滤网 · 工作原理动画）
slug: kling-bottle-cutaway-how-it-works
model: kling
topics: [product-video, motion-graphics]
aspectRatio: "9:16"
needsRefImage: true
useCase: 讲"内部结构怎么工作"的产品视频：外壳变半透明，白色剖面线描出内部滤网 / 结构，再恢复原样。适合冷萃杯、净水壶、保温杯、空气炸锅等有内部构造的产品详情页。
prompt: |
  以我上传的产品图为准，生成一条约 6 秒的竖屏 9:16 "工作原理"讲解视频，主角是一只[可重复使用的冷萃杯]。
  0–2 秒：俯拍微距，深色咖啡在磨砂玻璃里旋转，低角度窗光扫过挂满水珠的杯身；机位锁定不动，清晨厨房般安静。
  2–4 秒：镜头缓慢推进约 8 厘米，正面的玻璃壁变成半透明，一层干净的白色剖面线条描绘出来，露出里面的[不锈钢滤网]挡住咖啡粉、只让液体通过；矢量线条清晰、零抖动，剖面层与杯身严丝合缝。
  4–6 秒：镜头向右环绕约 30 度，杯子在画面里始终锐利；一块冰块落下，清脆"叮"一声，水面荡开一圈涟漪；随后剖面层淡出，玻璃恢复不透明。
  杯子轮廓、磨砂质感、杯盖螺纹和标签位置每一拍都完全一致：不扭曲、不拉伸、不出现双重边缘、玻璃不融化。
  画面：温暖的哑光调色，浅景深，玻璃和拉丝钢的触感。
negativePrompt: 杯身扭曲，双重边缘，线条抖动，标签漂移，玻璃融化，乱码文字，水印
source:
  repo: LichAmnesia/awesome-ad-video-prompts
  url: https://github.com/LichAmnesia/awesome-ad-video-prompts#cross-section-cutaway-cold-brew-filter
  author: "awesome-ad-video-prompts contributors"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文；补充\"以上传的产品图为准\"和负面提示词；产品与内部结构改为变量"
images:
  - 3620-kling-bottle-cutaway-how-it-works-1.jpg
imageCredit:
  by: "LichAmnesia/awesome-ad-video-prompts"
  url: https://github.com/LichAmnesia/awesome-ad-video-prompts/blob/main/images/cross-section-cutaway-cold-brew-filter.png
  license: CC BY 4.0
verify:
  - 可灵实测 3 次：玻璃变半透明时内部结构是否合理（模型不知道真实结构，可能乱画）
  - 剖面线条是否会长出乱码标注
  - 示例图是仓库提供的关键帧图（已转 JPG 压缩）
---
**时长与镜头**：6 秒三段：实物建立 → 变透明露结构 → 环绕 + 恢复。重点在第二段，所以第一、三段可以压缩。模型并不知道你产品的真实内部构造，内部结构越复杂越容易"编造"，最稳的做法是用首尾帧：首帧是产品实拍图，尾帧是用图像模型或设计稿做的"剖面示意图"，让模型补中间的透明化过程。

**怎么填变量**：[可重复使用的冷萃杯] 换成"滤水壶""保温杯"；[不锈钢滤网] 换成"活性炭滤芯""双层真空夹层"。剖面线条只要求"白色细线"，不要让模型写参数文字，参数和卖点在后期做成标注贴片。

**常见失败与调整**：
- 剖面线条乱跳：写"线条一次画好后保持静止，只有液体在动"。
- 环绕时杯子变形：删掉环绕，改成固定机位。
- 冰块掉进去后水溢出来：写"液面只荡开一圈涟漪"。

> 改编自 [LichAmnesia/awesome-ad-video-prompts](https://github.com/LichAmnesia/awesome-ad-video-prompts)（awesome-ad-video-prompts contributors），许可证 CC BY 4.0。

### 英文原版

```
Cinematic 'how-it-works' explainer for a [brand] reusable cold-brew bottle. 0-2s: top-down macro on dark coffee swirling inside frosted glass, low window light raking across beaded condensation, the camera locked and still, faint kitchen-morning hush. 2-4s: a slow 8cm push-in as the front glass wall turns half-transparent and a clean white cross-section overlay draws on, exposing the inner steel mesh filter holding the grounds back while liquid passes through — crisp vector lines, zero jitter, the overlay tracking the bottle exactly. 4-6s: the camera arcs 30 degrees right around the bottle while it stays pin-sharp in frame; a single ice cube drops with a tight clink and one clean ripple crosses the surface, then the overlay fades and the glass re-solidifies. The bottle holds identical silhouette, frosted finish, cap threading, and label position across every beat — no warping, stretching, label drift, double edges, or melting glass. Warm matte grade, shallow depth of field, tactile glass-and-brushed-steel texture.
```
