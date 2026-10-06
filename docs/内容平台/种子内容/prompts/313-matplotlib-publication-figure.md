---
title: matplotlib 出版级科研图表代码提示词（期刊尺寸、字体与导出规范）
slug: matplotlib-publication-figure
model: any-llm
topics: [research-figure, coding]
needsRefImage: false
useCase: 需要用 Python 画投稿级别的图时用：按期刊栏宽、字号、线宽设置 rcParams，生成矢量 PDF / 高分辨率 TIFF，配色色盲友好，代码可复用到所有图。
prompt: |
  【角色】你是一名科研数据可视化专家，精通 matplotlib，熟悉 Nature、Cell、IEEE 等期刊的图表格式要求，追求简洁、准确、信息密度高的图。

  【背景】
  - 数据结构：[数据结构说明]
  - 想表达的核心结论：[核心结论]
  - 图表类型：[图表类型]
  - 目标期刊图宽：[如单栏 89 mm]，高度不超过 [高度上限]
  - 字体与字号要求：[如 Arial 7 pt]
  - 导出格式：[PDF/SVG/TIFF 600 dpi]

  【任务】
  1. 写一个可复用的 set_pub_style() 函数，统一设置字体、字号、线宽、刻度方向、去掉上和右边框、矢量导出时保留可编辑文字。
  2. 用 mm 换算 figsize，画出指定图表；展示原始数据点（样本量小时尤其重要），误差线写明是 SD、SEM 还是 95% CI。
  3. 使用色盲友好配色（如 Okabe-Ito 或 viridis），同一变量在所有图中颜色一致。
  4. 坐标轴标签写全「变量名（单位）」，图例不遮挡数据，必要时直接在线旁标注代替图例。
  5. 导出为指定格式，并给出检查清单：字号是否达到期刊最小要求、线条在缩印后是否可见。

  【约束】
  - 只用 matplotlib 和 numpy、pandas，不引入冷门依赖。
  - 不做 3D 效果、阴影、渐变等装饰；不要截断柱状图的 y 轴。
  - 代码里用示例数据演示时，明确标注「示例数据，请替换」。

  【输出格式】
  完整 Python 代码块 → 可调参数说明表（参数 | 作用 | 建议值）→ 导出前检查清单。
negativePrompt: null
source:
  repo: f/awesome-chatgpt-prompts
  url: https://github.com/f/awesome-chatgpt-prompts
  author: null
  license: CC0 1.0
  licenseUrl: https://creativecommons.org/publicdomain/zero/1.0/
  changes: 参考其「Act as a Scientific Data Visualizer」条目的角色设定，重写为中文结构化模板，加入期刊尺寸、字号、配色与导出规范
verify:
  - 核对原条目链接（仓库已迁移到 prompts.chat，条目锚点可能变化）
  - 核对目标期刊当前的图宽要求（以期刊作者指南为准）
---
**怎么填变量**：图宽和字号以目标期刊的作者指南（Author Guidelines / Figure preparation）为准，常见写法是单栏、1.5 栏、双栏三种宽度。[数据结构说明] 可以直接贴 `df.head()`。

**追问技巧**：出图后描述问题，例如「图例挡住了第三组」「刻度太密」，让它改具体参数；多张图可以追问「把样式保存成 .mplstyle 文件」。

**适合模型**：通用大模型均可；带代码执行的模型可以直接生成预览。

> 图中数据必须来自你的真实分析；图片处理遵守期刊的图像完整性规定。

### 示例输出

> 示例，仅供参考

```python
import matplotlib.pyplot as plt
def set_pub_style():
    plt.rcParams.update({
        "font.family": "Arial", "font.size": 7,
        "axes.linewidth": 0.6, "axes.spines.top": False,
        "axes.spines.right": False, "pdf.fonttype": 42,
    })
set_pub_style()
fig, ax = plt.subplots(figsize=(89 / 25.4, 60 / 25.4))
```

`pdf.fonttype = 42` 让导出的 PDF 文字在 Illustrator 中仍可编辑。

> 改编自 [f/awesome-chatgpt-prompts](https://github.com/f/awesome-chatgpt-prompts)「Act as a Scientific Data Visualizer」，许可证 CC0 1.0。
