---
title: nano banana 穿搭拼贴提示词：一张全身照生成"单品拆解"时尚情绪板
slug: outfit-moodboard
model: nano-banana
topics: [ecommerce, poster, photography]
needsRefImage: true
useCase: 穿搭博主、服装店主上传一张全身穿搭照，生成"人像居中 + 每件单品剪贴 + 手写标注"的拼贴图，直接用作小红书 / 朋友圈穿搭分享图或商品搭配图。
prompt: |
  做一张时尚情绪板拼贴（fashion mood board）：
  - 中间是照片里的人物全身像，保持长相和穿搭不变；
  - 四周用"剪贴纸片"的形式摆放她身上的每一件单品：[上衣、半裙、鞋子、包]，单品是干净的抠图效果；
  - 用俏皮的马克笔手写字和箭头给每件单品做标注：[单品名称、颜色、材质]；
  - 点缀手绘小涂鸦（星星、爱心、波浪线）和胶带纸，背景是[米白色牛皮纸]质感。
  整体风格有创意、可爱、杂志感，画幅 [3:4]。
negativePrompt: null
source:
  repo: PicoTrex/Awesome-Nano-Banana-images
  url: https://x.com/tetumemo/status/1962480699904282861
  author: "@tetumemo"
  license: Apache-2.0
  licenseUrl: https://www.apache.org/licenses/LICENSE-2.0
  changes: 译成中文并整理为分项清单；把原文"标注品牌名称和来源"改为"单品名称、颜色、材质"变量（避免模型编造品牌）；补充背景、装饰和画幅
images:
  - 170-outfit-moodboard-1.jpg
  - 170-outfit-moodboard-2.jpg
imageCredit:
  by: "@tetumemo"
  url: https://github.com/PicoTrex/Awesome-Nano-Banana-images/tree/main/images/case52
  license: Apache-2.0
verify:
  - 实测中文手写标注的可读性
  - 确认原帖仍可访问、作者未另行声明保留权利
---
**怎么用**：上传一张全身、背景简单的穿搭照。示例第 1 张是拼贴结果，第 2 张是原图。单品清单按照片里实际穿的改；如果是店铺搭配图，标注可以改成"单品名称 + 价格"。

**常见问题**：
- 标注里出现了不存在的品牌：原版提示词要求写"品牌和来源"，模型会编造品牌名（示例图里就出现了真实品牌名），所以本站改成了名称 / 颜色 / 材质；如果确实要写品牌，请在提示词里直接给出。
- 单品和原图对不上：加"每件单品必须与人物身上穿的完全一致"。
- 想要男生 / 童装版：直接换照片即可，可把装饰风格改成"极简黑白杂志风"。

**适合**：穿搭分享、店铺搭配推荐、换季整理 lookbook。

### 英文原版

```
A fashion mood board collage. Surround a portrait with cutouts of the individual items the model is wearing. Add handwritten notes and sketches in a playful, marker-style font, and include the brand name and source of each item in English. The overall aesthetic should be creative and cute.
```

> 改编自 [@tetumemo](https://x.com/tetumemo/status/1962480699904282861) 发布、[PicoTrex/Awesome-Nano-Banana-images](https://github.com/PicoTrex/Awesome-Nano-Banana-images) 收录的提示词，仓库许可证 Apache-2.0。
