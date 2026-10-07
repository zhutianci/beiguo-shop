---
title: AI海报提示词：手持明信片里的城市美食，边上坐着微缩旅行者+地标路牌（gpt-image-2 文旅模板）
slug: travel-food-postcard
model: gpt-image-2
topics: [food, poster]
needsRefImage: false
aspectRatio: "4:5"
useCase: 做文旅账号封面、城市美食攻略、旅行社宣传图时，填入城市、美食和地标，生成"手举明信片 + 微缩小人 + 当地街景和路牌"的超写实画面，换城市就能批量出一套。
prompt: |
  生成一张超写实的"旅行美食明信片"场景。
  输入：城市 [城市名]；当地美食 [当地美食]；背景地点 [地标或街区]。
  - 前景：一只真实的手举着一张复古旅行明信片；
  - 明信片里：一张大尺寸、超写实的[当地美食]照片，像高端美食广告，食物比例被放大，质感丰富、摆盘诱人、自然光、微微冒热气、浅景深；明信片下方手写城市名；
  - 微缩旅行者：一个背着背包的小人自然地坐在明信片上沿，双腿垂在正面，正低头欣赏这道美食——他是画面的情感焦点，制造强烈的尺度反差；
  - 明信片外：[城市名]的[地标或街区]真实街景，有当地建筑、街道、文化元素和色彩；
  - 环境里自然地立着一块木质指路牌，四块牌子写与这座城市相关的地点或美食，例如"[老街]""[江边]""[夜市]""[小吃街]"；
  - 视觉层级：微缩旅行者 > 明信片里的美食 > 城市背景 > 路牌。
  风格：超写实摄影，高端文旅广告感，电影化叙事，金色夕阳光，浅景深，色彩丰富，旅行杂志品质，画幅[4:5]竖版。
negativePrompt: null
source:
  repo: EvoLinkAI/awesome-gpt-image-2-API-and-Prompts
  url: https://x.com/Naiknelofar788/status/2065241908327378969
  author: "@Naiknelofar788"
  license: CC0 1.0
  licenseUrl: https://creativecommons.org/publicdomain/zero/1.0/
  changes: 译成中文并拆成要点；保留城市 / 美食 / 地标三个输入变量，把"路牌自动生成"改为可手填的四个变量；补充明信片手写城市名；删掉重复的风格堆词
images:
  - 3252-travel-food-postcard-1.jpg
  - 3252-travel-food-postcard-2.jpg
imageCredit:
  by: "@Naiknelofar788"
  url: https://github.com/EvoLinkAI/awesome-gpt-image-2-API-and-Prompts/blob/main/images/poster_case382/output.jpg
  license: CC0 1.0
verify:
  - 第 2 张示例图左侧店招出现了一家真实咖啡馆的店名，展示时考虑裁掉或替换该图
  - 用国内城市（如成都、西安）出一次，看路牌中文和地标是否准确
  - 确认原帖仍可访问、作者未另行声明保留权利
---
**怎么填变量**：三个核心变量一起换，例如"[成都] + [钟水饺] + [宽窄巷子]""[西安] + [肉夹馍] + [钟楼]""[厦门] + [沙茶面] + [鼓浪屿]"；路牌四块写当地的街区或小吃名，中文每块 2～4 个字最稳。示例图第 1 张是伊斯坦布尔版：手举明信片，里面是撒满开心果碎的果仁蜜饼，背包小人坐在卡片上沿，背后是圆顶清真寺和土耳其国旗，右边木路牌写着四个英文地名；第 2 张是巴黎版：明信片里是可颂，背景是铁塔和街角咖啡馆。

**常见问题与调整**：
- 小人太大或浮在空中：加"小人只有明信片高度的五分之一，臀部坐实在卡片边缘，有投影"。
- 地标长得不像：模型对国内地标还原不稳定，可写更具体的外观，或上传一张实拍图作背景参考。
- 路牌字乱：减少到三块牌子，或写"路牌文字为[……]，不要生成其他文字"。
- 想做一组：保持提示词不变，只换三个城市变量，风格会比较统一。

**适合**：文旅账号封面、城市美食攻略、旅行社 / 酒店宣传图；用于商业宣传时，避免画面里出现真实店铺招牌。

### 英文原版

```
Create a hyper-realistic travel-food postcard scene.
INPUTS:
City: [CITY NAME]
Local Delicacy: [LOCAL DELICACY]
Background Location: [BACKGROUND LOCATION OR LANDMARK]
SCENE:
A real human hand is holding a vintage travel postcard in the foreground.
Inside the postcard is a large, beautifully styled, ultra-realistic food photograph of [LOCAL DELICACY], captured like premium food advertising. The dish should appear larger than life, with rich textures, realistic details, appetizing presentation, natural lighting, subtle steam, shallow depth of field, and cinematic food photography.
A single miniature traveler wearing a backpack sits naturally on the top edge of the postcard with legs dangling over the front. The traveler should be realistic, highly detailed, and positioned so they appear to be admiring the local delicacy. The miniature traveler acts as the emotional focal point and creates a strong sense of scale and wonder.
Outside the postcard is the authentic destination environment of [BACKGROUND LOCATION OR LANDMARK] in [CITY NAME]. The background should feature recognizable local architecture, streets, scenery, cultural elements, landmarks, atmosphere, colors, and visual details unique to the destination.
Include a rustic wooden directional signpost naturally integrated into the environment. The signpost must automatically generate four short destination-specific labels based on the city, culture, attractions, food scene, landmarks, neighborhoods, natural features, or travel experiences associated with the location.
The generated signboards should feel authentic to the destination and enhance the travel storytelling.
Composition hierarchy:
Miniature traveler
Local delicacy inside postcard
Destination background
Destination signpost
Style: Hyper-realistic photography, luxury tourism campaign aesthetic, cinematic storytelling, authentic destination atmosphere, realistic hand, realistic miniature traveler, highly detailed food photography, natural golden-hour lighting, shallow depth of field, rich colors, editorial travel magazine quality, Instagram-worthy social media content, visual wow factor, vertical 4:5 aspect ratio, extremely detailed, premium commercial advertising.
```

> 改编自 [@Naiknelofar788](https://x.com/Naiknelofar788/status/2065241908327378969) 发布、[EvoLinkAI/awesome-gpt-image-2-API-and-Prompts](https://github.com/EvoLinkAI/awesome-gpt-image-2-API-and-Prompts) 收录的提示词，仓库许可证 CC0 1.0。
