---
title: Veo 3.1 提示词怎么写：主体、动作、镜头、声音与对白的官方写法
slug: veo-prompt-guide
products: [gemini]
models: [veo]
accountTier: PRO
excerpt: Veo 3.1 和 Gemini Omni 的视频提示词怎么写才稳？本文按 Google 官方视频提示指南和最佳实践，拆解提示词的 7 个组成部分，讲清音效与对白写法、负面提示、图生视频和多镜头角色一致的技巧，附可复制模板。
checkedOn: 2026-10-07
sources:
  - https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/video/video-gen-prompt-guide
  - https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/video/best-practice
  - https://support.google.com/flow/answer/16353334?hl=en
  - https://ai.google.dev/gemini-api/docs/veo
---

## 适用于谁

- 搜「Veo 3.1 提示词」「Veo 提示词」「Gemini 生成视频提示词」的人；
- 在 Google Flow、Gemini 或 API 里用 Veo / Gemini Omni 做视频，总觉得出来的效果「不是我想的那样」的人；
- 想让同一个角色在多个镜头里长相、声音都一致的人。

本文根据 Google Cloud 官方「视频生成提示指南」和「视频生成最佳实践」整理（这两份文档同时适用于 Veo 和 Gemini Omni Flash），资料核对于 2026-10-07。官方文档内容以 CC BY 4.0 许可发布，本文为改写与归纳。

## 结论先说

1. **把想法拆成组件写**：主体、动作、场景、镜头角度、镜头运动、镜头与光学效果、视觉风格，外加时间感和声音。不必每次都写全，但写清楚的部分越多，越不容易出「通用脸」。
2. **一条短视频只讲一个时刻**：「先……再……然后……」的连续事件请拆成多条生成。
3. **对白用冒号，别用引号**：「她说：我叫小林」，避免引号里的字被画进画面。
4. **负面提示写名词，不写「不要」**：写「城市背景、建筑物」，而不是「不要城市背景」。
5. **图生视频只写运动**：参考图已经决定了人物、场景和风格，提示词只写镜头怎么动、主体怎么动、环境怎么变。

## 提示词的组成部分

| 组件 | 回答什么 | 写法示例 |
| --- | --- | --- |
| 主体 Subject | 谁 / 什么 | 一位经验老到的侦探；一只活泼的金毛幼犬；一台老式打字机 |
| 动作 Action | 在做什么 | 慢慢转身；手指不耐烦地敲桌；花苞在快放中绽开 |
| 场景 Scene | 在哪里、什么时候 | 雨夜霓虹街头；黄金时刻的海边；落满灰尘的阁楼 |
| 镜头角度 Camera angle | 从哪看 | 平视、低角度、俯视、鸟瞰、过肩、第一人称 POV |
| 镜头运动 Camera movement | 镜头怎么动 | 固定、摇（pan）、推拉（dolly）、横移（truck）、升降、航拍、环绕 |
| 镜头与光学 Lens | 镜头「怎么看」 | 广角、长焦、浅景深、焦点转移（rack focus）、镜头光晕 |
| 视觉风格 Style | 整体氛围 | 光线（伦勃朗光、逆光剪影）、情绪、艺术风格、色调与质感 |

另外两类常被忽略的元素：

- **时间感**：慢动作、延时摄影、「天色渐渐变亮」这类细微变化——注意片段只有几秒，别写跨越很长时间的过程。
- **声音**：音效（电话铃声、水花声）、环境声（城市车流、海浪）、对白。官方建议**用单独的句子描述声音**。

官方提醒：部分高级镜头角度和镜头效果并非官方正式支持，效果和稳定性因提示词而异。

## 对白与声音怎么写

官方示例的结构可以概括为：先交代画面，再逐句写台词，最后补环境声。

```
中景，昏暗的审讯室。经验老到的警探说：你的说法漏洞百出。
紧张的线人在一盏裸灯下冒汗，回答：我知道的都告诉你了。
其余的声音只有墙上时钟缓慢的滴答声，和窗外隐约的雨声。
```

要点：

- 每个说话的人先描述清楚（外貌、语气），再用「说：」接台词，**不加引号**；
- 想要声音一致，可以固定描述说话者的嗓音特点，例如「声音清晰干脆、语气冷静、标准普通话」；
- 在 Google Flow 里用 Omni Flash 时，还能直接选预设音色或创建自定义音色（见《Google Flow 怎么用》）。

## 负面提示

官方建议用名词列出不想要的元素，而不是写「no」「don't」。官方示例：同一段「狂风中的橡树动画」提示词，加上负面提示「城市背景、人造建筑、阴暗或暴风雨般的压抑氛围」之后，画面去掉了背景建筑，整体更明亮。

![官方示例：未加负面提示时的橡树动画，背景出现了建筑物（动图截帧）](seed:g325-tree-no-negative.jpg)
*图片来源：[Google Cloud 文档 · Video generation prompt guide](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/video/video-gen-prompt-guide)（CC BY 4.0）*

![官方示例：加入负面提示「urban background, man-made structures, dark, stormy」后的同一提示词（动图截帧）](seed:g325-tree-with-negative.jpg)
*图片来源：[Google Cloud 文档 · Video generation prompt guide](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/video/video-gen-prompt-guide)（CC BY 4.0）*

## 图生视频：只写运动

官方给了三类运动，可以单独用也可以组合：

1. **镜头运动**（场景不动，镜头动）：最简单也最可靠，例如「缓慢推近主体」；
2. **主体动作**：适合细微、自然的动作，例如「她的头发和衣角在风里轻轻飘动」；
3. **环境变化**：例如「雾气慢慢漫过山谷」。

另外三条：

- 源图要清晰、构图好，它决定了后面所有细节；
- 不要在提示词里重新描述图中的人物、背景、光线，重复描述反而会让模型困惑；
- 提到图里的人物时用泛称：「这位女士」「他」「主体」。

## 多镜头保持角色和声音一致

官方推荐的做法：

1. 给角色起名字，写一段**不变的特征描述**：年龄体型、发色发型、脸型、眼睛、标志性特征、服装，以及嗓音风格；
2. 每个新镜头都**原样复制**这段描述，只改动作和场景部分；
3. 在 API 中使用相同的 seed 参数，提高视觉、风格和声音的一致性；
4. 让 Gemini 帮忙：把你的角色描述交给 Gemini，让它扩写成多个镜头的提示词，或者在生成后帮你检查是否符合品牌规范。

## 可复制模板

```
[镜头角度]，[镜头运动]。[场景：地点 + 时间 + 天气/氛围细节]。
[主体：外貌、服装、表情]，正在[动作，按先后写一两个]。
[光线]，[色调]，[风格，如电影感 35mm 胶片 / 写实 / 水彩动画]。
声音：[环境声]；[音效]。[角色]说：[台词]
```

填好的例子：

```
低角度跟拍，镜头缓慢向前推进。黄昏的沿海公路，海风很大，远处灯塔刚亮起。
一位穿黄色雨衣的骑行者站起身用力蹬车，雨衣在风里猎猎作响。
逆光，暖橙与冷蓝的对比色调，电影感，浅景深。
声音：海浪拍岸和呼啸的风声；自行车链条的咔嗒声。
```

## 常见问题

**Q：中文提示词可以吗？**
官方文档的示例均为英文。中文描述通常也能理解，但涉及专业镜头术语时，附上英文原词（如 dolly in、rack focus）更稳妥。

**Q：为什么写了很长一串事件，视频只完成了一半？**
官方说明短视频里串联多个独立事件常会导致混乱或不完整，应拆成多个片段分别生成，再在剪辑工具或 Flow 的 Scenebuilder 里拼接。

**Q：提示词被拦截了怎么办？**
Veo 和 Gemini Omni 都有安全过滤，违反负责任 AI 准则的提示会被拦截。检查是否涉及真实人物、未成年人、暴力或侵权内容，换成原创角色和中性描述。

**Q：可以写「某某导演 / 某部电影风格」吗？**
官方文档举过艺术风格的例子，但模仿特定在世艺术家或知名影视作品可能涉及版权和平台政策风险，商用场景建议用通用风格词（如「胶片颗粒、复古暖调、手绘水彩动画」）描述你想要的效果。

## 参考资料

- Google Cloud 文档：Video generation prompt guide — https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/video/video-gen-prompt-guide
- Google Cloud 文档：Best practices for generating videos — https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/video/best-practice
- Google Flow Help：Create videos in Google Flow — https://support.google.com/flow/answer/16353334?hl=en
- Google AI for Developers：Generate videos with Veo 3.1 in Gemini API — https://ai.google.dev/gemini-api/docs/veo
