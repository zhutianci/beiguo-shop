---
title: "饮品海报提示词：清透冰蓝的青柠椰子冰饮竖版海报（竖排细字中文标题）（gpt-image-2）"
slug: fresh-drink-vertical-chinese-poster
model: gpt-image-2
topics: [food, poster]
aspectRatio: "9:16"
needsRefImage: false
useCase: "生成一张清透、留白多的夏日饮品海报：浅天蓝背景、碎冰杯装饮品、杯身白色标签，左侧细长竖排中文标题和印章，适合茶饮店新品、外卖头图和朋友圈海报。"
prompt: |
  为"[青柠椰云冰饮]"生成一张清爽的夏日竖版饮品海报，透明冰感美学，浅青色调，高级极简的中文排版。
  画布：9:16 竖版，通透的高调光线，柔和的天蓝与白色背景，淡淡的云、闪烁的水雾、碎冰，底部是光亮的水面倒影。右上角一片柔和的棕榈叶影子，暗示热带夏日阳光。
  主体：画面中下部略偏右放一只大号透明塑料杯，装着半透明的浅水绿色冰饮，可见气泡、冷凝水珠，顶部是碎冰，杯沿斜靠恰好 1 片圆形青柠片。杯沿和杯壁透明、光亮、写实，带清凉高光和折射。
  杯身标签：一张白色圆角标签，青绿色印刷：恰好 1 个中文饮品名、英文副标题"CITRUS COCONUT CLOUD ICE"、1 条细分隔线、恰好 3 个小线性图标（柑橘片、椰子和棕榈树、冰块），底部小字"青柠 | 椰子 | 冰爽"。
  文字：左侧一行非常高的竖排细线青绿色中文标题"[青柠椰云冰饮]"；左上角一行竖排小标语"[清爽椰云 冰凉入心]"，上方 1 个青柠片小图标和一条垂下的点线装饰；左下角竖叠 3 个英文词"Citrus""Coconut""Cloud Ice"。
  印章：杯子右上方恰好 1 枚青绿色圆形印章，中间一个雪花图标，环形小字是"夏日推荐、冰爽"之类的意思。
  视觉风格：写实产品广告渲染 + 干净的平面设计，优雅的细线青绿色字体，极度透明的冰感，柔和辉光，水面倒影，低对比，大量留白，清新的椰子青柠夏日氛围；不要人物、杂物、多余产品和水印。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/xiaoxiaodong01/status/2075236593900920914
  author: "小小东"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文；饮品名、竖排标题、标语改为变量；保留杯身标签、图标和印章的数量约束"
images:
  - 3062-fresh-drink-vertical-chinese-poster-1.jpg
imageCredit:
  by: "小小东"
  url: https://youmind.com/gpt-image-2-prompts?id=28167
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：[青柠椰云冰饮] 在标题和杯身标签两处出现，换成你的饮品名，如"[白桃乌龙冰茶]""[葡萄冰萃]"；标语换成一句 8 字左右的短句；英文副标题、杯身小图标和配料小字也要同步改成对应饮品。配色跟着饮品走：葡萄用"淡紫色"，白桃用"浅粉色"。

示例图是浅蓝白的竖版海报：左侧一列细长的青绿色竖排"青柠椰云冰饮"，左上一行竖排小标语，中下部一杯浅水绿色冰饮，碎冰上斜插一片青柠，杯身白色标签写着饮品名和三个小图标，右上一枚雪花印章和棕榈叶影，底部是水面倒影。

**常见问题**：
- 标题字体变粗：强调"细线、纤细的中文字体"。
- 杯身标签字太小出错：标签只保留饮品名和一行小字。
- 画面发灰：加"高调明亮、白色占主导"。

**适合**：茶饮店新品海报、外卖平台头图、朋友圈 / 小红书上新图、门店灯箱。

### 英文原版

```text
Goal: Create a refreshing vertical summer beverage poster for {argument name="drink name" default="青柠椰云冰饮"}, with a transparent icy aesthetic, pale cyan palette, and premium minimalist Chinese typography.

Canvas: Tall 9:16 poster, airy high-key lighting, soft sky-blue and white background, faint clouds, sparkling mist, crushed ice, and a glossy water surface reflection at the bottom. Add a soft palm-leaf shadow in the upper right to suggest tropical summer light.

Main subject: Place one large clear plastic cup slightly right of center in the lower-middle of the poster. The cup contains a translucent light-aqua iced drink with visible bubbles, condensation droplets, crushed ice at the top, and exactly 1 round lime slice garnish leaning on the rim. Make the cup rim and walls transparent, glossy, and realistic, with cool highlights and refractions.

Cup label: Add a rounded white label on the cup with teal printing. The label should contain exactly 1 main Chinese drink name, the English subtitle “CITRUS COCONUT CLOUD ICE,” 1 thin divider line, and exactly 3 small line icons: a citrus slice, a coconut with palm tree, and ice cubes. Add small ingredient text at the bottom reading “青柠 | 椰子 | 冰爽”.

Typography and poster text: On the left side, create a very tall vertical headline in thin teal Chinese characters reading {argument name="vertical headline" default="青柠椰云冰饮"}. Near the top-left, add a small vertical slogan reading {argument name="slogan" default="清爽椰云 冰凉入心"} with exactly 1 small lime-slice icon above it and a short hanging dot-line ornament. Near the lower-left, add exactly 3 stacked English words: “Citrus”, “Coconut”, “Cloud Ice”.

Stamp detail: On the right side above the cup, add exactly 1 circular teal seal stamp with a snowflake icon in the center and small Chinese text around the ring suggesting summer recommendation and ice-cool refreshment.

Visual style: Photorealistic product-ad rendering mixed with clean graphic design, elegant thin-line teal typography, ultra-translucent glassy ice, soft bloom, watery reflections, low contrast, generous negative space, fresh coconut-lime summer mood, no people, no clutter, no extra products, no watermark.
```

> 改编自 [小小东](https://x.com/xiaoxiaodong01/status/2075236593900920914) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
