---
title: "AI菜单设计提示词：日式定食午餐菜单海报（5 款套餐 + 营业时间）（gpt-image-2）"
slug: set-meal-lunch-menu-poster
model: gpt-image-2
topics: [food, poster]
aspectRatio: "4:5"
needsRefImage: false
useCase: "生成一张温暖复古的竖版午餐菜单海报：毛笔大字标题、5 行套餐（左边图标和菜名、右边实拍菜品图）、套餐说明、营业时间和午市时间，适合定食店、简餐店、食堂的菜单和门口海报。"
prompt: |
  生成一张竖版的日式简餐店午餐菜单海报，温暖、略带复古，配诱人的美食照片和大号毛笔字。
  画布：约 4:5 竖版，羊皮纸米色背景带细纸纹，细金色边框，红金装饰点缀，四角有叶片花纹，最左侧一条喜庆的和风纹样竖条。
  标题：顶部大号书法标题"[午市套餐]"，前半黑色、后半深红，下面一笔粗犷的金色笔刷下划线；右上角一枚红色圆形印章，白字"[用心做的好味道]"，旁边几朵淡粉小花。
  主体：恰好 5 行横向菜单，行与行之间用细米色线分隔。每行左边一个圆形图标，中左是黑色毛笔字菜名，右半边是写实的菜品照片，温暖的餐桌光和木桌面。
  5 道菜：
  1. 红色梅花图标，"[汉堡排定食]"，照片：淋着多蜜酱的汉堡排配米饭、味噌汤、西兰花和胡萝卜；
  2. 金色饺子图标，"[大煎饺定食]"，照片：一排煎饺配米饭、蘸汁、汤和小菜；
  3. 绿色鸡形图标，"[炸鸡块定食]"，照片：炸鸡块配卷心菜丝、柠檬角、米饭、汤和黄瓜小菜；
  4. 紫色猪形图标，"[姜烧猪肉定食]"，照片：姜汁烧猪肉配洋葱、卷心菜丝、番茄、米饭、味噌汤和小菜；
  5. 蓝色饭碗图标，"[什锦烩饭]"，照片：虾仁、鹌鹑蛋、蔬菜、木耳和浓稠芡汁盖饭，配一小碗汤。
  说明条：5 行下面居中一个米色边框的说明框"※ 套餐均配米饭和汤"，两侧小金叶装饰。
  底部信息区：奶油色面板分成两块，左边棕色时钟图标和"营业时间"，下面写"[9:00～16:30]"；右边红色刀叉图标和"午市时间"，下面写"[12:00～14:00]"，中间细竖线分隔。
  页脚：深红色横条，带细金色笔刷装饰和小闪光，居中白字"[在舒适的空间里，期待您的光临]"。
  风格：精致的日式印刷传单，居酒屋 / 家庭餐厅美感，暖红、棕、奶油和金色，高清美食摄影与装饰矢量元素结合，网格对齐整齐。所有文字清晰可读，不要额外菜品或文字。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/study_unnatural/status/2089741120204886224
  author: "不自然対数"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文；标题、菜品、营业时间、页脚文案改为变量（默认改为中文）；删去原文\"让唐扬鸡看起来像 AI 生成\"的玩笑要求"
images:
  - 3088-set-meal-lunch-menu-poster-1.jpg
imageCredit:
  by: "不自然対数"
  url: https://youmind.com/gpt-image-2-prompts?id=31965
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：标题、5 道菜名、营业时间和页脚都换成你的店，例如"[今日特惠]""[红烧牛肉面]"等，菜品照片描述也要同步改；不需要 5 道就减到 3～4 行，版面更宽松。想保留日文风味，标题可以写成日文"ランチメニュー"。

示例图是原版日文菜单：顶部黑红两色的"ランチメニュー"毛笔大字和红色圆形印章，下面 5 行分别是汉堡排、大煎饺、炸鸡、姜烧猪肉和中华丼的定食照片，下方"※定食ランチにはご飯・汁物付き"说明框，底部营业时间 9:00～16:30、午市 12:00～14:00，深红页脚（本站已把默认文字改为中文）。

**常见问题**：
- 菜名和照片对不上：每行都写清"菜名 + 照片内容"。
- 价格：示例没有价格，需要的话在菜名后加"¥28"，并确保与店内实际价格一致。
- 书法字错字：菜名用常见字，生成后逐个核对。

**适合**：定食店 / 简餐店菜单、门口海报、外卖店铺头图、食堂菜单牌。

### 英文原版

```text
Goal: Create a vertical Japanese restaurant lunch menu poster for a casual diner, warm and slightly retro, with appetizing food photography and large brush-style Japanese typography.

Canvas: Portrait poster, approximately 4:5 ratio, parchment beige background with subtle paper texture, thin gold border, red and gold decorative accents, leaf motifs in the corners, and a festive Japanese pattern strip along the far left edge.

Header: At the top, place a large calligraphic headline reading {argument name="headline text" default="ランチメニュー"}; make the first word black and the second word deep red. Underline it with a rough gold brush stroke. In the upper-right corner, add a red circular seal containing white Japanese text: 「心を込めた おいしい ひととき」, with small pale pink flower decorations nearby.

Main layout: Create exactly five horizontal menu rows separated by thin beige lines. Each row has a circular icon on the left, a bold Japanese dish name in black calligraphy in the middle-left, and a realistic food photo panel filling the right half. Use warm restaurant tabletop lighting and wooden table surfaces in the photos.

Menu rows, exactly 5 items:
1. Red circle icon with a plum blossom, label 「ハンバーグ定食」, photo of a glossy demi-glace hamburger steak set with rice bowl, miso soup, broccoli, carrot, and garnish.
2. Gold circle icon with gyoza dumplings, label 「ジャンボ餃子定食」, photo of large pan-fried gyoza arranged in a row with rice, dipping sauce, soup, and pickles.
3. Green circle icon with a chicken silhouette, label {argument name="karaage item text" default="唐揚げ定食"}, photo of fried chicken karaage set with shredded cabbage, lemon wedge, rice, soup, and cucumber pickles; make the fried chicken look slightly uncanny and overly bulbous as if AI-generated.
4. Purple circle icon with a pig silhouette, label 「生姜焼き定食」, photo of pork ginger stir-fry with onions, shredded cabbage, tomato, rice, miso soup, and pickles.
5. Blue circle icon with a rice bowl, label 「中華丼」, photo of Chinese-style rice bowl topped with shrimp, quail eggs, vegetables, black fungus, thick glossy sauce, plus a small soup bowl.

Notice strip: Beneath the five rows, add a centered bordered beige notice box reading 「※定食ランチにはご飯・汁物付き」, with small gold leaf ornaments on both sides.

Bottom information area: Create a cream-colored panel with two large information blocks. On the left, a brown clock icon and label 「営業時間」 above the time {argument name="business hours" default="9:00〜16:30"}. On the right, a red fork-and-spoon icon and label 「ランチタイム」 above the time {argument name="lunch time" default="12:00〜14:00"}. Separate the two blocks with a thin vertical divider.

Footer: Add a deep red footer band with subtle gold brush decorations and small sparkle accents. Center white Japanese closing text: {argument name="footer message" default="ゆったりくつろげる空間で、皆さまのご来店を心よりお待ちしております。"}

Visual style: Polished Japanese print flyer, izakaya/family restaurant aesthetic, warm reds, browns, cream, and gold, high-resolution food photography mixed with decorative vector elements, clean grid alignment. Keep all Japanese text legible and avoid adding extra menu items or extra text.
```

> 改编自 [不自然対数](https://x.com/study_unnatural/status/2089741120204886224) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
