---
title: "金句海报提示词：深色圆角面板 + 超大引号的品牌语录卡（亮色描边）（gpt-image-2）"
slug: quote-card-poster-dark-panel
model: gpt-image-2
topics: [poster]
aspectRatio: "3:4"
needsRefImage: false
useCase: "输入一句话和署名，生成一张品牌感的金句海报：几乎占满画面的深色圆角面板、外圈一圈亮色描边、超大块状引号、三四行大号圆润无衬线正文和署名，适合公众号金句卡、小红书语录和品牌社媒。"
prompt: |
  围绕一句金句做一张品牌金句海报。
  画面被组织成一块几乎占满视野的深色圆角信息面板，中间用两个上下相连的圆角区域形成一个小小的内凹"腰部"缺口；外围只留一圈明亮的纯色，让外框像一条高能量的色带包住平静的核心。
  面板上半部分保留一大片空的深色区域，左上内边距处放一个很小的品牌标识；在这片空白的下沿放一对醒目的粗块状起始引号（上端斜切、下端直角），紧靠在一起作为阅读入口。
  金句放在面板左中部，排成三到四行宽松的大号文字，使用轻盈、几何、圆润的无衬线字体，行长不一但左边距稳定，文字承担主要信息重量；作者名用中号字单独一行放在下面，身份说明再缩小一级并略微缩进，形成从金句到署名清晰的尺度跳跃和阅读节奏。
  面板下方继续是宽阔的深色区域，右下角隐藏一对很大的、颜色只比背景稍亮的结束引号作为装饰；底边左右各一行极小的功能文字（如"关注""收藏"）。
  金句："[你对别人好，就是想别人也对你好]"
  署名：[地球人]
  身份说明：来自网络
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/xiaoxiaodong01/status/2089527550536216727
  author: "小小东"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "原文中文说明的英文写法改写为中文；补全被截断的面板下半部分描述；金句和署名改为变量"
images:
  - 3171-quote-card-poster-dark-panel-1.jpg
  - 3171-quote-card-poster-dark-panel-2.jpg
imageCredit:
  by: "小小东"
  url: https://youmind.com/gpt-image-2-prompts?id=31789
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：金句和署名换成你的内容，金句建议 20～40 字，太长会挤满面板；外圈亮色可以指定，例如"外圈用荧光黄绿 / 亮蓝 / 薄荷绿"，示例里三张分别用了三种颜色；左上角的小品牌标识可以写你的账号名。

示例图两张：荧光黄绿外框的深色面板，大号黄绿色引号下是四行白字"这句话的含金量还在上升：你对别人好，就是想别人也对你好……"，署名"地球人 / 来自网络"；亮蓝外框的版本写着"你觉得一个人过得好，可能是因为跟她不熟。"，右下角都有一对暗色大引号。

**常见问题**：
- 中文有错字：每行不超过 14 个字，生成后逐字检查。
- 版式乱：保留"左边距稳定、署名单独一行"。
- 引用名人名言：请核实出处后再署名，避免张冠李戴。

**适合**：公众号金句卡、小红书语录图、品牌社媒、朋友圈配图。

### 原版提示词

```text
Build a brand golden phrase poster centered on a quote based on any theme. Organize the screen into a dark rounded information panel that occupies almost the entire field of view, and use two vertically connected rounded areas in the middle to form a small recessed waist gap. The periphery retains only a circle of bright pure color, making the outer frame look like a high-energy ribbon enclosing a calm core. The upper half of the panel retains a large empty dark field, with a small brand logo near the top left inner margin; place a pair of eye-catching thick block-like starting quotation marks at the lower edge of the empty field, with diagonal upper ends and right-angled lower ends, closely aligned as a reading entry point. The main quote is placed in the left-middle section of the panel, arranged in three to four lines of loose large text in a light, geometric, and rounded sans-serif font, with varying line lengths but a stable left margin, the text carrying the main information weight; the author's name is in a medium-sized font on a separate line below, and the identity description is narrowed by another level and slightly indented, forming a clear jump in scale and reading rhythm from the quote to the signature. The panel continues with a broad dark field below, hiding a pair of extremely large ending quotation marks in the bottom right, using a solid dark shape slightly brighter than the panel, cut off by the edges at the bottom and right, echoing the small bright quotation marks above in distance, light/dark, and size, acting both as a faint watermark and stabilizing the bottom weight; the bottom corners retain only minimal follow and collect prompts to avoid competing with the center. Colors are derived from the emotions and industry semantics of the theme: select a high-brightness, high-saturation, clean, and energetic theme accent color for the peripheral base and starting quotation marks to create instant recognition with minimal but high-impact area; the interior uses a very deep low-brightness color under the same thematic warm/cool tendency to cover most of the area, the body text uses a near-white high-brightness neutral color, and the background giant quotation marks use a very low contrast deep tone, maintaining an emotional relationship of "bright periphery surrounding a restrained dark field." The whole adopts a pure digital vector surface with uniform color blocks, sharp edges, no gradients, no textures, and no 3D shadows; rounded corners, recessed connections, diagonally cut quotation marks, and strict left alignment form a geometric order. All brand names, quotes, signatures, and titles are regenerated from the current theme, with simple and credible language, retaining large sections of blank space and minimal information, preventing decorations, images, or redundant colors from weakening the cross-scale echo of the double quotes and the dominance of the golden phrase.

——————
Quote: {argument name="quote" default="You never really understand a person until you consider things from his point of view—until you climb into his skin and walk around in it."} 
Signature: {argument name="signature" default="Earthling"}
From the Web
```

> 改编自 [小小东](https://x.com/xiaoxiaodong01/status/2089527550536216727) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
