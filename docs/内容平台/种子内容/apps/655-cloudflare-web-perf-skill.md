---
title: "web-perf skill 是什么、怎么安装使用：Cloudflare 官方的网页性能审计 Skill（Core Web Vitals、Lighthouse）"
slug: cloudflare-web-perf-skill
name: web-perf（cloudflare/skills）
url: https://github.com/cloudflare/skills/tree/main/skills/web-perf
pricing: "开源免费（Apache-2.0）；Cloudflare 资源按其套餐计费"
platforms: "Claude Code / Codex / Cursor / OpenCode / GitHub Copilot 等"
trialNote: "`/plugin marketplace add cloudflare/skills` 然后 `/plugin install cloudflare@cloudflare`"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, coding]
excerpt: "web-perf 是 Cloudflare 官方的网页性能 Skill：通过浏览器调试类 MCP 工具录制性能轨迹，分析 Core Web Vitals、网络请求和无障碍快照，再结合代码库检查打包与无用代码，给出优化建议。"
checkedOn: 2026-10-11
sources:
  - https://github.com/cloudflare/skills/tree/main/skills/web-perf
  - https://github.com/cloudflare/skills
  - https://skills.sh/
---

> 本文根据 cloudflare/skills 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。skills.sh 榜单当日显示该技能累计安装约 9.5 万次；所在仓库 cloudflare/skills 在 GitHub 约 3026 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

「网站有点慢」是最模糊的需求之一。web-perf 把它变成一个有步骤、有数据的审计。`description`：审计、诊断或优化网站的加载与交互性能、Core Web Vitals 和 Lighthouse 性能得分。它不局限于托管在 Cloudflare 上的网站。

技能开头照例提醒：模型对性能指标、阈值和工具接口的记忆可能过时，引用具体数字或建议时要优先检索，并列出 web.dev、Chrome DevTools 文档和 Lighthouse 评分说明作为来源。紧接着是一个硬性前提——**先确认可用的 MCP 工具**：它依赖浏览器调试类的 MCP 服务器来实际打开页面并采集数据，没有就无法测量。

流程分五个阶段：

1. **性能轨迹**：录制页面加载过程；
2. **Core Web Vitals 分析**；
3. **网络分析**：请求数量、体积、阻塞资源；
4. **无障碍快照**；
5. **代码库分析**：识别框架与打包工具，检查摇树与死代码、未使用的 JS / CSS、多余的 polyfill、压缩与最小化。

最后按规定的格式输出结论。

## 怎么安装

`web-perf` 随 cloudflare/skills 插件一起安装。Claude Code 里输入（命令来自仓库 README）：

```text
/plugin marketplace add cloudflare/skills
/plugin install cloudflare@cloudflare
```

Codex 用 `codex plugin marketplace add cloudflare/skills` 和 `codex plugin add cloudflare@cloudflare`。其他智能体用 `npx skills add https://github.com/cloudflare/skills`，在选择界面里勾选 `web-perf`。

仓库整体介绍和其他安装方式，详见本站《cloudflare/skills 是什么、怎么安装：Cloudflare 官方 Agent Skills（Workers、Agents SDK、Durable Objects、Wrangler）》。

## 怎么用

- 「审计 https://example.com 的首页性能，给出按影响排序的优化清单」。
- 「LCP 为什么这么高？定位到具体资源」。
- 「结合这个仓库的打包配置，看看有哪些无用代码可以去掉」。

这个技能只有一份 SKILL.md。

## 适合谁 / 局限

适合前端工程师和站点负责人做上线前检查或定期体检。它测到的是「实验室数据」——在你当前机器和网络下的一次加载，不等于真实用户的体验数据；没有安装浏览器调试类 MCP 服务器时只能做代码层面的静态分析。

## 注意事项

- **许可**：Apache-2.0。
- **需要额外的 MCP 服务器**（如 Chrome DevTools 的 MCP），按 SKILL.md 开头的检查步骤配置；它会启动浏览器访问你指定的网址。
- **只审计你有权测试的网站**；对线上站点的重复加载测试注意频率。
- 具体的指标阈值以 web.dev 当前文档为准，本文不转述数字。
