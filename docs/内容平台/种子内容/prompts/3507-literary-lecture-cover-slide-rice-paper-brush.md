---
title: "ppt提示词：新中式人文课件封面页，墨绿宋体大标题 + 宣纸毛笔静物（gpt-image-2）"
slug: literary-lecture-cover-slide-rice-paper-brush
model: gpt-image-2
topics: [ppt, poster]
aspectRatio: "16:9"
needsRefImage: false
useCase: "做语文、文学、历史类讲座或课件的封面页：左侧三分之二是标题、副标题和三个要点，右侧三分之一是宣纸、毛笔和梅枝的静物照片，整体是宋韵加现代杂志排版的气质。"
prompt: |
  生成一张 16:9 横版的中文人文类演示文稿封面页，把宋代诗词的意境和现代杂志式排版结合在一起。
  - 画布：干净的米白色背景，右侧三分之一是一块浅灰绿色的竖向色块；大量留白，边距讲究，有柔和的纸张纹理、极淡的水墨晕痕和几缕灰色的枝叶影子。
  - 左侧三分之二（文字区）：
    - 左上方是两行墨绿色的宋体大标题：第一行"[李清照对当代]"，第二行"[女性的启示]"；标题下方一条短短的暗红色细横线；
    - 再往下是黑色小号宋体副标题："[从文学人生，看见女性如何表达自我]"；
    - 中部一排恰好 3 个小图标卡片，用两条细竖线隔开，每个是一个圆形小图标加两行短语：暗红色圆标配"[以文字确立自我]"，赭黄色圆标配"[在时代与命运之间保持判断]"，灰绿色圆标配"[不被单一身份定义]"；
    - 最下方一行三个关键词，用细竖线分隔："[表达自我]｜[保持独立]｜[承受变化]"。
  - 右侧三分之一（静物区）：一张微微卷起的旧宣纸，上面是竖排的行书手稿（字迹写意、不需要可读），纸上斜放一支毛笔，旁边伸出一枝带花苞的梅枝，柔和的侧光投下淡淡的影子；静物略微压到左侧的米白区域上。
  - 配色：米白、灰绿、墨绿、暗红点缀；所有印刷文字用简体中文、清晰无错字；不要水印和页码。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/xiaoxiaodong01/status/2094793543634276422
  author: "@xiaoxiaodong01"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文并精简；标题两行、副标题、三个要点、底部三个关键词改为变量；保留\"恰好 3 个图标卡片\"\"右侧三分之一为静物区\"等版式约束"
images:
  - 3507-literary-lecture-cover-slide-rice-paper-brush-1.jpg
imageCredit:
  by: "@xiaoxiaodong01"
  url: https://youmind.com/gpt-image-2-prompts?id=33246
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：标题拆成两行，每行 5～7 个字最好看；副标题一句话，20 个字以内（示例图里的原句更长，想写长句就直接把整句写进提示词）；三个要点各写两行短语；底部三个关键词各 4 个字。静物可以跟着主题换，例如讲茶文化换成"茶盏和竹茶则"，讲书法换成"砚台和镇纸"。

示例图左侧是墨绿色的两行大标题和一条红色短线，下面是一句副标题、三个带圆形小图标的要点和一行三个关键词；右侧灰绿色块前是一卷写着行书的宣纸、一支毛笔和两枝白梅，纸和花的影子落在米白色背景上。

**常见问题**：
- 中文小字出现错字：先只生成标题和静物，副标题与要点在 PPT 里自己排。
- 静物太抢眼：写"静物只占右侧三分之一，色彩低饱和"。
- 标题字体变成黑体：强调"宋体 / 衬线字体，笔画有粗细对比"。

**适合**：文学讲座、语文和历史课件、读书会分享的封面页；内页可以沿用同样的配色和留白继续生成。

### 英文原版

```text
Goal: Create an elegant Chinese literary presentation cover slide about {argument name="topic" default="李清照对当代女性的启示"}, blending Song dynasty poetic atmosphere with modern editorial design.

Canvas: 16:9 horizontal slide, clean off-white background with a pale sage-green vertical panel occupying the right third. Use lots of negative space, refined margins, soft paper texture, faint ink-wash stains, and subtle gray botanical shadows across the middle.

Layout: Left two-thirds is the text area; right third is a still-life photograph area. Place the large headline in the upper-left, arranged as two lines of dark forest-green Chinese serif type: line 1 “李清照对当代”, line 2 “女性的启示”. Under the headline add a thin muted red horizontal accent line. Below it place the subtitle in smaller black Chinese serif text: {argument name="subtitle text" default="从文学人生，看见女性如何表达自我、选择人生、抵抗困境。"}

Middle-left feature row: include exactly 3 small icon cards in a horizontal row, separated by two thin vertical divider lines. Card 1 has a muted rose circular icon with a white leaf symbol and the label “以文学\n确立自我”. Card 2 has a warm beige circular icon with a white balance-scale symbol and the label “在时代与命运之间\n保持判断”. Card 3 has a desaturated teal circular icon with a white user silhouette and the label “不被单一\n身份定义”.

Bottom-left keyword row: include exactly 3 keywords separated by vertical bars, with a small dark green leading mark: “表达自我 | 保持独立 | 承受变化”.

Right still-life details: show an open antique Chinese letter or manuscript paper lying diagonally on a desk, with visible vertical handwritten Chinese calligraphy in gray ink. A black-and-brown calligraphy brush rests diagonally over the paper, pointing toward the lower-right. Add exactly 2 blooming plum blossom branches: one branch crosses the upper-right corner with several pale white-pink blossoms and buds, and one smaller branch extends from the center-left toward the right, casting soft shadows. The right panel background should be pale sage green; the paper is warm ivory with slightly curled edges and soft folds.

Visual style: tasteful, literary, museum-catalog minimalism; calm Song dynasty aesthetics; natural daylight from upper left; soft shadows; muted palette of ivory, forest green, sage, rose, beige, and ink gray; high-resolution editorial composition, realistic still-life photo blended with clean graphic typography.

Constraints: Keep all visible text in Chinese exactly as specified, with no extra captions or watermark. Maintain the 3 icon cards and 3 bottom keywords exactly. Avoid clutter, bright colors, cartoon styling, or modern tech UI effects.
```

> 改编自 [@xiaoxiaodong01](https://x.com/xiaoxiaodong01/status/2094793543634276422) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
