---
title: veo 3 提示词：从简到详怎么改（绿色霓虹下打转盘电话的男人 · 官方前后对照）
slug: veo-neon-rotary-phone-detail-upgrade
model: veo
topics: [cinematic, short-drama]
modelLabel: Veo 3.1
aspectRatio: "16:9"
needsRefImage: false
useCase: 学习"如何把一句简单描述扩写成电影级提示词"：同一个画面——一个绝望的男人在绿色霓虹下拨打墙上的转盘电话——官方给出"简略版"和"详细版"对照。适合想提高提示词质量的新手，也可直接用作黑色电影风格的短片镜头。
prompt: |
  一个电影感的特写镜头，跟随一个穿着[破旧绿色风衣]的绝望男人，他正在拨打一部挂在粗糙砖墙上的转盘电话，整个人沐浴在一块绿色霓虹灯牌诡异的光里。16:9，约 8 秒。
  镜头缓缓推近，露出他紧绷的下颌和写满绝望的脸，他挣扎着想把电话拨出去。
  浅景深把焦点放在他紧锁的眉头和那部黑色转盘电话上，背景虚化成一片霓虹色块和模糊的阴影，营造出紧迫和孤立的感觉。
  声音：转盘一格一格回弹的咔哒声，听筒里的忙音，远处潮湿街道上的车声。
negativePrompt: 手指畸形，电话变形，背景文字乱码，字幕，水印
source:
  repo: Gemini API 文档：Veo 3.1 视频生成
  url: https://ai.google.dev/gemini-api/docs/veo
  author: "Google"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "官方\"详细版\"英文示例译为中文；补充了声音描述；服装设为变量；正文附官方\"简略版\"作对照"
imageBrief: 站长分别用简略版与详细版各生成 1 条，各截一帧做对比图。
verify:
  - Veo 3.1 实测：简略版与详细版各 3 次，对比画面差异，写进正文
---
**时长与镜头**：8 秒一个缓慢推近的特写。这条的价值在于"对照"——Gemini API 官方文档给了同一画面的两个版本：

- **简略版**：镜头推近，拍一个穿绿色风衣的绝望男人的特写。他正在用一部带绿色霓虹灯的墙上转盘电话打电话。看起来像电影场景。
- **详细版**：就是上面的提示词。

**详细版多写了什么**：①**主体细节**——"破旧的"风衣、"粗糙砖墙"、"黑色"转盘电话；②**表演**——紧绷的下颌、紧锁的眉头、"挣扎着想把电话拨出去"；③**镜头语言**——跟随、缓慢推近、浅景深、焦点放在哪里；④**氛围**——诡异的霓虹光、背景虚化成色块、"紧迫和孤立的感觉"。这四项正是官方指南列出的提示词要素（主体、动作、风格、镜头运动、构图、焦点与镜头效果、氛围）。本站在详细版基础上又补了第五项"声音"。

**怎么练**：拿你自己的一句话描述，按"主体细节 / 表演 / 镜头 / 氛围 / 声音"五项各补一句，就是一条合格的视频提示词。

**常见失败与调整**：
- 转盘电话被画成按键电话：写"老式黑色转盘拨号电话，带弹簧螺旋线"。
- 霓虹灯牌出现乱码文字：写"霓虹灯牌只露出一角，看不清文字"。

> 改编自 Gemini API 官方文档《[Generate videos with Veo 3.1](https://ai.google.dev/gemini-api/docs/veo)》中的示例提示词，许可证 CC BY 4.0。

### 英文原版

```
Less detail: The camera dollies to show a close up of a desperate man in a green trench coat. He's making a call on a rotary-style wall phone with a green neon light. It looks like a movie scene.

More detail: A close-up cinematic shot follows a desperate man in a weathered green trench coat as he dials a rotary phone mounted on a gritty brick wall, bathed in the eerie glow of a green neon sign. The camera dollies in, revealing the tension in his jaw and the desperation etched on his face as he struggles to make the call. The shallow depth of field focuses on his furrowed brow and the black rotary phone, blurring the background into a sea of neon colors and indistinct shadows, creating a sense of urgency and isolation.
```
