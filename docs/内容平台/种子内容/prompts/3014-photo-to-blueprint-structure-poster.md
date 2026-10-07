---
title: "照片转结构蓝图海报提示词：上半实拍、下半透明工程图解（gpt-image-2）"
slug: photo-to-blueprint-structure-poster
model: gpt-image-2
topics: [poster, infographic]
aspectRatio: "3:4"
needsRefImage: true
useCase: "上传建筑、物品或场景照片，生成上下各半的设计海报：上半保留原照片，下半把主体重构成透明的结构蓝图（剖面、爆炸图、标注），适合建筑科普、设计作品集和展览视觉。"
prompt: |
  把我上传的每一张照片分别做成一张独立的高端设计海报，[3:4 竖版]，上下两部分各占一半高度。
  上半部分：保留原照片，做轻微的高级调色，有艺术画廊的质感；环境可以自然延展，但主体不变。
  下半部分：提取照片中最有辨识度的主体，重构成透明的结构蓝图和技术图解，展示有代表性的内部结构、连接方式、材料层次或空间逻辑，视觉语言介于工程图纸、X 光片和未来档案之间。根据主体理解"内部结构"：物品画零部件，建筑画空间构造与剖面，动物画运动轨迹；不要画血肉解剖。
  构图以主体为中心，使用透明图层、爆炸图和精细标注；细线条和清晰留白保证阅读路径干净。
  配色从上半照片的主色中提取，转成干净专业的[单色蓝图系统]（蓝、绿、红等），用透明度和高光营造层次。
  文字转化为技术标注和编辑排版：短标题和结构标签用引线和箭头整合进画面，保持高端杂志的克制美感。
  整体是工程秩序与编辑美感的结合，适用于从建筑到自然的任何主体。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/xiaoxiaodong01/status/2091374796517130282
  author: "小小东"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "原文中文说明的英文写法改写为中文提示词；画幅与单色系统改为变量；补充\"不同主体如何理解内部结构\"的示例"
images:
  - 3014-photo-to-blueprint-structure-poster-1.jpg
  - 3014-photo-to-blueprint-structure-poster-2.jpg
imageCredit:
  by: "小小东"
  url: https://youmind.com/gpt-image-2-prompts?id=32434
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：上传主体清晰、背景不太乱的照片，建筑和机械类效果最好。[单色蓝图系统] 可以指定颜色，比如"红色线稿系统"（示例里东京塔就是红色）、"墨绿色系统"；[3:4 竖版] 也可以改成"4:5 竖版"。一次上传多张照片会逐张出图。

示例图两张：东京塔的黄昏照片配红色线稿结构图（主立面、平面图、桁架节点、剖面小图，标题"TOKYO SIGNAL TOWER"）；天坛祈年殿配浅红色测绘图（立面、斗拱、台基剖面）。

**常见问题**：
- 下半变成普通线稿、没有"内部结构"：加"必须出现剖面或爆炸图，至少 3 处结构标注"。
- 上半照片被重画：强调"上半原样保留，只调色"。
- 人像照片：模型会画成"姿态 / 动线分析"，不会画解剖，但效果不如建筑和物品稳定。

**适合**：建筑与城市主题海报、设计作品集、科普账号配图、展览视觉。

### 原版提示词

```text
Please turn each uploaded photo into an independent high-end design poster. Use a {argument name="composition" default="3:4 vertical layout"} with two equal horizontal sections, each occupying 50% height.

The upper half preserves the original photo with subtle high-end color grading for a fine-art gallery feel. Environment can be extended naturally but the subject remains unchanged.

The lower half extracts the most recognizable subject and reconstructs it as a transparent structural blueprint and technical diagram. It reveals representative internal structures, connections, material layers, or spatial logic, creating a visual language between engineering drawings, X-rays, and futuristic archives. It interprets 'internal structure' based on the subject: components for objects, spatial construction for architecture, or motion paths for animals, avoiding fleshy anatomy.

The composition centers on the subject using transparent layers, exploded views, and fine annotations. Use fine lines and clear white space to maintain a clean reading path. The color palette is derived from the main color of the top photo, converted into a clean, professional {argument name="monochromatic system" default="monochromatic blueprint system"} (blue, green, red, etc.) with transparency and highlights for depth.

Text is transformed into technical annotations and editorial layout. Short titles and structural labels are integrated using lead lines and arrows, maintaining the restrained aesthetic of high-end magazines. The overall result is a combination of engineering order and editorial beauty, suitable for any subject from architecture to nature.
```

> 改编自 [小小东](https://x.com/xiaoxiaodong01/status/2091374796517130282) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
