---
title: "照片转插画提示词：北欧极简童话风手绘插画头像（细线条 + 粉彩平涂）（gpt-image-2）"
slug: photo-to-scandinavian-kids-illustration
model: gpt-image-2
topics: [illustration]
aspectRatio: "1:1"
needsRefImage: true
useCase: "上传一张自拍或生活照，转成北欧育儿明信片风的极简手绘插画：细长的造型、不完美的细线、平涂粉彩、玩偶般的小五官和腮红，白底点缀小星星，适合做头像、个人名片插画和手账贴纸。"
prompt: |
  把这张照片转成一幅[精致极简的手绘儿童插画]，带柔和的童话美感。
  使用简单拉长的造型、细而不完美的手绘线条、平涂粉彩色、极少的细节，人物是可爱的玩偶风：红润的脸颊、小小的五官。
  加入细微的纸张纹理、柔和的铅笔与粉彩笔明暗、水彩般的柔软感，背景是[干净的白色，点缀小星星或闪光]。
  服装按童书风格简化造型，配温柔的装饰细节。
  整体感觉[轻盈、温馨、天真、迷人]，像现代北欧风的育儿明信片或儿童绘本插画。
  画幅 1:1，人物居中偏下，头顶留出一些空白放小星星。
  照片里人物手上拿的东西、包、眼镜和衣服颜色尽量保留，变成童书里的简化小道具。
  避免：写实照片感、3D、电影光、光亮表面、复杂阴影、写实人体结构和过多细节。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/0xluffy_eth/status/2057069844584108490
  author: "路飞 🏴‍☠️ AI 研究员🧐"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "原文中文说明的英文写法改写为中文；插画风格、背景、氛围改为变量"
images:
  - 3146-photo-to-scandinavian-kids-illustration-1.jpg
imageCredit:
  by: "路飞 🏴‍☠️ AI 研究员🧐"
  url: https://youmind.com/gpt-image-2-prompts?id=21681
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：上传一张自己的照片（半身或全身都可以，请只用本人或已获同意的照片）；插画风格可以换成"日系手账风简笔画""蜡笔绘本风"；背景可以写"淡粉色纯色背景，点缀小爱心"；氛围换成"夏日、清爽、元气"。手里拿的东西、衣服颜色会尽量保留原照片里的。

示例图是一张白底插画：一位戴细框眼镜、黑色长发的女生咬着吸管喝饮料，另一只手拿着手机，穿草绿色宽松 T 恤、斜挎包带，脸颊有圆圆的腮红，周围点缀着小星星和几枝叶子，线条细而轻。

**常见问题**：
- 太像原照片：强调"极少细节、玩偶般的小五官、平涂色"。
- 人物比例太写实：写"头身比稍大，四肢细长简化"。
- 想做系列头像：固定风格描述，换不同照片即可。

**适合**：社交头像、个人名片 / 简介插画、手账贴纸、明信片。

### 原版提示词

```text
Convert the photo into a {argument name="illustration style" default="refined minimalist hand-drawn children's illustration"} with a soft fairytale aesthetic. Use simple elongated shapes, thin imperfect hand-drawn lines, flat pastel colors, minimal detail, and a cute doll-like character style with rosy cheeks and tiny facial features. Add subtle paper textures, soft pencil and pastel shading, watercolor softness, and a {argument name="background" default="clean white background with small stars or sparkles"}. Clothing follows a playful storybook style with simplified shapes and gentle decorative details. The overall vibe should feel {argument name="atmosphere" default="airy, cozy, innocent, and charming"}, like a modern Scandinavian nursery postcard or children's book illustration. Avoid photorealism, 3D, cinematic lighting, glossy surfaces, complex shadows, realistic anatomy, and super details.
```

> 改编自 [路飞 🏴‍☠️ AI 研究员🧐](https://x.com/0xluffy_eth/status/2057069844584108490) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
