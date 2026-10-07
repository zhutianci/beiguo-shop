---
title: "护肤品广告提示词：模特 + 精华液上下两联广告图（维C精华示例）（gpt-image-2）"
slug: skincare-model-two-panel-ad
model: gpt-image-2
topics: [ecommerce, portrait]
aspectRatio: "3:4"
needsRefImage: false
useCase: "生成一张上下两联的护肤品广告：上图模特用滴管把精华滴在脸颊，下图轻拍上脸，配产品瓶和新鲜橙子，金色暖光，适合护肤品详情页、种草图和品牌社媒。"
prompt: |
  为[维C精华液]生成一张高端电影感的奢华护肤广告，主打光泽肌肤、金橙色精华和新鲜橙子。
  画布：3:4 竖版，上下分成恰好 2 个横向画面，中间一条细白分隔线。温暖的黄金时段阳光，浅景深，光亮的反光表面，高端美妆广告摄影。
  人物：一位美丽的年轻女性，[深棕色长发]，自然有光泽的皮肤，五官柔和精致，浓眉，淡淡的暖色妆容，小耳钉和细项链，温柔自信的微笑；穿一件简单的白色吊带，表情平静清新，看向镜头。
  上图：美妆特写——她拿着金色瓶盖的玻璃滴管靠近脸颊，一滴金橙色精华正挂在滴管口、滑落到皮肤上。右前景一只琥珀色玻璃瓶，金色标签写着"VITAMIN C SERUM"和小字"BRIGHTENING & GLOW BOOSTING"。画面中 2 个橙子元素：左下前景半个切开的橙子，瓶子后面一个完整或部分的橙子。背景是虚化的阳光窗户、米色窗帘和室内绿植。
  下图：同一位女性用指尖轻轻按摩右侧脸颊，保持柔和自信的笑容，肌肤水润有光泽。左前景一个小透明玻璃台上放着同款琥珀色滴管瓶。画面中 5 个橙子元素（左边整橙、左下切半、中前一瓣、右下大切片、右边整橙），点缀几片绿叶和温暖的背景光斑。
  视觉风格：超写实商业美妆摄影，奢华的琥珀与柑橘色调，温暖阳光，真实皮肤纹理，水润高光，真实的精华光泽，精致反射，柔和的电影焦点。
  限制：恰好 2 个画面、2 次产品瓶出现、上图恰好 1 滴可见的精华，除产品标签外不要其他文字。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/AmeliaAi12/status/2087010448579457220
  author: "Amelia Ai"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文；产品名、发色改为变量；保留两联构图与道具数量约束"
images:
  - 3047-skincare-model-two-panel-ad-1.jpg
imageCredit:
  by: "Amelia Ai"
  url: https://youmind.com/gpt-image-2-prompts?id=31147
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：[维C精华液] 换成你的产品，如"玻尿酸保湿精华""烟酰胺身体乳"，同时把"金橙色精华""橙子"换成与成分相关的道具（玻尿酸配水滴和蓝色调、玫瑰精华配玫瑰花瓣）；瓶身标签文字按产品改写。[深棕色长发] 可以改成"黑色短发"等。人物不要描述成任何真实明星。

示例图上下两联：上图深棕长发的女性用金色滴管往脸颊点精华，右侧琥珀瓶和切开的橙子；下图她用手指轻拍脸颊，前景是琥珀瓶和一圈橙子，整体金色暖光。

**常见问题**：
- 上下两张不像同一个人：加"上下两张必须是同一位模特，发型妆容一致"。
- 标签文字出错：标签控制在两行英文以内，或后期自己贴标签。
- 宣传用语：画面里不要写"美白""祛斑"等功效承诺，正式投放需符合化妆品广告规范。

**适合**：护肤品详情页、种草笔记配图、品牌社媒广告、电商首图。

### 英文原版

```text
Goal: Create a high-end cinematic luxury skincare advertisement for {argument name="product name" default="Vitamin C Serum"}, focused on radiant skin, golden-orange serum, and fresh oranges.

Canvas: Vertical 3:4 image, split into exactly 2 horizontal panels separated by a thin white divider line. Warm golden-hour sunlight, shallow depth of field, glossy reflective surfaces, premium beauty-ad photography.

Subject details: A beautiful young woman with {argument name="hair color" default="long dark brown hair"}, natural glowing skin, soft elegant facial features, thick brows, minimal warm makeup, small stud earrings, a delicate necklace, and a gentle confident smile. She wears a simple white camisole. Her expression is calm, fresh, and natural, looking toward the camera.

Top panel: Close-up beauty shot of the woman holding a glass dropper with a metallic gold cap near her cheek. A single golden-orange serum droplet is visibly hanging from the pipette and gliding onto her skin. Place one amber glass skincare bottle on the right foreground with a gold label reading “VITAMIN C SERUM” and smaller text “BRIGHTENING & GLOW BOOSTING” plus “30ml e 1.01 fl.oz.” Include exactly 2 visible orange elements in this panel: 1 large cut orange half in the lower-left foreground and 1 whole/partial orange behind the bottle on the right. Background: softly blurred sunlit window, beige curtains, indoor greenery.

Bottom panel: Show the same woman gently massaging serum into her right cheek with her fingertips, maintaining a soft confident smile and radiant hydrated skin. Place one amber dropper bottle on a small clear glass pedestal at the left foreground, with the white dropper top visible and the same gold “VITAMIN C SERUM” label. Include exactly 5 visible orange elements in this panel: 1 whole orange on the far left, 1 cut orange half/slice at the lower left, 1 orange wedge near the center foreground, 1 large cut orange slice in the lower-right foreground, and 1 whole/partial orange on the far right. Add a few green leaves around the oranges and warm bokeh highlights in the background.

Visual style: Ultra-realistic commercial beauty photography, luxurious amber and citrus color palette, warm sunlight, natural skin texture, dewy highlights, realistic serum gloss, polished reflections, soft cinematic focus, premium skincare advertising composition.

Constraints: Use exactly 2 stacked panels, exactly 2 product bottle appearances, exactly 1 visible serum droplet in the top panel, and no extra text beyond the product label.
```

> 改编自 [Amelia Ai](https://x.com/AmeliaAi12/status/2087010448579457220) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
