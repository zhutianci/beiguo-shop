---
title: "照片转等轴测微缩建筑海报提示词：上半实拍、下半脚手架立方体（gpt-image-2）"
slug: photo-to-isometric-scaffold-poster
model: gpt-image-2
topics: [poster, interior]
aspectRatio: "3:4"
needsRefImage: true
useCase: "上传一张街景或场景照片，生成上下各半的竖版设计海报：上半保留原照片，下半把场景轮廓转成等轴测切块的微缩建筑景观，外面包着脚手架结构，适合设计作品集和展览海报。"
prompt: |
  用我上传的照片做一张高级设计海报，3:4 竖版，上下 1:1 分成两半。
  上半部分：保留原照片，做杂志感调色。
  下半部分：把照片主体的轮廓转译成一个 3D 微缩建筑景观，用等轴测视角或"切开的立方体"构图。这一部分用极简几何形体、平涂色块和细线，画在带纹理的白纸上，像手绘建筑插画。
  加入一套有逻辑的脚手架结构，包裹或支撑整个微缩景观，仿佛它正在被建造或测绘。立方体底部可以露出剖面（地层、水体等）。
  配色：从照片中提取，但处理得更明亮、清透、治愈。
  在下半部分左上角放一个小标题 [URBAN LIGHTHOUSE] 和一行编号、一句短副标题，右侧竖排一行小字，留出大量空白。
  整体风格：现代、优雅、有艺术感，把等轴测景观和极简海报设计结合在一起。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/xiaoxiaodong01/status/2093347851330027909
  author: "小小东"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "原文为中文说明的英文写法，本站重写为中文；标题文字、配色倾向改为变量；补充标题排版与留白说明"
images:
  - 3002-photo-to-isometric-scaffold-poster-1.jpg
  - 3002-photo-to-isometric-scaffold-poster-2.jpg
imageCredit:
  by: "小小东"
  url: https://youmind.com/gpt-image-2-prompts?id=32868
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：上传构图清楚的照片，街道、建筑群、草地上的人或车都可以。[URBAN LIGHTHOUSE] 是下半部分的英文小标题，可以换成任何你想要的作品名，例如"FIELD RUN STUDY 01"，也可以写中文"城市灯塔"。想让配色更冷静，把"明亮、清透、治愈"改成"低饱和、灰调"。

示例图有两张：一张是黄昏纽约街道，下半是被脚手架包围的街区切块，底部露出蓝色水层和小灯塔；另一张是草地上的老爷车和奔跑的人，下半变成草皮立方体，剖面是土层和水层，人和车成了白色小模型。

**常见问题**：
- 下半部分和上半照片无关：加"下半的建筑和物体必须与照片中的主体一一对应"。
- 脚手架太乱：写"脚手架只围绕立方体四周，线条细而规整"。
- 上半照片被改动：强调"上半部分原样保留，只调色"。

**适合**：设计作品集封面、展览 / 讲座海报、建筑与城市主题的公众号头图。

### 原版提示词

```text
Create high-end design posters from uploaded photos with a 3:4 vertical composition, split 1:1 between top and bottom. The top preserves the original photo with magazine-style grading. The bottom translates the subject's contours into a 3D miniature architectural landscape using an isometric view or cut cube composition. This section uses minimal geometric shapes, flat colors, and fine lines on white textured paper, resembling hand-drawn architectural illustrations. Incorporate a logical scaffolding system that wraps or supports the structure as if it's being constructed or mapped. Use high-end, bright, and healing color palettes derived from the photo but processed to be more vivid and light. The final style is modern, elegant, and artistic, blending isometric landscapes with minimalist poster design.
```

> 改编自 [小小东](https://x.com/xiaoxiaodong01/status/2093347851330027909) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
