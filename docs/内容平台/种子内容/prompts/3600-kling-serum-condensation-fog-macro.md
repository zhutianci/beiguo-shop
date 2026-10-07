---
title: 可灵提示词：精华液瓶冷雾微距广告（凝结水珠 + 滴管慢动作 · 竖屏 6 秒）
slug: kling-serum-condensation-fog-macro
model: kling
topics: [product-video, image-to-video]
aspectRatio: "9:16"
needsRefImage: true
useCase: 上传一张精华液 / 安瓶 / 香水瓶的产品图，生成"冷雾里水珠滑落—滴管滴下一滴—环绕打出轮廓光"的 6 秒高级感竖屏广告，适合详情页主图视频、小红书和抖音的新品预告。
prompt: |
  以我上传的产品图为准，生成一条约 6 秒的竖屏 9:16 护肤品广告视频。
  场景：一支[磨砂玻璃精华液瓶]立在湿润的黑色板岩上，瓶身下半截埋在贴地翻滚的冷雾里，一盏冷色主光从画面左侧低角度扫过。
  0–2 秒：极近微距缓慢推进，掠过瓶身上密集的凝结水珠，水珠轻轻颤动、顺着玻璃滑落，焦点锐利、背景奶油般虚化。
  2–4 秒：雾气像呼出的一口气那样慢慢变薄，玻璃滴管被提起，一滴[琥珀色]精华在慢动作中脱落，落下前在管口挂成一颗饱满的水珠。
  4–6 秒：镜头顺时针环绕约 30 度，一道暖色轮廓光包住瓶身上的[品牌标签]，玻璃边缘折射出淡淡的彩虹光。
  瓶身形状、液面高度和磨砂质感全程保持一致，不变形、不漂移、不融化、不闪烁。
  声音：低沉的室内底噪，一声轻微的玻璃碰响，一滴水落下的"嗒"声。
negativePrompt: 瓶身变形，液面跳变，标签乱码，多余的滴管，画面闪烁，拖影，塑料质感，文字，水印
source:
  repo: LichAmnesia/awesome-ad-video-prompts
  url: https://github.com/LichAmnesia/awesome-ad-video-prompts#frost-glass-serum-condensation-macro
  author: "awesome-ad-video-prompts contributors"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文；补充\"以上传的产品图为准\"和负面提示词，便于可灵图生视频使用；瓶子材质、精华颜色、品牌标签改为变量"
images:
  - 3600-kling-serum-condensation-fog-macro-1.jpg
imageCredit:
  by: "LichAmnesia/awesome-ad-video-prompts"
  url: https://github.com/LichAmnesia/awesome-ad-video-prompts/blob/main/images/frost-glass-serum-condensation-macro.png
  license: CC BY 4.0
verify:
  - 在可灵图生视频实测 3 次，记录所用模型版本、可选时长（5 秒 / 10 秒等以官方为准）和是否带音效
  - 2–4 秒滴管提起时是否出现第二根滴管或液滴凭空出现
  - 示例图是仓库提供的关键帧图（已转 JPG 压缩），不是可灵成片截图
---
**时长与镜头**：原作 6 秒三段：微距推进 → 滴管慢动作 → 小角度环绕。可灵选 5 秒时，把每段压到 1.5 秒左右，或干脆删掉第三段的环绕，只保留"水珠 + 滴落"；选 10 秒时可以在结尾加一段"瓶子静止，雾气重新漫上来"的定格，给后期留放文案的位置。竖屏 9:16 适合短视频平台，做淘宝主图视频可改 1:1 或 3:4。

**怎么填变量**：[磨砂玻璃精华液瓶] 写清材质和瓶型，例如"透明玻璃安瓶""棕色滴管瓶"；[琥珀色] 换成自家精华的真实颜色，透明精华就写"清透的"。首帧最好用深色背景、45 度侧拍的产品图，画面里已经有黑色台面和冷光，模型只需要加雾和运动，成功率高很多。

**常见失败与调整**：
- 雾气把瓶子整个吞掉：把"埋在冷雾里"改成"雾气只在台面上薄薄一层"。
- 滴管提起时瓶盖一起飞走或出现两根滴管：删掉滴管动作，改成"一滴水珠从瓶肩滑落到台面"。
- 标签文字变成乱码：后期叠加真实标签，提示词里只写"标签保持不变"，不要要求清晰文字。

> 改编自 [LichAmnesia/awesome-ad-video-prompts](https://github.com/LichAmnesia/awesome-ad-video-prompts)（awesome-ad-video-prompts contributors），许可证 CC BY 4.0。

### 英文原版

```
A frosted-glass serum bottle stands on wet black slate, half-buried in low-rolling cold fog, a single cool key light raking from camera-left. 0-2s: extreme macro push-in across the condensation field, beads trembling and sliding, dewy texture razor-sharp at f2.8 with creamy fall-off. 2-4s: the mist thins on a slow exhale, the glass pipette lifts and one amber drop releases in slow motion, surface tension holding a perfect bead before it lands. 4-6s: a 30-degree clockwise orbit wraps a warm rim light around the [brand] label, the glass throwing a faint prismatic edge. Bottle holds constant shape, fill level, and matte finish throughout — no deformation, drift, melting, or flicker. Implied sound: low room tone, a soft glass tick, one droplet plink.
```
