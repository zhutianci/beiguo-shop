---
title: AI换装提示词：角色插画只换衣服，脸、发型和姿势不变（gpt-image-2）
slug: outfit-change-illustration
model: gpt-image-2
topics: [photo-edit, character]
aspectRatio: "4:5"
needsRefImage: true
useCase: 给自己画的角色、头像插画换一套衣服（节日装、制服、联名款），保持人物不变，适合 OC 换装、头像换季。
prompt: |
  【只换衣服】
  把我上传的角色图作为最高优先级参考，最终图为竖版 4:5。
  保留原角色的身份和插画风格：脸、眼睛、发型、发色、表情和整体姿势印象都不变。
  只改变服装和相配的配饰。
  在 4:5 竖版中自然重新构图，尽可能保留原角色、表情、姿势和整体氛围；让角色的脸和[比心手势]在构图中清晰可见。
  不要重新设计场景；不要创造全新姿势；不要无故把镜头拉远；不要为了展示衣服而多露出身体部位；原图没有画到的腿和脚，不要添加。
  服装：[复古风波点连衣裙]，具体为——
  [黑色修身上衣，配大号白色圆角彼得潘领]；
  [红色短泡泡袖，带白色波点]，袖口柔和收褶；
  [高腰红色 A 字裙，白色波点]；
  腰间一个[大号白色布艺蝴蝶结]；
  可选：配套的[红白波点发带]；如果能看到鞋，就用简单的同色系红鞋。
  服装设计统一协调，波点图案一致，不要多余装饰。
  让服装自然贴合角色当前可见的部分。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/ArtistaNozomu/status/2105857805496488221
  author: のぞむ＊AIイラスト
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: 英文原文译为中文；手势、整体服装和各服装部件改为变量
images:
  - 141-outfit-change-illustration-1.jpg
  - 141-outfit-change-illustration-2.jpg
imageCredit:
  by: のぞむ＊AIイラスト
  url: https://youmind.com/gpt-image-2-prompts?id=35815
  license: CC BY 4.0
verify:
  - 在 gpt-image-2 上实测 3 次，记录成功率与最常见的失败形式
  - 脸部和发型是否被改动
  - 是否擅自补画了原图没有的腿脚
  - 确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）
---
**怎么填变量**：[比心手势] 换成原图里最重要的动作（"举着奶茶""托腮"）；服装按"整体风格 → 上衣 → 袖子 → 下装 → 点缀 → 配饰"逐项写，越具体越不会跑偏。节日可以写"红色新年唐装""圣诞毛衣"。

**常见问题**：
- 脸变了：把"脸、眼睛、发型不变"复制一遍放到最后再强调。
- 原图是半身，结果被补成全身：保留"原图没有画到的腿和脚，不要添加"。
- 用于真人照片：真人换装请用写实描述，并且只给自己或已同意的人换装，不要给他人照片做不当改动。

**示例图说明**：两张示例为同一角色换上波点连衣裙的不同构图。

### 英文原版

```text
【OUTFIT CHANGE ONLY】

Use the attached character image as the highest-priority reference.

Create the final image in a vertical 4:5 composition.

Preserve the original character identity and illustration style.
Keep the original face, eyes, hairstyle, hair color, expression, and overall pose impression.

Change only the outfit and matching accessories.

Recompose the image naturally into a 4:5 vertical frame while preserving the original character, expression, pose impression, and overall scene feeling as much as possible.

Keep the character’s face and hand-heart gesture clearly visible in the 4:5 composition.

Do not redesign the scene.
Do not create a completely new pose.
Do not zoom out unnecessarily.
Do not reveal additional body parts just to show outfit details.
If legs or feet are not visible in the original image, do not add them.

OUTFIT:

A cute retro-inspired dress in red, black, and white with a clean polka-dot design.

Black fitted bodice with a large rounded white Peter Pan collar.

Short red puff sleeves with evenly spaced white polka dots and softly gathered cuffs.

High-waisted red skirt with white polka dots and a softly flared A-line silhouette.

Large white fabric bow at the waist.

Optional matching red-and-white polka-dot ribbon hair accessory.

If footwear is visible, use simple matching red shoes.

Clean coordinated costume design.
Consistent polka-dot pattern.
No extra decorations.

Adapt the outfit naturally to the character's existing visible area.
```

> 改编自 [のぞむ＊AIイラスト](https://x.com/ArtistaNozomu/status/2105857805496488221) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
