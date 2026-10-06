---
title: gpt-image-2 Logo 提示词：金属浮雕质感 Logo 展示图
slug: embossed-metal-logo
model: gpt-image-2
topics: [logo]
aspectRatio: "1:1"
needsRefImage: true
useCase: 把平面 Logo 做成硬币压印般的金属浮雕效果，用于官网横幅、社交头像、包装概念图。
prompt: |
  请以资深 CGI 艺术家的水准，把我上传的[品牌名] Logo 做成高级的浅浮雕展示图：Logo 像硬币压印、金属印章那样从金属表面向外凸起，和表面是一体的。Logo 的形状、比例与上传图完全一致，不得增删笔画。
  表面：整张画面是一块连续的[香槟金]材质（银灰对应拉丝钢，金色对应暖色拉丝金属，黑色对应阳极氧化铝，白色对应哑光陶瓷，彩色对应彩色阳极氧化金属），带放射状拉丝纹理和细腻的胶片颗粒。
  浮雕：Logo 整体以统一高度凸起，顶面微微隆起、能接住主光；边缘是平滑倒角；Logo 内部的镂空部分回落到表面高度；凸起厚度像一枚厚硬币。
  光线：主光为左上方（10–11 点钟方向）大面积柔光；色温随材质变化（银色系冷白，金铜色系暖琥珀，黑白中性）；右下方 10–15% 强度补光，不要硬阴影。
  文字：浮雕下方同一表面上做极简文字组合：一个小图标、字距加宽的品牌名"[品牌英文名]"、一行细斜体说明"[创立年份或口号]"，居中竖排。
  渲染：自阴影真实，全画面清晰，颗粒统一，无色差。Logo 必须看起来是向外凸出，而不是刻进去。
negativePrompt: null
source:
  repo: EvoLinkAI/awesome-gpt-image-2-API-and-Prompts
  url: https://x.com/iamaiistudio/status/2063065673740497022
  author: "@iamaiistudio"
  license: CC0 1.0
  licenseUrl: https://creativecommons.org/publicdomain/zero/1.0/
  changes: 英文原文译为中文；原文只填品牌名，本站改为上传 Logo 并新增"形状不得增删笔画"的约束；材质颜色、品牌英文名、说明文字改为变量；删去"开启光线追踪"等渲染器术语
imageBrief: 用 09 号提示词里同一个虚构品牌 Logo 作输入，生成 2 张：香槟金一版、黑色阳极氧化铝一版。
images:
  - 10-embossed-metal-logo-1.jpg
imageCredit:
  by: "@iamaiistudio"
  url: https://x.com/iamaiistudio/status/2063065673740497022
  license: CC0 1.0
verify:
  - 在 gpt-image-2 上实测 3 次，记录 Logo 形状保真度、是否出现"凹刻"而非"凸起"
  - 中文品牌名做浮雕文字时是否清晰（目前只写了英文名变量）
  - 确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）
---
**怎么填变量**：[香槟金] 可换成"拉丝银""哑光黑""白色陶瓷"等，括号里的材质对应说明不用删，模型会据此选质感；[品牌英文名] 建议用全大写英文；[创立年份或口号] 如"EST. 2026"。

**常见失败与调整**：
- Logo 被改形：复杂 Logo（细线多、字多）更容易走样，先用最简洁的图形标志试；仍走样就去掉下方文字组合，只做浮雕。
- 做成了凹刻：结尾那句"向外凸出"不要删，可以再加"像硬币正面的人像那样凸起"。
- 画面发灰：把补光强度改为 20%。

**适合 / 不适合**：适合有清晰图形标志的品牌；纯文字 Logo、渐变色 Logo 效果一般。只用你有权使用的 Logo。

> 改编自 [@iamaiistudio](https://x.com/iamaiistudio/status/2063065673740497022) 发布、[EvoLinkAI/awesome-gpt-image-2-API-and-Prompts](https://github.com/EvoLinkAI/awesome-gpt-image-2-API-and-Prompts) 收录的提示词，仓库许可证 CC0 1.0。
