---
title: seedance 提示词：拟人老虎武者废墟城市打斗（3D 动作大片 · 腾空—特写—爆炸落地）
slug: seedance-tiger-warrior-ruined-city-fight
model: seedance
topics: [cinematic]
modelLabel: Seedance 2.0
aspectRatio: "16:9"
needsRefImage: false
useCase: 做拟人动物角色的 3D 动作短片：废墟城市里对峙、腾空跃起、面部特写、拳脚交锋、能量冲击和爆炸、英雄落地剪影，适合动画短片预告、游戏角色宣传和 AI 动作片练手。
prompt: |
  一段约 15 秒的电影感 3D 动作场景，16:9。主角是一位强壮的拟人化[橙色老虎武者]，身处浓烟、火光和倒塌楼房包围的[废墟城市]。
  0–3 秒：开场对峙，老虎武者杀气腾腾地面对对手，随后猛然高高跃起，做出动感的武术动作，镜头戏剧化地跟随这一跃。
  3–5 秒：切到老虎的面部特写——锐利的眼神、细致的橙色毛发和胡须、凶狠的表情。
  5–10 秒：老虎与一位[人形对手]继续交锋，快速的拳和踢，角色外形和身体结构保持一致；一次攻击时爆出一道蓝色能量冲击，随后废墟中炸开巨大的火球。
  10–15 秒：火焰、飞溅的碎石、浓烟和火星在环境里扩散；老虎自信地落在前景，身后燃烧的废墟发着光，形成英雄剪影。
  要求：平滑的电影运镜，真实的物理效果，戏剧化光影，细节丰富的材质，扎实的动作设计，高品质 3D 动画质感。
  画面中不要出现文字和水印，角色不变形。
negativePrompt: 角色变形，多余的肢体，毛发闪烁，角色前后不一致，画面撕裂，文字，水印
source:
  repo: YouMind-OpenLab/awesome-seedance-2-prompts
  url: https://x.com/Aiwithmaha/status/2106938584431526162
  author: "@Aiwithmaha"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文并拆成带时间码的四段；主角、场景、对手改为变量；时长由原文 14.6 秒取整为约 15 秒"
images:
  - 3626-seedance-tiger-warrior-ruined-city-fight-1.jpg
imageCredit:
  by: "@Aiwithmaha"
  url: https://x.com/Aiwithmaha/status/2106938584431526162
  license: CC BY 4.0
verify:
  - 在 Seedance 2.0 入口实测 3 次，记录打斗段角色肢体是否崩坏
  - 确认原帖仍可访问、作者未另行声明保留权利
---
**时长与镜头**：约 15 秒四段：对峙腾空 → 面部特写 → 交锋 + 爆炸 → 落地剪影。Seedance 2.0 官方说明可选 4–15 秒，这条正好用满。打斗是 AI 视频最容易崩的题材，原作的聪明之处是"打斗段夹在特写和剪影之间"：特写和剪影都很稳，观众对中间几秒的瑕疵容忍度更高。

**怎么填变量**：[橙色老虎武者] 换成"熊猫拳师""狼族剑客""机械猫忍者"；[废墟城市] 换成"竹林""雨夜屋顶""古代擂台"；[人形对手] 也可以换成另一只拟人动物，两者颜色反差大一些（如橙 vs 黑），模型更不容易把两人画混。

**常见失败与调整**：
- 两个角色打着打着融成一团：把交锋段改成"一招一式、你来我往"，并缩短到 3 秒；或者只拍老虎出拳的反应镜头，对手只露出剪影。
- 爆炸遮住一切：写"爆炸在远处背景中，主角清晰可见"。
- 3D 风格变成写实真人：开头和结尾都强调"高品质 3D 动画，皮克斯式毛发质感"。

> 改编自 [@Aiwithmaha](https://x.com/Aiwithmaha/status/2106938584431526162) 发布、[YouMind-OpenLab/awesome-seedance-2-prompts](https://github.com/YouMind-OpenLab/awesome-seedance-2-prompts) 收录的提示词，许可证 CC BY 4.0。

### 英文原版

```
Create a cinematic 14.6-second action scene featuring a powerful anthropomorphic orange tiger warrior in a destroyed city surrounded by smoke, fire, and collapsing buildings. The tiger aggressively faces an opponent in the opening shot, then suddenly leaps high into the air with dynamic martial-arts movement as the camera follows the jump dramatically. Cut to an intense close-up of the tiger’s realistic face, focusing on sharp eyes, detailed orange fur, whiskers, and a fierce expression. Show the tiger continuing the fight against a human-like opponent with fast punches and kicks, maintaining consistent character appearance and anatomy. A powerful blue energy impact appears during the attack, followed by a huge fiery explosion in the ruined city. Show flames, flying debris, thick smoke, sparks, and realistic destruction spreading across the environment. The tiger lands confidently in the foreground while the burning ruins glow behind it, creating a dramatic heroic silhouette. Use smooth cinematic camera movement, realistic physics, dramatic lighting, detailed textures, strong action choreography, and high-quality 3D animation throughout, with no text, watermark, or character distortion.
```
