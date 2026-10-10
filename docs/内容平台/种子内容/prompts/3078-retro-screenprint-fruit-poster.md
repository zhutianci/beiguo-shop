---
title: "国潮水果海报提示词：复古丝网印刷风麒麟西瓜海报（手绘大字 + 太阳光芒）（gpt-image-2）"
slug: retro-screenprint-fruit-poster
model: gpt-image-2
topics: [poster, food]
aspectRatio: "3:4"
needsRefImage: false
useCase: "生成一张高饱和、复古丝网印刷质感的 Q 版矢量水果海报：奶黄底太阳光芒、田垄藤蔓、手绘圆润大字标题和绿色飘带副标题，适合水果店、农产品、夏日促销的海报和包装贴纸。"
prompt: |
  竖版 3:4 的麒麟西瓜主题商业海报，正面平面设计。
  [奶黄色]满版背景，带低对比的浅橙色太阳光芒图案和散落的浅绿色瓜子。
  右下方摆放一个完整的椭圆形麒麟西瓜、一个对半切开的西瓜和两块散开的瓜片，准确表现深绿色纵向条纹、薄绿皮、鲜红细腻的瓜瓤、少量自然的黑籽和晶莹的汁水。
  左上方是粗壮、圆润、俏皮的手绘字体标题"[麒麟西瓜]"：瓜瓤红填色、奶白内描线、深绿外描边，一颗瓜子巧妙地与部分笔画互动，但不影响辨认。
  副标题"[红瓤多汁 清甜爽口]"放在一条绿色波浪飘带上，英文"QILIN WATERMELON"做成一枚弧形小印章。
  背景加入瓜田垄线、卷曲的瓜藤、瓜花、小水珠和半调网点；前景用放大的叶片框住边缘。
  高饱和的 Q 版矢量插画，复古丝网印刷颗粒，清晰的平涂层次，保留印刷出血区域，不要黑色背景。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/Mrpinecone888/status/2082732425478565928
  author: "Mr.pinecone"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "原文中文说明的英文写法改写为中文；背景色、主标题、副标题改为变量"
images:
  - 3078-retro-screenprint-fruit-poster-1.jpg
imageCredit:
  by: "Mr.pinecone"
  url: https://youmind.com/gpt-image-2-prompts?id=30253
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：把"麒麟西瓜"换成其他水果时，标题、副标题、英文小印章和画面里的水果描述都要改，例如"[阳光玫瑰]＋[颗颗饱满 香甜脆爽]""[赣南脐橙]＋[果肉细嫩 酸甜多汁]"；[奶黄色] 背景可以换成"浅薄荷绿""淡粉色"与水果颜色撞色。

示例图是奶黄底、浅橙太阳光芒的竖版海报：左上红色胖胖的手绘大字"麒麟西瓜"带深绿描边，下面绿色飘带写着"红瓤多汁 清甜爽口"，右上一枚圆形英文小印章，右下一个整瓜、半个切开的西瓜和两块瓜片，背景是瓜田、藤蔓和黄色瓜花。

**常见问题**：
- 标题字被瓜子挡住看不清：写"瓜子只装饰一个笔画末端"。
- 画风偏写实：强调"Q 版矢量插画，平涂色块"。
- 用于印刷：生成的是位图，大尺寸印刷需要重新矢量化。

**适合**：水果店海报、农产品电商、夏日促销物料、包装贴纸。

### 原版提示词

```text
Vertical 3:4 Qilin watermelon theme commercial poster, front-view graphic design, {argument name="background color" default="creamy yellow"} full background, with low-contrast light orange sunburst patterns and light green melon seed scatters. A whole oval Qilin watermelon, a half-cut watermelon, and two scattered melon slices are placed in the bottom right, accurately depicting dark green longitudinal stripes, thin green rind, bright red delicate pulp, a few natural black seeds, and glistening juice; the top left features a bold, rounded, and playful hand-drawn font for '{argument name="main title" default="Qilin Watermelon"}', with pulp-red fill, creamy white inner lines, and dark green outlines, where a melon seed cleverly interacts with partial strokes without affecting legibility; the subtitle '{argument name="subtitle" default="Red Pulp, Juicy, Sweet and Refreshing"}' is placed on a green wavy ribbon, with the English 'QILIN WATERMELON' as a curved small seal. The background adds melon field ridge lines, curling vines, melon flowers, small water droplets, and halftone dots, while the foreground uses enlarged leaves to frame the edges. High-saturation Q-version vector illustration, retro screen printing grain, clear flat painting layers, maintaining print bleed areas, no black background.
```

> 改编自 [Mr.pinecone](https://x.com/Mrpinecone888/status/2082732425478565928) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
