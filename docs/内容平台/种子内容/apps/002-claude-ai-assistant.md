---
title: "Claude 是什么、怎么用：Anthropic 的 AI 助手上手指南（免费版与 Pro 区别）"
slug: claude-ai-assistant
name: Claude
url: https://claude.ai/
pricing: 免费+付费
platforms: 网页 / iOS / 安卓 / Windows / macOS / 浏览器插件
trialNote: 免费版可在网页、桌面和手机聊天，支持联网搜索、记忆、Artifacts，最多 5 个项目，可用 Sonnet、Haiku 系列；Claude Code 和 Claude Design / Slides / Docs 需要 Pro 起
products: [claude]
models: [claude-llm]
topics: [copywriting, coding, office]
excerpt: "Claude 是 Anthropic 的 AI 助手，以长文写作、读长文档和编程见长，Pro 起包含 Claude Code 和文档、幻灯片、设计工具。本文讲清入口、免费版能做什么、Pro 与 Max 的区别。"
checkedOn: 2026-10-07
sources:
  - https://claude.com/pricing
  - https://claude.com/blog/cowork-is-now-claude
  - https://claude.com/download
  - https://www.anthropic.com/supported-countries
  - https://apps.apple.com/us/app/claude-by-anthropic/id6473753684
---

> 本文根据 Claude 官网定价页、Anthropic 官方博客、支持地区页面和 App Store 页面整理，资料核对于 2026-10-07。功能和价格变化快，以官网为准。

## 是什么

Claude 是 AI 公司 Anthropic 推出的 AI 助手，网页入口是 claude.ai，另有 iOS / 安卓 App 和 Windows / macOS 桌面 App。它使用 Anthropic 自研的 Claude 系列模型，官网目前列出的系列有 Mythos、Fable、Opus、Sonnet、Haiku，免费版可用 Sonnet 和 Haiku，Pro 起可用 Opus。

2026-09-16 起，原来单独的「Cowork」工作模式与普通聊天合并为一个 Claude：同一个对话里它会判断任务需要什么，直接写文档、做幻灯片或做设计，先向 Pro / Max 推送，其他方案随后。

## 能做什么

- **长文写作与改稿**：Claude 的文字风格偏自然克制，适合写方案、邮件、文章，也擅长按你的要求反复修改语气和结构。
- **读长文档**：上下文最长可到约 100 万 token（视模型而定），一次塞进整份合同、财报或论文让它总结、对比、找漏洞。
- **Artifacts 与文件**：在对话旁边生成可预览的网页、图表、小工具，也能运行代码处理表格并生成文件。
- **Claude Design / Slides / Docs**（Pro 起）：在对话里直接产出设计稿、演示文稿和文档。
- **Claude Code**（Pro 起）：编程智能体，能读懂整个代码库、改文件、跑命令，可在终端、IDE、桌面 App 和网页使用。
- **项目、记忆、Skills、连接器**：把资料放进项目长期复用；装技能包或连接常用应用，让它按你的流程干活。
- **Claude in Chrome 与 Microsoft 365**（Pro 起）：在浏览器和 Office 里直接调用 Claude。

## 怎么上手

1. 打开 claude.ai，或从 claude.com/download 下载桌面 App；手机端在应用商店搜索「Claude by Anthropic」。
2. 按页面提示注册账号并完成验证（可选的登录方式以登录页为准）。
3. 直接用中文提问即可，Claude 会用中文回答；界面语言能否切换为中文，以设置页提供的选项为准。
4. 有一批固定资料（产品手册、写作规范）就新建一个「项目」，把文件和说明放进去，之后在项目里提问。
5. 写代码的话，安装 Claude Code 后在项目目录运行 `claude`，用同一个账号登录（需 Pro 或以上）。

可以这样开始：「附件是我们公司的报销制度，请整理成一页 FAQ，最后列出制度里表述模糊、容易引起争议的 3 处。」

## 免费与付费

按官网定价页（2026-10 查询）：

| 方案 | 价格（美元） | 主要区别 |
|---|---|---|
| Free | 0 | 网页、桌面、手机聊天；联网搜索、记忆、Artifacts、连接器；最多 5 个项目 |
| Pro | 月付 20；年付 200（折合每月约 17） | 用量更多；Claude Code、Claude Design / Slides / Docs、Research、更多模型（含 Opus）、定时任务 |
| Max | 月付 100 起 | 可选 Pro 的 5 倍或 20 倍用量，输出上限更高，高峰期优先 |
| Team / Enterprise | 按席位 | 团队管理、单点登录、默认不用内容训练模型 |

在本站开通 Pro 可前往 [/chongzhi/claude-pro](/chongzhi/claude-pro)。

## 适合谁 / 不适合谁

**适合：**
- 以写作、编辑为主业的人：文案、公关、编辑、研究助理。
- 经常处理长 PDF、合同、技术文档，需要准确总结和对比的人。
- 开发者：Pro 起包含 Claude Code，可在终端、IDE 和桌面 App 里让它读代码库、改文件、跑命令。

**不适合：**
- 需要大量生成图片、视频的用户：Claude 本身不主打生图生视频。
- 只想轻度聊天、不愿意付费的人：免费版额度相对紧，高峰时更明显。
- 身处官方不支持地区、无法正常注册的用户。

## 注意事项

- **地区**：Anthropic 官方支持地区列表不包括中国大陆、香港和澳门。中国区 App Store 搜到的「Claude 中文版」类应用不是 Anthropic 出品。
- **用量限制**：官网注明各方案都有用量限制，长对话、大文件、更强的模型通常消耗更快，具体额度以账号里的提示为准。
- **隐私**：官网定价页标明个人方案的模型训练为「可选择退出」，可在隐私设置里关闭；Team / Enterprise 默认不用你的内容训练。
- **核对输出**：Claude 也会出错，事实、数据、代码运行结果都要自己验证。
