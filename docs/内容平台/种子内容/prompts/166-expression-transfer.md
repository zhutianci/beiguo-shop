---
title: nano banana 换表情提示词：用一张表情参考图，改变角色或人物的表情
slug: expression-transfer
model: nano-banana
topics: [character, portrait]
needsRefImage: true
useCase: 画角色表情差分、给头像换表情、做表情包时，上传角色图和一张"表情参考"（真人照片或其他画风都可以），只换表情不换人。
prompt: |
  图 1 是角色参考，图 2 是表情参考。
  把图 1 角色的表情改成图 2 中的表情：[眯眼大笑、张嘴露齿]，包括眉毛、眼睛、嘴型和脸部肌肉的变化。
  只参考图 2 的表情，不参考图 2 的长相和画风。
  图 1 角色的画风、发型、服装、姿势、背景全部保持不变。
negativePrompt: null
source:
  repo: PicoTrex/Awesome-Nano-Banana-images
  url: https://x.com/ZHO_ZHO_ZHO/status/1963156830458085674
  author: "@ZHO_ZHO_ZHO"
  license: Apache-2.0
  licenseUrl: https://www.apache.org/licenses/LICENSE-2.0
  changes: 原文为"图一人物参考/换成图二人物的表情"；本站新增表情描述变量，并补充"不参考长相和画风"及保持不变项
images:
  - 166-expression-transfer-1.jpg
imageCredit:
  by: "@ZHO_ZHO_ZHO"
  url: https://github.com/PicoTrex/Awesome-Nano-Banana-images/tree/main/images/case34
  license: Apache-2.0
verify:
  - 用真人照片作图 1、卡通表情作图 2 反向实测一次
  - 确认原帖仍可访问、作者未另行声明保留权利
---
**怎么用**：图 1 传角色，图 2 传表情参考。示例中左边是原角色、右上小图是真人表情参考、右边是换表情后的结果——可以看到真人的表情被"翻译"成了动漫画风。[眯眼大笑……] 用文字再描述一遍表情，成功率更高。

**常见问题**：
- 角色画风被带偏成写实：把"只参考表情，不参考长相和画风"放到第一句。
- 表情幅度不够：在描述里用夸张的词，如"笑到眼睛眯成一条线"。
- 一次要多个表情：追问"生成同一角色的 6 个表情：开心、生气、难过、惊讶、害羞、无语，排成 2×3"。

**适合**：角色设定表情差分、表情包素材、漫画分镜补表情；只对自己的原创角色或本人照片使用。

### 英文原版

```
Character reference from Image 1 / Change to the expression from Image 2
```

> 改编自 [@ZHO_ZHO_ZHO](https://x.com/ZHO_ZHO_ZHO/status/1963156830458085674) 发布、[PicoTrex/Awesome-Nano-Banana-images](https://github.com/PicoTrex/Awesome-Nano-Banana-images) 收录的提示词，仓库许可证 Apache-2.0。
