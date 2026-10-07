---
title: 即梦提示词：手绘水彩风农夫市集海报（木箱里的蔬果和鲜花 + 圆润无衬线字体）
slug: farmers-market-poster
model: jimeng
topics: [food, poster]
needsRefImage: false
aspectRatio: "3:4"
useCase: 做社区市集、有机农场、生鲜团购、周末亲子活动的海报时用，得到清新手绘水彩插画 + 友好圆润字体的竖版海报，温暖有社区感。
prompt: |
  一张亲切、质朴的本地[农夫市集]海报。
  - 主视觉：友好的手绘插画风格，一个木箱里装满新鲜的[蔬菜、水果和鲜花]（例如胡萝卜、番茄、黄瓜、苹果、向日葵）；
  - 插画用淡淡的水彩上色，背景是浅米黄色的水彩晕染；
  - 标题"[市集名称]"放在顶部，用友好、圆润的无衬线字体；
  - 底部写上时间"[每周六 8:00-14:00]"和地点"[社区广场]"，以及一句标语"[本地种植 每日新鲜]"；
  - 整体感觉健康、本地、有社区氛围；
  - 竖版画幅[3:4]。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-seedream-4.5
  url: https://github.com/YouMind-OpenLab/awesome-seedream-4.5#no-9-charming-rustic-farmers-market-poster
  author: "@jaredliu_bravo"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: 译成中文并拆成要点；活动类型、主体物、市集名、时间、地点、标语、画幅设为变量；按示例图补充了水彩上色和底部信息栏
images:
  - 3359-farmers-market-poster-1.jpg
imageCredit:
  by: "@jaredliu_bravo"
  url: https://cms-assets.youmind.com/media/1765359700134_ix6s0n_aac15ea93919e9be4354837fd578b1dd1ab5f5eb0fa46415d47b4c11c9d1ae36-600x800.png
  license: CC BY 4.0
verify:
  - 中文标题和时间地点出一次，检查文字是否准确
  - 换成"二手书市集""宠物友好市集"出一次，看主视觉是否随主题变化
  - 确认原帖仍可访问、作者未另行声明保留权利（CC BY 4.0 需保留署名）
---
原作者用 Seedream 4.5 生成；即梦里选用 Seedream 系列图片模型使用。

**怎么填变量**：[农夫市集] 换成活动类型，比如"社区周末市集""有机农场开放日""端午生鲜团购"；[蔬菜、水果和鲜花] 换成主角，书市可以写"一摞旧书和一盆绿植"；[市集名称]、时间、地点、标语填真实信息。示例图是一张浅米黄底的竖版海报：顶部深绿色英文大标题"Fresh Harvest Farmers Market"，中间一个水彩木箱里装着胡萝卜、番茄、黄瓜、生菜、苹果、浆果和向日葵、雏菊，下方一行标语，左下角写时间、右下角写地点。示例图是英文版。

**常见问题与调整**：
- 中文字体太生硬：指定"圆润可爱的中文黑体"，标题控制在 4～8 个字。
- 插画太写实：加"简笔手绘、线条稚拙、水彩边缘晕开"。
- 想加二维码位置：加"右下角留一个白色方块空位"，后期贴真实二维码。
- 做横版横幅：画幅改 16:9，木箱放左侧，文字放右侧。

**适合**：社区活动海报、农场 / 生鲜团购宣传、亲子活动通知；用于真实活动时，时间地点请以实际信息为准。

### 英文原版

```
A charming and rustic poster for a local farmers market. The design is an illustration in a friendly, hand-drawn style, featuring a bounty of fresh vegetables, fruits, and flowers in a wooden crate. The typography is a friendly, rounded sans-serif. The poster should feel wholesome, local, and community-oriented. –ar 3:4
```

> 改编自 [@jaredliu_bravo](https://x.com/jaredliu_bravo) 发布、[YouMind-OpenLab/awesome-seedream-4.5](https://github.com/YouMind-OpenLab/awesome-seedream-4.5) 收录的提示词，仓库许可证 CC BY 4.0。
