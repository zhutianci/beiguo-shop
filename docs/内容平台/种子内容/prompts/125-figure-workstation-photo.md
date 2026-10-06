---
title: 手办提示词：从 3D 建模到实体手办的工作室场景图（gpt-image-2）
slug: figure-workstation-photo
model: gpt-image-2
topics: [figurine, character]
aspectRatio: "3:4"
needsRefImage: false
useCase: 生成"桌上摆着手办、背后两台显示器分别是白模和上色渲染"的工作室照片，适合原创角色展示、手办众筹和作品集封面。
prompt: |
  一张照片级的高品质影棚照：现代数字艺术工作室，表达"从 3D 虚拟角色到实体收藏手办"的概念。
  前景：圆形木质展示底座上，摆着一尊高度写实的收藏级手办，角色是[原创角色：银发女剑士]。角色有[精致的东方五官]，[高马尾]，[冷静坚定的神情]，穿着[黑金配色的轻甲]。整体设计精致、高级、辨识度高，有树脂雕塑的质感，同时非常逼真。
  姿势：[单手持剑、侧身站立]，自然、稳定、适合陈列。低角度近距离拍摄，略带广角畸变，竖版构图，突出完整人物、服装结构、腿部线条和姿态。
  背景：一个专业的 3D 角色设计工作站，两台大曲面显示器。两台屏幕都必须显示与前景手办完全一致的角色——同样的脸、发型、服装、姿势和气质。
  左屏显示专业 3D 雕刻软件界面里的灰色白模，与手办在设计、姿势、服装结构和面部上完全一致；右屏显示同一角色的完整上色渲染图。两块屏幕共同强化"数字角色设计 → 实体收藏雕像"的流程。
  桌上有键盘、鼠标、显示器支架、数位板、手写笔等 3D 建模工具，工作区干净、专业、高级。可选元素：[剑、披风等主题道具]。
  光线：柔和棚拍光与室内工作区光混合；前景手办照明均匀，面部和材质细节清晰；显示器发出冷色科技光。整体写实、干净、高级，浅景深，超高细节。
negativePrompt: null
source:
  repo: EvoLinkAI/awesome-gpt-image-2-API-and-Prompts
  url: https://x.com/Shinning1010/status/2049068188399227174
  author: "@Shinning1010"
  license: CC0 1.0
  licenseUrl: https://creativecommons.org/publicdomain/zero/1.0/
  changes: 英文原文译为中文；角色限定为"原创角色"并给出示例，外貌、发型、服装、姿势、道具改为变量；去掉原文中的"某 IP 风格设计细节"与具体软件名
imageBrief: 用一个站内原创角色（不使用任何已有动漫 / 游戏 IP）生成 1 张竖版图；检查两块屏幕与前景手办是否为同一角色。
verify:
  - 在 gpt-image-2 上实测 3 次，记录成功率与最常见的失败形式
  - 两块屏幕里的角色是否与前景手办一致
  - 屏幕界面是否出现真实软件商标
  - 确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）
---
**怎么填变量**：角色描述按"身份 → 五官 → 发型 → 神情 → 服装 → 姿势"六项填写，每项一句话，前后要一致。也可以上传一张自己画的角色设定图，并在开头加"角色以上传的设定图为准"。

**常见问题**：
- 三处角色不一致（手办、白模、渲染）：把角色描述写得更具体，并在结尾再强调一次"三处必须是同一个角色"。
- 画面太乱：删掉"可选元素"，桌面只保留键盘和数位板。
- 版权：只用自己的原创角色或已获授权的角色，不要拿知名动漫 / 游戏角色做"手办效果图"去售卖。

**迭代**：满意后追问"把手办换成 Q 版比例，其他不变"，得到另一种手办形态。

### 英文原版

```text
Photorealistic high-quality studio photo of a modern digital art workspace, showing the concept of “from 3D virtual character to real collectible figure.”

In the foreground, a highly realistic collectible figurine of [Character Name / Character Identity] is placed on a round wooden display stand. The character has [facial features / appearance], [hairstyle], and a [expression / personality vibe]. The figure is wearing [outfit / costume]. The overall design is refined, premium, and instantly recognizable. The figurine should have realistic collectible statue quality, with subtle resin/sculpture material feel, while still looking highly believable and visually realistic.

The pose is [character pose], natural, stable, elegant, and display-worthy. Shot from a low-angle close-up perspective with slight wide-angle distortion, vertical composition, emphasizing the full figure, clothing structure, leg lines, and pose.

In the background, there is a professional 3D character design workstation with two large curved monitors. Both monitors must show the exact same character as the foreground figurine — same face, same hairstyle, same outfit, same pose, and same overall vibe — clearly expressing the idea of turning a digital 3D character into a real physical figure.

The left monitor shows a gray sculpt / clay model view in a professional 3D sculpting software interface, similar to ZBrush. The gray model must match the foreground figure exactly in character design, pose, outfit structure, and facial identity.

The right monitor shows the fully rendered colored version of the same character, also matching the foreground figure exactly in face, hairstyle, outfit, pose, and temperament. Together, the two monitors reinforce the workflow of “digital character design → physical collectible statue.”

On the desk are a keyboard, mouse, monitor arms, drawing tablet, stylus, and other 3D modeling tools. The workspace is clean, professional, and visually premium. Optional extra elements: [weapon / accessories / theme props / IP-style design details].

Lighting is a mix of soft studio lighting and indoor workspace lighting. The foreground figurine is evenly lit with clear facial and material detail, while the monitors emit cool-toned tech light. Overall mood is realistic, clean, premium, slightly shallow depth of field, ultra-detailed, emphasizing the collectible figure quality, professional 3D design studio atmosphere, and the visual concept of “from digital model to real figure.”

photorealistic, ultra detailed, cinematic studio lighting, realistic figurine, collectible statue, 3D character design studio, from digital model to real figure, vertical composition
```

> 改编自 [@Shinning1010](https://x.com/Shinning1010/status/2049068188399227174) 发布、[EvoLinkAI/awesome-gpt-image-2-API-and-Prompts](https://github.com/EvoLinkAI/awesome-gpt-image-2-API-and-Prompts) 收录的提示词，仓库许可证 CC0 1.0。
