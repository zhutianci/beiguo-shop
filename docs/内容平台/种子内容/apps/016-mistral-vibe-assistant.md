---
title: "Le Chat（Mistral Vibe）是什么、怎么用：Mistral AI 助手上手指南"
slug: mistral-vibe-assistant
name: Mistral Vibe（原 Le Chat）
url: https://chat.mistral.ai/
pricing: 免费+付费
platforms: 网页 / iOS / 安卓 / 命令行 / VS Code 插件 / JetBrains 插件
trialNote: 免费版可在网页和手机使用，消息、联网搜索、编程会话和生图都有次数限制，可用 100 多个连接器
products: [ai-tools]
models: []
topics: [ai-agent, coding, office]
excerpt: "Le Chat 是 Mistral AI 的 AI 助手，2026 年改名为 Vibe，分 Work、Code、Chat 三种模式：能连接邮箱和办公软件做长任务，也能在命令行和 IDE 里写代码。本文讲清改名后的入口、功能和各档方案。"
checkedOn: 2026-10-07
sources:
  - https://help.mistral.ai/en/articles/682992-le-chat-is-now-vibe
  - https://mistral.ai/products/vibe/
  - https://mistral.ai/pricing/
  - https://apps.apple.com/us/app/vibe-by-mistral-ex-le-chat/id6740410176
  - https://mistral.ai/news/le-chat-mistral
  - https://the-decoder.com/mistral-rebrands-lechat-as-vibe-betting-its-chatbots-future-is-as-a-full-blown-work-agent/
---

> 本文根据 Mistral 官方帮助中心、Vibe 产品页、官方定价页和 App Store 页面整理，改名时间参考了媒体报道，资料核对于 2026-10-07。功能和价格变化快，以官网为准。

## 是什么

Le Chat 是 AI 公司 Mistral AI 的聊天助手，官方在 2024-02-26 发布。2026 年 5 月底，Mistral 把它改名为 **Vibe**，定位从聊天机器人升级为「面向专业办公和编程的统一智能体」。官方帮助中心说明：账号、方案、对话和保存的内容全部原样迁移，网址仍是 chat.mistral.ai，登录方式不变。App 在商店里的名字是「Vibe by Mistral (ex-Le Chat)」。

Vibe 使用 Mistral 自研的模型，编程部分由 Devstral 系列模型驱动。Mistral 主打「主权 AI」，企业可以选择私有部署和数据驻留，这是它和美国大厂最大的差异。

## 能做什么

Vibe 分三种模式：

- **Vibe Work**：原来 Le Chat 的办公模式升级版，把多步骤任务交给它，跨邮箱、聊天、日历和内部资料一次性汇总，比如「帮我准备下一场会议的简报」「总结未读邮件并起草回复」。
- **Vibe Code**：编程模式，有命令行工具、VS Code / JetBrains 插件和网页版，可在隔离的云端沙箱里并行跑远程编程任务，并把本地会话「传送」到远程继续。
- **Vibe Chat**：保留了原来一问一答的对话体验。

其他常用功能：

- **深度研究**：结合网页、内部文档和已连接工具，输出带来源的分析。
- **连接器**：官方称拥有面向企业的大型连接器目录，可连 Notion、Slack、Google Drive 等，也支持自定义 MCP 服务器。
- **Canvas 与项目**：在画布里写文档、做演示、写代码；用项目文件夹归档对话和资料。
- **定时任务、Skills、语音、生图**：定时自动运行提示或智能体；用技能包固化流程；录音转写总结；生成和编辑图片。

## 怎么上手

1. 打开 chat.mistral.ai，或在应用商店下载开发者为「MISTRAL AI」的 Vibe by Mistral。
2. 按页面提示注册登录（可选的登录方式以登录页为准）。
3. 可以直接用中文提问；界面语言选项以设置页为准。
4. 想让它处理工作，先在设置里连接邮箱、日历、云盘等，再在 Work 模式下布置任务。
5. 开发者按 docs.mistral.ai 的说明安装 Vibe CLI 或 IDE 插件，用同一账号登录。

可以这样开始：「读一下我 Google Drive 里《Q3 销售复盘》这份文档，列出三个最大的问题，并起草一封发给团队的邮件。」

## 免费与付费

按官方定价页（2026-10 查询）：

| 方案 | 主要区别 |
|---|---|
| Free | 网页和手机可用；消息、联网搜索、编程会话、生图有限；定时任务最多 5 个 |
| Pro | 更多消息与搜索、全天候编程、更多生图、聊天与邮件支持；在校学生可申请教育优惠价 14.99 美元/月 |
| Team | 每用户月付 24.99 美元，共享工作区、每人最多 30GB 存储、域名验证 |
| Enterprise | 私有部署、自定义模型和智能体、审计日志、SAML 单点登录 |

Pro 标准价格因地区和税费而异，以官网为准。

## 适合谁 / 不适合谁

**适合：**
- 关注数据驻留、希望私有部署的企业（官方提供数据驻留和私有部署选项）。
- 想要一个同时覆盖办公智能体和编程智能体的工具，并且常用 Notion、Slack、Google Workspace 的团队。
- 想尝试非美国厂商模型的开发者。

**不适合：**
- 主要做中文内容创作的用户，中文表现以实际使用为准。
- 依赖国内办公生态（微信、钉钉、飞书）的团队，连接器以海外应用为主。
- 只想找旧版 Le Chat 教程的人：很多入口名称已经变了。

## 注意事项

- **改名带来的混乱**：网上 2026 年 5 月以前的教程都叫 Le Chat，功能入口名称可能已变化；产品文档已迁移到 docs.mistral.ai。
- **地区**：中国区 App Store 可以搜到官方的 Vibe by Mistral 应用（2026-10 查询），但具体功能和订阅能否在你所在地区使用，以官方为准。
- **隐私**：数据治理、隐私和安全问题见 Mistral 帮助中心；团队和企业版有更严格的数据控制选项。
- **核对输出**：连接邮箱后生成的回复草稿要人工确认再发送，代码合并前要做评审。
