---
title: seedance 提示词：AI 短剧职场请假戏（双人参考图 · 三镜头普通话台词）
slug: seedance-office-leave-drama
model: seedance
topics: [short-drama, image-to-video]
modelLabel: Seedance 2.0
aspectRatio: "16:9"
needsRefImage: true
useCase: 上传两位角色的定妆照，生成一段 15 秒"新人请年假被经理为难、组长一句'交接好了就去休息'"的现实向职场短剧，带普通话对白和口型；适合做职场情绪号、AI 短剧的对话戏模板。
prompt: |
  写实电影质感的现代职场短剧，15 秒，16:9 横屏，严格分成三个连续镜头，原生同步普通话对白，不生成字幕。
  人物（脸部严格以参考图为准，服装按剧情调整）：
  - 组长：用图片 1 的脸，二十八九岁女性，黑长发半扎，象牙白衬衫、深灰西裤、简洁银色手表，沉稳、话少。
  - 新人：用图片 2 的脸，二十出头，黑色麻花辫，绿色针织衫、宽松深色长裤、白色球鞋，手里始终拿着同一张填好的[请假单]。
  - 一位部门经理、两位同事，只作旁观者。
  场景：开放式办公室，顶灯与窗外自然光混合照明，玻璃反光、电脑屏幕、远处的电梯；环境只做背景，不主动制造剧情。
  0–5 秒｜全景缓慢推近：经理看着请假单，半开玩笑半施压："[请三天休十三天？你真敢。]"新人赶紧解释："我还有三天年假……"经理："都像你这样，活谁来干？"新人准备好的底气一下子塌了：不生气，只露出那种"好像是我做错了"的犹豫。
  5–10 秒｜中景双人镜头，穿插极短的反应特写：新人慢慢伸手想把请假单拿回来，小声说："要不……我不请了。"一直没说话的组长开口："等一下。"她不先和经理争，而是问新人："交接做完了吗？""做完了。""紧急联系人留了吗？""留了。"组长接过请假单，很自然地签上字递回去："那就去休息。"动作平常得像处理一份普通流程。
  10–15 秒｜近景推到特写：经理皱眉："就这么批了？"组长看着他："不然呢？"停顿半拍。新人压低声音问："这样会不会显得我不负责？"组长认真看着她："负责，是把事情交接清楚。不是不休假，还觉得欠了谁。"新人终于把憋着的那口气呼出来，把请假单收进包里。背景虚化处，一位同事默默关掉手机上的工作群，另一位忍住了笑。新人自己走向电梯，组长已经转回去继续工作。
  表演真实克制：不瞪眼、不哭喊、不打脸、没有霸总气场，结尾没有欢呼和胜利音乐。
  声音：纸张声、衣料摩擦声、脚步声、电梯提示音、办公室环境底噪，全部与动作同步。
  人物脸型、发型、服装、请假单和座位关系全程保持一致。
negativePrompt: 模糊，低画质，水印，文字，字幕，手部畸形，人物前后不一致，换衣服，脸部漂移，背景跳变，道具消失，夸张瞪眼
source:
  repo: YouMind-OpenLab/awesome-seedance-2-prompts
  url: https://x.com/Soranlan/status/2105106379610735081
  author: "@Soranlan"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: 原帖为中文、仓库收录的是英文译本；本站据英文版重写为中文并大幅压缩（删去创作理念说明和重复的一致性条款），保留三镜头结构与全部关键台词；请假单和第一句台词改为变量；负面提示词单列
images:
  - 531-seedance-office-leave-drama-1.jpg
imageCredit:
  by: "@Soranlan"
  url: https://x.com/Soranlan/status/2105106379610735081
  license: CC BY 4.0
verify:
  - 原作标注用的是 Seedance 2.0 Mini；在即梦 / 火山方舟等入口实测 3 次，记录实际可用的模型名、时长与比例（以官方说明为准）
  - 双人参考图时两张脸是否互相"串脸"，普通话口型是否对得上
  - 示例图是原帖视频的封面（仓库 README 引用的 X 视频缩略图），站长实测后可替换
  - 确认原帖仍可访问、作者未另行声明保留权利
---
**时长与镜头**：三个 5 秒节拍——施压、接住、落地。这类对话戏的看点在台词和反应，不在运镜，所以镜头只写"全景缓推 → 中景双人 → 近景特写"三种，不要加环绕和快切。平台单条时长不够时，可以按镜头拆成三条，用同样的参考图分别生成再拼接。

**怎么填变量**：先用图像模型生成两张虚拟角色的正脸定妆照作为图片 1、图片 2，不要用真实同事或明星的照片。[请假单] 可以换成"[调休申请]""[离职交接表]"，第一句台词跟着改，就是另一场职场戏。

**常见失败与调整**：
- 台词太多口型糊掉：每个镜头保留最关键的两三句，其余删掉；单句尽量 15 字以内。
- 人物表演过火：保留最后那段"不瞪眼、不打脸"的约束，必要时再加"表情幅度小"。
- 请假单在手里凭空消失或变成两张：在每个镜头里都点名"同一张请假单"。

> 改编自 [@Soranlan](https://x.com/Soranlan/status/2105106379610735081) 发布、[YouMind-OpenLab/awesome-seedance-2-prompts](https://github.com/YouMind-OpenLab/awesome-seedance-2-prompts) 收录的提示词，许可证 CC BY 4.0。

### 英文原版

原文约 7000 字符，这里节选分镜与台词部分：

```
Cinematic realistic texture, modern Chinese workplace drama.
...
Character & Environment Anchors
Strictly use @Image 1 and @Image 2 as facial identity anchors for the characters, while naturally adjusting clothing according to the modern workplace plot.
...
0–5s | Wide shot gradually pushing in slightly
Manager looks at the leave form, says half-jokingly and half-pressure:
"Three days off? Rest thirteen? You really dare."
Junior sister character immediately starts explaining:
"I still have three days annual leave..."
Manager continues:
"If everyone takes leave like you, who does the work?"
...
5–10s | Medium two-shot relationship lens + extremely short reaction close-ups
Junior sister slowly reaches out to take back the leave form, whispers:
"Maybe... I won't ask for it."
The senior sister character, who hasn't spoken all along, finally opens her mouth:
"Wait."
She doesn't argue with the manager first, but directly asks the junior sister:
"Is the handover done?"
Junior sister: "Done."
Senior sister: "Did you leave emergency contacts?"
Junior sister: "Yes."
Senior sister takes the leave form, signs it very naturally, hands it back to her, and says only:
"Then go rest."
...
10–15s | Close-up entering extreme close-up
Manager finally frowns: "You approved it just like that?"
Senior sister looks at him: "Otherwise what?"
...
Junior sister walks to the elevator herself.
Senior sister has naturally turned back to continue working.
...
Hard Requirements
Strict total duration 15 seconds
16:9 Landscape
Strictly three continuous clear shots
Native synchronized Mandarin dialogue
...
No subtitles generated
No short-drama exaggerated eye-bulging
No domineering CEO performance
No forced satisfying slap-back
```
