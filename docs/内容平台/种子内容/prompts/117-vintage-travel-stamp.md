---
title: 复古旅行邮票提示词：把城市画成一枚收藏级纪念邮票（gpt-image-2）
slug: vintage-travel-stamp
model: gpt-image-2
topics: [poster, illustration]
aspectRatio: "4:3"
needsRefImage: false
useCase: 把一座城市或一次旅行画成带齿孔、邮戳的复古邮票，适合旅行纪念、文创周边和社交平台封面。
prompt: |
  复古旅行邮票设计，主题是[东京 · 日本]。超精细的纪念邮票插画，正中央用优雅的装饰艺术风衬线大字写"[TOKYO]"。
  画面包含[东京]的标志性地标和天际线、传统建筑、当地风景元素（根据地点选择[樱花 / 船只 / 街道 / 山峦]），温暖的电影感光线，柔和的粉彩天空。
  复古航空邮件风格，做旧纸张纹理，雕版印刷质感，奢华复古旅游海报气质，繁复的装饰花边。
  邮戳：盖有当地语言和英文的邮政戳，面值"[3.50]"。
  对称构图，线条精细，整体采用低饱和的[红色与奶油色]配色，怀旧集邮艺术，高级收藏邮票质感，真实的阴影，带油墨印刷纹理，邮票四周有齿孔边。
negativePrompt: null
source:
  repo: EvoLinkAI/awesome-gpt-image-2-API-and-Prompts
  url: https://x.com/iamsofiaijaz/status/2054530631187788035
  author: "@iamsofiaijaz"
  license: CC0 1.0
  licenseUrl: https://creativecommons.org/publicdomain/zero/1.0/
  changes: 英文模板译为中文；城市、标题文字、风景元素、面值与配色改为变量；补充"四周有齿孔边"
images:
  - 117-vintage-travel-stamp-1.jpg
imageCredit:
  by: "@iamsofiaijaz"
  url: https://x.com/iamsofiaijaz/status/2054530631187788035
  license: CC0 1.0
verify:
  - 在 gpt-image-2 上实测 3 次，记录成功率与最常见的失败形式
  - 标题拼写与面值数字是否正确
  - 换国内城市（如西安、杭州）效果是否稳定
  - 确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）
---
**怎么填变量**：[东京 · 日本] 和 [TOKYO] 一起改；风景元素按城市挑 2–3 个（杭州写"西湖、断桥、龙井茶园"）。[3.50] 是邮票面值，可以写成"80 分""1.20 元"更有本地感。配色一次只给两种主色。

**常见问题**：
- 文字太多太乱：邮戳和面值是最容易出错的小字，出错就删掉"当地语言"，只留英文。
- 不像邮票、像海报：强调"整张图就是一枚邮票，四周有齿孔、放在纸面上"。
- 想做一套：同一提示词只改城市，配色保持一致，就能得到风格统一的系列邮票。

**提醒**：这是装饰性的"纪念邮票风"插画，不是真实邮票，不能用于邮寄。

### 英文原版

```text
Vintage travel postage stamp design featuring [CITY / COUNTRY], ultra-detailed illustrated souvenir stamp, elegant art deco typography spelling “[NAME]” across the center in large ornate serif letters, iconic landmarks and skyline of [PLACE], traditional cultural architecture, scenic local elements, palm trees / boats / streets / mountains depending on location, warm cinematic lighting, soft pastel sky, retro airmail aesthetics, aged paper texture, engraved print style, luxurious vintage tourism poster feel, intricate ornamental borders, postal cancellation mark with local language and English text, “3.50 AED” denomination, symmetrical composition, highly detailed linework, muted [COLOR PALETTE] color scheme, nostalgic philatelic artwork, premium collectible stamp aesthetic, realistic shading, textured ink print, retro travel poster style, 4k illustration, highly detailed vintage engraving.
```

> 改编自 [@iamsofiaijaz](https://x.com/iamsofiaijaz/status/2054530631187788035) 发布、[EvoLinkAI/awesome-gpt-image-2-API-and-Prompts](https://github.com/EvoLinkAI/awesome-gpt-image-2-API-and-Prompts) 收录的提示词，仓库许可证 CC0 1.0；示例图同样来自该仓库收录的原帖出图。
