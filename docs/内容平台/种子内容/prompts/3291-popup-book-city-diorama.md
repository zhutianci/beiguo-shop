---
title: AI海报提示词：城市立体书微缩场景四宫格，地标从书页里"长"出来（可换国家 / 景区）
slug: popup-book-city-diorama
model: nano-banana
topics: [illustration, poster]
needsRefImage: false
aspectRatio: "16:9"
useCase: 做城市旅行合集、文旅宣传、地理科普视频封面时，输入一个类别（如"中国古都"），模型自动挑 4 个对象，各生成一本摊开的立体书：地标、街道和交通用纸艺立起来，书页上印着地图和图示。
prompt: |
  2x2 四宫格，16:9。从[亚洲城市]里挑选 4 个有代表性的对象，为每一个生成一张写实摄影风格的微缩立体书场景：
  - 自动推断每个对象的"特征基因"：地标、建筑、地形、基础设施、文化符号和小尺度参照物（车辆、船只、行人）；
  - 一本摊开的书作为物理底座，城市从书页上以纸艺工程的方式立体升起；
  - 能看到折叠平台、台阶、插槽、铰链、支撑杆等隐藏的纸艺机关；
  - 对象名称做成立体纸字或结构造型，立在场景上方，用[英文]书写；
  - 下方书页印着与该对象相关的地图、示意图或蓝图；
  - 一切看起来都由纸张、卡纸、油墨和微缩模型材料制成，立体书工艺精准；
  - 光线：[温暖的侧光]，深色背景，微距浅景深。
  除了类别本身，不要预设具体城市、地标、颜色或文字，全部由模型推断。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-nano-banana-pro-prompts
  url: https://x.com/Gdgtify/status/2082221056652443680
  author: "@Gdgtify"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: 译成中文并整理成要点；类别、名称文字语言、光线设为变量；把原文 SUBJECT_DNA / BASE_DOCUMENT 等代号改写成自然描述；按示例图补充深色背景和微距景深
images:
  - 3291-popup-book-city-diorama-1.jpg
imageCredit:
  by: "@Gdgtify"
  url: https://cms-assets.youmind.com/media/1785395942795_27fdn3_HOCZo_5WoAAiXCa.jpg
  license: CC BY 4.0
verify:
  - 换成"中国古都""中国 5A 景区"实测，看地标还原度和中文立体字是否准确
  - 示例图的书页小字多为装饰性乱码，展示时不必当作真实地图信息
  - 确认原帖仍可访问、作者未另行声明保留权利
---
**怎么填变量**：[亚洲城市] 写一个类别，模型会自己挑 4 个，比如"中国古都""欧洲首都""江南水乡古镇""世界著名大学"；想指定具体对象，可以直接写"北京、西安、南京、洛阳"。[英文] 改成"中文"就会出中文立体字，但字数多时更容易出错，建议用两个字的城市名。[温暖的侧光] 可换成"清晨柔和自然光""夜晚城市灯光"。示例图四格分别是四座亚洲城市：每本书上都立着红色或金色的城市名立体字，左上是高楼和红色铁塔加高架桥，右上是红墙宫殿群，左下是拱门和老火车，右下是摩天轮和海湾建筑，书页上都印着地图和小图示。

**常见问题与调整**：
- 四格风格不统一：加"四格使用同一本书、同一角度和同一光线"。
- 看起来像普通模型不像纸：强调"所有建筑边缘能看到纸张折痕和卡纸厚度"。
- 只想要一张大图：删掉四宫格，改成"为[城市名]生成一张立体书场景"，画幅 3:2。
- 地标认错：直接写出要出现的 2～3 个地标名称。

**适合**：旅行合集封面、文旅宣传、地理 / 历史科普配图、书店活动海报；不适合需要准确地图信息的导览用途。

### 英文原版

```
2x2 grid, 16:9, do this for 4 important {argument name="subject" default="Asian cities"}: Generate a photoreal miniature pop-up book diorama for {argument name="subject" default="Asian cities"}.Rules:- infer SUBJECT_DNA automatically- use BASE_DOCUMENT as the physical foundation- the subject must rise from the page as a paper-engineered 3D world- include inferred landmarks, architecture, terrain, infrastructure, cultural motifs, and small scale cues- show folded platforms, stairs, slots, hinges, support struts, and hidden paper mechanics- integrate the subject name or symbolic typography as raised paper letters or structural forms- the base page should contain an inferred map, diagram, blueprint, or printed context relevant to {argument name="subject" default="Asian cities"}- everything must feel crafted from paper, cardstock, ink, miniature model materials, and precise pop-up engineering- no hard-coded city, landmark, tower, temple, map, color, or text unless supplied
```

> 改编自 [@Gdgtify](https://x.com/Gdgtify/status/2082221056652443680) 发布、[YouMind-OpenLab/awesome-nano-banana-pro-prompts](https://github.com/YouMind-OpenLab/awesome-nano-banana-pro-prompts) 收录的提示词，仓库许可证 CC BY 4.0。
