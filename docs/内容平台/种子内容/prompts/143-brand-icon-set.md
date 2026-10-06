---
title: 图标设计提示词：为品牌 / App 生成风格统一的一整套图标（gpt-image-2）
slug: brand-icon-set
model: gpt-image-2
topics: [logo]
aspectRatio: "1:1"
needsRefImage: false
useCase: 一次生成同一视觉语言的整套功能图标，适合小程序、App 首页金刚区、品牌官网和 PPT 图标素材。
prompt: |
  为[品牌名]设计一套迷人、有表现力、风格统一的图标，[品牌名]是一家[宠物用品]公司。
  视觉风格：[圆润的 3D 风格]，配色[柔和粉彩]。
  加入[柔和阴影、细微纹理]，营造温暖、现代的感觉。
  所有图标共用同一套网格、比例和设计语言，保持一致的视觉系统。
  图标覆盖以下功能：[首页、商城、订单、优惠券]、[客服、会员、宠物档案、设置]。
  优先保证清晰易认、间距均衡，并能在界面、App 和品牌场景中缩放使用。
  排列：[4 × 2] 网格，白色背景，每个图标下方不加文字。
negativePrompt: null
source:
  repo: EvoLinkAI/awesome-gpt-image-2-API-and-Prompts
  url: https://x.com/iamaiistudio/status/2069150843430215859
  author: "@iamaiistudio"
  license: CC0 1.0
  licenseUrl: https://creativecommons.org/publicdomain/zero/1.0/
  changes: 英文模板译为中文；品牌、行业、风格、配色、质感和功能列表改为变量；补充排列方式
imageBrief: 用虚构品牌"毛球铺"（宠物用品）按默认变量生成 1 张 1:1 图标总览；另用"扁平线性 + 单色"风格生成 1 张对比。
verify:
  - 在 gpt-image-2 上实测 3 次，记录成功率与最常见的失败形式
  - 图标数量与功能列表是否一致
  - 各图标线宽、圆角、配色是否统一
  - 确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）
---
**怎么填变量**：功能列表 6–12 个最合适，用名词写（"订单"而不是"查看我的订单"）。风格常用组合：圆润 3D + 粉彩（年轻、可爱）、扁平线性 + 单色（简洁、工具类）、玻璃拟态 + 渐变（科技感）。

**常见问题**：
- 图标风格不统一：强调"共用同一套网格、线宽和圆角"。
- 图标含义看不懂：在功能后面加提示，如"客服（耳机图标）"。
- 直接上线使用：AI 生成的是位图，需要矢量化（或交给设计师描摹）后才能在不同尺寸下清晰使用。

**迭代**：先定 1 个满意的图标风格，再追问"保持完全相同的风格，补充 4 个图标：……"。

### 英文原版

```text
Design a unified set of charming, expressive icons for [BRAND NAME], a [BRAND TYPE/INDUSTRY] company. The visual style should be [STYLE KEYWORDS: e.g., rounded, 3D, flat, hand-drawn, minimal] paired with a [COLOR STYLE: vibrant, pastel, gradient, monochrome] color scheme. Apply [DESIGN TRAITS: soft shadows, bold outlines, subtle textures, glow, etc.] to achieve a warm and contemporary look. Keep a consistent visual system across all icons using shared grids, proportions, and design language. The icon set should cover [LIST OF FEATURES/FUNCTIONS]. Prioritize sharp legibility, well-balanced spacing, and scalability across UI, apps, and branding contexts.
```

> 改编自 [@iamaiistudio](https://x.com/iamaiistudio/status/2069150843430215859) 发布、[EvoLinkAI/awesome-gpt-image-2-API-and-Prompts](https://github.com/EvoLinkAI/awesome-gpt-image-2-API-and-Prompts) 收录的提示词，仓库许可证 CC0 1.0。
