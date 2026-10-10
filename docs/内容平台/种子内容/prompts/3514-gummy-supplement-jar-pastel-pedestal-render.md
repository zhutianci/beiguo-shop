---
title: "ai产品图提示词：软糖营养品罐 3D 渲染主图，粉色圆台 + 草莓蓝莓点缀（Nano Banana）"
slug: gummy-supplement-jar-pastel-pedestal-render
model: nano-banana
topics: [ecommerce, food]
modelLabel: Nano Banana Pro
aspectRatio: "1:1"
needsRefImage: false
useCase: "给软糖、维生素、零食罐这类小瓶罐产品做一张干净的电商主图：纯色渐变背景、同色系圆台、敞口罐里堆着软糖，旁边放一两种对应口味的水果，极简又有食欲。"
prompt: |
  生成一张超写实的 3D 产品渲染图：一只[粉色]的软糖营养品罐，罐身正面印着白色粗体的品牌字样"[lik]"，放在一个同色系的圆形哑光展台上。画幅 1:1。
  - 产品：罐子是哑光质感的圆柱形宽口罐，盖子打开，罐口堆着冒尖的[草莓形状的半透明红色软糖]，软糖表面有晶莹的光泽；品牌字样下方只有两三行很小的说明文字（可以用短横线代替，不要出现乱码）。
  - 点缀：罐子右侧靠着[一颗新鲜草莓]，展台前方的台面上放着[一小堆蓝莓]。
  - 背景：[蜜桃色到粉色]的柔和渐变，极简，没有其他物体。
  - 光线：柔和的影棚光，阴影很淡，软糖和水果上有真实的高光与反射。
  - 镜头：居中构图，85mm 镜头的透视感，浅景深，商业产品摄影的质感，细节清晰。
  - 气质：高端营养品品牌的包装感，字体干净；不出现真实品牌标志和水印。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-nano-banana-pro-prompts
  url: https://x.com/Kashberg_0/status/2023968546007773594
  author: "@Kashberg_0"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文包含 4 个相近的变体，这里取第 1 个译为中文并整理为分条；品牌字样、罐体颜色、软糖造型、水果点缀、背景色改为变量；补充了\"罐身小字用短横线代替\"的建议"
images:
  - 3514-gummy-supplement-jar-pastel-pedestal-render-1.jpg
imageCredit:
  by: "@Kashberg_0"
  url: https://youmind.com/nano-banana-pro-prompts?id=10338
  license: CC BY 4.0
verify:
  - "上线前在 Nano Banana 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：[粉色] 是罐体和展台的主色，换口味时一起换，如"柠檬黄""薄荷绿""葡萄紫"；[lik] 换成你的品牌名，英文 3～6 个字母最清楚；软糖造型和两处水果点缀写成对应口味，例如"小熊形状的橙色软糖"配"半个切开的橙子"和"几片薄荷叶"；背景渐变用与罐体相邻的两种浅色。

示例图是方形画面：粉色渐变背景前有一个浅粉色圆台，上面立着一只打开的玫粉色罐子，罐口堆着透明的红色软糖，罐身是三个白色大字母，下面几行小字是乱码；罐子右边靠着一颗带叶的草莓，圆台左前方是一小堆蓝莓。

**常见问题**：
- 罐身小字是乱码：加"除品牌名外不出现任何小字"，标签信息后期自己排。
- 软糖像塑料珠：强调"半透明、带砂糖颗粒或果冻光泽、有轻微的不规则"。
- 画面太空：在背景里加"一道柔和的弧形光影"或把展台改成两级台阶。

**适合**：营养软糖、零食罐、护肤品小罐的电商主图和社媒海报；营养与功效类文字请按广告法规自行审核后再添加。

### 英文原版

```text
Ultra-realistic 3D product render of a pink gummy vitamin jar labeled “{argument name="Label 1" default="lik"}”, placed on a round pastel pink pedestal. The jar is open and filled with glossy strawberry-shaped gummies. A fresh strawberry rests beside the jar and a small cluster of blueberries sits on the platform. Soft peach-to-pink gradient background, minimal aesthetic, soft studio lighting, subtle shadows, high detail, clean typography, premium supplement branding, centered composition, 85mm lens look, shallow depth of field, commercial product photography, 8K resolution.

⸻

Minimal 3D product visualization of a matte pink supplement jar labeled “{argument name="Label 2" default="GUNY"}”, open and filled with translucent red gummies. The jar sits on a square pastel pink block pedestal. Fresh strawberry on the right and blueberries scattered on the left. Smooth peach gradient background, soft diffused lighting, realistic reflections on gummies, modern packaging design, bold white typography, clean composition, high-end cosmetic/supplement advertisement style, ultra-detailed, studio render, 8K.

⸻

Premium 3D render of a vibrant pink vitamin bottle labeled “{argument name="Label 3" default="Dan."}” placed on a round pastel pedestal. The open bottle is filled with glossy deep-red capsule gummies. Fresh strawberry positioned beside the bottle and blueberries scattered in front. Warm peach gradient backdrop, soft cinematic lighting, realistic shadows, smooth matte packaging texture, bold minimal typography, commercial product photography, shallow depth of field, ultra-realistic, 8K studio render.

⸻

High-end product render of a transparent glass jar labeled “{argument name="Label 4" default="desmy SO."}” filled with red gummy vitamins. The jar sits on a round pastel pink pedestal with a strawberry leaning against it and blueberries arranged in front. Soft peach gradient background, minimal modern aesthetic, soft studio lighting with gentle highlights on glass, realistic reflections, clean white typography, premium supplement branding, centered composition, ultra-detailed 3D render, 8K resolution.
```

> 改编自 [@Kashberg_0](https://x.com/Kashberg_0/status/2023968546007773594) 发布、[YouMind-OpenLab/awesome-nano-banana-pro-prompts](https://github.com/YouMind-OpenLab/awesome-nano-banana-pro-prompts) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
