---
title: "博物馆展板风信息图提示词：汉服 / 文物结构拆解图（材质、纹样、色彩寓意）（gpt-image-2）"
slug: museum-style-breakdown-infographic
model: gpt-image-2
topics: [infographic, fashion]
aspectRatio: "3:4"
needsRefImage: false
useCase: "输入一个传统文化主题（汉服、瓷器、青铜器等），自动生成\"国家博物馆展板式\"的中文拆解信息图：写实主视觉 + 结构引线标注 + 材质工艺 + 纹样色彩寓意 + 穿戴顺序 / 组成流程。"
prompt: |
  根据【主题：[汉服]】，自动生成一张"博物馆导览式中文拆解信息图"。
  画面要同时包含：写实主视觉、结构拆解、中文标注、材质说明、纹样寓意、色彩象征和核心特征总结。请根据主题自动判断最合适的主体、服饰体系或器物结构、时代风格、关键部件、材质工艺、配色和版式，无需我再补充。
  整体风格：国家博物馆展板、历史服饰导览或文化专题展的信息图，而不是普通海报、古风写真、电商详情页或动漫插画。背景使用米白、素绢白或浅茶色的纸张质感，整体高级、克制、专业、有收藏感。
  版式固定为：
  - 顶部：中文主标题 + 副标题 + 一段简介；
  - 左侧：结构拆解区，用中文引线标出关键部件，并配对应的局部特写；
  - 右上：材质 / 工艺 / 质感区，展示真实的面料或材料小样并配说明；
  - 右中：纹样 / 色彩 / 寓意区，展示主色板、纹样小样和文化解释；
  - 底部：穿戴顺序或组成流程图 + 核心特征总结。
  如果主题适合人物展示，就以一位全身站姿的人物为中心主体；如果更适合器物，就以器物拆解为中心，但都要保持完整的中文信息图格式。
  所有文字使用简体中文，清晰、工整、可读，不要乱码和错别字。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/MrLarus/status/2045504669401653414
  author: "Larus Canus"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "原文的中文说明整理为中文提示词；主题改为变量；保留固定版式分区，精简重复的风格描述"
images:
  - 3021-museum-style-breakdown-infographic-1.jpg
imageCredit:
  by: "Larus Canus"
  url: https://youmind.com/gpt-image-2-prompts?id=13977
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：[汉服] 可以写得更具体，如"明制汉服""宋代褙子""唐代圆领袍"，也可以换成器物："青花瓷梅瓶""越王勾践剑""景泰蓝"。主题越具体，结构和纹样越准确；想要特定朝代的样式，就在主题里写清朝代。

示例图是"明制汉服拆解图"：中央一位穿浅粉立领上衣和织金马面裙的女子全身像，左侧引线标注立领、对襟、袖型、马面等部件并配特写，右上是几块面料小样，右中是纹样圆章和色板，底部是从中衣到外衣的穿戴顺序小图。

**常见问题**：
- 形制或史实不准：模型会混淆朝代特征，做正式科普前请对照资料核对部件名称。
- 小字出现错别字：把每个区域的说明控制在 2～3 行。
- 人物太像古风写真：强调"博物馆展板，人物只是展示服饰的模特"。

**适合**：传统文化科普、历史 / 美术课件、汉服社团宣传、博物馆风格展板。

### 原版提示词

```text
Please automatically generate a "Museum Guide-style Chinese Breakdown Infographic" based on the [Theme: {argument name="theme" default="Hanfu"}].

Requirements: The entire image must combine a realistic main visual, structural breakdown, Chinese annotations, material descriptions, pattern meanings, color symbolism, and a summary of core features. You need to automatically determine the most suitable subject, clothing system, artifact structure, era style, key components, material craftsmanship, color scheme, and layout based on the [Theme] without further user input.

The overall style should be: National Museum exhibition board, historical clothing guide, or cultural museum special infographic, rather than a common poster, ancient-style photo, e-commerce details page, or anime illustration. The background should use paper textures like off-white, silk white, or light tea color. The overall look should be high-end, restrained, professional, and collectible.

The layout is fixed as:
- Top: Chinese main title + sub-title + introduction
- Left: Structural breakdown area with Chinese leader lines marking key components and matching close-ups
- Top Right: Material/Craftsmanship/Texture area showing real texture samples with descriptions
- Middle Right: Pattern/Color/Meaning area showing the main color palette, pattern samples, and cultural explanations
- Bottom: Wearing order / Composition flowchart + summary of core features

If the theme is suitable for person display, use a full-body standing pose of a real person as the central subject; if it's more suitable for artifacts, use a central subject breakdown, but maintain the complete Chinese infographic format. All text must be in Simplified Chinese, clear, neat, and readable without garbled characters or typos.
```

> 改编自 [Larus Canus](https://x.com/MrLarus/status/2045504669401653414) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
