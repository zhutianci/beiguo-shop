---
title: seedance 提示词：镜子倒影"延迟"的搞笑悬疑短片（伪纪录片 vlog 反转）
slug: seedance-mirror-glitch-vlog
model: seedance
topics: [short-drama]
modelLabel: Seedance 2.0
aspectRatio: "9:16"
needsRefImage: false
useCase: 生成 15 秒"刷牙时镜子里的倒影慢了半拍、还冲你挑眉"的伪纪录片反转短片，适合做搞笑、悬疑类短视频，也是学习"日常—异常—反转"三段式结构的好例子。
prompt: |
  【风格】伪纪录片（vlog 风格），超写实，固定机位实拍感，自然光，带一点悬疑的喜剧基调。
  【时长】15 秒。
  【主角】一位普通的年轻女生，站在家里卫生间的洗手池前。
  [00:00-00:06] 镜头一｜日常（一切正常）：
  场景：普通的卫生间镜子前。
  动作：主角在刷牙，满嘴泡沫，一边刷一边对着镜子做各种鬼脸（眯眼、挑眉）。
  关键细节：此时镜子里的倒影完全正常，动作同步。
  [00:06-00:11] 镜头二｜BUG 出现：
  动作：刷完牙，主角低头吐掉泡沫，然后转身离开卫生间。
  核心高潮：主角本人已经转身走出镜子范围，镜子里的"倒影"却没有动！倒影还保持着刷牙的姿势，甚至坏笑着冲镜头调皮地挑了挑眉，停留整整 2 秒，然后突然慌张地"快进"去追本体的动作，才消失在镜中。
  导演备注：一定要做出极其真实的"网络延迟"感，仿佛倒影有了自己的意识。
  [00:11-00:15] 镜头三｜喜剧回扣：
  动作：已经走到门口的主角似乎察觉到不对，猛地回头看向镜子。
  结果：镜子此刻已完全恢复正常，空空如也，只映出对面的墙。主角挠挠头，一脸怀疑人生地看向镜头。画面定格在她困惑的脸上（喜剧效果）。
  【声音】水龙头流水声、刷牙声；倒影挑眉时所有环境声突然消失 1 秒；结尾定格时一声轻快的"咚"。
negativePrompt: null
source:
  repo: ZeroLu/awesome-seedance
  url: https://x.com/johnAGI168/status/2020788951678607813
  author: "@johnAGI168"
  license: MIT
  licenseUrl: https://github.com/ZeroLu/awesome-seedance/blob/main/LICENSE
  changes: 由仓库英文版回译为中文；新增画幅和【声音】一段（倒影挑眉时静音 1 秒）
imageBrief: 仓库只附了视频，没有封面图。请生成 1 条，截取"正常刷牙""倒影挑眉、本人已离开"两帧作展示图。
verify:
  - 实测"本人离开、倒影留下"的成功率，记录失败时的常见表现
  - 确认原帖仍可访问、作者未另行声明保留权利
---
**时长与镜头**：6 + 5 + 4 秒，三段分别是"日常 → 异常 → 反转"。异常段是整条的卖点，所以给了最长的停留时间（2 秒），不要压缩。

**怎么改编**：这个结构可以套到很多日常场景：电梯镜面里多了一个人、自拍时影子先动、视频通话画面卡住但对方在笑……只改【主角】【场景】和镜头二的"异常"即可。

**常见失败与调整**：
- 倒影和本人一起离开：把镜头二拆成两句——"本人已完全离开画面"另起一行，再写"镜子里仍然能看到她在刷牙"，并加"镜中倒影与本人动作不同步是故意的"。
- 镜子里出现两个人：写明"镜子里只有一个倒影"。
- 主角长相前后不同：上传一张人物参考图（只用本人或已获授权的照片，或 AI 虚拟人物）。

**提醒**：这类"灵异感"内容发布时可标注为 AI 生成的创意短片，避免被当成真实事件传播。

> 改编自 [@johnAGI168](https://x.com/johnAGI168/status/2020788951678607813) 发布、[ZeroLu/awesome-seedance](https://github.com/ZeroLu/awesome-seedance) 收录的提示词（Copyright (c) 2026 ZeroLu，MIT License）。

### 英文原版

```
【Style】Mockumentary (Vlog Style), hyperrealism, fixed-camera real-shot feel, natural lighting, with a slight suspenseful comedy tone.
【Duration】15 seconds
【Main Character】An ordinary young beautiful woman, in front of the bathroom sink at home.
[00:00-00:06] Shot 1: Daily setup (Normalcy).
Scene: In front of a regular bathroom mirror.
Action: The protagonist is brushing her teeth, mouth full of foam. She makes various funny faces (squinting, eyebrow-wiggling) at the mirror while brushing her teeth.
Key detail: At this point, the reflection in the mirror is completely normal, movements synchronized.
[00:06-00:11] Shot 2: BUG appears (The Glitch).
Action: After brushing teeth, the protagonist lowers her head to spit out foam, then turns around to leave the bathroom.
High-impact moment (core climax): Just as the protagonist's real body has turned and left the mirror frame, the "reflection" in the mirror **doesn't move**! That "reflection" still maintains the tooth-brushing pose, even mischievously raising eyebrows at the camera with a bad smile, staying for a full 2 seconds, before suddenly panicking and "fast-forwarding" to catch up with the original body's movements before disappearing.
Director's note: Must create an extremely realistic "network delay" feel, as if the reflection has independent consciousness.
[00:11-00:15] Shot 3: Comedic callback (The Punchline).
Action: The protagonist, who has already walked to the door, seems to sense something is wrong, suddenly turning back to look at the mirror.
Result: The mirror has now completely returned to normal, completely empty, only reflecting the opposite wall. The protagonist scratches her head in confusion, showing a life-questioning expression toward the camera. The frame freezes on the protagonist's confused face (comedy effect).
```
