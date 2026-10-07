---
title: 数据可视化 AI：对数坐标损失-算力曲线图，多条带置信带和最优前沿虚线（gpt-image-2）
slug: scaling-law-plot-figure
model: gpt-image-2
topics: [research-figure, research-data]
needsRefImage: false
aspectRatio: "16:9"
useCase: 做技术分享、科普文章或 PPT 时，需要一张"像论文里那样"的多曲线对比示意图，用来讲趋势；生成后当作视觉示意，真实数据仍应用绘图软件按数据画。
prompt: |
  生成一张横版 16:9 的论文风折线图：[训练损失随训练算力变化]，四条曲线对应[四种模型规模]。
  - 横轴"[训练算力（FLOPs）]"，对数刻度："1e20""1e21""1e22""1e23""1e24"；
  - 纵轴"[验证集损失（交叉熵）]"，线性刻度从上到下："3.5""3.0""2.5""2.0""1.5"；
  - 四条下降曲线，每条带浅色 ±1σ 阴影带，曲线末端旁边标注名称："[7000 万参数]"（石板灰）、"[10 亿参数]"（暗海军蓝）、"[100 亿参数]"（灰青色）、"[700 亿参数]"（柔和陶土红）；
  - 一条暖铜色斜向虚线，标注"[算力最优前沿]"，在与各曲线交叉的位置画空心圆点；右上角放图例框；
  - 总标题"[经验扩展规律：损失与训练算力]"，底部小字说明"四种规模，同一数据配比；阴影为 3 个随机种子的 ±1 标准差"。
  白底、衬线字体、细网格线，克制的学术配色，文字清晰，画幅[16:9]。
negativePrompt: null
source:
  repo: wuyoscar/GPT-Image2-Skill
  url: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/skills/gpt-image/references/gallery-research-paper-figures.md
  author: null
  license: MIT
  licenseUrl: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/LICENSE
  changes: 仓库整理的提示词，译成中文并拆成要点；图表主题、坐标轴名、曲线标签、前沿线名称、标题设为变量；补充了"仅作示意"的提醒和常见问题
images:
  - 3245-scaling-law-plot-figure-1.jpg
imageCredit:
  by: wuyoscar/GPT-Image2-Skill
  url: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/docs/research-paper-figures/scaling-curves.png
  license: MIT
verify:
  - 页面需明确提示"生成的曲线不对应真实数据，只能作视觉示意，正式图表请按数据绘制"
  - 示例图是英文版，中文版出一次检查坐标刻度是否仍正确
  - 页面署名需保留"Copyright (c) 2026 Wuyoscar, MIT License"及许可证链接
---
**怎么填变量**：图表主题和坐标轴可以整体换，比如"[训练损失随训练算力变化]"换成"用户留存率随时间变化"、横轴改"注册后天数"、四条曲线改成"[四个渠道]"；曲线标签换成"自然流量""广告投放"等。示例图是英文版：四条从左上往右下降的曲线，灰、蓝、青、橙红各带一层浅色阴影，一条橙色虚线斜穿过去标着"compute-optimal frontier"，交点处有空心圆，右上角是图例。

**常见问题与调整**：
- 刻度数字错位或重复：把刻度写成清单，并加"刻度等距排列，只出现列出的数字"。
- 曲线交叉乱：加"四条曲线互不相交，从上到下依次排列"。
- 想做暗色 PPT 版：改成"深色背景，曲线用高亮色，网格线极淡"。
- 需要真实数据图：用这张定风格，再用 Excel / Python 按同样配色画真实数据。

**适合**：技术分享和科普文章的趋势示意、PPT 配图；不适合当作真实实验结果或放进论文。

### 英文原版

```
Landscape 16:9 log-scaled plot of training loss vs compute, four curves for different model sizes.

X-axis "Training compute (FLOPs)" with log ticks "1e20", "1e21", "1e22", "1e23", "1e24". Y-axis "Validation loss (cross-entropy)" with linear decreasing ticks "3.5", "3.0", "2.5", "2.0", "1.5".

Four descending curves with ±1σ shaded bands, labels near tails:
"70M params" (slate gray), "1B params" (muted navy), "10B params" (dusty teal), "70B params" (soft terracotta).

Warm-copper dashed diagonal line labeled "compute-optimal frontier"; open circles at isoflop crossover points. Legend box top-right.

Title: "Empirical scaling laws: loss vs training compute". Subtitle: "four model sizes on a fixed data mixture; shaded bands = ±1 std over 3 seeds."
```

> 改编自 [wuyoscar/GPT-Image2-Skill](https://github.com/wuyoscar/GPT-Image2-Skill) 收录的提示词（仓库整理），许可证 MIT（Copyright (c) 2026 Wuyoscar）。
