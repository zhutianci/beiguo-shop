---
title: 可灵提示词：第一视角眼镜广告（镜片起雾看不清 → 一擦变清晰 · 雨夜公交）
slug: kling-foggy-lens-pov-ad
model: kling
topics: [product-video, ecommerce]
aspectRatio: "9:16"
needsRefImage: false
useCase: 生成 8 秒竖屏"第一视角痛点广告"：先透过起雾的旧眼镜看模糊的雨夜城市，换上新镜片后一道清晰带扫过画面、霓虹瞬间锐利。适合防雾镜片、眼镜店、清洁喷雾的投流素材，也能套用到"模糊 → 清晰"类卖点（屏幕膜、车窗镀膜）。
prompt: |
  竖屏 9:16，约[8]秒的第一视角眼镜广告。如果上传了眼镜产品图，镜框外观以上传的图为准。
  0–2 秒（第一视角，压抑感，随呼吸轻微晃动）：整个画面像隔着一层起雾的旧镜片：雨水划过的公交车窗外，霓虹招牌晕成一团团看不清的色块，车流声闷闷的。
  2–4 秒（第一视角稳定下来）：一双手把旧眼镜摘下，换上[防雾镜片眼镜]；一道清晰的竖向"擦拭带"从画面顶部扫到底部，所过之处霓虹的边缘立刻变得锐利。
  4–8 秒（一次缓慢平稳的转头摇镜）：湿漉漉的城市完全清晰：镜片反光干净，车窗上的雨滴颗颗分明，车窗倒影里露出一个自信的微笑，映着暖色的店铺灯光。
  镜框形状、镜片颜色和倒影里的脸全程保持一致。
  声音：沙沙的雨声，镜腿卡好时轻轻一声"咔"，城市环境声随画面变清晰也一起变得清楚。
negativePrompt: 镜框融化，镜框变形，双瞳孔，画面扭曲，重影，多余的手指，文字，水印
source:
  repo: LichAmnesia/awesome-ad-video-prompts
  url: https://github.com/LichAmnesia/awesome-ad-video-prompts#foggy-lens-sharp-city
  author: awesome-ad-video-prompts contributors
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: 英文原文译为中文；原文为通用视频模型提示词（适用 Seedance / Veo / 可灵 / Runway），本站按可灵的用法补充"以上传的产品图为准"和负面提示词；时长、产品改为变量
images:
  - 537-kling-foggy-lens-pov-ad-1.jpg
imageCredit:
  by: LichAmnesia/awesome-ad-video-prompts
  url: https://github.com/LichAmnesia/awesome-ad-video-prompts/blob/main/images/foggy-lens-sharp-city.png
  license: CC BY 4.0
verify:
  - 在可灵实测 3 次，记录所用模型版本、可选时长（以官方为准）和是否生成音效
  - 「擦拭带」清晰效果能否一次生成；不能的话是否需要拆成"模糊段 + 清晰段"首尾帧生成
  - 示例图是仓库提供的关键帧图（第一段：起雾的眼镜与雨夜车窗，已转 JPG 压缩），不是可灵成片截图；站长实测后可替换
---
**时长与镜头**：三段对应"痛点 → 动作 → 结果"。时长选得短时，把 4–8 秒那段压到 2 秒左右，保留"擦拭带"这个记忆点；选得长时，可以在结尾加"镜片特写，品牌名浮现"。

**怎么用**：第一视角最难的是"眼睛在哪"。这条提示词全程用画面虚实表示视线，不出现主角的脸，只在车窗倒影里露一下，生成成功率比让模型拍人脸高。想更稳，可以用首尾帧：首帧放一张模糊的雨夜车窗图，尾帧放一张清晰的同场景图，提示词只保留 2–4 秒那一段。

**怎么填变量**：[防雾镜片眼镜] 可换成"[防蓝光眼镜]""[新的近视眼镜]"；场景换成"[冬天进门的地铁口]""[火锅店里]"，起雾更有共鸣。

**常见失败与调整**：
- 擦拭带变成真的抹布：写"一道光学上的清晰带，像对焦一样扫过，没有实物"。
- 倒影里的脸变形：删掉倒影那句，结尾改成"镜头停在清晰的霓虹街景上"。

> 改编自 [LichAmnesia/awesome-ad-video-prompts](https://github.com/LichAmnesia/awesome-ad-video-prompts)（awesome-ad-video-prompts contributors），许可证 CC BY 4.0。

### 英文原版

```
Vertical first-person POV ad. SUBJECT: eyewear — fogged old glasses replaced by [product] anti-fog lenses. 0–2s (POV, claustrophobic, faint head-bob): the whole frame is smeared through misted glass on a rain-streaked bus window, neon signs bleeding into useless soft blobs, muffled traffic. 2–4s (POV steady, single squeegee-style wipe of clarity sweeping top-to-bottom): hands lift the old pair away and seat [product] lenses, and a vertical band of crisp focus drags across the frame, neon edges snapping sharp. 4–8s (one slow smooth head-turn pan): the wet city resolves razor-sharp — clean lens reflections, droplets on the window now individually defined, a small confident smile catching warm shop light. FIDELITY: frame shape, lens tint, and the face in any reflection stay consistent — no melting, double pupils, warping, or ghosting. SOUND: rain hush, a soft click as the lenses seat, city ambience pulling into clarity.
```
