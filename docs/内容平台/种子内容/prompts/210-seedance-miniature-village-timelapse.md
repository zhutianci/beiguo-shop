---
title: seedance 提示词：微缩小人建造村庄延时视频（古树树屋村落）
slug: seedance-miniature-village-timelapse
model: seedance
topics: [cinematic, motion-graphics]
modelLabel: Seedance 2.0
aspectRatio: "9:16"
needsRefImage: false
useCase: 生成"成百上千个微缩小人围着一棵巨树从打地基到建成村落"的竖屏延时视频，适合解压类、建造类短视频账号，也可改成建城堡、港口、校园。
prompt: |
  生成一条[30]秒、竖屏 9:16 的超写实微缩建造延时视频：围绕一棵[巨大的古树]，一座壮观的村庄被真实地一点点建起来。全程能看到成百上千个微小、写实的成年工人同时干活，使用工具、梯子、绳索、推车和微型吊机。建造速度快但看得清，微距电影摄影，自然阳光，真实的木头、石头、泥土、苔藓和植物，4K HDR 真人实拍质感。
  0–2 秒：工人清理地面、标出地基，在巨树根部周围挖土。
  2–4 秒：放下基石和木地梁，立起第一批木柱。
  4–6 秒：墙板、地板和支撑梁一块块组装起来。
  6–8 秒：抬起椽子，搭出坡屋顶，一片片铺上木瓦。
  8–10 秒：工人沿树干向上攀爬，在粗大的树枝周围搭建高台。
  10–12 秒：树屋立起来，装上墙、窗、门、阳台和屋顶。
  12–14 秒：修建连接树屋的木桥和旋转楼梯。
  14–16 秒：更多小屋从巨树向外扩展，从地基到屋顶完整建造。
  16–18 秒：工人铺石板路、修篱笆，架起一座跨过小溪的木桥。
  18–20 秒：树下搭起集市，有摊位、柜台和储物小屋。
  20–22 秒：更高的平台、阳台和相连的树屋在枝杈间扩展。
  22–24 秒：安装栏杆、梯子、绳桥、灯柱和花箱。
  24–26 秒：摆放石块，种花种树，建花园，修好蜿蜒小路。
  26–28 秒：最后的细节完工，成百上千的工人继续在全村搬运材料、干活。
  28–30 秒：黄金时刻揭晓全貌。小村民走过桥和小路，镜头平稳向后上方拉起，露出被多层村落环绕的巨大古树。
  关键规则：每 2 秒出现一个新的可见建造阶段，之前的队伍继续干活。建筑必须按"地基 → 梁 → 墙 → 屋顶 → 细节"的顺序推进，不能瞬间完工。
negativePrompt: 卡通，玩具，塑料感，CGI 感，魔法建造，瞬间出现，变形，瞬移，漂浮物体，材料消失，重复的工人，巨人，小孩，肢体错误，古树形状变化，建筑前后不一致，空无一人的画面，文字，Logo，水印
source:
  repo: YouMind-OpenLab/awesome-seedance-2-prompts
  url: https://x.com/RizwanAly07/status/2103399820824289472
  author: "@RizwanAly07"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: 英文原文译为中文；时长和核心建筑物改为变量；原文 NEGATIVE 段译为中文放入 negativePrompt
images:
  - 210-seedance-miniature-village-timelapse-1.jpg
imageCredit:
  by: "@RizwanAly07"
  url: https://x.com/RizwanAly07/status/2103399820824289472
  license: CC BY 4.0
verify:
  - 所用平台单条视频最长能生成多少秒（以官方说明为准）；不足 30 秒时按正文的拆分方法实测
  - 微缩工人是否大量重复、粘连
  - 确认原帖仍可访问、作者未另行声明保留权利
---
**时长与镜头**：原作是 30 秒、15 个阶段，每 2 秒一个新阶段。如果平台单条只能生成 15 秒，就拆成两条：第一条 0–14 秒（地基到树屋），第二条 14–30 秒（扩建到全景），第二条开头加一句"接着上一段的画面继续建造"，并把第一条的最后一帧作为第二条的首帧参考。

**怎么填变量**：[巨大的古树] 可换"[海边悬崖]""[雪山脚下]""[沙漠绿洲]"；建造内容按场景改，比如港口就写"码头、灯塔、渔船"。

**常见失败与调整**：
- 房子一下子凭空出现：最后的"关键规则"一定要留，它比时间轴本身更重要。
- 工人像复制粘贴：负面词里的"重复的工人"保留，并在正文加"工人衣服颜色、动作各不相同"。
- 看起来像玩具模型：加"真实材质，移轴摄影的微缩感，但不是玩具"。

> 改编自 [@RizwanAly07](https://x.com/RizwanAly07/status/2103399820824289472) 发布、[YouMind-OpenLab/awesome-seedance-2-prompts](https://github.com/YouMind-OpenLab/awesome-seedance-2-prompts) 收录的提示词，许可证 CC BY 4.0。

### 英文原版

```
Create a 30-second vertical 9:16 ultra-photorealistic miniature construction time-lapse: a spectacular village physically built around ONE enormous ancient tree. Hundreds of tiny realistic adult workers are visible continuously, working simultaneously with tools, ladders, ropes, carts and miniature cranes. Fast but readable construction, macro cinematic photography, natural sunlight, realistic wood, stone, soil, moss and vegetation, 4K HDR, live-action realism.

0–2s: Workers clear the ground, mark foundations and dig around the giant tree roots.
2–4s: Foundation stones and wooden floor beams are placed; workers erect the first timber posts.
4–6s: Wall panels, floorboards and support beams are assembled piece-by-piece.
6–8s: Workers lift rafters, build pitched roofs and place wooden shingles one-by-one.
8–10s: Teams climb the trunk and construct elevated platforms around the massive branches.
10–12s: Treehouses rise as workers install walls, windows, doors, balconies and roofs.
12–14s: Workers build wooden bridges and spiral staircases connecting the treehouses.
14–16s: More cottages are physically constructed outward from the giant tree, foundation-to-roof.
16–18s: Hundreds of workers lay stone pathways, fences and a small wooden stream bridge.
18–20s: A marketplace is assembled beneath the tree with stalls, counters and storage huts.
20–22s: Higher platforms, balconies and connected treehouses expand through the branches.
22–24s: Workers install railings, ladders, rope bridges, lantern posts and flower boxes.
24–26s: Teams place stones, plant flowers and trees, create gardens and finish winding paths.
26–28s: Final construction details are secured while hundreds of workers continue moving materials and working across the entire village.
28–30s: Golden-hour reveal. Tiny villagers cross bridges and paths as the camera smoothly pulls backward and rises, revealing the enormous ancient tree surrounded by the completed multi-level village.

KEY RULE: Every 2 seconds introduces a NEW visible construction stage while previous teams continue working. Buildings must visibly progress foundation → beams → walls → roof → details. No instant completion.

NEGATIVE: cartoon, toy, plastic, CGI look, magical construction, instant appearance, morphing, teleportation, floating objects, disappearing materials, duplicated workers, giant humans, children, anatomy glitches, changing tree, inconsistent architecture, empty scenes, text, logos, watermark.
```
