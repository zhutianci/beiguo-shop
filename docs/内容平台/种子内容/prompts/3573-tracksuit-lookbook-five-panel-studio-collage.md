---
title: "电商提示词：卫衣套装五联拼图主图，多姿势 + 面料特写（gpt-image-2）"
slug: tracksuit-lookbook-five-panel-studio-collage
model: gpt-image-2
topics: [ecommerce, fashion, photography]
aspectRatio: "16:9"
needsRefImage: false
useCase: "给服装店铺做一张\"一图看全\"的横版主图：同一位模特穿同一套衣服，五个画面分别展示全身动态、上半身、坐姿、背面和大幅的面料与领口特写，暖米色影棚背景，细白线分隔。"
prompt: |
  请做一张服装 Lookbook 的拼图主图，影棚实拍质感，横幅 16:9；版面要像杂志一样干净，各个画面用细白线隔开，重点是把面料、版型和几种姿势都展示出来。
  - 拍摄环境：背景是一整面[暖米色]的无缝背景纸；灯光用柔和的漫射光，人物脚下留一点自然的影子；成片是写实的商业摄影，衣服的细节要拍得很清楚。
  - 整张图切成 5 格，不多不少：左边一列上下两格（上面那格①拍全身走路，下面那格③拍坐姿全身）；中间一列也是上下两格（上面②是腰以上的半身，下面④是从大腿到头的背面或四分之三背面）；右边单独一大格⑤，差不多占掉整张图的一半，用近景拍帽子、肩线、领口、抽绳和上半身。
  - 出镜的人：只有一位年轻的成年女模特，发型是[深棕色卷发，随意挽成高丸子头]，表情放松、不刻意摆拍。
  - 服装：一套[雾霾蓝]的[宽松连帽卫衣 + 束脚工装卫裤]——卫衣的帽子厚实饱满，落肩，罗纹袖口，抽绳带金属头，抓绒面料质感柔软；卫裤是松紧裤脚、宽松版型、侧面有工装口袋。脚上是[白色厚底运动鞋]；特写里能看到小耳钉和一条细项链。
  - 这五格里她分别在做什么：第①格侧着身往前走，一只脚迈在前面；第②格面向镜头，一只手轻轻拉着卫衣的抽绳；第③格直接坐在地上，一条腿曲起来，手扶着头；第④格背对镜头再回过头，让人看清背面的版型和裤子侧袋；第⑤格是微微侧脸的近景，眼睛看向画面之外。
  - 五个画面必须是同一个人穿着同一套衣服，颜色完全一样；衣服上没有任何品牌标志或文字，画面不加水印。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/Mind_Boticni/status/2065643954264305916
  author: "@Mind_Boticni"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文并整理为\"版式 / 模特与服装 / 五个姿势 / 质感\"；发型、套装颜色、款式、鞋子、背景色改为变量；合并了重复的布光与画质描述"
images:
  - 3573-tracksuit-lookbook-five-panel-studio-collage-1.jpg
imageCredit:
  by: "@Mind_Boticni"
  url: https://youmind.com/gpt-image-2-prompts?id=25438
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：换衣服时把颜色、款式和后面的细节描述一起换，例如"燕麦色"的"针织开衫 + 阔腿针织裤"，细节写"粗棒针纹理、贝壳扣、垂坠感"；鞋子和发型按风格搭配；[暖米色] 背景建议选与服装对比柔和的中性色，深色衣服配浅灰，浅色衣服配暖棕。男装或童装只需把模特描述改掉。

示例图是一张米色背景的五联图：左上是模特穿着蓝色卫衣套装和白色厚底鞋侧身行走，左下是她盘腿坐在地上；中间上下两格分别是半身正面和背面回头；右边一大格是卷发模特的近景，能看清卫衣帽子的厚度、落肩的缝线和带金属头的抽绳。

**常见问题**：
- 五个画面里人脸或衣服颜色不一致：强调"同一位模特、同一套服装、色号完全一致"。
- 版式变成等大的五格：把"右侧大画面占整张图一半"单独再写一遍。
- 面料像塑料：加"抓绒的细微起绒、自然的褶皱和厚度感"。

**适合**：服装店铺的横版主图、详情页首屏、上新海报；需要还原真实款式时，建议上传实物平铺图让模型参照。

### 英文原版

```text
Goal: Create a studio fashion lookbook collage for a women's casual streetwear tracksuit, emphasizing fabric, fit, and multiple poses.

Canvas: Wide horizontal 16:9 image, clean editorial layout with thin white dividers between panels. Use a warm beige seamless studio background, soft diffused lighting, realistic photography, natural shadows, high detail.

Layout: Use exactly 5 photo panels. Panel 1 is a tall left panel showing a full-body walking pose. Panel 2 is a small upper-middle portrait crop from waist to head. Panel 3 is a lower-left seated full-body pose. Panel 4 is a lower-middle back/three-quarter view from thighs to head. Panel 5 is a large right-side close-up portrait crop occupying about half the canvas, showing the hoodie shoulder, hood, neckline, hair, and upper torso.

Subject details: A young adult woman model with {argument name="hair style" default="dark brown curly hair in a messy high bun with loose tendrils"}, wearing a matching {argument name="tracksuit color" default="dusty blue"} oversized hoodie and jogger cargo sweatpants. The hoodie has a large padded hood, dropped shoulders, ribbed cuffs, metal-tipped drawstrings, and soft fleece texture. The joggers have elastic cuffs, relaxed fit, and cargo-style side pockets. She wears {argument name="shoes" default="chunky white sneakers"} and subtle small earrings with a delicate necklace visible in the close-up.

Panel pose count and descriptions: Include exactly 5 distinct poses: 1) full-body side walking pose with one foot forward, 2) upper-body front pose with one hand near the hoodie drawstring, 3) seated floor pose with one knee raised and one leg folded, 4) rear three-quarter standing pose showing the back of the hoodie and cargo pocket, 5) large close-up three-quarter portrait showing the hood, shoulder seam, drawstrings, and tousled hair.

Face treatment: In every panel, cover the model's face with a simple soft-edged rectangular skin-toned blur block, preserving the anonymous editorial styling. Do not show facial features.

Visual style: Premium fashion e-commerce editorial photography, neutral warm background, realistic textile detail, clean white collage borders, balanced composition, no text, no logos, no watermark. Make the outfit the focus, with cohesive color grading and consistent studio lighting.
```

> 改编自 [@Mind_Boticni](https://x.com/Mind_Boticni/status/2065643954264305916) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
