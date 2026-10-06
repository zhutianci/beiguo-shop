---
title: 旅行手帐提示词（nano banana）：儿童手绘风城市旅行路线手帐（景点路线 + 美食 + 贴纸短句）
slug: kids-crayon-travel-journal
model: nano-banana
topics: [illustration, poster, infographic]
needsRefImage: false
aspectRatio: "9:16"
useCase: 出发前做行程攻略图、旅行回来发小红书 / 朋友圈、给孩子做旅行纪念时，输入城市和天数，生成一张竖版儿童蜡笔风旅行手帐：弯弯曲曲的路线串起每天的景点，四周是地标、美食和可爱贴纸。
prompt: |
  请画一张色彩明快、充满童趣的蜡笔风竖版（9:16）插画，标题是"我的[北京][7]日游旅行手帐"。
  画面要像一个好奇的小朋友用彩色蜡笔画出来的：浅暖色底（如淡黄色），搭配明亮的红、蓝、绿等颜色，温暖又好玩。

  一、主画面：手帐式路线图
  画面中间是一条弯弯曲曲、来回折返的旅行路线，用箭头和虚线把各站连起来，按天数自动安排推荐景点：
  - "第 1 站：景点 + 一句好玩的描述"
  - "第 2 站：……"
  - ……
  - "最终站：当地招牌美食或纪念品 + 一句温暖的结束语"
  没给天数时，默认安排一日精华游。

  二、四周的趣味元素（按城市自动调整）
  1. 可爱的旅行小人：拿着当地小吃的小朋友、背着背包的小探险家；
  2. Q 版手绘地标 3 个左右；
  3. 搞笑指示牌，如"小心迷路！""注意人流！""好吃的往这边走！"；
  4. 贴纸风短句，如"[北京]旅行记忆已解锁！""[北京]美食大冒险！""下一站去哪儿？"；
  5. 3 个当地美食的可爱小图标；
  6. 小朋友式的感叹："原来[北京]这么好玩！""我要再来一次！"

  三、整体风格
  蜡笔 / 儿童手绘旅行日记风，明亮温暖的配色，画面饱满热闹；所有文字使用可爱的手写字体，文字全部为简体中文。
negativePrompt: null
source:
  repo: ZeroLu/awesome-nanobanana-pro
  url: https://x.com/dotey/status/1994908289813880915
  author: "@dotey"
  license: MIT
  licenseUrl: https://raw.githubusercontent.com/ZeroLu/awesome-nanobanana-pro/main/LICENSE
  changes: 将仓库收录的英文版改写为中文，城市名、天数设为变量；精简示例结构里的花括号占位符，改为直接让模型按城市自动填写；补充"文字全部为简体中文"
images:
  - 525-kids-crayon-travel-journal-1.jpg
imageCredit:
  by: "@dotey"
  url: https://x.com/dotey/status/1994908289813880915
  license: MIT
verify:
  - 实测换成"成都 3 日""西安 2 日"等城市，检查景点是否真实存在、顺序是否合理（模型可能编造或排错路线）
  - 中文小字错字率
  - 确认原帖仍可访问、作者未另行声明保留权利（原帖可能是中文提示词，仓库收录的是英文版）
---
**怎么用**：把三处 [北京] 换成同一个城市，[7] 换成天数（1–7 天效果最好，天数太多会挤）。示例图就是"北京 7 日游"：从故宫、长城、颐和园一路画到鸟巢、天坛、动物园，最后一站是烤鸭和兔儿爷，四周还有冰糖葫芦小朋友和"注意人流！"指示牌（示例图实际偏彩铅质感，比"蜡笔"更细腻）。

**想按自己的行程画**：在"一、主画面"下面直接列出你的真实安排，例如"第 1 站：宽窄巷子；第 2 站：大熊猫基地……"，模型会照着画，不会自己乱编。

**常见问题**：
- 景点顺序不合理或出现不存在的地方：一定要自己列出行程，或生成后逐条核对。
- 字太小看不清：减少站数，或追问"文字再大一些，每站描述不超过 10 个字"。
- 想要更像蜡笔：加"粗糙的蜡笔笔触、涂出边线、纸张颗粒感明显"。

**适合**：旅行攻略封面、小红书游记首图、亲子旅行纪念、旅行社 / 文旅账号的路线图。

### 英文原版

```
Please create a vibrant, child-like crayon-style vertical (9:16) illustration titled "{City Name} Travel Journal."
The artwork should look as if it were drawn by a curious child using colorful crayons, featuring a soft, warm light-toned background (such as pale yellow), combined with bright reds, blues, greens, and other cheerful colors to create a cozy, playful travel atmosphere.

I. Main Scene: Travel-Journal Style Route Map

In the center of the illustration, draw a "winding, zigzagging travel route" with arrows and dotted lines connecting multiple locations.
The route should automatically generate recommended attractions based on {Number of Days}:

Example structure (auto-filled with {City Name}-related content):

- "Stop 1: {Attraction 1 + short fun description}"
- "Stop 2: {Attraction 2 + short fun description}"
- "Stop 3: {Attraction 3 + short fun description}"
- …
- "Final Stop: {Local signature food or souvenir + warm closing remark}"

Rules:
- If no number of days is provided, default to a 1-day highlight itinerary.

II. Surrounding Playful Elements (Auto-adapt to the City)

Add many cute doodles and child-like decorative elements around the route, such as:

1. Adorable travel characters
   - A child holding a local snack
   - A little adventurer with a backpack

2. Q-style hand-drawn iconic landmarks
   - "{City Landmark 1}"
   - "{City Landmark 2}"
   - "{City Landmark 3}"

3. Funny signboards
   - "Don't get lost!"
   - "Crowds ahead!"
   - "Yummy food this way!"
   (Auto-adjust contextually for the city)

4. Sticker-style short phrases
   - "{City Name} travel memories unlocked!"
   - "{City Name} food adventure!"
   - "Where to next?"

5. Cute icons of local foods
   - "{Local Food 1}"
   - "{Local Food 2}"
   - "{Local Food 3}"

6. Childlike exclamations
   - "I didn't know {City Name} was so fun!"
   - "I want to come again!"

III. Overall Art Style Requirements

- Crayon / children's hand-drawn travel diary style
- Bright, warm, colorful palette
- Cozy but full and lively composition
- Emphasize the joy of exploring
- All text should be in a cute handwritten font
- Make the entire page feel like a young child's fun travel-journal entry
```

> 改编自 [@dotey](https://x.com/dotey/status/1994908289813880915) 发布、[ZeroLu/awesome-nanobanana-pro](https://github.com/ZeroLu/awesome-nanobanana-pro) 收录的提示词，仓库许可证 MIT（Copyright (c) 2025 ZeroLu）。
