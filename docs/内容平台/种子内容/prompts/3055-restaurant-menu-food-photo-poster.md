---
title: "AI菜单设计提示词：电影感美食大片 + 菜名与一句文案（中餐 / 韩餐通用）（gpt-image-2）"
slug: restaurant-menu-food-photo-poster
model: gpt-image-2
topics: [food]
aspectRatio: "3:4"
needsRefImage: false
useCase: "输入菜名（可附上菜品照片），生成一张高级餐厅风的竖版菜品海报：木桌、窗光、热气、双细线边框，左上菜名和一句情绪文案，左下一行菜品介绍，适合餐厅菜单、外卖主图和门店海报。"
prompt: |
  生成一张写实、高级的电影感美食摄影图，菜品是"[菜名]"，3:4 竖版。
  如果我提供了菜品参考照片，就严格按照片的食材、形状、摆盘、颜色、质感和构图来做；否则按菜名生成一份写实版本。
  菜品优雅地摆在粗犷的木桌上，配合适的道具。柔和的自然窗光从右上方照来，温暖的高光、冷柔的阴影，浅景深，轻微胶片颗粒，真实质感，升腾的热气；50mm 镜头，略带俯视的平视角度，遵循三分法构图。
  左上角用纤细优雅的[中文]宋体写菜名，下面一行简短的情绪化[中文]文案；左下角一句简洁的[中文]菜品介绍。所有文字颜色低调。
  画面四周加一圈细细的双线矩形边框，完全对齐、不断开。
  除此之外不要任何其他文字、Logo、价格或水印。整体奢华、温暖、自然、有杂志感，像高端美食广告。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/SimplyAnnisa/status/2081766364558340548
  author: "Anissa"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文；菜名与文字语言改为变量（默认改为中文）；原文指定的韩文字体改为中文宋体"
images:
  - 3055-restaurant-menu-food-photo-poster-1.jpg
  - 3055-restaurant-menu-food-photo-poster-2.jpg
imageCredit:
  by: "Anissa"
  url: https://youmind.com/gpt-image-2-prompts?id=29986
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：[菜名] 写你的菜，如"酸菜鱼""红烧肉""砂锅豆腐汤"，最好上传一张自己店里的实拍照，这样出图的菜品更接近真实，避免"货不对板"；[中文] 可以改成"英文""日文""韩文"做外语菜单。

示例图两张：猪肉泡菜炖锅（深色木桌、黑色陶锅里红亮的泡菜和五花肉、旁边米饭和小菜，左上纤细的韩文菜名和一行文案）、嫩豆腐汤（石锅里红汤豆腐配一颗生蛋黄），都有暗角的窗光、热气和一圈细双线边框（原提示词默认韩文，本站已改为中文）。

**常见问题**：
- 菜品和实物不符：外卖平台对"图片与实物不符"有规范，正式上架请尽量用实拍照作参考。
- 边框断开或歪：强调"双线边框完全对齐、四角闭合"。
- 文字太显眼：保留"所有文字颜色低调、字号小"。

**适合**：餐厅菜单、外卖平台主图、门店海报、美食账号封面。

### 英文原版

```text
Create a realistic, premium cinematic food photography image of {argument name="menu name" default="[Menu Name]"} in a vertical 3:4 aspect ratio. If a reference food photo is provided, match its ingredients, shape, plating, colours, textures, and composition exactly; otherwise, create a realistic version based on the menu name. Plate the dish elegantly on a rustic wooden table with suitable props. Use soft natural window light coming from the upper-right, warm highlights, cool soft shadows, shallow depth of field, subtle film grain, realistic textures, rising steam, and a 50mm lens perspective with a slightly top-down eye-level angle. Follow the rule of thirds. Display the menu name in {argument name="language" default="Korean"} at the upper-left in a thin, elegant Gungsuh-style font, with a short emotional {argument name="language" default="Korean"} tagline below it and a concise {argument name="language" default="Korean"} description of the dish in the lower-left. Use subtle colours for all text. Add a thin double rectangular border around the image, perfectly aligned and unbroken. Do not include any other text, logos, prices, or watermarks. The overall style should feel luxurious, warm, natural, and editorial, like a high-end gourmet food advertisement.
```

> 改编自 [Anissa](https://x.com/SimplyAnnisa/status/2081766364558340548) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
