---
title: 可灵提示词：痛点反转广告视频（烫嘴马克杯 → 黑场硬切 → 控温保温杯）
slug: kling-pattern-interrupt-mug-ad
model: kling
topics: [product-video, ecommerce]
aspectRatio: "9:16"
needsRefImage: false
useCase: 生成 6 秒竖屏"打断式"带货广告：冷光办公桌上被烫到 → 一秒黑场只剩一声碰撞 → 产品在午后暖光里登场。适合保温杯、电热水壶、暖手宝等"解决一个小痛点"的产品，黑场硬切也适合做投流视频的前 3 秒钩子。
prompt: |
  竖屏 9:16，约[6]秒、带硬切反转的产品广告。如果上传了产品图，保温杯外观以上传的图为准。
  0–2 秒（手持轻微抖动，冷白日光灯闪烁）：灰色办公桌上，一只普通马克杯冒出猛烈的蒸汽，嘴唇刚碰到杯沿就被烫得缩回去，伴随一声倒吸凉气的"嘶"。
  2–3 秒（硬切到纯黑画面）：黑场里只有一声清脆的陶瓷碰撞声，然后安静。
  3–6 秒（约 30mm 焦段缓慢推近，浅景深，背景是窗外的暖色光斑）：[智能控温保温杯]落在午后金色的阳光里，杯盖拧开，露出平静的、温度刚好的咖啡表面，只升起一缕轻轻的热气。
  保温杯在硬切前后的轮廓、[品牌标识]位置和拉丝金属质感保持一致。
  声音：被烫到的吸气声，黑场里的一声碰撞，然后是轻柔的倒水声和一声满足的呼气。
negativePrompt: 杯子变形，标识漂移，画面重影，材质闪烁，多余的手指，乱码文字，水印
source:
  repo: LichAmnesia/awesome-ad-video-prompts
  url: https://github.com/LichAmnesia/awesome-ad-video-prompts#burnt-tongue-steady-sip
  author: awesome-ad-video-prompts contributors
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: 英文原文译为中文；原文为通用视频模型提示词（适用 Seedance / Veo / 可灵 / Runway），本站按可灵的用法补充"以上传的产品图为准"和负面提示词；时长、产品、标识改为变量
images:
  - 539-kling-pattern-interrupt-mug-ad-1.jpg
imageCredit:
  by: LichAmnesia/awesome-ad-video-prompts
  url: https://github.com/LichAmnesia/awesome-ad-video-prompts/blob/main/images/burnt-tongue-steady-sip.png
  license: CC BY 4.0
verify:
  - 在可灵实测 3 次，记录所用模型版本、可选时长（以官方为准）和是否生成音效
  - 单条生成里能否出现"纯黑一秒"的硬切，还是会被处理成渐变过渡
  - 示例图是仓库提供的关键帧图（第一段：冷光办公桌上冒热气的马克杯，已转 JPG 压缩），不是可灵成片截图
---
**时长与镜头**：结构是"痛点 2 秒 + 黑场 1 秒 + 产品 3 秒"。黑场是整条的灵魂：它把观众的注意力"重置"一下，产品镜头才显得干净。很多模型单条里不愿意给纯黑，最稳的做法是分两条生成（痛点段、产品段），剪辑时中间插 0.5–1 秒黑场，碰撞声后期加。

**怎么填变量**：[智能控温保温杯] 换成"[恒温电热水壶]""[便携暖手宝]"，痛点段跟着改：被烫到 → 等水烧开等到不耐烦 → 冻得搓手。冷暖对比（冷白灯 → 金色阳光）不要改，它是"问题 → 解决"的视觉信号。

**常见失败与调整**：
- 嘴唇特写变形：改成"手指碰到杯壁被烫得缩回"，不出现嘴。
- 产品段的杯子和上传图不一样：把产品段单独做图生视频，首帧直接用产品图。

> 改编自 [LichAmnesia/awesome-ad-video-prompts](https://github.com/LichAmnesia/awesome-ad-video-prompts)（awesome-ad-video-prompts contributors），许可证 CC BY 4.0。

### 英文原版

```
Vertical product ad with a hard pattern-interrupt. SUBJECT: a coffee vessel — first a scalding office mug, then [brand] temperature-smart tumbler. 0–2s (handheld micro-shake, cold fluorescent flicker): a plain mug on a gray desk erupts with violent steam, lips graze the rim and recoil, a sharp inhaled hiss. 2–3s (hard cut to pure black): one clean ceramic clink, silence. 3–6s (slow 30mm push-in, shallow depth, warm window bokeh): the [brand] tumbler lands in golden afternoon light, the lid twisting open to reveal a calm matte-still coffee surface at drinkable temperature, only a gentle thread of vapor rising. FIDELITY: the tumbler keeps one consistent silhouette, logo placement, and brushed-metal finish across the cut — no deformation, label drift, doubling, or texture flicker. SOUND: flinch breath, the black-frame clink, then a soft pour and a satisfied exhale.
```
