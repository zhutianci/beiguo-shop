---
title: "ai穿搭提示词：OOTD 种草图，左边模特全身照 + 右边四张单品价格卡（gpt-image-2）"
slug: ootd-model-plus-four-price-cards
model: gpt-image-2
topics: [fashion, ecommerce]
aspectRatio: "4:5"
needsRefImage: false
useCase: "做穿搭种草图、店铺搭配推荐时用：左侧是模特穿着整套搭配的全身照，右侧竖排四张圆角卡片，分别放单品特写、名称和价格，顶部一个大标题，一张图讲清\"这一身都是什么\"。"
prompt: |
  请做一张竖版 4:5 的"今日穿搭"种草图：左边放模特，右边放单品卡，韩系日常风格，杂志一样干净的版面，自然光明亮柔和，主色是米色加雾蓝色。
  - 顶部：居中一行很大的雾蓝色圆润泡泡字标题"[OOTD]"，带白色描边；左上角一个小衣架线条图标，右上角一个小购物袋图标。
  - 左半边（模特全身照）：极简的室内一角，米色墙面、浅奶油色地面，柔和的阳光和影子，最左边一盆橄榄树。一位[深棕色齐肩卷发、戴细框圆眼镜的年轻女生]正面放松站立，一只手自然垂下拎着小包，双脚微微分开；脸部不做过多刻画，是柔和的时尚画报感。
  - 她身上的四件单品：[白色宽松 T 恤，胸口有一颗淡紫色小草莓]；[浅蓝色高腰阔腿牛仔裤]；[白色迷你方形斜挎包，金色锁扣]；[白色厚底运动鞋]。
  - 右半边（单品卡片）：从上到下竖排恰好 4 张圆角白色卡片，细细的暖金色描边；每张卡片左边是该单品的特写照片，右边是黑色衬线字体的两行文字——上面是品名，下面是价格。四张依次为："[草莓 T 恤]　[¥129]""[阔腿牛仔裤]　[¥259]""[迷你斜挎包]　[¥399]""[厚底小白鞋]　[¥329]"。卡片里的特写必须和模特身上的单品是同一件。
  - 底部：左下角一个小购物袋图标，右下角三个翻页小圆点。
  - 整体要求：版面透气、对齐工整，看起来像服装品牌的目录页；所有文字清楚、没有错别字，画面里不要出现任何真实品牌的标志。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/Naiknelofar788/status/2049548099547537544
  author: "@Naiknelofar788"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "JSON 原文改写为分条中文；标题、四件单品及其名称价格改为变量，英文品名和美元价格换成中文品名与人民币示例；发型描述并入模特一栏；保留四个角的小图标与翻页圆点"
images:
  - 3491-ootd-model-plus-four-price-cards-1.jpg
imageCredit:
  by: "@Naiknelofar788"
  url: https://youmind.com/gpt-image-2-prompts?id=17104
  license: CC BY 4.0
verify:
  - "价格只是版式示例，上线正文已提示替换；若用于真实带货，名称与价格须与实际商品一致"
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：[OOTD] 可以换成"今日穿搭""通勤一周"等短标题（中文建议 4 个字以内，泡泡字才好看）；四件单品按"上装、下装、包、鞋"的顺序写清颜色和一个辨识特征；右侧四张卡片的品名和价格与之一一对应，品名控制在 6 个字以内。想做男装或童装，把模特描述换掉即可。

示例图上方是雾蓝色的"OOTD"大字，左边一位黑色卷发、戴圆眼镜的女生穿白色草莓 T 恤和浅蓝阔腿牛仔裤，拎白色小方包、穿白色厚底鞋，旁边一盆橄榄树；右边四张金边圆角卡片分别是 T 恤领口特写、牛仔裤腰部特写、白色小包和白鞋，旁边是英文品名和美元价格。

**常见问题**：
- 卡片里的单品和模特身上的不一致：加一句"四张特写均取自左侧模特身上的同一件单品"。
- 价格数字写错：价格只保留整数，或先留空、后期自己排字。
- 版面拥挤：把单品减到 3 件，卡片相应改为 3 张。

**适合**：小红书穿搭笔记封面、服装店搭配推荐、直播预告图。示例中的价格是虚构的版式示例，实际使用请换成真实商品信息。

### 英文原版

```text
{
  "type": "fashion outfit infographic",
  "aspect_ratio": "4:5",
  "style": "clean editorial product board, Korean street fashion aesthetic, bright soft natural light, muted beige and powder blue palette, minimalist indoor setting",
  "title_text": "{argument name=\"headline text\" default=\"OOTD\"}",
  "layout": {
    "background": "warm off-white with subtle beige interior architecture",
    "split": "left model portrait, right vertical product stack",
    "sections": [
      {
        "title": "model look",
        "position": "left",
        "count": 1,
        "labels": ["full-body outfit shot"]
      },
      {
        "title": "product cards",
        "position": "right",
        "count": 4,
        "labels": ["Strawberry Tee", "Wide-Leg Jeans", "Mini Crossbody Bag", "Platform Sneakers"]
      }
    ]
  },
  "scene": {
    "setting": "minimal indoor studio corner with soft beige walls, light cream floor, gentle sunlight and shadows, potted olive tree on the far left",
    "decor": {
      "count": 4,
      "items": ["small hanger icon at top left", "small shopping bag icon at top right", "three pagination dots at bottom right", "tiny shopping bag icon at bottom left"]
    }
  },
  "subject": {
    "type": "young woman",
    "pose": "standing relaxed, facing forward, one arm down holding a small bag, feet slightly apart",
    "hair": "{argument name=\"hair style\" default=\"dark brown shoulder-length loose waves with a center part\"}",
    "face": "de-emphasized facial detail, soft fashion editorial look",
    "outfit": {
      "count": 4,
      "pieces": [
        "oversized white t-shirt with a small lavender strawberry chest graphic",
        "light-wash high-waisted wide-leg denim jeans",
        "white mini structured crossbody bag with gold hardware",
        "white platform sneakers"
      ]
    }
  },
  "product_cards": [
    {
      "name": "{argument name=\"shirt label\" default=\"Strawberry Tee\"}",
      "price": "$35",
      "image": "close-up of white tee neckline and chest area showing the small purple strawberry graphic",
      "card_style": "rounded white card with thin warm-gold outline, left image panel and right serif text"
    },
    {
      "name": "Wide-Leg Jeans",
      "price": "$75",
      "image": "cropped close-up of pale blue jeans waist and upper leg",
      "card_style": "rounded white card with thin warm-gold outline, left image panel and right serif text"
    },
    {
      "name": "Mini Crossbody Bag",
      "price": "$450",
      "image": "close-up of white structured mini bag with top handle, shoulder strap, and gold clasp",
      "card_style": "rounded white card with thin warm-gold outline, left image panel and right serif text"
    },
    {
      "name": "{argument name=\"shoe label\" default=\"Platform Sneakers\"}",
      "price": "$110",
      "image": "close-up of white low-top platform sneakers angled slightly to the side",
      "card_style": "rounded white card with thin warm-gold outline, left image panel and right serif text"
    }
  ],
  "typography": {
    "headline": "large pastel blue bubble letters centered across the top",
    "product_text": "elegant black serif typography with stacked names and prices"
  },
  "rendering": {
    "quality": "high-resolution polished fashion graphic",
    "composition": "balanced and airy with generous margins, catalog-style clarity"
  }
}
```

> 改编自 [@Naiknelofar788](https://x.com/Naiknelofar788/status/2049548099547537544) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
