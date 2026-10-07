---
title: "AI菜单设计提示词：按品牌设定生成整版餐厅价目菜单（烧烤 / 炸鸡示例）（gpt-image-2）"
slug: restaurant-menu-board-design
model: gpt-image-2
topics: [food, poster]
aspectRatio: "16:9"
needsRefImage: false
useCase: "填写品牌名、品类、主打菜、风格、人群和门店位置，生成一张 16:9 的整版餐厅菜单：分类清楚、价格醒目、主推菜突出、有烟火气，适合烧烤、炸鸡、小吃店的菜单墙和外卖菜单。"
prompt: |
  品牌名：[巷口炭火局]
  餐饮品类：[烧烤 / 夜宵 / 小酒馆]
  主打产品：[炭烤牛肉串、招牌烤鸡翅、冰镇酸梅汤]
  品牌风格：[市井烟火气、复古红黑]，食欲感强
  目标人群：年轻上班族、朋友聚会、夜宵人群、学生
  门店位置：夜市 / 社区街道 / 商圈背街
  画幅：16:9
  补充要求：生成一张烧烤菜单设计。分类包括招牌烤串、肉类、素菜、主食、小吃和饮品；价格要醒目，主推菜要突出；画面要有炭火烟气和夜宵氛围，但版面不能乱。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/liyue_ai/status/2064641773994193126
  author: "李岳"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "原文是两组品牌设定连在一起的英文写法，本站整理为一份可填写的中文模板，默认值用第一组（烧烤）"
images:
  - 3089-restaurant-menu-board-design-1.jpg
  - 3089-restaurant-menu-board-design-2.jpg
imageCredit:
  by: "李岳"
  url: https://youmind.com/gpt-image-2-prompts?id=25039
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：把品牌名、品类、主打产品、风格换成你的店。作者的第二组设定是"首尔炸鸡研究社：韩式炸鸡 / 小吃 / 饮品；主打蜂蜜蒜香炸鸡、芝士年糕炸鸡；年轻潮流、韩国街头、明亮活泼"，生成的就是红黄配色的炸鸡外卖菜单。具体菜品和价格最好直接列出来（"牛肉串 18 元 / 串……"），否则模型会自己编。

示例图两张：巷口炭火局（红黑复古底，左侧"招牌推荐"三道主推菜大图，右侧六个分类框列出烤串、肉类、素菜、主食、小吃、饮品和价格，底部"凌晨的烟火气 最抚凡人心"）；首尔炸鸡研究社（红黄配色，招牌炸鸡、双拼套餐、小吃、饮品、蘸酱加购五个分区）。

**常见问题**：
- 价格是编的：正式使用一定换成真实价格。
- 菜名小字错乱：每个分类最多 5 道菜，菜名 6 字以内。
- 太乱：保留"版面不能乱"，并写"每个分类用独立的方框"。

**适合**：烧烤 / 炸鸡 / 小吃店菜单墙、外卖平台菜单图、开店筹备、门店灯箱。

### 原版提示词

```text
Brand Name: Alleyside Charcoal BBQ; Catering Category: BBQ / Night Snack / Bistro; Main Products: Charcoal Grilled Beef Skewers + Signature Grilled Chicken Wings + Iced Sour Plum Soup; Brand Style: Street Atmosphere, Lively with 'Wok Hei', Retro Red and Black, Strong Appetite Appeal; Target Audience: Young Office Workers, Friend Gatherings, Night Snack Crowd, Students; Store Location: Night Market / Community Street / Backstreet of Business District; Material Number: 4; Aspect Ratio: 16:9; Supplementary Requirements: Generate a BBQ menu design. Categories include signature skewers, meat, vegetables, staple food, snacks, and drinks. Prices should be prominent, and recommended dishes should be highlighted. The image should have charcoal smoke and a night-snack atmosphere, but the layout should not be messy; Brand Name: Seoul Fried Chicken Lab; Catering Category: Korean Fried Chicken / Snacks / Drinks; Main Products: Honey Garlic Fried Chicken + Cheese Rice Cake Fried Chicken; Brand Style: Young and Trendy, Korean Street, Bright and Vibrant, Strong Appetite Appeal; Target Audience: Students, Young Couples, Friend Gatherings, Delivery Users; Store Location: Near Schools / Business District Streets / High-frequency Delivery Areas; Material Number: 4; Aspect Ratio: 16:9; Supplementary Requirements: Generate a Korean fried chicken menu design. Categories include signature fried chicken, combo sets, snacks, drinks, and dipping sauce add-ons. Highlight the value of the sets and the efficiency for delivery ordering. The image should look crispy and juicy with a sense of young social interaction.
```

> 改编自 [李岳](https://x.com/liyue_ai/status/2064641773994193126) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
