---
title: 即梦提示词：烟火气夜市街拍（红灯笼 + 日光灯 + 摊位蒸汽 + 拥挤人潮，横版纪实感）
slug: night-market-street-food-photo
model: jimeng
topics: [food, photography]
needsRefImage: false
aspectRatio: "16:9"
useCase: 做美食探店、城市文旅、夜经济宣传的封面或配图时用，得到人声鼎沸、蒸汽升腾、灯笼与日光灯交织的夜市纪实照片感画面。
prompt: |
  一张记录[台北夜市]鲜活街头生活的照片。
  - 场景：人潮拥挤，空气里弥漫着小吃摊冒出的热气和蒸汽；
  - 灯光：[红灯笼]和白色日光灯混杂在一起，杂乱却很美；
  - 前景可以有一位摊主正在[翻炒铁板小吃]，蒸汽从锅边升起；
  - 画面充满活力和细节，真实还原当地的氛围，场景连贯、生活细节丰富；
  - 纪实摄影风格，略高的机位俯瞰街道纵深；
  - 横版画幅[16:9]。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-seedream-4.5
  url: https://github.com/YouMind-OpenLab/awesome-seedream-4.5#no-60-vibrant-taipei-night-market-scene
  author: "@jaredliu_bravo"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: 译成中文并拆成要点；地点、主光源、前景摊主动作、画幅设为变量；按示例图补充了前景摊主和机位描述，删去"世界知识"等模型能力说法
images:
  - 3356-night-market-street-food-photo-1.jpg
imageCredit:
  by: "@jaredliu_bravo"
  url: https://cms-assets.youmind.com/media/1765360152044_pk5sb6_e9ddfef112bb3b2bd6c55bfd15e05e2b643bb8e136662189eef61b6b7b729ec6-600x337.png
  license: CC BY 4.0
verify:
  - 示例图招牌上的汉字多为无意义组合，用于宣传时注意检查或要求"招牌文字模糊不可读"
  - 换成"成都宽窄巷子小吃街""西安回民街"出一次，看地域特色是否体现
  - 确认原帖仍可访问、作者未另行声明保留权利（CC BY 4.0 需保留署名）
---
原作者用 Seedream 4.5 生成；即梦里选用 Seedream 系列图片模型使用。

**怎么填变量**：[台北夜市] 换成任何夜市或小吃街，比如"长沙坡子街""西安回民街""曼谷考山路"；[红灯笼] 可以换成"霓虹招牌""串串灯泡"；[翻炒铁板小吃] 换成当地特色，如"烤串冒烟""煮螺蛳粉""摊煎饼"。示例图是一条挤满人的夜市街道：两侧挂满一串串红灯笼，远处有霓虹招牌，右下角一位戴帽子的摊主在冒着白汽的铁锅前忙活，前景是摆满小吃的摊台。

**常见问题与调整**：
- 人脸太清晰有肖像顾虑：加"人群以背影和侧影为主，面部虚化"。
- 招牌文字乱码：加"招牌文字模糊不可读"，或指定一两个简单的招牌字，如"烧烤"。
- 太像摆拍：加"手持抓拍，轻微运动模糊，噪点感"。
- 做竖版封面：画幅改 9:16，机位改成"站在街道中间平视，纵深感更强"。

**适合**：美食探店封面、城市文旅宣传、夜经济主题配图；用于宣传具体某个夜市时，建议以实拍照片为准。

### 英文原版

```
A photo capturing the vibrant street life of a night market in Taipei. The scene is crowded with people, and the air is filled with steam from food stalls. The market is illuminated by a chaotic but beautiful mix of red lanterns and fluorescent lights. The image should be full of energy and detail, capturing the authentic atmosphere of the location with high scene coherence and rich world knowledge. –ar 16:9
```

> 改编自 [@jaredliu_bravo](https://x.com/jaredliu_bravo) 发布、[YouMind-OpenLab/awesome-seedream-4.5](https://github.com/YouMind-OpenLab/awesome-seedream-4.5) 收录的提示词，仓库许可证 CC BY 4.0。
