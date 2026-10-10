---
title: matplotlib 中文乱码怎么解决提示词（中文显示方块、负号不显示、Linux 服务器无字体）+ 业务图表模板
slug: matplotlib-chinese-font-fix
model: any-llm
topics: [data-analysis, coding]
needsRefImage: false
useCase: 用 matplotlib 或 seaborn 画图时中文变成方块、负号显示异常，或者在 Linux 服务器、Docker、Jupyter 中换了环境又乱码时用：AI 按你的系统给出可靠的字体配置方法，并附一套适合周报汇报的业务图表模板（统一字体、配色、标注和导出设置）。
prompt: |
  你是一名熟悉 matplotlib 字体机制的数据分析师。请帮我解决中文显示问题，并给我一套业务图表模板。

  - 运行环境：[运行环境]（例：Windows 本地 Jupyter、macOS、Linux 服务器、Docker 容器）
  - matplotlib 版本：[matplotlib 版本]
  - 现在的代码与现象：
    [代码与现象]
  - 图表用途：[图表用途]（例：周报 PPT 中的趋势图和对比图）

  第一部分：解决乱码
  1. 原因：matplotlib 默认字体不包含中文字形；不同系统可用的中文字体名称不同。
  2. 先列出当前环境中可用的中文字体（给出检查代码），再根据结果设置字体，并按我的系统给出常见的可用字体名称作为候选。
  3. 两种设置方式及取舍：全局设置字体族；或者直接指定字体文件路径（更可靠，适合服务器和容器，也便于在项目中携带字体文件）。注意字体的授权，推荐可以免费商用的开源中文字体。
  4. 负号显示异常的处理。
  5. 改了配置仍然无效时：字体缓存需要清除或重建、Jupyter 内核需要重启。
  6. Linux 服务器与 Docker：安装开源中文字体的命令，或在镜像中复制字体文件。

  第二部分：业务图表模板
  写一个可复用的样式设置函数和两三个常用图表函数（折线趋势、分组柱形对比、横向条形排名），要求：
  - 统一字体与字号层级，标题直接写结论；
  - 配色：一个强调色加若干灰色，突出重点系列；
  - 去掉多余的边框和网格，数据标签只标关键值；
  - 坐标轴数字格式（千分位、百分比、万元单位）；
  - 导出：适合 PPT 的尺寸与分辨率，背景是否透明，保存为 PNG 和 SVG。

  代码加中文注释，可以直接运行。
negativePrompt: null
source: null
verify:
  - 在 Linux 容器中按输出步骤安装开源中文字体并运行模板，检查中文与负号是否正常显示
---
**怎么填变量**：[运行环境] 是最关键的信息：Windows、macOS 和 Linux 上可用的中文字体完全不同，服务器和 Docker 镜像中往往一个中文字体都没有。代码里报的字体警告也一起贴上，能帮助判断。

**常见坑**：
- 网上的教程直接写一个字体名，在你的电脑上可能根本没有这个字体，于是设置了也没用。先列出本机可用的字体再设置。
- 修改配置后还是乱码，很可能是字体缓存或者 Jupyter 内核没有重启。
- 设置中文字体后负号变成了方块，需要单独关闭「使用 Unicode 负号」的选项。

**追问技巧**：追问「把这个模板改成 seaborn 也能使用的主题」，或「把一组指标批量画成小多图，统一坐标轴范围」。科研论文的出版级图表可配合 313 号提示词。

### 示例输出

> 示例，仅供参考（节选）

```python
import matplotlib.pyplot as plt
from matplotlib import font_manager

# 1. 查看当前环境可用的中文字体
zh = sorted({f.name for f in font_manager.fontManager.ttflist
             if any(k in f.name for k in ("Hei", "Song", "Noto Sans CJK", "Source Han", "PingFang", "YaHei"))})
print(zh)

# 2. 最可靠的方式：直接加载项目中携带的字体文件（例如开源的思源黑体）
font_path = "fonts/SourceHanSansSC-Regular.otf"
font_manager.fontManager.addfont(font_path)
plt.rcParams["font.family"] = font_manager.FontProperties(fname=font_path).get_name()
plt.rcParams["axes.unicode_minus"] = False      # 负号正常显示

def biz_style():
    plt.rcParams.update({
        "figure.figsize": (10, 5.6), "figure.dpi": 150,
        "axes.spines.top": False, "axes.spines.right": False,
        "axes.titlesize": 16, "axes.titleweight": "bold",
    })
```
