---
title: AI品牌设计提示词：没有 Logo 也能生成整套品牌 VI 提案板（gpt-image-2）
slug: brand-identity-showcase-board
model: gpt-image-2
topics: [logo, poster]
aspectRatio: "1:1"
needsRefImage: false
useCase: 新品牌还没有 Logo 时，只写品牌名、行业和调性，就能一次看到 Logo 草案、字体、配色、App 图标、包装、海报、周边等十几种应用的统一视觉方向，适合做提案初稿和找感觉。
prompt: |
  为一个虚构品牌"[品牌名：Moss Radio]"制作一张方形的高端品牌视觉识别（VI）提案展示板。
  品牌定位：做[独立音响硬件 + 咖啡零售]，目标人群是[创意工作者和音乐发烧友]；品牌气质：[复古、有文化感、温暖、有触感、重设计]，整体怀旧但现代。
  用精致的模块化网格排版，每一格展示同一套视觉系统的一种应用，包括：Logo 草案、文字标、App 图标变体、品牌海报、产品卡片、官网首屏片段、包装概念、字体样张、界面小组件、配色展示、贴纸系统、辅助图案、品牌样机，以及几格表现动态感的小构图。
  设计语言：[瑞士风格字体]、[圆润的工业感形状]；配色固定为[苔藓绿 / 羊皮纸白 / 炭黑 / 铜色]，所有格子只用这几种颜色。
  版面信息密集但优雅，对齐精准，层级清晰，像顶级设计公司作品集里的品牌案例页。
  所有文字只使用品牌名和与[行业]相关的简短英文标语，不要出现真实存在的其他品牌、商标或网址。
negativePrompt: null
source:
  repo: wuyoscar/GPT-Image2-Skill
  url: https://x.com/LexnLin/status/2046952493213429886
  author: "@LexnLin"
  license: MIT
  licenseUrl: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/LICENSE
  changes: 英文原文译为中文；品牌名、业务、目标人群、气质、字体与形状语言、配色均改为变量；补充"只用固定配色""不出现真实品牌与网址"的约束
images:
  - 502-brand-identity-showcase-board-1.jpg
imageCredit:
  by: "wuyoscar/GPT-Image2-Skill"
  url: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/docs/brand-systems-identity/brand-identity-moss-radio.png
  license: MIT
verify:
  - 品牌名在各个格子里是否拼写一致（示例图中个别小字为装饰性占位）
  - 换成中文品牌名时字形是否正确，错字多时建议品牌名用英文或拼音
  - 示例图里出现的字体名、价格、地址为模型生成的装饰文字，上线前确认页面说明里已提示"仅供参考"
  - 确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）
---
**和"上传 Logo 生成 VI 规范"的区别**：那条需要你已经有 Logo；这条从零开始，适合品牌刚起名、还在找方向的阶段，出图后挑一个喜欢的 Logo 草案，再用本站"上传 Logo 生成品牌 VI 规范展示板"那条提示词扩展成正式规范。

**怎么填变量**：品牌名建议 1–2 个英文单词；定位一句话写清"卖什么 + 卖给谁"；气质写 3–5 个形容词即可。配色一定写死 3–5 个颜色，不然每一格颜色会跑偏。

**常见问题**：
- 格子太多、字糊成一片：把应用清单删到 8–10 项，或改成 16:9 横版。
- 风格太像现成模板：在气质里加一个具体参照，例如"日本独立杂志""北欧家居品牌"。
- 示例图里的价格、字体名、地址都是模型编的装饰文字，正式提案前要替换成真实信息。

### 英文原版

```text
Create a square high-end brand identity showcase board for a fictional brand called "Moss Radio". The brand should feel analog, cultured, warm, tactile, and design-forward. It operates in independent audio hardware and café-retail and should appeal to creative professionals and music obsessives. The overall mood should be nostalgic but modern. Design a polished modular grid of multiple tiles, each showing a different application of one cohesive visual identity system. Include logo explorations, wordmarks, app icon variations, editorial posters, product cards, landing page fragments, packaging concepts, typography specimens, interface snippets, color palette presentations, sticker systems, patterns, branded mockups, and small motion-inspired compositions. Use Swiss-inspired typography, rounded industrial shapes, and a moss green / parchment / charcoal / copper palette. Dense but elegant layout, sharp alignment, strong hierarchy, premium case-study presentation.
```

> 改编自 [@LexnLin](https://x.com/LexnLin/status/2046952493213429886) 发布、[wuyoscar/GPT-Image2-Skill](https://github.com/wuyoscar/GPT-Image2-Skill) 图库「Brand Systems & Identity」收录的提示词，Copyright (c) 2026 Wuyoscar，[MIT License](https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/LICENSE)；示例图来自该仓库。
