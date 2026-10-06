---
title: AI电商提示词：微缩小人"施工"的创意产品主图（gpt-image-2）
slug: miniature-diorama-product
model: gpt-image-2
topics: [ecommerce, poster]
aspectRatio: "1:1"
needsRefImage: false
useCase: 给护肤品、饮料、零食等单品做一张"微缩工人打造产品"的创意广告图，用于店铺海报、社交平台种草图。
prompt: |
  一张超写实的微缩场景产品广告图：一个放大的[护肤乳液泵头瓶]，瓶身标签写着"[品牌名]"，放在一个圆形展台上。许多穿黄色工作服、戴白色安全帽的微缩小人围着产品"施工"：有人爬脚手架，有人拿滚筒刷给瓶身刷漆，有人操作小塔吊，有人从迷你平板货车上卸货。场景里还有金属脚手架、小储罐、橙色路锥、木制路障和小油桶。
  整体配色为[米色、奶油色和金色]，棚拍风格，柔和漫射光，干净的[米色]背景。
  画面寓意：工人们在"打造"一件完美的产品。移轴微缩摄影质感，细节丰富，商业产品摄影，照片级 CGI 渲染。
negativePrompt: null
source:
  repo: EvoLinkAI/awesome-gpt-image-2-API-and-Prompts
  url: https://x.com/Strength04_X/status/2048074514278563949
  author: "@Strength04_X"
  license: CC0 1.0
  licenseUrl: https://creativecommons.org/publicdomain/zero/1.0/
  changes: 英文原文译为中文；产品、品牌名、配色、背景色改为变量；删去原文中的虚构品牌全称和"8K"等分辨率词
imageBrief: 用一个站长自己虚构的品牌名（不得使用真实商标），生成 2 张：护肤乳液瓶一版，"[护肤乳液泵头瓶]"换成"易拉罐饮料"、配色换成"红色和白色"一版。
images:
  - 05-miniature-diorama-product-1.jpg
imageCredit:
  by: "@Strength04_X"
  url: https://x.com/Strength04_X/status/2048074514278563949
  license: CC0 1.0
verify:
  - 在 gpt-image-2 上实测 3 次，记录品牌名文字是否正确、小人数量和动作是否清晰
  - 上传真实产品照片并加"产品外观以上传图为准"时，包装是否能保持一致
  - 确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）
---
**怎么填变量**：[护肤乳液泵头瓶] 写清产品形状和材质，例如"磨砂玻璃香水瓶"；[品牌名] 用短的英文或 2–4 个汉字，字越少越不容易写错；配色最好取自产品包装本身。

**想保留真实包装**：把产品照片一起上传，并在开头加一句"产品外观、标签和颜色以我上传的图片为准"。

**常见失败与调整**：
- 小人太少或像玩具贴纸：加"至少 15 个小人，比例约为产品高度的十分之一"。
- 标签文字错乱：改短品牌名，或生成后在修图软件里替换标签。

**适合 / 不适合**：适合创意海报、详情页氛围图；不适合需要如实反映规格的主图，电商平台对主图有具体规范，以平台规则为准。

> 改编自 [@Strength04_X](https://x.com/Strength04_X/status/2048074514278563949) 发布、[EvoLinkAI/awesome-gpt-image-2-API-and-Prompts](https://github.com/EvoLinkAI/awesome-gpt-image-2-API-and-Prompts) 收录的提示词，仓库许可证 CC0 1.0。
