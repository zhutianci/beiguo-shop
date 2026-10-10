---
title: AI海报提示词：用建筑拼出风格名，哥特/文艺复兴/粗野主义/装饰艺术四宫格字母楼（gpt-image-2）
slug: architecture-style-typography
model: gpt-image-2
topics: [poster, illustration]
needsRefImage: false
aspectRatio: "1:1"
useCase: 做建筑史科普、艺术课件封面、设计类账号的系列海报时，生成一张 2×2 四宫格：每格一座由风格名字母"盖"成的建筑，材质和细节完全按该风格来，一眼就记住四种风格的特征。
prompt: |
  2×2 四宫格，分别表现四种著名建筑风格：[哥特式]、[文艺复兴]、[粗野主义]、[装饰艺术]。
  - 每一格的主体是一座"字母建筑"：用该风格的英文名（或[中文名]）的字母作为建筑体量，字母本身就是楼体，可以看清每个字母；
  - 建筑语言严格对应该风格的几何特征与时代：例如哥特式用尖拱、飞扶壁、玫瑰窗和尖塔；文艺复兴用穹顶、柱式、拱廊和对称立面；粗野主义用粗糙清水混凝土和厚重的方块体量；装饰艺术用竖向线条、阶梯式退台和金色几何装饰；
  - 四格保持一致的机位（略仰的三分之四视角）和中性的浅色天空背景，地面有很小的行人做尺度参照；
  - 每格左下角一行小字：风格名、年代、地区；
  - 写实建筑摄影质感，材质细节丰富，光线柔和均匀。
  画幅[1:1]。
negativePrompt: null
source:
  repo: EvoLinkAI/awesome-gpt-image-2-API-and-Prompts
  url: https://x.com/Gdgtify/status/2065191846800740636
  author: "@Gdgtify"
  license: CC0 1.0
  licenseUrl: https://creativecommons.org/publicdomain/zero/1.0/
  changes: 译成中文；原文只给出"风格 + 几何特征与时代"的锚点，本站参照示例图补充了"字母即建筑"的做法、四种风格的具体建筑语言、机位、尺度人物和左下角说明文字；风格名设为变量
images:
  - 3270-architecture-style-typography-1.jpg
imageCredit:
  by: "@Gdgtify"
  url: https://github.com/EvoLinkAI/awesome-gpt-image-2-API-and-Prompts/blob/main/images/comparison_case104/output.jpg
  license: CC0 1.0
verify:
  - 原文没有明确写"用字母组成建筑"，是参照示例图补充的，页面不要说原文一句话就能出同款
  - 示例图字母较长的词（如文艺复兴）出现字母缺失，中文风格名版本建议出一次看可读性
  - 确认原帖仍可访问、作者未另行声明保留权利
---
**怎么填变量**：四个风格可以整体换，例如"[中式木构]、[徽派]、[岭南骑楼]、[江南园林]"，或"[包豪斯]、[解构主义]、[高技派]、[参数化]"；[中文名] 处可以写"用中文风格名的汉字作为建筑体量"，汉字越少越稳（两个字最好）。示例图是 2×2：左上是满身尖塔和玫瑰窗的"GOTHIC"，右上是带穹顶和柱廊的"RENAISSANCE"（部分字母被建筑挡住），左下是灰色混凝土堆成的"BRUTALIST"，右下是金色竖线装饰的"ART DECO"，每格左下角有风格名和年代小字。

**常见问题与调整**：
- 字母认不出来：缩短单词或改用两三个字母的缩写，并加"字母轮廓清晰，从远处一眼可读"。
- 建筑和字母分离成两样东西：强调"字母本身就是建筑主体，窗户、柱子都长在字母上"。
- 四格风格互相串：每格单独写清该风格的三个关键元素。
- 想做单张海报：只保留一种风格，画幅改 3:4，字母建筑放大占满画面。

**适合**：建筑史科普、艺术 / 设计课件封面、系列海报；不适合作为严谨的建筑史图例。

### 英文原版

```
2x2 grid, do this for 4 famous architectural styles. Anchor: [Architectural Style] :: [Geometric Essence & Period]. Each panel shows a representative building in that exact style with consistent camera angle and neutral sky background.
```

> 改编自 [@Gdgtify](https://x.com/Gdgtify/status/2065191846800740636) 发布、[EvoLinkAI/awesome-gpt-image-2-API-and-Prompts](https://github.com/EvoLinkAI/awesome-gpt-image-2-API-and-Prompts) 收录的提示词，仓库许可证 CC0 1.0。
