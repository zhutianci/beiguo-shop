---
title: 文字海报提示词：城市名字母里装满地标的瑞士风旅行海报
slug: swiss-typography-city-poster
model: gpt-image-2
topics: [poster, illustration]
aspectRatio: "16:9"
needsRefImage: false
useCase: 用超大城市名做主视觉、每个字母里画一段城市风景，适合文旅横幅、活动主视觉、桌面壁纸。
prompt: |
  创作一张超高清的瑞士现代主义字体旅行海报，主题[HANGZHOU · CHINA]，16:9 高级横版。
  核心概念：一个巨大的粗体窄体无衬线单词"[HANGZHOU]"占据画面中心。
  每个字母都是一扇精准的几何"窗口"，里面是这座城市的标志性地标和真实生活场景的极简扁平插画：
  [西湖、断桥、雷峰塔、龙井茶园]、[灵隐寺、钱塘江大桥、运河老街]、城市天际线、地铁、[骑行的人、茶馆]
  各字母里的场景要无缝衔接，组成一段连续的城市全景叙事，同时保持字母边缘干净利落、字体完整。
  顶部全景条：海报最上方是一条细长优雅的全景带，画城市天际线剪影、[游船]、飞鸟、树木、汽车和电动车、风格化的太阳、少量云朵。
  风格：瑞士平面设计 + 中世纪现代旅行海报；只用扁平矢量插画；建筑信息图般的精准；百分百干净的几何形；不要渐变、不要写实、不要纹理颗粒、不要文字扭曲。
  配色：[湖水青绿、暖珊瑚、茶叶绿]、象牙白、[石板蓝、柔和赭石]。
  背景：柔和的象牙白或暖白。
  文字：专业的字距，完全可读，像人工设计的品牌字体。大标题"[HANGZHOU]"，下方优雅的小字副标题"[CHINA]"。
  氛围：理性、安静、前卫，像博物馆设计商店里的收藏级旅行海报。
negativePrompt: null
source:
  repo: EvoLinkAI/awesome-gpt-image-2-API-and-Prompts
  url: https://x.com/Shorelyn_/status/2054196121980002523
  author: "@Shorelyn_"
  license: CC0 1.0
  licenseUrl: https://creativecommons.org/publicdomain/zero/1.0/
  changes: 英文原文译为中文；把曼谷换成杭州示例，城市名、字母内场景、顶部元素、配色和副标题改为变量
images:
  - 118-swiss-typography-city-poster-1.jpg
imageCredit:
  by: "@Shorelyn_"
  url: https://x.com/Shorelyn_/status/2054196121980002523
  license: CC0 1.0
verify:
  - 在 gpt-image-2 上实测 3 次，记录成功率与最常见的失败形式
  - 城市名拼写是否完整、字母是否被场景"吃掉"
  - 字母较多（9 个以上）的城市是否仍可读
  - 确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）
---
**怎么填变量**：[HANGZHOU] 用英文或拼音大写，字母数 5–9 个最佳（太长会挤，太短场景不够放）。场景列表写 8–12 个，按"景点 + 交通 + 生活"搭配；配色从城市印象里取，例如重庆写"雾灰、火锅红、江水绿"。

**常见问题**：
- 字母拼错或少字母：把城市名在提示词里重复两次，并加"字母顺序为 H-A-N-G-Z-H-O-U"。
- 字母里的画面太碎：减少场景数量，或改成"每个字母只放一个场景"。
- 想用中文大字：中文字形复杂、可放画面的空间少，效果不如英文，建议先用英文。

**适合**：横幅、展板、电脑壁纸；竖版海报请改成 3:4 并把城市名拆成两行。

### 英文原版

```text
Create an ultra-high-resolution Swiss modernist typography travel poster for BANGKOK THAILAND in a premium 16:9 layout.

CORE CONCEPT:
A massive bold condensed sans-serif word “BANGKOK” dominates the center composition.
Each individual letter acts as a precise geometric window containing minimalist flat-vector illustrations of iconic Bangkok landmarks and authentic urban life scenes.

INSIDE THE LETTERS INCLUDE:

Grand Palace

Wat Arun

Wat Pho

Chao Phraya River

Tuk-tuks

BTS Skytrain

Long-tail boats

Chinatown signage

Rooftop bars

Street food stalls

Temple roofs

Bangkok modern skyline

The scenes inside each letter must transition seamlessly across the typography, creating one continuous panoramic urban narrative while preserving perfectly clean letter edges and flawless typography integrity.

TOP PANORAMIC RIBBON:
At the very top edge of the poster, create a thin elegant panoramic strip showing:

Bangkok skyline silhouette

BTS train

River boats

Birds

Palm trees

Cars and scooters

Stylized tropical sun

Minimal clouds

STYLE & AESTHETIC:
Swiss Graphic Design meets Mid-Century Modern travel poster aesthetics.
Flat vector illustration only.
Architectural infographic precision.
100% clean geometric shapes.
No gradients.
No photorealism.
No textures.
No grain.
No AI distortion.
No warped typography.

VISUAL EXECUTION:

Sharp vector edges

Sophisticated negative space

Balanced composition

Minimalist architectural detailing

Precise geometric shadows

Museum-grade poster quality

Editorial luxury aesthetic

COLOR PALETTE:
Muted premium Southeast Asian palette inspired by Bangkok:

River teal

Warm coral

Tropical gold

Ivory

Slate blue

Soft terracotta

BACKGROUND:
Soft ivory or premium warm white background.

TYPOGRAPHY:
Professional kerning and spacing.
Perfectly legible text.
Human-designed graphic identity feel.
Large title:
“BANGKOK”
Small elegant subtitle underneath:
“THAILAND”

ATMOSPHERE:
Intellectual, calm, avant-garde, collectible luxury travel poster found in a museum design store.

OUTPUT:
Ultra-detailed 8K vector-style rendering, ultra sharp print-ready quality, high-end editorial poster design.
```

> 改编自 [@Shorelyn_](https://x.com/Shorelyn_/status/2054196121980002523) 发布、[EvoLinkAI/awesome-gpt-image-2-API-and-Prompts](https://github.com/EvoLinkAI/awesome-gpt-image-2-API-and-Prompts) 收录的提示词，仓库许可证 CC0 1.0；示例图同样来自该仓库收录的原帖出图。
