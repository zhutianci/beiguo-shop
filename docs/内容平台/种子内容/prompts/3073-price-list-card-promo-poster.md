---
title: "价目表海报提示词：悬浮价格卡片的高级感促销海报（酒店 / SPA / 活动通用）（gpt-image-2）"
slug: price-list-card-promo-poster
model: gpt-image-2
topics: [poster]
aspectRatio: "9:16"
needsRefImage: false
useCase: "输入主题和喜欢的颜色，生成一张高级感的竖版价目表海报：上方衬线英文大标题和中文标语，中下方一张悬浮的白色圆角价格卡，大号价格数字、特色胶囊标签和项目价目列表，适合酒店套餐、美容 SPA、养生馆和活动票价。"
prompt: |
  主题：[SPA 会所服务价目表]
  忘掉原有配色，重新规划一套适合主题的配色，我喜欢[紫色]。画幅 9:16。
  生成一张以需求为中心的高级美业促销海报：一张纯白圆角矩形价格卡悬浮在画面中下部，有丰富的立体层次、柔和的漫射阴影和后方叠放的卡片层，左上角有一个圆形打孔吊牌细节。
  海报上半部分是通透轻盈的浅色柔光纹理背景，带细腻的流体大理石和花瓣交融纹理，右边缘一枚淡淡的浅色邮戳水印装饰。
  顶部居中是高对比的现代衬线全大写英文标题，下面是用花括号装饰的中文标语和极细的小字。
  悬浮卡片的信息结构严谨清晰：顶部是主题卡名和精致的手绘点缀；下面是高对比的价格焦点区，左边是币种标签，右边是超大的亮色现代粗衬线斜体数字；中段是香槟色渐变圆角胶囊特色标签；下段整齐地列出多个等距项目，每项用小圆点引导，包含项目名称和次数 / 时长，右侧对齐统一的黑色圆角胶囊白字单价标签，项目之间用极细浅灰线分隔。
  卡片底部以一道柔和优雅的上凸弧线收尾，中央一枚微凸的立体爱心徽章和一行小号大写英文。
  海报底边保留舒适的浅色留白，居中一行宽字距的小标语。
  整体配色：柔和浅色 + 纯白 + 高对比黑色胶囊，纯净高调的光线和精确的线条，优雅浪漫的商业视觉。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/xiaoxiaodong01/status/2089559167719928179
  author: "小小东"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "原文中文说明的英文写法改写为中文；主题、配色改为变量，保留价格卡的信息层级描述"
images:
  - 3073-price-list-card-promo-poster-1.jpg
  - 3073-price-list-card-promo-poster-2.jpg
  - 3073-price-list-card-promo-poster-3.jpg
imageCredit:
  by: "小小东"
  url: https://youmind.com/gpt-image-2-prompts?id=31824
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：[SPA 会所服务价目表] 换成你的主题，如"七夕酒店浪漫套餐""周末足球赛门票""中医养生理疗价目表"；[紫色] 写你喜欢的主色，示例里七夕用粉色、足球赛用绿色、养生用米绿。具体的项目和价格最好直接写在提示词里（如"项目：芳香精油肩颈舒缓 45 分钟 ¥168；……"），否则模型会自己编。

示例图三张：粉色的"QIXI HOTEL OFFER 七夕浪漫礼遇"（大号 520、五项套餐价格）、紫色的"SPA SERVICE MENU"（大号 399、六项护理项目）、米绿色的"TCM WELLNESS MENU 东方养生"（大号 268、八项理疗），版式完全一致：顶部衬线大标题、中间悬浮白卡、黑色胶囊价格标签。

**常见问题**：
- 价格和项目是模型编的：正式使用一定要换成真实价目，避免价格误导。
- 数字太多导致错位：项目控制在 5～6 项。
- 中文小字错：项目名控制在 8 字以内。

**适合**：酒店套餐海报、美容 SPA / 养生馆价目表、活动票价海报、门店促销图。

### 原版提示词

```text
Generate a luxury beauty promotion poster centered on user requirements. A pure white rounded rectangular price card with rich 3D layers floats in the lower-middle section, featuring soft diffused shadows and overlapping back layers, with a circular punched tag detail in the upper left corner. The top half of the poster is a transparent and ethereal light pink soft-light textured background, with subtle fluid marble and petal-blending textures, complemented by a faint light-colored postmark watermark on the right edge. A high-contrast modern serif uppercase English title is centered at the top, followed by a Chinese slogan decorated with curly braces and ultra-fine subtext. The floating card presents a rigorous and clear information architecture: the top segment has the theme card name and fine hand-drawn embellishments; below is a high-contrast focal price area with currency labels on the left and oversized modern bold serif italic numbers in bright rose pink on the right. The middle segment contains champagne-pink gradient rounded capsule feature tags, and the lower segment neatly lists multiple equidistant project items, each guided by tiny dots, including project name and frequency, aligned on the right with uniform black rounded capsule unit price tags with white text, separated by ultra-fine light grey lines. The card bottom ends with a smooth, elegant light pink upward-convex arc, with a micro-convex 3D embossed heart badge and small uppercase English text in the center. The bottom edge of the poster leaves comfortable light pink whitespace with a centered, widely spaced micro-slogan text. The overall color scheme is based on soft light pink, pure white, and high-contrast black capsules, with pure high-key light and precise lines, showcasing an elegant and romantic commercial visual.

Theme: {argument name="theme" default="SPA Club Service Price List"}
Forget the original colors, re-plan a color scheme suitable for the theme. I like {argument name="color palette" default="purple"}
Ratio 9:16
```

> 改编自 [小小东](https://x.com/xiaoxiaodong01/status/2089559167719928179) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
