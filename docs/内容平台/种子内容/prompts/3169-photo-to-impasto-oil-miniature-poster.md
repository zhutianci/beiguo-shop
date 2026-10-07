---
title: "照片转油画提示词：上半实拍、下半厚涂刮刀油画微缩景的治愈系海报（gpt-image-2）"
slug: photo-to-impasto-oil-miniature-poster
model: gpt-image-2
topics: [illustration, poster]
aspectRatio: "3:4"
needsRefImage: true
useCase: "上传一张照片（鸟、人物、风景），生成上下各半的竖版海报：上半是调色后的原照片，下半把主体重构成厚涂油画质感的微缩立体小景，颜料堆叠、刮刀痕明显，白纸大量留白，适合摄影作品展示、治愈系社媒图和装饰画。"
prompt: |
  请把我上传的每一张照片分别做成一张独立的高端设计海报：3:4 竖版，上下两部分各占 50% 高度。
  上半部分：保留原照片的主体身份、结构和质感，做有艺术感的摄影调色。
  下半部分：提取主体的身份特征和姿态，把它重构成一个 3D 厚涂油画微缩景观插画：用厚重的笔触、颜色堆叠和雕塑般的体积，做出精致、有触感的微缩小场景。
  构图上在有纹理的白纸上留出大片空白，一条清晰的厚涂色带托住主体（作为水面、地面或光路）。
  画风强调厚涂油画、微缩实体和清透的光，保留可见的颜料堆积和刮刀痕迹。
  颜色从原照片最明亮的色调中提取，用暖白和清晰的冷暖对比营造明亮、清新、治愈的氛围。
  极简的排版作为艺术注释（左上一个小标题、一行小字，左下角编号）。
  整体明亮、清新、有雕塑感，避免浑浊和廉价玩具感。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/xiaoxiaodong01/status/2091337011403882991
  author: "小小东"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "原文中文说明的英文写法改写为中文，并补充了小号排版文字的写法"
images:
  - 3169-photo-to-impasto-oil-miniature-poster-1.jpg
  - 3169-photo-to-impasto-oil-miniature-poster-2.jpg
imageCredit:
  by: "小小东"
  url: https://youmind.com/gpt-image-2-prompts?id=32342
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：这条没有方括号变量，关键是上传的照片：主体明确、背景简单的照片效果最好（枝头的小鸟、放风筝的人、一只猫）。想指定小标题，就加一句"左上小标题写：Morning Berries"（中文也可以）。

示例图两张：一只叼着红色浆果的乌鸫停在枝头，下半变成厚涂油画的小鸟站在开满小花的枝条上，下方一片蓝色颜料像水面，旁边一轮黄色太阳，左上"Morning Berries"；另一张是夕阳下河边放风筝的女孩，下半是厚涂的蓝色水面小路和花草，女孩举手望向风筝，左侧手写"Chasing the Sun"。

**常见问题**：
- 下半不够"厚"：强调"颜料堆积 3～5 毫米厚，有刮刀刮出的棱角"。
- 变成普通油画而不是微缩景：保留"白纸大量留白、只有中间一小片场景"。
- 上半照片被改动：写"上半保留原照片，只调色"。

**适合**：摄影作品展示、治愈系社媒图、装饰画、宠物 / 鸟类摄影海报。

### 原版提示词

```text
Please turn each photo I upload into a standalone high-end design poster. Use a 3:4 vertical composition, split into two equal 50% height sections. The top half preserves the original photo with its identity, structure, and texture, enhanced by artistic photography grading. The bottom half extracts the subject's identity and posture to reconstruct it as a 3D impasto oil painting micro-landscape illustration. This section should use thick brushstrokes, color stacking, and sculptural volume to create a delicate, tactile miniature scene. The composition features large negative space on white textured paper, with a clear impasto color band supporting the subject (as water, ground, or light path). The painting style emphasizes impasto oil, miniature entities, and clear light, retaining visible paint buildup and palette knife marks. Colors are extracted from the brightest tones of the original photo to create a bright, fresh, and healing atmosphere using warm whites and clear cold/warm contrasts. Minimalist typography acts as artistic annotation. The overall aesthetic is bright, fresh, and sculptural, avoiding muddy or cheap toy looks.
```

> 改编自 [小小东](https://x.com/xiaoxiaodong01/status/2091337011403882991) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
