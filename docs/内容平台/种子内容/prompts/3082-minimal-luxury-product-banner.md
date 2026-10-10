---
title: "电商横幅提示词：极简轻奢风产品主视觉（沙发 / 茶叶等任意产品）（gpt-image-2）"
slug: minimal-luxury-product-banner
model: gpt-image-2
topics: [ecommerce, interior]
aspectRatio: "16:9"
needsRefImage: false
useCase: "一个通用的高端品牌横幅模板：产品居中或放在黄金分割位，大面积留白、流体曲线和低饱和莫兰迪色背景，适合家具、茶叶、家电等产品的官网 Banner、电商首屏和品牌海报。"
prompt: |
  以[沙发]为中心，创作一张高端品牌视觉海报，采用现代极简美学和轻奢商业风格，画面干净高级，有国际品牌广告感。
  [沙发]是视觉中心，横版构图，主体居中或放在黄金分割位置；版面强调留白和视觉呼吸感，前景、中景、背景层次清晰。
  背景使用抽象艺术设计，结合流动曲线、几何切面、自然纹理或高级装饰元素。
  整体配色围绕[奶油绿与暖灰]，使用低饱和、莫兰迪或中性色调，加少量点缀色聚焦。
  材质细腻真实，柔和的漫反射和高级质感；自然光营造温暖、纯净、舒适的氛围。
  左侧留出标题区：一行细长的英文品牌词、一行中文小标语。
  商业级修图，8K 分辨率，适合品牌宣传和电商使用。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/all7i8n9/status/2055233859684532232
  author: "Alpha.等风"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "原文中文说明的英文写法改写为中文；产品、主色调改为变量"
images:
  - 3082-minimal-luxury-product-banner-1.jpg
  - 3082-minimal-luxury-product-banner-2.jpg
imageCredit:
  by: "Alpha.等风"
  url: https://youmind.com/gpt-image-2-prompts?id=20507
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：两处 [沙发] 一起换成你的产品，如"茶叶罐""电动牙刷""香薰机"；[奶油绿与暖灰] 换成与产品匹配的色调（茶叶用"淡绿与米白"，科技产品用"冷灰与银白"）。需要指定标题文字时，在"标题区"那句里直接写出来。

示例图两张：一张是奶油绿弧形墙前的浅灰绿布艺沙发、圆形茶几和落地灯，左侧"SOFA LUXURY LIVING"和中文小字；另一张是淡绿水墨晕染背景上的一罐"高山绿茶"、一碟茶叶和一杯茶汤，左侧"NATURAL TEA COLLECTION"。

**常见问题**：
- 产品被背景淹没：写"背景元素只占画面三分之一，颜色比产品更浅"。
- 横幅要放文字但空间不够：明确"左侧 40% 留白给文字"。
- 用自己的产品：上传产品图并写"产品外观按参考图，只设计背景与光影"。

**适合**：官网 Banner、电商首屏横幅、品牌海报、新品发布图。

### 原版提示词

```text
Create a high-end brand visual poster centered on {argument name="subject" default="sofa"}, adopting modern minimalist aesthetics and light luxury commercial styles. The image is clean and premium with an international brand advertising feel. The {argument name="subject" default="sofa"} serves as the visual center, using a horizontal composition with the subject centered or at the golden ratio. The layout emphasizes white space and visual breathing room. Clear spatial layers are formed between foreground, midground, and background. The background features abstract artistic designs combined with fluid curves, geometric segments, natural textures, or premium decorative elements. The overall color scheme revolves around {argument name="main color tone" default="creamy green and warm gray"}, using low-saturation, Morandi, or neutral tones with accent colors for focus. Materials are detailed and realistic with soft diffuse reflection and high-end textures. Natural lighting creates a warm, pure, and comfortable atmosphere. Commercial-grade retouching, 8K resolution, suitable for brand promotion and e-commerce.
```

> 改编自 [Alpha.等风](https://x.com/all7i8n9/status/2055233859684532232) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
