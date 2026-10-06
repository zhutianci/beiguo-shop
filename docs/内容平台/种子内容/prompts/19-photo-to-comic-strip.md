---
title: nano banana 漫画提示词：一张照片生成多格漫画条幅
slug: photo-to-comic-strip
model: nano-banana
topics: [comic]
needsRefImage: true
useCase: 以照片里的人或宠物为主角，生成一条带对白的短篇漫画，适合朋友圈、生日祝福、宠物账号。
prompt: |
  基于我上传的图片，制作一个[4格]漫画条幅：以图中的[人物]为主角，写一个引人入胜的[奇幻冒险]小故事，每格配对白气泡和简短旁白。
  主角的外貌、发型和衣着在每一格保持一致；画风为[彩色美式漫画]；对白使用[简体中文]，每句不超过 12 个字。
negativePrompt: null
source:
  repo: PicoTrex/Awesome-Nano-Banana-images
  url: https://x.com/icreatelife/status/1961977580849873169
  author: "@icreatelife"
  license: Apache-2.0
  licenseUrl: https://www.apache.org/licenses/LICENSE-2.0
  changes: 原文为"基于上传的图像制作漫画书条幅，添加文字，写一个引人入胜的故事，我想要一本奇幻漫画书"；本站把格数、主角、题材、画风、语言改为变量，并补充了角色一致性和对白长度要求
imageBrief: 用站长自家宠物照片作输入，生成 2 张：[奇幻冒险] 一版，[奇幻冒险] 换成"办公室日常"、[彩色美式漫画] 换成"日式黑白漫画"一版。
images:
  - 19-photo-to-comic-strip-1.jpg
  - 19-photo-to-comic-strip-2.jpg
imageCredit:
  by: "@icreatelife"
  url: https://x.com/icreatelife/status/1961977580849873169
  license: Apache-2.0
verify:
  - 在 Gemini 应用中用 nano banana 实测 3 次，记录格数是否正确、主角是否前后一致
  - 中文对白气泡的错字率（如错字多，正文建议先写好台词）
  - 确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）
---
**怎么填变量**：[4格] 建议 3–6 格，格子越多每格越小、字越容易错；[人物] 可以写"小狗""穿红衣服的女孩"；[奇幻冒险] 换成任何题材，如"职场吐槽""校园日常"。

**更稳的写法**：先自己（或让 ChatGPT）写好每一格的剧情和台词，再接在提示词后面："第1格：……；第2格：……"。这样故事更可控，错字也更少。

**常见失败与调整**：
- 主角每格长得不一样：减少格数，或在开头强调"同一个主角"。
- 对白气泡里是乱码：把台词缩短，或改为不加对白，后期自己加字。

**适合 / 不适合**：适合轻松的小故事；不适合长篇连载。照片里有他人时，分享前先征得同意。

> 改编自 [@icreatelife](https://x.com/icreatelife/status/1961977580849873169) 发布、[PicoTrex/Awesome-Nano-Banana-images](https://github.com/PicoTrex/Awesome-Nano-Banana-images) 收录的提示词，仓库许可证 Apache-2.0。
