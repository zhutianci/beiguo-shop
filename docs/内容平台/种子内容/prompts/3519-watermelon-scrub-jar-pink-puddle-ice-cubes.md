---
title: "ai产品图提示词：西瓜磨砂膏玻璃罐主图，粉色液面、西瓜角和冻着果肉的冰块（Nano Banana）"
slug: watermelon-scrub-jar-pink-puddle-ice-cubes
model: nano-banana
topics: [ecommerce, photography]
modelLabel: Nano Banana Pro
aspectRatio: "1:1"
needsRefImage: false
useCase: "给果味的护肤品、身体磨砂膏、果酱或饮品做一张清爽的同色系主图：产品放在一滩半透明的同色液体上，旁边是切开的水果和冻着果肉的冰块，粉色无缝背景，夏天感很强。"
prompt: |
  生成一张超写实的高端商业产品图，画幅 1:1。
  - 主体：[一只敞口的玻璃罐，装着粉色的西瓜磨砂膏]，放在画面中央；膏体颗粒分明、堆得冒尖；罐身正面一张白色小标签，写两行字："[WATERMELON]"和小一号的"[SHEA SUGAR SCRUB]"。
  - 台面：罐子下面是一滩半透明的粉色液体，边缘像水一样自然流开，表面平滑，映出罐子和道具的柔和倒影。
  - 道具：右后方立着一块三角形的[西瓜]，能看到黑色的籽；罐子周围散放几块冰块，冰里冻着小块的西瓜果肉；左侧一块小的果肉。
  - 背景：[柔和的粉色渐变]，无缝，没有任何线条和边界。
  - 光线：高端影棚布光，明亮柔和的漫射主光，玻璃和冰块上有清晰但不刺眼的高光，阴影很淡。
  - 质感：玻璃的通透、冰块的裂纹、果肉的纤维和磨砂膏的颗粒都清楚可见；整体清新、干净；文字清晰无错字，不出现真实品牌标志和水印。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-nano-banana-pro-prompts
  url: https://x.com/Strength04_X/status/2005881727126802819
  author: "@Strength04_X"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "JSON 原文改写为分条中文；主体产品、背景色保留为变量，新增标签文字与水果两个变量；按示例图补充了\"敞口罐里堆着粉色磨砂膏\"和倒影"
images:
  - 3519-watermelon-scrub-jar-pink-puddle-ice-cubes-1.jpg
imageCredit:
  by: "@Strength04_X"
  url: https://youmind.com/nano-banana-pro-prompts?id=4136
  license: CC BY 4.0
verify:
  - "上线前在 Nano Banana 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：主体换成你的产品，如"一瓶黄色的柠檬沐浴露""一罐绿色的抹茶面膜"；标签两行字换成产品名和品类（英文更稳；中文每行不超过 6 个字）；[西瓜] 换成对应的水果，冰块里冻的果肉、液面的颜色也会跟着走——记得把"粉色液体"一起改成对应颜色；背景色用和产品同色系的浅色。

示例图整体是蜜桃粉色：中间一只透明玻璃罐，里面是堆起来的粉色磨砂膏，标签上写着"WATERMELON / SHEA SUGAR SCRUB"；右后方一块带籽的西瓜角，左右各有几块冻着西瓜粒的透明冰块；所有东西都立在一滩粉色的液体上，下方有清楚的倒影。

**常见问题**：
- 冰块里没有果肉：单独强调"每块冰的内部都封着一小块果肉"。
- 液面像镜子一样铺满全画：写"液体只在产品周围形成一滩，边缘不规则"。
- 标签文字出错：只留一行大字。

**适合**：果味护肤品、饮品和甜品的电商主图、夏季上新海报；功效类文字请按广告法规自行审核后再添加。

### 英文原版

```text
{
  "type": "image_generation",
  "style": "hyper_photorealistic",
  "resolution": "8K",
  "aspect_ratio": "1:1",
  "quality": "premium commercial",
  "scene": {
    "subject": "{argument name="subject" default="A cosmetic skincare jar placed at center"}",
    "surface": "Smooth puddle of translucent pink liquid spreading organically beneath the jar with soft reflections and fluid edges",
    "props": [
      "Fresh triangular watermelon wedge with visible black seeds placed on the right",
      "Several ice cubes embedded with small watermelon pieces around the jar"
    ],
    "background": {
      "color": "{argument name="background color" default="soft pastel pink gradient"}",
      "texture": "smooth, seamless, no visible lines or edges"
    }
  },
  "lighting": {
    "type": "high-end studio lighting",
    "key_light": "bright diffused light from upper left",
    "fill_light": "soft fill for even exposure",
    "shadows": "soft natural shadows grounding the product",
    "effects": "enhanced sparkle on sugar crystals and crystal-clear ice"
  },
  "color_palette": [
    "watermelon red",
    "blush pink",
    "soft peach",
    "clear ice tones",
    "crisp white highlights"
  ],
  "composition": {
    "camera_angle": "eye-level",
    "shot_type": "close-up hero shot",
    "depth_of_field": "moderate, sharp foreground with smooth background blur"
  },
  "aesthetic": [
    "clean skincare advertising",
    "fresh and refreshing mood",
    "glossy realism",
    "ultra-detailed textures",
    "luxury commercial finish"
  ]
}
```

> 改编自 [@Strength04_X](https://x.com/Strength04_X/status/2005881727126802819) 发布、[YouMind-OpenLab/awesome-nano-banana-pro-prompts](https://github.com/YouMind-OpenLab/awesome-nano-banana-pro-prompts) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
