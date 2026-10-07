---
title: "Dia 浏览器官网与下载：Arc 团队做的 AI 工作浏览器（含 Windows 版）"
slug: dia-ai-browser
name: Dia
url: https://www.diabrowser.com/
pricing: 浏览器免费 / AI 功能付费（新用户 14 天试用）
platforms: macOS / Windows
trialNote: 新用户有 14 天 Better Days 免费试用，无需绑卡；试用结束不付费则 AI 功能暂停，浏览器可继续免费使用
products: [ai-tools]
models: []
topics: [office, ai-agent]
excerpt: Dia 是 Arc 浏览器团队 The Browser Company 推出的 AI 浏览器，主打「更好的工作日」：每天早上的 Morning Brief、跨 Slack / Notion / 日历的上下文问答、自动生成报告和幻灯片。浏览器免费，AI 功能按档付费。
checkedOn: 2026-10-07
sources:
  - https://www.diabrowser.com/
  - https://www.diabrowser.com/plans
  - https://www.diabrowser.com/security
  - https://www.diabrowser.com/changelog
  - https://www.atlassian.com/blog/announcements/atlassian-acquires-the-browser-company
---

> 本文根据 Dia 官网、定价页、安全页、更新日志以及 Atlassian 官方博客整理，资料核对于 2026-10-07。功能和价格变化快，以官网为准。

## 是什么

Dia 由纽约的 The Browser Company 开发，这家公司此前做过以设计著称的 Arc 浏览器。2025 年 9 月，办公软件公司 Atlassian（Jira、Confluence 的母公司）宣布收购 The Browser Company，计划把 Dia 打造成面向知识工作者的浏览器。目前 Dia 官网页脚仍署名 The Browser Company of New York。

Dia 基于 Chromium 内核，官网标语是「不只是浏览器，是更好的工作日」。和其他 AI 浏览器相比，它更偏向**办公场景**：重点不是帮你逛网页，而是把散落在 Slack、Notion、Teams、Google 套件、GitHub 等工具里的信息串起来回答问题、生成材料。

macOS 版持续更新（2026 年 10 月 1 日发布 1.51.0）；Windows 版 2026 年 10 月 6 日发布 1.0 正式版。

## 能做什么

- **Morning Brief 晨报**：一早汇总当天的日程、收件箱重点和关键链接。
- **跨工具问答**：直接问 Dia，它会结合你连接的 Slack、Notion、Teams、Loom 等工具和打开的标签页作答。
- **生成报告与幻灯片（Decks）**：把分散的上下文整理成可分享的报告或演示文稿。
- **会议准备**：会议开始前自动打开议程、笔记和相关文档，并有倒计时提醒。
- **Profiles 与 Splits**：工作、兼职、个人生活分开不同配置；左右分屏同时看会议和文档，并记住布局。
- **整理标签页**：自动给相关标签分组命名，内置广告和跟踪拦截。

## 怎么上手

1. 打开 diabrowser.com，点击「Download Dia for free」下载 macOS 或 Windows 版并安装。
2. 首次启动按引导设置，从 Arc 迁移过来的用户会看到熟悉的标签切换方式。
3. 在设置里连接你常用的工作工具（如日历、Slack、Notion），这样问答才能用上你的上下文。
4. 第二天早上查看 Morning Brief，或直接在地址栏 / 聊天里提问。
5. 示例输入：「根据我这周的 Slack 讨论和打开的这几份文档，写一份给经理的周报，控制在 300 字以内。」

## 免费与付费

官网定价页（2026-10 查询）列出三档：

| 方案 | 价格 | 主要内容 |
| --- | --- | --- |
| Better Browser | 免费 | 纯浏览器功能：配置文件、标签组、分屏、广告与跟踪拦截、跨设备同步，不含 AI |
| Better Answers | 以官网结账页为准 | 在任意页面向 Dia 提问、结合各工具上下文聊天、使用不保存数据的模型 |
| Better Days | 100 美元 / 月 | 用量为 Better Answers 的 6 倍，含晨报、报告和幻灯片生成、会议准备与跟进 |

用量按「Task」计算，月度额度不结转，可按 20 美元一档加购。官方说明付费计划从 8 月 17 日起先面向新的 Mac 用户推出，老用户在收费前至少提前 30 天邮件通知；Windows 用户暂不受影响。

## 适合谁 / 不适合谁

**适合：**

- 每天在 Slack、Notion、Teams、Google 文档之间来回切换的产品经理、项目经理和团队负责人；
- 从 Arc 迁移过来、喜欢它交互方式的用户；
- 需要频繁写周报、会议纪要和汇报材料的知识工作者。

**不适合：**

- 主要使用飞书、钉钉、企业微信等国内办公工具的团队，官方列出的集成以海外工具为主；
- 只想要免费 AI 助手的人：AI 功能试用结束后需要付费；
- 需要手机端浏览器的用户，官网目前只提供 macOS 和 Windows 版。

## 注意事项

- **数据去向**：官方安全页说明，对话、历史、书签和文件默认加密保存在本地；使用 AI 时，请求和相关上下文会经由其服务器发给 AI 合作方，合作方按合同不得保留或用于训练；同步功能为端到端加密。
- 连接工作账号前，先确认公司是否允许第三方浏览器读取内部系统数据；团队可考虑带 SSO 和管理后台的 Dia for Work。
- AI 生成的周报、报告要自己核对事实和措辞再发出。
- 定价页上 Better Answers 一档的价格标注存在不一致，订阅前以实际结账页面显示为准。
