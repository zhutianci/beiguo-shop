---
title: seedance 提示词：旅行 vlog 在地感蒙太奇模板（全景—细节—人—走进去 · 四镜头）
slug: seedance-travel-vlog-local-montage
model: seedance
topics: [cinematic]
modelLabel: Seedance 2.0
aspectRatio: "9:16"
needsRefImage: false
useCase: 用四个镜头让观众"真切感受到一个地方"：全景起势、一个一看就知道是哪里的细节、一个未经摆拍的当地人瞬间、跟着旅行者走进去。换掉目的地即可，适合旅行号、文旅宣传、民宿与城市推广。
prompt: |
  旅行 vlog，真实手持蒙太奇，黄金时刻自然光，在地感；真实不摆拍，没有浮夸的无人机套路。竖屏 9:16，约 12 秒，地点是[清晨的海边老城]。
  镜头 1｜到达（全景起势）：[太阳升过瓦顶屋脊与海面]，金色晨光；手持，缓缓漂移推进。
  镜头 2｜细节（具体起来）：贴近拍[街边煎锅冒起的热气、墙头的一只猫]——那个一看就知道这是哪里的肌理；快、亲密、浅景深。
  镜头 3｜人（这个地方是活的）：[摊主在笑、孩子追跑过巷子]——一个未经摆布的瞬间，不是摆拍；旅行者可以从画面里穿过。
  镜头 4｜走进去：跟着[一位背包客，只露背影]走进场景的步行越肩镜头，这个地方在前方一点点铺开。
  画面：微单相机手持质感，轻微晃动，自然的曝光变化。
  声音：现场环境声——海浪、市场的吆喝、煎锅滋滋声、远处的海鸥，不要背景音乐。
  不要无人机转圈炫技，不要标题卡，不要"订阅"字样。结尾就是旅行者继续往这个地方里走，环境声延续。
negativePrompt: 无人机环绕炫技，摆拍，人物看镜头摆姿势，过饱和明信片色，文字，字幕，水印
source:
  repo: jnMetaCode/ai-shortfilm-prompts
  url: https://github.com/jnMetaCode/ai-shortfilm-prompts/blob/main/templates/travel-vlog.zh.md
  author: "jnMetaCode"
  license: MIT
  licenseUrl: https://github.com/jnMetaCode/ai-shortfilm-prompts/blob/main/LICENSE
  changes: "原文为 5 段式结构的中英混合模板，本站合并为一条可直接复制的中文提示词；{{变量}} 改为 [方括号变量]；补充了声音与画面质感描述"
imageBrief: 站长生成 1 条，四个镜头各截一帧。
verify:
  - Seedance 2.0 实测 3 次：四个镜头是否按顺序出现、当地人是否自然不摆拍
---
**时长与镜头**：约 12 秒四个镜头：到达（全景）→ 细节 → 人 → 走进去。这是"在地蒙太奇"的固定顺序：先告诉观众"这是哪"，再用一个具体细节让它"只能是这里"，然后让它"活起来"，最后把观众"带进去"。四个镜头够用，再多就成了风景集锦。

**怎么填变量**：[清晨的海边老城] 换成"夜市""高山村落""沙漠公路"；细节换成那里最有辨识度的东西，例如"沏茶的手""一盏灯笼""沙上的脚印"；人换成"扫地的僧人""街头艺人""收网的渔夫"；旅行者换成"一对情侣""只拍双手"。做文旅宣传时，细节和人这两个镜头最能体现地方特色，要写得最具体。

**常见失败与调整**：
- 当地人对着镜头摆拍：写"他们没有注意到镜头"。
- 画面太像宣传片：保留"微单手持""轻微晃动"，删掉"电影感"之类的词。
- 冒出无人机俯拍：负面提示词保留"无人机环绕炫技"。

> 改编自 [jnMetaCode/ai-shortfilm-prompts](https://github.com/jnMetaCode/ai-shortfilm-prompts/blob/main/templates/travel-vlog.zh.md) 的实战范例（Copyright (c) 2026 jnMetaCode，MIT License）。
