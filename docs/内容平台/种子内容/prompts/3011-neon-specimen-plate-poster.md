---
title: "荧光生物标本图提示词：黑底霓虹水母科学图鉴海报（gpt-image-2）"
slug: neon-specimen-plate-poster
model: gpt-image-2
topics: [infographic, wallpaper]
aspectRatio: "1:1"
needsRefImage: false
useCase: "把一种生物画成黑底发光的未来感\"科学标本图版\"：主体是霓虹色半透明生物，左侧一列微距纹理色块，右下角标本信息卡，适合壁纸、海报和科普账号封面。"
prompt: |
  一只[发光的水母]悬浮在[纯黑背景]上，呈现为一张未来感的科学标本图版。
  它半透明的伞盖发出[霓虹洋红、紫外紫、电光青和荧光绿]，内部可见分叉的叶脉状结构和细微的细胞纹理。长长的丝带状触手以优雅的曲线向下垂落，每条边缘都被荧光照亮。
  画面左侧竖排 6 个干净的矩形色块，每块是从水母膜组织中提取的渐变和微距纹理研究，带编号和简短英文标签。
  右下角放一张小型标本信息卡：物种名、分类、栖息深度、编号等几行等宽字体小字，配一个小比例尺剪影和一条光谱条。
  风格：高对比紫外摄影，虹彩般的生物细节，清晰对称，极简构图，大面积纯黑留白，超现实的自然史图鉴美学，色彩强烈发光。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/LANDCASTER_92/status/2080149053619228738
  author: "LANDCÄSTER"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文；主体、背景、配色改为变量；补充右下角标本信息卡的描述（与示例图一致）"
images:
  - 3011-neon-specimen-plate-poster-1.jpg
imageCredit:
  by: "LANDCÄSTER"
  url: https://youmind.com/gpt-image-2-prompts?id=29574
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：[发光的水母] 换成其他适合"发光标本"的主体，如"深海鮟鱇鱼""蒲公英种子""蝴蝶翅膀""珊瑚"；配色可以收窄到 2～3 种，如"冰蓝和银白"会更冷静。背景一般保持纯黑，换成"深海军蓝"也可以。

示例图是一只占据画面大半的霓虹水母，洋红与蓝紫的伞盖里有树枝状发光脉络，触手带荧光绿边，左侧 6 个编号的微距纹理方块（伞盖、管道、口腕、触手、刺细胞、内胚层），右下角是"SPECIMEN: AURELIA VITREA"信息卡和光谱条。

**常见问题**：
- 信息卡里的拉丁名和数据是模型编的：只作装饰用，做科普时请换成真实资料。
- 颜色太脏：减少颜色数量，并强调"纯黑背景、无雾气"。
- 想做手机壁纸：画幅改成 9:16，去掉左侧色块和信息卡，只保留主体。

**适合**：手机 / 电脑壁纸、科普账号封面、海报和 T 恤图案。

### 英文原版

```text
A {argument name="subject" default="luminous jellyfish"} suspended against a {argument name="background" default="pure black background"}, presented like a futuristic scientific specimen plate. Its translucent bell glows in {argument name="colors" default="saturated neon magenta, ultraviolet purple, electric cyan, cobalt blue, and toxic green"}, with branching vein-like structures and fine cellular textures visible inside. Long ribbon-like tentacles trail downward in elegant curves, each edge illuminated by fluorescent light. Along the left side, six clean rectangular swatches show gradients and macro texture studies derived from the jellyfish’s membranes. High-contrast ultraviolet photography, iridescent biological detail, crisp symmetry, minimal composition, deep black negative space, surreal natural-history aesthetic, intensely radiant neon color.
```

> 改编自 [LANDCÄSTER](https://x.com/LANDCASTER_92/status/2080149053619228738) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
