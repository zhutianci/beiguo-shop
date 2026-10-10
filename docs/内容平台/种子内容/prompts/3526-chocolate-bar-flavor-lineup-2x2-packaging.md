---
title: "ai包装设计提示词：巧克力新口味系列包装四宫格，粗体大字 + 复古版画小图（Nano Banana）"
slug: chocolate-bar-flavor-lineup-2x2-packaging
model: nano-banana
topics: [ecommerce, logo, food]
modelLabel: Nano Banana Pro
aspectRatio: "1:1"
needsRefImage: false
useCase: "一次看清一个产品系列的包装延展：2×2 四宫格里是同一品牌的四块巧克力排，版式完全一致，只换底色、口味名和中间那枚版画风的小插图。适合做口味上新图、包装提案和系列海报。"
prompt: |
  生成一张影棚产品摄影图，1:1 方形，2 行 2 列的四宫格，每格正中立着一块同品牌的巧克力排，平视正面拍摄，四格之间间距均匀。
  - 环境：干净的米白色中性台面和墙面，柔和均匀的室内布光，每块巧克力在墙上投下一道淡淡的阴影；气质极简、现代、手作感。
  - 包装：扁平的长方形纸质包装，纸面有细微的肌理；四款版式完全相同——上方是两行超大的深棕色粗体无衬线字母品牌名"[AGI BAR]"，下面一行稍小的"[80% CACAO]"，中间一枚复古木刻版画风格的小插图，最底部一行小号大写的口味名。
  - 四款的差别只有底色、插图和口味名：
    - 左上：[橙色]底，插图是[一块淋着焦糖的方糖]，口味名"[SALTED CARAMEL]"；
    - 右上：[番茄红]底，插图是[一只冒火的辣椒]，口味名"[FIRE JALAPEÑO]"；
    - 左下：[雾蓝色]底，插图是[一颗可可果和海盐粒]，口味名"[HIMALAYAN SEA SALT]"；
    - 右下：[奶油米色]底，插图是[香草花和香草荚]，口味名"[MADAGASCAR VANILLA]"。
  - 文字清晰、拼写正确，四款的字体和位置完全对齐；不出现真实品牌标志和水印。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-nano-banana-pro-prompts
  url: https://x.com/cbsingh_oo3/status/2012126771123310633
  author: "@cbsingh_oo3"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "JSON 原文改写为分条中文；品牌名、可可含量、四种口味及其底色和小图改为变量（英文口味名换成可替换的示例）；合并了场景与灯光条目"
images:
  - 3526-chocolate-bar-flavor-lineup-2x2-packaging-1.jpg
imageCredit:
  by: "@cbsingh_oo3"
  url: https://youmind.com/nano-banana-pro-prompts?id=6310
  license: CC BY 4.0
verify:
  - "上线前在 Nano Banana 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：品牌名用两行、每行 3～4 个大写字母最有冲击力；四种口味各配一个底色和一枚小图，底色选彼此区分明显又同样偏哑光的颜色；口味名可以换成中文（每个 4～6 个字）。产品不是巧克力也能用——把"巧克力排"换成"咖啡豆袋""香皂盒""茶叶罐"，版式规则不变。

示例图是米白色背景上的四块巧克力：橙色的一块画着淋焦糖的方块，红色的一块画着带火焰的辣椒，雾蓝色的一块画着可可果，米色的一块画着香草花和豆荚；每块上方都是同样的深棕色大字品牌名和"80% CACAO"，最下面一行是英文口味名。

**常见问题**：
- 四款版式不一致：强调"四款使用同一模板，只替换底色、插图和最后一行文字"。
- 小图画成彩色插画：写"单色木刻版画风格，线条为深棕色"。
- 字母拼错：品牌名和口味名尽量短，长单词容易错，出图后逐个核对。

**适合**：口味系列的上新图、包装设计提案、品牌社媒的九宫格素材。

### 英文原版

```text
{
  "scene_overview": {
    "setting": "Studio product photography setup",
    "background": "Clean, off-white neutral surface and wall",
    "time_of_day": "Not specified (controlled indoor lighting)",
    "atmosphere": "Minimalist, modern, premium, calm",
    "mood": "Artisanal, refined, contemporary"
  },
  "composition": {
    "layout": "Grid layout with four products",
    "arrangement": "Two rows and two columns",
    "alignment": "Each chocolate bar centered within its quadrant",
    "spacing": "Even spacing with clear separation between products",
    "perspective": "Straight-on, eye-level product view"
  },
  "products": {
    "brand_name": "AGI BAR",
    "product_type": "Chocolate bars",
    "cacao_percentage": "80% CACAO",
    "quantity": 4,
    "packaging_style": "Flat, rectangular paper wrappers",
    "design_theme": "Minimalist typography with vintage-style ingredient illustrations"
  },
  "individual_variants": [
    {
      "position": "Top left",
      "flavor_name": "{argument name="flavor 1" default="Salted Caramel"}",
      "wrapper_color": "Warm mustard yellow",
      "text_color": "Dark brown",
      "illustration": "Small cube of caramel with dripping glaze and salt crystals",
      "visual_tone": "Warm, indulgent"
    },
    {
      "position": "Top right",
      "flavor_name": "{argument name="flavor 2" default="Fire Jalapeño"}",
      "wrapper_color": "Muted red",
      "text_color": "Dark brown",
      "illustration": "Jalapeño pepper with flame on top",
      "visual_tone": "Bold, spicy, intense"
    },
    {
      "position": "Bottom left",
      "flavor_name": "{argument name="flavor 3" default="Himalayan Sea Salt"}",
      "wrapper_color": "Soft pastel blue",
      "text_color": "Dark navy/charcoal",
      "illustration": "Cacao pod with scattered salt crystals",
      "visual_tone": "Cool, clean, refined"
    },
    {
      "position": "Bottom right",
      "flavor_name": "Madagascar Vanilla",
      "wrapper_color": "Light cream / beige",
      "text_color": "Dark brown",
      "illustration": "Vanilla flower with vanilla pods",
      "visual_tone": "Elegant, smooth, classic"
    }
  ],
  "typography": {
    "primary_text": "AGI BAR",
    "secondary_text": "80% CACAO",
    "flavor_text": "Flavor name printed near bottom",
    "font_style": "Bold, uppercase, sans-serif with slightly rough texture",
    "hierarchy": "Brand name largest, cacao percentage medium, flavor smallest"
  },
  "lighting": {
    "light_type": "Soft, diffused studio lighting",
    "shadow_style": "Subtle shadows beneath and around packaging",
    "highlights": "Even illumination with no harsh reflections",
    "contrast": "Low to medium, natural"
  },
  "color_palette": {
    "dominant_colors": [
      "Mustard yellow",
      "Muted red",
      "Pastel blue",
      "Cream beige"
    ],
    "accent_colors": [
      "Dark brown",
      "Charcoal",
      "Navy"
    ],
    "overall_palette": "Muted, earthy, premium"
  },
  "style": {
    "visual_style": "Clean,
```

> 改编自 [@cbsingh_oo3](https://x.com/cbsingh_oo3/status/2012126771123310633) 发布、[YouMind-OpenLab/awesome-nano-banana-pro-prompts](https://github.com/YouMind-OpenLab/awesome-nano-banana-pro-prompts) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
