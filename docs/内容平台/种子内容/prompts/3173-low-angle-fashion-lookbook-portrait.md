---
title: "时尚写真提示词：低角度仰拍的极简建筑前人像（黄金时段 + 黑白 / 彩色两版）（gpt-image-2）"
slug: low-angle-fashion-lookbook-portrait
model: gpt-image-2
topics: [fashion, photography]
aspectRatio: "4:5"
needsRefImage: false
useCase: "生成一张杂志 lookbook 风格的低角度时尚人像：短发人物穿宽松衬衫仰望天空，背景是极简现代建筑和晴空，黄金时段光线和胶片颗粒，同时出黑白和彩色两版，适合服装品牌 lookbook、写真参考和社媒封面。"
prompt: |
  低角度时尚大片：一位[东亚女性]，留着[黑色短波波头]，若有所思地仰望天空。
  她穿着一件宽大松垮的[浅蓝色]棉质衬衫，领口敞开，戴一对小小的金色圈形耳环。
  温暖的黄金时段阳光在她的脸和脖子上投下柔和的阴影；背景是晴空下的极简现代建筑。
  电影感摄影，35mm 胶片颗粒，自然的皮肤纹理，景深，焦点锐利，lookbook 时尚画册风格，8K。
  同时输出黑白版和彩色版两张图。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/ChillaiKalan__/status/2080674173207322908
  author: "K"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文；人物、发型、衬衫颜色改为变量，合并原文重复的两段描述"
images:
  - 3173-low-angle-fashion-lookbook-portrait-1.jpg
  - 3173-low-angle-fashion-lookbook-portrait-2.jpg
imageCredit:
  by: "K"
  url: https://youmind.com/gpt-image-2-prompts?id=29669
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：人物、发型和衬衫颜色可以按你的服装改，例如"[男性模特]／[寸头]／[米白色]"；想展示自己的服装，上传服装平铺图并写"人物穿着参考图中的衬衫"。背景可以换成"红砖墙""海边栈道""城市天台"。不要描述成任何真实明星。

示例图两张：黑白版——低角度仰拍的短发女子，敞领白衬衫，背后是几何感的混凝土建筑和天空；彩色版——同一构图，浅蓝衬衫在夕阳下泛暖光，背景是米色建筑和蓝天。

**常见问题**：
- 两版构图不一致：分两次生成时，第二次上传第一张并写"保持完全相同的构图，只改成黑白 / 彩色"。
- 皮肤像磨皮：保留"自然皮肤纹理、胶片颗粒"。
- 角度不够低：写"相机放在腰部以下，向上 30 度仰拍"。

**适合**：服装品牌 lookbook、写真拍摄参考、社媒封面、杂志风海报。

### 英文原版

```text
Low-angle fashion editorial shot of an {argument name="subject" default="East Asian woman"} with a {argument name="hairstyle" default="short black bob hairstyle"}, gazing upwards thoughtfully. She is wearing an oversized, loose {argument name="shirt color" default="light blue"} button-up shirt with an open collar. Warm golden hour sunlight creates soft shadows across her face and neck. Small gold hoop earrings. Minimalist modern architecture background under a clear sky. Cinematic photography, 35mm film grain, natural skin texture, depth of field, 8k resolution. Low-angle outdoor portrait of a stylish East Asian woman with a dark short bob, wearing an unbuttoned light blue cotton shirt, looking up toward the sky. Golden hour sunlight, subtle film grain, aesthetic fashion lookbook style, sharp focus. Make it in black and white and colour images
```

> 改编自 [K](https://x.com/ChillaiKalan__/status/2080674173207322908) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
