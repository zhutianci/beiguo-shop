---
title: nano banana 红笔批注提示词：让 AI 在设计稿 / 照片上直接标出修改意见
slug: photo-red-pen-critique
model: nano-banana
topics: [photography, illustration, character]
needsRefImage: true
useCase: 角色设定图、海报、摄影作品、PPT 页面做完了想听听意见，上传图片让 AI 像老师改作业一样，用红笔在图上圈出问题并写上修改建议。
prompt: |
  你是一位资深[角色设计师]。请审阅这张图，用红色马克笔直接在图上批注：
  - 圈出你认为可以改进的地方，最多[6]处，按重要程度编号；
  - 每处旁边用简短的手写字写出问题和改法（例如"比例偏长""配色太散""视觉焦点不明确"）；
  - 需要时用箭头、虚线示意修改方向；
  - 在角落写一句总评。
  批注语言为[中文]。原图内容保持不变，只叠加红笔批注。
negativePrompt: null
source:
  repo: PicoTrex/Awesome-Nano-Banana-images
  url: https://x.com/AiMachete/status/1962356993550643355
  author: "@AiMachete"
  license: Apache-2.0
  licenseUrl: https://www.apache.org/licenses/LICENSE-2.0
  changes: 原文为一句"分析这张图片，用红笔标出你可以改进的地方"；本站增加专业角色、批注数量、编号与总评、批注语言等变量
images:
  - 175-photo-red-pen-critique-1.jpg
  - 175-photo-red-pen-critique-2.jpg
imageCredit:
  by: "@AiMachete"
  url: https://github.com/PicoTrex/Awesome-Nano-Banana-images/tree/main/images/case29
  license: Apache-2.0
verify:
  - 分别用一张海报和一张风景照实测，看批注是否言之有物
  - 确认原帖仍可访问、作者未另行声明保留权利
---
**怎么用**：上传要被点评的图，把 [角色设计师] 换成对应专业：海报用"平面设计师"，照片用"摄影师"，PPT 用"咨询公司的演示设计顾问"。示例第 1 张是批注结果，第 2 张是原始的角色设定图。

**怎么用得更好**：
- 批注只是"第一轮意见"，可以接着追问"按第 1、3 条意见改一版"，让它直接出修改稿。
- 想要更犀利：加"像严格的美院老师一样，不要客气"。
- 中文批注偶尔有错字，关键意见可以追问"把这些批注用文字列出来"。

**注意**：AI 的审美意见只是参考，最终取舍还是看你的目标受众；同类玩法另见 155 号"妆容红笔分析"。

### 英文原版

```
Analyze this image. Use red pen to denote where you can improve.
```

> 改编自 [@AiMachete](https://x.com/AiMachete/status/1962356993550643355) 发布、[PicoTrex/Awesome-Nano-Banana-images](https://github.com/PicoTrex/Awesome-Nano-Banana-images) 收录的提示词，仓库许可证 Apache-2.0。
