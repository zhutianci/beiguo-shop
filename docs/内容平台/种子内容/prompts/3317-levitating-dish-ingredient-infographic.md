---
title: 信息图提示词：地方小吃食材悬浮图，碗在下、豆腐辣椒蒜和酱汁飞在空中并标注名称
slug: levitating-dish-ingredient-infographic
model: nano-banana
topics: [food, infographic]
needsRefImage: false
aspectRatio: "9:16"
useCase: 做地方美食科普、小吃店菜品介绍、美食短视频封面时，指定一道菜，生成一张竖版超写实信息图：碗稳稳在底部，主要食材和酱汁向上悬浮定格，白色细线标出每种食材的名字。
prompt: |
  一张超写实的美食信息图，主题是[某地风味小吃]"[菜名]"。
  - 构图：干净的竖向构图，一只传统的[陶碗]盛着热气腾腾的菜肴，稳稳放在画面底部；
  - 悬浮食材：主要食材从碗上方垂直升起、定格在空中，如[炸豆腐块、青辣椒、蒜瓣、红葱头]，还有飞溅的光亮酱汁；
  - 顶部是菜名大标题，下方一行小字写出产地；
  - 文字标注：每种食材旁用细白色引线指向，写上清晰的[中文]名称，排版像专业美食杂志的信息图；
  - 背景：质朴的木桌面，背景虚化；
  - 光线与氛围：电影感棚拍光，暖色调，蒸汽升腾，食材被瞬间定格；
  - 技术质感：浅景深、焦点清晰、单反相机质感，纹理细节丰富。
  竖版 9:16。
negativePrompt: null
source:
  repo: jau123/nanobanana-trending-prompts
  url: https://x.com/Taaruk_/status/2017865644365255078
  author: "@Taaruk_"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: 原文为 JSON 结构，本站改写成自然的中文分点描述；菜系、菜名、容器、悬浮食材、标注语言设为变量；按示例图补充了菜名标题和产地小字；删去 8K 参数
images:
  - 3317-levitating-dish-ingredient-infographic-1.jpg
imageCredit:
  by: "@Taaruk_"
  url: https://images.meigen.ai/tweets/2017865644365255078/0.jpg
  license: CC BY 4.0
verify:
  - 示例图标注是印尼语，换成中文标注测一次，看引线是否对准食材
  - 示例图右下角有生成工具的星形水印，展示前确认是否需要裁切
  - 确认原帖仍可访问、作者未另行声明保留权利
---
**怎么填变量**：[某地风味小吃] 和 [菜名] 一起填，比如"长沙风味 / 臭豆腐""重庆风味 / 酸辣粉""云南风味 / 过桥米线"；[陶碗] 按菜换成"粗瓷大碗""竹编小篓""铁板"。[炸豆腐块、青辣椒、蒜瓣、红葱头] 换成这道菜真实的 4～6 种配料，酸辣粉就写"红薯粉、花生、榨菜、香菜、辣油"。[中文] 可以改成"中英双语"。示例图是一道印尼的炸豆腐小吃：顶部深棕色大标题和一行产地小字，木桌上一只陶碗盛满泡在酱汁里的炸豆腐，上方悬浮着几块炸豆腐、青辣椒、紫皮小葱头、蒜瓣和几道飞溅的深色酱汁，两侧用白色细线标出六个印尼语名称。

**常见问题与调整**：
- 食材飞得太散：加"悬浮食材集中在碗正上方的竖向区域内"。
- 标注指错：把标注数量和食材数量写成一致，并要求"一种食材一个标签"。
- 汤汁不自然：把"飞溅的酱汁"改成"几滴酱汁从豆腐上滴落"，更克制。
- 想做横版菜单图：画幅改 16:9，碗放在左侧，食材向右上方飞出。

**适合**：地方美食科普、小吃店菜品介绍、美食短视频封面；用于菜品宣传时，实物配料要与图片一致。

### 英文原版

```
{
  "image_prompt": {
    "type": "Hyper-realistic food infographic",
    "subject": {
      "cuisine": "Indonesian",
      "base_element": "Traditional bowl with steaming hot dish at the bottom",
      "levitating_ingredients": [
        "Juicy meat",
        "Crispy tofu",
        "Glossy sauce splashes",
        "Fresh herbs",
        "Chilies",
        "Lime",
        "Garlic",
        "Fried shallots"
      ]
    },
    "composition": {
      "layout": "Clean vertical composition",
      "arrangement": "Realistic gravity-defying/floating elements",
      "background": "Rustic wooden surface",
      "visual_hierarchy": "Bowl anchored at bottom, ingredients rising vertically"
    },
    "graphic_design_elements": {
      "labels": "Clear Indonesian text",
      "lines": "Thin white pointing lines",
      "style": "Editorial infographic layout, professional food magazine style"
    },
    "lighting_and_mood": {
      "lighting": "Cinematic studio lighting",
      "color_palette": "Warm tones",
      "effects": "Dramatic steam, motion-frozen ingredients"
    },
    "technical_specs": {
      "camera_settings": "Shallow depth of field, sharp focus, DSLR look",
      "details": "Ultra-detailed textures",
      "resolution": "8K ultra-realistic"
    }
  }
}
```

> 改编自 [@Taaruk_](https://x.com/Taaruk_/status/2017865644365255078) 发布、[jau123/nanobanana-trending-prompts](https://github.com/jau123/nanobanana-trending-prompts) 收录的提示词，仓库许可证 CC BY 4.0。
