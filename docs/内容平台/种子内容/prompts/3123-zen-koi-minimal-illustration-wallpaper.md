---
title: "东方禅意壁纸提示词：锦鲤跃出水面的极简插画（宣纸留白、朱红与湖蓝）（gpt-image-2）"
slug: zen-koi-minimal-illustration-wallpaper
model: gpt-image-2
topics: [wallpaper, illustration]
aspectRatio: "9:16"
needsRefImage: false
useCase: "用结构化的字段（主题、主体、情绪、意象、构图、配色、光线）生成一张东方禅意极简竖版插画：一个人蹲在青石上看锦鲤跃出湖面，宣纸留白、朱红锦鲤和深湖蓝水面，适合手机壁纸、夏日海报和公众号配图。"
prompt: |
  主题：[东方禅意极简插画]
  风格分支：高对比动态型
  主体：[一个人蹲在青石上，看一条锦鲤跃出水面]
  情绪基调：灵动、治愈、松弛、夏日感
  场景与意象：明亮的朱红锦鲤、深湖蓝的池水、玉白留白、青石、少量水花
  构图与空间：构图居中偏下，跃起的锦鲤是主视觉，人物在一侧，水面与留白形成明亮的空间
  色彩控制：[玉白底、湖蓝水、朱红锦鲤]，墨绿人物与石头；全图避免红蓝互相串色
  光线与质感：明亮的自然光，清晰的水面倒影，宣纸纹理，干净的颗粒
  画幅：9:16
  补充要求：锦鲤的动作要有张力，但整体画面保持简洁、轻盈、不拥挤；左上角可放一列竖排小标题和红印章。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/liyue_ai/status/2077693224160985549
  author: "李岳"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "原文中文结构说明的英文写法改写为中文；主题、主体、配色改为变量，保留字段式结构"
images:
  - 3123-zen-koi-minimal-illustration-wallpaper-1.jpg
imageCredit:
  by: "李岳"
  url: https://youmind.com/gpt-image-2-prompts?id=28909
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：[一个人蹲在青石上，看一条锦鲤跃出水面] 可以换成"一个撑伞的人走过石桥，桥下荷花盛开""一只白鹭掠过湖面，远处一叶小舟"；配色要跟着主体改，保持"一种亮色 + 一种深色 + 大面积留白"的原则。主题也可以写成"东方禅意极简插画·秋"，让模型自动换成秋季意象。

示例图是米白宣纸底的竖版插画：中间一条朱红锦鲤从深蓝湖面跃起，溅起水花，右侧一个墨绿衣服的人蹲在岩石上看着它，水面有红色倒影，左上角竖排"跳出清凉"和小红印章。

**常见问题**：
- 红色串到水里一大片：保留"避免红蓝互相串色"。
- 画面太满：强调"上半部分至少一半留白"。
- 锦鲤僵硬：写"身体弯成 S 形，尾鳍甩开"。

**适合**：手机壁纸、夏日海报、公众号配图、新中式品牌视觉。

### 原版提示词

```text
Theme: {argument name="theme" default="Oriental Zen minimalist illustration"}
Style branch: High-contrast dynamic type
Main subject: {argument name="subject" default="A person squatting by a green stone watching a koi fish jump out of the water"}
Emotional motif: Dynamic, healing, relaxed, summer feel
Scenes and imagery: Bright vermilion koi, deep lake blue pond water, jade white negative space, green stone, a small amount of water spray
Composition and space: Composition centered slightly towards the bottom, the jumping koi as the main visual, the character located to one side, the water surface and negative space forming a bright space
Color control: {argument name="color scheme" default="Jade white as the background base, deep lake blue for the pond water layers, bright vermilion for the koi body and a few reflections, ink green for the character and stone structure"}; avoid red and blue contaminating each other across the whole image
Light and texture: Bright natural light, clear water reflections, rice paper texture, clear particles
Aspect ratio: 9:16
Additional requirements: The koi's movement should have tension, but the overall image should remain simple, light, and not crowded.
```

> 改编自 [李岳](https://x.com/liyue_ai/status/2077693224160985549) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
