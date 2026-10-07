---
title: "Bolt.new 是什么、怎么用：在浏览器里对话生成网站和应用"
slug: bolt-new-ai-app-builder
name: Bolt.new
url: https://bolt.new/
pricing: 免费+付费
platforms: 网页
trialNote: 免费版每天 30 万 token、每月 100 万 token，可建公开和私有项目、托管网站（带 Bolt 标识）
products: [ai-tools]
models: []
topics: [coding, product-design, ai-agent]
excerpt: "Bolt.new 是 StackBlitz 推出的 AI 网站与应用生成器，整个开发环境跑在浏览器里，对话即可生成、预览、部署网站和全栈应用，自带托管、数据库和用户登录，适合不写代码的创业者、产品经理和营销人员。"
checkedOn: 2026-10-07
sources:
  - https://bolt.new/
  - https://bolt.new/pricing
  - https://support.bolt.new/account-and-subscription/bolt-forge
  - https://bolt.new/blog/bolt-v2
---

> 本文根据 Bolt.new 官网、定价页、官方帮助中心和官方博客整理，资料核对于 2026-10-07。功能和价格变化快，以官网为准。

## 是什么

Bolt.new（官网也常简称 Bolt）是 StackBlitz 公司推出的 AI 网站与应用生成器。StackBlitz 以“在浏览器里运行完整 Node.js 环境”的 WebContainers 技术出名，Bolt 正是建立在这项技术上：你不用安装任何东西，打开网页、用对话描述需求，Bolt 就在浏览器里写代码、装依赖、运行并实时预览。

Bolt 现在主打“编程智能体 + 一体化后端”：提供 Standard（所有用户）和 Max（Pro 用户）两种 Bolt Agent，由 Bolt 在后台按任务自动选择模型（官方博客提到 Claude Sonnet、Opus 等模型在 Bolt 中上线）；配套的 Bolt Cloud 提供托管、数据库、用户认证、SEO 和自定义域名。2026 年 9 月 14 日至 10 月 14 日，还有一个基于开源模型（GLM、Kimi、DeepSeek 等）的 Bolt Forge 智能体作为研究预览开放。

**和同类的区别**：Bolt 的特色是“浏览器内真实运行环境 + 自带后端”，并且能从 Figma 设计稿、GitHub 仓库或幻灯片模板起步；v0 更偏前端和 Vercel 部署，Lovable 偏向零代码完整产品与团队协作，Replit 则是更完整的云端 IDE。

## 能做什么

- **对话生成网站、应用和原型**：首页可直接选择 Website、App、Prototype、Slides 等类型开始。
- **从设计稿或代码库起步**：导入 Figma 设计或 GitHub 仓库，在已有基础上继续开发。
- **Plan 模式**：先让 Bolt 出方案，再点 Build now 开始构建，减少返工。
- **自动测试与修复**：官方称 Bolt 会自动测试、重构和迭代，减少报错；大项目的上下文管理也更稳。
- **一体化托管与数据库**：自带网站托管、不限数量的数据库、用户管理与认证、访问分析和自定义域名（自定义域名需 Pro）。
- **团队与设计系统**：团队版可共享项目、按包配置设计系统提示，支持私有 NPM 源。

## 怎么上手

1. 打开 bolt.new，点击 Get Started 注册账号。
2. 在首页输入框描述你要做的东西，或选择 Website / App / Prototype 等类型、导入 Figma / GitHub、套用模板。
3. 不确定怎么做时先用 Plan 模式，让 Bolt 列出页面和功能清单，确认后再构建。
4. 在右侧预览中检查效果，有问题直接用文字描述，让 Bolt 修改。
5. 完成后一键发布到 Bolt 托管；付费版可绑定自己的域名。

可以这样开始：

```text
做一个小型健身房会员预约应用：会员注册登录后可以看本周课程表并预约，管理员后台可以增删课程、查看预约名单。界面简洁，适配手机。
```

## 免费与付费

官网定价页（2026-10 查询，按月付价格；按年付最多可省约 28%）：

| 档位 | 价格 | 主要内容 |
| --- | --- | --- |
| Free | 0 | 每天 30 万 token、每月 100 万 token，网站带 Bolt 标识，10MB 上传上限，最多约 33.3 万次网页请求 |
| Pro | 25 美元/月起 | 无每日 token 上限，每月 1000 万 token 起，去除 Bolt 标识、自定义域名、SEO 增强，未用完的 token 可顺延一个月 |
| Teams | 30 美元/人/月 | Pro 全部内容，加集中计费、团队权限管理、私有 NPM 源 |
| Enterprise | 定制 | SSO、审计日志、专属客户经理与 7×24 支持等 |

团队版每个付费成员单独获得 token 额度，成员之间不共享。

## 适合谁 / 不适合谁

**适合：**
- 想几小时内做出可演示原型的产品经理、创业者；
- 需要快速上线活动页、落地页并自带托管和 SEO 的营销人员；
- 想“边做边学”的学生和编程新手。

**不适合：**
- 需要原生手机 App 或桌面软件的项目；
- 大型、长期维护的复杂系统——项目越大，每条消息同步的上下文越多，token 消耗越快；
- 习惯在本地 IDE 精细控制每一行代码的资深工程师（可考虑 Cursor、Claude Code 等）。

## 注意事项

- **token 消耗**：官方 FAQ 说明，大部分 token 用于把项目文件同步给 AI，项目越大每条消息越贵；可以先用 Plan 模式想清楚再动手。
- **顺延规则**：付费 token 只顺延一个月，且需要保持订阅才能使用顺延的 token。
- **研究预览**：Bolt Forge 是限时研究预览，结束后是否保留以官方公告为准。
- **上线前把关**：AI 生成的登录、支付、数据库权限等代码要仔细检查，避免数据泄露；同时阅读官网的服务条款与可接受使用政策。
