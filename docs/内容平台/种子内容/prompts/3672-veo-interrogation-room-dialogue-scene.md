---
title: veo 3 提示词：审讯室对白戏（单灯泡 · 两句台词 + 钟表滴答雨声 · 官方示例改编）
slug: veo-interrogation-room-dialogue-scene
model: veo
topics: [short-drama, cinematic]
modelLabel: Veo 3.1
aspectRatio: "16:9"
needsRefImage: false
useCase: 悬疑短剧里最常用的"审讯室"对白镜头：昏暗房间、一盏裸灯泡、老练的警探一句质问、紧张的线人一句辩解，背景只有钟表滴答和窗外雨声。适合悬疑短剧片段、剧本围读可视化，也是学习 Veo 写台词与声音的官方范例。
prompt: |
  中景，一间昏暗的[审讯室]，16:9，约 8 秒。
  画面：一盏裸露的灯泡悬在桌子上方，投下锐利的顶光和深重的阴影；桌上放着一个[牛皮纸档案袋]和一杯没动过的水。
  一位老练的警探身体前倾，双手撑在桌上，盯着对面的人，低沉地说："[你的说法漏洞百出。]"
  紧张的线人在灯泡下满头是汗，手指不停地搓着，回答："[我知道的全都告诉你了。]"
  镜头从两人的侧面缓慢推近，最后停在线人躲闪的眼神上。
  声音：除了对白，只有墙上挂钟缓慢而规律的滴答声，和雨点打在窗户上的微弱声音。
  画面质感：低调布光，冷灰色调，轻微胶片颗粒，电影感。
negativePrompt: 背景音乐，字幕，文字，多余的人物，人脸变形，手指畸形，水印
source:
  repo: Google Cloud 文档：Veo 视频生成提示词指南
  url: https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/video/video-gen-prompt-guide
  author: "Google"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "官方英文示例译为中文并扩写：补充了道具、人物动作、运镜和画面质感；两句台词译为中文并设为变量"
imageBrief: 站长生成 1 条，截取"警探质问""线人回答""推近到眼神"三帧。
verify:
  - Veo 3.1 实测 3 次：两句中文台词是否分别由正确的人物说出、口型是否同步
  - 与本站 229 号"两人对话短剧片段"的区别：本条是单场景审讯戏，强调声音层次
---
**时长与镜头**：8 秒一个中景，缓慢推近：警探质问 → 线人回答 → 推到眼神。Veo 单条最长 8 秒（Veo 3.1 可选 4 / 6 / 8 秒，以官方说明为准），两句台词正好；第三句就容易说不完。

**官方写法要点**：Google 的 Veo 提示词指南建议把声音"单独成句"描述，并分成三类——**对白**（用"某人说：……"，台词放在引号里）、**音效**（具体的单个声音，如钟表滴答）、**环境声**（让场景真实的背景声，如雨声）。这条示例把三类都写全了，而且用"只有……"排除了背景音乐，所以声音层次很干净。

**怎么填变量**：[审讯室] 可以换成"深夜的出租车后座""医院走廊""校长办公室"，人物和台词随之改，例如"班主任：[这张卷子是你自己做的吗？]"。[牛皮纸档案袋] 这种道具是给画面加"信息量"的，可以换成"一部碎屏手机""一张旧照片"。

**常见失败与调整**：
- 两句台词被同一个人说了：在台词前写清"警探说""线人回答"，并让两人外观差异明显（年龄、服装）。
- 自动加了紧张配乐：保留"只有……"的写法，负面提示词写"背景音乐"。
- 推近运镜没执行：单独写一句"镜头缓慢推近，停在线人脸部特写"。

> 改编自 Google Cloud 官方文档《[Video generation prompt guide](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/video/video-gen-prompt-guide)》中的示例提示词，许可证 CC BY 4.0。

### 英文原版

```
A medium shot in a dimly lit interrogation room. The seasoned detective says: Your story has holes. The nervous informant, sweating under a single bare bulb, replies: I'm telling you everything I know. The only other sounds are the slow, rhythmic ticking of a wall clock and the faint sound of rain against the window
```
