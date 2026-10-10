---
title: "shipping-and-launch skill 是什么、怎么安装使用：上线前检查清单、灰度放量阈值和回滚策略"
slug: addyosmani-shipping-and-launch-skill
name: shipping-and-launch（addyosmani/agent-skills）
url: https://github.com/addyosmani/agent-skills/tree/main/skills/shipping-and-launch
pricing: "开源免费（MIT）"
platforms: "Claude Code / Codex / Cursor / Gemini CLI / OpenCode / Copilot 等"
trialNote: "npx skills add addyosmani/agent-skills --skill shipping-and-launch"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, coding, ai-agent]
excerpt: "shipping-and-launch 是 addyosmani/agent-skills 里的发布技能：给出覆盖代码质量、安全、性能、无障碍、基础设施和文档的上线前清单，以及功能开关策略、分阶段放量的判断阈值、监控项和回滚方案。"
checkedOn: 2026-10-11
sources:
  - https://github.com/addyosmani/agent-skills/tree/main/skills/shipping-and-launch
  - https://github.com/addyosmani/agent-skills
  - https://github.com/vercel-labs/skills
---

> 本文根据 addyosmani/agent-skills 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。所在仓库 addyosmani/agent-skills 在 GitHub 约 10.4 万 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

「代码写完了」和「可以上线了」之间隔着一长串事情，独立开发者和小团队最容易在这里漏项。shipping-and-launch 把这串事情列成清单交给智能体。`description`：为生产发布做准备；在准备部署到生产环境、想知道上线前要具备什么、需要上线前检查清单、搭建监控、规划分阶段放量或需要回滚策略时使用。SKILL.md 的立场是：每次发布都应该可回退、可观测、渐进进行。

**上线前清单**分六类：

- 代码质量——测试全过、构建无警告、检查与类型校验通过、代码已评审、没有遗留的调试输出；
- 安全——代码和版本库里没有密钥、依赖审计没有高危漏洞、输入有校验、鉴权到位、安全响应头已配置、认证接口有限流、跨域只允许指定来源；
- 性能——核心网页指标达到「良好」、关键路径没有 N+1 查询、图片已优化；
- 无障碍；
- 基础设施；
- 文档。

**放量与回滚**是这个技能里最具体的部分。它给了一张判断表，按指标决定继续放量、暂停排查还是回滚：

- 错误率：与基线相差 10% 以内继续；高出 10% 到一倍暂停；超过基线两倍回滚。
- P95 延迟：高出 20% 以内继续；20% 到 50% 暂停；超过 50% 回滚。
- 前端脚本错误：没有新错误类型继续；新错误出现在超过千分之一的会话里就回滚。
- 业务指标：下降超过 5% 回滚。

另外列出应当立即回滚的情形：用户反馈激增、发现数据完整性问题、发现安全漏洞。其余章节讲功能开关策略、该监控什么、错误上报、上线后的验证、用错误预算作发布闸门，以及回滚方案本身。

## 怎么安装

仓库 README 给出了单独安装某个技能的写法：

```bash
npx skills add addyosmani/agent-skills --skill shipping-and-launch
```

想整套安装，Claude Code 用 `/plugin marketplace add addyosmani/agent-skills` 加 `/plugin install agent-skills@addy-agent-skills`，Codex 用 `codex plugin marketplace add addyosmani/agent-skills` 加 `codex plugin add agent-skills@agent-skills`。README 提示，插件安装遇到 SSH 权限报错时改用仓库的 HTTPS 地址。

仓库整体介绍和其他安装方式，详见本站《addyosmani/agent-skills 是什么、怎么安装：Addy Osmani 的 25 个生产级工程 Skills（/spec、/plan、/build）》。

## 怎么用

- 「这个版本准备周四上线，按 shipping-and-launch 过一遍检查清单，告诉我哪些还没满足」。
- 「给这次数据库迁移设计一个分阶段放量和回滚方案」。
- 整套安装后对应 `/ship` 命令。

让它逐项给出证据（跑了什么命令、结果如何），比只打勾可信。

## 适合谁 / 局限

适合没有专职运维和发布流程的小团队，拿它当上线前的最后一道自查。局限：清单偏 Web 应用，移动端、桌面端或数据类项目要自行增减；阈值是经验值，流量小的产品上统计波动很大，照搬容易误判；它只能检查代码仓库里看得到的东西，线上配置和监控是否真的生效需要你去确认。

## 注意事项

- **许可**：MIT。
- **不带脚本**：纯说明文字；执行检查时会运行项目自己的测试、构建和依赖审计命令。
- 是否允许智能体执行实际的部署命令，由团队的发布规范决定；这个技能本身只负责准备和核对。
