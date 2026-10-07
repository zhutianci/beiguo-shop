---
title: seedance 提示词：科幻太空大战（小行星护盾城市 · 15 秒史诗级场面）
slug: seedance-asteroid-shield-space-battle
model: seedance
topics: [cinematic]
modelLabel: Seedance 2.0
aspectRatio: "16:9"
needsRefImage: false
useCase: 生成硬科幻风格的太空战斗短片：一座在小行星风暴中航行的巨型城市，用小行星群当护盾和武器反击敌方舰队，适合科幻短片、游戏宣传片、视频开头的大场面空镜。
prompt: |
  15 秒电影感写实科幻动作短片，16:9。
  一座巨大的未来城市在深空中穿行，被包裹在一场庞大的小行星风暴里。成千上万艘飞船在它身边飞行，不断操纵小行星，组成一面持续移动的防御护盾。
  0–4 秒：敌方舰队突然来袭，数百架战机俯冲进小行星带。
  4–8 秒：城市加速。小行星撞上来袭的战机；防御飞船在巨石之间穿梭，把它们推向新的轨道。
  8–11 秒：一艘巨型敌方战舰冲破小行星护盾，直接朝城市开火。整座城市突然转向，小行星带随之移动，数以百万计的岩石像一个巨大的机械生命体一样围绕城市重新列阵。
  11–14 秒：敌方战舰意识到小行星带本身就是城市的武器时已经太晚，一次巨大的撞击充满整个画面。
  14–15 秒：结尾，城市消失在移动的风暴之中。
  风格：写实硬科幻，壮观的小行星环境，持续不断的战斗，巨型移动结构，快速运镜，细节丰富的飞船，宏大尺度，电影级动作感。
  不要文字，不要标志，不要动漫或卡通风格。
negativePrompt: 卡通，动漫，文字，标志，水印，画面撕裂，低清晰度
source:
  repo: YouMind-OpenLab/awesome-seedance-2-prompts
  url: https://x.com/AllaAisling/status/2106852107114418554
  author: "@AllaAisling"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文，并按剧情节点补充了时间码；其余保持原意"
images:
  - 3627-seedance-asteroid-shield-space-battle-1.jpg
imageCredit:
  by: "@AllaAisling"
  url: https://x.com/AllaAisling/status/2106852107114418554
  license: CC BY 4.0
verify:
  - Seedance 2.0 实测 3 次，记录"城市转向、小行星重新列阵"这一关键节点能否被表现出来
  - 确认原帖仍可访问
---
**时长与镜头**：15 秒五个剧情节点：来袭 → 防御 → 突破与转向 → 反击撞击 → 消失。原文是"一句一个镜头"的写法，每一句都是一个画面变化，模型会自动剪成快节奏蒙太奇；本站补的时间码只是帮你控制节奏，删掉也能用。

**怎么用**：这类宏大场面适合做视频开头的 3–5 秒空镜，或者当科幻短片的预告。想要更多控制，可以把它拆成三条分别生成：①城市与小行星护盾的建立镜头，②战机冲入小行星带，③巨大撞击，最后剪辑拼接。

**怎么填变量**：核心创意是"环境本身就是武器"，可以替换成"一座海上城市把海浪当成护盾""一片森林把树根当成防线"，保持"来袭 → 防守 → 反转 → 结局"四拍不变。

**常见失败与调整**：
- 画面太乱看不出剧情：删掉"成千上万""数百架"等夸张数量，减少同屏元素。
- 城市看起来很小：加"超广角远景，城市占据画面一半"。
- 出现类似某部电影的飞船造型：写"原创的飞船设计，流线型白色外壳"。

> 改编自 [@AllaAisling](https://x.com/AllaAisling/status/2106852107114418554) 发布、[YouMind-OpenLab/awesome-seedance-2-prompts](https://github.com/YouMind-OpenLab/awesome-seedance-2-prompts) 收录的提示词，许可证 CC BY 4.0。

### 英文原版

```
15-second cinematic photorealistic science-fiction action short, 16:9.
A gigantic futuristic city travels through deep space inside an enormous asteroid storm.
Thousands of spacecraft fly alongside it, actively manipulating the asteroids into a constantly moving defensive shield.
Suddenly an enemy fleet attacks.
Hundreds of fighters dive into the asteroid field.
The city accelerates.
Asteroids slam into attacking ships.
Defensive spacecraft race between enormous rocks, pushing them into new trajectories.
A massive enemy warship breaks through the asteroid shield and fires directly at the city.
The entire city suddenly changes direction.
The asteroid field moves with it.
Millions of rocks swing into formation around the city like a gigantic mechanical organism.
The attacking warship realizes too late that the asteroid field itself is the city's weapon.
A colossal impact fills the screen.
End on the city disappearing into the moving storm.

Photorealistic hard science fiction, spectacular asteroid environments, relentless combat, massive moving structures, fast camera movement, detailed spacecraft, huge scale, cinematic action, no text, no logos, no anime, no cartoon.
```
