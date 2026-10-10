---
title: "AI贴纸设计提示词：开心小仙人掌 Q 版贴纸（白色描边、透明底效果）（gpt-image-2）"
slug: kawaii-cactus-die-cut-sticker
model: gpt-image-2
topics: [sticker]
aspectRatio: "1:1"
needsRefImage: false
useCase: "生成一个居中、带白色贴纸描边的卡哇伊植物角色贴纸，示例是开花的小仙人掌，适合做表情包、手机壳和笔记本贴纸、印刷模切贴纸。"
prompt: |
  生成一张可爱的卡哇伊贴纸插画：一棵开心的盆栽仙人掌，透明背景，居中的正面角色，粗深绿色描边，外圈一层柔和的白色贴纸边。
  仙人掌是明亮光泽的[青柠绿]，一个大大的圆润主干，恰好 2 条向上弯的侧枝（左右各一）。加上竖向的棱纹明暗、亮面高光点，以及许多分布在主干和侧枝上的奶油色星形小刺（刺的根部是橙色）。
  开心的脸：2 只大大的亮黑椭圆眼睛、2 块粉色圆形腮红、2 条小弯眉，张大嘴笑，嘴里红色、粉色小舌头。
  仙人掌左上方恰好 1 朵大红粉色的花，6 片圆润的花瓣，花心是一簇黄色花粉点。
  仙人掌种在温暖的[橙色陶土]花盆里：粗圆的盆沿、深橙色明暗、斑点质感和光亮的白色高光；露出棕色泥土和顶部恰好 5 颗圆润的小石子。
  风格：精致的 2D 数字插画，Q 版吉祥物，鲜艳饱和的颜色，平滑渐变，柔和高光，干净的类矢量边缘；不要文字、水印和背景场景，透明 PNG 效果，贴纸轮廓外只隐约露出淡淡的棋盘格预览。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/hideki_climax/status/2090687796298330225
  author: "セカヤサ@AI×Web制作💻小林 秀樹"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文；仙人掌颜色、花盆颜色改为变量；保留花瓣、卵石数量等细节约束"
images:
  - 3102-kawaii-cactus-die-cut-sticker-1.jpg
imageCredit:
  by: "セカヤサ@AI×Web制作💻小林 秀樹"
  url: https://youmind.com/gpt-image-2-prompts?id=32161
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：[青柠绿] 和 [橙色陶土] 控制配色，可以改成"薄荷绿＋白瓷盆""深绿＋蓝色花盆"。换成别的植物角色时（多肉、向日葵、蘑菇、牛油果），按"主体形状 → 表情 → 装饰 → 容器 → 风格"的顺序改写，一套贴纸就能保持统一画风。

示例图是一棵举着两只"手臂"的青绿色小仙人掌，星形小刺、大眼睛和粉色腮红，张嘴笑，头顶左上一朵红粉色的花，种在橙色陶土盆里，外圈白色贴纸边，背后是浅灰白棋盘格。

**常见问题**：
- 背景出现真的棋盘格：棋盘格只是"透明"的预览效果，正式使用请生成后抠图，或在 API 中请求透明背景。
- 白边不完整：强调"整个外轮廓一圈均匀的白色描边"。
- 刺太多显得扎眼：把"许多小刺"改成"十几个小刺"。

**适合**：表情包、手机壳 / 笔记本贴纸、模切贴纸印刷、文创周边。

### 英文原版

```text
Create a cute kawaii sticker illustration of a happy potted cactus on a transparent background, shown as a centered front-facing character with a thick dark green outline and a soft white sticker border. The cactus is bright glossy {argument name="cactus color" default="lime green"}, with one large rounded central barrel body and exactly 2 raised side arms, one on the left and one on the right, both curved upward. Add vertical ribbed shading, shiny highlight spots, and many small star-shaped cream spines with orange bases distributed across the body and arms. Give the cactus a cheerful face with 2 large glossy black oval eyes, 2 pink circular blush cheeks, 2 small curved eyebrows, and a wide open smiling mouth with a red interior and pink tongue. Place exactly 1 large red-pink flower on the upper left of the cactus, with 6 rounded petals and a cluster of small yellow pollen dots in the center. The cactus sits in a warm {argument name="pot color" default="orange terracotta"} flower pot with a thick rounded rim, darker orange shading, speckled texture, and glossy white highlights; show brown soil and exactly 5 visible rounded pebbles along the top. Style should be polished 2D digital art, chibi mascot, vibrant saturated colors, smooth gradients, soft highlights, clean vector-like edges, no text, no watermark, no background scene, transparent PNG look with only a faint checkerboard preview visible outside the sticker silhouette.
```

> 改编自 [セカヤサ@AI×Web制作💻小林 秀樹](https://x.com/hideki_climax/status/2090687796298330225) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
