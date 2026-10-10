---
title: "ai产品图提示词：红宝石切面香水瓶广告大片，丝绸、烟雾与飞溅的花瓣（Nano Banana）"
slug: ruby-crystal-perfume-silk-smoke-hero-shot
model: nano-banana
topics: [ecommerce, photography, poster]
modelLabel: Nano Banana Pro
aspectRatio: "4:5"
needsRefImage: false
useCase: "给香水、精华、酒类这种\"瓶子本身就是主角\"的产品做一张戏剧感很强的广告主图：切面水晶瓶斜向悬在画面中央，周围是翻卷的红色丝绸、暗色烟尘、碎冰和花瓣，深色背景、逆光勾边。"
prompt: |
  生成一张 4:5 竖版、电影感极强的高端香水广告摄影。
  - 产品：一只切面几何造型的水晶香水瓶，棱线锐利优雅；高透玻璃带[深红宝石色]渐变，瓶内液体是浓郁的红色并透出宝石般的光；瓶盖是[拉丝玫瑰金]金属，顶面有压印徽记；瓶身正面用极简的衬线字体把品牌名"[NOIR ÉLIXIR]"直接蚀刻在玻璃上并嵌入金属色，下面一行小小的手写体系列名"[Crimson Reserve]"。
  - 构图：瓶子位于画面中央，以戏剧性的斜角悬浮，略向右倾，占画面约一半；镜头略低，突出瓶身的切面。
  - 环绕元素：[红色丝绸]像水流一样在瓶子后方和下方翻卷；深色的粉尘和烟雾向四周炸开；几块透明碎冰、[玫瑰花瓣]和细小的水珠在空中飞散，有的在焦内，有的虚化成前景。
  - 背景：近乎纯黑，带暗红色的雾气层次。
  - 光线：强烈的侧逆光勾出瓶身轮廓，切面上有清晰的高光和折射，液体被从背后打亮；整体高反差。
  - 质感：超写实的商业静物摄影，玻璃、金属和布料的质感分明，文字锐利清晰；除品牌名和系列名外不出现其他文字，不要水印。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-nano-banana-pro-prompts
  url: https://x.com/john_my07/status/2024420826016338208
  author: "@john_my07"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "JSON 原文改写为分条中文；品牌名、系列名、主色、瓶盖材质、环绕元素改为变量；原文较长，合并了重复的灯光与画质条目，按示例图保留了构图角度和环绕元素"
images:
  - 3515-ruby-crystal-perfume-silk-smoke-hero-shot-1.jpg
imageCredit:
  by: "@john_my07"
  url: https://youmind.com/nano-banana-pro-prompts?id=10436
  license: CC BY 4.0
verify:
  - "上线前在 Nano Banana 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：[NOIR ÉLIXIR] 和 [Crimson Reserve] 换成你的品牌名和系列名（英文最稳，中文建议不超过 4 个字）；[深红宝石色] 决定整张图的主色，换成"祖母绿""琥珀金""午夜蓝"时，丝绸和花瓣的颜色也要跟着换；[拉丝玫瑰金] 是瓶盖材质，可换"镜面银""哑光黑"；环绕元素建议和香调对应，例如木质调用"木屑和烟"，柑橘调用"橙皮和水花"。

示例图里，一只红色的切面香水瓶斜悬在黑色背景中央，瓶盖是玫瑰金色，瓶身上是白色的品牌名和一行手写体小字；瓶子后方是翻卷的红色丝绸，四周是炸开的深色粉尘、几块透明碎冰和飘散的红色花瓣。

**常见问题**：
- 瓶身文字变形：只保留品牌名一行，系列名后期再加。
- 元素太多盖住产品：写"所有环绕元素都不遮挡瓶身正面"。
- 画面发灰：强调"背景纯黑、主光来自左后方、高反差"。

**适合**：香水、精华、洋酒等瓶装产品的概念主图和新品海报；品牌名请使用你自己的或虚构的名称。

### 英文原版

```text
{
  "master_prompt": {
    "product": {
      "type": "luxury perfume bottle",
      "brand_name": "NOIR ÉLIXIR",
      "fragrance_line": "Crimson Reserve",
      "container_shape": "faceted geometric crystal bottle with sharp elegant edges",
      "material": "high-clarity glass with deep ruby gradient tint",
      "finish": "polished reflective surfaces with subtle matte facets",
      "cap_design": "magnetic cap in brushed rose-gold metal with engraved emblem",
      "label_style": "minimal serif typography etched directly into glass with metallic inlay",
      "liquid_color": "rich crimson red with glowing ruby undertones"
    },
    "composition": {
      "scene_type": "ultra-cinematic luxury fragrance advertising photography",
      "orientation": "vertical",
      "aspect_ratio": "4:5",
      "camera_angle": "dramatic diagonal hero angle",
      "subject_position": "floating mid-air with slight forward tilt",
      "motion": "atomized perfume mist trails and fluid fragrance ribbons suspended in motion"
    },
    "environment": {
      "background": "deep black velvet gradient fading into shadow",
      "atmosphere": "volumetric mist with delicate fragrance vapor swirling around the bottle",
      "floating_elements": [
        "atomized perfume droplets suspended mid-air",
        "shattering crystal fragments catching highlights",
        "dark red rose petals drifting slowly",
        "glossy blood-orange peel curls",
        "fine rose-gold dust particles sparkling in light"
      ],
      "surface_effects": "micro condensation beads and polished reflections enhancing realism"
    },
    "lighting": {
      "style": "dramatic low-key studio lighting",
      "key_light": "soft directional light sculpting the glass facets",
      "rim_lights": "strong rim lights outlining silhouette and edges",
      "accent_lights": "warm ruby and rose-gold specular highlights on cap and engraved details",
      "shadow_depth": "deep cinematic shadows for luxury mood",
      "contrast": "high contrast with controlled reflections and luminous highlights"
    },
    "color_palette": {
      "primary_colors": ["obsidian black", "deep garnet", "ruby red"],
      "accent_colors": ["rose gold", "warm champagne glow"]
    },
    "camera_settings": {
      "lens": "macro cinema prime lens",
      "depth_of_field": "shallow depth isolating product from background",
      "focus_point": "engraved logo and glass surface textures",
      "bokeh": "smooth cinematic bokeh from reflective particles",
      "detail_capture": "extreme micro-detail clarity"
    },
    "render_quality": {
      "resolution": "8K ultra high definition",
      "render_style": "hyper-realistic luxury commercial render",
      "glass_physics": "accurate refraction and internal reflections",
      "liquid_simulation": "physically accurate fluid dynamics",
      "textures": "ultra-detailed crystal, metal, mist, and micro-droplet textures",
 "render_style_continuation": "hyper-realistic luxury commercial render"
    }
}
```

> 改编自 [@john_my07](https://x.com/john_my07/status/2024420826016338208) 发布、[YouMind-OpenLab/awesome-nano-banana-pro-prompts](https://github.com/YouMind-OpenLab/awesome-nano-banana-pro-prompts) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
