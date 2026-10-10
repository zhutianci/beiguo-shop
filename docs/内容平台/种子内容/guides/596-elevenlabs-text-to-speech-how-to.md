---
title: ElevenLabs 怎么用：文字转语音入门、中文配音、模型与参数怎么调、声音克隆须知
slug: elevenlabs-text-to-speech-how-to
products: [ai-tools]
models: []
accountTier: FREE
excerpt: ElevenLabs 怎么用、支持中文吗？本文按官方文档讲清文字转语音的四步操作、选声音和选模型哪个更重要、稳定度与相似度等参数怎么调、停顿和情绪怎么控制、声音克隆的录音要求与授权确认，以及免费额度和商用许可。
checkedOn: 2026-10-11
sources:
  - https://elevenlabs.io/docs/eleven-creative/playground/text-to-speech
  - https://elevenlabs.io/docs/overview/models
  - https://elevenlabs.io/docs/overview/capabilities/text-to-speech/best-practices
  - https://elevenlabs.io/docs/eleven-creative/voices/voice-cloning/instant-voice-cloning
  - https://elevenlabs.io/pricing
---

## 适用于谁

- 搜「elevenlabs 怎么用」「elevenlabs 中文配音」「elevenlabs 支持中文吗」「elevenlabs 声音克隆」「elevenlabs 免费额度」的人；
- 要给视频、有声书、课程做旁白，想要比普通朗读更自然的 AI 语音的人。

本文根据 ElevenLabs 官方文档和定价页整理，资料核对于 2026-10-11。界面为英文，文中按钮名保留原文。价格与额度会调整，以官网定价页为准。

## 结论先说

1. **基本操作只有四步**：输入文字 → 选声音 → 调参数（可选）→ 点 Generate。
2. **影响效果的顺序是：声音 > 模型 > 参数**。官方原话是声音的选择最重要，其次是模型，最后才是各项设置。
3. **支持中文**。官方模型页的语言列表里有中文；最新的 Eleven v4 标注支持 90 多种语言。
4. **做中文配音，要选母语是中文的声音**。官方说明任何声音理论上都能说任何语言，但会保留原本的口音。
5. **免费版每月 1 万积分**，文字转语音按 1 个字符 1 积分计；定价页上，商用许可从 Starter 档开始列出，免费档的功能清单里没有这一项。
6. **克隆声音必须确认你有权利并已取得同意**，这是创建流程里的必经步骤。

## 步骤

### 1. 生成第一段语音

官方指南的四步：

1. 在 Text to Speech 页面的输入框里输入或粘贴文字；
2. 在屏幕左下方从你的 Voices 里选一个声音；
3. 按需调整声音设置（可跳过）；
4. 点 **Generate** 生成音频。

### 2. 选声音

官方把声音分成几类：精选的默认声音（Default Voices）、声音库（Voice Library，种类最多）、用 Voice Design 工具生成的全合成声音，以及你自己克隆的声音。

官方反复强调的几点：

- 选对声音很可能是对最终效果影响最大的一个决定，它决定了性别、音色、口音、节奏和表达方式，值得多花时间；
- **不同语言要选对应母语的声音**：用声音库里的母语声音，或者克隆一个说该语言、口音正确的声音，效果最好；
- 想要开心活泼的效果，就选用开心活泼的样本训练出来的声音，想要沉稳内敛的就选对应特征的声音。声音本身的气质比事后调参数管用。

喜欢某个声音但想换种表达方式，可以用 Voice Remixing，用自然语言描述来改变语气、节奏甚至口音。官方注明它只适用于你自己创建的声音和默认声音，声音库里别人的声音不能改。

### 3. 选模型

官方文档列出的主要模型（2026-10-11 核对）：

| 模型 | 官方描述 | 语言数 | 单次字符上限 |
| --- | --- | --- | --- |
| Eleven v4 | 最新、最有表现力的高质量模型，支持自然的多人对话 | 90+ | 10,000 |
| Eleven v4 Turbo | 最有表现力的实时模型，延迟极低 | 90+ | — |
| Eleven v3 | 情感丰富、戏剧化的表达，支持多人对话 | 70+ | 5,000 |
| Eleven Multilingual v2 | 逼真、质量稳定，长文本生成最稳 | 29 | 10,000 |
| Eleven Flash v2.5 | 快速、便宜，延迟极低 | 32 | 40,000 |

官方的建议：

- 模型是影响效果的第二大因素，用选定的声音把几个模型都试一遍再决定；
- 内容只有英文时，强烈建议用英文专用模型，更稳定；其他语言或多语言内容用多语言模型；
- 官方称 v4 在几乎所有情况下都比 v3 更好，建议改用 v4；
- 长篇旁白求稳，Multilingual v2 是官方标注「长文本最稳定」的那个；
- 大批量、对成本敏感的场景看 Flash v2.5，官方标注其 API 调用的每字符价格低 50%。

### 4. 调参数

官方给的常用起点：**Stability 约 50，Similarity 约 75，Style 保持 0**，之后只做小幅调整。

| 参数 | 作用（官方说明） | 怎么调 |
| --- | --- | --- |
| Stability（稳定度） | 决定声音有多稳、每次生成之间的随机性有多大 | 调低：情绪起伏更大、更有戏剧性，需要多生成几次挑选；调高：更严肃稳定，过高会趋于单调 |
| Similarity（相似度） | 决定多大程度贴近原始声音 | 原始录音质量差时不要设得太高，否则会把杂音和瑕疵也复现出来 |
| Style exaggeration（风格夸张） | 放大原说话人的风格 | 会多消耗算力、可能增加延迟，官方建议一般保持 0 |
| Speaker Boost | 增强与原说话人的相似度，差别通常很细微 | 按需开启 |
| Speed（语速） | 默认 1.0；最低可到 0.7 | 小幅调整 |

两点注意：官方注明 Speed、Similarity、Speaker Boost 在 Eleven v3 模型上不可用；另外模型是非确定性的，同样的参数每次结果也会有差别，滑块控制的是随机范围而不是固定结果，不满意就再生成一次。

### 5. 控制停顿、情绪和读法

**停顿**

- Multilingual v2、Flash 等模型：用 `<break time="1.5s" />` 插入停顿，官方说明最长 3 秒；一次生成里用太多会导致不稳定（语速变快或出现杂音）。破折号和省略号也能制造停顿，但不如 break 标签稳定；
- **Eleven v4 和 v3 不支持 break 标签**。官方说明改用音频标签、标点（省略号）和文本结构来控制停顿和节奏。

**情绪与表演（v4 / v3）**

用方括号写音频标签，官方给的例子：

```
[whispers] I never knew it could be this way, but I'm glad we're here.
```

常见的有 `[laughs]`、`[whispers]`、`[sighs]`、`[sarcastic]`、`[curious]`、`[excited]` 等；还可以写 `[applause]` 这类音效标签。官方提示：标签要写得明确；声音本身的训练数据里有对应的表达方式（比如本来就会低语）时，标签更容易生效。

**数字、电话、日期读错**

官方把这类问题称为文本规范化（normalization）问题：电话号码、金额、日期等容易读错，小模型尤其明显。官方说明规范化默认对所有 TTS 模型开启；仍然读错时，最直接的办法是把它们改写成你希望听到的文字形式，例如把「2026-10-11」写成「二〇二六年十月十一日」。

### 6. 克隆自己的声音（Instant Voice Clone）

官方指南的流程：

1. 在控制台左侧进入 **Voices**，点加号，在弹窗里选 **Instant Voice Clone**；
2. 按提示上传或录制音频；
3. 给声音命名并加标签，**确认你拥有克隆这个声音的权利并已获得同意**，点 Save voice；
4. 在 Voices → My Voices 里点 Use voice 开始使用。

官方给的录音要求：

- 总时长 1–2 分钟的清晰音频就够；不要超过 3 分钟，官方说再长几乎没有提升，有时反而更差；
- 录制质量比时长重要：不要有混响、杂音和背景声；
- 语气、表现和音质前后保持一致。模型会模仿它听到的一切，包括语速、口音、呼吸声和噪音；
- 音量适中，官方给的参考值是 RMS 在 -23 dB 到 -18 dB 之间，真峰值 -3 dB。

**只克隆你自己的声音，或者已经明确书面同意的人的声音。** 官方文档在克隆指南开头就提示：不确定是否合法时，先查阅服务条款和 AI 安全说明。未经同意克隆他人声音，既违反平台规则，也可能触犯法律。

## 额度与商用

来自官网定价页（2026-10-11 核对，以官网为准）：

- 免费档每月 1 万积分；文字转语音按 1 字符 1 积分计算；
- 定价页的功能清单中，**商用许可**和 **Instant Voice Clone** 都是从付费的 Starter 档开始列出的，免费档没有；
- 更高的档位积分更多，并包含 Professional Voice Clone（需要更多样本和训练时间，相似度更高）。

所以用于变现的视频、课程、广告配音，用付费档生成；免费档适合试用和个人练习。具体条款以官方服务条款为准。

## 常见问题

**Q：中文效果怎么样？**
官方只给出语言支持列表，没有按语言给出质量评分。按官方的方法做：选中文母语的声音，再用 v4、Multilingual v2 各生成一段对比。

**Q：同一段话每次读得不一样？**
正常现象，官方说明模型是非确定性的。想更一致就把 Stability 调高；想要某一次的效果，就多生成几次后保留满意的那一版。

**Q：长文章怎么处理？**
注意各模型的单次字符上限。长内容按段落分批生成，并且全程使用同一个声音、同一个模型和同一组参数，保持前后一致。

**Q：有中文界面吗？**
以实际界面的语言选项为准，官方文档没有专门说明。

## 参考资料

- ElevenLabs 文档：Text to Speech（产品指南）— https://elevenlabs.io/docs/eleven-creative/playground/text-to-speech
- Models — https://elevenlabs.io/docs/overview/models
- Text to Speech best practices — https://elevenlabs.io/docs/overview/capabilities/text-to-speech/best-practices
- Instant Voice Cloning — https://elevenlabs.io/docs/eleven-creative/voices/voice-cloning/instant-voice-cloning
- 定价页 — https://elevenlabs.io/pricing
