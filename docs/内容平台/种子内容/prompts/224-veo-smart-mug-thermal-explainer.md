---
title: veo 3 提示词：产品功能讲解动画（热成像图层 + UI 标注）
slug: veo-smart-mug-thermal-explainer
model: veo
topics: [motion-graphics, product-video]
modelLabel: Veo 3
aspectRatio: "16:9"
needsRefImage: false
useCase: 生成 8 秒的"实拍 + 信息图层"产品功能讲解视频：热成像渐变只贴在产品表面，UI 光环逐格点亮、温度标签弹出，适合智能硬件、小家电的卖点讲解和发布会视频。
prompt: |
  一条干净的科技感功能讲解视频，产品是[一只智能控温马克杯]，16:9，8 秒。
  0–2 秒：固定的俯拍镜头，哑光白色书桌上，黑咖啡冒着细细的热气，柔和的北窗晨光，轻微的室内环境声。
  2–4 秒：一层热成像图层只在杯子表面绽开——从冷蓝到暖橙的平滑渐变；一根手指轻点杯底的感应区，杯沿上一圈精致的 UI 光环一格一格亮起，图形紧贴杯子的弧面。
  4–6 秒：镜头向下弧形移动到四分之三角度，热气保持形状；一个小小的悬浮温度标签"[55°C]"弹入并锁定，伴随一声轻柔的提示音，图层稳定在暖橙色。
  6–8 秒：镜头平稳后拉，露出整张布置好的书桌，图层最后淡出。
  杯子的形状、哑光质感、把手角度和比例全程不变：不扭曲，标签不变形，图层不溢出杯沿，不闪烁，热气不重影。
  色调干净中性，陶瓷与拉丝金属质感。
  音效：轻柔的室内环境声，点击时一声细微的电子音，标签锁定时一声柔和的提示音；没有背景音乐和旁白。
negativePrompt: null
source:
  repo: LichAmnesia/awesome-ad-video-prompts
  url: https://github.com/LichAmnesia/awesome-ad-video-prompts#thermal-data-overlay-smart-mug
  author: awesome-ad-video-prompts contributors
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: 英文原文译为中文；原文为通用视频模型提示词，本站按 Veo 3 原生音频补写"音效"一行；产品和温度数值改为变量
images:
  - 224-veo-smart-mug-thermal-explainer-1.jpg
imageCredit:
  by: LichAmnesia/awesome-ad-video-prompts
  url: https://github.com/LichAmnesia/awesome-ad-video-prompts/blob/main/images/thermal-data-overlay-smart-mug.png
  license: CC BY 4.0
verify:
  - 在 Veo 3 实测 3 次，记录温度数字"55°C"是否显示正确
  - 热成像图层是否只贴在杯子上，还是铺满整个画面
  - 示例图是仓库提供的关键帧图（已转为 JPG 压缩），不是 Veo 成片截图
---
**这条教的是"实拍 + 动效图层"**：先写实拍画面，再写图层"贴在哪里、怎么出现、怎么消失"。关键词是"只在杯子表面""紧贴弧面""不溢出杯沿"，限定图层范围，模型才不会把整个画面染色。

**时长与镜头**：8 秒四段：静态建立 → 图层出现 → 数据标签 → 拉远收尾。换成别的产品时，保持"先看到产品，再看到功能"的顺序。

**怎么填变量**：
- 空气净化器：图层改成"空气中的颗粒被吸入，颗粒颜色由灰变白"，标签写"[PM2.5 12]"。
- 保温杯：标签写"[12 小时后 60°C]"。
- 扫地机：图层改成"地面上画出清扫路径线"。

**常见失败与调整**：
- 数字和文字出错：视频模型写字不稳定，标签尽量短；数字出错时删掉标签，后期在剪辑软件里加。
- 图层闪烁：写"图层平滑渐变，不闪烁"，并减少同时出现的图形数量。

> 改编自 [LichAmnesia/awesome-ad-video-prompts](https://github.com/LichAmnesia/awesome-ad-video-prompts)（awesome-ad-video-prompts contributors），许可证 CC BY 4.0。

### 英文原版

```
Clean tech explainer for a [brand] temperature-control smart mug. 0-2s: locked overhead shot on a matte-white desk, thin steam curling off black coffee, soft north-window morning light, gentle room ambience. 2-4s: a thermal data overlay blooms across only the mug surface — a smooth gradient shifting from cool blue to warm orange — as a fingertip taps the base sensor and a precise UI ring on the rim lights up segment by segment, the graphic mapped cleanly to the mug's curve. 4-6s: the camera arcs down to a three-quarter angle, the rising steam holding its shape, while a small floating temperature label snaps in and locks with a soft chime, the overlay settling to steady warm orange. 6-8s: a smooth pull-back reveals the full styled desk, the overlay dissolving last. The mug keeps identical shape, matte finish, handle angle, and proportions throughout — no warping, label distortion, overlay smearing past the rim, flicker, or doubled steam. Crisp neutral grade, ceramic-and-brushed-metal texture.
```
