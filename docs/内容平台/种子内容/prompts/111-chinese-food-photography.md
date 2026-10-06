---
title: 美食摄影提示词：川菜 / 中餐高级感菜品图（外卖主图、菜单配图）
slug: chinese-food-photography
model: gpt-image-2
topics: [ecommerce, photography]
aspectRatio: "1:1"
needsRefImage: false
useCase: 给餐馆、外卖店、美食号生成热气腾腾、有餐厅大片感的菜品图，用作外卖主图、菜单或探店封面。
prompt: |
  生成一张 [1:1] 的高端美食摄影：一份刚出锅、冒着热气的[辣子鸡]，盛在[黑色石锅]里，放在木质托板上。
  菜品要显得滚烫、油亮、香辣、新鲜：[煎得焦香的鸡块]、[干辣椒段]、[青葱段]、[蒜片和花椒]裹着深红色的油亮酱汁。
  机位：略高于桌面的近景，浅景深；菜品居中、细节丰富，是绝对主角。
  加入自然升腾的热气。周围点缀低调的餐厅道具：[深红色托盘]、[散落的干辣椒和花椒]、[一小碟蘸料]、[背景里虚化的茶壶]。
  光线：温暖、略暗的杂志级布光，像高级餐厅的美食大片。
  质感真实、让人有食欲，电影感、精致。
  不要：文字、Logo、手、人物、挡住食物的餐具、卡通风、塑料感、过度对称、过于干净的图库照片感。
negativePrompt: null
source:
  repo: EvoLinkAI/awesome-gpt-image-2-API-and-Prompts
  url: https://x.com/PrometheanAIX/status/2049122713722106161
  author: "@PrometheanAIX"
  license: CC0 1.0
  licenseUrl: https://creativecommons.org/publicdomain/zero/1.0/
  changes: 英文模板译为中文；把原文写死的"川味爆炒菜"拆成菜名、器皿、食材、道具四个变量；保留负面约束
images:
  - 111-chinese-food-photography-1.jpg
imageCredit:
  by: "@PrometheanAIX"
  url: https://x.com/PrometheanAIX/status/2049122713722106161
  license: CC0 1.0
verify:
  - 在 gpt-image-2 上实测 3 次，记录成功率与最常见的失败形式
  - 换成"清蒸鱼""红烧肉"等其他中餐是否同样好看
  - 热气是否自然、有无假的烟雾感
  - 确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）
---
**怎么填变量**：[辣子鸡] 换成你的菜名，同时把"食材"那一格改成这道菜真实的配料，配料写得越准，越不会"货不对板"；[黑色石锅] 可换成白瓷盘、砂锅、竹蒸笼。清淡的菜把"香辣、深红色酱汁"删掉，改成"清亮的汤汁"。

**常见问题**：
- 看起来像塑料模型：保留"不要塑料感"，并加"表面有自然的油光和焦边"。
- 背景道具抢戏：减少道具数量，只留 1–2 样。
- 用在外卖平台：平台对主图有尺寸和文字要求，生成后按平台规则再裁切；AI 图仅作示意时，建议标注"图片仅供参考"。

**迭代**：满意后追问"同一道菜，换成俯拍角度"，可以一次凑齐菜单需要的多机位。

### 英文原版

```text
Create a square [ASPECT RATIO] premium food photography image of a steaming [FOOD] served in a dark black stone bowl or cast-iron skillet on a wooden board. The dish should look hot, glossy, spicy, and freshly served, with bite-sized pieces of browned protein, dried red chilies, green scallions, white onion, garlic, chili flakes, and visible Sichuan peppercorns coated in a deep red, oily Szechuan sauce. Use a slightly elevated close-up camera angle with shallow depth of field. Make the food the clear hero of the image, centered and richly detailed. Add visible steam rising naturally from the dish. Surround the bowl with subtle restaurant-style props like a dark red tray, scattered dried chilies, peppercorns, a small sauce bowl, or a blurred teapot in the background. Lighting should feel warm, moody, and editorial, like a high-end restaurant food shoot. Emphasize realistic textures and keep the image appetizing, realistic, cinematic, and polished. Avoid text, logos, hands, people, utensils covering the food, cartoon styling, fake plastic textures, excessive symmetry, or an overly clean stock-photo look.
```

> 改编自 [@PrometheanAIX](https://x.com/PrometheanAIX/status/2049122713722106161) 发布、[EvoLinkAI/awesome-gpt-image-2-API-and-Prompts](https://github.com/EvoLinkAI/awesome-gpt-image-2-API-and-Prompts) 收录的提示词，仓库许可证 CC0 1.0；示例图同样来自该仓库收录的原帖出图。
