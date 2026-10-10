---
title: "素描教程图提示词：铅笔人像从构图线到完成稿的 9 步过程图（gpt-image-2）"
slug: graphite-portrait-drawing-steps-grid
model: gpt-image-2
topics: [illustration, portrait]
aspectRatio: "4:5"
needsRefImage: false
useCase: "生成一张 3×3 九宫格的素描教学过程图：同一个女性肖像从极淡的构图辅助线、线稿、铺调子到完成的写实铅笔素描逐步推进，适合绘画教程、美术课讲义和画画账号内容。"
prompt: |
  生成一张竖版 3×3 教程风过程图：同一位年轻女性的肖像在干净的白色素描纸上，从淡淡的构图草稿逐步画成精致写实的石墨铅笔素描。
  画布：竖版白纸背景，4:5，平均分成恰好 9 个长方形格子，3 列 × 3 行；格子之间的分隔非常含蓄，只靠纸张的细微色调差，不要明显边框。
  人物：每格中央都是同一位正面的年轻女性，肩部以上。[深棕色头发]用石墨表现，浓密柔和的弯眉，杏仁形浅色眼睛，挺直精致的鼻子，饱满的嘴唇带一点闭嘴微笑，鹅蛋脸，平静优雅的神情。发型是蓬松松散的盘发，两侧脸颊垂着卷曲的碎发；戴垂坠耳环，穿露肩深色上衣，领口在肖像底部形成柔和的 V 形。
  9 个步骤：
  第 1 格（左上）：极淡的初始构图草稿——椭圆头型、中线、五官水平辅助线、粗略的脖子、肩膀和头发轮廓。
  第 2 格（中上）：干净的浅线稿，确定五官、头发轮廓、耳环、肩膀和领口。
  第 3 格（右上）：初步铺调子，眼睛和嘴唇更具体，开始画头发纹理、耳环和深色领口。
  第 4 格（左中）：更强的石墨刻画，头发调子更饱满，脸部块面、眼睛、嘴唇、肩膀和衣服更清楚。
  第 5 格（正中）：精修的写实肖像，中间调平衡，头发发丝细致，耳环清晰，领口更深。
  第 6 格（右中）：接近完成，头发高对比，皮肤明暗平滑，眼睛细致，衣服更暗。
  第 7 格（左下）：完成的石墨肖像，脸和头发精致，领口阴影强烈，肩膀柔和过渡。
  第 8 格（中下）：完成稿的变体，光线稍柔和，面部细节清晰。
  第 9 格（右下）：最终精修稿，高度写实，干净的石墨明暗层次，细致的头发、耳环、有神的眼睛、柔和的皮肤过渡和深色露肩上衣。
  视觉风格：极其写实的传统石墨铅笔素描，黑白单色，可见铅笔颗粒，细腻的交叉排线和揉擦过渡，橡皮擦出的柔和高光，干净的白色素描纸质感。左上格要非常淡、很草，之后每格逐渐增加对比、细节和写实度，直到右下角的肖像看起来完全完成。
  限制：9 格中女性的身份、比例、姿势、表情、发型、首饰和服装保持一致；不要文字标签、水印、彩色墨水、数字界面元素、多余物体和背景场景。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/HaniaAi12/status/2097126331222040764
  author: "Hania Ai"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文；发色改为变量；保留 9 个步骤的逐格描述"
images:
  - 3160-graphite-portrait-drawing-steps-grid-1.jpg
imageCredit:
  by: "Hania Ai"
  url: https://youmind.com/gpt-image-2-prompts?id=33840
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：[深棕色头发] 可以改发色和人物描述；把女性肖像换成"一只猫的头像""一个苹果""一只手"，就能得到不同主题的素描步骤图（步骤描述里的"五官、头发"要改成对应的结构，比如苹果写"外轮廓 → 明暗交界线 → 投影 → 高光"）。想做 6 步，把网格改成 3×2，并把中间步骤合并。

示例图是白纸上的 3×3 九宫格：左上只有淡淡的椭圆和十字辅助线，往右往下依次出现线稿、浅调子、深调子，到右下角是一张完成度很高的写实铅笔肖像——盘发、碎发、垂坠耳环和深色露肩上衣，九格里人物一致。

**常见问题**：
- 后几格看起来一样：这是正常的（原作第 7～9 格就是完成稿的微调），想要差异更明显就减少到 6 格。
- 第 1 格太"完整"：强调"只有几何辅助线，几乎看不到五官"。
- 用于教学：AI 生成的过程图是"示意"，不完全等于真实绘画顺序，讲解时请结合实际技法。

**适合**：绘画教程、美术课讲义、画画账号内容、素描练习参考。

### 英文原版

```text
Goal: Create a vertical 3-by-3 tutorial-style progression sheet showing the same young woman’s portrait being developed from a faint construction drawing into a polished realistic graphite pencil sketch on clean white drawing paper.

Canvas: Portrait-oriented white paper background, 4:5 aspect ratio, divided into exactly 9 equal rectangular panels arranged in a 3 columns x 3 rows grid. The grid divisions are very subtle, created by slight tonal differences in the paper rather than visible borders.

Subject: The same front-facing young woman appears centered in every panel from the shoulders up. She has {argument name="hair color" default="dark brown hair rendered in graphite"}, thick softly arched eyebrows, almond-shaped light eyes, a straight delicate nose, full lips with a faint closed-mouth smile, an oval face, and a calm elegant expression. Her hairstyle is a voluminous loose updo with wispy curled strands falling beside both cheeks. She wears dangling earrings and an off-shoulder dark dress or neckline that forms a soft V shape across the bottom of the portrait.

Panel count and progression: Include exactly 9 portrait panels. Panel 1, top left: extremely faint initial construction sketch with an oval head, centerline, horizontal facial guide lines, rough neck, shoulders, and hair mass. Panel 2, top center: light clean line art with facial features, hair outline, earrings, shoulders, and neckline established. Panel 3, top right: early shaded portrait with more developed eyes, lips, hair texture, earrings, and dark neckline beginning. Panel 4, middle left: stronger graphite rendering, fuller hair shading, clearer facial planes, eyes, lips, shoulders, and dress. Panel 5, middle center: refined realistic portrait with balanced midtone shading, detailed hair strands, defined earrings, and darker neckline. Panel 6, middle right: nearly finished portrait with high contrast hair, smooth skin shading, detailed eyes, and darker clothing. Panel 7, bottom left: finished graphite portrait with polished face and hair, strong neckline shadow, and soft shoulder shading. Panel 8, bottom center: finished portrait variant with slightly smoother lighting and crisp facial detail. Panel 9, bottom right: final polished portrait, high realism, clean graphite values, detailed hair, earrings, expressive eyes, soft skin transitions, and dark off-shoulder garment.

Visual style: Extremely realistic traditional graphite pencil drawing, monochrome black-and-white, visible pencil grain, delicate crosshatching and smudged blending, soft eraser highlights, clean white drawing paper texture. The top-left panel should be very pale and sketchy, and each subsequent panel should gradually increase in contrast, detail, and realism until the final bottom-right portrait looks complete.

Constraints: Keep the woman’s identity, proportions, pose, expression, hairstyle, jewelry, and clothing consistent across all 9 panels. No text labels, no watermark, no colored ink, no digital UI elements, no extra objects, and no background scenery.
```

> 改编自 [Hania Ai](https://x.com/HaniaAi12/status/2097126331222040764) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
