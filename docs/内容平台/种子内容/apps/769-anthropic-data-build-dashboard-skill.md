---
title: "build-dashboard skill 是什么、怎么安装使用：让 Claude 生成一个双击就能打开的 HTML 数据看板"
slug: anthropic-data-build-dashboard-skill
name: build-dashboard（anthropics/knowledge-work-plugins）
url: https://github.com/anthropics/knowledge-work-plugins/tree/main/data/skills/build-dashboard
pricing: "开源免费（Apache-2.0）"
platforms: "Claude Cowork / Claude Code"
trialNote: "`claude plugin marketplace add anthropics/knowledge-work-plugins` 然后 `claude plugin install data@knowledge-work-plugins`"
products: [claude]
models: [claude-llm]
topics: [agent-skills, data-analysis, office]
excerpt: "build-dashboard 是 Anthropic 开源的 data 插件里的技能：把查询结果、粘贴的数据或 CSV 做成单个自包含的 HTML 交互看板，包含指标卡、图表、筛选器和明细表，图表用 Chart.js，数据以 JSON 内嵌，无需服务器。"
checkedOn: 2026-10-11
sources:
  - https://github.com/anthropics/knowledge-work-plugins/tree/main/data/skills/build-dashboard
  - https://github.com/anthropics/knowledge-work-plugins
  - https://claude.com/plugins/
---

> 本文根据 anthropics/knowledge-work-plugins 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。所在仓库 anthropics/knowledge-work-plugins 在 GitHub 约 2.9 万 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

想给老板或团队看一组数据，搭 BI 工具太重，截图贴表格又太糙。build-dashboard 走中间路线：让 Claude 直接写出一个 HTML 文件，浏览器打开就是带筛选的交互看板。`description`：构建带图表、筛选器和表格的交互式 HTML 看板；在做带指标卡的管理层概览、把查询结果变成可分享的自包含报告、做团队监控快照，或需要在一个可用浏览器打开的文件里放多张带筛选的图表时使用。SKILL.md 强调成品不需要服务器，也不需要安装依赖。

**工作流**：

1. **弄清需求**：用途（管理层概览、运营监控、深入分析、团队汇报）、受众、最重要的指标、要按哪些维度筛选、数据从哪来。
2. **准备数据**：连接了数据仓库就查询后把结果内嵌进 HTML；数据是粘贴或上传的，就先解析清洗再内嵌；只有描述没有数据时，生成一份符合结构的示例数据，并在看板上注明是示例，同时说明如何换成真实数据。
3. **设计布局**：顶部二到四张指标卡放关键数字，中间一到三张图表展示趋势和构成，底部可选一张明细表，筛选器视复杂度放在页头或侧栏。
4. **生成 HTML**：单个自包含文件。
5. **实现各类图表**：统一使用 Chart.js，各种图表类型有对应的写法。

这份 SKILL.md 有两万五千多字符，后面相当篇幅在讲性能：数据量大时先做**预聚合**，以及图表和页面元素的性能注意点；最后是示例和提示。

## 怎么安装

`build-dashboard` 属于 anthropics/knowledge-work-plugins 的 `data` 插件，随插件一起安装。Claude Code 里（命令来自仓库 README）：

```bash
claude plugin marketplace add anthropics/knowledge-work-plugins
claude plugin install data@knowledge-work-plugins
```

Claude Cowork 用户在 claude.com/plugins 页面安装同名插件。装好后技能会在相关场景自动触发，也可以用斜杠命令 `/data:build-dashboard` 手动调用。

仓库整体介绍和其他安装方式，详见本站《knowledge-work-plugins 是什么、怎么安装：Anthropic 开源的 11 个岗位插件（销售 / 法务 / 财务 / 数据）》。

## 怎么用

- 「/build-dashboard 用这份 CSV 做一个销售概览，按地区和月份筛选」。
- 「把刚才那条查询的结果做成看板，顶部放收入、订单数、客单价三张卡」。
- 「先用示例数据做一版让我看布局，结构是：日期、渠道、花费、转化数」。

## 适合谁 / 局限

适合数据分析师、运营和需要快速出一版可交互汇报材料的人。局限：数据是内嵌的静态快照，不会自动刷新，要更新就重新生成；数据量很大时文件会变重，所以技能要求先聚合；它是一次性产物，替代不了需要权限管理和定时更新的正式 BI 系统。

## 注意事项

- **许可**：Apache-2.0。
- **图表库从公共 CDN 加载**：生成的页面引用 jsDelivr 上的 Chart.js，打开时需要能访问该 CDN；内网或离线环境要让它改成本地引用。
- **数据明文写在文件里**：把 HTML 发给别人等于把底层数据一起发出去，分享前确认里面没有不该外传的明细。
- 用示例数据生成的看板会带标注，替换成真实数据后记得去掉并核对数字。
