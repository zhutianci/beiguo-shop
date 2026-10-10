---
title: 信息图提示词：一周健康备餐海报，主图便当盒 + 每日营养数值 + 周一到周五菜单卡
slug: meal-prep-weekly-poster
model: gpt-image-2
topics: [food, infographic]
needsRefImage: false
aspectRatio: "1:1"
useCase: 做健身餐 / 轻食店的周菜单海报、减脂打卡账号封面、营养师科普图时，填入一个饮食计划，生成一张干净的备餐海报：大标题、主图餐盒、每日营养面板和五天餐盒卡片一应俱全。
prompt: |
  为"[高蛋白地中海一周]"设计一张极简风的健康备餐海报。
  - 左上：品牌小标语"[滋养·能量·活力]"、大号标题（粗体无衬线字 + 一个手写体单词搭配），下方一行"均衡饮食，真材实料"和四个线性小图标（[瘦蛋白、全食物、优质脂肪、营养丰富]）；
  - 中部：一个"每日营养"面板，写每天大约的蛋白质、碳水、脂肪克数；
  - 右上：一个干净的玻璃备餐盒主图，装着烤鸡胸切片、杂粮饭、烤蔬菜和一小杯酸奶酱，配色丰富均衡；
  - 下半部分：周一到周五共 5 张卡片，每张有一份餐盒照片、菜名、配菜说明和热量 / 宏量营养素小格；
  - 底部一排小贴士图标（周日备餐、密封保存、冷藏 4 天）；
  - 柔和的[浅米色和橄榄绿]背景，明亮自然光，阴影清晰，健康生活品牌风格的字体，现代社交媒体设计感。
  画幅 1:1。
negativePrompt: null
source:
  repo: jau123/nanobanana-trending-prompts
  url: https://x.com/Dheepanratnam/status/2048076798798217594
  author: "@Dheepanratnam"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: 原文只有一句关键词，本站译成中文后按示例图补充了标题区、营养面板、主图餐盒、五天菜单卡和底部贴士；计划名、标语、图标、配色设为变量；去掉原文中的社交平台名
images:
  - 3313-meal-prep-weekly-poster-1.jpg
imageCredit:
  by: "@Dheepanratnam"
  url: https://images.meigen.ai/tweets/2048076798798217594/0.jpg
  license: CC BY 4.0
verify:
  - 海报上的热量和营养素数值由模型生成，正式使用前必须换成真实计算结果
  - 示例图是英文版，换成中文菜名测一次，看五张卡片的小字是否清晰
  - 确认原帖仍可访问、作者未另行声明保留权利
---
**怎么填变量**：[高蛋白地中海一周] 换成你的饮食计划，比如"减脂低碳一周""增肌高蛋白一周""中式轻食一周"；[滋养·能量·活力] 是顶部小标语，可写店名或口号；[瘦蛋白、全食物、优质脂肪、营养丰富] 是四个卖点图标，中式轻食可写"少油、少盐、高纤、足量蛋白"。[浅米色和橄榄绿] 按品牌色换。示例图是英文版：左上深绿色粗体大标题加一个手写体单词，下面四个绿色圆形图标和一个写着每日营养克数的面板；右上一个玻璃餐盒装着鸡胸肉切片、杂粮饭、烤彩椒、鹰嘴豆沙拉和一杯白色酱料；下方五张卡片从周一到周五，每张都有餐盒照片、菜名和四格营养数字。

**常见问题与调整**：
- 五张卡片里的菜长得差不多：逐天写出菜名，如"周一 柠檬鸡胸饭、周二 牛肉藜麦碗……"。
- 数字乱码：只保留热量一项，其他营养数据后期排版加入。
- 想做竖版发小红书：画幅改 3:4，五天卡片改为两列排布。
- 换成中式便当：主图改成"分格不锈钢便当盒，装着清炒西兰花、卤鸡腿和糙米饭"。

**适合**：轻食店周菜单、健身减脂打卡、营养科普封面；营养数据需人工核实后再发布，实物要与图片一致。

### 英文原版

```
Clean & appetizing meal prep layouts

Design a minimalist healthy meal prep poster for [MEAL PLAN], with clean containers, colorful balanced ingredients, calorie/macros panel, weekly layout, soft pastel background, bright natural light, wellness brand typography, crisp shadows, modern Instagram design.
```

> 改编自 [@Dheepanratnam](https://x.com/Dheepanratnam/status/2048076798798217594) 发布、[jau123/nanobanana-trending-prompts](https://github.com/jau123/nanobanana-trending-prompts) 收录的提示词，仓库许可证 CC BY 4.0。
