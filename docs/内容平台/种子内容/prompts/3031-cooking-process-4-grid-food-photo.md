---
title: "AI美食图提示词：做菜步骤四宫格写实摄影（从备料到装盘，松饼示例）（gpt-image-2）"
slug: cooking-process-4-grid-food-photo
model: gpt-image-2
topics: [food, photography]
aspectRatio: "1:1"
needsRefImage: false
useCase: "用一张 2×2 四宫格写实美食摄影展示一道菜从备料、下锅、翻面到装盘的完整过程，适合菜谱教程封面、小红书做饭笔记和美食账号配图。"
prompt: |
  生成一张超写实的美食摄影拼图，[2×2 四宫格]，展示制作[蓬松美式松饼]的完整过程。
  左上：[木质餐桌]上放着一个装满顺滑面糊的大号白瓷碗，周围整齐摆着食材：一小碗生鸡蛋、一杯面粉、一小碟黄油、一玻璃瓶牛奶、一小碗泡打粉、一个敲开的蛋壳和一个金属打蛋器。温暖的自然厨房光，质感真实，干净的俯拍构图。
  右上：灶台上一口黑色不粘平底锅的特写。一只戴米色隔热手套的手拿着汤勺，把浓稠的浅色面糊倒进热锅中央，可见热气和细小的黄油油星，背景是温暖的木质厨房。
  左下：同一口黑锅里煎着两块厚实蓬松的松饼，一块已经金黄、一块正被锅铲翻面，轻微热气，真实的气泡和焦脆边缘。
  右下：最终成品——几块厚厚的金黄松饼漂亮地叠在盘子里，露出松软的气孔层次和均匀上色的表面，诱人的特写，暖色调，质感真实、高光细腻。
  风格：照片级写实，高端美食摄影，温暖自然的厨房光，真实食材，适当浅景深，细节丰富；四格之间锅具和食材保持一致；干净的四宫格分割，不要文字、标签和水印。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/DuaFatimaAi/status/2097120308381819110
  author: "Dua Fatima"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文；版式、菜品、场景改为变量；删去\"匹配参考构图\"的说明，使其无需参考图也能使用"
images:
  - 3031-cooking-process-4-grid-food-photo-1.jpg
imageCredit:
  by: "Dua Fatima"
  url: https://youmind.com/gpt-image-2-prompts?id=33814
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：[蓬松美式松饼] 换成你的菜，然后把四格内容按"备料 → 下锅 → 烹饪中 → 成品"改写，例如"番茄炒蛋：打蛋与切番茄 → 蛋液下锅 → 番茄与炒蛋翻炒 → 装盘撒葱花"；[木质餐桌] 可以换成"大理石台面""中式老木桌"。[2×2 四宫格] 也可以改成"3×2 六宫格"讲更复杂的菜。

示例图与描述一致：左上一碗面糊和鸡蛋、面粉、黄油、牛奶等食材，右上汤勺把面糊倒进黑色平底锅，左下两块松饼在锅里一块金黄一块待翻，右下一叠厚厚的金黄松饼，四格色调统一。

**常见问题**：
- 四格里的锅和碗不一致：保留"锅具和食材保持一致"，并写明锅的颜色材质。
- 手的形状奇怪：把手部动作简化为"只露出握勺的手腕"。
- 步骤顺序错：每格开头写清"第一步 / 第二步……"。

**适合**：菜谱教程封面、小红书 / 下厨房做饭笔记、美食账号、烹饪课程素材。

### 英文原版

```text
Create an ultra-realistic food photography collage in a {argument name="layout" default="2×2 grid"}, showing the complete process of making {argument name="food item" default="fluffy American pancakes"}, matching the reference composition.\n\nTop-left: A {argument name="setting" default="wooden kitchen table"} with a large white ceramic bowl filled with smooth pancake batter, surrounded by neatly arranged ingredients: a small bowl containing one raw egg, a cup of white flour, a small dish with butter, a glass jar of milk, a small bowl of baking powder, a cracked eggshell, and a metal whisk. Warm natural kitchen lighting, realistic textures, clean overhead composition.\n\nTop-right: Close-up of a black non-stick frying pan on a stovetop. A hand wearing a beige oven glove holds a ladle and pours thick pale pancake batter into the center of the hot pan. Visible steam and tiny butter droplets around the pan. Warm wooden kitchen background, realistic cooking action.\n\nBottom-left: Two thick fluffy pancakes cooking in the same black skillet. One pancake is golden brown and partially cooked, while the other is being flipped with a spatula. Subtle steam rising from the pan, realistic bubbles and crispy edges, warm natural lighting.\n\nBottom-right: Final serving of several thick, fluffy, golden-brown American pancakes stacked beautifully on a plate, showing soft airy layers and perfectly browned surfaces. Appetizing close-up food photography, warm tones, realistic texture and subtle highlights.\n\nStyle: photorealistic, premium food photography, natural warm kitchen lighting, realistic ingredients, shallow depth of field where appropriate, detailed textures, authentic cooking atmosphere, clean 2×2 split composition, consistent cookware and ingredients across all panels, high detail, 8K, no text, no labels, no watermark.
```

> 改编自 [Dua Fatima](https://x.com/DuaFatimaAi/status/2097120308381819110) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
