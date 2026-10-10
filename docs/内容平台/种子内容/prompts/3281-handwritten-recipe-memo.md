---
title: 信息图提示词：方格本手绘菜谱，一页两道菜的食材图标 + 步骤插画（nano banana）
slug: handwritten-recipe-memo
model: nano-banana
topics: [food, infographic]
needsRefImage: false
aspectRatio: "4:3"
useCase: 做美食账号图文、家庭菜谱合集、烹饪课讲义时，填入两道菜的食材和步骤，生成左右两栏的平面手绘菜谱页：上方食材图标，下方带箭头的步骤小插画，整体是暖色方格纸质感。
prompt: |
  一张平面 2D 手绘风菜谱信息图，直接画在米白色方格便签纸上，纸面有细网格线和温暖的纸张纹理。
  画面分左右两栏：
  - 左栏：顶部大号手写标题"[左页菜名]"；下面用竖排小圆点列出食材"[左页食材]"，每样配一个简笔食物图标；下半部分用箭头串起烹饪步骤"[左页步骤]"，每一步配一个可爱的手绘动作小插画（切、炒、炖等）；左下角画一盘诱人的成品。
  - 右栏：顶部大号手写标题"[右页菜名]"；食材"[右页食材]"同样配图标；步骤"[右页步骤]"用箭头连成流程，配对应的小插画；右下角画成品。
  - 配色：以[自然柔和的有机色]为基调，温暖、清淡。
  - 字体：亲切的手写风中文（圆体或黑体手写感），文字准确、不变形、不出错别字。
  - 严格限制：只要平面版式，不要画出实体书、笔记本轮廓、纸张厚度、投影，也不要木桌等写实照片背景；不要出现日期、星期、日历框或日期印章。
  画幅 4:3。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-nano-banana-pro-prompts
  url: https://x.com/AIGuideNote/status/2098528281293381651
  author: "@AIGuideNote"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: 译成中文并整理成分栏要点；原文要求的日文手写字改为中文；两道菜的菜名、食材、步骤和配色设为变量；保留"不要实体书 / 木桌 / 日期印章"的排除约束
images:
  - 3281-handwritten-recipe-memo-1.jpg
imageCredit:
  by: "@AIGuideNote"
  url: https://cms-assets.youmind.com/media/1789195068455_wg7zzd_HR94WawagAESFAJ.jpg
  license: CC BY 4.0
verify:
  - 示例图是日文版，改成中文后实测一次，看食材名和步骤文字是否有错字
  - 步骤超过 3 步时文字容易挤，确认每栏步骤数控制在 3～6 步
  - 确认原帖仍可访问、作者未另行声明保留权利
---
**怎么填变量**：两栏各填一道菜，[左页食材] 用顿号列出，例如"鸡腿肉、土豆、胡萝卜、咖喱块"；[左页步骤] 用箭头写成短句，如"①鸡肉切块煎香 → ②加土豆胡萝卜翻炒 → ③加水和咖喱块炖煮"。两道菜最好是同一主题的搭配，比如"番茄炒蛋 + 紫菜蛋花汤""红烧肉 + 清炒时蔬"。[自然柔和的有机色] 可换成"清新薄荷绿""暖橙奶油色"。示例图是日文版：左边绿咖喱、右边冬阴功，食材区用绿框和橙框分开，每样食材一个彩色小图标，下方是带编号的锅铲、汤锅步骤小图，背景像摊在牛皮纸上的方格本。

**常见问题与调整**：
- 生成成了"桌上一本摊开的笔记本"照片：再强调"纯平面版式，画布本身就是方格纸，没有书脊和阴影"。
- 文字太多出现乱码：每步控制在 8 个字以内，食材不超过 8 样。
- 只想要一道菜：改成"整张只画一道菜，食材在上、步骤在下，成品居中放大"。
- 想做系列：追问"保持同样纸张、字体和图标风格，换成下面两道菜"。

**适合**：美食图文、亲子做饭手册、烹饪课讲义；不适合需要精确克数和火候的专业菜谱。

### 英文原版

```
[Input Data]
- Dish Name (Left Page): {argument name="dish name left" default="Green Curry"}
- Ingredients List (Left Page): {ingredientsLeft}
- Cooking Steps (Left Page): ①{stepLeft1} → ②{stepLeft2} → ③{stepLeft3}
- Dish Name (Right Page): {argument name="dish name right" default="Tom Yum Goong"}
- Ingredients List (Right Page): {ingredientsRight}
- Cooking Steps (Right Page): ①{stepRight1} → ②{stepRight2} → ③{stepRight3}
- Color Theme: {argument name="color theme" default="organic natural colors"}

[Structure and Layout Specifications]
- Style: A flat 2D handwritten-style infographic recipe illustration drawn on a piece of rustic off-white notepad paper (grid paper) with thin grid lines and warm paper texture.
- Background and Composition Constraints: Do not draw physical books, three-dimensional notebook outlines, page thickness, shadows, or realistic photo background elements like wooden tables (Absolutely NO wooden table, NO realistic book mockup, NO book thickness, NO notebook pages, NO realistic photo background. It must be a flat 2D vector layout directly on the textured grid notepad paper canvas).
- Left Side Layout:
  - Large handwritten Japanese title "{dishLeft}" at the top.
  - Below that, the ingredient list "{ingredientsLeft}" drawn with neat vertical bullet points in handwritten Japanese and simple food illustrations.
  - The lower half features cooking steps "①{stepLeft1} → ②{stepLeft2} → ③{stepLeft3}" arranged in a horizontal or vertical arrow flow. Include cute hand-drawn illustrations that match each step's content (e.g., cutting, stir-frying, simmering).
  - A delicious-looking illustration of the finished "{dishLeft}" dish in the bottom left.
- Right Side Layout:
  - Large handwritten Japanese title "{dishRight}" at the top.
  - Below that, the ingredient list "{ingredientsRight}" drawn in handwritten Japanese with simple food illustrations.
  - The lower half features cooking steps "①{stepRight1} → ②{stepRight2} → ③{stepRight3}" arranged in a horizontal or vertical arrow flow. Include cute hand-drawn illustrations matching each step's content.
  - A delicious-looking illustration of the finished "{dishRight}" dish in the bottom right.
- Colors: A gentle, warm organic tone based on "{colorTheme}".

[Quality and Exclusion Constraints (Mandatory)]
- Absolutely no date-related elements like dates (e.g., "8/7"), days of the week (e.g., "SUN"), calendar frames, or date stamps (NO date stamp, NO calendar, NO day of the week, NO timeline stamp).
- Fonts should be friendly handwritten-style Japanese (Gothic or rounded) accurately drawing the input Japanese without distortion or spelling errors.

- Aspect Ratio: --ar 4:3
```

> 改编自 [@AIGuideNote](https://x.com/AIGuideNote/status/2098528281293381651) 发布、[YouMind-OpenLab/awesome-nano-banana-pro-prompts](https://github.com/YouMind-OpenLab/awesome-nano-banana-pro-prompts) 收录的提示词，仓库许可证 CC BY 4.0。
