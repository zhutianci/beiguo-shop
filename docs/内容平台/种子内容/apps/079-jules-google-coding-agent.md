---
title: "Jules 是什么：Google 异步编程智能体怎么用、免费每天几次"
slug: jules-google-coding-agent
name: Jules
url: https://jules.google/
pricing: 免费+Google AI Pro / Ultra 提额
platforms: 网页 / 命令行（Jules Tools）/ API / GitHub 集成
trialNote: 免费档每天 15 个任务、同时最多 3 个并发任务
products: [gemini]
models: []
topics: [coding]
excerpt: "Jules 是 Google Labs 推出的异步编程智能体：连上 GitHub 仓库后，在云端虚拟机里修 bug、写测试、升级依赖，做完提 PR 给你审。"
checkedOn: 2026-10-07
sources:
  - https://jules.google/
  - https://jules.google/docs/usage-limits/
  - https://jules.google/docs/changelog/
  - https://blog.google/technology/google-labs/jules-now-available/
  - https://developers.googleblog.com/en/meet-jules-tools-a-command-line-companion-for-googles-async-coding-agent/
---

> 本文根据 Jules 官网、官方文档（用量限制、更新日志）、Google 官方博客与 Google 开发者博客整理，资料核对于 2026-10-07。功能和价格变化快，以官网为准。

## 是什么

Jules 是 **Google**（Google Labs 团队）推出的**异步**编程智能体。2025 年 8 月 6 日结束公测正式上线，由 Gemini 模型驱动。

「异步」是它和编辑器里的 AI 助手最大的不同：你不需要盯着它写代码。把任务交给 Jules 后，它会把你的 GitHub 仓库克隆到 **云端虚拟机**，自己制定计划、修改代码、运行测试，完成后给出改动对比并创建 Pull Request，你回来审阅合并即可。这期间你可以关掉页面去做别的事。

它和 Google Antigravity 定位不同：Antigravity 是在本地电脑上管理智能体的开发平台，Jules 则完全在云端、围绕 GitHub 仓库工作。

## 能做什么

- **修 bug 和小功能**：描述问题或贴报错，它定位原因、改代码、跑测试，最后提 PR。
- **写测试、升级依赖**：适合「给这个模块补单元测试」「把依赖升到新版本并修好兼容问题」这类耗时但明确的活。
- **从 GitHub Issue 接活**：给 Issue 打上 `jules` 标签，就能把任务派给它。
- **自动修 CI 失败**：官方 2026 年 2 月加入了自动修复 CI 失败的能力，并可设置提交作者归属。
- **定时任务**：可设置周期性任务，并随时编辑、暂停、恢复。
- **计划审查**：执行前先给出计划，你可以修改或批准；官方还加入了「Planning Critic」自动检查计划质量。
- **命令行与 API**：Jules Tools 让你在终端里派发和查看任务；REST API 可把 Jules 接进自己的工作流。官方还支持接入 Linear、Supabase、Neon 等 MCP 服务。

## 怎么上手

1. 打开 jules.google，用个人 Google 账号（目前为 @gmail.com 账号）登录。
2. 按提示连接 GitHub，选择授权 Jules 访问的仓库。
3. 在任务框里选择仓库和分支，用英文或中文写清任务目标和验收标准。
4. 等它给出计划，确认无误后批准执行；执行中可以随时补充说明。
5. 任务完成后查看 Diff，满意就让它创建 PR，在 GitHub 上审阅合并。

可以这样开始：「给 utils/date.ts 里的所有函数补充单元测试，覆盖闰年和时区边界情况，测试框架用项目里现有的 Vitest。」

## 免费与付费

官方用量限制页列出三档（官网定价页，2026-10 查询）：

| 档位 | 每日任务数 | 并发任务数 |
|---|---|---|
| Jules（免费） | 15 | 3 |
| Jules in Pro | 100 | 15 |
| Jules in Ultra | 300 | 60 |

升级方式是订阅 **Google AI Pro** 或 **Google AI Ultra**，订阅价格以 Google One 官网为准。付费档可以优先或更多地使用更强的 Gemini Pro 模型；官方更新日志显示 2026 年 1 月起免费档基础模型换成了 Gemini 3 Flash，2026 年 3 月 Pro 档用户可用 Gemini 3.1 Pro。

## 适合谁 / 不适合谁

适合：
- 代码托管在 GitHub、有一堆「明确但繁琐」任务积压的开发者。
- 想让 AI 在后台干活、自己只负责审 PR 的人。
- 维护开源项目、需要批量处理小 Issue 的维护者。

不适合：
- 代码不在 GitHub 上的团队，目前以 GitHub 集成为主。
- Workspace / 企业账号用户：官方说明目前只支持个人 Google 账号。
- 需要实时交互、边写边调的场景，用编辑器内的 AI 助手更合适。

## 注意事项

- **年龄与账号**：官方要求年满 18 岁，并使用个人 Google 账号。
- **仓库权限**：Jules 需要读写你授权的 GitHub 仓库，只授权需要的仓库，私有仓库注意公司政策。
- **一定要审 PR**：云端测试通过不代表没问题，合并前仔细看改动，尤其是依赖升级和配置变更。
- **地区可用性**：以官网和 Google 官方说明为准。
