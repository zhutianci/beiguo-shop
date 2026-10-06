---
title: 城市旅行海报提示词：极简单色线描风城市街景海报（可换任意城市）
slug: line-art-city-travel-poster
model: gpt-image-2
topics: [poster, illustration]
aspectRatio: "3:4"
needsRefImage: false
useCase: 用一种墨色 + 一种底色画出城市日常街景，做成高级感的城市海报，适合文旅宣传、明信片和装饰画。
prompt: |
  为[厦门]创作一张极简、超高清的线描风旅行海报，把城市画成时髦的日常街景，而不是游客明信片。
  主画面：这座城市最有代表性的日常街景——[沙坡尾的老街和海边步道]，充满生活气息。
  前景：当地居民、通勤的人、[轮渡乘客]、咖啡馆客人、学生、骑车的人、街头艺人、逛街的人，自然地在城市里活动，穿着符合当代本地生活的衣服。
  背景：[骑楼、茶铺、书店、轮渡码头]、[海鲜排档、路灯、晾晒的衣服]、猫、海鸥和密集的建筑纹理，配真实的中文招牌。
  地标要自然融入日常，而不是喧宾夺主：[鼓浪屿、轮渡、钢琴码头]隐约出现在城市节奏里。
  标题：顶部居中的大字"[XIAMEN]"，底部小字副标题"[厦门]"。
  风格：干净的矢量插画，瑞士现代主义旅行海报，单线线描，中世纪杂志插画风，建筑插画，几何透视清晰，留白干净，高端旅行品牌感，画面密而有序。
  线条：只用单色线条，细而精准，极少填色，像城市地图一样精细。
  配色（非常重要）：只用一种墨色 + 一种底色，丝网印刷感，不要彩虹色，不要霓虹；推荐[海港藏青色墨线配暖奶油色底]。
  构图：竖版，街道平视视角，行人自然穿行，层次丰富，有纵深，像一张高端城市品牌宣传海报。
  文字：所有文字干净、清晰、专业，不要乱码和变形字母。
negativePrompt: null
source:
  repo: EvoLinkAI/awesome-gpt-image-2-API-and-Prompts
  url: https://x.com/miilesus/status/2054285276780929527
  author: "@miilesus"
  license: CC0 1.0
  licenseUrl: https://creativecommons.org/publicdomain/zero/1.0/
  changes: 英文原文译为中文并精简重复项；把伊斯坦布尔换成厦门示例，城市、街景、人物、街道元素、地标、标题和配色全部改为变量
images:
  - 116-line-art-city-travel-poster-1.jpg
imageCredit:
  by: "@miilesus"
  url: https://x.com/miilesus/status/2054285276780929527
  license: CC0 1.0
verify:
  - 在 gpt-image-2 上实测 3 次，记录成功率与最常见的失败形式
  - 中文招牌是否出现乱码
  - 换北京、成都、香港各测一次，地标是否准确
  - 确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）
---
**怎么填变量**：换城市时，[街景]、[街道元素]、[地标] 三处一起改，写当地人真正熟悉的东西（成都写"玉林路、茶馆、盖碗茶、火锅店"）。标题用英文大写最稳，中文副标题放底部小字。[配色] 只给一组"墨色 + 底色"，例如"砖红配米白"。

**常见问题**：
- 招牌字乱码：画面里的中文招牌很难全部正确，可以改成"招牌只出现模糊的色块，不出现可读文字"。
- 变成彩色插画：重复强调"只用一种墨色"。
- 地标画错：AI 对小众地标不熟，越有名越准；不确定就只写街道氛围，不写具体地标。

**适合**：城市文旅宣传、门店装饰画、个人旅行纪念。

### 英文原版

```text
Create a minimalist ultra-high-resolution travel poster in line-art style for ISTANBUL, portraying the city as a stylish everyday urban scene rather than a tourist postcard.

MAIN COMPOSITION:

Central composition features Istanbul’s most iconic everyday urban scene — a lively tram street in Karaköy, Kadıköy, Beyoğlu, Eminönü, or a Bosphorus-side pedestrian avenue filled with daily life.

Foreground includes local residents, commuters, ferry passengers, café visitors, simit sellers, students, cyclists, street musicians, and shoppers naturally interacting within the city.

People should authentically reflect modern Istanbul street fashion, layered urban lifestyle, and contemporary Turkish culture.

Background filled with authentic Turkish signage, tea houses, bookstores, tram lines, ferry terminals, cafés, bakeries, fish restaurants, street lamps, mosques integrated into skyline, apartment façades, hanging laundry, cats, seagulls, and dense architectural textures.

Subtle landmarks blend naturally into daily life rather than dominating the composition — Galata Tower, Bosphorus ferries, nostalgic tram, mosque silhouettes, and waterfront railings should appear integrated into the urban rhythm.

Use authentic Turkish typography and culturally recognizable street elements.

Large centered title at the top: “ISTANBUL”

Subtitle at the bottom in Turkish: “Türkiye” or “İstanbul”

STYLE:

Ultra-clean vector illustration
Swiss modernist travel poster aesthetic
Minimalist line-art
Monoline drawing
Mid-century editorial illustration style
Architectural illustration
Contemporary Turkish graphic poster design
Crisp geometric perspective
Extremely clean negative space
Premium luxury travel-brand aesthetic
Highly organized visual density

LINE STYLE:

Monochrome line illustration only
Thin, highly precise lines
Minimal fill areas
Intricate city-map-level detailing
Rhythmic arrangement of tram cables, balconies, ferry rails, windows, signage, cats, street furniture, and waterfront architecture
Visually dense yet extremely balanced composition
Ultra-precise vector-quality rendering

COLOR SYSTEM — VERY IMPORTANT:

Use only ONE primary ink color + ONE background color
Automatically select the color pairing that best represents Istanbul’s atmosphere
Monochrome silkscreen poster aesthetic
No rainbow palettes
No excessive neon
Color should reflect Istanbul’s maritime atmosphere, historic architecture, ferry culture, and urban warmth
Recommended palette for Istanbul:
Deep Bosphorus navy ink on warm cream background

COMPOSITION:

Vertical poster layout
Frontal street-level perspective
Pedestrians naturally moving through tram streets, ferry exits, café terraces, and waterfront walkways
Balanced urban rhythm and architectural layering
Strong depth perspective with elegant negative space
Should feel like a premium global city-brand campaign poster

MOOD:

Stylish urban everyday life
Calm yet vibrant atmosphere
Sophisticated metropolitan energy
Timeless city identity
High-end travel magazine cover aesthetic
Minimalist yet ultra-detailed
Elegant Mediterranean-meets-modern urban mood

TEXT QUALITY — EXTREMELY IMPORTANT:

All typography must be clean, readable, and professionally designed
No random symbols
No broken or distorted letters
Turkish signage must appear authentic and natural
Editorial-grade typography hierarchy
Premium modernist poster layout

OUTPUT:

Vertical poster composition
Ultra-detailed 8K resolution
Print-ready
Ultra-precise vector-quality rendering
Luxury travel poster aesthetic
Museum-quality graphic design composition
```

> 改编自 [@miilesus](https://x.com/miilesus/status/2054285276780929527) 发布、[EvoLinkAI/awesome-gpt-image-2-API-and-Prompts](https://github.com/EvoLinkAI/awesome-gpt-image-2-API-and-Prompts) 收录的提示词，仓库许可证 CC0 1.0；示例图同样来自该仓库收录的原帖出图。
