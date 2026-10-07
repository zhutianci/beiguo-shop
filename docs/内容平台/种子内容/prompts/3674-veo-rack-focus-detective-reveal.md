---
title: veo 3 提示词：移焦揭示镜头（前景弹壳 → 背景证人的脸 · 悬疑片经典运镜）
slug: veo-rack-focus-detective-reveal
model: veo
topics: [cinematic, short-drama]
modelLabel: Veo 3.1
aspectRatio: "16:9"
needsRefImage: false
useCase: 学会"移焦（rack focus）"这一电影运镜：前景是侦探手里的一枚弹壳，焦点缓慢转移，露出背景里神情不安的证人。适合悬疑短剧、广告里"从产品细节转到人物反应"的镜头，也是运镜提示词的官方范例。
prompt: |
  中景：前景是一只侦探的手，捏着一枚用过的[黄铜弹壳]，焦点清晰；背景里的一切都是柔和的虚化。16:9，约 6 秒。
  镜头随后执行一次缓慢的移焦：焦点从弹壳慢慢转移到背景，露出一位[神情不安的证人]的脸，现在他的脸清晰锐利，前景的手和弹壳变得模糊。
  机位全程不动，只有焦点在变化。
  光线：低调的室内光，一扇百叶窗把光切成一条条落在证人脸上。
  声音：安静的房间，远处隐约的车流声，证人一声紧张的吞咽。
negativePrompt: 镜头移动，变焦推拉，画面抖动，人脸变形，手指畸形，字幕，水印
source:
  repo: Google Cloud 文档：Veo 视频生成提示词指南
  url: https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/video/video-gen-prompt-guide
  author: "Google"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "官方英文示例译为中文并扩写：补充了\"机位不动只变焦点\"的约束、光线和声音；道具与人物设为变量"
imageBrief: 站长生成 1 条，截取"弹壳清晰""焦点转移中""证人脸清晰"三帧。
verify:
  - Veo 3.1 实测 3 次：模型是否真的只移焦而不移动机位
---
**时长与镜头**：约 6 秒，一个固定机位，唯一的变化是焦点：前景清晰 → 焦点转移 → 背景清晰。Google 的提示词指南把这种技巧列在"镜头与光学效果"里，定义是"在同一个连续镜头中，把焦点从一个主体或深度平面转移到另一个"。

**为什么好用**：移焦是最便宜的"叙事运镜"——不用切镜头，就能把观众的注意力从一个线索引到一个人身上，"物证 → 嫌疑人""礼物 → 收礼人的表情""产品 → 用户的笑脸"都是这个结构。本站在示例基础上补了一句"机位全程不动，只有焦点在变化"，因为模型常把移焦理解成推镜头。

**怎么填变量**：[黄铜弹壳] 和 [神情不安的证人] 换成你的"线索"和"反应"。广告用法示例：前景"[一枚戒指]"，背景"[捂着嘴惊喜的女生]"。

**常见失败与调整**：
- 变成推镜头或变焦：保留"机位不动"，负面提示词写"镜头移动，变焦推拉"。
- 焦点一下子跳过去：写"焦点在 3 秒内缓慢、连续地转移"。
- 前景的手占画面太大：写"手只占画面左下角的三分之一"。

> 改编自 Google Cloud 官方文档《[Video generation prompt guide](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/video/video-gen-prompt-guide)》中的示例提示词，许可证 CC BY 4.0。

### 英文原版

```
A medium shot of a detective's hand in the foreground, holding a single, spent bullet casing. The camera then performs a slow rack focus, shifting from the casing to reveal the anxious face of a witness in the background, now in sharp focus
```
