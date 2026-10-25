---
title: AI 编程工具怎么选：Codex、Claude Code、Cursor、Antigravity CLI（原 Gemini CLI）按订阅和额度来源对比
slug: ai-coding-tools-codex-claude-code-cursor-gemini
products: [ai-tools, codex]
models: []
accountTier: OTHER
excerpt: AI 编程工具怎么选？按官方说明对比 Codex、Claude Code、Cursor 和 Antigravity CLI：额度分别来自 ChatGPT、Claude、X 订阅和 Google AI 套餐，起步价约 8 到 20 美元每月；Gemini CLI 个人账号路径已停止（2026-10 查询）。
checkedOn: 2026-10-25
sources:
  - https://chatgpt.com/pricing
  - https://developers.openai.com/codex/cli
  - https://claude.com/pricing
  - https://code.claude.com/docs/en/overview
  - https://cursor.com/docs/models-and-pricing
  - https://gemini.google/subscriptions/
  - https://antigravity.google/product/antigravity-cli
  - https://developers.googleblog.com/an-important-update-transitioning-gemini-cli-to-antigravity-cli
verify:
  - 本文从「额度从哪来、怎么付费、怎么装」的角度对比，不比较代码质量或速度；各家官方没有可比的评测口径，本文不下谁更强的结论
  - 起步价取自各家官方定价页的个人订阅月费（美元，不含税，2026-10-25）：ChatGPT Plus 20、Claude Pro 20（年付折合 17）、Cursor 所属的 X 订阅 Plus 8、Google AI Pro 19.99；各家用量口径不同，不能直接比较
  - Codex 官方 CLI 页给的安装方式有安装脚本、npm 和 Homebrew；官方没有在该页写 Codex 在 ChatGPT 各套餐的具体次数，ChatGPT 定价页只写 Plus「扩展的 Codex 用量」、Pro「更长的 Codex 会话」、Free「有限的 Codex 访问」
  - Claude Code 官方概览页写：多数形态需要 Claude 订阅或 Anthropic Console 账号；设置了 ANTHROPIC_API_KEY 并在提示时批准，就跳过登录；桌面 App 需要付费订阅
  - Cursor 的计划与模型取自 cursor.com/docs/models-and-pricing：Plus 起含 Cursor 自家模型（Grok 4.7、4.6、4.5、Composer 2.5），第三方模型从 Premium 起按 API 标价从预付余额扣；Cursor 官方文档站还列有云端智能体、Bugbot 等
  - Gemini CLI 现状取自 Google 开发者博客（2026-05-19）与 Gemini CLI 文档页顶提示：2026-06-18 起个人 Google 账号（免费、AI Pro、Ultra）不再服务，官方建议用 Antigravity CLI；企业许可与付费 API Key 的访问不变；本文没有实际运行 Antigravity CLI
  - 本站 550 号文章已按形态、账号、计费和规则文件对比 Cursor、Claude Code、Codex、GitHub Copilot（2026-10-11），本文补充 2026-10 的订阅变化和 Google 一侧的工具
---

> 本文按官方定价页和文档整理，资料核对于 2026-10-25，价格为「2026-10 查询」。**只比订阅、额度来源和上手方式，不比代码质量**。详细的功能对比见 [/guides/cursor-vs-claude-code-vs-codex](/guides/cursor-vs-claude-code-vs-codex)。图为本站整理的示意图。

## 适用于谁

- 搜「ai编程工具怎么选」「codex claude code cursor gemini cli 哪个好」的人；
- 已经订阅了某家会员，想知道能不能顺带用上它的编程工具的人；
- 想知道 Gemini CLI 现在的状态的人。

## 结论先说

1. **最省事的看法：谁的会员你已经有。** Codex 随 ChatGPT 套餐提供；Claude Code 随 Claude Pro 和 Max 提供；Cursor 现在属于 The X Subscription（Plus 起含 Cursor 和 Grok 模型）；Antigravity CLI 用 Google AI 套餐的限额。
2. **起步价都在每月 8 到 20 美元**：Cursor（X 订阅 Plus）8；Claude Pro 20（年付折合 17）；ChatGPT Plus 20；Google AI Pro 19.99。高用量档都在 100 美元上下。
3. **Gemini CLI 已不是个人账号的官方路径**：官方博客说 2026-06-18 起，个人 Google 账号（免费、AI Pro、Ultra）的 Gemini CLI 不再服务，建议用 Antigravity CLI；企业许可和付费 API Key 的访问不变。详见 [/guides/gemini-cli-how-to-use-antigravity-cli](/guides/gemini-cli-how-to-use-antigravity-cli)。
4. **都能用自己的 API 吗：因产品而异**。Claude Code 官方写可以用 Anthropic Console 账号或 API Key；Cursor 的第三方模型按 API 标价扣预付余额；Codex 可配置自定义模型提供方，见 [/guides/grok-codex-cursor-setup](/guides/grok-codex-cursor-setup) 和 [/guides/deepseek-codex-setup](/guides/deepseek-codex-setup)。
5. **需要会员可以看**：ChatGPT Plus [/chongzhi/chatgpt-plus](/chongzhi/chatgpt-plus)；Claude Pro [/chongzhi/claude-pro](/chongzhi/claude-pro)，Claude Code 重度使用 [/chongzhi/claude-max](/chongzhi/claude-max)；Grok 订阅（含 Cursor）[/chongzhi/grok-super](/chongzhi/grok-super)；Google 系 [/chongzhi/google-zhanghao](/chongzhi/google-zhanghao)。

![四款 AI 编程工具的额度来源对比](seed:g1095-ai-coding-tools-compare.png)
*图：本站根据各家官方定价页与文档整理的示意图，美元每月，用量口径不同不可直接比较*

## 一、四款工具各自的情况

### Codex（OpenAI）

- **形态**：官方 CLI 页写的是在终端里检查代码、改文件、运行命令；官方文档还有其他入口，见 [/guides/codex-getting-started](/guides/codex-getting-started)；
- **安装**：macOS 和 Linux 用安装脚本（`curl -fsSL https://chatgpt.com/codex/install.sh | sh`），也可用 `npm install -g @openai/codex` 或 Homebrew；第一次运行 `codex`，选择 Sign in with ChatGPT 或其他可用登录方式；
- **额度**：ChatGPT 官方定价页，Free 有「有限的 Codex 访问」，Plus 有「扩展的 Codex 用量」，Pro 有「更长的 Codex 会话」；具体次数见 [/guides/codex-usage-limits](/guides/codex-usage-limits)。

### Claude Code（Anthropic）

- **形态**：官方概览页说它可在终端、IDE（VS Code、JetBrains）、桌面 App 和浏览器里使用，各形态共用同一个引擎，CLAUDE.md、设置和 MCP 服务器通用；
- **安装**：官方推荐原生安装，也可用 Homebrew、WinGet 等；首次使用会提示登录；
- **额度**：官方定价页写 Claude Code 随 Pro 和 Max 提供，免费版不含；多数形态需要 Claude 订阅或 Anthropic Console 账号，桌面 App 需要付费订阅。Pro、Max 还是 API 见 [/guides/claude-code-pro-max-or-api](/guides/claude-code-pro-max-or-api)。

### Cursor

- **形态**：编辑器，官方文档站还有 Agent、云端智能体、Bugbot、命令行等；
- **订阅**：Cursor 现在出售的是 The X Subscription 的一部分：Plus 8 美元、Premium 30、Super 100、Ultra 200；Plus 起包含 Cursor 自家模型（Grok 4.7、4.6、4.5 和 Composer 2.5）；
- **第三方模型**：不含在订阅里，Premium 起可按 API 标价从预付余额里扣，见 [/guides/grok-codex-cursor-setup](/guides/grok-codex-cursor-setup)；套餐与额度细节见 [/guides/cursor-usage-limits-plans](/guides/cursor-usage-limits-plans)。

### Antigravity CLI（Google，替代 Gemini CLI）

- **形态**：终端优先，官方称它是调用、监控和操作 Antigravity 智能体最轻量的方式，支持子智能体并行；
- **安装**：官方下载页给的命令，macOS / Linux：`curl -fsSL https://antigravity.google/cli/install.sh | bash`；Windows PowerShell：`irm https://antigravity.google/cli/install.ps1 | iex`；
- **额度**：官方订阅页写 Google AI Pro 有「入门级」的 Antigravity 限额，Ultra 是 5 倍或 20 倍限额；订阅差别见 [/guides/gemini-ultra-vs-pro-difference](/guides/gemini-ultra-vs-pro-difference)。

## 二、按你的情况挑

![按你的情况挑编程工具](seed:g1095-ai-coding-tools-decide.png)
*图：本站根据各家官方文档整理的示意图*

| 你的情况 | 可以先看 |
| --- | --- |
| 已经订阅 ChatGPT | Codex，随套餐提供，先用满再考虑升档 |
| 已经订阅 Claude Pro 或 Max | Claude Code，随订阅提供 |
| 习惯在编辑器里写代码 | Cursor，订阅里自带 Grok 等模型 |
| 已有 Google AI Pro 或 Ultra | Antigravity CLI；不要再按旧教程装 Gemini CLI |
| 想对比各家功能细节 | [/guides/cursor-vs-claude-code-vs-codex](/guides/cursor-vs-claude-code-vs-codex) |

## 三、选择时要留意

- **额度口径不同**：ChatGPT、Claude 官方只写「扩展」「更多」；Cursor 是共享周用量池；Google 是倍数限额。没有统一的次数可比；
- **订阅和 API 是两回事**：想按 token 付费要看各家 API 价格，见 [/guides/llm-api-price-comparison-official](/guides/llm-api-price-comparison-official)；
- **官方产品变化快**：Gemini CLI 的变化就是例子，装之前先看官方文档页顶的提示；
- **项目规则文件通用性**：AGENTS.md、CLAUDE.md 的写法见 [/guides/agents-md-cross-tool-guide](/guides/agents-md-cross-tool-guide)。

## 常见问题

**Q：只能选一个，选哪个？**
本文不排名。用你已订阅的那一家的工具，最省钱省事；真要新订阅，按本站 [/guides/ai-subscription-which-to-choose-four-vendors](/guides/ai-subscription-which-to-choose-four-vendors) 里的价位和功能再看。

**Q：Gemini CLI 还能用吗？**
个人账号路径已停止，企业许可和付费 API Key 仍可用，见上文。

**Q：这些工具能不能互相用对方的模型？**
部分可以：Cursor 自带 Claude、GPT 等第三方模型（按 API 标价另付）；Codex 能配置别家兼容 Responses 接口的模型。Claude Code 与 Gemini 的互通，官方文档没有说明。

## 参考资料

- ChatGPT 官方：Pricing — https://chatgpt.com/pricing
- OpenAI：Codex CLI — https://developers.openai.com/codex/cli
- Claude 官方：Pricing — https://claude.com/pricing
- Claude Code 文档：Overview — https://code.claude.com/docs/en/overview
- Cursor 文档：Models & Pricing — https://cursor.com/docs/models-and-pricing
- Gemini 官方：订阅 — https://gemini.google/subscriptions/
- Antigravity：CLI — https://antigravity.google/product/antigravity-cli
- Google 开发者博客：Transitioning Gemini CLI to Antigravity CLI — https://developers.googleblog.com/an-important-update-transitioning-gemini-cli-to-antigravity-cli
