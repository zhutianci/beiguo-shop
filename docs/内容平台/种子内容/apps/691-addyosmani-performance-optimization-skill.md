---
title: "performance-optimization skill 是什么、怎么安装使用：Addy Osmani 的「先测量再优化」性能 Skill"
slug: addyosmani-performance-optimization-skill
name: performance-optimization（addyosmani/agent-skills）
url: https://github.com/addyosmani/agent-skills/tree/main/skills/performance-optimization
pricing: "开源免费（MIT）"
platforms: "Claude Code / Codex / Cursor / Gemini CLI / OpenCode / Copilot 等"
trialNote: "npx skills add addyosmani/agent-skills --skill performance-optimization"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, coding]
excerpt: "performance-optimization 是 addyosmani/agent-skills 里的性能优化技能：覆盖前端、后端、查询与数据库，强制按「测量 → 找瓶颈 → 修复 → 验证后保留或回退 → 防止回归」五步走，不凭感觉优化。"
checkedOn: 2026-10-11
sources:
  - https://github.com/addyosmani/agent-skills/tree/main/skills/performance-optimization
  - https://github.com/addyosmani/agent-skills
  - https://github.com/vercel-labs/skills
---

> 本文根据 addyosmani/agent-skills 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。所在仓库 addyosmani/agent-skills 在 GitHub 约 10.4 万 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

让智能体「优化一下性能」，它会热情地到处加缓存和记忆化，代码更复杂了，快没快却没人知道。performance-optimization 的第一句话就是纠正这个习惯：**先测量再优化**。没有测量的性能工作是猜测，而猜测会带来过早优化——增加复杂度，却没有改善真正重要的东西。先做剖析，找到真实的瓶颈，修复它，再测一次；只优化测量证明有必要的部分。

`description`：跨前端、后端、查询和数据库优化应用性能；存在性能要求时、怀疑出现性能退化时、需要改善 Core Web Vitals 或加载时间时、需要修复 N+1 查询时，或剖析显示存在瓶颈时使用。

工作流五步：

1. **测量**：从哪里开始测，前端和后端各用什么手段；
2. **找出瓶颈**；
3. **修复瓶颈**；
4. **验证**：再测一次，有改善就保留，没有就**回退**；
5. **防止回归**：加上性能预算或监控，避免以后又慢回去。

技能里有一节列出 Core Web Vitals 的目标值。具体的优化手法放在参考文件 `optimization-patterns.md` 里，按需读取。

## 怎么安装

仓库 README 给出了单独安装某个技能的写法：

```bash
npx skills add addyosmani/agent-skills --skill performance-optimization
```

想整套安装，Claude Code 用 `/plugin marketplace add addyosmani/agent-skills` 加 `/plugin install agent-skills@addy-agent-skills`，Codex 用 `codex plugin marketplace add addyosmani/agent-skills` 加 `codex plugin add agent-skills@agent-skills`。README 提示，插件安装遇到 SSH 权限报错时改用仓库的 HTTPS 地址。

仓库整体介绍和其他安装方式，详见本站《addyosmani/agent-skills 是什么、怎么安装：Addy Osmani 的 25 个生产级工程 Skills（/spec、/plan、/build）》。

## 怎么用

- 「列表接口响应要两秒，先测量找出瓶颈，再动手」。
- 「首页的 LCP 不达标，分析原因并给出修复方案」。
- 「这个页面查询数据库 80 多次，是不是 N+1？修掉并证明确实变快了」。

## 适合谁 / 局限

适合手上有明确性能问题或性能指标要求的前后端开发者。它依赖你有可用的测量手段——浏览器性能面板、剖析工具、查询日志，没有这些它也只能推测；框架专属的优化细节，不如对应框架的官方技能（例如 Vercel 的 React 最佳实践）来得具体。

## 注意事项

- **许可**：MIT。
- **会执行测量命令**：跑基准、剖析或压测时注意不要对着生产环境。
- 指标的目标值以 web.dev 等官方文档的当前版本为准。
