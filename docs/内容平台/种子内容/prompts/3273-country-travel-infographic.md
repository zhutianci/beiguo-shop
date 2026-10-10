---
title: 信息图提示词：国家 / 城市旅行信息图海报，立体地图标出各地亮点+速览栏+底部照片条（gpt-image-2）
slug: country-travel-infographic
model: gpt-image-2
topics: [infographic, poster]
needsRefImage: false
aspectRatio: "2:3"
useCase: 做旅行攻略封面、文旅宣传图、地理课件时，输入一个国家、省份或城市，生成杂志级的竖版旅行信息图：中间是带地标的立体地图，四周标注各地区特色，右侧是概况速览，底部是一排目的地照片。
prompt: |
  制作一张高端杂志风的旅行信息图海报，主题是[国家或地区名]，干净的 3:4 竖版构图。
  - 顶部：超大的标题"[国家或地区名]"，上方一行小字口号"[一句口号]"，下方一行关键词（如文化 · 历史 · 美食 · 生活方式）和两三行简介；
  - 中央：一张立体微缩风格的地图，地图上用小型 3D 模型表现各地区的代表地标和风景，6～8 个地区各有一个引线标签，写地名和一句特色；
  - 右侧"[概况速览]"栏：人口、语言、货币、首都、最大城市、面积、代表花卉等，每项一个小图标；
  - 中下部：一排 6 个图标卡片，概括主要旅行主题（地标、艺术、美食、自然、时尚、浪漫等）；
  - 底部：一条横向照片带，5～6 张写实目的地照片，每张下方一行说明，最下方一句手写体结束语"[结束语]"；
  - 风格：米白纸底，优雅的衬线标题字，配色取自该地区的代表色，角落点缀[当地代表花卉]，排版疏朗、信息清晰。
  画幅[3:4]竖版。
negativePrompt: null
source:
  repo: EvoLinkAI/awesome-gpt-image-2-API-and-Prompts
  url: https://x.com/Ankit_patel211/status/2056519161023787394
  author: "@Ankit_patel211"
  license: CC0 1.0
  licenseUrl: https://creativecommons.org/publicdomain/zero/1.0/
  changes: 原文只有一句话，本站译成中文后参照示例图补充了标题区、立体地图、速览栏、主题图标、底部照片带和配色；国家名、口号、结束语等设为变量
images:
  - 3273-country-travel-infographic-1.jpg
imageCredit:
  by: "@Ankit_patel211"
  url: https://github.com/EvoLinkAI/awesome-gpt-image-2-API-and-Prompts/blob/main/images/poster_case291/output.jpg
  license: CC0 1.0
verify:
  - 原文只有一句话，示例图的版式是模型自行发挥，页面不要声称"一句话就能出同款"
  - 示例图速览栏的人口、面积等数字由模型生成，页面需提醒核对；示例图实际比例接近 2:3
  - 确认原帖仍可访问、作者未另行声明保留权利
---
**怎么填变量**：[国家或地区名] 可以是国家，也可以是"云南""新疆""浙江"这样的省份或一座城市；口号和结束语写一句当地特色的话，如"彩云之南，四季如春"；[当地代表花卉] 云南可写"山茶花"。速览栏的数据建议自己查好写进去。示例图是"FRANCE"版：顶部红蓝相间的大字标题，左上角是一个凯旋门图案的小标签，中间是一块立体法国地图，上面有铁塔、城堡、薰衣草田和海岸，周围标注巴黎、诺曼底、卢瓦尔河谷、普罗旺斯等地，右侧是"FRANCE AT A GLANCE"速览栏，右上角有樱花枝，底部一排六张照片和一句法语手写体。

**常见问题与调整**：
- 地图形状不准：模型画国家 / 省份轮廓常有偏差，可加"地图轮廓仅作示意"或上传一张轮廓图作参考。
- 中文标签挤：地区标签控制在 6 个以内，每个只写地名 + 四字特色。
- 数据编错：把速览栏的数字直接写进提示词，不要让模型自己填。
- 想做横版 PPT：画幅改 16:9，地图放左，速览栏和照片放右。

**适合**：旅行攻略封面、文旅宣传图、地理 / 文化课件；不适合未经核对直接作为统计数据来源。

### 英文原版

```
Create an ultra-premium editorial travel infographic poster about FRANCE in a clean vertical 3:4 ratio.
```

> 改编自 [@Ankit_patel211](https://x.com/Ankit_patel211/status/2056519161023787394) 发布、[EvoLinkAI/awesome-gpt-image-2-API-and-Prompts](https://github.com/EvoLinkAI/awesome-gpt-image-2-API-and-Prompts) 收录的提示词，仓库许可证 CC0 1.0。
