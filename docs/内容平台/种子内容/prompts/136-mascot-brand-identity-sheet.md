---
title: 品牌吉祥物设计提示词：一张图生成 18 格 IP 形象全套设定（gpt-image-2）
slug: mascot-brand-identity-sheet
model: gpt-image-2
topics: [character, logo]
aspectRatio: "3:4"
needsRefImage: false
useCase: 给小店、品牌或社群设计吉祥物，一张图得到品牌分析、草图、表情、动作、三视图、配色和周边应用的完整设定稿。
prompt: |
  生成一张"18 个板块的完整品牌识别与吉祥物设计设定图"。
  品牌：名称[沐阳茶铺]，行业[茶饮店]，品牌色[黄色]、[绿色]，辅助色白色、棕色、深绿色。
  吉祥物：[3D 渲染的可爱柴犬，系着绿色围裙]。
  版式：3 列 × 6 行网格，依次为：
  01 品牌 DNA 分析：品牌 Logo、5 个色块、6 个品牌图标、目标人群图表
  02 概念情绪板：5 张参考图、4 个氛围图标、设计概念公式
  03 形体研究：4 个 Logo 结构图标、4 步设计演变、4 个角色剪影
  04 概念探索：12 个线稿角色概念草图
  05 精修线稿：3 行正面和侧面线稿，带比例辅助线
  06 细节完善：2 个带标注的全身渲染、4 个圆形局部特写
  07 表情表：11 个 3D 渲染表情
  08 动作库：9 个 3D 渲染全身动作
  09 转面图：5 个多角度全身 3D 渲染 + 5 个对应线稿
  10 色彩开发：5 行 5 色配色方案，附色彩心理说明
  11 材质规范：5 种表面材质样本、材质属性滑块、4 个工艺图标
  12 色彩应用：4 种配色变体渲染、浅色 / 深色模式各 1、4 个对比度评级
  13 结构指南：2 张几何与网格系统线稿技术图
  14 设计规范：最小尺寸图标、安全空间示意、4 组正确 / 错误用法示例
  15 资产变体：3 种尺寸、3 种线稿风格、3 个简化的扁平头像图标
  16 数字应用：1 个 App 图标、2 个社交媒体头像、UI 组件、3 帧动画循环
  17 实物应用：毛绒玩具、产品包装、品牌周边、门店店面效果
  18 最终渲染：一张大尺寸高清 3D 吉祥物渲染图（[捧着一杯茶]），定稿 Logo，交付文件格式清单
negativePrompt: null
source:
  repo: EvoLinkAI/awesome-gpt-image-2-API-and-Prompts
  url: https://x.com/iamaiistudio/status/2066568983453880412
  author: "@iamaiistudio"
  license: CC0 1.0
  licenseUrl: https://creativecommons.org/publicdomain/zero/1.0/
  changes: 原文 JSON 改写为中文分段列表；品牌名改为中文示例，品牌名、行业、品牌色、吉祥物描述和最终动作改为变量
images:
  - 136-mascot-brand-identity-sheet-1.jpg
imageCredit:
  by: "@iamaiistudio"
  url: https://x.com/iamaiistudio/status/2066568983453880412
  license: CC0 1.0
verify:
  - 在 gpt-image-2 上实测 3 次，记录成功率与最常见的失败形式
  - 18 个板块是否齐全、标题编号是否连续
  - 各板块中的吉祥物是否为同一形象
  - 确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）
---
**怎么填变量**：[沐阳茶铺]、[茶饮店] 换成你的品牌和行业；吉祥物一句话写清"物种 / 形象 + 标志性服饰"；最终动作选和业务相关的（咖啡店"举着咖啡杯"，书店"抱着一本书"）。

**常见问题**：
- 板块太多、小图看不清：这是一张"设定总览图"，适合看整体方向；需要细节时追问"把第 07 板块表情表单独生成一张大图"。
- 中文小字乱码：板块标题可以改成英文编号 + 英文标题，正文小字乱码可以接受，正式交付前替换。
- 形象撞车：生成后用以图搜图查一下有没有过于相似的已有 IP，避免侵权。

**迭代**：先用 18 格总览定方向，再逐个板块放大精修，最后交给设计师矢量化。

### 英文原版

```text
{
  "type": "18-section complete brand identity and mascot design sheet",
  "brand": {
    "name": "{argument name=\"brand name\" default=\"MUYANG TEA\"}",
    "industry": "{argument name=\"industry\" default=\"tea shop\"}",
    "colors": ["{argument name=\"primary color\" default=\"yellow\"}", "{argument name=\"secondary color\" default=\"green\"}", "white", "brown", "dark green"]
  },
  "subject": "{argument name=\"character description\" default=\"3D rendered cute Shiba Inu mascot wearing a green apron\"}",
  "layout": {
    "grid": "3-column by 6-row grid layout",
    "sections": [
      {
        "title": "01 BRAND DNA ANALYSIS",
        "elements": ["brand logo", "5 color swatches", "6 brand icons", "target audience charts"]
      },
      {
        "title": "02 CONCEPT MOODBOARD",
        "elements": ["5 reference photos", "4 mood icons", "design concept equation"]
      },
      {
        "title": "03 FORM STUDY",
        "elements": ["4 logo anatomy icons", "4 design evolution steps", "4 character silhouettes"]
      },
      {
        "title": "04 CONCEPT EXPLORATION",
        "elements": ["12 line-art character concept sketches"]
      },
      {
        "title": "05 REFINED LINE ART",
        "elements": ["3 rows of front and side view line art with proportion guides"]
      },
      {
        "title": "06 DETAIL REFINEMENT",
        "elements": ["2 full-body renders with annotation labels", "4 circular close-up views"]
      },
      {
        "title": "07 EXPRESSION SHEET",
        "elements": ["11 3D rendered facial expressions"]
      },
      {
        "title": "08 POSE LIBRARY",
        "elements": ["9 full-body 3D rendered character poses"]
      },
      {
        "title": "09 TURNAROUND VIEW",
        "elements": ["5 full-body 3D renders from multiple angles", "5 matching line-art views"]
      },
      {
        "title": "10 COLOR DEVELOPMENT",
        "elements": ["5 rows of 5-color palette options", "color psychology explanations"]
      },
      {
        "title": "11 MATERIAL SPECIFICATION",
        "elements": ["5 surface texture swatches", "material property sliders", "4 manufacturing process icons"]
      },
      {
        "title": "12 COLOR APPLICATION",
        "elements": ["4 color scheme variant renders", "2 light and dark mode renders", "4 contrast rating indicators"]
      },
      {
        "title": "13 CONSTRUCTION GUIDE",
        "elements": ["2 line-art technical diagrams for geometry and grid system"]
      },
      {
        "title": "14 DESIGN SYSTEM RULES",
        "elements": ["minimum size icons", "clear space diagram", "4 correct and incorrect usage examples"]
      },
      {
        "title": "15 ASSET VARIANTS",
        "elements": ["3 scaled size variants", "3 line-art style variants", "3 simplified flat icon heads"]
      },
      {
        "title": "16 DIGITAL APPLICATIONS",
        "elements": ["1 app icon design", "2 social media avatar versions", "UI component elements", "3-frame animation cycle"]
      },
      {
        "title": "17 PHYSICAL APPLICATIONS",
        "elements": ["plush toy product mockup", "product packaging mockup", "branded merchandise mockup", "retail storefront mockup"]
      },
      {
        "title": "18 FINAL RENDERING",
        "elements": ["large high-resolution 3D mascot render holding tea cup", "finalized logo", "deliverable file format list"]
      }
    ]
  }
}
```

> 改编自 [@iamaiistudio](https://x.com/iamaiistudio/status/2066568983453880412) 发布、[EvoLinkAI/awesome-gpt-image-2-API-and-Prompts](https://github.com/EvoLinkAI/awesome-gpt-image-2-API-and-Prompts) 收录的提示词，仓库许可证 CC0 1.0；示例图同样来自该仓库收录的原帖出图。
