---
title: 可灵提示词：墨镜大片广告（正午沙漠 · 镜片微距光斑 + 升降俯拍 · 1:1）
slug: kling-sunglasses-desert-editorial
model: kling
topics: [product-video, fashion]
aspectRatio: "1:1"
needsRefImage: true
useCase: 墨镜、防晒用品、夏季单品的户外大片感广告：镜片微距光斑、移焦看全貌、摇臂升到俯拍、低角度环绕带热浪，适合电商主图视频和季节性新品海报动起来。
prompt: |
  以我上传的产品图为准，生成一条约 6 秒的 1:1 墨镜杂志广告视频，场景是正午时分起伏着细纹的浅色沙丘。
  0–2 秒：极近微距掠过镜片表面，一层淡淡的[茶色渐变]镀膜上，一个反射的太阳光斑沿着弧面缓缓爬过。
  2–4 秒：移焦拉开，露出整副[板材墨镜]静静放在暖色沙子上；然后摇臂缓缓升起，变成干净的正俯拍主视觉，强烈的顶光切出锋利的阴影。
  4–6 秒：镜头降到 30 度低角度缓慢环绕，镜腿闪过一道亮光，身后地平线上有微微的热浪扭曲。
  镜框形状、铰链细节、镜片颜色和镜腿刻字全程一致：不扭曲、不重影、边缘不融化。
  画面：高对比、被阳光漂白的光线，抛光板材和颗粒沙子的质感。
  声音：干燥的风声，远处一只昆虫的嗡嗡声。
negativePrompt: 镜框扭曲，镜腿弯曲，重影，边缘融化，镜片颜色变化，沙子穿模，文字，水印
source:
  repo: LichAmnesia/awesome-ad-video-prompts
  url: https://github.com/LichAmnesia/awesome-ad-video-prompts#eyewear-desert-noon
  author: "awesome-ad-video-prompts contributors"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文；补充\"以上传的产品图为准\"和负面提示词；镜片颜色、镜框材质改为变量；原文品牌刻字改为\"镜腿刻字\""
images:
  - 3616-kling-sunglasses-desert-editorial-1.jpg
imageCredit:
  by: "LichAmnesia/awesome-ad-video-prompts"
  url: https://github.com/LichAmnesia/awesome-ad-video-prompts/blob/main/images/eyewear-desert-noon.png
  license: CC BY 4.0
verify:
  - 可灵实测 3 次：摇臂升到俯拍时镜框是否变形
  - 示例图是仓库提供的关键帧图（已转 JPG 压缩）
---
**时长与镜头**：6 秒三段：微距光斑 → 移焦 + 升到俯拍 → 低角度环绕。与本站另一条"暗场光带扫过"的眼镜广告相比，这条是户外、自然光、强阴影的夏日调性。可灵 5 秒档可以删掉最后的环绕；10 秒档在俯拍处多停 2 秒，方便后期叠加文案。

**怎么填变量**：[茶色渐变] 和 [板材墨镜] 按实物填；场景沙丘可换成"白色礁石海边""泳池边的水磨石地面"，热浪换成"水面反光在镜片上晃动"。

**常见失败与调整**：
- 升到俯拍时镜腿折叠或多出一条：把"摇臂升起"改成"镜头缓慢推近"。
- 光斑变成一大片过曝：写"一个小而锐利的光点"。
- 沙子把墨镜埋住一半：写"墨镜平放在沙面上，镜腿完全可见"。

> 改编自 [LichAmnesia/awesome-ad-video-prompts](https://github.com/LichAmnesia/awesome-ad-video-prompts)（awesome-ad-video-prompts contributors），许可证 CC BY 4.0。

### 英文原版

```
Editorial eyewear campaign for [brand] acetate sunglasses against pale rippled desert dunes at high noon. 0-2s: extreme macro across the lens surface, a thin gradient tint and a single reflected sun-flare crawling along the curve. 2-4s: rack focus pulls back to reveal the full frame resting on warm-toned sand, then a slow crane lifts to a clean top-down hero, hard overhead light carving sharp-edged shadows. 4-6s: the camera drifts into a low 30-degree orbit, the temple arm catching a bright glint, faint heat shimmer warping the horizon behind. The frame shape, hinge detail, lens tint, and brand etch stay consistent throughout — no warping, doubling, melted edges, or artifacts. High-contrast bleached lighting, polished-acetate and grainy-sand texture, dry wind whisper and a lone insect drone.
```
