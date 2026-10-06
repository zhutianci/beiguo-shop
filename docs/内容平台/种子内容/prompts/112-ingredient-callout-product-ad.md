---
title: 产品成分标注图提示词：雪糕 / 零食剖面 + 箭头标注配料（gpt-image-2）
slug: ingredient-callout-product-ad
model: gpt-image-2
topics: [ecommerce, infographic]
aspectRatio: "3:4"
needsRefImage: false
useCase: 把食品的分层结构和配料用弧形箭头 + 实物小图标注出来，适合电商详情页"成分解析"、新品海报。
prompt: |
  生成一张 3:4 的写实商业产品渲染图。
  主体：一根竖直居中、插在木棍上的[雪糕]，正面朝前、视角略高，单个产品居中，四周环绕配料标签和弧形箭头。
  背景：[暖金黄色]渐变，平滑哑光、照明均匀，四周轻微暗角。
  光线：棚拍光，柔和正面主光突出巧克力外壳的光泽，补光保留纹理细节，外壳上有清晰高光，木棍下方有柔和投影。
  产品结构：
  - 顶部外壳：[牛奶巧克力]，融化后向下流淌，表面嵌着[不规则的杏仁碎]；
  - 左半边内芯：[巧克力冰淇淋]，均匀分布着[布朗尼小块]；
  - 右半边内芯：[香草冰淇淋]，带有[焦糖粒]。
  木棍：浅色原木，圆角，完整露出。
  配料标注：深棕色粗弧形箭头，深棕色干净的无衬线字体，围绕产品均衡排布：
  - 左上："[巧克力杏仁外壳]"，旁边配整颗杏仁和小块巧克力；
  - 左中："[巧克力布朗尼冰淇淋]"，配布朗尼小块；
  - 右下："[香草焦糖冰淇淋]"，配焦糖块。
  配色：牛奶巧克力棕、金黄、奶油白；超高细节，产品完全清晰，奢华甜品广告质感。
negativePrompt: null
source:
  repo: EvoLinkAI/awesome-gpt-image-2-API-and-Prompts
  url: https://x.com/iamaiistudio/status/2067465624683700642
  author: "@iamaiistudio"
  license: CC0 1.0
  licenseUrl: https://creativecommons.org/publicdomain/zero/1.0/
  changes: 原文 JSON 结构改写为中文分段描述；产品、各层材料、标注文字改为变量；合并原文中重复的一条标注；标注文字改为中文
images:
  - 112-ingredient-callout-product-ad-1.jpg
imageCredit:
  by: "@iamaiistudio"
  url: https://x.com/iamaiistudio/status/2067465624683700642
  license: CC0 1.0
verify:
  - 在 gpt-image-2 上实测 3 次，记录成功率与最常见的失败形式
  - 中文标注是否有错字、箭头是否指向正确的分层
  - 换成"三明治""汉堡"等其他分层食品是否适用
  - 确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）
---
**怎么填变量**：先想清楚你的产品有几层、每层是什么，再对应改"产品结构"和"配料标注"两段，两段要一一对应。层数建议 2–4 层，标注 3–4 条；标注文字控制在 8 个字以内。

**常见问题**：
- 中文标注写错或变形：把标注改短；实在不行，先让 AI 出无字版，再自己用设计软件加字。
- 箭头乱指：在每条标注后写清"箭头指向左半边内芯"这类位置。
- 剖面不明显：加"产品被咬掉一口，露出内部分层"。

**适合**：冰淇淋、蛋糕、夹心饼干、汉堡、饮品分层等。

### 英文原版

```text
{
  "resolution": "8K",
  "aspect_ratio": "3:4",
  "image_type": "photorealistic commercial product render",
  "scene_description": {
    "main_subject": "A vertically centered ice cream bar mounted on a wooden stick",
    "orientation": "upright, front-facing, slightly elevated perspective",
    "composition": "single product centered with surrounding ingredient labels and curved arrows"
  },
  "background": {
    "color": "warm golden-yellow gradient",
    "texture": "smooth, matte, evenly illuminated",
    "lighting_falloff": "subtle vignette, darker towards edges"
  },
  "lighting": {
    "type": "studio lighting",
    "key_light": "soft frontal light emphasizing chocolate gloss",
    "fill_light": "balanced fill preserving texture detail",
    "specular_highlights": "visible on melted chocolate coating",
    "shadows": "soft shadow beneath the stick"
  },
  "ice_cream_bar": {
    "shape": "rounded rectangular bar",
    "surface": "smooth with visible embedded inclusions",
    "layers": [
      {
        "layer_position": "top coating",
        "material": "milk chocolate",
        "state": "melted and dripping",
        "texture": "glossy, thick, fluid",
        "details": [
          "multiple chocolate drips flowing downward",
          "irregular almond pieces embedded in coating",
          "rounded drip edges pulled by gravity"
        ]
      },
      {
        "layer_position": "left interior",
        "material": "chocolate ice cream",
        "texture": "dense, creamy",
        "details": [
          "small dark brownie chunks evenly dispersed",
          "matte finish contrasting outer chocolate"
        ]
      },
      {
        "layer_position": "right interior",
        "material": "vanilla ice cream",
        "texture": "smooth and creamy",
        "details": [
          "visible caramel pieces",
          "light beige caramel chunks with rounded edges"
        ]
      }
    ]
  },
  "stick": {
    "material": "light natural wood",
    "texture": "smooth with subtle grain",
    "shape": "rounded edges, flat profile",
    "visibility": "fully visible below ice cream bar"
  },
  "ingredient_callouts": {
    "style": {
      "arrows": "curved, thick, dark brown",
      "text_color": "dark brown",
      "font_style": "clean sans-serif",
      "layout": "balanced around product"
    },
    "labels": [
      {
        "text": "Chocolate with almonds",
        "position": "top-left",
        "visual_aid": ["whole almonds", "small chocolate squares"]
      },
      {
        "text": "Chocolate ice cream with brownies",
        "position": "left-middle",
        "visual_aid": ["brownie chunks"]
      },
      {
        "text": "Chocolate ice cream with brownies",
        "position": "right-middle",
        "visual_aid": ["brownie chunks"]
      },
      {
        "text": "Vanilla ice cream with caramel pieces",
        "position": "bottom-right",
        "visual_aid": ["caramel cubes", "white vanilla pieces"]
      }
    ]
  },
  "color_palette": {
    "primary_colors": ["milk chocolate brown", "golden yellow", "cream white"],
    "secondary_colors": ["dark brownie brown", "light caramel orange", "almond beige"]
  },
  "render_quality": {
    "sharpness": "extreme micro-detail visibility",
    "texture_fidelity": "high realism",
    "noise": "none",
    "depth_of_field": "moderate, product fully in focus"
  },
  "style_tags": [
    "luxury dessert advertising",
    "hyper-realistic food photography",
    "commercial product render",
    "clean studio composition"
  ]
}
```

> 改编自 [@iamaiistudio](https://x.com/iamaiistudio/status/2067465624683700642) 发布、[EvoLinkAI/awesome-gpt-image-2-API-and-Prompts](https://github.com/EvoLinkAI/awesome-gpt-image-2-API-and-Prompts) 收录的提示词，仓库许可证 CC0 1.0；示例图同样来自该仓库收录的原帖出图。
