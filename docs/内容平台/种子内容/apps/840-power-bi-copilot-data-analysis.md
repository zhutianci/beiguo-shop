---
title: "Power BI Copilot 是什么、怎么用、需要什么许可证：用对话分析数据和生成报表"
slug: power-bi-copilot-data-analysis
name: Copilot for Power BI
url: https://learn.microsoft.com/en-us/power-bi/create-reports/copilot-introduction
pricing: 需付费的 Fabric 容量（F2 及以上）或 Power BI Premium（P1 及以上）
platforms: Power BI Desktop / Power BI 服务（网页）/ Power BI 移动端
trialNote: 试用容量和免费 SKU 不支持 Copilot
products: [ai-tools]
models: []
topics: [data-analysis, office]
excerpt: "Copilot for Power BI 把生成式 AI 放进 Power BI：业务用户可以用对话向报表和语义模型提问、生成摘要，报表作者可以让它创建报表页、写 DAX 查询，需要付费的 Fabric 或 Premium 容量。"
checkedOn: 2026-10-11
sources:
  - https://learn.microsoft.com/en-us/power-bi/create-reports/copilot-introduction
---

> 本文根据 Microsoft Learn 上的 Copilot for Power BI 概览文档整理（文档更新日期 2026-08），资料核对于 2026-10-11。各功能的预览 / 正式状态变化较快，以官方文档为准。

## 是什么

Copilot for Power BI 是微软在 Power BI 里提供的生成式 AI 能力。官方文档的说法是：它提供基于对话的体验，从业务用户的即席分析，到高级创作者的 DAX 表达式生成，都可以交给 Copilot 协助。它适用于 Power BI Desktop 和 Power BI 服务。

## 能做什么

文档按三类用户介绍。

**业务用户：和数据对话**

- **报表里的 Copilot 窗格**（已正式发布）：在报表右侧提问，针对当前打开的报表回答问题、总结要点；订阅报表时也可以附带摘要。
- **独立的 Copilot 体验**（预览）：从左侧导航进入的全屏界面，可以在你有权访问的所有报表和语义模型里查找内容并提问，而不局限于当前报表。
- **应用内的 Copilot**（预览）：范围限定在某个 Power BI 应用的内容之内，并支持应用作者预先准备的「已验证答案」。

**报表作者**

- 创建和编辑报表页；
- 汇总底层语义模型；
- 在报表上添加叙述性的摘要视觉对象；
- 编写 DAX 查询；
- 为语义模型的度量值添加说明。

**语义模型作者**

- 网页建模中的 Copilot（预览）：找出结构不清、命名不一致等问题，给出最佳实践建议，并协助修改度量值、表、列和关系。

## 怎么上手

文档列出的前提条件：

1. **容量**：付费的 Fabric 容量（F2 或更高）或 Power BI Premium（P1 或更高）。文档明确说明，只有 Power BI Pro 或 Premium Per User 许可证是不够的，试用容量和免费 SKU 也不支持。
2. **管理员设置**：租户管理员需要开启「用户可以使用 Copilot 及其他由 Azure OpenAI 提供支持的功能」这一设置（默认开启，但管理员可能关闭）。
3. **区域**：Fabric 容量需位于受支持的区域；主权云不支持。
4. **准备数据**：文档建议模型所有者先为 AI 准备好语义模型，否则 Copilot 可能误解数据、给出泛泛或不准确的结果。

满足条件后，在报表右侧打开 Copilot 窗格即可提问。找不到 Copilot 时，按官方「Enable Fabric Copilot for Power BI」一文排查。

## 免费与付费

Copilot 不单独标价，而是消耗所在容量的计算资源：文档说明用量以容量单位（CU）计量，由 token 消耗驱动计费，管理员可以在 Fabric Capacity Metrics 应用里查看最近 30 天的 Copilot 用量。Copilot 触发的后续操作（如 DAX 查询、数据刷新）按各自的常规方式另行计费。容量本身的价格以微软官网为准。

## 适合谁 / 不适合谁

**适合：** 已经在 Fabric 或 Premium 容量上运行 Power BI 的企业；经常被业务同事追问「这个数为什么变了」的数据团队；需要快速起草报表页和 DAX 的报表开发者。

**不适合：** 只有 Pro 许可证的个人和小团队；使用主权云或不受支持区域的组织；语义模型命名混乱、缺少说明的环境——先整理模型再用。

## 注意事项

- 文档写明，目前不正式支持英文以外的提问语言，其他语言偶尔能得到相关回答但不保证。
- 每条提示最多 10,000 个字符。
- 对未变化的模型在 24 小时内重复同一提问，会直接返回缓存结果。
- 新购或扩容后，Copilot 最长可能需要 24 小时才能识别并可用。
