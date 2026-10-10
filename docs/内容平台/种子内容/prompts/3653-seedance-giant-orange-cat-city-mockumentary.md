---
title: seedance 提示词：巨型橘猫卡在摩天楼之间（伪纪录片 vlog 视角 · 三镜头搞笑反差）
slug: seedance-giant-orange-cat-city-mockumentary
model: seedance
topics: [cinematic, short-drama]
modelLabel: Seedance 2.0
aspectRatio: "16:9"
needsRefImage: false
useCase: 超现实搞笑短视频：手机 vlog 视角里，一只哥斯拉那么大的橘猫胖到卡在两栋摩天楼之间，凑近闻公交车被司机摸鼻子、打喷嚏，最后躺在跨江大桥上舔毛堵住晚高峰。适合趣味号、萌宠号、城市文旅的整活视频。
prompt: |
  【风格】伪纪录片，手机 vlog 视角，超写实 CG 与实景结合，高画质，完美的毛发物理模拟。
  【时长】15 秒，16:9。
  【场景】[城市地标附近]或一个车水马龙的立交桥路口，带有魔幻的山城立体感。
  【00:00–00:05】镜头一：视觉奇观（揭晓）。画面是一条熙熙攘攘的城市街道，镜头往上抬，露出一只哥斯拉那么大的橘色虎斑猫卡在两栋摩天楼之间。动作：巨猫因为太胖被卡住了，一脸可怜地挥着巨大的爪子，努力想把自己拔出来。细节：阳光下猫毛根根分明，巨大的肉垫按在玻璃幕墙上，把玻璃压得变形。
  【00:05–00:10】镜头二：荒诞互动。镜头切到地面视角，街上车流不息，红绿灯闪烁。巨猫低下头，把巨大的猫脸凑近地面，好奇地闻一辆正在等红灯的公交车。动作：公交司机淡定地伸手摸了摸巨猫的鼻子，巨猫打了个喷嚏，瞬间吹飞路边的落叶和行人的帽子（风的效果）。
  【00:10–00:15】镜头三：梗图式结尾（包袱）。巨猫终于挤过楼群，一屁股坐在一座跨江大桥上，桥面微微下沉（物理反馈）。它懒洋洋地躺下开始舔毛，把整个晚高峰堵得水泄不通。镜头最后定格在它无辜的大眼睛上。
negativePrompt: 建筑倒塌，人员受伤，猫脸变形，多余的猫，卡通，文字，水印
source:
  repo: ZeroLu/awesome-seedance
  url: https://x.com/johnAGI168/status/2020717903134204344
  author: "@johnAGI168"
  license: MIT
  licenseUrl: https://github.com/ZeroLu/awesome-seedance/blob/main/LICENSE
  changes: "英文原文译为中文；原文指定的真实地标改为变量；其余保持原意"
imageBrief: 仓库没有可单独提取的封面。站长生成后截取"卡在楼间""闻公交车""躺在大桥上"三帧。
verify:
  - Seedance 2.0 实测 3 次，记录巨猫与城市的比例是否稳定
  - 使用真实城市地标时，注意不要做成灾难或破坏画面
  - 确认原帖仍可访问
---
**时长与镜头**：15 秒三个镜头，标题就写清每段的作用：揭晓（奇观） → 互动（荒诞） → 包袱（梗图式结尾）。这是超现实搞笑视频的万能结构：先用奇观抓眼球，再用"一本正经的日常反应"制造荒诞（司机淡定摸鼻子），最后给一个可以截图做表情包的定格。

**怎么填变量**：[城市地标附近] 换成你所在城市的街景描述（如"江边的老码头""夜市街口"），城市文旅号可以用本地特色场景整活；橘猫可以换成"巨型柴犬""巨型仓鼠""巨型熊猫"。

**常见失败与调整**：
- 比例忽大忽小：在每段都写"像摩天楼一样大"，并让它始终与建筑、车辆同框作参照。
- 变成怪兽灾难片：保留"一脸可怜""懒洋洋"等描述，负面提示词写"建筑倒塌，人员受伤"。
- 喷嚏把行人吹飞太夸张：写"只吹飞了帽子和落叶"。

> 改编自 [@johnAGI168](https://x.com/johnAGI168/status/2020717903134204344) 发布、[ZeroLu/awesome-seedance](https://github.com/ZeroLu/awesome-seedance) 收录的提示词（Copyright (c) 2026 ZeroLu，MIT License）。

### 英文原版

```
【Style】Mockumentary, mobile Vlog perspective, hyperrealistic CG combined with real scenes, 8K quality, perfect fur physics simulation.
【Duration】15 seconds
【Scene】Hongya Cave in Chongqing or a busy overpass intersection (with magical 8D city feel).
[00:00-00:05] Shot 1: Visual spectacle (The Reveal).
The scene shows a bustling city street. The camera lifts up to reveal a **Gozilla-sized orange tabby cat** stuck between two skyscrapers.
Action: The giant cat is stuck because it's too fat, waving its huge paws with a pitiful expression, trying to pull itself out.
Detail: Cat fur is clearly visible in the sunlight, huge paw pads pressing against glass curtain walls, deforming the glass.
[00:05-00:10] Shot 2: Absurd interaction (The Interaction).
The camera switches to ground-level perspective. Traffic flows on the street, traffic lights flashing. The giant cat lowers its head, bringing its huge cat face close to the ground, curiously sniffing a bus waiting at a red light.
Action: The bus driver calmly reaches out and pets the giant cat's nose. The cat sneezes, instantly blowing away roadside leaves and pedestrians' hats (wind effect).
[00:10-00:15] Shot 3: Memetic ending (The Punchline).
The giant cat finally squeezes past the buildings and sits down on a cross-river bridge, causing the bridge deck to sink slightly (physical feedback).
Narrative sense: It lazily lies down and starts grooming itself, blocking the entire evening rush hour traffic. The camera finally freezes on its innocent big eyes.
```
