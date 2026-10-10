---
title: "AI做PPT封面提示词：清新模块化的中文 PPT 封面页（柠檬主题示例）（gpt-image-2）"
slug: lemon-uses-ppt-cover-slide
model: gpt-image-2
topics: [ppt]
aspectRatio: "16:9"
needsRefImage: false
useCase: "生成一页瑞士风模块网格的中文 PPT 封面：左边大标题 + 分类胶囊 + 4 张功能卡片，右边圆角大照片，适合生活方式、健康、科普类主题的演示封面。"
prompt: |
  生成一张干净现代的中文 PPT 封面页，主题是[柠檬的妙用]，采用国际瑞士风模块网格、清新的柠檬黄点缀、柔和的马卡龙色块，整体是明亮的健康生活方式杂志风。
  画布：16:9 宽屏，米白背景，宽松边距，清晰的矢量字体，无水印。不对称平衡：左边是文字较多的大栏，右边是大幅圆角照片。
  左侧：超大黑色粗体中文主标题"[柠檬的妙用]"，下方一条短荧光黄下划线，接着是副标题"[10页现代信息演示]"。副标题下面放一个荧光黄圆角胶囊，里面是用居中圆点分隔的 4 个分类词"[清洁 · 饮食 · 保鲜 · 美容]"。
  胶囊下方并排恰好 4 张圆角马卡龙色卡片，每张有一个简单的黑色线性图标、粗体中文标签和两行说明：
  1）喷壶闪光图标，"清洁"，"天然去污 / 安全环保"；
  2）碗里有柠檬片图标，"饮食"，"增添风味 / 丰富营养"；
  3）冰箱图标，"保鲜"，"延长保鲜 / 减少浪费"；
  4）侧脸加闪光图标，"美容"，"自然呵护 / 焕亮肌肤"。
  卡片颜色从左到右：淡柠檬黄、薰衣草紫、淡蓝、淡柠檬黄。
  右侧：高调写实摄影，浅色石台上的新鲜柠檬——右上一颗带绿叶的整柠檬、中前景一个露出果肉的半切柠檬、右下一块柠檬角、背景一颗虚化的柠檬。照片四角大圆角，上面叠加半透明几何面板：左上一块竖向薰衣草紫圆角矩形，上面一个手绘小柠檬涂鸦；左下一块半透明荧光黄圆角方块，一片绿叶横穿其上。
  右下角是页码标签：荧光黄圆角块上的黑色大号"01"，加黑色圆角块上的白字"封面"。左上角放一个 3×3 共 9 个点的小点阵，柠檬黄、薰衣草紫、淡蓝交替。底部边缘加一排细小的网格刻度线。
  图标统一黑色单线，字体粗体现代，严格对齐、大量留白；不要多余文字或额外卡片。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/xiaoxiaodong01/status/2082993053535780888
  author: "小小东"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文；主题、标题、副标题、分类词和 4 张卡片内容改为变量；去掉原文重复的位置描述"
images:
  - 3009-lemon-uses-ppt-cover-slide-1.jpg
imageCredit:
  by: "小小东"
  url: https://youmind.com/gpt-image-2-prompts?id=30392
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：[柠檬的妙用] 换成你的主题，如"咖啡的冷知识""居家收纳指南"；分类词和 4 张卡片要同步改成该主题的 4 个方面（图标也换成对应的），右侧照片换成主题实物。配色可以整体改，例如咖啡主题用"焦糖棕 + 奶油色"。

示例图与提示词一致：左侧黑色粗体"柠檬的妙用"、黄色胶囊里四个分类词、四张马卡龙色图标卡片，右侧圆角柠檬照片叠着紫、黄半透明色块，右下角"01 封面"标签。同一作者用同一套风格还做了目录页和内容页，想做整套 PPT 时可以保持配色和网格描述不变，只改版式说明。

**常见问题**：
- 卡片里小字错乱：说明控制在每行 4 个字以内。
- 风格不统一：后续页面重复"米白背景 + 柠檬黄 / 薰衣草紫 / 淡蓝 + 黑色单线图标 + 圆角照片"。
- 照片抢戏：把照片宽度限制在画面一半以内。

**适合**：生活方式 / 健康 / 科普主题 PPT 封面、课程封面、公众号首图。

### 英文原版

```text
Goal: Create a clean modern Chinese PPT cover slide about {argument name="topic" default="柠檬的妙用"}, using an international Swiss-style modular grid, fresh lemon-yellow accents, soft pastel blocks, and a bright health/lifestyle editorial look.

Canvas: 16:9 widescreen presentation slide, off-white background, airy margins, crisp vector typography, no watermark. Use asymmetrical balance: large text-heavy left column and large rounded photo composition on the right.

Layout: Left side contains the title stack and four feature cards. Right side contains a large rounded-corner lemon photography panel occupying about half the slide width. Bottom right has a black-and-yellow page label bar. Add subtle vertical baseline/grid ticks along the bottom edge.

Text content: Main title in very large bold black Chinese characters: {argument name="headline text" default="柠檬的妙用"}. Below it, add a short neon-yellow underline, then subtitle: {argument name="subtitle text" default="10页现代信息演示"}. Under the subtitle, place a rounded neon-yellow pill containing exactly 4 category words separated by centered dots: {argument name="category text" default="清洁 · 饮食 · 保鲜 · 美容"}. Bottom page label shows a large black “01” on a neon-yellow rounded rectangle segment and “封面” in white on a black rounded rectangle segment.

Feature cards: Include exactly 4 rounded pastel cards in a row under the category pill, each with a simple black line icon, bold Chinese label, and two-line description: 1) spray bottle sparkle icon, label “清洁”, description “天然去污 / 安全环保”; 2) bowl with lemon slice icon, label “饮食”, description “增添风味 / 丰富营养”; 3) refrigerator icon, label “保鲜”, description “延长保鲜 / 减少浪费”; 4) face profile with sparkles icon, label “美容”, description “自然呵护 / 焕亮肌肤”. Card colors from left to right: pale lemon yellow, lavender, pale blue, pale lemon yellow.

Right image composition: Use realistic high-key photography of fresh lemons on a light stone surface: one large whole yellow lemon with green leaves at the upper right, one half lemon with visible juicy radial pulp in the center foreground, one lemon wedge at lower right, and a softly blurred yellow lemon in the background. Overlay modern rounded translucent geometric panels: a vertical lavender rounded rectangle at upper left with a tiny hand-drawn lemon doodle, and a large translucent neon-yellow rounded square/rectangle overlapping the lower-left of the photo with a green leaf crossing it. Keep the photo corners heavily rounded.

Decorative details: At top left, add a small 3×3 dot motif, exactly 9 dots, using alternating lemon yellow, lavender, and pale blue. Keep all icons monoline black, typography bold and modern, with strong alignment and generous whitespace. Avoid extra text or additional cards.
```

> 改编自 [小小东](https://x.com/xiaoxiaodong01/status/2082993053535780888) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
