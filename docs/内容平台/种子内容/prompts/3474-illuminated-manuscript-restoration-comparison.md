---
title: "文物修复对比图提示词：泥金手抄本破损原件与复原稿左右对照（gpt-image-2）"
slug: illuminated-manuscript-restoration-comparison
model: gpt-image-2
topics: [old-photo, illustration]
aspectRatio: "4:3"
needsRefImage: false
useCase: "做文物修复科普、视频封面或课件时，需要一张\"修复前后\"的示意图：黑底上左边是发褐缺角的古籍残页，右边是金箔和绳结纹都焕然一新的复原页，下方各一个小标签。"
prompt: |
  目标：生成一张左右对照图，展示一页古老的[中世纪凯尔特风泥金手抄本]修复前和修复后的样子，修复版要比破损的原件干净、明亮、华丽得多。
  画布：横版[4:3]，纯黑背景。两块竖向的书页并排，四周留足边距：左边是破损的原件，右边是修复后的复原稿。每块下方居中一个小标签：左边"[原件]"，右边"[修复后]"。
  版式：恰好 2 块主画面。左块放在白色的照片边框里；右块看起来更大、更清晰，带浅色羊皮纸页边。两块是同一页的构图：高高的装饰边框、左侧一栏文字、右侧一栏插图。
  左块（破损原件）：一页褪色风化的手抄本，拍在灰色的档案台面上。羊皮纸发褐、有污渍、起毛，局部半透明，边缘撕裂、缺角，有水渍、发黑的接缝和不均匀的变色。内容几乎看不清：左侧是深色的中世纪手写体文字块和褪色的红金首字母，右侧两幅小插图像幽灵一样几乎磨没了；装饰边框还在，但磨损、脏污、不完整。页面中间偏右有 1 个深色小圆洞。整体低饱和、低对比。
  右块（修复版）：暖奶油色羊皮纸上色彩鲜明的复原页，高度精致的凯尔特装饰风格，大量金箔，配红、绿、黑、橙色纹样；建筑式的华丽外框，有交织的绳结纹、几何饰板和圆形徽章，顶部是一个半圆拱顶。修复效果理想化、近乎崭新，线条锐利、色彩饱和。
  修复版的元素数量：1 个大的外框；顶部 1 个填满螺旋纹的半圆拱；框的两侧和四角有向外凸出的装饰；左侧 1 栏文字，约 10 行仿古手写体，带装饰首字母；右侧上下叠放恰好 2 幅长方形小插图；3 个圆形徽章压在中间分隔栏和边框上；4 个金色小方块分布在框的上、中、中下、下。
  文字：手抄本上的字模仿中世纪手写体的仿拉丁文，不需要是可读的现代文字，首字母用绿、红、金、黑装饰。
  风格：博物馆式的对比展示，左边是档案纪实照片，右边是理想化的数字复原；衰败与复原形成强烈反差。
  限制：不要多余的画面、人物、界面控件和水印，除两个小标签外不要任何说明文字；两块画面在黑底上保持平衡居中。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/MiMundoConIA/status/2077693725648760909
  author: "@MiMundoConIA"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文；原文点名的具体古籍名改为通用的\"中世纪凯尔特风泥金手抄本\"并设为变量；两个标签改为中文变量；画幅按示例图写为 4:3；删去原文列出的一长串仿拉丁文示例词和带宗教含义的风格词；侧面凸出装饰的计数改为概括描述。"
images:
  - 3474-illuminated-manuscript-restoration-comparison-1.jpg
imageCredit:
  by: "@MiMundoConIA"
  url: https://youmind.com/gpt-image-2-prompts?id=28940
  license: CC BY 4.0
verify:
  - "题材源自中世纪手抄本的装饰传统，小插图里有古装人物，请确认符合\"不含宗教内容\"的尺度"
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：[中世纪凯尔特风泥金手抄本] 可以换成别的旧物，如"明清时期的彩绘山水册页""民国时期的手绘街市图""褪色的浮世绘版画"，同时把右块的纹样描述改成对应的风格；两个标签默认 [原件] 和 [修复后]，也可以写英文。

示例图是黑底上的左右两块：左边白边照片里是一页发褐、缺角、布满污渍的手抄本，文字和两幅小插图几乎磨没；右边是奶油色羊皮纸上金、红、绿、黑交织的复原页，带绳结纹边框、半圆拱顶、圆形徽章、十几行带装饰首字母的仿古文字和两幅小插图；下方小标签是英文的"Original"和"Restored"。

**常见问题**：
- 左右两页构图对不上：加"左右是同一页，边框轮廓、文字栏和插图位置一一对应"。
- 左边不够旧：补"严重褪色、大面积水渍、局部缺失"。
- 想让右边的文字可读：不建议，仿古字体很难写对，保持装饰性即可。

**适合**：文物修复科普的示意图、视频封面、课件里讲"修复前后"的配图。画面里的书页是 AI 想象出来的，不是任何真实文物的修复成果，使用时请标明为示意图。

### 英文原版

```text
Goal: Create a side-by-side comparison image showing an ancient illuminated manuscript page before and after restoration, inspired by the Book of Kells, with the restored version looking far cleaner, brighter, and more ornate than the damaged original.

Canvas: Wide horizontal black background, approximately 16:9. Place two large vertical manuscript panels side by side with generous margins: the left panel is the damaged original, the right panel is the restored reconstruction. Add a small centered label under each panel: left label “Original”, right label “Restored”.

Layout: Use exactly 2 main panels. The left panel occupies the left half and sits inside a white photo-like border. The right panel occupies the right half and is larger-looking, crisp, and framed by a pale parchment page edge. Both panels show the same general manuscript-page composition: a tall decorative border, a left text column, and a right illustration column.

Left panel, damaged original: Show a faded, weathered manuscript page photographed on a grayish archival background. The parchment is brown, stained, frayed, and translucent in places, with torn edges, missing corners, water damage, darkened seams, and uneven discoloration. The design is barely legible: a vertical text block on the left with dark medieval calligraphy, faded red and gold initials, and a right column with two ghostly miniature illustrations that are almost erased. The ornamental border should be visible but worn, dirty, and incomplete. Include one small dark circular blemish or hole near the center-right of the original page. Keep the whole left image muted, low contrast, and degraded.

Right panel, restored version: Show a vividly restored illuminated manuscript page on warm cream parchment. The page has a highly polished medieval Celtic style with abundant gold leaf, red, green, black, and orange ornament. Use an ornate architectural frame with interlacing knotwork, geometric panels, round medallions, and a domed arch at the top. The restoration should look idealized and too pristine, with sharp lines and saturated colors.

Restored page element count: Include exactly 1 large outer decorated manuscript frame; exactly 1 domed arch at the top filled with Celtic spiral ornament; exactly 4 protruding side ornaments on the frame, one at each side midpoint and corner-like extension; exactly 1 left vertical text column containing 10 lines of pseudo-Latin uncial calligraphy with decorated initials; exactly 2 rectangular narrative miniature illustrations stacked vertically in the right column; exactly 3 circular medallion ornaments overlapping the central divider and side frame; exactly 4 small square gold decorative blocks, placed near the top, center, lower center, and bottom of the frame.

Text and lettering: The manuscript text should resemble medieval Insular script and pseudo-Latin, not modern readable typography. Use decorative initials in green, red, gold, and black. Suggested visible pseudo-text can include “Scooc”, “infiricipio”, “Sicloi”, “thoratio”, “chomias”, “abysus”, “Zorozobat”, “ipsemagenu”, “bubliuns”, “Qauncor”, “habacautum”, “Zacchäus”, and “uenufurcanos”, but it may remain partly nonsensical as long as the style matches.

Visual style: Museum-comparison presentation, archival documentary on the left and idealized digital restoration on the right. High contrast between decay and restoration. The restored page should include obvious metallic gold leaf highlights, clean parchment, Celtic knots, evangelist-manuscript styling, and intricate medieval ornament.

Constraints: Do not add extra panels, people, UI controls, watermarks, or explanatory captions beyond the two small labels. Keep the comparison balanced and centered on a plain black background.
```

> 改编自 [@MiMundoConIA](https://x.com/MiMundoConIA/status/2077693725648760909) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
