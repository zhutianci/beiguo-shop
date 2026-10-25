---
title: DeepSeek 怎么接入 Codex：官方一键脚本与手动改 config.toml 的完整步骤
slug: deepseek-codex-setup
products: [ai-tools, codex]
models: [deepseek]
accountTier: OTHER
excerpt: DeepSeek 能接入 Codex 吗？能。DeepSeek API 原生支持 Responses API，官方提供了 Codex 一键配置脚本和手动配置方法（2026-10-24 查询）。本文按两家官方文档讲清脚本用法、config.toml 字段、联网搜索限制和切换后历史会话的问题。
checkedOn: 2026-10-24
sources:
  - https://api-docs.deepseek.com/zh-cn/quick_start/agent_integrations/codex
  - https://api-docs.deepseek.com/zh-cn/guides/responses_api
  - https://api-docs.deepseek.com/zh-cn/updates
  - https://developers.openai.com/codex/config-advanced
  - https://developers.openai.com/codex/config-reference
verify:
  - 步骤与配置内容取自 DeepSeek 官方「接入 Codex」页面（2026-10-24）；脚本和模型目录 models.json 的内容由官方维护，会随版本更新，本文没有逐行核对脚本，也没有实际运行
  - Codex 官方文档（developers.openai.com/codex）说明自定义模型提供方的写法，其中 env_key 是官方推荐的读取密钥方式，experimental_bearer_token 被标注为「discouraged（不推荐）」；DeepSeek 官方示例使用的是后者，本文照实列出两种说法，由读者自己权衡
  - Codex 的 config 字段可能随版本调整，以 Codex 官方文档为准；DeepSeek 官方页面要求 Codex 客户端版本不低于 models.json 里的 minimal_client_version（官方示例写 0.144.0）
  - 本文不涉及 ChatGPT 账号登录官方模型的用法，只讲用 DeepSeek API Key 接入
---

> 本文根据 DeepSeek 官方「接入 Codex」文档和 OpenAI Codex 官方配置文档整理，资料核对于 2026-10-24。脚本、配置字段可能更新，以官方页面为准。图为本站整理的示意图。

## 适用于谁

- 搜「deepseek怎么接入codex」「deepseek能接入codex吗」「codex怎么接入deepseek」的人；
- 已经在用 Codex CLI、ChatGPT 桌面端或 VS Code 的 Codex 插件，想换成 DeepSeek 模型的人；
- 想知道配置文件怎么写、哪些字段有什么用的人。

## 结论先说

1. **能接入，而且官方提供了现成方案**。Codex 通过 Responses API 与模型交互，DeepSeek API 原生支持这种格式（官方 2026-08-13 更新日志写明，并「针对性适配 Codex」）。
2. **一份配置，所有 Codex 形态通用**：官方页面说，Codex CLI、ChatGPT 桌面端、VS Code 的 Codex 插件共用同一份配置文件，配置一次即可。
3. **推荐用官方一键脚本**，也可以手动编辑 `~/.codex/config.toml`。
4. **可选两个模型**：`deepseek-flash`（支持图片输入）和 `deepseek-v4-pro`（Codex 内置联网搜索只有它支持）。
5. **需要 API Key**：在 DeepSeek 开放平台创建，见 [/guides/deepseek-api-key](/guides/deepseek-api-key)；API 按 token 计费，需要账户有余额，见 [/guides/deepseek-api-platform-balance-topup](/guides/deepseek-api-platform-balance-topup)。

![DeepSeek 接入 Codex 的 4 步](seed:g1010-deepseek-codex-steps.png)
*图：本站根据 [DeepSeek 官方「接入 Codex」文档](https://api-docs.deepseek.com/zh-cn/quick_start/agent_integrations/codex) 整理的示意图*

## 一、准备

- 安装 Codex CLI 或 ChatGPT 桌面端，并**至少运行过一次**，让 `~/.codex` 目录已存在（官方脚本要求）；Codex 的安装与基本用法见 [/guides/codex-getting-started](/guides/codex-getting-started)、[/guides/codex-cli-install-update](/guides/codex-cli-install-update)；
- 在 [DeepSeek 开放平台](https://platform.deepseek.com/api_keys) 创建 API Key（以 `sk-` 开头），并确保有余额。

## 二、方式一：官方一键脚本（推荐）

官方给出的命令：

macOS / Linux 在终端执行：

```bash
bash <(curl -fsSL https://cdn.deepseek.com/api-docs/codex-deepseek-setup.sh)
```

Windows 在 PowerShell 执行：

```powershell
irm https://cdn.deepseek.com/api-docs/codex-deepseek-setup.ps1 | iex
```

**这类「下载后直接执行」的命令有风险**：它来自 DeepSeek 官方文档，但你仍然可以先把脚本下载下来看一遍再运行，只从官方文档页面复制命令。

运行后按菜单选择：

- **第 1 项**：修改 Codex 配置，使用 `deepseek-flash`（同时支持图片输入）；
- **第 2 项**：使用 `deepseek-v4-pro`；
- **第 9 项**：恢复默认的 Codex 配置，删除 deepseek 相关配置。

首次运行会提示输入 API Key。官方说脚本会依次：

1. **备份现有配置**：把 `~/.codex/config.toml` 备份到 `~/.codex/backup-deepseek/`，随时可以还原；
2. **写入模型目录** `~/.codex/models.json`：向 Codex 声明 DeepSeek 模型的元数据（上下文窗口、支持的推理强度档位、工具调用格式等），让 Codex 能像用内置模型一样使用它们；
3. **修改 `config.toml`**：只改必要字段，新增 `[model_providers.deepseek]`，并在 `[desktop]` 中写入 `enabled-reasoning-efforts`；你原有的 MCP 服务器、项目信任级别等配置保留；若有与 DeepSeek 配置冲突的字段，脚本会删除并逐条打印原因；
4. **校验**：写入前先校验语法，失败则中止，不修改任何文件。

再次运行脚本可以重新写入配置或恢复默认；重新运行第 1 / 2 项还会补齐新版脚本新增的配置项，并清理旧的 `deepseek-v4-flash` 等条目，只保留 `deepseek-flash` 和 `deepseek-v4-pro`。

## 三、方式二：手动编辑配置

官方手动方案分两步。

**第一步**，创建模型目录文件 `~/.codex/models.json`，内容与脚本写入的一致（包含 `deepseek-flash` 和 `deepseek-v4-pro` 两个模型的元数据，文件较长，请到官方页面展开「models.json 完整内容」复制）。其中 `deepseek-flash` 的 `input_modalities` 含 `image`，Codex 据此判断它能接收图片。

**第二步**，编辑 `~/.codex/config.toml`（没有就新建），加入以下内容，其中 `experimental_bearer_token` 填你的 API Key：

```toml
model = "deepseek-flash"
model_provider = "deepseek"
preferred_auth_method = "apikey"
forced_login_method = "api"
model_reasoning_effort = "high"
web_search = "disabled"
show_raw_agent_reasoning = true
model_catalog_json = "~/.codex/models.json"

[model_providers.deepseek]
name = "deepseek"
base_url = "https://api.deepseek.com/"
wire_api = "responses"
experimental_bearer_token = "<你的 DeepSeek API Key>"

[desktop]
enabled-reasoning-efforts = ["low", "medium", "high", "xhigh", "ultra", "max"]
```

如果 `config.toml` 里已经有 `[desktop]` 段，请把 `enabled-reasoning-efforts` 加到该段里，**不要再新建一个 `[desktop]`**，重复的配置段会让文件不合法。

### 字段是什么意思（官方说明）

| 字段 | 作用 |
| --- | --- |
| `model` | 默认使用的模型 |
| `model_provider` | 使用的提供方，对应 `[model_providers.<id>]` 的 id |
| `preferred_auth_method`、`forced_login_method` | 用 API Key 认证，跳过 ChatGPT 账号登录 |
| `model_reasoning_effort` | 推理强度，值越高思考越深、耗时越长 |
| `web_search` | Codex 内置联网搜索，仅 `deepseek-v4-pro` 支持，设为 `"live"` 启用 |
| `show_raw_agent_reasoning` | 显示原始思考过程，仅 Codex CLI 有效，按 Ctrl + T 展示 |
| `model_catalog_json` | 自定义模型目录文件路径 |
| `base_url` / `wire_api` | DeepSeek API 地址 / 通信协议，`"responses"` 表示 Responses API |
| `experimental_bearer_token` | 你的 API Key，直接写在配置里 |

### 关于 API Key 写在配置文件里

DeepSeek 官方示例把 Key 直接写进 `config.toml`。而 Codex 官方文档对自定义提供方的建议是：用 `env_key` 指定一个环境变量名来读取密钥，`experimental_bearer_token`（直接写令牌）被标为不推荐。两种写法的字段含义都在 Codex 官方文档里（`model_providers.<id>.env_key` 与 `experimental_bearer_token`）。如果你想把 Key 放在环境变量里，可以参考 Codex 官方写法自行调整，**但本文没有测试过这种改法**，请先备份配置再试。无论哪种，都**不要把配置文件提交到公开仓库**。

另外 Codex 官方文档提醒：项目级的 `.codex/config.toml` 不能覆盖 `model_provider`、`model_providers` 这类涉及凭据与提供方的设置，所以这些要写在用户级的 `~/.codex/config.toml`。

## 四、联网搜索

官方说明：Codex 内置联网搜索**只在使用 `deepseek-v4-pro` 时可用**。一键脚本默认写入 `web_search = "disabled"`；要用，切到 `deepseek-v4-pro`，并把 `web_search` 设为 `"live"`：

```toml
model = "deepseek-v4-pro"
web_search = "live"
```

保存后重启 Codex。搜索由 DeepSeek 在服务端执行，按 Search 接口的计费规则计费（每 1000 次成功请求 5 元；目前在 Codex 等工具中使用时的服务端搜索尚未计费，官方说将自北京时间 2026-11-01 00:00 起按次收费）。

## 五、开始使用与常见情况

- **Codex CLI**：进入项目目录执行 `codex`，启动信息里显示 `model: deepseek-flash` 即生效；
- **ChatGPT 桌面端**：模型选择器显示「自定义」或「DeepSeek-Flash」之类的名字，都算生效，取决于 ChatGPT 版本；
- **VS Code 的 Codex 插件**：与 CLI 共用同一份配置，装好插件即可用。

![接入 Codex 后遇到的情况](seed:g1010-deepseek-codex-decide.png)
*图：本站根据 DeepSeek 官方「接入 Codex」文档整理的示意图*

## 常见问题

**Q：切到 DeepSeek 后以前的对话不见了？**
官方说明没有删除。Codex 按登录方式分组存放会话：用 ChatGPT 官方订阅产生的会话和用第三方 API（如 DeepSeek）产生的会话属于两组，界面只显示与当前配置匹配的一组。恢复原配置（脚本第 9 项）就能重新看到之前的会话，切换后需要重启 ChatGPT 客户端才会生效。

**Q：用 DeepSeek 还需要 ChatGPT 会员吗？**
按官方配置，使用 API Key 认证并跳过 ChatGPT 账号登录，计费走 DeepSeek 开放平台。如果你要用的是 Codex 官方模型，需要 ChatGPT 套餐，见 [/chongzhi/chatgpt-plus](/chongzhi/chatgpt-plus)，用量规则见 [/guides/codex-usage-limits](/guides/codex-usage-limits)。

**Q：Codex 里配 MCP 还能用吗？**
官方说脚本会保留你原有的 MCP 服务器配置。MCP 的配置方法见 [/guides/codex-mcp-config](/guides/codex-mcp-config)。

**Q：想在 Claude Code 里用 DeepSeek？**
见 [/guides/deepseek-claude-code-setup](/guides/deepseek-claude-code-setup)。想了解 Codex 与 Claude Code、Cursor 的区别，见 [/guides/cursor-vs-claude-code-vs-codex](/guides/cursor-vs-claude-code-vs-codex)。

**Q：报错 400 / 401 / 402 怎么办？**
401 多半是 Key 错，402 是余额不足，见 [/guides/deepseek-api-error-codes](/guides/deepseek-api-error-codes)。

## 参考资料

- DeepSeek API 文档：接入 Codex — https://api-docs.deepseek.com/zh-cn/quick_start/agent_integrations/codex
- DeepSeek API 文档：使用 Responses API — https://api-docs.deepseek.com/zh-cn/guides/responses_api
- DeepSeek API 文档：更新日志 — https://api-docs.deepseek.com/zh-cn/updates
- OpenAI Codex 文档：Advanced configuration — https://developers.openai.com/codex/config-advanced
- OpenAI Codex 文档：Configuration reference — https://developers.openai.com/codex/config-reference
