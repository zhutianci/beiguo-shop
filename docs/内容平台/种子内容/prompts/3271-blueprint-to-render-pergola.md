---
title: 建筑效果图提示词：木花架手绘施工图到实景效果图，一张草图一张落地照（gpt-image-2）
slug: blueprint-to-render-pergola
model: gpt-image-2
topics: [interior, illustration]
needsRefImage: false
aspectRatio: "3:4"
useCase: 做庭院改造方案、木作 / 景观小品的客户沟通、"图纸 vs 成品"对比内容时，先生成一张带尺寸标注的铅笔施工图，再生成结构比例一致的花园实景图，也可以合成一张左右对比图。
prompt: |
  方式一：左右对比图
  建筑分屏画面：左边是白纸上手绘铅笔的[木质花园廊架]蓝图，正立面加略带侧面的视角，有构造线、尺寸标注和手写说明，立柱和横梁画得精确，专业又带手绘感；右边是同一个廊架在真实花园里完全建成的样子，从低角度的正面转角、人眼高度拍摄，看得到完整的木梁厚度；天然木纹、真实的榫卯和连接件，立在草地上，周围是[绣球和花境]，柔和日光，影子落地。写实建筑可视化。画幅[16:9]。

  方式二：分两张生成
  1. 图纸：白纸上手绘铅笔的[木质花园廊架]建筑草图，正立面加略带侧面，比例清楚；有构造线、尺寸（如"[总宽 4500mm]"）和手写说明，立柱和横梁精确绘制；底部写项目信息"[项目：花园廊架 / 材料：防腐木]"；专业但手绘的技术风格，干净的白背景。画幅[3:4]。
  2. 成品：完全建成的木廊架立在真实花园里，结构和比例与草图完全一致；从低角度的正面转角、人眼高度看过去，表现纵深和完整的梁架结构，而不是平面立面；天然木纹、真实的接头与连接件；立在草地上，周围是[绣球和花境]；柔和日光，影子落地。写实建筑可视化。画幅[3:4]。
negativePrompt: null
source:
  repo: EvoLinkAI/awesome-gpt-image-2-API-and-Prompts
  url: https://x.com/iamaiistudio/status/2067142493389603170
  author: "@iamaiistudio"
  license: CC0 1.0
  licenseUrl: https://creativecommons.org/publicdomain/zero/1.0/
  changes: 译成中文；把原文的"分屏总提示词"和"草图 / 成品两段提示词"整理成方式一、方式二；构筑物、尺寸、项目信息、植物设为变量
images:
  - 3271-blueprint-to-render-pergola-1.jpg
  - 3271-blueprint-to-render-pergola-2.jpg
imageCredit:
  by: "@iamaiistudio"
  url: https://github.com/EvoLinkAI/awesome-gpt-image-2-API-and-Prompts/blob/main/images/comparison_case107/output.jpg
  license: CC0 1.0
verify:
  - 第 1 张示例图右下角有生成平台的小星形标记，展示前确认是否需要裁掉
  - 页面需提醒"图上尺寸由模型生成，不能直接用于施工，需由专业人员核算"
  - 确认原帖仍可访问、作者未另行声明保留权利
---
**怎么填变量**：[木质花园廊架] 可以换成"阳台木花箱""庭院秋千架""露台木平台""儿童树屋"；尺寸写你自家院子的大致数字；[绣球和花境] 换成"竹子和石灯笼"就是日式庭院，换成"多肉和砾石"就是干景。示例图第 1 张是白纸上的铅笔立面图：总宽 4500mm，两根立柱、弧形斜撑、顶部格栅，旁边英文标注椽子、主梁、螺栓和混凝土基础，底部写着项目、材料、比例；第 2 张是对应的实景：红棕色木廊架立在草坪上，顶部一排格栅，弧形斜撑清楚，左边是粉紫色花丛，前景有一条石板小路。

**常见问题与调整**：
- 成品和草图结构对不上：用方式二时，把第一张图上传再生成第二张，写"严格按上传草图的结构和比例建造"。
- 草图太"干净"像 CAD：加"铅笔线有轻重变化，有擦除痕迹和手写字"。
- 想要中文标注：写"所有尺寸和说明用中文手写"，标注控制在 6 处以内。
- 想看不同材质：成品追问"同样结构，换成黑色铝合金材质"。

**适合**：庭院改造方案沟通、木作 / 景观小品展示、"图纸 vs 成品"类内容；不适合直接当作施工图纸使用。

### 英文原版

```
Architectural split-scene: left side shows a hand-sketched pencil blueprint of a wooden garden pergola on white paper, front and slight side elevation with construction lines, dimension labels, and handwritten notes, posts and crossbeams precisely drafted in a professional hand-sketched technical style. Right side shows the finished pergola fully built in a real garden, photographed from a low front-corner angle at eye level showing the full timber beam depth. Natural wood texture with realistic joints, installed on grass with surrounding plants, soft daylight and grounded shadows. Photorealistic architectural visualization.

Pergola Blueprint Prompt: Hand-drawn architectural pencil sketch of a wooden garden pergola on white paper. Front and slight side elevation view with clear proportions.

Construction lines, dimensions and handwritten notes visible. Wooden posts and cross beams precisely drafted. Professional but hand-sketched technical style. Clean white background.

Finished Pergola: Fully built wooden pergola in a real garden, matching the exact structure and proportions from the sketch. Viewed from a low front corner perspective at eye level, showing depth and the full beam structure instead of a flat elevation. Natural wood texture with realistic joints and connections. Installed on grass with surrounding plants. Soft daylight with grounded shadows. Photorealistic architectural visualization.
```

> 改编自 [@iamaiistudio](https://x.com/iamaiistudio/status/2067142493389603170) 发布、[EvoLinkAI/awesome-gpt-image-2-API-and-Prompts](https://github.com/EvoLinkAI/awesome-gpt-image-2-API-and-Prompts) 收录的提示词，仓库许可证 CC0 1.0。
