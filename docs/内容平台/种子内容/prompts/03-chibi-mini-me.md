---
title: gpt-image-2 玩法：照片周围长出 Q 版 3D 迷你小人
slug: chibi-mini-me
model: gpt-image-2
topics: [portrait, figurine]
needsRefImage: true
useCase: 在自己的生活照上加几个 Q 版 3D 小人"住进"画面，适合朋友圈、小红书配图。
prompt: |
  保持我上传的这张照片本身完全不变，在照片中人物的周围加入[3]个 Q 版 3D 迷你版的同一个人：有的坐着、有的在攀爬、有的在和[咖啡杯]互动。迷你小人要有真实的投影和前后景深，看起来像真的待在画面里。
  在画面空白处加一行柔和的手写字："[小小的我，过着安静的日子]"。
  在一个小道具上再加一小段手写字："[你可以的 ♡]"。
  整体有电影感、温馨，适合发社交平台。
negativePrompt: null
source:
  repo: EvoLinkAI/awesome-gpt-image-2-API-and-Prompts
  url: https://x.com/miratechtool/status/2051691169592033488
  author: "@miratechtool"
  license: CC0 1.0
  licenseUrl: https://creativecommons.org/publicdomain/zero/1.0/
  changes: 英文原文译为中文；迷你小人数量、互动物品和两段手写文字改为变量；原文英文短句改为中文示例
imageBrief: 用站长本人（或已同意的同事）一张桌边 / 窗边的半身生活照作输入；输出 2 张：一张按默认变量，一张把互动物品换成"笔记本电脑"；附原图对比。
images:
  - 03-chibi-mini-me-1.jpg
imageCredit:
  by: "@miratechtool"
  url: https://x.com/miratechtool/status/2051691169592033488
  license: CC0 1.0
verify:
  - 在 gpt-image-2 上实测 3 次，记录原图主体是否被改动、小人是否像本人
  - 中文手写字是否有错字或笔画缺失
  - 确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）
---
**怎么填变量**：[3] 建议 2–4 个，太多画面会乱；[咖啡杯] 换成照片里本来就有的物品，小人和它互动会更自然；两段手写字尽量短，10 个字以内。

**常见失败与调整**：
- 原图里的人被改了：开头那句"保持照片本身完全不变"不要删，必要时再补一句"只新增小人和文字"。
- 小人不像本人：原图人物脸部要清晰；可以加"小人的发型和衣服与原图人物一致"。
- 中文字写错：AI 图中的中文仍可能出错，生成后逐字核对，错了就换更短的句子重试。

**适合 / 不适合**：适合生活照、旅行照、工位照；多人合照效果不稳定，不建议使用。

> 改编自 [@miratechtool](https://x.com/miratechtool/status/2051691169592033488) 发布、[EvoLinkAI/awesome-gpt-image-2-API-and-Prompts](https://github.com/EvoLinkAI/awesome-gpt-image-2-API-and-Prompts) 收录的提示词，仓库许可证 CC0 1.0。
