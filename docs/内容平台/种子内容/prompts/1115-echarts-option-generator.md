---
title: ECharts 配置项生成提示词（option 写法：折线柱状组合、提示框格式化、图例、数据缩放、自适应与深色主题）
slug: echarts-option-generator
model: any-llm
topics: [data-analysis, coding]
needsRefImage: false
useCase: 做数据大屏、后台报表或网页图表要写 ECharts 配置，却记不住那么多配置项，或者提示框格式、双 Y 轴、数据缩放、窗口缩放自适应调不好时用：给出数据和想要的效果，AI 生成完整可运行的 option，逐项注释，并给出在 Vue 或 React 中正确初始化与销毁的写法。
prompt: |
  你是一名精通 ECharts 的前端可视化工程师。请根据我的数据和需求生成图表配置。

  - ECharts 版本：[ECharts 版本]（例：5.x）
  - 数据样例（JSON 或表格，几条即可）：
    [数据样例]
  - 想要的图表：[想要的图表]（例：按月的销售额柱状图 + 同比增长率折线，双 Y 轴）
  - 交互需求：[交互需求]（例：提示框显示金额与百分比、可以拖动缩放时间范围、点击柱子跳转详情）
  - 使用场景与主题：[使用场景]（例：深色数据大屏、后台白色页面）
  - 前端框架：[前端框架]（例：Vue 3、React、原生 HTML）

  要求：
  1. 用数据集（dataset）组织数据，或说明为什么这里直接写在系列中更合适。
  2. 完整的 option，每个配置项加中文注释：标题、图例、提示框、坐标轴（双 Y 轴时两个轴的刻度对齐与单位）、系列、数据缩放、颜色。
  3. 提示框格式化：用格式化函数显示千分位金额、百分比、单位，并处理空值。
  4. 数据量大时的性能设置（如采样、大数据量模式、关闭动画）。
  5. 自适应：窗口或容器尺寸变化时重新调整图表大小（建议监听容器尺寸变化，而不只是窗口变化）。
  6. 框架集成：在我的框架中正确初始化、更新数据、在组件卸载时销毁实例，避免内存泄漏和重复初始化。
  7. 点击等事件的绑定方式。
  8. 可访问性与可读性：颜色区分度、是否需要在图上直接标注数值。

  配置项名称以 ECharts 官方文档为准，你不确定的配置项要注明「请以官方配置手册为准」。
negativePrompt: null
source: null
verify:
  - 把生成的 option 粘贴到 ECharts 官方示例编辑器运行，检查双 Y 轴、提示框格式化与数据缩放是否正常
---
**怎么填变量**：[数据样例] 给几条真实结构的数据即可，AI 会据此决定用数据集还是直接写数组。[想要的图表] 写清楚哪个指标用什么图形、放在哪个坐标轴上。[前端框架] 决定了初始化和销毁的写法，单页应用中忘记销毁实例是常见的内存问题。

**常见坑**：
- 双 Y 轴两边的刻度线数量不一致，网格线看起来错乱。需要分别设置两个轴的刻度分段，或者隐藏其中一侧的分隔线。
- 只监听窗口大小变化，图表放在可以折叠的侧边栏或标签页里，容器尺寸变了图表却不跟着变。
- 在单页应用中每次进入页面都重新初始化图表、离开时不销毁，切换几次后页面越来越卡。

**追问技巧**：追问「把这个图表封装成通用组件，只需要传入数据和配置差异」，或「数据每 5 秒更新一次，怎么只更新数据而不重绘整个图表」。

### 示例输出

> 示例，仅供参考（节选）

```js
const option = {
  dataset: { source: [
    ['月份', '销售额', '同比'],
    ['1月', 1200000, 0.18], ['2月', 1280000, 0.15], ['3月', 1330000, 0.11],
  ] },
  tooltip: {
    trigger: 'axis',
    formatter: (params) => params.map((p) => {
      const v = p.value[p.encode.y[0]]
      const text = p.seriesName === '同比' ? `${(v * 100).toFixed(1)}%` : `${(v / 10000).toLocaleString()} 万元`
      return `${p.marker}${p.seriesName}：${v == null ? '—' : text}`
    }).join('<br/>'),
  },
  legend: { top: 0 },
  xAxis: { type: 'category' },
  yAxis: [
    { type: 'value', name: '万元', axisLabel: { formatter: (v) => v / 10000 } },
    { type: 'value', name: '同比', axisLabel: { formatter: (v) => `${v * 100}%` }, splitLine: { show: false } },
  ],
  series: [
    { type: 'bar', name: '销售额', encode: { x: '月份', y: '销售额' } },
    { type: 'line', name: '同比', yAxisIndex: 1, encode: { x: '月份', y: '同比' } },
  ],
}

// 自适应：监听容器尺寸变化
const chart = echarts.init(el)
chart.setOption(option)
const ro = new ResizeObserver(() => chart.resize())
ro.observe(el)
// 组件卸载时：ro.disconnect(); chart.dispose()
```
