---
title: "ai包装设计提示词：抹茶饮料铝罐概念样机，水墨远山罐身 + 晨光石台场景（gpt-image-2）"
slug: matcha-drink-can-mockup-stone-window-light
model: gpt-image-2
topics: [ecommerce, photography]
aspectRatio: "4:5"
needsRefImage: false
useCase: "新品还在概念阶段、没有实物时，先出一张像实拍一样的包装样机图：一只细长铝罐放在石台上，晨光从窗边斜照进来，罐身是极简的日式设计，指定的品名和几行标签文字都要拼写准确。"
prompt: |
  生成一张照片级写实的产品包装样机图，产品是一款[高端抹茶能量饮料]，品牌名"[FOCUS LEAF]"。画幅 4:5 竖版。
  - 场景：一只细长的铝罐立在哑光的石质台面上，清晨柔和的阳光从左侧的木格窗斜照进来，在墙面和台面上投下窗格与叶影；背景虚化处有一只粗陶茶碗和一把竹茶筅，前景散落两片绿叶。
  - 包装设计：极简的日式风格，配色是[浅抹茶绿和奶油白]；罐身上部一个细线圆环里是一枝叶片的线描标志，下面是两行衬线大字的品牌名；罐身下半部分是淡淡的水墨远山与湖面。
  - 罐身文字必须准确，且只有这几行："[FOCUS LEAF]"、"[MATCHA + L-THEANINE]"、"[ZERO SUGAR]"、"[12 FL OZ]"。
  - 细节：罐身挂着细密的冷凝水珠，铝罐顶部的金属拉环清晰；阴影真实自然。
  - 用途：产品概念展示。
  - 限制：所有文字拼写正确，不出现任何其他品牌名，字体不能变形；不要水印。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/gpt_image_2/status/2060896517368787038
  author: "@gpt_image_2"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文并整理为分条；产品类型、品牌名、三行标签文字、配色改为变量；按示例图补充了罐身的叶片圆标与水墨远山、背景里的茶碗与茶筅"
images:
  - 3525-matcha-drink-can-mockup-stone-window-light-1.jpg
imageCredit:
  by: "@gpt_image_2"
  url: https://youmind.com/gpt-image-2-prompts?id=23439
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：产品类型和品牌名换成你的；后面三行分别是"核心成分 / 卖点 / 容量"，每行英文控制在 20 个字符以内，也可以换成中文（如"抹茶 + 茶氨酸""无糖""330 毫升"）；注意品牌名在提示词里出现两次，要一起改。配色决定整体气质，例如乌龙茶可用"焙茶棕和米白"，背景道具也相应换成"紫砂壶和茶则"。

示例图是一只浅绿色渐变到奶白色的细长罐，上部是圆环里的叶片标志和"FOCUS LEAF"两行大字，中间一行小字写成分，下部是水墨风的远山和湖岸，再下面是"ZERO SUGAR"和容量；罐身布满水珠，立在浅色石台上，左边是木窗格投下的光影，右后方是一只深色茶碗和竹茶筅。

**常见问题**：
- 罐身多出莫名的小字：保留"只有这几行文字"的限制，并把行数减到三行。
- 水珠太多遮住文字：写"水珠细小而稀疏，不遮挡文字"。
- 看起来像 3D 渲染：加"自然光实拍质感，轻微景深和镜头暗角"。

**适合**：新品概念提案、众筹和预售页的示意图、包装方向的内部评审；成图不能替代正式的包装设计稿和印刷文件。

### 英文原版

```text
Generate a photorealistic product packaging mockup for a {argument name="product type" default="premium matcha energy drink"} named “{argument name="brand name" default="FOCUS LEAF"}”. Scene: one sleek aluminum can on a matte stone surface with soft morning window light. Important details: minimalist Japanese-inspired design, pale green and cream palette, condensation droplets, realistic shadows. Include exact label text: “FOCUS LEAF”, “MATCHA + L-THEANINE”, “ZERO SUGAR”, “12 FL OZ”. Use case: product concept. Constraints: all text must be spelled correctly, no extra brand names, no distorted typography.
```

> 改编自 [@gpt_image_2](https://x.com/gpt_image_2/status/2060896517368787038) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
