---
title: "ai网页设计提示词：轻奢品牌电商首页长图样机，首屏大图 + 品类四宫格 + 品牌故事（gpt-image-2）"
slug: luxury-brand-ecommerce-homepage-long-mockup
model: gpt-image-2
topics: [ecommerce, poster]
aspectRatio: "9:16"
needsRefImage: false
useCase: "开店或改版前想先看一眼\"整页长什么样\"：一张竖版长图把官网首页从导航、首屏主视觉、品类入口、主推单品到品牌故事和服务承诺都排出来，中性色调的轻奢极简风，可以当作给设计师的视觉参考。"
prompt: |
  请画出一个品牌官网首页从头到尾的完整长页面（网页设计样机），画幅为竖版 9:16。品牌叫"[LUMIÈRE]"，想要的感觉是：[轻奢、极简、优雅、中性色调]。整页自上而下分成五段：
  1. 顶部导航：左侧是衬线字体的品牌名，中间一排很小的大写导航（NEW IN、HANDBAGS、JEWELRY、COLLECTIONS、MAISON、ABOUT），右侧是搜索、账户、购物袋三个线条图标。
  2. 首屏主视觉：左边是分成三行的大号衬线标题（示例图写的是 "Crafted for Timeless Elegance"，可换成你的品牌主张），下面一行小字副标题和一个黑底白字的小按钮"DISCOVER THE COLLECTION"；右边是一只[奶油色硬挺手提包]，金色锁扣，放在石材台面上，旁边搭一条丝巾，背景是米色墙面和斑驳的植物光影。
  3. 品类入口：小标题"EXPLORE OUR WORLD"，下面一排恰好 4 张等大的竖图卡片，分别是[手袋、珠宝、腕表、家居香氛]，每张图下方是品类名和一行"Discover"小字。
  4. 主推单品：一条通栏，左侧小字"FEATURED"、单品名"[Le Sac Éternel]"、一句短描述和带下划线的文字链接；右侧是一只黑色手提包放在大理石台面上，背景用一块斜切的浅灰色块。
  5. 品牌故事：左边是一张古典建筑外立面的照片，右边是小标题、三段式短标题"Heritage. Craftsmanship. Vision."、四五行正文和一个文字链接，右下角有一枚淡淡的压印字母徽记。
  统一的视觉规则：留白要多；颜色只用米白、暖灰和黑；标题是细衬线体，正文是小号无衬线体；商品照片的光线柔和，带自然的投影；文字都要清楚锐利；页面上不能有真实品牌的标志，也不要出现电话、网址这类联系方式。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/hupuzuqiu/status/2044740735124291709
  author: "@hupuzuqiu"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "JSON 原文改写为分条中文；品牌名、气质关键词、首屏主图、四个品类、主推单品名改为变量，首屏标题保留原文并注明可替换；示例图最底部的服务栏里有一串虚构的客服电话，本站裁掉了图片最下方约 5% 的这一条，提示词里也去掉了电话"
images:
  - 3538-luxury-brand-ecommerce-homepage-long-mockup-1.jpg
imageCredit:
  by: "@hupuzuqiu"
  url: https://youmind.com/gpt-image-2-prompts?id=13803
  license: CC BY 4.0
verify:
  - "示例图为本站裁切版（去掉了页面最底部含虚构电话的服务栏），其余未改动"
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：[LUMIÈRE] 换成你的店名；气质关键词决定配色和字体，例如"自然、手作、暖棕色调"或"科技、冷灰、极简"；首屏标题不是方括号变量，直接把引号里的英文换成你的品牌主张（英文 4～6 个单词最稳，中文 10 个字以内）；首屏主图和四个品类换成你卖的东西；主推单品名随意。导航和按钮上的英文也可以整体换成中文。

示例图是一张米色调的长页面：顶部是细细的导航栏；首屏左边是三行衬线大标题和黑色小按钮，右边是一只奶白色手提包立在石台上；往下是手袋、耳环、腕表、香薰蜡烛四张小图；再往下是一只黑色手提包的通栏主推；最后是欧式建筑照片配品牌故事文字。（原图最底部还有一条服务承诺栏，本站裁掉了。）

**常见问题**：
- 小字是乱码：正文段落本来就只起占位作用，标题和按钮清楚即可；要全部可读就把页面拆成两屏分别生成。
- 各区块风格不统一：在风格要求里把三种颜色和两种字体写死。
- 页面被压成一屏：强调"竖向长页面，共五个区块，自上而下排列"。

**适合**：独立站和品牌官网改版前的视觉方向稿、给设计师或建站服务商的参考图；它不是可用的网页设计稿，尺寸和间距都需要重做。

### 英文原版

```text
{
  "type": "e-commerce landing page mockup",
  "brand": "{argument name=\"brand name\" default=\"LUMIÈRE\"}",
  "aesthetic": "{argument name=\"aesthetic\" default=\"luxury, minimalist, elegant, neutral tones\"}",
  "layout": {
    "header": {
      "logo": "{argument name=\"brand name\" default=\"LUMIÈRE\"}",
      "navigation": ["NEW IN", "HANDBAGS", "JEWELRY", "COLLECTIONS", "MAISON", "ABOUT"],
      "icons": ["search", "user", "cart"]
    },
    "sections": [
      {
        "name": "Hero",
        "text": {
          "headline": "{argument name=\"hero headline\" default=\"Crafted for Timeless Elegance\"}",
          "subheadline": "Where Artistry Meets Uncompromising Quality.",
          "button": "DISCOVER THE COLLECTION"
        },
        "imagery": "cream structured handbag with gold clasp on stone plinth, silk scarf with brand name, soft leaf shadows"
      },
      {
        "name": "Product Grid",
        "title": "EXPLORE OUR WORLD",
        "count": 4,
        "items": [
          { "image": "black crocodile handbag on marble", "label": "HANDBAGS", "sublabel": "Discover" },
          { "image": "diamond stud earrings on silk", "label": "JEWELRY", "sublabel": "Discover" },
          { "image": "classic watch with leather strap on silk", "label": "WATCHES", "sublabel": "Discover" },
          { "image": "white candle on gold tray", "label": "MAISON", "sublabel": "Discover" }
        ]
      },
      {
        "name": "Featured Product",
        "layout": "diagonal split",
        "text": {
          "kicker": "FEATURED",
          "title": "{argument name=\"featured product name\" default=\"Le Sac Éternel\"}",
          "description": "A Statement of Enduring Style.",
          "link": "EXPLORE NOW"
        },
        "imagery": "black structured handbag with gold clasp on marble surface"
      },
      {
        "name": "Brand Story",
        "layout": "two-column",
        "imagery": "Parisian Haussmann architecture framed by leaves",
        "text": {
          "kicker": "THE LUMIÈRE STORY",
          "headline": "{argument name=\"story headline\" default=\"Heritage. Craftsmanship. Vision.\"}",
          "body": "Born in the heart of Paris, Lumière has been a symbol of refined luxury for generations. Our creations are crafted by master artisans, blending timeless design with unparalleled attention to detail.",
          "link": "DISCOVER OUR STORY",
          "watermark": "faint circular L logo"
        }
      },
      {
        "name": "Trust Bar",
        "count": 4,
        "items": [
          { "icon": "diamond", "title": "EXCEPTIONAL QUALITY", "subtitle": "Meticulous Craftsmanship" },
          { "icon": "truck", "title": "COMPLIMENTARY DELIVERY", "subtitle": "Insured & Signature Required" },
          { "icon": "gift box", "title": "EXCLUSIVE SERVICES", "subtitle": "Personal Shopping & Care" },
          { "icon": "headset", "title": "CLIENT SERVICE", "subtitle": "+33 1 42 86 95 28" }
        ]
      }
    ]
  }
}
```

> 改编自 [@hupuzuqiu](https://x.com/hupuzuqiu/status/2044740735124291709) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
