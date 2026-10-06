---
title: nano banana 科普模型图提示词：用 3D 等轴测微缩场景讲清一个过程（水循环、光合作用…）
slug: isometric-process-diorama
model: nano-banana
topics: [infographic, ppt, illustration]
needsRefImage: false
aspectRatio: "16:9"
useCase: 老师做课件、科普号做封面、产品经理讲业务流程时，生成一张 45° 俯视的微缩 3D 沙盘，每个阶段一块台阶，配小人和箭头，把抽象过程变得一眼看懂。
prompt: |
  制作一张清晰的 45° 俯视等轴测（isometric）微缩 3D 教育模型，讲解"[水循环]"。
  - 材质柔和精致，使用写实 PBR 材质和柔和逼真的光线；
  - 底座做成阶梯式或分层结构，每一层 / 每一块展示过程中的一个阶段：[蒸发、凝结、降水、径流]，阶段之间用细小的箭头或路径连接；
  - 每个阶段有小小的风格化人物在互动（人物不画面部细节）；
  - 背景为干净的纯色[浅蓝色]；
  - 画面顶部居中用大号粗体写标题"[水循环]"，正下方一行简短的副标题解释，再下面放一个极简的符号图标；
  - 所有文字颜色自动与背景形成对比（白色或黑色）。
negativePrompt: null
source:
  repo: jau123/nanobanana-trending-prompts
  url: https://x.com/aleenaamiir/status/2013493349156823287
  author: "@aleenaamiir"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: 译成中文并整理成分项清单；新增"阶段清单"变量，让用户显式列出每个阶段，减少模型自行编造步骤
images:
  - 187-isometric-process-diorama-1.jpg
  - 187-isometric-process-diorama-2.jpg
imageCredit:
  by: "@aleenaamiir"
  url: https://x.com/aleenaamiir/status/2013493349156823287
  license: CC BY 4.0
verify:
  - 用一个业务流程（如"外卖订单从下单到送达"）实测
  - 确认原帖仍可访问、作者未另行声明保留权利
---
**怎么用**：把 [水循环] 换成要讲的主题，并在阶段清单里写出 3～5 个阶段（写得越准，图越不会"编"）。示例两张图分别是"水循环"和"光合作用"。适合的主题：自然科学过程、生产工艺（咖啡从种植到一杯）、业务流程（用户注册 → 下单 → 支付 → 发货）。

**常见问题**：
- 阶段顺序乱：在清单里加编号"①蒸发 ②凝结……"，并要求"按编号顺时针排列"。
- 标题中文写错：标题尽量 2～6 个字；副标题可以让它写英文，或出图后自己加。
- 想要系列课件：固定背景色和副标题样式，每次只换主题，就能得到一套风格统一的封面。

**适合**：中小学课件、科普图文、公司内部培训、小红书知识卡封面。

### 英文原版

```
Create a clear, 45° top-down isometric miniature 3D educational diorama explaining [PROCESS / CONCEPT].

Use soft refined textures, realistic PBR materials, and gentle lifelike lighting.

Build a stepped or layered diorama base showing each stage of the process with subtle arrows or paths.

Include tiny stylized figures interacting with each stage (no facial details).

Use a clean solid [BACKGROUND COLOR] background.
At the top-center, display [PROCESS NAME] in large bold text, directly beneath it show a short explanation subtitle, and place a minimal symbolic icon below.

All text must automatically match the background contrast (white or black).
```

> 改编自 [@aleenaamiir](https://x.com/aleenaamiir/status/2013493349156823287) 发布、[jau123/nanobanana-trending-prompts](https://github.com/jau123/nanobanana-trending-prompts) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)。
