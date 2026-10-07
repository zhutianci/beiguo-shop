---
title: "微缩景观提示词：一杯咖啡里的微缩城市（奶泡做地形、热气升腾）（gpt-image-2）"
slug: miniature-city-in-coffee-cup
model: gpt-image-2
topics: [figurine]
aspectRatio: "4:3"
needsRefImage: false
useCase: "一句短提示词生成\"杯中微缩世界\"的超现实写实图：咖啡和奶泡变成地形、街道和发光的小房子，小桥和小人在里面走动，晨光和热气，适合咖啡店创意海报、品牌概念图和壁纸。"
prompt: |
  生成一张超现实但照片级写实的图：一座[微缩城市]建在一[杯咖啡]里。
  奶泡和咖啡液形成地形和街道，上面是一座座发着暖光的小建筑，有小桥和走动的小人。
  热气戏剧化地升腾起来，温暖的晨光照在场景上。
  俏皮、高度精细、视觉丰富，像高端商业概念图。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/miratechtool/status/2098099843382042647
  author: "Mira"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文；主体和容器改为变量"
images:
  - 3116-miniature-city-in-coffee-cup-1.jpg
imageCredit:
  by: "Mira"
  url: https://youmind.com/gpt-image-2-prompts?id=34318
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：两个变量可以随意组合：[微缩城市] 换成"微缩港口小镇""微缩森林村庄""微缩滑雪场"，[杯咖啡] 换成"碗拉面""杯奶茶""块提拉米苏""碗麦片"。容器决定了地形颜色（奶茶是奶棕、拉面是汤和面条），想要特定风格就在后面加"欧洲古城风格""江南水乡风格"。

示例图是一只放在木桌上的陶瓷咖啡杯，杯里深色咖啡变成水道，奶泡堆成小岛，上面是一片亮着暖灯的欧洲风小城、教堂和小桥，水道里有小船，杯口飘着热气，背景是虚化的可颂和咖啡壶。

**常见问题**：
- 城市太小看不清：写"微缩城市占满整个杯口，近距离拍摄"。
- 像 CG 模型：加"微距摄影、浅景深、真实的咖啡和奶泡质感"。
- 想放品牌杯子：上传你的杯子照片，写"杯子外观按参考图"。

**适合**：咖啡 / 茶饮店创意海报、品牌概念图、社媒趣味内容、壁纸。

### 英文原版

```text
Create a surreal yet photorealistic image of a {argument name="subject" default="miniature city"} built inside a {argument name="vessel" default="cup of coffee"}. The foam and liquid should form terrain, streets, and tiny glowing buildings, with little bridges and small people moving around. Show steam rising dramatically and warm morning light hitting the scene. Make it whimsical, highly detailed, and visually rich, like a premium commercial concept.
```

> 改编自 [Mira](https://x.com/miratechtool/status/2098099843382042647) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
