---
title: seedance 提示词：打响指切换城市的旅行 vlog（人物一致 · 道具不穿帮）
slug: seedance-snap-city-travel-vlog
model: seedance
topics: [image-to-video, short-drama]
modelLabel: Seedance 2.0
aspectRatio: "9:16"
needsRefImage: true
useCase: 上传一张人物照，生成 10 秒"一个响指换一座城市"的旅行 vlog 转场视频；提示词示范了怎样把道具（咖啡杯）的去向写清楚，避免物品瞬移、消失。
prompt: |
  生成一条 10 秒的写实旅行 vlog 短视频，人物以我上传的照片为准。主角始终是同一位年轻女生，五官、发型、服装和身材比例全程一致，不换脸、不换衣服。
  整条视频由 3 个独立场景组成：[北京]、[上海]、[广州]。城市之间用"打响指后硬切"的方式转场，不做背景融合、空间扭曲或建筑溶解。
  0–3 秒｜[北京]：女生站在[北京的一处标志性街景]附近，神情自然放松，双手空着。她看向镜头，举起右手打一个响指。响指之后，画面立刻硬切到[上海]。
  3–6 秒｜[上海]：女生已经站在[外滩]附近，右手拿着一杯咖啡。她自然地向前走两步，喝一口咖啡。喝完后走到旁边的栏杆平台或小桌旁，清楚地把咖啡杯放下：杯子真实接触台面，手指完全松开，右手彻底离开杯子，停顿约半秒，确认右手是空的。然后她再次举起右手打响指，画面立刻硬切到[广州]。咖啡杯留在原地，不跟着人瞬移，不凭空消失、漂浮、变形或换手。
  6–10 秒｜[广州]：女生空着手出现在[广州塔]附近，自然地向前走两步，转头看向[广州塔]，然后站到合适的位置和它合影，最后温柔地看向镜头微笑结束。
  全程保持真实的手机旅行 vlog 质感，轻微手持感，动作自然简单，重心和肢体运动符合真实物理。
  特别强调第二段的动作顺序：右手拿咖啡 → 喝一口 → 把杯子放在固定台面上 → 完全松手 → 右手变空 → 再打响指。不要跳过"放下咖啡"，不允许杯子直接消失。
  避免：换脸、换衣服、身材比例变化、人物重复、多余手臂、手指畸形、咖啡杯消失 / 变形 / 漂浮 / 换手、拿着咖啡打响指、建筑混合、三座城市的地标同时出现、上一座城市的背景残留、过于复杂的运镜。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-seedance-2-prompts
  url: https://x.com/Adam38363368936/status/2105550931907809283
  author: "@Adam38363368936"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: 由仓库英文版回译为中文；三座城市和地标改为变量；新增"人物以上传的照片为准"
imageBrief: 原帖封面未收录（背景地标不适合作为本站示例图）。请用一张 AI 生成的虚拟人物全身照作参考，三座城市换成任意 3 个风景地标（如西湖、洪崖洞、鼓浪屿），生成 1 条，截取每个城市各 1 帧。
images:
  - 209-seedance-snap-city-travel-vlog-1.jpg
imageCredit:
  by: "@Adam38363368936"
  url: https://x.com/Adam38363368936/status/2105550931907809283
  license: CC BY 4.0
verify:
  - 实测咖啡杯"放下—松手—留在原地"这一段的成功率（这是本条的核心卖点）
  - 地标建筑是否被画错或混在一起
  - 确认原帖仍可访问、作者未另行声明保留权利
---
**时长与镜头**：10 秒 3 个场景，每段只有 3–4 秒，所以每段动作不要超过 3 个。"打响指 + 硬切"是最稳的转场方式，比"旋转镜头穿越"不容易糊。

**这条教的是"道具逻辑"**：视频模型最常见的穿帮就是物品瞬移、凭空消失、换手。解决办法就是像这条一样，把道具的每个状态按顺序写出来（拿着 → 放下 → 松手 → 手空了），再在"避免"里点名禁止。

**怎么填变量**：城市和地标换成任意组合，地标尽量写具体名称；不想出现真实城市就写"[海边小镇]""[雪山脚下]"。想更像真人博主，可以上传自己的照片（只用本人或已获授权的照片）。

**常见失败与调整**：
- 咖啡杯还是跟着人走：把第二段拆成单独一条视频生成，再剪辑拼接。
- 硬切时出现溶解过渡：在开头和结尾各写一次"硬切，不要过渡效果"。
- 换城市后脸变了：每段开头都加"同一位女生"，并减少侧脸和转身。

> 改编自 [@Adam38363368936](https://x.com/Adam38363368936/status/2105550931907809283) 发布、[YouMind-OpenLab/awesome-seedance-2-prompts](https://github.com/YouMind-OpenLab/awesome-seedance-2-prompts) 收录的提示词，许可证 CC BY 4.0。

### 英文原版

```
Generate a 10-second realistic travel vlog style short video. The protagonist is always the same young Asian woman; facial features, hairstyle, clothing, and body proportions must remain consistent throughout. No face swapping or outfit changes.

The entire video consists of 3 independent scenes: Beijing, Shanghai, and Guangzhou. City transitions are completed using 'hard cut after snap' method, without background blending, spatial distortion, or architectural dissolving.

0-3s, Beijing.
The girl stands near a representative landmark in Beijing, looking natural and relaxed with empty hands. She looks at the camera, raises her right hand, and snaps her fingers. After the snap, the screen immediately hard cuts to Shanghai.

3-6s, Shanghai.
The girl is already standing near the Bund or Lujiazui in Shanghai, holding a cup of coffee in her right hand. She walks forward naturally two steps, then takes a sip of coffee.
After drinking, she walks to a nearby railing platform or small table where items can be placed, clearly putting down the coffee cup in her right hand. The coffee cup must truly contact the platform, fingers completely release, and the right hand thoroughly leaves the coffee cup. Pause for about half a second to confirm the right hand is empty.
Then she raises her right hand again to snap her fingers. After the snap, the screen immediately hard cuts to Guangzhou. The coffee cup stays in its original position in Shanghai, does not teleport with the person, and is not allowed to disappear into thin air, float, deform, or suddenly switch hands.

6-10s, Guangzhou.
The girl appears empty-handed near Canton Tower. She walks forward naturally two steps, turns to look at Canton Tower, then stands at a suitable position to take a photo with Canton Tower, finally looking gently at the camera and smiling to end.

Maintain real smartphone travel vlog texture throughout, slight handheld feel, natural and simple movements, center of gravity and limb motion conforming to real physical laws.

Special emphasis:
Shanghai segment: Right hand holds coffee → Take a sip → Put coffee cup on fixed platform → Completely release hand → Right hand becomes empty → Snap fingers again.
Do not skip the action of 'putting down coffee', do not allow the coffee cup to directly disappear.

Avoid: Face swapping, clothing changes, body proportion changes, character duplication, extra arms, finger deformities, coffee cup disappearing, coffee cup deforming, cup floating, cup switching hands, character snapping while holding coffee, architectural blending, simultaneous appearance of Beijing/Shanghai/Guangzhou landmarks, city background residuals, overly complex camera movements.
```
