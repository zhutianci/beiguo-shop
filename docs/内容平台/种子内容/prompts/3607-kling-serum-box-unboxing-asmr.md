---
title: 可灵提示词：护肤品礼盒开箱 ASMR（磁吸盒盖弹开冒冷气 · 滴管一滴落在镜面）
slug: kling-serum-box-unboxing-asmr
model: kling
topics: [product-video, ecommerce]
aspectRatio: "9:16"
needsRefImage: true
useCase: 适合有精致包装盒的产品（精华、香水、耳机、首饰）：俯拍磁吸盒盖弹开、产品从卡槽里被拿出、最后一个"滴落"特写收尾，做开箱种草和详情页包装展示视频。
prompt: |
  以我上传的产品图为准，生成一条约 6 秒的竖屏 9:16 俯拍开箱 ASMR 视频。
  场景：一只手感细腻的[哑光白色礼盒]，装着一瓶补水精华，放在冷灰色的鹅卵石上。
  0–2 秒：两只拇指按开磁吸盒盖，盒盖伴随一声轻柔的"噗"弹起，一缕细细的冷气从盒内飘出。
  2–4 秒：磨砂玻璃滴管瓶被竖直地从镂空卡槽里提出，瓶中[琥珀色]液体慢慢晃动，冰凉的瓶身上凝出水珠并往下滑。
  4–6 秒：橡胶滴头被按压，一颗饱满的金色液滴在管口鼓起、颤动，然后落下，在黑色镜面上漾开一圈涟漪。
  光线：顶部柔光箱漫射，湿润的高光；声音：淡淡的室内底噪，液滴落下时一声清脆的"嗒"。
  瓶子形状、标签字样和磨砂质感在每一帧都一致：不变形、不融化、不出现两根滴管、文字不扭曲。
negativePrompt: 瓶子变形，标签扭曲，两根滴管，手指畸形，多余的手，盒子穿模，乱码，水印
source:
  repo: LichAmnesia/awesome-ad-video-prompts
  url: https://github.com/LichAmnesia/awesome-ad-video-prompts#glass-serum-unbox
  author: "awesome-ad-video-prompts contributors"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文；补充\"以上传的产品图为准\"和负面提示词；礼盒外观、液体颜色改为变量"
images:
  - 3607-kling-serum-box-unboxing-asmr-1.jpg
imageCredit:
  by: "LichAmnesia/awesome-ad-video-prompts"
  url: https://github.com/LichAmnesia/awesome-ad-video-prompts/blob/main/images/glass-serum-unbox.png
  license: CC BY 4.0
verify:
  - 可灵实测 3 次：瓶子从卡槽提出时是否穿模、液滴是否只有一颗
  - 示例图是仓库提供的关键帧图（已转 JPG 压缩）
---
**时长与镜头**：6 秒三拍，全程俯拍、机位固定：开盖 → 取出 → 滴落。开箱类视频成败在第一拍"开盖瞬间"，所以首帧最好就是"盒子关着、产品看不见"的俯拍图，让模型只负责打开；如果首帧已经是打开的盒子，就把第一拍删掉。可灵 10 秒档可以在最后加"产品立在盒子旁边的定格"。

**怎么填变量**：[哑光白色礼盒] 照实际包装写；耳机可改为"耳机仓从海绵托里被拿出、盒盖合上发出咔哒声"，首饰改为"项链从丝绒槽里被提起，链条垂下轻轻摆动"。

**常见失败与调整**：
- 两只拇指穿进盒子里：改成"盒盖自己缓缓弹开"，手不出镜。
- 冷气太多像着火：删掉冷气，或写"极淡的一缕白雾"。
- 液滴落下后变成一滩：写明"一颗液滴、一圈涟漪"。

> 改编自 [LichAmnesia/awesome-ad-video-prompts](https://github.com/LichAmnesia/awesome-ad-video-prompts)（awesome-ad-video-prompts contributors），许可证 CC BY 4.0。

### 英文原版

```
Top-down macro on a fingertip-smooth matte-white box for [brand] [product], a hydrating face serum, resting on cool gray riverstone. 0-2s: two thumbs press the magnetic lid, which lifts with a soft pneumatic sigh as a thin ribbon of breath-mist curls out of the cold interior. 2-4s: the frosted glass dropper bottle is drawn straight up out of its die-cut cradle, amber liquid sloshing in slow viscous waves, condensation beading and trailing down the chilled glass. 4-6s: the rubber bulb compresses and one fat golden droplet swells at the pipette tip, hangs trembling, then falls and ripples outward across a black mirror surface. Diffused overhead softbox, dewy specular highlights, faint room tone with a single wet pluck on the droplet impact. The bottle holds a consistent shape, label typography, and frosted finish across every frame; no deformation, drift, melting, duplicate droppers, or warped text.
```
