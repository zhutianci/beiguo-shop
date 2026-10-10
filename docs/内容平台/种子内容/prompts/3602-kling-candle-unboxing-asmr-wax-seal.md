---
title: 可灵提示词：香薰蜡烛开箱 ASMR 视频（拧盖—撕封签—按蜡面—划火柴点燃）
slug: kling-candle-unboxing-asmr-wax-seal
model: kling
topics: [product-video, ecommerce]
aspectRatio: "4:5"
needsRefImage: true
useCase: 给香薰蜡烛、手工皂、果酱罐这类"有盖子的小罐子"做 8 秒解压开箱视频：拧开盖子、撕掉封签、指尖按一下、点火，适合小红书 / 抖音的开箱种草和详情页氛围视频。
prompt: |
  以我上传的产品图为准，生成一条约 8 秒的 4:5 俯拍开箱 ASMR 视频。
  场景：一只[琥珀色螺纹玻璃]香薰蜡烛，盖子密封，放在铺着天然亚麻布的桌面上，周围散落着干花和干草。柔和的俯拍光线。
  0–2 秒：一只手拧开[木质]盖子，伴随轻微的摩擦声；接着慢慢撕下圆形封口贴纸，黏胶被拉长后"啪"地断开。
  2–4 秒：指尖轻轻按进光滑、未点燃的[大豆蜡]表面，留下一个小凹痕，凹痕慢慢回平。
  4–6 秒：一根长火柴划燃，溅出几点火星，木质烛芯被点着，发出细小的噼啪声，火苗变大，暖琥珀色的光映在螺纹玻璃上。
  6–8 秒：一缕细烟在慢动作中盘旋上升，烛芯底部开始出现一圈晶亮的融蜡。
  画面：温暖的烛光调色，深而跳动的阴影，亲密的"撕—按—噼啪"解压质感。
  罐子形状、玻璃螺纹和标签全程一致，不变形、不漂移、不出现第二根烛芯。
negativePrompt: 罐子变形，两根烛芯，火焰形状怪异，手指畸形，多余的手，标签乱码，画面闪烁，文字，水印
source:
  repo: LichAmnesia/awesome-ad-video-prompts
  url: https://github.com/LichAmnesia/awesome-ad-video-prompts#candle-wax-press
  author: "awesome-ad-video-prompts contributors"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文；补充\"以上传的产品图为准\"和负面提示词；罐子材质、盖子材质、蜡的种类改为变量"
images:
  - 3602-kling-candle-unboxing-asmr-wax-seal-1.jpg
imageCredit:
  by: "LichAmnesia/awesome-ad-video-prompts"
  url: https://github.com/LichAmnesia/awesome-ad-video-prompts/blob/main/images/candle-wax-press.png
  license: CC BY 4.0
verify:
  - 在可灵实测 3 次，重点看撕封签和划火柴两个手部动作是否穿模
  - 可灵当前模型是否会生成同期音效（以官方说明为准），不会的话后期配 ASMR 音效
  - 示例图是仓库提供的关键帧图（已转 JPG 压缩），不是成片截图
---
**时长与镜头**：8 秒四段，全程俯拍、机位基本不动，靠手部动作推进节奏，这正是开箱 ASMR 的拍法。可灵只能选 5 秒时，保留"拧盖撕签"和"点火"两段；10 秒时在最后加 2 秒"火苗静静燃烧"的定格。4:5 是小红书笔记最占屏的比例，抖音可改 9:16。

**怎么填变量**：[琥珀色螺纹玻璃] 照着产品实际外观写；没有木盖的产品把"拧开木质盖子"改成"揭开金属盖"；手工皂可以把点火段换成"用小刀切下一角，露出断面纹理"。

**常见失败与调整**：
- 手和火柴穿模、手指数量不对：把"一只手"改成"画面边缘伸进来的手指"，少露手。
- 划火柴后火苗出现在奇怪位置：把点火段单独生成，提示词写"火柴靠近烛芯，烛芯被点亮"。
- 声音描述没有效果：可灵部分版本不出同期声，ASMR 音效建议后期从音效库补，效果更可控。

> 改编自 [LichAmnesia/awesome-ad-video-prompts](https://github.com/LichAmnesia/awesome-ad-video-prompts)（awesome-ad-video-prompts contributors），许可证 CC BY 4.0。

### 英文原版

```
Soft top-down on a ribbed amber-glass candle from [brand] [product], lid sealed, set on natural linen scattered with dried botanicals. 0-2s: a hand twists the wooden lid off with a faint grind, then peels the round wax-seal sticker slowly as the adhesive tack stretches and snaps. 2-4s: a fingertip presses gently into the smooth unburnt soy surface, leaving a soft dimple that slowly settles flat again. 4-6s: a long match strikes with a scatter of sparks and the wooden wick catches with a tiny audible crackle, the flame swelling and casting warm amber light across the ribbed glass. 6-8s: a thin thread of smoke curls upward in slow motion as the first melt pool begins to glisten at the wick base. Cozy candlelit color grade, deep flickering shadows, intimate crackle-and-peel ASMR. The jar keeps a consistent shape, glass ribbing, and label across frames; no deformation, drift, duplicate wicks, or artifacts.
```
