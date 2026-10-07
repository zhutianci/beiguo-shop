---
title: "四格漫画提示词：角色一致 + 中文对白正确的暖色治愈系四格（情侣 / 猫狗日常）（gpt-image-2）"
slug: consistent-character-4-panel-comic
model: gpt-image-2
topics: [comic]
aspectRatio: "1:1"
needsRefImage: false
useCase: "生成一组 2×2 的暖棕色调日系治愈四格漫画，强制要求四格里角色的脸、发型、服装完全一致，对白气泡里的中文清晰正确，适合情侣纪念、宠物日常、品牌小故事和公众号漫画。"
prompt: |
  生成一组日系温馨四格漫画：干净的手绘动漫线稿，暖米棕和浅棕的单色调，柔和的奶油色背景，简单柔和的阴影，整体温暖治愈。画幅：正方形 1:1，标准 2×2 四格版式，各格之间用细棕色边框分隔。
  顶部标题：大字"[情侣的一天]"，两侧各一颗小爱心，手写深棕色质感。
  【四格内容】
  第 1 格：一对年轻亚洲情侣的站姿合影，[男生]站在[女生]身后，双手轻搭在她肩上，两人都对着镜头微笑。
  第 2 格：两人坐在温馨的室内，双手捧着马克杯相视而笑。女生有一个清楚的中文对白气泡："谢谢你一直陪着我。"白色圆角气泡，黑色文字清晰。
  第 3 格：两人在厨房一起做饭，并肩站在灶台前，男生在搅拌，女生在帮忙，神情专注而开心。
  第 4 格：两人紧紧相拥，男生低头轻吻女生的额头，女生闭眼微笑。
  【角色一致性强制要求】
  两个角色从第 1 格到第 4 格必须保持完全相同的脸、发型、服装和身材比例，不允许漂移。
  男生：短发，温和的长相，穿简单的毛衣或衬衫。
  女生：中长发，温柔的长相，穿居家服。
  【风格与质感】
  干净的手绘动漫线稿，米棕 + 浅棕 + 奶油白的单色调，简单阴影，像日系生活漫画或治愈插画。
  【文字要求】
  对白气泡里的中文必须正确、清晰，不要乱码或变形。
  避免：写实摄影、3D 渲染、鲜艳颜色、复杂背景、角色脸崩、文字乱码、廉价贴纸感。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/derek_wall90176/status/2083069678965166119
  author: "Derek Wen｜德里克文"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "原文中文说明的英文写法改写为中文；标题、男女主角改为变量，示例对白保留中文"
images:
  - 3142-consistent-character-4-panel-comic-1.jpg
  - 3142-consistent-character-4-panel-comic-2.jpg
imageCredit:
  by: "Derek Wen｜德里克文"
  url: https://youmind.com/gpt-image-2-prompts?id=30497
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：[情侣的一天] 是标题；[男生]、[女生] 可以换成任何两个角色，例如"[哈士奇]＋[小黑猫]"（就是示例里的"猫狗日常"），四格内容和对白也跟着改。想用自己和另一半的形象，上传两人的照片并写"角色外貌参考上传照片"（只用你们本人的照片）。对白一句 10 字以内最稳。

示例图两张："夫妇の日"四格（合影、捧杯说"谢谢你一直陪着我。"、一起做饭、拥抱亲额头），两人四格里长相和毛衣一致；"猫狗日常"四格（哈士奇叼着牵引绳拖着小黑猫跑、"你慢点，我跟不上啦！"、分零食、一起盖毯子睡觉）。

**常见问题**：
- 角色第 3、4 格变脸：保留"角色一致性强制要求"整段，必要时减少到三格。
- 中文对白出错：只放一句对白，字数少于 10 个。
- 颜色太鲜艳：重复"单色暖棕调"。

**适合**：情侣 / 宠物纪念漫画、品牌小故事、公众号与小红书漫画、生日礼物。

### 原版提示词

```text
Generate a set of four-panel Japanese-style warm comics, clean hand-drawn anime line art style, warm rice-brown and light brown monochromatic tones, soft cream background, simple soft shadows, overall warm and healing atmosphere. Aspect ratio: square 1:1, standard 2x2 four-panel layout, separated by thin brown borders between each panel. Top title: large characters "{argument name="title" default="Couple's Day"}", with a small heart on each side, handwritten dark brown feel.
[Four-panel content]
Panel 1: Standing portrait of a young Asian couple. The {argument name="male character" default="man"} stands behind the {argument name="female character" default="woman"}, hands gently on her shoulders, both smiling at the camera.
Panel 2: The couple sitting in a cozy interior, holding mugs with both hands, smiling at each other. The woman has a clear Chinese dialogue bubble: "Thank you for always being with me." White rounded dialogue bubble, clear black text.
Panel 3: The couple cooking together in the kitchen. Standing side by side at the stove, the man stirring, the woman helping, expressions focused and happy.
Panel 4: The couple hugging tightly. The man bows his head to gently kiss the woman's forehead, the woman closes her eyes and smiles.
[Character Consistency Mandatory Requirements]
The two characters must maintain exactly the same face, hairstyle, clothing, and body proportions from Panel 1 to Panel 4. No drifting allowed.
Man: short hair, gentle looks, wearing a simple sweater or shirt.
Woman: medium-length hair, gentle looks, wearing home-style clothes.
[Style and Texture]
Clean hand-drawn anime line art, monochromatic warm rice-brown + light brown + cream white, simple shadows, like Japanese lifestyle manga or healing illustrations.
[Text Requirements]
The Chinese in the dialogue bubbles must be correct, clear, without garbled characters or deformation. Avoid: realistic photography, 3D rendering, bright colors, complex backgrounds, character face collapse, garbled text, cheap sticker feel.
```

> 改编自 [Derek Wen｜德里克文](https://x.com/derek_wall90176/status/2083069678965166119) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
