---
title: AI穿搭提示词：夏日度假穿搭单品环形悬浮信息图，草帽百褶裙凉鞋草编包 + 面料卖点标注
slug: summer-outfit-exploded-infographic
model: nano-banana
topics: [fashion, ecommerce]
needsRefImage: false
aspectRatio: "1:1"
useCase: 做服装店的整套搭配推荐图、穿搭博主的单品拆解封面、电商套装详情页首屏时，生成一张时尚杂志风的信息图：一套穿搭的各件单品环绕悬浮，周围用卡片标注面料和功能卖点。
prompt: |
  一张高级时装风的[夏日穿搭]信息图，各件单品配色协调、悬浮排列成优雅的环形爆炸构图：
  - 单品包括：一顶透气的[宽檐草帽]、一件无袖[有机棉上衣]、一条飘逸的[百褶长裙]、一双手工[皮凉鞋]、一个[草编水桶包]；
  - 每件单品旁有一张精致的标注卡片，用细引线指向单品，写着单品名和 2～3 条卖点，如透气、挺括质感、吸湿速干、季节舒适；
  - 配色为温暖的中性色：象牙白、陶土橙、沙色和浅棕；
  - 单品之间有轻柔的动态轨迹和飘动的丝带，像夏日微风拂过；
  - 背景是[地中海风白墙小巷]，开满三角梅、摆着陶罐，明亮的自然阳光投下柔和阴影，带阳光亲吻般的光晕；
  - 高级杂志信息图风格，细节锐利，字体简约，适合社交媒体发布。
  画幅 1:1。
negativePrompt: null
source:
  repo: jau123/nanobanana-trending-prompts
  url: https://x.com/AIwithSynthia/status/2017128891568312769
  author: "@AIwithSynthia"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: 译成中文并拆成要点；穿搭主题、五件单品、背景场景设为变量；按示例图补充了标注卡片样式、三角梅和陶罐背景；删去原文中含义不明的修饰词和社交平台名
images:
  - 3316-summer-outfit-exploded-infographic-1.jpg
imageCredit:
  by: "@AIwithSynthia"
  url: https://images.meigen.ai/tweets/2017128891568312769/0.jpg
  license: CC BY 4.0
verify:
  - 示例图里上衣出现了两件（标注也重复了一次），与提示词的五件单品不完全一致，可加"每件单品只出现一次"测试
  - 标注卡片里的防晒指数等功能描述是模型生成的，用于商品宣传时要换成真实参数
  - 确认原帖仍可访问、作者未另行声明保留权利
---
**怎么填变量**：[夏日穿搭] 可换成"秋季通勤穿搭""冬日滑雪穿搭""春季野餐穿搭"；五件单品按季节整套换，秋季通勤可写"[驼色风衣]、[针织开衫]、[直筒西裤]、[乐福鞋]、[托特包]"。[地中海风白墙小巷] 是背景，可换"秋天的银杏街道""雪山木屋前"。示例图是英文标注版：白墙小巷里开满粉紫色三角梅、摆着陶罐，中间一顶宽檐草帽、两件米白无袖上衣、一条陶土橙色百褶长裙、一双棕色罗马凉鞋和一个草编水桶包悬浮着，几条橙色丝带和光环绕着它们，四周六张米色卡片写着单品名和面料卖点。

**常见问题与调整**：
- 单品重复或缺件：在列表后加"共五件，每件只出现一次"。
- 卡片文字乱码：每张卡片只写单品名一行，卖点后期加。
- 想展示上身效果：改成"中间站着一位模特穿着整套搭配，单品拆分悬浮在四周"。
- 背景抢戏：改成"纯色浅沙色背景，只保留柔和阴影"。

**适合**：服装店搭配推荐、穿搭博主拆解封面、电商套装详情页首屏；用于商品宣传时，实物和面料参数要与图片一致。

### 英文原版

```
High-fashion summer outfit infographic with color-coordinated floating elements arranged in an elegant exploded circular composition, featuring a breathable straw hat, sleeveless organic cotton top, fluid pleated skirt, artisan leather sandals, and a woven palm-leaf bag; refined callouts highlight fabric breathability, crisp texture, moisture-wicking, and seasonal comfort, with warm neutral tones of ivory, terracotta, sand, and soft tan; subtle motion trails and airy fabric swirls suggest a gentle summer breeze, bright natural sunlight creates soft shadows and a sun-kissed glow, Mediterranean gemini lifestyle mood, premium editorial aesthetic, ultra-sharp details, minimal typography, luxury fashion magazine infographic style, Instagram-ready
```

> 改编自 [@AIwithSynthia](https://x.com/AIwithSynthia/status/2017128891568312769) 发布、[jau123/nanobanana-trending-prompts](https://github.com/jau123/nanobanana-trending-prompts) 收录的提示词，仓库许可证 CC BY 4.0。
