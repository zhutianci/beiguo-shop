---
title: 分镜提示词：草莓芝士冰淇淋广告 8 镜头分镜板，每格标时长和运镜（可换任意甜品饮品）
slug: dessert-ad-storyboard
model: nano-banana
topics: [food, ecommerce]
needsRefImage: false
aspectRatio: "3:4"
useCase: 给甜品、饮品、零食做短视频广告前，先用一张图出完整的 8 镜头分镜板：每格有镜号、时长、运镜说明和画面，方便和拍摄团队或客户对齐创意。
prompt: |
  生成一张单页的高端产品广告分镜板，竖版 3:4，像广告公司的提案页。
  顶部：醒目的粗体标题"[产品名]产品广告分镜"；下方一排信息卡：时长 [10 秒]、风格 电影感甜品广告、产品 [产品名]、音效 [勺子刮过的 ASMR]；再加一小段"为什么用这种风格"的说明；整体配色[柔粉、草莓红、奶油色]，点缀少量草莓和甜品小图案。
  分镜区共 8 格，每格都标注镜号、时长角标、运镜方式、画面、动作、产品细节：
  1. 产品包装盒立在冰凉的大理石台面上，包装正面完整可见；
  2. 特写揭开盖子，露出下面绵密的冰淇淋；
  3. 挖球勺压进表面，露出夹层和真实的奶油质感；
  4. 极致微距：冰淇淋里的果肉块和饼干碎；
  5. 慢动作：果酱缓缓淋过一颗圆润的冰淇淋球，形成光亮的红色缎带；
  6. 冰淇淋球放进玻璃甜品杯，饼干碎自然洒落；
  7. 特写勺子切开冰淇淋球，露出里面的果酱和芝士块；
  8. 收尾主图：包装盒放在甜品杯旁，周围摆好新鲜草莓、饼干碎和果酱。
  画面风格：超写实高端冷饮广告，质感绵密，冷凝水珠真实，包装细节锐利，柔和电影光，包装上的品牌名写"[品牌名]"。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-nano-banana-pro-prompts
  url: https://x.com/itxabdullaa/status/2096555195618689457
  author: "@itxabdullaa"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: 译成中文并压缩成标题区 + 8 格分镜两部分；产品名、时长、音效、配色、包装品牌名设为变量；删去重复的运镜词和 8K 参数
images:
  - 3284-dessert-ad-storyboard-1.jpg
imageCredit:
  by: "@itxabdullaa"
  url: https://cms-assets.youmind.com/media/1788764288964_6qq3rp_HRh11EybsAAKPHz.jpg
  license: CC BY 4.0
verify:
  - 示例图包装盒上印着一个英文单词作为品牌名，与某 AI 产品同名，页面展示时留意不要让人误以为是官方合作
  - 示例图是英文版，改成中文标题和说明后实测一次，看小字是否可读
  - 确认原帖仍可访问、作者未另行声明保留权利
---
**怎么填变量**：[产品名] 换成你的产品，比如"芒果椰奶冰沙""抹茶生乳卷""黑糖珍珠奶茶"，8 格里的"果肉块、果酱、芝士块"也要顺手换成对应配料（奶茶就写"珍珠落入杯底""奶盖缓缓溢出"）。[柔粉、草莓红、奶油色] 按产品主色改，抹茶类用"抹茶绿、奶白、木色"。[品牌名] 务必填自己的品牌或虚构名。示例图是英文版：顶部大标题和四张信息卡，下面两列共 8 格，从大理石台上的冰淇淋盒、揭盖、挖球、草莓块微距、淋酱、装杯、勺子切开，到最后包装盒加甜品杯的收尾镜头，每格左侧是画面、右侧是动作和产品细节小字。

**常见问题与调整**：
- 格子里的小字糊成一片：减少说明，只保留"镜号 + 时长 + 运镜"三项，或把画幅改为 9:16。
- 8 格画面太像：给每格指定景别，如"全景 / 特写 / 微距 / 俯拍"交替。
- 包装每格长得不一样：先上传一张产品包装图，开头加"所有镜头里的包装以上传图为准"。
- 想直接接着做视频：分镜满意后，逐格追问"把第 3 格单独生成为 16:9 高清画面"。

**适合**：短视频广告前期提案、电商主图视频脚本、甜品店新品宣传策划；用于宣传时实物要与图片一致。

### 英文原版

```
TITLE:
Premium Strawberry Cheesecake Ice Cream Product Commercial Storyboard

FORMAT:
• Single-page premium storyboard
• 3:4 Portrait ratio
• Cinematic frozen dessert advertising campaign
• 8 completely different product-focused scenes
• Product remains the main visual hero
• Premium advertising agency presentation

HEADER:
• Bold editorial typography
• Information cards:

* Duration: {argument name="duration" default="10 Seconds"}
* Style: Cinematic Dessert Commercial
* Product: {argument name="product" default="Strawberry Cheesecake Ice Cream"}
* Audio: Spoon Scrape + Creamy Dessert ASMR
  • Why This Style Works section
  • {argument name="color palette" default="Soft pink, strawberry red, cream and vanilla"} aesthetic
  • Minimal strawberry and dessert-themed decorative details

STORYBOARD:

1. Premium strawberry cheesecake ice cream tub standing dramatically on a chilled marble surface, front packaging perfectly visible
2. Tub opening with a crisp close-up of the lid lifting and creamy ice cream revealed underneath
3. Ice cream scoop pressing into the surface, revealing rich strawberry cheesecake layers and realistic creamy texture
4. Extreme macro of strawberry pieces and cheesecake crumbs embedded throughout the ice cream
5. Fresh strawberry sauce flowing slowly across a perfectly formed scoop, creating glossy red ribbons
6. Ice cream scoop lifted onto a glass dessert cup with tiny cheesecake crumbs falling naturally around it
7. Close-up of spoon breaking through the creamy scoop, revealing strawberry filling and soft cheesecake pieces inside
8. Final hero product shot with the original ice cream tub beside an elegant dessert cup, fresh strawberries, crumbs and strawberry sauce arranged around the product

EVERY PANEL:
• Scene number
• Duration badge
• Camera direction
• Visual
• Action
• Product detail

CAMERA:
Extreme macro food photography, smooth scoop movement, slow-motion strawberry sauce pour, detailed texture close-ups, controlled push-in, shallow depth of field, elegant overhead composition, cinematic final packshot.

STYLE:
Ultra-realistic premium frozen dessert commercial, rich creamy ice cream texture, realistic strawberry pieces, detailed cheesecake crumbs, glossy strawberry sauce, authentic condensation, sharp packaging details, soft cinematic lighting, luxurious food styling, professional dessert advertising, 8K.
```

> 改编自 [@itxabdullaa](https://x.com/itxabdullaa/status/2096555195618689457) 发布、[YouMind-OpenLab/awesome-nano-banana-pro-prompts](https://github.com/YouMind-OpenLab/awesome-nano-banana-pro-prompts) 收录的提示词，仓库许可证 CC BY 4.0。
