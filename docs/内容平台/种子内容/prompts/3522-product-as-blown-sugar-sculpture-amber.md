---
title: "ai创意产品图提示词：把任何物品做成琥珀色的拉糖吹糖艺术品（Nano Banana）"
slug: product-as-blown-sugar-sculpture-amber
model: nano-banana
topics: [ecommerce, food, illustration]
modelLabel: Nano Banana Pro
aspectRatio: "4:3"
needsRefImage: false
useCase: "一个\"换材质\"的创意玩法：指定一件物品，让它像甜品比赛里的糖艺展品一样，完全由琥珀色的拉糖和吹糖做成，光从糖里透出来。适合做品牌联名创意图、甜品店海报和社媒话题图。"
prompt: |
  生成一张超高清的写实照片：一件[萨克斯]，看起来完全是用拉糖和吹糖做成的——就是甜品比赛里糖艺展品用的那种半透明琥珀色糖体，但结构上仍是一件完整、可辨认的物品。
  - 糖艺工艺要看得出来：拉出来的糖丝带、吹出来的空心糖泡、浇铸成型的小部件，各部分之间用焦糖粘接。
  - 糖体细节：内部有细小的气泡，琥珀色深浅不一，薄的地方更透亮；有比赛级糖艺那种随时会碎的脆弱感。
  - 摆放：放在[大理石甜品台面上，背景是奶油色的窗边]，台面上散落少许糖屑。
  - 光线：温暖的光从背后和侧面穿透糖体，让它从内部泛出蜂蜜一样的光。
  - 气质：法式甜品的传统工艺遇上工业设计，像一件可以吃的奢侈品；对焦锐利，暖琥珀色调；不要文字和水印。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-nano-banana-pro-prompts
  url: https://x.com/AllaAisling/status/2016530202692571465
  author: "@AllaAisling"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文并整理为分条；产品变量保留并按示例图填入默认值，新增摆放环境变量；删去重复的修饰语"
images:
  - 3522-product-as-blown-sugar-sculpture-amber-1.jpg
imageCredit:
  by: "@AllaAisling"
  url: https://youmind.com/nano-banana-pro-prompts?id=8010
  license: CC BY 4.0
verify:
  - "上线前在 Nano Banana 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：[萨克斯] 换成任何有辨识度的物品——"复古相机""机械键盘""高跟鞋""一辆自行车"都可以，结构越复杂，糖艺的细节越好看；摆放环境可以换成"纯奶油色背景""甜品店的玻璃展柜里"。想换糖的颜色，把"琥珀色"改成"透明带粉""翡翠绿"，同时把最后的"暖琥珀色调"一并改掉。

示例图是一把斜靠着的萨克斯，整体是半透明的琥珀色糖体，管身里能看到密密的小气泡，按键和连杆像一颗颗糖珠；它立在白色大理石台面上，底部有一圈化开的焦糖和碎糖屑，背景是被暖光照亮的窗框和墙面。

**常见问题**：
- 看起来像玻璃或树脂：强调"糖的质感——表面略有黏性光泽、边缘有拉丝、内部有气泡"。
- 物品结构被简化得认不出：加"保留该物品的全部主要部件和比例"。
- 颜色太暗：写"逆光拍摄，糖体通透发亮"。

**适合**：甜品店和烘焙品牌的创意海报、品牌周年或联名的概念图、社媒互动话题；用真实品牌的产品做主体前请先确认授权。

### 英文原版

```text
A {argument name="product" default="PRODUCT"} rendered as if built entirely from pulled and blown sugar, the translucent amber material of patisserie showpieces forming functional object. Visible sugar work techniques: pulled ribbons, blown bubbles, cast pieces joined with caramel. Internal air bubbles, slight amber color variation, the architectural fragility of competition sugar work. Positioned on a marble pastry surface or against cream backdrop. French patisserie tradition meets industrial design. Warm lighting that passes through the sugar, creating honey-glow internal illumination. Sharp focus, warm amber palette, edible luxury aesthetic, ultra-high resolution, the functional made confection.
```

> 改编自 [@AllaAisling](https://x.com/AllaAisling/status/2016530202692571465) 发布、[YouMind-OpenLab/awesome-nano-banana-pro-prompts](https://github.com/YouMind-OpenLab/awesome-nano-banana-pro-prompts) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
