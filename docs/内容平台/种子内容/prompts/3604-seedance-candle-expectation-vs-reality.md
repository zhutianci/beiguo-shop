---
title: seedance 提示词：期望 vs 现实对比广告（廉价蜡烛 → 甩镜 → 你的产品 · 竖屏 8 秒）
slug: seedance-candle-expectation-vs-reality
model: seedance
topics: [product-video, ecommerce]
modelLabel: Seedance 2.0
aspectRatio: "9:16"
needsRefImage: true
useCase: 套用社交平台流行的"期望 vs 现实 / 别人家 vs 我家"两段式反转格式做带货短视频：前 3 秒灰暗廉价，甩镜推进后变成温暖高级的产品画面，适合蜡烛、台灯、香薰、床品等氛围类产品。
prompt: |
  竖屏 9:16，约 8 秒，两段式反转格式，中间用甩镜 + 急推硬切。@图片1 为产品外观参考。
  0–3 秒（第一段，灰暗）：凌乱昏暗的出租屋，一只手点燃一根[廉价的普通蜡烛]，火苗微弱、忽明忽暗，几乎照不亮房间；画面低饱和、偏灰，只有单调的环境嗡嗡声。随后一个快速甩镜，镜头急推进冒烟的烛芯。
  3–8 秒（第二段，温暖）：同一个房间焕然一新，变得温暖金黄——@图片1 的[琥珀色螺纹玻璃罐香薰蜡烛]燃着高而稳定的火苗，背后是一面柔焦的串灯光斑墙，融化的蜡池晶莹发亮，火焰上方有淡淡的热浪；一只手慢慢靠近，感受温度。
  火光在脸上和墙上跳动，木柴般的轻微噼啪声，和一声满足的叹息。
  第二段的罐子形状、玻璃纹路和标签与 @图片1 一致：不变形、不漂移、不出现两朵火焰。
  画面中不要生成"期望""现实"等文字，标签文字后期添加。
negativePrompt: 罐子变形，两朵火焰，人脸畸形，手指畸形，乱码文字，字幕，水印，画面闪烁
source:
  repo: LichAmnesia/awesome-ad-video-prompts
  url: https://github.com/LichAmnesia/awesome-ad-video-prompts#expectation-vs-reality-candle
  author: "awesome-ad-video-prompts contributors"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文；原文要求画面带 EXPECTATION/REALITY 标签，本站改为后期加字以避免乱码；增加 @图片1 产品参考写法；前后两段的产品改为变量"
images:
  - 3604-seedance-candle-expectation-vs-reality-1.jpg
imageCredit:
  by: "LichAmnesia/awesome-ad-video-prompts"
  url: https://github.com/LichAmnesia/awesome-ad-video-prompts/blob/main/images/expectation-vs-reality-candle.png
  license: CC BY 4.0
verify:
  - 在即梦 / 豆包等提供 Seedance 2.0 的入口实测 3 次，记录甩镜转场是否被执行
  - 第二段产品与参考图的一致性
  - 示例图是仓库提供的关键帧图（已转 JPG 压缩）
---
**时长与镜头**：8 秒，3 秒 + 5 秒两段。反转类视频的关键是"前段要够差、转场要够快"：前段降饱和、弱光、单调声音，转场用甩镜或急推，后段立刻暖色、光斑、细节特写。Seedance 2.0 支持的时长范围较宽（以即梦 / 火山引擎当前说明为准），想加一句口播可以延长到 10 秒，在第二段末尾加"她轻声说：[终于像个家了]"。

**怎么填变量**：前段的 [廉价的普通蜡烛] 可以换成"刺眼的白炽灯泡""起球的旧床单"；后段换成你的产品，并上传产品图作 @图片1。同样的结构可以做"别人拍的 vs 我拍的"、"买家秀 vs 卖家秀"的反向玩法。

**常见失败与调整**：
- 两段场景完全不像同一个房间：在第二段开头写"同一个房间、同一个机位"，并让家具位置保持不变。
- 模型自作主张加了文字标签且是乱码：保留最后一句"不要生成文字"，"期望 / 现实"大字后期用剪辑软件加。
- 转场变成淡入淡出：把"甩镜"写在单独一句里，并写明"硬切，不要渐变"。

> 改编自 [LichAmnesia/awesome-ad-video-prompts](https://github.com/LichAmnesia/awesome-ad-video-prompts)（awesome-ad-video-prompts contributors），许可证 CC BY 4.0。

### 英文原版

```
Two-beat trend format, hard snap-zoom cut between halves. 0-3s labeled EXPECTATION: a dim cluttered apartment, a hand lights a cheap generic candle that sputters a weak guttering flame and barely glows; muted desaturated grade, flat ambient hum. A hard whip-pan and snap-zoom drive straight into the smoking wick. 3-8s labeled REALITY: the same room reborn warm and golden — a [product] soy candle in a ribbed amber jar burns a tall steady flame, a soft bokeh wall of fairy lights behind it, a glassy melted wax pool and faint heat-shimmer rising; a hand drifts close to feel the warmth. Cinematic firelight flicker dancing on the face and walls, cozy wood crackle and a contented sigh. The jar holds the same shape, ribbed glass pattern, and label across both beats — no deformation, drift, double flame, or artifacts.
```
