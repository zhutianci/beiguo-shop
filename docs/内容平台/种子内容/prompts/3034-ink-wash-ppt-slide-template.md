---
title: "水墨风PPT提示词：宣纸 + 墨圈 + 红印章的东方极简幻灯片模板（gpt-image-2）"
slug: ink-wash-ppt-slide-template
model: gpt-image-2
topics: [ppt]
aspectRatio: "16:9"
needsRefImage: false
useCase: "一个可反复套用的中式水墨风幻灯片模板：填入标题、要点、视觉元素和版式偏好，就能逐页生成宣纸底、墨圈、远山和红印章的东方极简 PPT，示例是一页\"Agent Loop 深度解析\"封面。"
prompt: |
  标题：[Agent Loop 深度解析]：揭秘 AI 智能体的心脏
  要点：
  - 要点 1：简洁描述
  - 要点 2：核心数据或事实
  - 要点 3：关键结论
  视觉元素：带纹理的宣纸背景、水墨远山、禅意墨圈（圆相）、红色印章、薄雾般的灰色晕染。整体风格保持[安静、克制、侘寂、东方奢华]。
  版式偏好：居中构图，标题压在墨圈之上，四周大面积留白（也可选左右分栏、左对齐文字配留白）。
  文字层级：标题用大号展示型衬线字，正文用正文衬线字，保证视觉平衡和清晰的阅读顺序。
  连贯性：如果是后续页面，保持与上一页相同的背景纹理和色调（#F5F0E8 宣纸色、#2C3E2D 墨绿黑），印章位置保持一致，确保整套风格统一。
  画幅 16:9。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/dotey/status/2052948362668732781
  author: "宝玉"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "原文模板译为中文并补全各栏的默认填写示例；标题与整体风格改为变量"
images:
  - 3034-ink-wash-ppt-slide-template-1.jpg
imageCredit:
  by: "宝玉"
  url: https://youmind.com/gpt-image-2-prompts?id=19268
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：标题换成你的页面标题；三条要点按实际内容填写（封面页可以只写标题和一行副标题，像示例那样写"核心定义 | 主要职责 | 设计目标"）；整体风格的四个词可以换成"清雅 / 留白 / 书卷气"。做整套 PPT 时，每页只改"标题、要点、版式偏好"，"视觉元素"和"连贯性"两段原样保留。

示例图是一页 16:9 封面：米色宣纸底，左侧一个大大的淡墨圆相，中央黑色衬线大字"Agent Loop 深度解析：揭秘 AI 智能体的心脏"，下面一行小字，下方两侧是淡墨远山和松树，右上角一枚红色小印章。

**常见问题**：
- 中英混排的标题断行难看：在提示词里写明"标题分两行：第一行……第二行……"。
- 墨圈压住文字看不清：写"墨圈颜色很淡，只作背景"。
- 每页风格漂移：把色值和印章位置写死，必要时上传上一页作为参考图。

**适合**：技术分享 / 讲座 PPT、读书会、东方美学主题汇报、课程封面。

### 原版提示词

```text
Title: {argument name="Title" default="Enter slide title here"}

Key Points:
- [Point 1: Concise description]
- [Point 2: Core data or facts]
- [Point 3: Key conclusions]

Visual Elements: 
[Describe visual elements, e.g., Textured rice paper background, Ink-wash motifs, Enso circle, Red seal mark, Mist-grey effects]. The overall style should remain {argument name="visual style" default="Quiet / Restrained / Wabi-Sabi / Contemporary East-Asian Luxury"}.

Layout Preference: 
[Layout description, e.g., Split layout, Centered layout, Left-aligned text with negative space].

Text Hierarchy: 
[Text hierarchy, e.g., Large Display Serif for the title, Body Serif for the body text, ensuring visual balance and clear reading order].

Continuity Note: 
[Continuity description, e.g., keep the same background texture and color tone (#F5F0E8, #2C3E2D) as the previous page, use similar seal placement for visual consistency].
```

> 改编自 [宝玉](https://x.com/dotey/status/2052948362668732781) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
