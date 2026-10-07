---
title: "AI角色设定图提示词：日系动画角色设定表（大头像 + 正面 + 背面全身）（gpt-image-2）"
slug: anime-character-design-turnaround-sheet
model: gpt-image-2
topics: [character]
aspectRatio: "3:2"
needsRefImage: false
useCase: "生成一张横版动画角色设定表：左侧大幅胸像，右侧正面和背面全身，脸、发型、服装、配饰和道具三处完全一致，适合短视频 / 动画 / 游戏里需要反复出场的角色，作为后续出图的参考。"
prompt: |
  为[一个 Z 世代的工作坊女孩]制作一张动画角色设定表，把这个实用又有型的年轻女性做成可以在视频场景里反复使用的视觉资产。
  画布：横版 3:2，浅暖灰背景，细微纸纹；胸像区和全身转面区之间一条干净的竖向分隔线。
  版式：恰好 3 个角色形象——左侧 1 个大胸像，约占画面 40%；中右 1 个正面全身；最右 1 个背面全身。三者的脸、头发、服装、比例和配饰完全一致。
  角色：二十出头的年轻女性，暖棕肤色，大而有神的棕色眼睛，温和自信的微笑，纤细健美的身材，精致的鼻子，自然的眉毛，小圈形耳环。[凌乱的栗棕色]头发用红色发圈扎成高马尾，几缕碎发垂在脸旁，层次蓬松、充满活力。
  服装：休闲的城市创意工作者穿搭，恰好 6 件主要单品——1 件宽松奶白卫衣（暗红色领口、袖口和袖条）、1 条宽松黑色抽绳束脚裤、1 双穿旧的米白运动鞋（红棕色点缀）、1 条挂着小长方形设备或工牌的黑色挂绳、1 对小银圈耳环、1 个红色发圈。
  包和可见物品：全身图里单肩背着恰好 1 个大号米白帆布托特包，包里塞着恰好 7 样看得见的东西：1 个橙色路锥、1 本蓝色笔记本或平板、1 个深色长方形设备、1 卷橙色布料或围巾、1 块芥末黄布、1 块青绿色布和 1 个红色捆扎物。正面图里包挂在身侧；背面图里包靠在背后或胯边，里面的东西依然可见。
  画风：精细的手绘动画概念设计，干净的墨线，有表现力的线条，柔和的赛璐璐明暗，低饱和的大地色系，略带草稿质感，布料褶皱处有细微排线，自然的设定图光线，没有强烈阴影。姿势放松亲切，正面全身随意站立，背面图清楚展示同一套服装和马尾。
  限制：不要文字标签、水印、清单以外的道具和其他角色；转面准确一致；背景素净不抢眼。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/g_aubry17/status/2094420362419146871
  author: "Guillaume Aubry"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文；角色、发色改为变量；保留 6 件服装和 7 件包内物品的数量约束"
images:
  - 3139-anime-character-design-turnaround-sheet-1.jpg
  - 3139-anime-character-design-turnaround-sheet-2.jpg
imageCredit:
  by: "Guillaume Aubry"
  url: https://youmind.com/gpt-image-2-prompts?id=33180
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：[一个 Z 世代的工作坊女孩] 换成你的角色定位（"一个热爱登山的大学男生""一个咖啡店店长"），外貌、服装和包里的物品清单也要一起改成符合人设的东西——物品清单写得越具体，角色越有故事感。[凌乱的栗棕色] 是发色和发质。

示例图两张：第一张左侧是扎红发圈高马尾、栗棕头发、挂着口哨挂绳的女孩大胸像，右侧是正面和背面全身——奶白红条卫衣、黑色束脚裤、旧运动鞋、单肩托特包里插着路锥、本子和彩色布料；第二张是作者延伸出的四面转身图（正、侧、背、侧）。

**常见问题**：
- 三个形象不一致（发型、包变了）：强调"三者完全一致"，并把关键特征（红发圈、口哨）写在角色段落里。
- 数量清单出错：数量约束可以适当放宽，重点保留"服装单品和颜色"。
- 后续出图保持一致：把这张设定表作为参考图上传，再写"按参考图里的角色生成……"。

**适合**：短视频 / 动画角色设定、游戏 NPC 设计、漫画人设、AI 连续出图的角色参考。

### 英文原版

```text
Goal: Create an anime character design sheet for {argument name="character name" default="a Gen Z app-workshop girl"}, showing a practical, stylish young woman as a reusable visual asset for video scenes.

Canvas: Wide horizontal character sheet, 3:2 aspect ratio, light warm gray background, subtle paper texture, clean vertical divider between the portrait area and the full-body turnaround area.

Layout: Use exactly 3 character depictions: 1 large bust portrait on the left taking about 40% of the canvas, 1 full-body front view in the center-right, and 1 full-body back view on the far right. Keep all three consistent in face, hair, outfit, proportions, and accessories.

Character details: Young woman in her early twenties with warm tan skin, large expressive brown eyes, soft confident smile, slim athletic build, delicate nose, natural brows, and small hoop earrings. She has {argument name="hair color" default="messy chestnut brown"} hair tied in a high ponytail with a red scrunchie, loose strands and flyaways framing the face, voluminous layered texture, and energetic movement.

Outfit: Casual urban creative-worker clothing with exactly 6 main outfit pieces: 1 oversized cream sweatshirt with muted red collar, cuffs, and sleeve stripes; 1 pair of loose black jogger pants with drawstring waist and gathered ankles; 1 pair of worn off-white sneakers with red-brown accents; 1 black lanyard necklace holding a small rectangular device or badge; 1 pair of small silver hoop earrings; 1 red hair scrunchie.

Bag and visible contents: Include exactly 1 large off-white canvas tote bag carried over one shoulder in the full-body views. The tote is stuffed with exactly 7 visible items: 1 orange traffic cone, 1 blue notebook or tablet, 1 dark rectangular device, 1 rolled orange fabric or scarf, 1 mustard yellow cloth, 1 teal cloth, and 1 reddish bundled item. In the front view, the tote hangs at her side; in the back view, the tote rests against her back/hip with the contents still visible.

Visual style: Detailed hand-drawn anime concept art, clean ink outlines, expressive linework, soft cel shading, muted earthy colors, slight sketch texture, subtle hatching on fabric folds, natural character-sheet lighting, no dramatic shadows. Make the pose relaxed and approachable, with the front full-body figure standing casually and the back view showing the same outfit and ponytail clearly.

Constraints: No text labels, no watermark, no extra props beyond the listed outfit and bag contents, no additional characters, maintain accurate turnaround consistency, keep the background plain and unobtrusive.
```

> 改编自 [Guillaume Aubry](https://x.com/g_aubry17/status/2094420362419146871) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
