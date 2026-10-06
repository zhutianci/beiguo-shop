---
title: nano banana 线稿上色提示词：按指定色卡给线稿自动上色
slug: palette-lineart-coloring
model: nano-banana
topics: [illustration, character]
needsRefImage: true
useCase: 画师、设计师有线稿和配色方案，想快速看上色效果时，上传线稿 + 色卡，让 nano banana 严格按色卡上色，省掉平涂时间。
prompt: |
  图 1 是角色线稿，图 2 是色卡。
  严格只使用图 2 色卡中的颜色给图 1 的角色上色：外套用[第 1 个颜色]，裤子用[第 2 个颜色]，鞋子和配饰用[最后一个颜色]。
  保留图 1 的全部线条，不要修改造型和比例；上色方式为[赛璐璐平涂 + 一层阴影]，阴影使用同色系的深一档颜色。
  背景保持[纯白]，输出干净的完整角色图。
negativePrompt: null
source:
  repo: PicoTrex/Awesome-Nano-Banana-images
  url: https://x.com/ZHO_ZHO_ZHO/status/1960652077891510752
  author: "@ZHO_ZHO_ZHO"
  license: Apache-2.0
  licenseUrl: https://www.apache.org/licenses/LICENSE-2.0
  changes: 原文为"准确使用图2色卡为图1人物上色"；本站补充颜色分配、上色方式、阴影规则和背景变量，并加上"不修改线条"的约束
images:
  - 165-palette-lineart-coloring-1.jpg
  - 165-palette-lineart-coloring-2.jpg
imageCredit:
  by: "@ZHO_ZHO_ZHO"
  url: https://github.com/PicoTrex/Awesome-Nano-Banana-images/tree/main/images/case13
  license: Apache-2.0
verify:
  - 用吸管工具抽查 3 处颜色，看与色卡的色值偏差有多大
  - 确认原帖仍可访问、作者未另行声明保留权利
---
**怎么用**：先传线稿，再传色卡（色块从左到右排开、背景干净最好）。示例第 1 张是上色结果，第 2 张是输入（线稿 + 5 色色卡）。颜色分配那句可以按自己的设计改，不写的话模型会自己分配。

**常见问题**：
- 颜色"跑偏"：图像模型不会精确到色值，结果只能"接近"色卡；需要精确色值的商业稿，用它出方案，最后在绘图软件里统一替换颜色。
- 线条被改了：线稿越干净越好，草稿线、辅助线先删掉；加"线条一根都不要改"。
- 想要多套配色对比：上传 2～3 张不同色卡，追问"分别用这几套色卡各上一版，并排输出"。

**适合**：角色设计配色方案、插画快速出稿、教学演示；用于自己的原创线稿。

### 英文原版

```
Accurately use the color palette from Figure 2 to color the character in Figure 1
```

> 改编自 [@ZHO_ZHO_ZHO](https://x.com/ZHO_ZHO_ZHO/status/1960652077891510752) 发布、[PicoTrex/Awesome-Nano-Banana-images](https://github.com/PicoTrex/Awesome-Nano-Banana-images) 收录的提示词，仓库许可证 Apache-2.0。
