---
title: "Web Quality Skills 是什么、怎么安装使用：Addy Osmani 的网页质量 Skills（Lighthouse、Core Web Vitals、无障碍、SEO）"
slug: web-quality-skills-addyosmani
name: Web Quality Skills（addyosmani/web-quality-skills）
url: https://github.com/addyosmani/web-quality-skills
pricing: "开源免费（MIT）"
platforms: "Claude Code / Codex / Gemini CLI / Cursor 等支持 Agent Skills 的智能体"
trialNote: "npx skills add addyosmani/web-quality-skills"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, coding, product-design]
excerpt: "Web Quality Skills 是 Addy Osmani 开源的 6 个 Agent Skills：以测量为先，结合 Lighthouse、Chrome DevTools、真实用户数据和 WCAG 2.2，帮智能体审计并优化网页的性能、核心网页指标、无障碍、SEO 和最佳实践。"
checkedOn: 2026-10-11
sources:
  - https://github.com/addyosmani/web-quality-skills
  - https://skills.sh/
  - https://github.com/ChromeDevTools/chrome-devtools-mcp
  - https://web.dev/articles/vitals
---

> 本文根据 addyosmani/web-quality-skills 仓库 README 整理，资料核对于 2026-10-11。截至当日，GitHub 显示该仓库约 2922 Star、254 Fork，最近一次推送在 2026-08-24；skills.sh 榜单上其中的 accessibility 技能累计安装约 6.0 万次。README 自述为非官方项目。

## 是什么

Addy Osmani 是在 Google 工作多年的知名工程师和技术作者，长期写网页性能方面的内容；站内已收录他的另一个工程流程技能库 addyosmani/agent-skills。Web Quality Skills 是他单独开的一个小库，README 的定位是：一组（非官方的）以测量为先的 Agent Skills，用 Google Lighthouse、面向智能体的 Chrome DevTools、Core Web Vitals、WCAG 和搜索指南来优化网页项目，不限框架——React、Vue、Angular、Svelte、Next.js、Nuxt、Astro 或纯 HTML 都适用。

README 用一句话区分了它和界面规范类技能：界面规范告诉你**做什么**，这组技能告诉你怎么把它做得快、可访问、对搜索引擎友好。

## 包含哪些 Skill

共 6 个：

- `web-quality-audit`：以证据为依据的综合评审，覆盖 Lighthouse 的各个类别和源码层面；
- `performance`：实地数据加实验室测量、性能追踪，以及加载和运行时的修复；
- `core-web-vitals`：针对 LCP、INP、CLS 的测量、诊断与优化；
- `accessibility`：WCAG 合规、读屏器支持、键盘导航；
- `seo`：可抓取性、结构化数据等搜索优化；
- `best-practices`：安全、现代接口和代码质量模式。

它的**测量模型**把四种证据分得很清楚：CrUX 的实地数据（真实 Chrome 用户近期的体验）、站点自己的真实用户监控、DevTools 追踪或 Lighthouse 的实验室运行（一次受控的浏览器会话里发生了什么、为什么）、静态源码检查（页面跑不起来时可能有什么问题）。

阈值参考里列了核心网页指标的标准：LCP 不超过 2.5 秒、INP 不超过 200 毫秒、CLS 不超过 0.1 算「良好」，并注明这是按真实用户数据的第 75 百分位评估的，不是对单次实验室运行的要求。

## 怎么安装

README 的命令：

```bash
npx skills add addyosmani/web-quality-skills
```

Claude Code 也可以用插件：`/plugin marketplace add addyosmani/web-quality-skills` 后 `/plugin install web-quality-skills@addy-web-quality-skills`，技能会带上命名空间（如 `/web-quality-skills:performance`）。Codex 用 `codex plugin marketplace add addyosmani/web-quality-skills`，Gemini CLI 用 `gemini extensions install https://github.com/addyosmani/web-quality-skills`。

**可选的 Chrome DevTools 集成**：智能体接了 Chrome DevTools MCP 时，技能会优先用它做性能追踪和 Lighthouse 审计，读取渲染后的无障碍快照、控制台消息和网络请求。没接也能用，会退回到 Lighthouse 命令行、PageSpeed Insights 与 CrUX 工具、手动检查和静态分析。

## 怎么用

README 给的触发说法：

- 「审计我的网站」「检查网页质量」——`web-quality-audit`；
- 「改善核心网页指标」「修 LCP」「降低 CLS」——`core-web-vitals`；
- 「做一次 WCAG 审计」——`accessibility`；
- 「优化 SEO」「修一下 meta 标签」——`seo`。

## 适合谁 / 不适合谁

**适合：**
- 前端开发者在上线前做性能和无障碍自查；
- 想让智能体「先测量、再动手」而不是凭印象优化的团队。

**不适合：**
- 非网页项目；
- 想要营销层面的 SEO 策略（关键词、内容规划）的人，它的 `seo` 技能偏技术侧。

## 注意事项

- **许可**：MIT。README 标明是非官方项目，不代表 Google。
- **实地数据的前提**：CrUX 只收录流量达到一定规模的站点，小站可能查不到，只能依赖实验室数据。
- **会运行审计工具并访问你指定的网址**；接入 DevTools MCP 后，智能体可以读取页面的网络请求和控制台内容，注意不要在带敏感登录态的浏览器里对线上后台做审计。
- 实验室分数会随机器和网络波动，以多次运行和真实用户数据为准。
