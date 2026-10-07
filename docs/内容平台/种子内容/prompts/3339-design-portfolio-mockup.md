---
title: logo设计提示词：平面设计作品集展示样机（书桌 + 笔记本电脑 + 海报墙 + 项目卡片）
slug: design-portfolio-mockup
model: gpt-image-2
topics: [logo, product-design]
needsRefImage: false
aspectRatio: "4:3"
useCase: 设计师想做作品集封面、个人工作室主页头图或接单宣传图时用，生成一张黑白米色调、像高端工作室摆拍的作品集展示场景。
prompt: |
  生成一张高端平面设计作品集样机，专业创意工作室风格。
  - 画面：干净优雅的工作台展示，多张设计项目卡片整齐排成网格，一台现代笔记本电脑屏幕显示作品集主页，几张打印海报平铺在桌上、挂在墙上；
  - 整体是创意总监式的精致审美：柔和投影、轻微纵深、真实材质、高级工作室氛围；
  - 桌面道具：排版占位字样、品牌样稿、编辑风海报、名片、文具、笔记本、钢笔、咖啡杯、台灯、一盆小绿植；
  - 配色：中性高级色，黑、白、暖米、灰、香槟、奶油色；
  - 电脑屏幕：极简的作品集界面，有项目缩略图、导航菜单和醒目的首屏大字"[首屏标语]"；
  - 项目卡片内容：[标志、品牌、海报、包装、UI设计]、社媒、广告等；
  - 工作室名称"[工作室名]"可以出现在名片、笔记本和网页 Logo 上；
  - 现代极简、细节锐利、字体干净、构图优雅，像高端创意机构的提案展示；
  - 画幅[4:3]。
negativePrompt: null
source:
  repo: EvoLinkAI/awesome-gpt-image-2-API-and-Prompts
  url: https://x.com/abs_uiux/status/2054594512983310572
  author: "@abs_uiux"
  license: CC0 1.0
  licenseUrl: https://creativecommons.org/publicdomain/zero/1.0/
  changes: 译成中文并拆成要点；首屏标语、项目类型、工作室名、画幅设为变量；合并原文重复的风格词，删去 4K 等参数
images:
  - 3339-design-portfolio-mockup-1.jpg
imageCredit:
  by: "@abs_uiux"
  url: https://github.com/EvoLinkAI/awesome-gpt-image-2-API-and-Prompts/blob/main/images/ui_case146/output.jpg
  license: CC0 1.0
verify:
  - 示例图墙上海报出现了"BAUHAUS"等字样和一张人像海报，商用前确认不涉及他人作品或肖像
  - 填入中文工作室名出一次，检查名片和屏幕上的文字是否准确
  - 确认原帖仍可访问、作者未另行声明保留权利
---
**怎么填变量**：[首屏标语] 写你作品集主页的一句话，例如"让品牌被记住""We Create Brands That Inspire"；[工作室名] 填你的工作室或个人名，建议用 2～8 个字母或 2～4 个汉字；项目类型按自己擅长的方向挑 4～8 个。示例图是一张深灰色书桌：中间笔记本电脑显示"WE CREATE BRANDS THAT INSPIRE"的作品集首页，左侧黑色台灯和笔筒，墙上挂着四张黑白海报，桌面前方整齐摆着八张项目卡片（标志、品牌、海报、包装、社媒、UI、广告、编辑设计），工作室名在示例里是虚构的"AURELIAN"。示例图是英文版。

**常见问题与调整**：
- 想放自己的真实作品：先出整体场景，再用修图把卡片和屏幕替换成自己的作品截图，比让 AI 画更准确。
- 东西太多显乱：删掉台灯、绿植，只保留"电脑 + 6 张卡片 + 2 张海报"。
- 想要暖色调：配色改成"原木、燕麦色、陶土橙"。
- 做竖版小红书封面：画幅改 3:4，电脑放上半部分，卡片在下方排两行。

**适合**：设计师作品集封面、工作室官网头图、接单宣传图；不适合直接冒充真实客户案例，展示的作品需替换为本人实际作品。

### 英文原版

```
Create a premium graphic design portfolio mockup in a professional creative studio style. Show a clean, elegant workspace presentation featuring multiple graphic design project cards arranged in a refined grid layout, a modern laptop screen displaying a portfolio homepage, and several printed posters laid out neatly on the desk and mounted on the wall. Use a polished creative-director aesthetic with soft shadows, subtle depth, realistic materials, and a high-end studio atmosphere. Include sleek typography placeholders, branding samples, editorial-style poster designs, business cards, stationery, notebook, pen, coffee cup, desk lamp, and small plant for a realistic studio setup. The design should have a clean grid layout, balanced spacing, soft realistic shadows, premium lighting, and neutral luxury tones such as black, white, warm beige, gray, champagne, and cream. Make the laptop screen show a minimal portfolio interface with project thumbnails, navigation menu, and bold hero text. Add multiple portfolio project cards such as logo design, brand identity, poster design, packaging design, social media design, UI/UX design, and advertising campaign mockups. Arrange everything professionally with a modern minimalist style, sharp details, clean typography, elegant composition, and a premium creative agency presentation look. Style: high-end graphic design portfolio, modern creative studio, luxury branding mockup, clean desk setup, realistic shadows, editorial layout, minimalist premium design, professional presentation, 4K, ultra-detailed.
```

> 改编自 [@abs_uiux](https://x.com/abs_uiux/status/2054594512983310572) 发布、[EvoLinkAI/awesome-gpt-image-2-API-and-Prompts](https://github.com/EvoLinkAI/awesome-gpt-image-2-API-and-Prompts) 收录的提示词，仓库许可证 CC0 1.0。
