---
title: AI视频运镜提示词大全：推拉摇移跟升降、环绕、甩镜怎么写（中英对照）
slug: ai-video-camera-movement-prompts
products: [ai-tools, gemini]
models: [veo]
accountTier: FREE
excerpt: AI 视频的运镜提示词怎么写？本文按 Google 官方视频提示指南整理镜头运动、机位角度、镜头光学效果三张中英对照表，每个术语配效果说明和例句，并给出组合运镜的写法和常见翻车原因，适用于 Veo、即梦、可灵等工具。
checkedOn: 2026-10-07
sources:
  - https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/video/video-gen-prompt-guide
  - https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/video/best-practice
  - https://docs.midjourney.com/hc/en-us/articles/37460773864589-Video
---

## 适用于谁

- 搜「运镜提示词」「AI 运镜提示词」「运镜提示词大全」「AI 视频运镜提示词」的人；
- 做短视频、广告片、短剧分镜，想让 AI 视频有「电影感」而不是一动不动的人；
- 知道「推拉摇移」这些词，但不确定 AI 能不能听懂的人。

本文根据 Google Cloud 官方「视频生成提示指南」（适用于 Veo 与 Gemini Omni）整理改写，资料核对于 2026-10-07。官方文档以 CC BY 4.0 许可发布。不同工具对术语的理解略有差异，国内工具（即梦、可灵）用中文术语通常即可，海外工具建议附英文原词。

## 结论先说

1. **运镜 = 镜头怎么动**，机位角度 = 从哪里看，镜头光学 = 用什么「眼睛」看。三者分开写，AI 更容易听懂。
2. **一条短视频一个主运镜**：「推近 + 环绕 + 升起」全写上，往往一个都不到位。
3. **写速度和方向**：「缓慢推近」「从左向右平移」比单写「推镜头」稳定得多。
4. Google 官方提醒：**部分高级机位和镜头效果并非官方正式支持**，效果和稳定性会因提示词而异。

## 表 1：镜头运动（运镜）

| 中文 | 英文 | 效果 | 例句 |
| --- | --- | --- | --- |
| 固定镜头 | static shot / fixed | 镜头完全不动 | 固定镜头，宁静的湖面 |
| 摇（左右） | pan left / right | 机位不动，镜头水平转动 | 黄昏时缓慢向左摇过城市天际线 |
| 摇（上下） | tilt up / down | 机位不动，镜头上下转动 | 从人物惊讶的脸向下摇到她手中的信 |
| 推 / 拉 | dolly in / out | 镜头实际靠近或远离主体 | 镜头从人物身上缓缓拉远，突出孤独感 |
| 横移 | truck left / right | 镜头侧向平移，常与主体平行 | 镜头向右横移，跟着人物走过热闹的街道 |
| 升 / 降 | pedestal up / down | 镜头垂直升降，视角保持水平 | 镜头上升，展现古树的全貌 |
| 变焦 | zoom in / out | 改变焦距放大缩小，机位不动（不同于推拉） | 缓慢变焦推近桌上神秘的古物 |
| 摇臂 | crane shot | 大幅度升降或弧线运动，常用于揭示场面 | 摇臂镜头升起，展现辽阔的古战场 |
| 航拍 | aerial / drone shot | 高空平滑飞行 | 无人机掠过热带群岛 |
| 手持 | handheld / shaky cam | 轻微抖动，真实、紧张 | 手持镜头穿过混乱的集市追逐 |
| 甩镜 | whip pan | 极快的横摇带模糊，常做转场 | 从一个争吵的人甩镜到另一个人 |
| 环绕 | arc shot | 围绕主体做圆弧运动 | 镜头环绕雨中相拥的两人 |

「跟拍」在官方表里没有单独列出，可以用「横移跟随」「镜头跟随人物向前（tracking shot following the subject）」来表达。

## 表 2：机位与景别

| 中文 | 英文 | 效果 |
| --- | --- | --- |
| 平视 | eye-level shot | 中性、自然的视角 |
| 仰拍 | low-angle shot | 主体显得强大、有压迫感 |
| 俯拍 | high-angle shot | 主体显得渺小、脆弱 |
| 鸟瞰 / 顶拍 | bird's-eye view / top-down | 地图般的俯视 |
| 虫视 | worm's-eye view | 极低角度仰望，强调高大 |
| 荷兰角（倾斜） | dutch angle | 画面倾斜，表现不安、失衡 |
| 特写 / 大特写 | close-up / extreme close-up | 强调表情或微小细节 |
| 中景 | medium shot | 腰部以上，常用于对话 |
| 全景 / 远景 | full shot / wide shot | 全身或交代环境 |
| 过肩 | over-the-shoulder | 对话场景常用 |
| 主观视角 | POV shot | 以角色的眼睛看世界 |

## 表 3：镜头与光学效果

| 中文 | 英文 | 效果 |
| --- | --- | --- |
| 广角 | wide-angle lens | 视野大、透视夸张 |
| 长焦 | telephoto lens | 压缩空间、主体突出 |
| 浅景深 / 焦外虚化 | shallow depth of field / bokeh | 主体清晰、背景虚化 |
| 大景深 | deep depth of field | 前后景都清楚 |
| 焦点转移 | rack focus | 镜头中焦点从前景移到后景 |
| 镜头光晕 | lens flare | 逆光的光斑和光条 |
| 鱼眼 | fisheye lens | 强烈的桶形畸变 |
| 希区柯克变焦 | vertigo effect / dolly zoom | 主体大小不变、背景急剧伸缩，营造眩晕感 |

## 组合运镜怎么写

把**机位 + 运镜 + 速度 + 方向 + 主体动作**写成一句：

```
低角度跟拍，镜头缓慢向前推进，骑行者在海边公路上起身加速。
Low-angle tracking shot, the camera slowly pushes forward as the cyclist stands up and accelerates along the coastal road.
```

```
鸟瞰视角，镜头缓慢下降并向右横移，巨大的绿篱迷宫中一个穿红衣的人在穿行。
Bird's-eye view, the camera slowly descends and trucks right over a vast hedge maze as a figure in a red coat moves through it.
```

Google 官方的变焦示例（意译）：「缓慢而戏剧性地推近一只放在落满灰尘的地图上的古老罗盘。镜头起初是全景，能看到地图和摇曳的烛光，然后平滑推近，直到罗盘上发光的符号占满画面。」——注意它把**起点、过程、终点**都写清楚了。

## 常见翻车与调整

| 现象 | 原因 | 调整 |
| --- | --- | --- |
| 镜头没动 | 只写了画面没写运镜，或运镜写在句尾被忽略 | 把运镜放在句首，并写速度和方向 |
| 镜头乱晃 | 同时写了多个运镜、或用了手持 | 只保留一个主运镜；去掉手持 |
| 推近变成了变焦 | 两者在模型里容易混 | 需要空间感用 dolly，需要「放大」用 zoom，并写清楚 |
| 环绕时人物变形 | 大角度环绕考验一致性 | 缩小环绕角度（半圈），或换成横移 |
| 图生视频里运镜破坏构图 | 运动幅度过大 | 降低动态强度（如 Midjourney 用 Low Motion），只用缓慢推近 |

## 常见问题

**Q：中文「推拉摇移跟升降」AI 都认识吗？**
国内工具对中文运镜术语支持较好；Veo、Gemini Omni 等海外模型的官方示例为英文，建议中英并写。

**Q：可以一次写好几个镜头（分镜）吗？**
Google 官方建议短视频每条只讲一个场景，多镜头请分别生成，再在剪辑工具或 Google Flow 的 Scenebuilder 里拼接（见《Google Flow 怎么用》）。

**Q：图生视频也能用这些运镜吗？**
能，而且镜头运动是图生视频里最稳的一类动作，见《图生视频提示词怎么写》。

## 参考资料

- Google Cloud 文档：Video generation prompt guide（Camera angles / Camera movements / Lens and optical effects）— https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/video/video-gen-prompt-guide
- Google Cloud 文档：Best practices for generating videos — https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/video/best-practice
- Midjourney 官方文档：Video（Low / High Motion）— https://docs.midjourney.com/hc/en-us/articles/37460773864589-Video
