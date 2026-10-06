---
title: AI贴纸提示词：照片一键转模切贴纸（gpt-image-2）
slug: die-cut-sticker
model: gpt-image-2
topics: [sticker]
aspectRatio: "1:1"
needsRefImage: true
useCase: 把宠物、自拍、手作物品照片做成带白边的模切贴纸效果，用于表情包、手账素材、周边打样参考。
prompt: |
  把我上传的图片做成一张精致的模切贴纸插画，主体要一眼能认出来。
  去掉或简化原背景，把主体干净地单独抠出来；沿主体轮廓加一圈厚实的[奶油色]贴纸白边，并加一点真实的投影，让贴纸像悬浮在纯色[浅灰色]背景上。
  保留主体的重要纹理和细节，同时做轻度风格化：颜色更饱满，对比更有层次，整体像杂志插画一样干净精致。
  如需文字，在贴纸白边下沿加一行手写字"[贴纸文字]"；不需要文字就删掉这一行。
  画面里只有这一张贴纸，不要其他装饰。
negativePrompt: null
source:
  repo: EvoLinkAI/awesome-gpt-image-2-API-and-Prompts
  url: https://x.com/Ciri_ai/status/2056616223547548106
  author: "@Ciri_ai"
  license: CC0 1.0
  licenseUrl: https://creativecommons.org/publicdomain/zero/1.0/
  changes: 英文原文译为中文；原文在仓库中末尾被截断（止于"polished editorial l…"），截断之后的内容由本站补写；白边颜色、背景色、贴纸文字改为变量，新增"只有一张贴纸"约束
imageBrief: 用站长自己拍的宠物照或一件小物品照片作输入（不要用他人照片），生成 2 张：无文字一版，[贴纸文字] 填"摸鱼中"一版；附原图对比。
images:
  - 11-die-cut-sticker-1.jpg
imageCredit:
  by: "@Ciri_ai"
  url: https://x.com/Ciri_ai/status/2056616223547548106
  license: CC0 1.0
verify:
  - 在 gpt-image-2 上实测 3 次，记录主体相似度和白边是否完整闭合
  - gpt-image-2 能否直接输出透明背景 PNG（以 OpenAI 官方说明为准），不能的话正文要写明需自行抠图
  - 确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）
---
**怎么填变量**：[奶油色] 也可以写"纯白色"，更像传统贴纸；[浅灰色] 背景只是展示用，选和白边对比明显的颜色；[贴纸文字] 建议 2–6 个字。

**常见失败与调整**：
- 主体被画成别的样子：加"主体外形、花纹、颜色与原图一致，只做轻度风格化"。
- 白边断开或粗细不均：补一句"白边宽度均匀、完整包住整个轮廓"。
- 想做成微信表情：一张图只放一个表情，连续生成多张，再用表情包工具裁成需要的尺寸；平台对尺寸和格式有要求，以平台规则为准。

**适合 / 不适合**：适合轮廓清楚的单个主体；多人合照、杂乱背景的照片抠得不干净。实际打印贴纸还需要裁切线和矢量文件，AI 图只能当效果参考。

> 改编自 [@Ciri_ai](https://x.com/Ciri_ai/status/2056616223547548106) 发布、[EvoLinkAI/awesome-gpt-image-2-API-and-Prompts](https://github.com/EvoLinkAI/awesome-gpt-image-2-API-and-Prompts) 收录的提示词，仓库许可证 CC0 1.0。
