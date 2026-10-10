---
title: "ai头像生成提示词：黑白点画墨水职业肖像，制图纸质感（gpt-image-2）"
slug: stippled-ink-business-portrait
model: gpt-image-2
topics: [portrait, illustration]
aspectRatio: "3:4"
needsRefImage: false
useCase: "想要一张有手绘质感、又足够正式的头像时用：胸部以上的正面肖像完全由细密墨点堆出明暗，背景是带淡淡网格线的老式制图纸，只有镜片留一点暖色。"
prompt: |
  画一幅超写实的黑白点画（stippling）墨水肖像：[一位年轻的南亚女性]，胸部以上，居中的正式证件照式构图。
  - 人物正面直视前方，神情平静自信，五官对称，眼睛大而有神，嘴唇有柔和的明暗；皮肤完全由无数细小的黑色墨点堆叠出来，明暗层次丰富；
  - 佩戴[黑色圆框眼镜，镜片带暖琥珀色]，镜框上有细微高光和小小的铰链细节；
  - 发型：[深色头发中分，松松地盘成高丸子头]，发量蓬松，有零散的碎发和垂在脸侧的发丝，用细密的墨线排线和点画阴影表现；
  - 服装：[深色修身西装外套、白衬衫、黑领带]；
  - 背景：米白色有纹理的纸张，上面有淡淡的作图辅助网格线和细小的制图标记，像一张老式工程制图；
  - 画面高度精细，单色墨水，面部结构真实，点画渐变柔和，焦点落在脸和眼镜上；肩膀向下方和两侧逐渐散开成松散、未完成的点状草稿边缘；
  - 不要任何文字和水印；除镜片上那一点暖色外不出现其他颜色。竖版[3:4]。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/Arina_hoqe/status/2075764508036149707
  author: "@Arina_hoqe"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文并拆成要点；人物、眼镜、发型、服装、画幅改为变量；合并了重复的\"高细节\"描述；正文补充了上传本人照片的用法和不能当证件照的提醒。"
images:
  - 3469-stippled-ink-business-portrait-1.jpg
imageCredit:
  by: "@Arina_hoqe"
  url: https://youmind.com/gpt-image-2-prompts?id=28447
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：[一位年轻的南亚女性] 换成你要画的人物，如"一位三十岁左右的东亚男性""一位短发的中年女教授"；眼镜、发型、服装三处按需要改，不戴眼镜就写"不戴眼镜"，并把最后一句里"除镜片上那一点暖色外"删掉。想画自己，可以上传一张正面照，把人物描述改成"按上传照片中的人物绘制，保持五官特征"。

示例图是一张米白色制图纸上的黑白点画肖像：一位中分高丸子头、脸侧垂着碎发的年轻女性正面直视，戴黑色圆框眼镜，镜片是整个画面唯一的暖琥珀色；穿深色西装、白衬衫和黑领带，肩部以下散成未完成的墨点；背景有淡淡的网格辅助线。

**常见问题**：
- 画成了铅笔素描或灰度照片：强调"只用墨点和细排线，不要涂抹式的灰调"。
- 点太粗、脸显脏：加"墨点极细，脸部受光面大面积留白"。
- 网格线太抢眼：写"辅助线非常淡，几乎看不见"。

**适合**：个人主页头像、作者简介配图、名片或文章署名肖像。这是插画风格的肖像，不能当证件照使用；画他人肖像前请先征得本人同意。

### 英文原版

```text
Create an ultra-realistic black-and-white stippling ink portrait of {argument name="character description" default="a beautiful young South Asian woman"}, shown from the chest up in a centered, formal ID-style composition. She faces directly forward with a calm, confident neutral expression, symmetrical features, large expressive eyes, full softly shaded lips, and smooth youthful skin rendered entirely through millions of tiny black ink dots with exceptional tonal depth. She wears {argument name="eyewear" default="large black rounded cat-eye glasses with warm translucent amber lenses"}, with subtle highlights and visible tiny hinge details. Her {argument name="hair style" default="dark hair in a loose high messy bun with a center part, voluminous strands, wispy flyaway hairs, and loose tendrils framing the face"} is drawn with dense fine ink hatching and stippled shadows. Dress her in {argument name="outfit" default="a dark tailored business suit jacket, crisp white collared shirt, and black necktie"}. Use a vintage technical drawing aesthetic on an off-white textured paper background with faint construction grid lines and delicate drafting marks. The portrait should be highly detailed, monochrome ink with realistic facial anatomy, soft stipple gradients, sharp focus on the face and glasses, shoulders fading into loose unfinished dotted sketch edges at the bottom and sides. No text, no watermark, no color except the subtle warm tint in the lenses.
```

> 改编自 [@Arina_hoqe](https://x.com/Arina_hoqe/status/2075764508036149707) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
