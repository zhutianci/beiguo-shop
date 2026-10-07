---
title: 可灵提示词：产品爆炸图结构讲解视频（蜡烛零件悬浮分离 + 标注线 · 再合体）
slug: kling-candle-exploded-view-explainer
model: kling
topics: [product-video, motion-graphics]
aspectRatio: "9:16"
needsRefImage: true
useCase: 想讲清楚"产品由哪几部分组成、用了什么材料"时用：零件在空中悬浮分开、拉出标注线、再无缝合体，适合蜡烛、保温杯、香薰机等结构简单产品的卖点讲解视频。
prompt: |
  以我上传的产品图为准，生成一条约 8 秒的竖屏 9:16 产品结构讲解视频，爆炸图风格。
  0–2 秒：昏暗房间里一朵安静的火苗的特写，暖琥珀色的光在[琥珀色玻璃罐]上摇曳，烛芯发出轻微噼啪声，镜头像手持一样缓慢漂浮推近。
  2–4 秒：各个部件在空中轻轻分开并悬停——[玻璃罐、大豆蜡芯、棉质烛芯、盖子]，彼此间隔几厘米，每个部件拉出一条细细的标注引线；悬空的烛芯上火苗依然燃着，没有黑烟。
  4–6 秒：部件平滑地滑回原位，无缝合体成完整的、点燃的蜡烛，镜头后拉，露出一个布置好的[木质置物架]。
  6–8 秒：缓慢移焦，从火苗拉到玻璃罐上压印的标志。
  分离和合体过程中，罐子形状、颜色、蜡的颜色、烛芯位置和标签完全一致：不变形、没有黑烟拖尾、部件不重复、悬浮部件不漂移。
  画面：温暖的金色调，磨砂玻璃和柔软蜡面质感。
negativePrompt: 部件重复，部件变形，黑烟，烟雾伪影，漂移，标注文字乱码，多余的烛芯，画面闪烁，水印
source:
  repo: LichAmnesia/awesome-ad-video-prompts
  url: https://github.com/LichAmnesia/awesome-ad-video-prompts#exploded-assembly-reveal-clean-burn-candle
  author: "awesome-ad-video-prompts contributors"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文；补充\"以上传的产品图为准\"和负面提示词；部件清单、罐子颜色、置物架场景改为变量；原文的\"无烟燃烧\"卖点改为纯画面描述，不做功效表述"
images:
  - 3603-kling-candle-exploded-view-explainer-1.jpg
imageCredit:
  by: "LichAmnesia/awesome-ad-video-prompts"
  url: https://github.com/LichAmnesia/awesome-ad-video-prompts/blob/main/images/exploded-assembly-reveal-clean-burn-candle.png
  license: CC BY 4.0
verify:
  - 可灵实测 3 次：部件分离时数量是否正确、合体后是否和原图一致
  - 标注引线旁是否会生成乱码文字（建议标注文字后期加）
  - 示例图是仓库提供的关键帧图（已转 JPG 压缩）
---
**时长与镜头**：8 秒四段：特写建立 → 爆炸分离 → 合体后拉 → 移焦收尾。核心是第二段，如果只能生成 5 秒，就只做"完整产品 → 分离悬停 → 合体"三拍。爆炸图对一致性要求高，部件越少越稳，建议不超过 4 个。

**怎么填变量**：[玻璃罐、大豆蜡芯、棉质烛芯、盖子] 换成你产品的真实结构，例如保温杯写"杯盖、密封圈、内胆、外壳"，香薰机写"外罩、水箱、雾化片、底座"。场景 [木质置物架] 可换成"浴室台面""书桌一角"。

**怎么用**：标注引线最好只要求"细线"，文字（材料名、参数）后期用剪辑软件加，既不会乱码，也方便改卖点。如果手头有产品的三维渲染或拆解实拍图，可以用首尾帧模式：首帧完整产品、尾帧拆开的部件图，让模型补中间过程。

**常见失败与调整**：
- 分离时部件变多（出现两个盖子）：在提示词里写明"共 4 个部件"，并把负面提示词里的"部件重复"保留。
- 合体后外观和原图不一致：缩短悬停时间，或把合体段单独用首尾帧生成。

> 改编自 [LichAmnesia/awesome-ad-video-prompts](https://github.com/LichAmnesia/awesome-ad-video-prompts)（awesome-ad-video-prompts contributors），许可证 CC BY 4.0。

### 英文原版

```
Premium feature explainer for a [brand] clean-burn soy candle, shot as a slow exploded-view. 0-2s: intimate close-up on a single calm flame in a dim room, warm amber glow flickering across an amber-glass jar, soft wick crackle, the camera drifting in a slow handheld-feel float. 2-4s: the components gently lift apart in mid-air and hold — the glass jar, the soy wax core, the cotton wick, and the lid each separated by a few centimeters with thin labeled call-out lines drawing to each, while the flame stays lit on the suspended wick and gives off no soot. 4-6s: the parts glide smoothly back together and reassemble seamlessly into the intact lit candle, the camera dollying back to reveal a styled wooden shelf. 6-8s: a slow rack focus pulls from the flame down to the embossed logo on the glass. The candle and jar keep identical shape, amber tint, wax color, wick position, and label across separation and reassembly — no deformation, soot streaks, smoke artifacts, duplicated parts, or drift on the floating components. Warm golden grade, frosted-glass and soft-wax texture.
```
