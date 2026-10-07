---
title: AI海报提示词：在砧板上用寿司饭拼出国名，酱汁画河流、芥末堆成山的食物地图雕塑
slug: edible-country-name-food-art
model: gpt-image-2
topics: [food, illustration]
needsRefImage: false
aspectRatio: "1:1"
useCase: 做国家 / 城市美食专题封面、旅行美食账号配图、餐厅主题活动海报时，生成一张创意食物摆盘：用当地代表食材拼出地名字母，用酱汁、泥状食物和香料画出河流、山脉和海岸线。
prompt: |
  一块拼盘风格的木砧板上，把"[JAPAN]"做成一件可以吃的雕塑：
  - 字母由紧实的[寿司饭块]雕成，外面用[海苔条]包边；
  - 河流和湖泊用光亮的[酱油味醂浓缩汁]画出；
  - 山脉用顺滑的[芥末牛油果慕斯]挤成，其中一座最高峰带白色雪顶；
  - 海岸线撒上[七味粉]；
  - 再加一个标志性的[红色鸟居造型竹签]作为点睛装饰，稳住构图；
  - 偏振柔光箱棚拍光，50mm 定焦，f/4 浅景深；保留食物碎屑、刀痕和木纹；
  - 三维渲染质感的温暖桌面场景。
  除了地名字母外不要出现其他文字、旗帜，砧板外不要多余物体。
  画幅 1:1。
negativePrompt: null
source:
  repo: jau123/nanobanana-trending-prompts
  url: https://x.com/Gdgtify/status/2004950904152506497
  author: "@Gdgtify"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: 译成中文并拆成要点；地名、字母材料、包边、河流、山脉、海岸线香料、装饰设为变量；去掉渲染软件名，画幅按示例图改为 1:1（原文写 16:9）
images:
  - 3318-edible-country-name-food-art-1.jpg
imageCredit:
  by: "@Gdgtify"
  url: https://images.meigen.ai/tweets/2004950904152506497/0.jpg
  license: CC BY 4.0
verify:
  - 原文写的是 16:9，示例图是 1:1，两种比例都可测一次
  - 换成中文地名（如"成都"）测一次，看汉字能否用食材拼得清楚
  - 确认原帖仍可访问、作者未另行声明保留权利
---
**怎么填变量**：[JAPAN] 换成任何地名，英文字母比汉字更容易拼得清楚，比如"ITALY""CHINA"，也可以试"成都"这样笔画少的两个字。其余变量换成当地代表食物：意大利可以写"[意面压成的字母]、[罗勒青酱]画河流、[番茄酱]堆山、[帕玛森碎]撒海岸、[小橄榄枝]装饰"；成都可以写"[糍粑]字母、[红油]河流、[豆花]堆山、[花椒粉]海岸、[熊猫造型小竹签]"。示例图里木砧板上用白色寿司饭块拼出五个大写字母，每个字母缠一条海苔，深棕色酱油汁像河流一样蜿蜒流过，后方一座绿色慕斯堆成的雪顶山，左边插着一个红色鸟居竹签，四周撒着橙红色七味粉，背后还有一把小刀和一碟香料。

**常见问题与调整**：
- 字母拼错或缺字母：地名控制在 5 个字母以内，并在提示词里再写一遍"字母顺序为 J-A-P-A-N"。
- 像 CG 不像真食物：加"真实的食物摄影，能看到米粒和酱汁表面的反光"。
- 砧板外出现杂物：再强调"砧板外只有干净的木桌面"。
- 想做横版封面：画幅改 16:9，字母横排居中，两侧留出放标题的空间。

**适合**：美食专题封面、旅行美食配图、餐厅主题活动海报；不适合作为真实地理位置的地图。

### 英文原版

```
A charcuterie-style board presents JAPAN as an edible sculpture: • Letters carved from compact sushi-rice blocks wrapped with nori trim • Rivers and lakes painted in glossy soy-mirin reduction • Mountain ranges piped in smooth wasabi-avocado mousse (Mount Fuji peak highlighted) • Coastlines dusted with shichimi togarashi spice mix Add one iconic red Torii-gate bamboo skewer garnish anchoring the composition. Polarised studio softbox lighting, 50 mm prime, f/4, shallow depth; crumbs, knife marks, and wood-grain preserved. Rendered in Cinema 4D + Octane, 16 : 9 warm tabletop scene. (NO text, flags, or extra objects outside the board.)
```

> 改编自 [@Gdgtify](https://x.com/Gdgtify/status/2004950904152506497) 发布、[jau123/nanobanana-trending-prompts](https://github.com/jau123/nanobanana-trending-prompts) 收录的提示词，仓库许可证 CC BY 4.0。
