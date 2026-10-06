---
title: 照片转漫画线稿提示词（nano banana）：彩色照片一键变黑白日漫线稿
slug: photo-to-manga-lineart
model: nano-banana
topics: [comic, photo-edit, illustration]
needsRefImage: true
useCase: 想把街景、旅行照、产品照变成黑白漫画分镜或线稿素材时，上传照片就能得到构图不变、带网点和速度线的日式漫画风黑白画面，可做漫画背景、涂色底稿或社交平台头图。
prompt: |
  把上传的照片转换成黑白日式漫画风格的线稿画面：
  - 构图、透视、建筑和物体的位置与原照片完全一致，只改变画风；
  - 用干净利落的黑色墨线勾勒轮廓，暗部用排线和网点表现，高光处留白；
  - 光源（路灯、车灯、招牌）处理成漫画里的放射光或留白光晕；
  - 根据画面动态加入[速度线]，增强漫画分镜感；
  - 整体只有黑、白、灰网点，不要任何彩色；画面里的文字保持原样或简化，不要新增文字。
negativePrompt: null
source:
  repo: PicoTrex/Awesome-Nano-Banana-images
  url: https://x.com/nobisiro_2023/status/1961231347986698371
  author: "@nobisiro_2023"
  license: Apache-2.0
  licenseUrl: https://www.apache.org/licenses/LICENSE-2.0
  changes: 原文只有一句"把输入照片处理为黑白漫画风格线稿"；本站译成中文并扩写构图不变、排线网点、光源处理、只用黑白等要求，新增"速度线"变量
images:
  - 517-photo-to-manga-lineart-1.jpg
  - 517-photo-to-manga-lineart-2.jpg
imageCredit:
  by: "@nobisiro_2023"
  url: https://github.com/PicoTrex/Awesome-Nano-Banana-images/tree/main/images/case57
  license: Apache-2.0
verify:
  - 用一张有人物的照片实测，看人物五官是否被明显改变
  - 用中文招牌的街景实测，检查招牌文字是否变成乱码
  - 确认原帖仍可访问、作者未另行声明保留权利
---
**怎么用**：上传一张照片后直接发送。示例图第 1 张是结果，第 2 张是原图：夜晚雪中的东京街景被转成了带速度线的黑白漫画画面，高架桥、楼宇和车的位置都没变。

**[速度线] 怎么改**：静态场景（咖啡馆、房间、风景）可以改成"无速度线，安静的氛围"；想要更"燃"的效果写"强烈的集中线和速度线"。想要纯线稿用来涂色，把第 2 条改成"只保留线条，不要排线和网点，大面积留白"。

**常见问题**：
- 细节太多显得脏：加一句"简化远景细节，只保留主要轮廓"。
- 人像照片脸变了：补充"人物五官、发型、表情与原照片一致"；仍不满意就先用 166 号换表情提示词固定表情再转线稿。
- 画面发灰：加"黑白对比强烈，大块纯黑与纯白"。

**适合**：漫画背景素材、同人分镜参考、涂色底稿、旅行照二创。用别人的照片做素材前，请确认自己有使用权。

### 英文原版

```
Convert the input photo into a black-and-white manga-style line drawing.
```

> 改编自 [@nobisiro_2023](https://x.com/nobisiro_2023/status/1961231347986698371) 发布、[PicoTrex/Awesome-Nano-Banana-images](https://github.com/PicoTrex/Awesome-Nano-Banana-images) 收录的提示词，仓库许可证 Apache-2.0。
