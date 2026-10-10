---
title: "钞票雕刻版画风提示词：深海生物黑白平行线雕刻插画（gpt-image-2）"
slug: banknote-engraving-creature-illustration
model: gpt-image-2
topics: [illustration]
aspectRatio: "16:9"
needsRefImage: false
useCase: "用钞票上那种平行排线的凹版雕刻风格画生物、建筑或人物，得到精致的黑白版画插图，每张带复古标题牌，适合做系列图鉴、藏书票、T 恤图案和复古海报。"
prompt: |
  钞票平行排线凹版雕刻风格，画 4 种[会发光的稀有深海生物]：[鮟鱇鱼、巨口鱼、吸血鬼乌贼、冠水母]。
  每种生物单独一张 16:9 横版插画：生物位于画面中央，四周是用平行细线刻画的深海背景（起伏的海底岩石、远处的光点），生物自身的发光器官用留白和放射线表现出光芒。
  全图只用黑色线条在米白纸上表现明暗：用排线的疏密、粗细和交叉来塑造体积，像纸币和老式证券上的雕刻肖像。
  画面四周有细致的装饰边框，顶部中央一个复古标题牌，用衬线小型大写字母写该生物的英文名。
  不要彩色、不要灰度渐变涂抹，只有清晰的雕刻线。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/TWnese/status/2073327507454197893
  author: "TWnese"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "原文只有风格名和生物清单，本站译为中文并补充了构图、边框、标题牌和\"一张图一种生物\"的说明；生物清单改为变量"
images:
  - 3035-banknote-engraving-creature-illustration-1.jpg
  - 3035-banknote-engraving-creature-illustration-2.jpg
  - 3035-banknote-engraving-creature-illustration-3.jpg
imageCredit:
  by: "TWnese"
  url: https://youmind.com/gpt-image-2-prompts?id=27680
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：两个方括号分别是"主题"和"具体名单"，数量随名单调整，例如"[濒危猛禽]：[金雕、白头海雕、游隼、雪鸮]""[中国古桥]：[赵州桥、卢沟桥、广济桥]"。名单越具体，每张图越准确。想要单张图，就只写一种。标题牌想要中文时写"标题牌用中文宋体"。

示例图是同一提示词生成的四张中的三张：Deep-Sea Anglerfish（张着獠牙大口、头顶发光诱饵的鮟鱇鱼）、Stoplight Loosejaw（长条形、身上一串发光点的巨口鱼）、Vampire Squid（展开蹼膜的吸血鬼乌贼），全部是米白底黑色平行线雕刻，带装饰边框和顶部标题牌。

**常见问题**：
- 变成普通素描：强调"只用平行排线和交叉排线，像纸币雕刻"。
- 一张图里挤了 4 只：写明"每种生物单独生成一张"。
- 线条太粗糙：加"线条极细、密集、均匀"。

**适合**：系列图鉴插画、藏书票、T 恤 / 帆布包图案、复古风海报。

### 原版提示词

```text
Banknote Parallel-Hatching Engraving Style, {argument name="creatures" default="4 rare glowing deep-sea creatures: Deep-Sea Anglerfish, Stoplight Loosejaw, Vampire Squid, Atolla Jellyfish"}
```

> 改编自 [TWnese](https://x.com/TWnese/status/2073327507454197893) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
