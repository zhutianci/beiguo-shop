---
title: 移轴微缩旅行海报提示词：从地图里长出来的城市公路（gpt-image-2）
slug: tilt-shift-map-travel-poster
model: gpt-image-2
topics: [poster, photography]
aspectRatio: "1:1"
needsRefImage: false
useCase: 生成"一辆车沿着从复古地图里长出来的公路驶向城市天际线"的微缩景观海报，适合旅行账号封面、自驾游攻略头图。
prompt: |
  生成一张细节丰富、电影感的移轴微缩旅行场景：[重庆]。
  一辆写实的[黄色出租车]行驶在一条蜿蜒的高架公路上，这条路从一张印刷的复古城市地图上自然"长"出来。道路戏剧性地弯向远处[重庆]的天际线和地标，而车辆始终是前景中最清晰的焦点。
  真实城市与手绘地图无缝融合，让道路看起来就嵌在地图表面。加入当地可辨认的地标、水系、建筑、植被和氛围：[解放碑、洪崖洞、长江索道、两江交汇]，但构图保持干净、不杂乱。
  地图前景上直接印着大号粗体的"[CHONGQING]"。
  温暖的黄金时刻光线、浅景深、写实质感、电影感阴影、空中透视、照片级细节。
  整体像一张高级的旅行海报与微缩模型的结合。画幅 1:1。
negativePrompt: null
source:
  repo: EvoLinkAI/awesome-gpt-image-2-API-and-Prompts
  url: https://x.com/iamaiistudio/status/2066145999266128367
  author: "@iamaiistudio"
  license: CC0 1.0
  licenseUrl: https://creativecommons.org/publicdomain/zero/1.0/
  changes: 英文原文译为中文并合并短版与完整版；城市、车辆、地标和地图文字改为变量
images:
  - 121-tilt-shift-map-travel-poster-1.jpg
  - 121-tilt-shift-map-travel-poster-2.jpg
imageCredit:
  by: "@iamaiistudio"
  url: https://x.com/iamaiistudio/status/2066145999266128367
  license: CC0 1.0
verify:
  - 在 gpt-image-2 上实测 3 次，记录成功率与最常见的失败形式
  - 地图上的城市名拼写是否正确
  - 地标是否张冠李戴
  - 确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）
---
**怎么填变量**：[重庆] 和 [CHONGQING] 一起改；[黄色出租车] 可换成"红色复古小轿车""绿皮火车""骑电动车的外卖小哥"，交通工具越有城市特色越好看；地标写 3–4 个即可。

**常见问题**：
- 路和地图是两张皮：强调"道路是从地图纸面上隆起的立体模型"。
- 不像微缩、像普通航拍：加"移轴摄影，画面上下边缘强烈虚化，物体像玩具模型"。
- 地标画错：AI 对热门地标更准；小城市可以只写"江边、老街、山城"这类氛围词。

**迭代**：同一城市换不同交通工具出一组，就是一套统一风格的系列封面。

### 英文原版

```text
Render a photorealistic tilt-shift miniature scene of [CITY NAME] with a [VEHICLE NAME] winding along an elevated road that rises organically from a vintage illustrated city map. The road sweeps toward the city's iconic skyline in the background, with the vehicle as the main subject up front. Seamlessly merge the real cityscape with the hand-drawn map so the road feels naturally embedded. Feature the city name in large bold lettering on the map foreground. Apply warm golden-hour light, shallow depth of field, cinematic shadows, aerial perspective, and hyper-realistic detail. Final look: a luxury travel poster crossed with a miniature diorama. Aspect ratio 1:1.

Full prompt: 

Create a highly detailed cinematic miniature tilt-shift travel scene of [CITY NAME] featuring a realistic [VEHICLE NAME] driving along a winding elevated road that emerges naturally from a printed vintage-style city map. The road should curve dramatically toward the background skyline and landmarks of [CITY NAME], while the vehicle remains the clear focal point in the foreground.

Blend the real city seamlessly with the illustrated map surface so the road appears integrated into the map itself. Include recognizable local landmarks, waterways, architecture, vegetation, and atmosphere associated with [CITY NAME], but keep the composition clean and uncluttered.

Show large bold typography of "[CITY NAME]" printed directly on the map in the foreground. Use warm golden-hour lighting, shallow depth of field, realistic textures, cinematic shadows, aerial perspective, and photorealistic detail. The overall aesthetic should feel like a premium Instagram travel poster mixed with a miniature diorama.

Aspect ratio 1:1.
```

> 改编自 [@iamaiistudio](https://x.com/iamaiistudio/status/2066145999266128367) 发布、[EvoLinkAI/awesome-gpt-image-2-API-and-Prompts](https://github.com/EvoLinkAI/awesome-gpt-image-2-API-and-Prompts) 收录的提示词，仓库许可证 CC0 1.0；示例图同样来自该仓库收录的原帖出图。
