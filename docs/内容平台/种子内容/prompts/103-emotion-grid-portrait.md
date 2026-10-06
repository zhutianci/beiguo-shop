---
title: AI写真提示词：同一个人 7 种情绪的多宫格写真拼图（gpt-image-2）
slug: emotion-grid-portrait
model: gpt-image-2
topics: [portrait, photography]
aspectRatio: "3:4"
needsRefImage: true
useCase: 上传一张自拍，生成同一个人在不同纯色背景下的多种情绪写真拼图，适合做朋友圈 / 小红书封面和个人表情素材。
prompt: |
  以我上传的照片为人物参考，保持五官、脸型、发型和肤色不变，生成一张多宫格情绪写真拼图。
  版式：[7] 个画面组成的网格，格子之间留细白边，整体外围也有一圈白边，每格都是小圆角，干净的现代 UI 感。
  每格一种情绪、一种背景色：
  1. 开心（黄色渐变）：双手举过头顶，闭眼大笑；
  2. 震惊（蓝色渐变）：双手捧脸，眼睛睁大，嘴巴张开，眉毛高挑；
  3. 严肃（纯红背景）：双臂交叉，皱眉抿嘴，穿深色连帽衫；
  4. 温柔（粉色渐变）：怀里抱着一只[小狗]，浅浅微笑，穿针织毛衣；
  5. 自信（紫色渐变）：一手叉腰，嘴角微微上扬，穿印花 T 恤；
  6. 认可（绿色渐变）：戴棒球帽、穿牛仔外套，竖起大拇指；
  7. 失落（灰色渐变）：眼神略向下，眉头内侧微微上扬，嘴角下垂。
  真实摄影质感，影棚柔光，人物在每一格中的大小和位置一致。
negativePrompt: null
source:
  repo: EvoLinkAI/awesome-gpt-image-2-API-and-Prompts
  url: https://x.com/iamaiistudio/status/2065179623697306098
  author: "@iamaiistudio"
  license: CC0 1.0
  licenseUrl: https://creativecommons.org/publicdomain/zero/1.0/
  changes: 英文原文译为中文；补充"以上传照片为人物参考、保持五官不变"；格数与怀抱的小动物改为变量
images:
  - 103-emotion-grid-portrait-1.jpg
imageCredit:
  by: "@iamaiistudio"
  url: https://x.com/iamaiistudio/status/2065179623697306098
  license: CC0 1.0
verify:
  - 在 gpt-image-2 上实测 3 次，记录成功率与最常见的失败形式
  - 7 格中人物是否始终像同一个人
  - 格数是否与要求一致（模型有时会自动补成 9 格）
  - 确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）
---
**怎么填变量**：[7] 可改成 4、6、9，改了格数就要同步增删下面的情绪列表；[小狗] 可以换成自家宠物（最好再上传一张宠物照）。每一格的背景色尽量不同，拼起来才有"色卡"感。

**常见问题**：
- 某几格不像本人：参考照要正脸、光线均匀；可在开头加"每一格的脸都必须与参考照一致"。
- 表情太夸张变形：把对应那一格的描述改温和，例如"惊讶"代替"震惊"。
- 格数不对：模型偶尔会补成 3×3，示例图就是 9 格的结果；需要严格 7 格时写明"第 3 行只有 1 格，居中"。

**迭代**：先出整张，满意后再单独追问"只重画第 4 格，其他不变"。

### 英文原版

```text
Full prompt:

Grid layout with thin white gaps between panels and a subtle outer white border around the entire composition. Clean, modern UI aesthetic with slight rounded corners on every tile.

Panel 1: Joyful (Yellow). Warm yellow gradient. Arms raised overhead. Eyes shut. Wide open laugh. High-energy pose.
Panel 2: Shocked (Blue). Blue gradient. Both hands cupping cheeks. Eyes wide open. Mouth agape. Eyebrows arched high.
Panel 3: Stern (Red). Solid red background. Arms folded. Brows furrowed. Lips pressed tight. Dark hoodie.
Panel 4: Affectionate (Pink). Soft pink gradient. Cradling a small brown dog. Gentle smile. Cozy knit sweater.
Panel 5: Confident (Purple). Purple gradient. One hand resting on hip. Slight smirk. Graphic tee. Easy, relaxed stance.
Panel 6: Approving (Green). Green gradient. Baseball cap and denim jacket. Thumbs up. Relaxed smile.
Panel 7: Melancholy (Gray). Gray gradient. Eyes angled slightly downward. Inner brows slightly raised. Lips gently curved down.

#AIart #GPTImage2
```

> 改编自 [@iamaiistudio](https://x.com/iamaiistudio/status/2065179623697306098) 发布、[EvoLinkAI/awesome-gpt-image-2-API-and-Prompts](https://github.com/EvoLinkAI/awesome-gpt-image-2-API-and-Prompts) 收录的提示词，仓库许可证 CC0 1.0；示例图同样来自该仓库收录的原帖出图。
