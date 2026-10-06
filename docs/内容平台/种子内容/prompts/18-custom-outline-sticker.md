---
title: nano banana 玩法：人物照变白色描边贴纸（参考图定风格）
slug: custom-outline-sticker
model: nano-banana
topics: [sticker]
needsRefImage: true
useCase: 上传一张人物照和一张贴纸风格参考图，把人物做成同款白描边贴纸，配一句俏皮短语。
prompt: |
  帮我把图1中的人物变成类似图2那样的白色描边贴纸。人物转换成[扁平网页插画]风格，并在旁边加一句描述图1人物的俏皮短语，短语也用白色描边："[短语]"。
negativePrompt: null
source:
  repo: PicoTrex/Awesome-Nano-Banana-images
  url: https://x.com/op7418/status/1960385812132192509
  author: "@op7418"
  license: Apache-2.0
  licenseUrl: https://www.apache.org/licenses/LICENSE-2.0
  changes: 原文由模型自行编写短语，本站增加了[短语]变量（也可删掉引号部分让模型发挥）；插画风格改为变量
imageBrief: 需要两张输入：图1 用站长本人（或已同意的同事）一张半身照；图2 用站长自己先生成的一张白描边贴纸作风格参考（不得使用他人作品）。生成 2 张：[短语] 自填"今天也要早睡"一版，删掉短语交给模型发挥一版。
images:
  - 18-custom-outline-sticker-1.jpg
  - 18-custom-outline-sticker-2.jpg
imageCredit:
  by: "@op7418"
  url: https://x.com/op7418/status/1960385812132192509
  license: Apache-2.0
verify:
  - 在 Gemini 应用中用 nano banana 实测 3 次，记录是否误把图2里的内容复制进来
  - 中文短语错字率
  - 确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）
---
**怎么用**：这条需要两张图，图1 是要变成贴纸的人，图2 是你想要的贴纸样子。上传顺序要和提示词里的"图1""图2"对应。

**怎么填变量**：[扁平网页插画] 可换成"Q版手绘""美式卡通"等；[短语] 建议 4–8 个字。想让模型自己编，就把冒号后面的引号和短语一起删掉。

**常见失败与调整**：
- 图2 里的人物或文字被搬过来：在末尾补"只参考图2的描边和画风，不要使用图2里的人物和文字"。
- 不像本人：图1 选正脸清晰的照片。
- 短语错字：改短，或生成后自己替换。

**适合 / 不适合**：适合做个人表情包、社群头像。图2 风格参考图请用自己有权使用的图片。

> 改编自 [@op7418](https://x.com/op7418/status/1960385812132192509) 发布、[PicoTrex/Awesome-Nano-Banana-images](https://github.com/PicoTrex/Awesome-Nano-Banana-images) 收录的提示词，仓库许可证 Apache-2.0。
