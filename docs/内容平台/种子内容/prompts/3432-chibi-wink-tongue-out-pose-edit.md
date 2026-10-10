---
title: "ai表情包制作提示词：让 Q 版角色做\"吐舌眨眼敲头\"的调皮姿势，俯拍全身白底图（Nano Banana）"
slug: chibi-wink-tongue-out-pose-edit
model: nano-banana
topics: [sticker, character, photo-edit]
modelLabel: Nano Banana Pro
aspectRatio: "1:1"
needsRefImage: true
useCase: "手里已经有一个 Q 版角色，想让它摆出指定的表情动作做表情包时用：上传角色图，按\"表情 / 手部动作 / 身体朝向 / 镜头\"逐项指定，这里的示例是眨一只眼、吐舌头、用拳头轻敲脑袋的\"哎嘿\"姿势。"
prompt: |
  让上传图片里的 Q 版角色做出"哎嘿"的调皮姿势（闯了小祸后吐舌卖萌），保持角色的长相、发型和服装不变，Q 版画风。画幅 1:1。
  - 表情：[右眼闭上眨眼，舌头从嘴角微微向上吐出]；
  - 动作：[右手握拳，轻轻敲在头顶一侧]，左臂自然垂直放下；
  - 身体朝向：身体不是完全正对镜头，而是略微侧过来的四分之三角度；
  - 视线：看向镜头，目光柔和，像在和观众对视；
  - 镜头：[高机位俯拍]，从上往下看但脸要清楚；夸张的透视和强烈的近大远小（头大脚小）；相当于 24mm 广角镜头，贴近角色拍摄；
  - 构图：全身入镜、居中；背景是简单的纯白色。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-nano-banana-pro-prompts
  url: https://x.com/YukinobuKurata/status/2008677573971337639
  author: "@YukinobuKurata"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "原文为 YAML 结构的英文提示词（日文作者），改写为分条的中文描述；表情、手部动作、镜头角度整理为可替换的变量；\"Tehepero\"译为\"哎嘿（吐舌卖萌）\"并保留动作细节"
images:
  - 3432-chibi-wink-tongue-out-pose-edit-1.jpg
imageCredit:
  by: "@YukinobuKurata"
  url: https://youmind.com/nano-banana-pro-prompts?id=4973
  license: CC BY 4.0
verify:
  - "需要上传一张 Q 版角色图；只用自己的原创角色或已获授权的形象"
  - "上线前在 Nano Banana 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：上传一张干净的 Q 版角色立绘。表情和动作两处可以换成别的组合，例如"双眼弯成月牙，开心大笑"+"双手举过头顶比心"，或"鼓起腮帮子生气"+"双手叉腰"；[高机位俯拍] 可以改成"平视"或"仰拍"，换一种镜头感。一次只改一两项，角色更不容易跑形。

示例图：白底上一个棕色短发、绿眼睛的 Q 版角色，穿橙色连帽卫衣和黑色工装裤，右眼眨起、舌头吐在嘴角，右手握拳抵在头侧，镜头从斜上方俯视，头显得很大、脚很小。

**常见问题**：
- 左右手 / 左右眼弄反：模型常把"右"理解成画面右侧，可以改写成"画面左侧的那只眼睛"。
- 角色的服装或发色变了：在第一句后补"服装、配色、发型与参考图完全一致"。
- 透视不明显：把"夸张的透视"改成"鱼眼镜头般的强烈俯视，头部占画面一半"。

**适合**：原创角色表情包、聊天贴纸、角色设定的动作补充图。

### 日文原版

```text
subject:
    description: "The chibi character in the attached image is performing the 'Tehepero' pose"
    character_style:
      - "chibi character"

  expression_and_pose:
    facial_expression:
      - "winking the right eye"
      - "tongue slightly sticking out upwards from the corner of the mouth ('Tehepero')"
    pose:
      - "lightly tapping the high side of the head with the right fist"
      - "left arm is stretched straight downwards"

  body_orientation:
    torso:
      - "The front of the body is not completely facing the camera, but slightly angled (3/4 view)"

  gaze:
    direction: "looking at the camera"
    quality:
      - "soft frontal gaze"
      - "gazing at the viewer"
      - "gentle eye contact"

  camera_and_composition:
    angle:
      - "high angle"
      - "looking down from above, but the face is clearly visible"
    perspective:
      - "exaggerated perspective"
      - "strong foreshortening (foreground appears large, background appears small)"
    lens:
      focal_length_equivalent: "24mm equivalent"
      distance: "camera is close to the subject"
    framing:
      - "full body included"
      - "centered"
    background:
      - "simple white background"
```

> 改编自 [@YukinobuKurata](https://x.com/YukinobuKurata/status/2008677573971337639) 发布、[YouMind-OpenLab/awesome-nano-banana-pro-prompts](https://github.com/YouMind-OpenLab/awesome-nano-banana-pro-prompts) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
