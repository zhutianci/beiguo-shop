---
title: "AI美食图提示词：日式拉面写实特写（菜单 / 外卖主图，配料逐项可控）（gpt-image-2）"
slug: ramen-bowl-menu-food-photo
model: gpt-image-2
topics: [food]
aspectRatio: "1:1"
needsRefImage: false
useCase: "生成一张手机实拍质感的拉面特写：深色粗陶碗、透亮酱油汤、溏心蛋、叉烧、海苔、笋干、葱花逐项可控，适合面馆菜单、外卖平台主图和美食账号。"
prompt: |
  生成一张正方形、超写实的美食照片：温馨拉面馆里一张粗犷木桌上，一碗热气腾腾的[酱油拉面]。
  机位靠近碗，略高的正前方视角，浅景深：前方的配料和碗沿清晰，碗后部、汤勺和温暖的木质背景柔和虚化。左上方自然窗光，暖棕和金色调，汤面有油亮高光，淡淡的热气，像清晰的现代手机照片。
  拉面盛在一只深色带斑点的粗陶碗里，黑棕色釉面，碗沿有浅褐色环纹。恰好 7 种可见的配料或餐具：左侧竖插 1 大片深绿海苔；左前 1 个对半切开的溏心蛋，蛋黄橙亮；正前方 1 大片圆形浅色叉烧；勺子旁 1 片白底粉色漩涡的鸣门卷；左后方面条上横放 3 根浅褐色笋干；中央 1 小堆葱花；右后方碗沿横放 1 把盛着琥珀色汤的陶瓷木柄汤勺。
  细细的黄色面条在清澈的棕色酱油汤里卷曲，汤面浮着小油珠。背景只有带纹理的木桌和柔和虚化的暖色室内；不要人物、文字、Logo、多余餐具和筷子。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/ogizaru_tob8000/status/2092162384827969922
  author: "OGIZARU_おぎざる_"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文；菜品改为变量；保留\"恰好 7 种配料\"的逐项描述"
images:
  - 3043-ramen-bowl-menu-food-photo-1.jpg
imageCredit:
  by: "OGIZARU_おぎざる_"
  url: https://youmind.com/gpt-image-2-prompts?id=32640
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：[酱油拉面] 换成"豚骨拉面""味噌拉面""牛肉面""兰州拉面"时，要同步改汤色（豚骨写"乳白浓汤"）和配料清单（牛肉面写"牛肉片、萝卜片、香菜、辣油"）。配料逐项写清位置，是这条提示词稳定的关键。

示例图是一碗深色粗陶碗里的酱油拉面：左侧竖插海苔，左前溏心蛋，正前方大片叉烧，中间一撮葱花，旁边粉白鸣门卷，后面几根笋干，右后方汤勺里盛着琥珀色汤，背景是虚化的木桌。

**常见问题**：
- 配料堆成一团：减少配料数量，并强调"每样配料位置分开"。
- 像 CG 渲染：加"手机实拍质感、自然窗光、轻微噪点"。
- 用于外卖平台：主图建议改成"正上方俯拍、白色或浅木纹背景"，更符合平台规范。

**适合**：面馆菜单、外卖平台主图、美食账号、餐饮小程序配图。

### 英文原版

```text
Create a square, ultra-realistic food photograph of a steaming bowl of {argument name="dish" default="shoyu ramen"} on a rustic wooden table in a cozy ramen shop. The camera is close to the bowl at a slightly elevated front angle, using shallow depth of field: the front ramen toppings and bowl rim are crisp while the rear of the bowl, spoon, and warm wood background fall into soft bokeh. Use natural window light from the upper left, warm brown and golden tones, glossy broth highlights, subtle steam haze, and a high-clarity modern smartphone-photo look. The ramen is served in one dark speckled ceramic bowl with an earthy black-brown glaze and tan rim rings. Include exactly 7 visible topping or serving elements: 1 large sheet of dark green nori standing vertically on the left, 1 halved soft-boiled egg with glossy orange yolk at front left, 1 large round slice of pale chashu pork at the front, 1 small white narutomaki fish cake with a pink spiral near the spoon, 3 tan bamboo shoot strips across the back-left noodles, 1 mound of sliced green scallions in the center, and 1 pale ceramic-and-wood ramen spoon resting across the right rear rim filled with amber broth. Show thin yellow noodles curling through clear brown soy broth with small oil droplets. Background is only the textured wooden tabletop and softly blurred warm interior tones; no people, no text, no logos, no extra utensils, no chopsticks.
```

> 改编自 [OGIZARU_おぎざる_](https://x.com/ogizaru_tob8000/status/2092162384827969922) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
