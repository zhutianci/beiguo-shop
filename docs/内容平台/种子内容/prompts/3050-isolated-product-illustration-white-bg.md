---
title: "游戏道具 / 产品白底插画提示词：复古黄铜提灯（手绘质感、可做图标素材）（gpt-image-2）"
slug: isolated-product-illustration-white-bg
model: gpt-image-2
topics: [ecommerce, game-art]
aspectRatio: "1:1"
needsRefImage: false
useCase: "生成一个白底居中、手绘数字插画质感的单个物件，示例是复古黄铜提灯，适合游戏道具图标、商品插画、绘本素材和网页图标。"
prompt: |
  生成一张干净的单品插画：一盏复古吊挂提灯，居中放在纯[白色]背景上。
  提灯是六角形金属框架，材质是做旧的[古铜 / 深青铜色]，略呈四分之三正面视角：正面的玻璃门朝前，能看到右侧面。
  它有透明玻璃面板和淡淡的反光，长方形前门带细金属边框，一侧有小铰链、另一侧是弯曲的门闩把手。底座是凸起的多层斜面六角台。上部是倾斜的多面屋顶，一圈短圆柱形通风带上恰好有 4 个可见的圆形通风孔，再往上是圆顶盖、小圆球顶饰和一个大圆形吊环。
  使用柔和明暗的手绘数字插画风格，细深色描边，温暖低调的高光，写实但略带风格化的比例。灯里不要火焰或蜡烛，不要文字和水印，物体四周留出足够空白。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/mar5hm_/status/2085292227434303649
  author: "枡まーろ"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文；背景色、金属质感改为变量，并补充换成其他物件时的写法"
images:
  - 3050-isolated-product-illustration-white-bg-1.jpg
imageCredit:
  by: "枡まーろ"
  url: https://youmind.com/gpt-image-2-prompts?id=30660
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：[白色] 可以改成"浅米色"或"透明背景"（API 生成时可直接要透明底）；[古铜 / 深青铜色] 可以换成"生锈的铁""抛光黄铜""哑光黑铁"。换成其他物件时，照着"整体形状 → 视角 → 各部件细节 → 风格 → 不要什么"的顺序描述，例如"一把古董钥匙""一只旧皮革背包""一瓶药水"，就能批量做出同一画风的道具图标。

示例图是白底上的六角古铜提灯，四分之三正面，玻璃门、门闩、顶部一圈圆形通风孔和大吊环都清楚，细描边的手绘质感，四周留白充足。

**常见问题**：
- 背景不干净、有阴影地面：加"无地面、无投影、纯色背景"。
- 风格太写实像照片：强调"手绘数字插画，细描边"。
- 做成一套图标：在同一对话里依次要求"同样画风画一把钥匙 / 一本魔法书……"，并保持视角一致。

**适合**：游戏道具图标、商品插画、绘本素材、网页与 App 图标。

### 英文原版

```text
Create a clean isolated product-style illustration of a vintage hanging lantern centered on a plain {argument name="background color" default="white"} background. The lantern is a hexagonal metal frame made of aged {argument name="metal finish" default="antique brass / dark bronze"}, shown in a slight three-quarter front view with the front glass door facing forward and the right side visible. It has transparent glass panels with subtle pale reflections, a rectangular front door with thin metal borders, small hinges on one side, and a curved latch handle on the other. The base is a raised hexagonal plinth with layered bevels. The upper section has a sloped faceted roof, a short cylindrical vent band with exactly four visible round ventilation holes, a domed cap, a small ball finial, and one large circular hanging ring at the top. Use softly shaded hand-painted digital illustration style, fine dark outlines, muted warm highlights, realistic but slightly stylized proportions, no flame or candle visible inside, no text, no watermark, and ample empty space around the object.
```

> 改编自 [枡まーろ](https://x.com/mar5hm_/status/2085292227434303649) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
