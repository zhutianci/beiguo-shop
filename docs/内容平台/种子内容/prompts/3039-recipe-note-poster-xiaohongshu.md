---
title: "AI菜谱海报提示词：小红书风做菜图文笔记（食材 + 步骤图 + 小贴士）（gpt-image-2）"
slug: recipe-note-poster-xiaohongshu
model: gpt-image-2
topics: [food, poster]
aspectRatio: "3:4"
needsRefImage: false
useCase: "输入菜名，生成一张美食博主风格的竖版菜谱笔记：大字菜名、成品特写、食材卡片、带步骤小图的制作流程和手绘小贴士，适合小红书做饭笔记和美食账号封面。"
prompt: |
  生成一张高颜值的美食菜谱图文笔记海报，主题是"[红烧鸡翅]"。
  整体风格：清新治愈的美食信息图，融合社交平台爆款菜谱排版、日系手账感、轻手绘 UI 元素和美食杂志风。暖奶油色背景（米白 / 浅奶咖），色彩明亮不刺眼，食物颜色鲜活诱人，版面干净整齐，适合手机竖屏阅读。
  版面结构：
  1. 顶部标题区：超大字号菜名，配手绘小图标（辣椒、爱心、星星、热气等）和一句诱人的口号。
  2. 主视觉：成品超诱人的特写，食物是视觉中心，有明显的油亮光泽和热气，强调"刚出锅"的感觉，有美食摄影质感。
  3. 食材准备：卡片式排版，展示主要食材，每样配小图标或小照片并标注用量，排列整齐。
  4. 制作步骤：用 1、2、3……编号，每步配一张真实烹饪感的小步骤图和简短文字，用箭头串联，一眼看懂。
  5. 小贴士：手绘便签风、虚线边框、小灯泡图标。
  6. 底部氛围文案：一句俏皮的结尾语。
  视觉细节：丰富的手绘点缀、可爱箭头、涂鸦线条、圆角卡片、轻微纸张纹理、柔和阴影，信息密度高但不杂乱。
  画质：高清、细节丰富，食物极其诱人。不要 AI 绘画感、低质量插画感或过度卡通，要像专业美食博主做的高质量图文笔记。全部使用简体中文。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/knowledgefxg/status/2059256888668348697
  author: "知识分享官"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "原文的中文说明整理为中文提示词；菜名改为变量；合并重复的画质要求"
images:
  - 3039-recipe-note-poster-xiaohongshu-1.jpg
  - 3039-recipe-note-poster-xiaohongshu-2.jpg
imageCredit:
  by: "知识分享官"
  url: https://youmind.com/gpt-image-2-prompts?id=22714
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：[红烧鸡翅] 换成任何家常菜，如"辣炒蛤蜊""番茄牛腩""可乐鸡翅"。模型会自己编用量和步骤；想要准确的菜谱，在菜名后面附上你的食材用量和步骤（每步一句话），它会照着排版。

示例图两张：红烧鸡翅（左上大字菜名、右上一大盘油亮的鸡翅、8 种食材小图配用量、6 步带照片的步骤、小贴士便签和底部"配米饭绝了"）；辣炒蛤蜊（同样版式，食材换成蛤蜊、小米辣、蒜末等）。

**常见问题**：
- 用量和步骤不合理：模型生成的菜谱可能不专业，发布前请按自己的做法修改。
- 步骤小图和文字对不上：步骤减到 4～5 步，每步写清楚画面（如"鸡翅冷水下锅焯水"）。
- 字太小：竖版 3:4 放 6 步已经较满，可以改成 2:3。

**适合**：小红书 / 下厨房做饭笔记、美食账号封面、外卖店菜品介绍、家庭菜谱收藏。

### 原版提示词

```text
Generate a high-aesthetic gourmet recipe graphic note poster, with the theme "{argument name="dish name" default="[Dish Name]"}". [Overall Style] Fresh and healing gourmet infographic style, integrating: popular social media recipe layout, Japanese notebook feel, light hand-painted UI elements, and food magazine style. Overall visual: Warm cream background (off-white / light milk coffee), bright but not dazzling colors, vivid and tempting food colors, clean and tidy layout, suitable for vertical mobile reading. [Core Visual Structure] 1. Top Title Area - oversized font for dish name - paired with hand-drawn small icons (chili / heart / star / steam etc.) - add an appetizing slogan. 2. Main Visual Food Image - a super tempting close-up of the finished product - food is the visual center - obvious glossiness and heat - emphasize the "just out of the pot" feeling - lens has food photography quality. 3. Ingredient Preparation Module - uses card layout - shows main ingredients - each ingredient with small icon/photo - labeled quantities - neat and clear layout. 4. Preparation Steps Module - uses step numbering (1, 2, 3...) - each step includes: small step photo, short text description - arrows connecting the process - easy to understand at a glance - photos have a real cooking feel. 5. Tips Module - uses: hand-drawn note style, dashed borders, small light bulb icons. 6. Bottom Atmosphere Copy. [Visual Details] Abundant hand-drawn element embellishments, cute arrows, graffiti lines, rounded corner cards, slight paper texture, soft shadows, high information density but not cluttered. [Image Quality Requirements] High definition, high detail, extremely tempting food, suitable for social media covers, suitable for graphic notes, 4K food photography quality. [Emphasis] No AI painting feel, no low-quality illustration feel, no over-cartoonishness; should look more like: "High-quality graphic notes produced by a professional food blogger."
```

> 改编自 [知识分享官](https://x.com/knowledgefxg/status/2059256888668348697) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
