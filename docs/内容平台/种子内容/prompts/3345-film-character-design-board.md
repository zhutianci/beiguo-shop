---
title: 角色设定提示词：新黑色电影风写实角色设计板（转面、表情、服装拆解、面料、色板）
slug: film-character-design-board
model: gpt-image-2
topics: [character, fashion]
needsRefImage: false
aspectRatio: "1:1"
useCase: 给短片、剧本、广告或原创 IP 做"导演提案级"的写实角色设定时用，一张图交代角色气质、全身转面、表情角度、服装拆解和面料细节。
prompt: |
  为一部高预算[新黑色电影]制作一张电影级写实角色设计板，故事发生在[雨夜里的未来城市]。
  - 配色：深炭灰配[电光青]，背景有霓虹反光；
  - 不要普通网格或对称排版，构图要像风格化的导演提案板；
  - 角色：一个接地气的人类角色"[角色名]"，解剖结构真实，带细微的不完美，情绪存在感强；
  - 内容版块：全身转面（正 / 侧 / 背）、多个头部角度、一张电影感肖像、服装拆解、面料质感特写、制作备注、色板；
  - 背景：虚化的赛博城市灯光、湿玻璃反射、阴郁氛围、柔和霓虹光晕；
  - 风格：半写实的电影真实感，高对比光线，浅景深，胶片颗粒，情绪张力强；
  - 方形画幅[1:1]。
negativePrompt: null
source:
  repo: EvoLinkAI/awesome-gpt-image-2-API-and-Prompts
  url: https://x.com/Mind_Boticni/status/2054542152781431075
  author: "@Mind_Boticni"
  license: CC0 1.0
  licenseUrl: https://creativecommons.org/publicdomain/zero/1.0/
  changes: 译成中文并拆成要点；片种、故事场景、主色、角色名、画幅设为变量；按示例图补充了色板版块
images:
  - 3345-film-character-design-board-1.jpg
imageCredit:
  by: "@Mind_Boticni"
  url: https://github.com/EvoLinkAI/awesome-gpt-image-2-API-and-Prompts/blob/main/images/ui_case147/output.jpg
  license: CC0 1.0
verify:
  - 示例图人物为高度写实的虚构人物，核对是否与任何真人明显相像
  - 换成"民国谍战""荒漠公路片"出一次，看版块排版是否保持
  - 确认原帖仍可访问、作者未另行声明保留权利
---
**怎么填变量**：[新黑色电影] 换成片种，比如"民国谍战片""公路片""末日生存剧"；[雨夜里的未来城市] 换成故事发生地，如"1930 年代的上海弄堂""沙漠公路边的汽车旅馆"；[电光青] 是主色，谍战片可以用"暗红"，公路片用"沙土橙"；[角色名] 起一个原创名字。示例图是一张紫灰色调的英文设计板：左边大幅肖像是一位湿发、穿黑色皮风衣的女子，右上一排四个全身转面，中间是四个头部角度特写，下方拆解出风衣、紧身衣、战术腰包和靴子，右侧有面料小样和色板，左下角还有一张城市夜景的电影感肖像。示例图是英文版。

**常见问题与调整**：
- 转面里服装不一致：追问"四个转面的风衣长度、扣子和腰带必须完全一致"。
- 文字区太多乱码：加"制作备注只写 3 条短句"，或让文字区留空后期再排。
- 想要男性 / 年长角色：直接在角色描述里写"四十多岁、留胡茬的男性侦探"。
- 背景抢戏：改成"背景是深灰纯色，只在边缘有一点霓虹光"。

**适合**：短片 / 剧本角色提案、原创 IP 设定、服装造型参考；不适合生成与真人明星相像的角色。

### 英文原版

```
Create a cinematic realistic character design board for a high-budget neo-noir film production set in a rain-soaked futuristic city. Use a dark charcoal and electric cyan color palette with neon reflections in the background. Avoid generic grids or symmetrical layouts; composition should feel like a stylized director’s pitch board. Design a grounded human character with realistic anatomy, subtle imperfections, and strong emotional presence. Include full-body turnarounds, expressive head angles, cinematic portrait, wardrobe breakdown, fabric texture detail, and production notes. Background: blurred cyberpunk city lights, wet glass reflections, moody atmosphere, soft neon glow. Style: semi-realistic cinematic realism, high contrast lighting, shallow depth of field, film grain, emotional intensity.
```

> 改编自 [@Mind_Boticni](https://x.com/Mind_Boticni/status/2054542152781431075) 发布、[EvoLinkAI/awesome-gpt-image-2-API-and-Prompts](https://github.com/EvoLinkAI/awesome-gpt-image-2-API-and-Prompts) 收录的提示词，仓库许可证 CC0 1.0。
