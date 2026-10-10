---
title: "Kiro 是什么、哪个公司的：AWS 规格驱动 AI IDE 上手指南"
slug: kiro-aws-ai-ide
name: Kiro
url: https://kiro.dev/
pricing: 免费+付费
platforms: Windows / macOS / Linux / 命令行 / 网页 / 移动端
trialNote: 免费档每月 50 个 credits，可用开放权重模型和部分 Claude 模型（有速率限制）
products: [ai-tools]
models: []
topics: [coding]
excerpt: "Kiro 是 AWS 推出的智能体开发平台，主打「先写规格再写代码」，有 IDE、CLI、网页版和移动端，适合想让 AI 按需求文档规范开发的程序员。"
checkedOn: 2026-10-07
sources:
  - https://kiro.dev/
  - https://kiro.dev/pricing/
  - https://kiro.dev/docs/
  - https://kiro.dev/faq/
  - https://kiro.dev/blog/one-year/
---

> 本文根据 Kiro 官网、官方定价页、官方文档与 FAQ、官方博客整理，资料核对于 2026-10-07。功能和价格变化快，以官网为准。

## 是什么

Kiro 是 **AWS（亚马逊云科技）** 开发和运营的 AI 编程平台。2025 年 7 月以 IDE 形式开启公开预览，2025 年 11 月正式发布（GA），之后陆续推出命令行（Kiro CLI）、网页版（Kiro Web）、移动端和 Kiro Crew。官方现在的定位是「智能体工程平台」：不只是在编辑器里补全代码，而是让 AI 智能体按规格文档完成整块功能。

它最有辨识度的做法是 **规格驱动开发（Spec）**：先把一句需求拆成需求、设计、任务三份文档，确认后再让智能体逐项实现。模型方面支持 Claude、GPT、DeepSeek、Qwen 等，默认「Auto」模式会按任务难度、速度和成本自动选模型。

## 能做什么

- **Spec 规格开发**：把需求生成 `requirements.md`（需求与验收标准）、`design.md`（架构设计）、`tasks.md`（任务清单），再按任务逐项写代码，过程可追溯。
- **Hooks 自动化**：在保存文件、调用工具、完成任务等时机自动触发动作，比如自动补测试、更新文档。
- **Steering 项目规范**：把团队的代码风格、技术栈约定写进 `.kiro/` 目录，智能体在 IDE、CLI、网页版里都会遵守。
- **MCP 与 Powers**：通过 MCP 接入外部工具和 API；Powers 是按需加载的专项能力包，官方称已有 100 多个合作方 Powers。
- **多入口协作**：IDE 适合日常写代码；CLI 在终端里跑智能体；Kiro Web 在云端隔离沙箱里执行任务；手机端可查看云端会话进度。
- **自主/监督两种模式**：Autopilot 让智能体连续执行，Supervised 每一步都等你确认。

## 怎么上手

1. 打开官网 kiro.dev，下载对应系统的 IDE（可导入 VS Code 的设置和主题），或按文档安装 CLI。
2. 用 GitHub、Google 账号或 AWS Builder ID 登录，**不需要 AWS 云账号**；企业用户可用 IAM Identity Center。
3. 打开一个项目文件夹，先在聊天里让它读懂项目，例如问「这个仓库的目录结构和启动方式是什么」。
4. 做新功能时选择 Spec 模式，描述需求，逐份审阅它生成的需求、设计和任务文档，确认后再让它执行任务。
5. 把常用规范写成 Steering 文件，重复性的检查配置成 Hooks。

可以这样开始：「给这个 Express 项目加一个用户注册接口，要求邮箱唯一、密码加密存储，并补上单元测试。先出 Spec，不要直接改代码。」

## 免费与付费

Kiro 按 credits（额度点数）计费，不同模型、不同任务消耗不同。官网定价页列出的档位（按月计费，付费档为每人每月价格，官网定价页，2026-10 查询）：

| 档位 | 价格 | 每月 credits |
|---|---|---|
| Free | 0 | 50 |
| Pro | 20 美元/月 | 1,000 |
| Pro+ | 40 美元/月 | 2,000 |
| Pro Max | 100 美元/月 | 5,000 |
| Power | 200 美元/月 | 10,000 |

付费档可加购额度（官网标注每个 credit 0.04 美元，加购包 12 个月有效）。另有企业版（集中计费、SSO、用量分析）和 GovCloud 版本，价格以官网为准。

## 适合谁 / 不适合谁

适合：
- 做中大型功能、希望 AI 先把需求和设计讲清楚再动手的开发者。
- 团队想把编码规范、测试要求固化下来，让 AI 每次都遵守。
- 已在用 AWS 生态、需要企业级权限与合规的公司。

不适合：
- 只想要轻量补全、不想维护规格文档的人，流程会显得偏重。
- 对用量敏感的个人用户：复杂任务消耗 credits 较快，需要留意余额。
- 不熟悉英文界面的新手，文档和界面以英文为主。

## 注意事项

- **数据使用**：官方 FAQ 写明，免费档以及通过社交登录 / AWS Builder ID 使用的订阅用户，部分内容（提问、输入、生成的代码）可能被用于改进服务，可在设置里关闭「Content Collection for Service Improvement」；企业用户的内容不会用于改进服务。
- **地区与付款**：付费方案按账单地址开放，官方 FAQ 列有不支持的国家和地区，购买前请先核对。
- **核对生成代码**：Autopilot 模式下智能体会连续修改文件和执行命令，重要项目建议先用 Supervised 模式，并在 Git 里分支操作、逐个审阅改动。
