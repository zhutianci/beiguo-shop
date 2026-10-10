---
title: "ai发型设计提示词：上传一张照片生成 12 种发型对比图，脸和衣服都不变（gpt-image-2）"
slug: hairstyle-lookbook-12-grid-same-face
model: gpt-image-2
topics: [fashion, photo-edit, portrait]
aspectRatio: "4:5"
needsRefImage: true
useCase: "剪头发前想先看看\"哪种发型适合我\"：上传一张正面照，一次生成 3×4 共 12 格的发型对比图，每格只换发型（长短和造型），脸、发色、妆容、衣服、首饰和背景全部保持一致，方便横向比较。"
prompt: |
  请根据我上传的参考照片，生成一张 12 格的发型对比图：3 列 4 行，每格左上角标数字 1～12，整张图画幅 4:5 竖版。12 格里是同一个人，换 12 种不同的[女士]发型。
  唯一允许变化的是头发的形状、长度和造型，其余全部与参考照片保持一致：
  - 脸：五官、脸型、下颌线、颧骨、眉形、肤色、皮肤质感（毛孔和小瑕疵）、年龄和表情都不变，不要美颜、不要瘦脸；
  - 发色：12 格的发色都与参考照片一致，只改长度和造型；
  - 妆容：参考照片里有妆就原样保留，没有妆就都不化妆；
  - 服装与配饰：衣服、耳环、项链、近视眼镜等全部保留，不增不减；不要戴墨镜，眼睛必须完整可见；
  - 背景：每一格都是[纯浅灰色影棚背景]，没有任何物体、纹理和渐变。
  12 种发型：
  1. 精灵短发：很短，头顶有纹理、略蓬乱，两侧和后颈收短；
  2. 经典波波头：齐下巴，直发，发尾平齐，中分；
  3. 长层次卷发：过肩，蓬松柔和的大波浪，脸侧有修饰层次；
  4. 低盘发：头发向后梳顺，在后颈盘成紧实的低发髻，没有碎发；
  5. 八字刘海中长发：刘海向两侧分开修饰脸型，发长刚过肩；
  6. 高马尾：头顶梳顺，高高扎起；
  7. 法式波波头：齐下颌的短波波，配齐眉短刘海；
  8. 中分长直发：很长、很顺的直发，垂过肩膀；
  9. 鲻鱼层次剪（狼尾）：中长，层次很碎，碎刘海，蓬松有野性；
  10. 优雅盘发：头发向上挽成精致的发髻，留几缕碎发；
  11. 短卷发：整头小卷的蓬松短发；
  12. 侧分复古大波浪：头发拨向一侧，光泽感的大卷垂在肩前。
  摄影风格：柔和均匀的影棚光，写实的人像照片质感，每格取景都是头肩特写、大小一致。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/codewithhajra/status/2091839680719274441
  author: "@codewithhajra"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文并精简为\"规则 + 12 种发型清单\"；背景色改为变量，新增\"[女士 / 男士] 发型\"与可替换的发型清单说明；仓库收录的原文在第 10 种发型处被截断，第 11、12 种按示例图补写"
images:
  - 3489-hairstyle-lookbook-12-grid-same-face-1.jpg
  - 3489-hairstyle-lookbook-12-grid-same-face-2.jpg
imageCredit:
  by: "@codewithhajra"
  url: https://youmind.com/gpt-image-2-prompts?id=32525
  license: CC BY 4.0
verify:
  - "两张示例图均为原作者发布的效果图（女士版与男士版），人物应为 AI 生成的虚构形象；上线前请再确认原帖未说明其参考图来自真实人物"
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：上传一张光线均匀、正面或微侧、头发和脸部都清楚的半身照。[女士] 可以改成"男士"，同时把 12 种发型清单换成男士发型（如"渐变寸头、纹理碎盖、侧背油头、丸子头、中长卷发、狼尾"等），想重点比较哪几种就把它们写进清单；[纯浅灰色影棚背景] 可以换成"纯白背景""米色背景"。

两张示例图分别是女士版和男士版：都是 3 列 4 行、左上角带数字的头肩特写，灰色背景；女士版从精灵短发、波波头一路到盘发和侧分大波浪，人物始终穿黑色高领毛衣；男士版是渐变短发、锅盖头、丸子头、寸头、侧背头、长卷发等 12 种。

**常见问题**：
- 越往后脸越不像：在最前面加一句"先锁定参考照片的脸，再只替换头发"，或拆成两次、每次 6 格。
- 发色被改掉：强调"所有格子发色与参考照片完全一致"。
- 某一格发型重复：把相似的两种发型在清单里拉开差别（长度写具体，如"齐耳""及胸"）。

**适合**：理发前和发型师沟通、挑选造型方向。生成图只是大致参考，实际效果受发质、发量和头型影响；请只上传你本人或已获对方同意的照片。

### 英文原版

```text
Create a 12-panel grid (3 columns × 4 rows, numbered 1 to 12) showing the SAME person from the reference photo with 12 different hairstyles. This is a hairstyle lookbook. Final image aspect ratio: 4:5 (vertical/portrait).\nTHE ONLY THING THAT CHANGES BETWEEN PANELS IS THE HAIR ON THE HEAD (shape, style and length only). Everything else stays exactly as in the reference photo.\nIdentity Anchor (Critical)\nThe face must be IDENTICAL to the reference photo in every single panel. Preserve exactly: facial bone structure, jawline, cheekbones, nose shape, lips, eye shape and spacing, eyebrows, skin tone, skin texture (pores, natural imperfections), and overall facial proportions. This is the same real person in all 12 frames. Do NOT beautify, slim, or alter the face. Same age, same expression as in the reference.\nMandatory Rules (Do Not Violate)\n- NO SUNGLASSES. Eyes must be fully visible in all 12 panels.\n- NO ENVIRONMENTAL BACKGROUNDS. Every panel must have a plain, uniform, {argument name="background style" default="solid light grey studio backdrop"} with zero objects, zero textures, zero gradients. Just flat neutral grey.\n- Hair COLOR stays exactly as it appears in the reference photo in all 12 panels. Only the shape, length and style changes, never the color.\nKeep Identical in Every Panel (Do Not Change)\n- MAKEUP AND SKIN: If the person in the reference photo wears makeup, replicate it identically in every panel. Same lip color, same eye makeup, same brow grooming. If they wear no makeup, keep all panels makeup-free. Do NOT add, remove, or alter makeup between panels.\n- Clothing: the same clothing visible in the reference photo, replicated exactly.\n- Accessories: preserve ALL visible accessories from the reference photo (earrings, necklaces, rings, bracelets, piercings, watch, glasses, etc.). Do not omit, resize, recolor, or restyle any accessory. If the person wears prescription glasses (not sunglasses), keep them in every panel.\n- Background: plain solid light grey studio backdrop in every panel. No room, no furniture, no environment.\nThe 12 Hairstyles\n1. Pixie cut: very short, textured, slightly tousled on top with tapered sides and nape\n2. Classic bob: chin-length, straight, blunt ends, clean middle part\n3. Long layered waves: past the shoulders, soft voluminous waves with face-framing layers\n4. Sleek low bun: hair pulled back smoothly into a tight low bun at the nape, no flyaways\n5. Curtain bangs with medium-length hair: soft parted fringe framing the face, hair falling just past the shoulders\n6. High ponytail: hair pulled up into a sleek high ponytail, smooth crown, length falling behind\n7. French bob: short bob ending at the jawline with a soft blunt micro-fringe across the forehead\n8. Long straight hair with middle part: very long, sleek, pin-straight, falling well past the shoulders\n9. Shaggy wolf cut: medium length, heavy layers, choppy fringe, textured and voluminous with a slightly wild look\n10. Elegant updo: hair swept up into a polished chignon with
```

> 改编自 [@codewithhajra](https://x.com/codewithhajra/status/2091839680719274441) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
