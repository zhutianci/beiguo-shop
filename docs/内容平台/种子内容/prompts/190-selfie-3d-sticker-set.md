---
title: nano banana 自拍做表情包提示词：一张自拍生成 9 个 3D 卡通表情贴纸（透明底）
slug: selfie-3d-sticker-set
model: nano-banana
topics: [sticker, portrait, character]
needsRefImage: true
aspectRatio: "4:5"
useCase: 想要一套"长得像自己"的 3D 卡通表情包发微信、钉钉、飞书，上传一张清晰自拍，生成 3×3 九个不同表情的贴纸，风格统一、可直接裁切使用。
prompt: |
  只以我上传的自拍作为脸部参考，生成一套 3D 动画电影风格的卡通角色贴纸，角色必须一眼能认出是自拍里的人。
  - 排成整齐的 3×3 网格，共 9 张贴纸，最终画幅严格为 4:5；
  - 每格一个不同的姿势和表情，依次为：[惊讶、无语、困惑、抓狂、思考]、[阴阳怪气、担心、无聊、好奇]；
  - 风格：圆润的 3D 卡通渲染，带一点表情包的夸张和搞怪，表情在小尺寸下也清晰可读，眼睛、眉毛、嘴巴表现力强，适当配合手势；
  - 背景：透明背景（如无法透明则用纯白），没有背景投影；每张贴纸带白色描边；
  - 不要文字、字幕、Logo 或界面元素；
  - 一致性：9 张贴纸的发型、服装、配色和身体比例完全一致，只改变表情和姿势。
negativePrompt: null
source:
  repo: jau123/nanobanana-trending-prompts
  url: https://x.com/oggii_0/status/2034263750539411550
  author: "@oggii_0"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: 译成中文；把原文中以某动画工作室命名的风格改为通用描述"3D 动画电影风格"；9 种情绪改为可替换变量；补充白色描边与透明背景的退路
images:
  - 190-selfie-3d-sticker-set-1.jpg
  - 190-selfie-3d-sticker-set-2.jpg
imageCredit:
  by: "@oggii_0"
  url: https://x.com/oggii_0/status/2034263750539411550
  license: CC BY 4.0
verify:
  - 检查输出是否真有透明通道（多数情况是白底或画出来的棋盘格）
  - 用戴眼镜的自拍实测，看眼镜是否在 9 张里都保留
  - 确认原帖仍可访问、作者未另行声明保留权利
---
**怎么用**：上传一张正脸、光线均匀、不戴口罩墨镜的自拍。表情清单可以换成你聊天最常用的：[收到、好的、哈哈哈、在忙、晚安、谢谢老板……]（想加文字就删掉"不要文字"那一条，并写明每格配字）。示例两张是不同人物的生成结果。

**常见问题**：
- 不像本人：在开头追加"保留发型、脸型、眉形、痣等标志性特征"；多生成几次挑最像的。
- 背景不透明：这是常态，生成白底后用抠图工具批量去底即可（见 158 号"一句话抠图"）。
- 9 张不一致：先只生成 4 个（2×2），满意后再要"用同一角色补齐剩下 5 个表情"。

**注意**：只用自己或已获同意的人的照片；上架微信表情开放平台需按平台规则重新导出尺寸。

### 英文原版

```
Using the uploaded selfie as the ONLY and exclusive face reference, generate a Pixar-style 3D character sticker set. The character must be clearly recognizable as the person from the selfie. Create a neat 3×3 grid collage (nine stickers total). Final aspect ratio is strictly 4:5. Each cell shows a distinct pose and facial expression. Style and tone: Pixar-style 3D animation with a meme-oriented feel. Exaggerated, slightly absurd emotions, playful overacting. 

Highly readable expressions at small sizes, with expressive eyes, eyebrows, and mouth. Subtle hand gestures where appropriate. Background and output: Fully transparent background (PNG). No backdrop, no background shadows. No text, captions, logos, or UI elements. Stickers must be ready for direct use in messengers. Consistency: Same hairstyle, clothing, colors, and character proportions across all nine stickers. Only facial expression and pose change.

Clean, polished 3D sticker look. Emotions (one per sticker, 3×3 grid): Surprised, Annoyed, Confused, Frustrated, Thoughtful, Sarcastic, Worried, Bored, Curious.
```

> 改编自 [@oggii_0](https://x.com/oggii_0/status/2034263750539411550) 发布、[jau123/nanobanana-trending-prompts](https://github.com/jau123/nanobanana-trending-prompts) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)。
