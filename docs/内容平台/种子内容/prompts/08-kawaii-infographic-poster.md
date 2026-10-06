---
title: AI海报提示词：3D 可爱风科普信息图海报（gpt-image-2）
slug: kawaii-infographic-poster
model: gpt-image-2
topics: [poster, ppt]
aspectRatio: "9:16"
needsRefImage: false
useCase: 把一个科普主题做成 3D 治愈风的竖版信息图，适合公众号长图、课堂小报、PPT 封面。
prompt: |
  一张 9:16 竖版科普信息图海报，主题是[莓果与森林水果]，采用温暖的 3D 治愈可爱插画风：圆润造型、光泽质感、柔和的粉彩氛围。
  画面中央是一个高高的漂浮微缩花园，[草莓、蓝莓、树莓和小花]被布置成一个迷你世界，每个都是毛绒 3D 质感，带小表情和高光，像玩具一样。
  背景从顶部的奶油粉渐变到底部的暖桃色和薄荷绿，点缀漂浮的闪光和光斑。
  左上角用圆润活泼的字体写标题"[主标题]"，下方写副标题"[副标题]"。
  画面上错落分布 6 张圆角小卡片，标签分别是[季节、营养、生长、授粉、风味、采收]，每张配一个小图标和一句简短友好的说明。
  右下角放一个"你知道吗？"小面板，写 5 条趣味知识。
  整体温馨、甜美、多彩、有想象力，全部原创，不出现任何受版权保护的形象、商标或流行文化元素。
negativePrompt: null
source:
  repo: EvoLinkAI/awesome-gpt-image-2-API-and-Prompts
  url: https://x.com/92digitalartArt/status/2062237147260756025
  author: "@92digitalartArt"
  license: CC0 1.0
  licenseUrl: https://creativecommons.org/publicdomain/zero/1.0/
  changes: 英文原文译为中文；主题、主体物、主副标题、6 个卡片标签改为变量；删去部分重复的装饰描述，保留"不出现版权元素"的约束
imageBrief: 生成 2 张：默认主题"莓果与森林水果"一张；主题换成"太阳系八大行星"、卡片标签换成"距离、大小、温度、卫星、公转、自转"一张。两张都要人工核对图中文字。
images:
  - 08-kawaii-infographic-poster-1.jpg
imageCredit:
  by: "@92digitalartArt"
  url: https://x.com/92digitalartArt/status/2062237147260756025
  license: CC0 1.0
verify:
  - 在 gpt-image-2 上实测 3 次，记录中文标题和卡片小字的错字率
  - 模型自己编的"趣味知识"是否有事实错误（上线前必须逐条核对，错误的要在正文里提醒）
  - 改成 16:9 后能否直接用作 PPT 封面
  - 确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）
---
**怎么填变量**：先定[莓果与森林水果]这类主题，再把[草莓、蓝莓……]换成主题里最有画面感的 3–5 个东西；6 个卡片标签每个 2–4 个字。

**常见失败与调整**：
- 小字错得多：先让 ChatGPT 把 6 张卡片和 5 条知识写成每条 12 字以内的短句，再把文案直接写进提示词，不让模型自己编。
- 知识点有误：模型生成的"趣味知识"可能不准确，发布前必须人工核对。
- 画面太挤：把卡片减到 4 张。

**适合 / 不适合**：适合科普号、少儿课件、PPT 封面（比例改 16:9）；不适合需要精确数据的正式报告。

> 改编自 [@92digitalartArt](https://x.com/92digitalartArt/status/2062237147260756025) 发布、[EvoLinkAI/awesome-gpt-image-2-API-and-Prompts](https://github.com/EvoLinkAI/awesome-gpt-image-2-API-and-Prompts) 收录的提示词，仓库许可证 CC0 1.0。
