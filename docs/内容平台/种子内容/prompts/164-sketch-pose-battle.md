---
title: nano banana 火柴人控姿势提示词：手绘草图指定动作，让两个角色打起来
slug: sketch-pose-battle
model: nano-banana
topics: [character, comic]
needsRefImage: true
useCase: 画漫画分镜、做角色对战海报时，用火柴人草图画出想要的动作，再上传两个角色的设定图，让 nano banana 按草图姿势生成完整的对战画面。
prompt: |
  图 1 和图 2 是两个角色，图 3 是手绘的火柴人姿势草图。
  让这两个角色按照图 3 的姿势[进行战斗]：图 3 左边的小人对应图 1 角色，右边的小人对应图 2 角色。
  两个角色的外貌、发型、服装与各自的参考图保持一致。
  加上合适的背景和场景互动：[黄昏的城市天台]，有[能量冲击波、飞扬的碎石]等动态特效，镜头有速度感。
  画风：[日系动画]，画幅 16:9。
negativePrompt: null
source:
  repo: PicoTrex/Awesome-Nano-Banana-images
  url: https://x.com/op7418/status/1960536717242573181
  author: "@op7418"
  license: Apache-2.0
  licenseUrl: https://www.apache.org/licenses/LICENSE-2.0
  changes: 译成中文；明确草图中左右小人与两个角色的对应关系；新增动作、场景、特效、画风四个变量
images:
  - 164-sketch-pose-battle-1.jpg
  - 164-sketch-pose-battle-2.jpg
imageCredit:
  by: "@op7418"
  url: https://github.com/PicoTrex/Awesome-Nano-Banana-images/tree/main/images/case8
  license: Apache-2.0
verify:
  - 用 3 个角色 + 3 个小人的草图实测，看对应关系是否会错乱
  - 确认原帖仍可访问、作者未另行声明保留权利
---
**怎么用**：依次上传角色 A、角色 B 和姿势草图，草图用火柴人就够了，关键是四肢方向清楚。示例第 1 张是结果，第 2 张是输入（两张角色图 + 火柴人草图）。[进行战斗] 也可以换成"击掌庆祝""跳舞""拥抱"，做非战斗场景。

**常见问题**：
- 两个角色"串"了（衣服互换）：在草图上给小人标 A / B，或在提示词里写清每个角色的显著特征（"白发角色在左"）。
- 姿势没对上：草图的关节要画出来（手肘、膝盖弯折方向），纯直线小人效果差。
- 想做漫画分镜：配合 19 号"照片变漫画"使用，先定姿势再分格。

**注意**：用自己的原创角色；知名动漫、游戏角色的同人图仅供学习交流，商用请注意版权。

### 英文原版

```
Have these two characters fight using the pose from Figure 3. Add appropriate visual backgrounds and scene interactions,Generated image ratio is 16:9
```

> 改编自 [@op7418](https://x.com/op7418/status/1960536717242573181) 发布、[PicoTrex/Awesome-Nano-Banana-images](https://github.com/PicoTrex/Awesome-Nano-Banana-images) 收录的提示词，仓库许可证 Apache-2.0。
