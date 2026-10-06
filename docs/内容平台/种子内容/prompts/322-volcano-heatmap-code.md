---
title: 火山图与热图绘制代码提示词（差异表达分析 R / Python）
slug: volcano-heatmap-code
model: any-llm
topics: [research-figure, research-data, coding]
needsRefImage: false
useCase: 做完转录组、蛋白组差异分析后，用它生成火山图（标注关键基因）和聚类热图（行 z-score、分组注释）的完整代码。
prompt: |
  【角色】你是一名生物信息学可视化工程师，熟悉 R（ggplot2、ggrepel、pheatmap、ComplexHeatmap）和 Python（matplotlib、seaborn）。

  【背景】
  - 差异分析结果表：[文件名]，列名包括 [结果表的列名]
  - 差异分析工具：[DESeq2/edgeR/limma 等]
  - 阈值：|log2FC| ≥ [log2FC 阈值]，校正 p 值 < [显著性阈值]
  - 需要标注的基因：[基因名单或前 N 个]
  - 热图数据：[标准化表达矩阵文件]，样本分组信息：[分组文件或说明]
  - 语言：[R/Python]

  【任务】
  1. 火山图：按上调、下调、不显著三类着色，画阈值虚线，用 ggrepel 或 adjustText 标注指定基因并避免重叠，图中显示上调和下调基因数量。
  2. 热图：取差异基因或指定基因，按行做 z-score 标准化，行列层次聚类（说明距离和聚类方法），顶部加样本分组注释条。
  3. 配色：火山图避免红绿搭配；热图用蓝—白—红等发散色板，中点设为 0。
  4. 按期刊尺寸导出 PDF 和 600 dpi TIFF。
  5. 给出图注模板，写明阈值、校正方法和标准化方式。

  【约束】
  - 显著性判断使用校正后的 p 值（如 padj 或 FDR），不要用原始 p 值。
  - 处理 p 值为 0 导致 -log10 无穷大的情况。
  - 代码中的示例数据要标注「请替换」。

  【输出格式】
  火山图代码 → 热图代码 → 参数说明表 → 图注模板。
negativePrompt: null
source: null
verify:
  - 用 Bioconductor 的 airway 示例数据跑 DESeq2 后实际运行，检查标注是否重叠
---
**怎么填变量**：[结果表的列名] 直接复制结果表的表头，例如 DESeq2 默认是 log2FoldChange、pvalue、padj。阈值以你方法部分写的为准，前后必须一致。

**追问技巧**：热图样本太多时追问「只显示分组注释、隐藏样本名」；基因标注太挤时，追问「只标 |log2FC| 最大的前 10 个」。

**适合模型**：通用大模型均可。

> 阈值应在分析前确定并在方法中报告，不要反复调整阈值直到「结果好看」。

### 示例输出

> 示例，仅供参考（R）

```r
res$group <- with(res, ifelse(padj < 0.05 & log2FoldChange >= 1, "Up",
                  ifelse(padj < 0.05 & log2FoldChange <= -1, "Down", "NS")))
ggplot(res, aes(log2FoldChange, -log10(padj), colour = group)) +
  geom_point(size = 0.8) +
  geom_vline(xintercept = c(-1, 1), linetype = "dashed") +
  geom_hline(yintercept = -log10(0.05), linetype = "dashed") +
  scale_colour_manual(values = c(Up = "#D55E00", Down = "#0072B2", NS = "grey70"))
```
