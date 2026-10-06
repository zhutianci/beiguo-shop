---
title: AI扩图提示词（nano banana）：补全透明 / 棋盘格区域，让图片自然向外延伸
slug: outpaint-repair-transparent
model: nano-banana
topics: [photo-edit, illustration]
needsRefImage: true
useCase: 图片尺寸不够、想把竖图改横图、画面被裁掉一角时，先在修图软件里把画布拉大（空白处留成透明棋盘格），再上传给 nano banana 自动补全，得到一张完整连贯的大图。
prompt: |
  这张图里的灰白棋盘格区域是透明的空白画布，请把这些区域补全，修复成一张完整、连贯的图片：
  1. 补出来的内容要和现有画面自然衔接：透视、光线方向、色调、笔触或画风完全一致，看不出拼接边界；
  2. 补全的内容按画面逻辑延伸，例如[继续画出更多海岛和海面]；
  3. 原有部分保持不变，不要重画、不要改变已有物体的位置和细节；
  4. 输出整张图，不保留任何棋盘格、白边或透明区域，画幅保持[扩展后的画布比例]。
negativePrompt: null
source:
  repo: PicoTrex/Awesome-Nano-Banana-images
  url: https://x.com/bwabbage/status/1962903212937130450
  author: "@bwabbage"
  license: Apache-2.0
  licenseUrl: https://www.apache.org/licenses/LICENSE-2.0
  changes: 原文只有一句"修复棋盘格部分并恢复成完整图片"；本站译成中文并扩写为 4 条要求，新增"补全内容""画幅"两个变量，补充"无缝衔接、原有部分不变、不留棋盘格"的约束
images:
  - 516-outpaint-repair-transparent-1.jpg
  - 516-outpaint-repair-transparent-2.jpg
imageCredit:
  by: "@bwabbage"
  url: https://github.com/PicoTrex/Awesome-Nano-Banana-images/tree/main/images/case50
  license: Apache-2.0
verify:
  - 用一张真实照片（风景 / 街景）把画布扩大 50% 后试一次，看衔接处是否有明显色差或重复纹理
  - 确认 nano banana 能识别透明 PNG 的棋盘格区域；若上传后透明处变成纯白，提示词里的"棋盘格"需改成"白色空白区域"
  - 确认原帖仍可访问、作者未另行声明保留权利
---
**怎么用**：先在任意修图工具（手机上的画布扩展、Photoshop、Figma 都行）把画布往需要的方向拉大，空出来的部分保持透明，导出 PNG 后上传，再发送提示词。示例图第 1 张是补全结果，第 2 张是原图：右下大片透明区域被补成了风格一致的海岛和海面。

**[继续画出更多海岛和海面] 怎么写**：写清空白处"应该出现什么"，效果比让模型自由发挥稳定，例如"延伸出更多天空和远山""补全人物被裁掉的双脚和地面""补出桌面的另一半和咖啡杯"。如果不想出现新物体，写"只延伸背景，不新增主体"。

**常见问题**：
- 接缝明显：追问"把拼接处再融合一下，统一光线和颜色"；或者一次少扩一点，分两次扩。
- 原图被改了：把第 3 条挪到第一句，并加"已有像素一个都不要动"。
- 透明区域上传后变成白色：把提示词里的"棋盘格区域"改成"白色空白区域"即可。

**适合**：竖图改横图做封面 / Banner、补全被裁掉的边角、游戏地图和插画的延展；**不适合**：证件照、需要真实记录的新闻 / 证据类照片（补出来的内容是 AI 生成的）。

### 英文原版

```
Repair the checkerboard (transparent) parts of the image and restore a complete, coherent photo.
```

> 改编自 [@bwabbage](https://x.com/bwabbage/status/1962903212937130450) 发布、[PicoTrex/Awesome-Nano-Banana-images](https://github.com/PicoTrex/Awesome-Nano-Banana-images) 收录的提示词，仓库许可证 Apache-2.0。
