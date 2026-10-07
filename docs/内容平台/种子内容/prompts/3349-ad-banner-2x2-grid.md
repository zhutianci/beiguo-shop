---
title: 电商详情页提示词：日式信息密集型广告 banner 四宫格（旅行 / 护肤 / 美食 / 课程，大字价格 + 徽章）
slug: ad-banner-2x2-grid
model: gpt-image-2
topics: [ecommerce, marketing]
needsRefImage: false
aspectRatio: "1:1"
useCase: 想快速试出几种日式"大字 + 价格 + 徽章"风格的信息流广告图时用，一张图同时出旅行、护肤、美食、课程四个方向的方形 banner，适合做投放素材的风格探索。
prompt: |
  一张 2x2 网格的日式数字广告 banner 合集，四个格子大小相同，每格一个主题。
  - 左上【旅行】：一对情侣手牵手走在白沙滩上，望着清澈的蓝绿色海水和湛蓝天空，左下角一朵红色扶桑花；文字："今年，放空一下。""[冲绳之旅]""3 天治愈假期""机票 + 酒店""[优惠价]起""美景、美食、体验全都有！"；配飞机、酒店、汽车 3 个小图标；
  - 右上【护肤】：一位年轻女性的面部特写，皮肤透亮水润，轻闭双眼，双手轻贴脸颊；柔粉色渐变背景、动感水花，旁边一罐粉色面霜标着"[产品名] 亮肤凝露"；文字："告别毛孔与暗沉！""透亮水光肌""新感觉护肤""首单[折扣]""[到手价]"；3 个金色圆形徽章："毛孔护理""深层保湿""紧致透亮"；
  - 左下【美食】：厚切三分熟牛排在黑色铸铁烤盘上滋滋作响，配烤蒜片和香草；文字："入口即化！""[和牛]奢享牛排""期间限定""特别价格[活动价]"；
  - 右下【课程】：一位年轻男性在桌前认真学习做笔记，蓝白配色；文字："利用碎片时间""[最快通过]""在线资格课程""手机就能学完""高效学习拉开差距"；圆形徽章"学员突破 10 万"，角标"限时 报名费[折扣]"；
  - 整体：日本广告常见的高信息密度排版，粗体描边大字、金色和红色价格、圆形徽章、斜切色块，四格风格统一又各有主题色；
  - 方形画幅[1:1]。
negativePrompt: null
source:
  repo: EvoLinkAI/awesome-gpt-image-2-API-and-Prompts
  url: https://x.com/iamaiistudio/status/2064440310479176084
  author: "@iamaiistudio"
  license: CC0 1.0
  licenseUrl: https://creativecommons.org/publicdomain/zero/1.0/
  changes: 原文为 JSON 结构且仓库收录到美食格中途被截断，改写成中文分格描述；美食和课程两格按示例图补全；目的地、产品名、价格、折扣等设为变量，原文的品牌式产品名改为变量
images:
  - 3349-ad-banner-2x2-grid-1.jpg
imageCredit:
  by: "@iamaiistudio"
  url: https://github.com/EvoLinkAI/awesome-gpt-image-2-API-and-Prompts/blob/main/images/poster_case374/output.jpg
  license: CC0 1.0
verify:
  - 仓库收录的原文在美食格中途截断，后两格为本站按示例图补写，核对原帖完整版本
  - 示例图人物为写实虚构人物、价格为示例数字，页面需提醒"价格与人物均为示意，投放需替换为真实信息"
  - 确认原帖仍可访问、作者未另行声明保留权利
---
**怎么填变量**：四个格子可以整格替换成你自己的业务，比如把旅行换成"周末露营套餐"、课程换成"考研冲刺班"；[冲绳之旅] 填目的地，[产品名] 填你的产品，价格和折扣按真实活动填写，例如"首单 7 折""到手 99 元"。如果只要一张图，删掉其余三格，开头改成"一张日式数字广告 banner"。示例图是日文版四宫格：左上是海边背影情侣和"沖縄旅行"大字与价格，右上是闭眼捧脸的女性和粉色面霜，左下是烤盘上的厚切牛排和"黒毛和牛"金色大字，右下是做笔记的男生和"最短合格！"蓝色大字。示例图是日文版。

**常见问题与调整**：
- 字太多出错：每格只保留"主标题 + 价格 + 一个徽章"，其余小字删掉。
- 想要中国电商风：把"日式"改成"国内电商主图风格"，加"红色促销角标、满减标签"。
- 价格位置不显眼：加"价格数字最大，金色描边，放在每格右下角"。
- 产品要和实物一致：护肤格先上传实物照片，加"面霜罐严格按上传图"。

**适合**：信息流广告风格探索、电商活动图创意参考、日式排版学习；用于商品宣传时，实物、价格和优惠要与真实信息一致。

### 英文原版

```
://t.co/9AyRJEG6VB

{
  "type": "2x2 grid of Japanese-style digital advertisement banners",
  "layout": {
    "structure": "4 equal quadrants",
    "quadrants": [
      {
        "position": "top-left",
        "theme": "Travel",
        "subject": "A couple holding hands walking along a white sandy beach, gazing at crystal-clear turquoise water beneath a vivid blue sky.",
        "elements": ["red hibiscus flower in the lower-left corner"],
        "text_labels": [
          "This year, break free.",
          "{argument name=\"travel destination\" default=\"Okinawa Trip\"}",
          "3-day relaxation getaway",
          "Flights + Hotel",
          "Starting from ¥39,800",
          "Views, food, and experiences — all covered!"
        ],
        "icons": {
          "count": 3,
          "descriptions": ["airplane", "hotel building", "car"]
        }
      },
      {
        "position": "top-right",
        "theme": "Skincare",
        "subject": "Close-up of a young woman with radiant, dewy skin, eyes gently closed, lightly pressing both hands to her cheeks.",
        "elements": [
          "soft pink gradient background",
          "dynamic water splash effects",
          "pink cosmetic jar labeled '{argument name=\"skincare product name\" default=\"LUMIÈRE\"} Brightening Gel'"
        ],
        "text_labels": [
          "Bye bye pores and dullness!",
          "Radiance overflowing",
          "Achieve glass-like dewy skin",
          "Next-level skincare sensation",
          "First order 78% OFF",
          "{argument name=\"discount price\" default=\"¥1,980\"}"
        ],
        "badges": {
          "count": 3,
          "style": "gold circular",
          "labels": ["Pore care", "Deep hydration", "Firmness & luminosity"]
        }
      },
      {
        "position": "bottom-left",
        "theme": "Gourmet Food",
        "subject": "Thick medium-rare steak slices sizzling on a dark cast-iron grill plate.",
        "elements": [
          "crispy g
```

（仓库收录的原文到此截断。）

> 改编自 [@iamaiistudio](https://x.com/iamaiistudio/status/2064440310479176084) 发布、[EvoLinkAI/awesome-gpt-image-2-API-and-Prompts](https://github.com/EvoLinkAI/awesome-gpt-image-2-API-and-Prompts) 收录的提示词，仓库许可证 CC0 1.0。
