---
title: ggplot2 期刊级绘图提示词：自定义主题、配色与 patchwork 多图拼版
slug: ggplot2-publication-theme
model: any-llm
topics: [research-figure, coding]
needsRefImage: false
useCase: 用 R 画论文图时用：一次写好可复用的期刊主题函数、统一配色和字号，用 patchwork 拼成带 A/B/C 标号的组图，并按毫米尺寸导出。
prompt: |
  【角色】你是一名精通 ggplot2、patchwork、scales 和 ggrepel 的 R 可视化专家，熟悉学术期刊对图表的格式要求。

  【背景】
  - 要画的子图：[子图清单与类型]
  - 数据框与列名：[数据框与列名]
  - 拼版方式：[如 2 行 2 列，A 跨两列]
  - 成图尺寸：[宽 × 高，单位 mm]
  - 字体与字号：[字体与字号]（如需中文，说明是否用 showtext）
  - 导出格式：[PDF/TIFF/PNG 及 dpi]

  【任务】
  1. 写一个 theme_pub() 主题函数：白底、无网格或仅浅色主网格、统一字号、坐标轴线宽、图例位置。
  2. 定义统一的色板（离散变量用色盲友好色板，连续变量用 viridis 系列），同一分组在所有子图颜色一致。
  3. 分别写出各子图代码，标签用 labs() 写清变量名与单位。
  4. 用 patchwork 拼版，plot_annotation(tag_levels = "A") 自动加标号，合并重复图例。
  5. 用 ggsave() 按毫米导出，说明 cairo_pdf 或 ragg 设备在字体嵌入上的作用。

  【约束】
  - 不使用已弃用的参数（如 size 用于线宽时改用 linewidth）。
  - 不加 3D、渐变背景等装饰；柱状图 y 轴从 0 开始。
  - 示例数据要标注「请替换为你的数据」。

  【输出格式】
  R 代码块（主题函数 → 色板 → 各子图 → 拼版 → 导出）→ 参数调整说明表。
negativePrompt: null
source: null
verify:
  - 在 ggplot2 3.5 及以上版本运行，确认 linewidth 与 patchwork 标号正常
---
**怎么填变量**：[子图清单与类型] 写成「A：各组体重折线图；B：终点体重箱线图；C：体重与摄食量散点图」，AI 会为每个子图单独写代码再拼版。

**追问技巧**：拼版后常见问题是各子图坐标轴对不齐、图例重复，直接描述现象让它调整；中文论文追问「用 showtext 加载宋体并保证 PDF 嵌入」。

**适合模型**：通用大模型均可。

> 图中数据必须来自你的真实分析结果。

### 示例输出

> 示例，仅供参考

```r
theme_pub <- function(base_size = 7) {
  theme_classic(base_size = base_size) +
    theme(axis.line = element_line(linewidth = 0.3),
          legend.position = "top",
          plot.tag = element_text(face = "bold"))
}
(p1 | p2) / p3 + plot_annotation(tag_levels = "A")
ggsave("fig1.pdf", width = 183, height = 120, units = "mm", device = cairo_pdf)
```
