---
title: 信息图提示词：孔版印刷风科普小报，三色套印的雨林分层剖面+知识板块（gpt-image-2）
slug: risograph-science-zine
model: gpt-image-2
topics: [infographic, poster]
needsRefImage: false
aspectRatio: "16:9"
useCase: 做自然科普、环保主题海报、独立刊物封面或课堂展板时，生成一张"独立科普小报"质感的横版信息图：三色孔版套印、网点和错位都保留，中间是主题剖面插画，四周是手剪边框的知识板块。
prompt: |
  一张 16:9 横版、孔版印刷（Risograph）独立刊物风格的信息图海报，主题是[热带雨林的生物多样性]，看起来就像用多层孔版油墨套印出来的独立科普小报。
  - 印刷质感：保留孔版印刷的瑕疵——油墨颗粒、色层之间轻微错位、中间调里看得见的网点、底下有触感的纸纹；
  - 配色：严格的三色孔版——[荧光绿、深海军蓝、暖黄]，颜色重叠处自然叠印出第二色（如绿叠蓝变青、绿叠黄变橄榄）；
  - 主插画（居中）：一幅茂密的[雨林纵向剖面]，分四层——露生层（巨树、巨嘴鸟）、林冠层（吼猴、兰花）、林下层（箭毒蛙、蕨类）、地被层（蘑菇、甲虫、蟒蛇），每层旁有手写感标注；
  - 知识板块：围绕主插画，用手剪般不规则边框排列，标题分别是[有多少物种？]、[水循环]、[森林面临的威胁]、[森林为什么重要]，每块配低保真小图标和简短有力的文字，字体混用粗黑体和打字机字体；
  - 刊头：大号镂空模板字标题"[刊头标题]"；
  - 角落加一个"你知道吗？"小框写三条数据；底部一条写"[第 7 期 · 野外图鉴系列]"，像真正的独立刊物；
  - 情绪：紧迫、独立、热爱生态、不完美但很美、视觉上带电感。
  画幅[16:9]横版。
negativePrompt: null
source:
  repo: EvoLinkAI/awesome-gpt-image-2-API-and-Prompts
  url: https://x.com/92digitalartArt/status/2065135532875645242
  author: "@92digitalartArt"
  license: CC0 1.0
  licenseUrl: https://creativecommons.org/publicdomain/zero/1.0/
  changes: 译成中文并拆成要点；主题、配色、主插画、四个板块标题、刊头、期号设为变量；补充了常见问题与改法
images:
  - 3276-risograph-science-zine-1.jpg
imageCredit:
  by: "@92digitalartArt"
  url: https://github.com/EvoLinkAI/awesome-gpt-image-2-API-and-Prompts/blob/main/images/poster_case387/output.jpg
  license: CC0 1.0
verify:
  - 示例图里的物种数量、氧气占比等数据由模型生成，页面需提醒"科普使用前核对数据"
  - 示例图是英文版（"RAINFOREST: EARTH'S LUNGS"），中文版出一次看刊头和小字
  - 确认原帖仍可访问、作者未另行声明保留权利
---
**怎么填变量**：主题和主插画一起换，例如"[珊瑚礁生态]" + "[珊瑚礁从浅水到深水的剖面]"、"[城市里的鸟]" + "[一栋楼从屋顶到地面的鸟类分布]"；四个板块标题按主题改；三色配色可换成"[粉红、群青、黄]"等经典孔版组合。示例图是英文版：顶部绿色模板字"RAINFOREST: EARTH'S LUNGS"，中间是分成四层的雨林剖面，能看到巨嘴鸟、大猩猩、黄色箭毒蛙和地面的蛇，左边是物种数量和水循环板块，右边是砍伐、气候变化、栖息地破碎、偷猎四条威胁和"WHY FORESTS MATTER"，底部有"issue no. 7"和"field guide series"字样。

**常见问题与调整**：
- 看起来太干净像普通插画：加"明显的网点、套色错位 1～2 毫米、油墨不均"。
- 颜色超过三种：重复"只用三种油墨色，其余颜色只能来自叠印"。
- 文字太多太小：每个板块只保留一个标题和两行字。
- 想做竖版封面：画幅改 3:4，主插画放大占上半部。

**适合**：自然科普海报、环保主题展板、独立刊物 / 社团小报封面；不适合未经核对直接当作数据来源。

### 英文原版

```
A risograph zine print style infographic poster in 16:9 horizontal format exploring the biodiversity of tropical rainforests, designed to look exactly like an indie science zine printed with overlapping risograph ink layers; the entire composition should show the characteristic risograph printing imperfections: ink grain, slight misregistration between color layers, halftone dot patterns visible in midtones, and a tactile paper texture underneath everything; use a strict three-color risograph palette of fluorescent green, deep navy blue, and warm yellow, with rich overprinting where colors overlap creating unexpected secondary tones like teal where green meets blue and olive where green meets yellow; the main illustration fills the center: a lush vertical cross-section of a rainforest showing all four layers — emergent layer at the top with giant canopy trees and toucans, canopy layer with howler monkeys and orchids, understory with poison dart frogs and ferns, and forest floor with mushrooms, beetles, and anacondas — each layer labeled with a handwritten-style annotation in the risograph aesthetic; surrounding the central forest illustration, organize zine-style content panels with irregular hand-cut border aesthetics, including sections titled HOW MANY SPECIES?, THE WATER CYCLE, THREATS TO THE FOREST, and WHY FORESTS MATTER, each with small lo-fi icons and concise punchy text in a mix of bold grotesque sans-serif and typewriter-style fonts; include a dramatic zine-style header reading RAINFOREST: EARTH'S LUNGS in large stencil-style all-caps lettering; add a small DID YOU KNOW? box with three striking facts, and a bottom strip reading issue no. 7 — field guide series to make it feel like a real indie publication; the overall mood should feel urgent, indie, ecologically passionate, beautifully imperfect, and visually electric, high quality, aspect ratio 16:9
```

> 改编自 [@92digitalartArt](https://x.com/92digitalartArt/status/2065135532875645242) 发布、[EvoLinkAI/awesome-gpt-image-2-API-and-Prompts](https://github.com/EvoLinkAI/awesome-gpt-image-2-API-and-Prompts) 收录的提示词，仓库许可证 CC0 1.0。
