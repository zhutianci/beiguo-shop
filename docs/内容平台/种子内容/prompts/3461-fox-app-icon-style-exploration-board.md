---
title: "ai图标生成提示词：一个吉祥物 19 种 App 图标风格探索板（gpt-image-2）"
slug: fox-app-icon-style-exploration-board
model: gpt-image-2
topics: [logo, infographic]
aspectRatio: "16:9"
needsRefImage: false
useCase: "定 App 图标方向时用：把同一个吉祥物标志一次铺成 19 种风格（极简、渐变、深色、纸感、皮革、玻璃、新拟物、描边、黑金、徽章、贴纸……）并排比较，底部还附一行可用于界面和品牌延展的小元素，方便团队挑方向。"
prompt: |
  目标：生成一张干净的设计展示板，标题为"[小狐狸 App 图标风格探索]"，展示同一个吉祥物标志在多种现代 App 图标风格下的样子。吉祥物是[蜷成三角形的毛茸茸橙色小狐狸]：白色嘴周、小黑眼睛、黑鼻子，头边有几道黄色的小强调线。
  画布：16:9 横版，米白色、带细微纸感的设计板，高分辨率。顶部是粗黑大标题，下面一行小号副标题"[同一只小狐狸的多种图标风格]"，各区块之间用细横线分隔。
  版式：恰好 19 个带编号的图标方案，排成 3 行：第一行 6 个、第二行 6 个、第三行 7 个。每个图标上方是小编号，下方是简短标签。
  第一区"圆角方形"（6 个）：1 简洁极简——奶油色圆角方底；2 柔和暖调——蜜桃橙渐变底；3 深色醒目——黑底配发光的橙色狐狸；4 鲜艳渐变——橙红渐变底；5 纸张肌理——米色纸感压纹；6 皮革质感——棕色缝线皮革。
  第二区"其他材质"（6 个）：7 玻璃拟态——通透的玻璃方块；8 磨砂玻璃——里面的狐狸略模糊；9 新拟物——米白同色浮雕；10 描边点缀——炭黑底、奶油色细线稿；11 哑光雕塑——米色黏土质感；12 黑金——黑底金属金狐狸。
  第三区"其他构图"（7 个）：13 圆形徽章；14 扁平标志——简化成橙色三角色块；15 双环；16 撕边贴纸——卷起一角；17 闪光簇——橙底加小星星；18 折叠包裹——从信封状折纸里探出头；19 头像徽标——只画狐狸正脸。
  底部再加一行"辅助元素"，放[14]个小的品牌元素：黑鼻子、黄色强调线、金色闪光、尾巴、耳朵、爪印、小狐狸头、绒球、丝带横幅、金币徽章、箭头、爱心等。
  风格：高级的 UI 概念展示板，精致的 3D 软渲染图标，圆角、有触感的材质、柔和阴影，暖橙与奶油色配黑色点缀；小字清晰、间距均匀。吉祥物在所有方案里都要一眼认得出是同一个。不要多余的图标、标签和水印。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/SDDFounder/status/2089278095802953866
  author: "@SDDFounder"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文并压缩；标题、副标题、吉祥物描述、辅助元素数量改为变量；19 个风格标签和三个分区标题由英文改为中文；原文辅助元素清单列了 16 项却要求 14 个，精简为代表性的若干项"
images:
  - 3461-fox-app-icon-style-exploration-board-1.jpg
imageCredit:
  by: "@SDDFounder"
  url: https://youmind.com/gpt-image-2-prompts?id=31848
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：最关键的是吉祥物描述，用一句话写清"什么动物 / 物件 + 什么造型 + 什么颜色"，如"折纸风的绿色小鹦鹉""咬了一口的红苹果"；换了吉祥物后，把正文里的"狐狸""橙色"等字眼和五官描述一并替换。标题和副标题换成你的项目名；[14] 是底部小元素的数量，嫌挤就改成 8。

示例图是一张米白色横版展示板（实际比例接近 3:2）：顶部是黑色英文大标题和副标题，下面三行共 19 个编号图标——同一只蜷成三角形的橙色毛绒狐狸，依次做成奶油底、蜜桃渐变、黑底、纸张压纹、缝线皮革、玻璃、磨砂玻璃、新拟物浮雕、黑底线稿、黑金、圆形徽章、卷角贴纸、狐狸正脸等样式；最底下一行是鼻子、尾巴、耳朵、爪印、金币等小元素。

**常见问题**：
- 中文小标签糊掉或写错：改成"标签用英文"，或只保留编号、不要标签。
- 各方案里吉祥物长得不一样：把最满意的那一个图标上传，要求"所有方案使用这个造型"。

**适合**：App 与小程序图标方向探索、品牌提案、设计评审材料；选定方向后还需设计师重绘成规范尺寸的矢量图标。

### 英文原版

```text
Goal: Create a clean presentation board titled {argument name="headline text" default="FOXY APP ICON EXPLORATIONS"}, showing modern app icon style variations for a cute curled fluffy fox logo concept.

Canvas: Wide 16:9 beige/off-white design board, high-resolution, centered composition, subtle paper background. At the top, a large bold black all-caps headline, with a smaller subtitle underneath: {argument name="subtitle text" default="Modern app icon styles using the curled fluffy fox concept"}. Use thin horizontal divider lines to separate sections.

Layout: Arrange exactly 19 numbered app icon concepts in a neat grid of 3 rows: first row has 6 icons, second row has 6 icons, third row has 7 icons. Each icon is a rounded-square or badge-style app icon featuring the same curled triangular fox mascot: a fluffy orange fox curled into a soft triangular fold, with a white muzzle, tiny black eye, black nose, and small yellow attention marks near the head. Put a small number above each icon and a short label below it.

Section 1 title: “ROUNDED SQUARE APPS”. Include exactly 6 icons:
1. Clean Minimal — cream rounded-square background, soft shadow, simple orange curled fox.
2. Soft Warm — peach/orange warm gradient rounded-square background.
3. Bold Dark — black rounded-square background with glowing orange fox.
4. Vibrant Gradient — bright orange-red gradient rounded-square background.
5. Paper Texture — beige paper-like icon, embossed folded fox in pale cream.
6. Leather Touch — brown stitched leather rounded-square background, tan leather fox.

Section 2 title: “ALTERNATIVE STYLES”. Include exactly 6 icons:
7. Glass Morph — translucent glossy glass rounded-square icon with orange fox.
8. Frosted Glass — frosted silver translucent square with blurred fox inside.
9. Neumorphic — soft off-white raised icon with minimal white folded fox.
10. Outline Accent — dark charcoal rounded square with thin cream line-art fox outline and yellow accent marks.
11. Matte Sculpture — soft beige matte clay-like curled fox sculpture.
12. Black & Gold — black rounded square with metallic gold fox.

Section 3 title: “ALTERNATIVE COMPOSITIONS & ELEMENTS”. Include exactly 7 icons:
13. Circle Badge — circular orange badge with curled fox inside and stitched/ring detail.
14. Flat Mark — simplified flat orange triangular fox mark on cream rounded square.
15. Double Ring — curled fox inside two circular orange rings.
16. Torn Sticker — fox printed as a torn paper sticker with curled paper corner.
17. Spark Cluster — orange rounded square with fox and small sparkle/star cluster.
18. Wrapped Fold — beige square with fox peeking from a folded envelope/wrap shape.
19. Nose Emblem — fox head emblem focused on face, ears, black nose, and yellow marks.

Supporting elements: Along the bottom, add a row labeled “SUPPORTING ELEMENTS (FOR USE IN APP & BRANDING)” containing exactly 14 small mascot/brand elements: black nose, three yellow dash marks, golden sparkle star, orange-white fluffy tail, pair of orange fox ears, black curved smile/arc, paw print, small fox head, tiny curled fox mascot, orange fluffy pom-pom, orange teardrop, orange ribbon banner, gold fox coin badge, rounded pill outline, right arrow outline, and heart outline with black center. If space is tight, keep the first 14 most visible items and maintain the same visual style.

Visual style: Premium UI concept sheet, polished 3D soft-rendered icons, rounded corners, tactile materials, gentle shadows, warm orange and cream palette with black accents. Use crisp readable typography, small labels, even spacing, and a modern product-design presentation aesthetic. The mascot should remain consistently recognizable across all variations as a {argument name="mascot description" default="curled fluffy orange fox forming a triangular app icon shape"}. Avoid extra icons, extra labels, watermarks, or photorealistic background clutter.
```

> 改编自 [@SDDFounder](https://x.com/SDDFounder/status/2089278095802953866) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
