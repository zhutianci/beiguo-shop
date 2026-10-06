---
title: AI Logo 提示词：上传 Logo 生成品牌 VI 规范展示板（gpt-image-2）
slug: brand-guideline-board
model: gpt-image-2
topics: [logo]
aspectRatio: "16:9"
needsRefImage: true
useCase: 已经有 Logo、想快速看到整套品牌视觉（配色、字体、样机）的提案效果，适合小店、工作室、个人品牌做方案草图。
prompt: |
  用我上传的[品牌名] Logo，生成一张品牌设计公司水准的品牌视觉识别（VI）规范展示板，要像可以直接拿给客户看的提案页，而不是概念草图。
  先分析 Logo，推断出 3 个品牌个性关键词，再据此设计：
  1. 色彩系统：从 Logo 中提取主色 3–5 个、辅助色 3–5 个和强调色，每个色块标注 HEX 色值和用途（主色 / 界面 / 高亮 / 背景），并展示渐变和配色组合。
  2. 字体系统：按品牌调性选字体风格（奢华用优雅衬线，科技用几何无衬线，潮流用粗体窄字，企业用干净的中性无衬线），展示标题、副标题、正文三级，示例文字用与[行业]相关的真实文案，不用占位符。
  3. 视觉语言：3–5 张风格示意图，体现图片风格、光线和情绪。
  4. 应用样机：包装或产品、官网首屏、手机界面、3 张社交媒体图、名片、户外广告牌，全部风格统一。
  5. 图标：6–10 个从 Logo 衍生的图标，风格统一。
  6. 辅助图形：从 Logo 形状衍生的图案和背景。
  版式：网格清晰，层级分明，留白有控制，元素丰富但不杂乱。
  禁止：占位文字、千篇一律的模板界面、风格不统一、随意配色。Logo 本身的形状和颜色不得修改。
negativePrompt: null
source:
  repo: EvoLinkAI/awesome-gpt-image-2-API-and-Prompts
  url: https://x.com/Shorelyn_/status/2055681687284293991
  author: "@Shorelyn_"
  license: CC0 1.0
  licenseUrl: https://creativecommons.org/publicdomain/zero/1.0/
  changes: 英文原文译为中文并大幅压缩：合并原文的"智能规则""密度规则""微细节"等段落，删去间距刻度和"30–50 个元素"等硬性数量要求；新增[行业]变量和"Logo 不得修改"约束；画幅 16:9 为本站建议
imageBrief: 站长先用 AI 或自己画一个虚构品牌的简单 Logo（例如"小麦烘焙"的麦穗图形，不得使用任何真实商标），再用它作输入生成 1 张完整展示板；附 Logo 原图。
images:
  - 09-brand-guideline-board-1.jpg
imageCredit:
  by: "@Shorelyn_"
  url: https://x.com/Shorelyn_/status/2055681687284293991
  license: CC0 1.0
verify:
  - 在 gpt-image-2 上实测 3 次，记录 Logo 是否被擅自改形、HEX 色值是否与 Logo 实际颜色接近
  - 小字（字体示例、样机里的文案）是否大量乱码
  - 确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）
---
**怎么填变量**：[品牌名] 写中文或英文均可；[行业] 写得越具体，示例文案越贴切，例如"社区烘焙店"比"餐饮"好。

**准备工作**：Logo 最好是透明底或纯白底的清晰图片，分辨率不要太低。

**常见失败与调整**：
- Logo 被"重新设计"：结尾那句"Logo 形状和颜色不得修改"要保留；仍被改动就把样机数量减半。
- 色值不准：图里标注的 HEX 只是模型估计，要用取色工具从 Logo 原图取色核对。
- 小字乱码：展示板信息量大，细小文字出错很常见，适合当方向参考，不要直接当交付稿。

**适合 / 不适合**：适合提案草图、找灵感；不能代替正式 VI 手册。只用你有权使用的 Logo。

> 改编自 [@Shorelyn_](https://x.com/Shorelyn_/status/2055681687284293991) 发布、[EvoLinkAI/awesome-gpt-image-2-API-and-Prompts](https://github.com/EvoLinkAI/awesome-gpt-image-2-API-and-Prompts) 收录的提示词，仓库许可证 CC0 1.0。
