---
title: "ai角色设定图提示词：同一漫画角色多发型多情绪的单色分格海报（gpt-image-2）"
slug: manga-character-mood-color-panels
model: gpt-image-2
topics: [portrait, character, comic]
aspectRatio: "2:3"
needsRefImage: false
useCase: "给原创角色试发型和气质时用：同一张脸分格出现，每格换发型、角度和配饰，并各用一种主色加黑白来表现一种情绪，粗线平涂的海报感，可当系列头像或设定稿。"
prompt: |
  画一张竖版的平面海报，把画面分成[3 行 2 列共 6 格]，每一格都是同一个[日系漫画风]角色。
  - 每格里角色的脸型、眼睛、鼻子、嘴、年龄和发色保持完全一致，只改变[发型、刘海、表情、头部角度、眼镜和配饰]，像专业的角色设计稿；
  - 每格都是肩部以上的肖像，强烈的平面海报感：粗而干净的线稿，细节克制，大块平涂色面；
  - 为各格选择不同的情绪，例如[热烈、冷静、慵懒]，每种情绪只用一种主色来表现，如[红色、蓝色、琥珀黄]，除主色外只加黑和白；
  - 不画传统背景，让角色沉浸在这种色彩氛围里：环境色自然地映在皮肤、头发和衣服上，仿佛角色就生活在那个世界的光线和空气中；
  - 不要任何文字、Logo、界面元素或对话气泡；
  - 每一格单独拿出来都是一幅完整的作品，放在一起又是统一的一个系列。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/SimplyAnnisa/status/2075985976208626071
  author: "@SimplyAnnisa"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文并拆成要点；原文是上中下 3 格的三联画，示例图实际为 3 行 2 列 6 格，按示例图把分格方式写成变量；\"根据聊天记录选三种情绪\"改为直接填写情绪和主色两个变量；画风、可变项保留为变量。"
images:
  - 3472-manga-character-mood-color-panels-1.jpg
imageCredit:
  by: "@SimplyAnnisa"
  url: https://youmind.com/gpt-image-2-prompts?id=28366
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：[3 行 2 列共 6 格] 可以改成"上中下 3 格"（原版的三联画）或"2×2 共 4 格"；[日系漫画风] 可换"美式漫画风""韩漫风"；可变项按需要删减，比如只想换发型就留"发型、刘海"；情绪和主色要一一对应，如"愤怒配红、忧郁配蓝、希望配黄"。想固定自己的角色，上传角色头像并加一句"角色长相按参考图"。

示例图是 3 行 2 列的六格海报：同一位短卷发女性，左列三格全是红色调，右列依次是蓝色、暗金色和琥珀黄；每格发型和角度都不同，有披散的卷发、头顶丸子、侧脸、戴圆墨镜回头和托腮；线条粗黑，皮肤和头发都被环境色染透，没有任何文字。

**常见问题**：
- 各格的脸不像同一个人：加"先确定一张标准脸，再在其余格子里严格复用"，或减少到 3～4 格。
- 颜色太杂：强调"每格只允许一种主色加黑白，不要渐变和第二种彩色"。
- 出现背景物件：写"背景只有纯色和光影，不画任何场景"。

**适合**：原创角色的发型和气质设定稿、社交平台组图头像、系列海报。不适合需要全身服装细节的三视图。

### 英文原版

```text
Create a triptych graphic poster on a vertical canvas divided into three horizontal panels, featuring the same {argument name="style" default="Japanese manga-style"} character in every panel. Keep the face, eyes, nose, mouth, face shape, age, and hair color identical, changing only the {argument name="variables" default="hairstyle, bangs, expression, head angle, glasses, and accessories"} like a professional character design sheet. Each panel should be a shoulder-up portrait with bold graphic poster aesthetics, thick clean line art, minimal detail, and large flat color shapes. Choose three distinct moods inspired by the chat history, expressing each through a single {argument name="color scheme" default="dominant color"} with only black and white added. Instead of a traditional background, immerse the character within the atmosphere itself so the ambient color naturally reflects onto the skin, hair, and clothing, creating the feeling that the character exists inside the light and air of that world. No text, logos, UI elements, or speech bubbles. Each panel should work as a standalone artwork while forming a cohesive series together.
```

> 改编自 [@SimplyAnnisa](https://x.com/SimplyAnnisa/status/2075985976208626071) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
