---
title: 电商详情页提示词：食材飞溅定格美食摄影，沙拉从黑碗中炸开的悬浮大片
slug: flying-salad-food-photography
model: gpt-image-2
topics: [food, photography]
needsRefImage: false
aspectRatio: "2:3"
useCase: 做轻食店菜单主图、外卖平台详情页、健康饮品 / 沙拉品牌海报时，生成一张"食材从碗里向上炸开、在空中定格"的高速摄影风大片，水珠和油滴都清晰可见。
prompt: |
  一张超写实的美食摄影：一碗[蔬菜沙拉]从哑光黑色碗中向上"爆炸"飞散，所有食材在半空中定格。
  - 场景：黑碗放在一块圆形原木切片上，背景是从米白柔和过渡到暖米色的渐变；
  - 食材：绿色生菜叶、圣女果（整颗和切片）、弯成弧形叠在一起的黄瓜片、黑橄榄、白色[芝士块]、一片橙子、小朵西兰花、新鲜罗勒叶，还有一道正在下落的橄榄油；
  - 动态：食材沿弧线飞起并轻微旋转，少数带一点运动模糊；食材之间漂浮着细小的油滴和水珠；碗本身完全静止，哑光表面吸收高光；
  - 光线：影棚级、高反差的电影感布光，一盏方向性主光照亮每样食材表面的水润感；
  - 清晰度：极致锐利，能看到微观纹理；
  - 风格：获奖级美食摄影，不要 CG 感，像一本烹饪书的封面。
  画幅[2:3] 竖版。
negativePrompt: null
source:
  repo: wuyoscar/GPT-Image2-Skill
  url: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/skills/gpt-image/references/gallery-product-and-food.md
  author: "@ChillaiKalan__"
  license: MIT
  licenseUrl: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/LICENSE
  changes: 原文是 JSON 结构，改写成中文分点描述并保留全部核心要素；主菜品、芝士类型、画幅设为变量；去掉 8K 等分辨率参数
images:
  - 3232-flying-salad-food-photography-1.jpg
imageCredit:
  by: "@ChillaiKalan__"
  url: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/docs/product-food/food-salad-explosion.png
  license: MIT
verify:
  - 原始出处：原帖：https://x.com/ChillaiKalan__，核对原帖仍可访问、作者未另行声明保留权利
  - 换成"水果捞""拉面"各出一次，看飞溅效果是否同样自然
  - 页面署名需保留"Copyright (c) 2026 Wuyoscar, MIT License"及许可证链接
---
**怎么填变量**：[蔬菜沙拉] 可以换成"水果酸奶碗""牛肉拉面""麻辣烫""冰镇水果茶"，食材清单要跟着改成对应的真实配料，例如拉面写"面条、牛肉片、香菜、葱花、红油"；[芝士块] 换成"鸡胸肉块""牛油果丁"。碗的颜色可以按品牌色改。示例图是原作者的出图：黑色圆碗稳稳放在木桩切片上，生菜、圣女果、一串黄瓜片、黑橄榄、白色芝士丁、西兰花、罗勒叶和半片橙子向上飞散，一道金色橄榄油从上方淋下，周围飘着细小油珠，背景是暖米色。

**常见问题与调整**：
- 食材糊成一团：加"食材之间有明显间隔，主要食材不超过 10 种"。
- 像 3D 渲染：强调"真实相机高速快门拍摄，有自然的景深和轻微噪点"。
- 碗也飞起来了：加"碗和木板完全静止，只有食材在动"。
- 想要横版 banner：画幅改 16:9，加"碗放在画面右侧三分之一，左侧留空写文案"。

**适合**：轻食 / 外卖菜单主图、餐饮品牌海报、详情页首图；用于商品宣传时，请确保实际菜品的食材与图片一致。

### 英文原版

```
{
  "global_settings": {
    "resolution": "8K ultra high definition",
    "aspect_ratio": "2:3 vertical",
    "style": "hyper-realistic food photography",
    "clarity": "extreme sharpness, micro-texture visibility",
    "motion": "frozen action with suspended ingredients",
    "lighting_quality": "studio-grade, high-contrast, cinematic"
  },
  "scene_description": "A dynamic salad explosion emerging from a matte black bowl placed on a round wooden surface. Ingredients are mid-air, scattered upward and outward, each ingredient lit by a directional key light that highlights surface moisture.",
  "ingredients_visible": [
    "green lettuce leaves", "cherry tomatoes (whole and sliced)", "cucumber slices arranged in a curved stack",
    "black olives", "white cheese cubes", "orange citrus slice", "small broccoli florets",
    "fresh green basil leaves", "a drizzle of olive oil caught mid-fall"
  ],
  "motion_details": {
    "ingredients": "caught mid-arc, rotating slightly, some lightly blurred to convey motion",
    "particles": "tiny droplets of olive oil and water beads floating between ingredients",
    "bowl": "perfectly still, matte black, absorbing highlights"
  },
  "environment": { "background": "softly graded off-white to warm beige", "surface": "circular cut of raw oak wood" },
  "render_flags": ["food photography award-winning", "no CGI tell", "editorial cookbook cover feel"]
}
```

> 改编自 [@ChillaiKalan__](https://x.com/ChillaiKalan__) 发布、[wuyoscar/GPT-Image2-Skill](https://github.com/wuyoscar/GPT-Image2-Skill) 收录的提示词，仓库许可证 MIT（Copyright (c) 2026 Wuyoscar）。
