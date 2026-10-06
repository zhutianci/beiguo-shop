---
title: seedance 提示词：香水广告视频（15 秒分段时间轴 · 模特与产品双参考图）
slug: seedance-perfume-commercial
model: seedance
topics: [product-video]
modelLabel: Seedance 2.0
aspectRatio: "16:9"
needsRefImage: true
useCase: 上传一张模特图和一张香水瓶图，生成"开场—喷香—走动—产品特写—定版"的 15 秒完整香水广告，适合品牌宣传片和投放素材初稿。
prompt: |
  生成一条 15 秒、16:9 的高端香水广告：写实电影感时尚短片，极简奢华，[祖母绿]色调环境，高反差布光点缀柔和的金色高光，玻璃反光细腻。
  参考图：图片 2 只作为模特参考，图片 1 只作为[品牌名]香水瓶参考。模特的长相、发型、身材比例和[祖母绿丝绸长裙]全程一致；香水瓶的形状、标签、瓶盖和材质全程完全一致。
  0–3 秒｜开场：第一帧就清楚看到模特，她居中摆出自信的时尚姿势，手持香水靠近胸前。画面明亮高级，不要黑场、灰背景或淡入。
  3–6 秒｜喷香：平滑推成近景。她举起香水朝颈侧喷一下，细密的香雾被金色光线照亮；随后放下瓶子，轻触锁骨。动作优雅克制。
  6–9 秒｜走动：切到全景。她缓缓转身向前走，镜头向后跟拍，长裙和头发自然飘动，周围有淡淡雾气和流动的金色光带。
  9–12 秒｜产品主镜头：高端微距，香水瓶悬浮在[祖母绿]环境中缓慢倾斜，玻璃与液体反光真实，伴有细微雾气和琥珀色光点。瓶身几何形状保持稳定。
  12–13.5 秒｜模特收尾：切回近景，她把头转向镜头，神情自信，金色轮廓光勾出侧影。
  13.5–15 秒｜定版：干净的产品定版画面，香水瓶居中，深黑背景配[祖母绿]辉光和金色边缘光。画面显示文字"[广告语]"，一位优雅的女声清晰念出这句话。
  风格：顶级香水广告，35mm 电影质感，真实的皮肤与面料纹理，可控运镜，浅景深，焦点转换精准。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-seedance-2-prompts
  url: https://x.com/MeenakshiYACS/status/2103462025871372380
  author: "@MeenakshiYACS"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: 英文原文译为中文；去掉原文中的品牌名，品牌、主色、服装、广告语改为变量；原文 STYLE 段在仓库中被截断，最后一句风格描述为本站补写
images:
  - 202-seedance-perfume-commercial-1.jpg
imageCredit:
  by: "@MeenakshiYACS"
  url: https://x.com/MeenakshiYACS/status/2103462025871372380
  license: CC BY 4.0
verify:
  - 实测 Seedance 2.0 多图参考时"图片 1 / 图片 2"的写法是否被正确识别（不同平台可能用 @图片1 之类的写法，以官方说明为准）
  - 平台是否拦截真人人脸参考图；如拦截，改用 AI 生成的虚拟模特图
  - 定版文字和女声念白是否准确
  - 确认原帖仍可访问、作者未另行声明保留权利
---
**时长与镜头**：6 段时间码正好 15 秒，前 3 秒必须"第一帧就有人"，这是投放广告防止用户划走的关键，别删。平台只支持更短时长时，保留"开场 + 产品主镜头 + 定版"三段。

**怎么填变量**：[祖母绿] 换成你品牌的主色，服装颜色最好与之呼应；[广告语] 用 2–4 个英文单词最稳。模特图请用你有授权的照片或 AI 虚拟模特，不要用明星照片。

**常见失败与调整**：
- 瓶子在不同镜头里变形：产品图用白底正面图，并保留"瓶身几何形状保持稳定"。
- 定版文字拼错、中文乱码：删掉"画面显示文字"，定版画面留空，后期加字。
- 喷雾动作手指别扭：把"喷一下"改成"把香水瓶举到颈侧"，喷雾用特写单独表现。

> 改编自 [@MeenakshiYACS](https://x.com/MeenakshiYACS/status/2103462025871372380) 发布、[YouMind-OpenLab/awesome-seedance-2-prompts](https://github.com/YouMind-OpenLab/awesome-seedance-2-prompts) 收录的提示词，许可证 CC BY 4.0。

### 英文原版

（原文中的品牌名已替换为 [brand]；仓库收录的原文在 STYLE 段被截断。）

```
15-second, 16:9 luxury perfume commercial. Photorealistic cinematic fashion film, minimalist luxury, rich emerald environment, high-contrast lighting with elegant soft golden accents, glossy reflections and premium macro product cinematography.

Use Image 2 ONLY as the model reference. Use Image 1 ONLY as the [brand] perfume bottle reference. Keep the model's identity, face, hair, body proportions and emerald silk dress consistent. Keep the perfume bottle design, shape, label, cap and materials identical throughout.

0–3s — HERO OPEN:
Start immediately with the woman clearly visible, centered in a confident fashion pose, wearing an emerald silk dress and holding the [brand] bottle near her chest. Her face, dress and bottle must be clearly visible from the first frame. Rich emerald background with soft golden highlights. Bright, premium and elegant. No dark shadows, gray background, empty frame or fade-in.

3–6s — SPRAY:
Smoothly move into a cinematic close-up. She raises the [brand] bottle and sprays once toward her neck. Fine perfume mist catches the golden light. She lowers the bottle and gently touches her collarbone. Elegant, controlled movement with realistic reflections and mist.

6–9s — FASHION MOVEMENT:
Cut to a wider shot. She slowly turns and walks forward while the camera tracks backward. Her emerald silk dress and hair move naturally. Emerald atmosphere expands around her with subtle mist and flowing golden light streaks.

9–12s — PRODUCT HERO:
Transition into a premium macro shot of the [brand] bottle floating in the emerald environment. The bottle slowly tilts and catches golden highlights. Show realistic glass, liquid reflections, subtle vapor trails and refined amber particles. Keep bottle geometry perfectly stable.

12–13.5s — FINAL MODEL:
Cut back to a tight fashion shot. She gently turns her head toward camera with a confident, elegant expression. Hair and silk fabric move softly in the air. Golden rim light outlines her silhouette.

13.5–15s — FINAL PACKSHOT:
Cut to a clean luxury packshot. [brand] bottle centered against a deep black background with an emerald glow and refined golden rim light. Display the words:
"ELEGANCE, DISTILLED."
A refined female voice clearly says: "Elegance, distilled."

STYLE:
Ultra-premium fragrance advertising, cinematic 35mm look, realistic skin and fabric texture, controlled camera movement, shallow depth of field, precise focus transitions, glossy l…
```
