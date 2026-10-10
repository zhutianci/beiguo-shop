---
title: 可灵提示词：黏土定格动画模板（12 帧步进 · 指纹质感 · 小生物踮脚受惊）
slug: kling-claymation-stop-motion-creature
model: kling
topics: [cinematic, motion-graphics]
aspectRatio: "16:9"
needsRefImage: false
useCase: 手作黏土定格动画的骨架：一只圆肚子的黏土小生物踮着脚走过苔藓林地、受惊僵住、眨眼、安定下来，保留 12 帧的顿挫感和指纹质感。换掉角色和布景即可，适合儿童内容、品牌吉祥物动画、治愈系短片。
prompt: |
  手作黏土动画，12 帧步进的定格质感，能看见指纹的触感质地，温暖的实用灯照明；保留迷人的瑕疵感，不要丝滑的 CG 3D，不要运动模糊。约 10 秒，16:9。
  角色：[一只圆肚子的黏土小生物]，材质是[哑光橡皮泥，能看见指纹]；布景：[一片微缩的长苔藓的林地]；灯光：[一盏暖色台灯，柔和阴影]。
  0–3 秒｜登场：小生物[踮着脚走过，然后受惊僵住]，动作以细小的 12 帧步子推进，表面有淡淡的"帧间抖动"；固定机位俯拍布景全景，灯光从一侧打来，拇指印和接缝在灯光下显形。
  3–6 秒｜小瞬间：一个停顿，一个简单而有表现力的反应——一次眨眼（眼皮分两步先合后睁）、一次歪头；镜头步进式缓慢推近（不要丝滑运镜）。声音：细小的拟音，一声摩挲、一声吱呀。
  6–10 秒｜收住：小生物安定下来，完成那个小动作；镜头定住，固定机位。
  没有盛大终幕，没有闪光，没有丝滑横扫；就是小生物静止下来，布景安静下来，最后一下淡淡的帧间抖动。
negativePrompt: 丝滑 CG 3D，运动模糊，塑料光泽，完美光滑表面，写实生物，文字，水印
source:
  repo: jnMetaCode/ai-shortfilm-prompts
  url: https://github.com/jnMetaCode/ai-shortfilm-prompts/blob/main/templates/claymation.zh.md
  author: "jnMetaCode"
  license: MIT
  licenseUrl: https://github.com/jnMetaCode/ai-shortfilm-prompts/blob/main/LICENSE
  changes: "原文为 5 段式结构的中英混合模板，本站合并为一条可直接复制的中文提示词；{{变量}} 改为 [方括号变量]；术语\"boil\"译为\"帧间抖动\""
imageBrief: 站长生成 1 条，截取"踮脚走过""眨眼歪头""静止"三帧。
verify:
  - 可灵实测 3 次：12 帧的顿挫感是否出现（模型常默认生成丝滑运动）
---
**时长与镜头**：10 秒三段：登场 → 小反应 → 收住。黏土动画的灵魂是"不完美"：12 帧的顿挫、表面每一帧轻微变化的"帧间抖动"、看得见的指纹和接缝。模型默认会生成丝滑的 3D 动画，所以提示词和负面提示词里都要反复强调"步进""不要运动模糊""不要丝滑"。

**怎么填变量**：[一只圆肚子的黏土小生物] 换成"一只羊毛毡狐狸""一个铁丝加黏土的小机器人"；布景换成"一个小厨房""一座纸板城市"；动作换成"烤一个歪歪的蛋糕""追一只小虫子"；灯光换成"冷调窗光""一串小彩灯"。品牌吉祥物可以先用图像模型做一张黏土风格的角色图，再走图生视频。

**常见失败与调整**：
- 动作太顺滑像 3D：写"每秒只有 12 帧，动作一顿一顿的"。
- 表面太光滑像塑料：保留"能看见指纹""哑光"。
- 小生物动作太多：只保留一个动作 + 一个反应。

> 改编自 [jnMetaCode/ai-shortfilm-prompts](https://github.com/jnMetaCode/ai-shortfilm-prompts/blob/main/templates/claymation.zh.md) 的实战范例（Copyright (c) 2026 jnMetaCode，MIT License）。
