---
title: Codex 怎么配置 MCP：codex mcp add 命令、config.toml 写法与常见问题
slug: codex-mcp-config
products: [codex]
models: []
accountTier: PLUS
excerpt: Codex 怎么配置 MCP？按官方文档讲清 codex mcp add 命令、桌面 App 和 IDE 里的设置、config.toml 中 STDIO 与 HTTP 服务器的写法、OAuth 登录、工具审批，以及看不到工具、启动超时怎么排查。
checkedOn: 2026-10-07
sources:
  - https://learn.chatgpt.com/docs/extend/mcp
  - https://learn.chatgpt.com/docs/config-file/config-basic
  - https://learn.chatgpt.com/docs/config-file/config-reference
  - https://learn.chatgpt.com/docs/developer-commands
  - https://learn.chatgpt.com/docs/mcp-server
  - https://learn.chatgpt.com/docs/pricing
  - https://github.com/openai/codex
verify:
  - 桌面 App「Settings → MCP servers」、IDE 插件齿轮菜单「MCP servers」的中文界面名称未核实
  - Windows 原生环境下 npx 类 STDIO 服务器的启动问题官方文档没有专门说明，正文只给通用排查思路
---

> 本文根据 OpenAI 官方 Codex 文档（原 developers.openai.com/codex，现已迁到 learn.chatgpt.com/docs）的《Model Context Protocol》《Config basics》《Configuration Reference》和命令参考整理，资料核对于 2026-10-07。示例里的第三方服务器（Context7、Figma 等）是官方文档自己举的例子，使用前请看各自的说明。

## 适用于谁

- 想让 Codex 查最新的开发文档、操作浏览器、读 Figma 设计稿、看 Sentry 日志的人；
- 搜「codex mcp 配置」「codex mcp add」「config.toml 怎么写」的 CLI / IDE / 桌面 App 用户；
- 配好了 MCP 但 Codex 里看不到工具、或者启动报超时的人。

还没装 Codex 的先看 [Codex 入门教程](/guides/codex-getting-started)。

## 结论先说

1. **MCP（Model Context Protocol）** 是把第三方工具和上下文接给模型的协议。本地的 Codex（桌面 App、CLI、IDE 插件）可以直接连 MCP 服务器；ChatGPT 网页版则通过安装**插件（Plugins）**使用远程 MCP 工具，不读本地配置文件。
2. **配置只写一处**：都存在 `config.toml` 里，默认是 `~/.codex/config.toml`（Windows 是 `%USERPROFILE%\.codex\config.toml`）；桌面 App、CLI、IDE 插件**共用**这份配置，配一次三处都能用。
3. **最快的方法**是命令行：`codex mcp add 名字 -- 启动命令`（本地进程型）或 `codex mcp add 名字 --url 地址`（HTTP 型）。
4. 配完用 `codex mcp list` 查看，会话里输入 `/mcp` 确认工具已加载。
5. **MCP 服务器不是越多越好**：每个服务器都会往消息里加上下文、多耗额度，不用的设成 `enabled = false`。

## 两类 MCP 服务器

| 类型 | 是什么 | 必填 | 认证方式 |
|---|---|---|---|
| STDIO | 在你电脑上用一条命令启动的本地进程 | `command` | 环境变量 |
| Streamable HTTP | 通过网址访问的服务器 | `url` | Bearer Token、OAuth，或可信的官方服务器用 ChatGPT 登录态 |

另外，Codex 会读取 MCP 服务器初始化时返回的 `instructions` 字段，作为使用这个服务器的整体指引。

## 方法一：用 codex mcp 命令添加

**添加本地（STDIO）服务器**，`--` 后面是启动命令，可以用 `--env` 传环境变量：

```bash
codex mcp add <名字> --env VAR1=VALUE1 --env VAR2=VALUE2 -- <启动命令>
```

官方文档举的例子是 Context7（查开发文档的免费 MCP 服务器）：

```bash
codex mcp add context7 -- npx -y @upstash/context7-mcp
```

**添加 HTTP 服务器**：

```bash
codex mcp add example --url https://mcp.example.com
```

如果服务器用 Bearer Token，可以加 `--bearer-token-env-var 环境变量名`，Codex 会把这个环境变量的值放进 `Authorization` 头；需要预先注册 OAuth 客户端的，加 `--oauth-client-id 客户端ID`，Codex 会显示要在服务商那边登记的回调地址。

**其他常用子命令**（来自官方命令参考）：

| 命令 | 作用 |
|---|---|
| `codex mcp list` | 列出已配置的服务器（加 `--json` 输出原始配置） |
| `codex mcp get <名字>` | 查看某个服务器的配置 |
| `codex mcp login <名字>` | 对支持 OAuth 的 HTTP 服务器发起登录 |
| `codex mcp logout <名字>` | 删除该服务器保存的 OAuth 凭据 |
| `codex mcp remove <名字>` | 删除服务器配置 |
| `codex mcp --help` | 查看全部子命令 |

## 方法二：在桌面 App 或 IDE 插件里添加

- **ChatGPT 桌面 App**：**Settings（设置）→ MCP servers → Add server**，填名字，选 **STDIO** 或 **Streamable HTTP**，填启动命令或网址，保存后点 **Restart**。需要登录的服务器会标出来，点 **Authenticate** 完成授权。输入框里打 `/mcp` 可以看到已连接的服务器。
- **IDE 插件**：齿轮菜单 → **MCP servers → Add server**，步骤同上，保存后点 **Restart extension**。

两处添加的服务器都写进同一份 `config.toml`，换客户端不用重配。

## 方法三：直接编辑 config.toml

想精细控制时直接改文件。每个服务器一个 `[mcp_servers.<名字>]` 表。也可以在项目里放 `.codex/config.toml`，只对这个项目生效——但**只有你信任（trust）的项目才会加载项目级配置**。IDE 插件里可以通过齿轮 → **Codex Settings → Open config.toml** 打开。

### STDIO 服务器的写法

```toml
[mcp_servers.context7]
command = "npx"
args = ["-y", "@upstash/context7-mcp"]
env_vars = ["LOCAL_TOKEN"]          # 允许从本机环境转发的变量

[mcp_servers.context7.env]
MY_ENV_VAR = "MY_ENV_VALUE"         # 直接写给这个服务器的变量
```

可选字段还有 `cwd`（启动目录）。

### HTTP 服务器的写法

```toml
[mcp_servers.figma]
url = "https://mcp.figma.com/mcp"
bearer_token_env_var = "FIGMA_OAUTH_TOKEN"
http_headers = { "X-Figma-Region" = "us-east-1" }
```

可选字段：`env_http_headers`（从环境变量取请求头）、`auth`（默认 `oauth` 使用已保存的 OAuth 凭据）、`scopes`（OAuth 申请的权限范围）。如果一个凭据都没解析到，Codex 会尝试不带认证连接；要登录请单独运行 `codex mcp login <名字>`。

**建议**：Token 一律通过环境变量引用（`bearer_token_env_var`、`env_vars`），不要把密钥明文写进 `config.toml`，尤其是会提交到 Git 的项目级配置。

### 通用选项：超时、开关、工具白名单与审批

```toml
[mcp_servers.chrome_devtools]
url = "http://localhost:3000/mcp"
enabled_tools = ["open", "screenshot"]
disabled_tools = ["screenshot"]          # 在 enabled_tools 之后生效
default_tools_approval_mode = "prompt"
startup_timeout_sec = 20
tool_timeout_sec = 45
enabled = true

[mcp_servers.chrome_devtools.tools.open]
approval_mode = "approve"
output_token_limit = 30000
```

| 字段 | 作用 | 默认 |
|---|---|---|
| `startup_timeout_sec` | 服务器启动超时（秒） | 10 |
| `tool_timeout_sec` | 单次工具调用超时（秒） | 60 |
| `enabled` | 设 `false` 可停用但保留配置 | — |
| `required` | 设 `true` 时，这个服务器起不来 Codex 就启动失败 | — |
| `enabled_tools` / `disabled_tools` | 工具白名单 / 黑名单 | — |
| `default_tools_approval_mode` | 该服务器工具的默认审批方式：`auto`、`prompt`、`writes`（只对非只读工具询问）、`approve` | — |
| `tools.<工具>.approval_mode` | 单个工具的审批方式 | — |
| `tools.<工具>.output_token_limit` | 单个工具输出的 token 上限 | — |

另外，顶层的 `mcp_optional_startup_grace_ms` 控制建立工具列表时等待「非必需」服务器的时间，默认 1000 毫秒。

官方安全说明里还提到：声明了「破坏性」标注的 MCP 工具调用总是需要审批（除非工具同时声明了只读）。审批和沙箱怎么搭配，见 [Codex 权限与沙箱设置](/guides/codex-permissions-sandbox)。

## 官方文档列出的常用 MCP 服务器

OpenAI Docs MCP（查 OpenAI 开发者文档）、Context7（最新开发文档）、Figma（本地 / 远程两种）、Playwright（控制浏览器）、Chrome DevTools、Sentry（看日志）、GitHub（管理 PR 和 Issue）。安装插件时，插件也可以自带 MCP 服务器，这类服务器的开关和工具策略写在 `plugins.<插件>.mcp_servers.<服务器>` 下。

## 常见问题

**Q：配好了，会话里却看不到工具？**
依次检查：`codex mcp list` 里有没有它、`enabled` 是不是 `false`；项目级 `.codex/config.toml` 只在信任的项目里加载；改完配置后重启会话（桌面 App 点 **Restart**，IDE 点 **Restart extension**）；会话里输入 `/mcp verbose` 看服务器详情。

**Q：启动超时怎么办？**
STDIO 服务器第一次用 `npx` 之类命令启动时可能要先下载依赖，比默认的 10 秒久。可以把 `startup_timeout_sec` 调大，或者先在终端里单独运行一次启动命令，确认它本身能正常运行、没有报错。

**Q：需要 OAuth 的服务器怎么登录？**
运行 `codex mcp login <名字>`，在浏览器完成授权；桌面 App / IDE 里点 **Authenticate**。服务商要求预先登记回调地址的，以 `codex mcp add` 时显示的地址为准，原样登记。

**Q：`codex mcp-server` 命令没了？**
是的。官方已移除 `codex mcp-server` 命令和独立的 `codex-mcp-server` 程序，也就是「把 Codex 当成 MCP 服务器给别的程序用」这条路不再支持，集成方需要改用 Codex app server（实验性，使用自己的 JSON-RPC 协议）。这和「让 Codex 连接外部 MCP 服务器」是两回事，后者继续支持，用 `codex mcp` 管理。

**Q：ChatGPT 网页版能用我在 config.toml 里配的 MCP 吗？**
不能。网页版不读本地 Codex 配置，要在 **Plugins** 里安装带 MCP 工具的插件，详见 [ChatGPT 插件与连接应用](/guides/chatgpt-plugins-connected-apps)。

**Q：MCP 会多耗额度吗？**
会。官方定价页的省额度建议里专门写了「限制 MCP 服务器数量」，不用时就停用，见 [Codex 额度与使用限制](/guides/codex-usage-limits)。

## 参考资料

- 官方文档：Model Context Protocol（Codex）— https://learn.chatgpt.com/docs/extend/mcp
- 官方文档：Config basics — https://learn.chatgpt.com/docs/config-file/config-basic
- 官方文档：Configuration Reference — https://learn.chatgpt.com/docs/config-file/config-reference
- 官方文档：命令行参考（codex mcp 子命令）— https://learn.chatgpt.com/docs/developer-commands
- 官方文档：Codex MCP server removal — https://learn.chatgpt.com/docs/mcp-server
- Codex 官方定价页（省额度建议）— https://learn.chatgpt.com/docs/pricing
- openai/codex 官方仓库 — https://github.com/openai/codex
