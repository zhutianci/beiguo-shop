---
title: nano banana 菜谱信息图提示词：一张图讲清食材、步骤、热量（杂志排版风）
slug: recipe-infographic
model: nano-banana
topics: [infographic, poster]
needsRefImage: false
aspectRatio: "1:1"
useCase: 美食博主、餐饮店、健身餐账号想把一道菜做成"成品大图 + 食材清单 + 步骤流程 + 热量时间"的信息图，用于小红书、公众号或门店菜单。
prompt: |
  一张极简现代的菜谱信息图，主角是[番茄牛腩]。
  - 成品菜以诱人的完成状态（装盘 / 切开 / 分份）作为主视觉，略微悬浮，用透视或斜角展示，不局限于俯拍；
  - 食材区：每种食材配一个小图标或迷你插画并标注用量，以分组、列表或环形流向排布，并在视觉上与主菜相连；
  - 步骤区：用带编号的面板、箭头或连线展示制作步骤，围绕主菜形成合理的流程，需要时加入刀、锅、烤箱、计时器等小图标；
  - 附加信息：总热量、准备 / 烹饪时间、份数、辣度，以简洁的气泡或徽章放在菜品附近；
  - 视觉风格：杂志信息图 + 生活方式美食摄影，食物色彩鲜活自然，细腻投影、干净的矢量图标、现代字体，步骤面板用柔和渐变或玻璃拟态；
  - 层级清晰：菜品 > 步骤 > 食材 > 数据，留白充足；
  - 柔和自然的棚拍光，背景为极简纹理或渐变；
  - 文字使用[简体中文]，1:1，无水印。
negativePrompt: null
source:
  repo: jau123/nanobanana-trending-prompts
  url: https://x.com/Strength04_X/status/2013186574390046844
  author: "@Strength04_X"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: 译成中文并整理为分项清单；把原文固定的菜品（印度香饭）改为变量；新增文字语言变量
images:
  - 188-recipe-infographic-1.jpg
imageCredit:
  by: "@Strength04_X"
  url: https://x.com/Strength04_X/status/2013186574390046844
  license: CC BY 4.0
verify:
  - 用一道中式家常菜实测，检查步骤是否合理、中文是否有错字
  - 确认原帖仍可访问、作者未另行声明保留权利
---
**怎么用**：把 [番茄牛腩] 换成任意菜名。示例图是原作者的"印度香饭（Biryani）"。如果你有自己的配方，**一定要把食材用量和步骤直接写进提示词**（例如"牛腩 500 克、番茄 3 个……步骤：1. 焯水 2. 炒番茄……"），否则模型会按通用做法自己编。

**常见问题**：
- 热量数字不可靠：模型给出的热量只是估算，健康类账号发布前请用营养计算工具核对。
- 中文字太多导致错字：步骤控制在 4～6 步，每步不超过 10 个字。
- 想做系列：固定配色和版式，追问"用完全相同的版式再做一道[凉拌黄瓜]"。

**适合**：美食内容、门店菜单海报、健身餐打卡、烹饪课程讲义。

### 英文原版

```
Ultra-clean modern recipe infographic. Showcase briyani in a visually appealing finished form—sliced, plated, or portioned—floating slightly in perspective or angled view. Arrange ingredients, steps, and tips around the dish in a dynamic editorial layout, not restricted to top-down. Ingredients Section: Include icons or mini illustrations for each ingredient with quantities. Arrange them in clusters, lists, or circular flows connected visually to the dish. Steps Section: Show preparation steps with numbered panels, arrows, or lines, forming a logical flow around the main dish. Include small cooking icons (knife, pan, oven, timer) where helpful. Additional Info (optional): Total calories, prep/cook time, servings, spice level—displayed as clean bubbles or badges near the dish. Visual Style: Editorial infographic meets lifestyle food photography. Vibrant, natural food colors, subtle drop shadows, clean vector icons, modern typography, soft gradients or glassmorphism for step panels. Accent colors can highlight key info (calories, prep time). Composition Guidelines: Finished meal as hero visual (perspective or angled) Ingredients and steps flow dynamically around the dish Clear visual hierarchy: dish > steps > ingredients > optional stats Enough negative space to keep design airy and readable Lighting & Background: Soft, natural studio lighting, minimal textured or gradient background for premium editorial feel. Output: 1080×1080, ultra-crisp, social-feed optimized, no watermark.
```

> 改编自 [@Strength04_X](https://x.com/Strength04_X/status/2013186574390046844) 发布、[jau123/nanobanana-trending-prompts](https://github.com/jau123/nanobanana-trending-prompts) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)。
