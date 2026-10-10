---
title: Claude Code MCP 配置教程：claude mcp add、配置文件位置与常用 MCP
slug: claude-code-mcp-setup
products: [claude]
models: []
accountTier: PLUS
excerpt: 一篇讲清 Claude Code 怎么接 MCP 服务器：claude mcp add 三种写法（HTTP / 本地 stdio / JSON）、local / project / user 三种范围、配置文件在哪、OAuth 登录，以及连不上、超时的排查。
checkedOn: 2026-10-07
sources:
  - https://code.claude.com/docs/en/mcp-quickstart
  - https://code.claude.com/docs/en/mcp
  - https://code.claude.com/docs/en/env-vars
  - https://code.claude.com/docs/en/permissions
---

> 本文根据 Claude Code 官方文档《Connect to MCP servers》《Connect Claude Code to tools via MCP》整理，核对日期 2026-10-07。文中的服务器地址是官方文档举的例子，第三方服务的地址和授权方式以各服务自己的文档为准。

## 适用于谁

- 想让 Claude Code 直接读 GitHub PR、查数据库、看 Sentry 报错、操作 Notion 的人；
- 搜「claude code mcp 配置」「mcp 配置文件位置」「mcp add global」，照着网上的 JSON 配了却不生效的人；
- 遇到 MCP「Failed to connect」「timed out」不知道怎么查的人。

MCP 本身是什么，详见本站《MCP 是什么：Model Context Protocol 入门，以及在 Claude 里怎么用》。

## 结论先说

1. **在终端里（不是在 claude 会话里）运行 `claude mcp add`** 添加服务器，然后在会话里用 `/mcp` 查看状态、登录授权。
2. 远程服务器用 `--transport http`（官方推荐）；本地程序用 stdio，**服务器自己的命令要放在 `--` 后面**。
3. 默认是 **local 范围**（只对你、只在当前项目）。想所有项目都能用加 `--scope user`；想提交给团队用加 `--scope project`，会写进项目根目录的 `.mcp.json`。
4. 配置文件只有两个：`~/.claude.json`（local 和 user 范围）和项目根目录的 `.mcp.json`（project 范围）。网上流传的 `~/.claude/mcp.json` 等路径 **Claude Code 都不读**。
5. 每个连接的服务器都会占用上下文（工具名和说明每次都会加载），不用的及时删掉。

## 步骤一：加一个不需要登录的服务器试手

官方用的例子是 Claude Code 文档搜索服务器，无需授权：

```bash
claude mcp add --transport http claude-code-docs https://code.claude.com/docs/mcp
```

- `claude-code-docs` 是你自己起的名字，后面删除、查看都用它；
- 成功后会打印 `Added HTTP MCP server ... to local config` 和被修改的配置文件路径。

检查连接：

```bash
claude mcp list
```

| 状态 | 含义 |
| --- | --- |
| `✔ Connected` | 可以用了 |
| `! Connected · tools fetch failed` | 连上了但拿不到工具列表，用 `claude mcp get 名字` 看详情 |
| `! Needs authentication` | 需要浏览器登录或在 `--header` 里带令牌 |
| `✘ Failed to connect` / `✘ Connection error` | 没连上，见文末排查 |
| `⏸ Pending approval` | 项目范围的服务器还没被你批准，启动 `claude` 时会询问 |

然后启动 `claude`，说「用 claude-code-docs 服务器查一下 MCP_TIMEOUT 是做什么的」。第一次调用会问权限，批准即可。平时不用点名，Claude 会自己挑合适的工具。

## 步骤二：三种添加方式

### 1. 远程 HTTP 服务器（推荐）

```bash
# 基本格式
claude mcp add --transport http <名字> <地址>

# 官方示例：Notion
claude mcp add --transport http notion https://mcp.notion.com/mcp

# 需要令牌的服务器，用 --header 传
claude mcp add --transport http secure-api https://api.example.com/mcp \
  --header "Authorization: Bearer 你的令牌"
```

SSE 传输方式官方已标为弃用。只有 SSE 的老服务，新版本用同一条 `--transport http` 命令即可，Claude Code 会自动退回 SSE；老版本用 `--transport sse`。

### 2. 本地 stdio 服务器

```bash
# 基本格式：-- 后面是启动服务器的命令
claude mcp add [选项] <名字> -- <命令> [参数...]

# 官方示例：Airtable，用 --env 传环境变量
claude mcp add --env AIRTABLE_API_KEY=你的KEY --transport stdio airtable \
  -- npx -y airtable-mcp-server
```

两个易错点：

- **`--` 不能省**。没有它，Claude Code 会把服务器自己的参数（比如 `--port`）当成自己的选项来解析。
- `--env` 后面紧跟服务器名字会被当成另一对 KEY=value，所以在 `--env` 和名字之间至少隔一个别的选项（如 `--transport stdio`）。

### 3. 直接给一段 JSON

服务器文档给的是 JSON 配置时：

```bash
claude mcp add-json weather-api '{"type":"http","url":"https://api.weather.com/mcp","headers":{"Authorization":"Bearer token"}}'
```

注意 JSON 里**有 `url` 就必须写 `type`**（`http`、`sse` 或 `ws`），否则会被当成 stdio 服务器并报错跳过。

已经在 Claude Desktop 里配好的服务器，可以用 `claude mcp add-from-claude-desktop` 导入（官方说明只支持 macOS 和 WSL）。

## 步骤三：选对范围、找到配置文件

| 范围 | 生效范围 | 是否共享 | 保存位置 |
| --- | --- | --- | --- |
| local（默认） | 只在当前项目、只对你 | 否 | `~/.claude.json` 里该项目的条目下 |
| project | 当前项目所有人 | 是，随仓库提交 | 项目根目录 `.mcp.json` |
| user | 你的所有项目 | 否 | `~/.claude.json` 顶层的 `mcpServers` |

```bash
# 所有项目都能用（常被搜成「mcp add global」）
claude mcp add --transport http hubspot --scope user https://mcp.hubspot.com/anthropic

# 共享给团队
claude mcp add --transport http shared-server --scope project https://example.com/mcp
```

Windows 上 `~/.claude.json` 指的是 `%USERPROFILE%\.claude.json`，一般是 `C:\Users\你的用户名\.claude.json`。范围在添加时就定了，想改范围要先 `claude mcp remove` 再用新范围重新添加。同名服务器出现在多个范围时，优先级是 local > project > user > 插件 > claude.ai 连接器。

`.mcp.json` 示例（支持 `${变量}` 和 `${变量:-默认值}`，方便团队共享又不把密钥写死）：

```json
{
  "mcpServers": {
    "api-server": {
      "type": "http",
      "url": "${API_BASE_URL:-https://api.example.com}/mcp",
      "headers": {
        "Authorization": "Bearer ${API_KEY}"
      }
    }
  }
}
```

出于安全考虑，`.mcp.json` 里的项目级服务器第一次使用前会弹窗请你批准；想重置这些选择，运行 `claude mcp reset-project-choices`。另外，`ANTHROPIC_API_KEY` 这类 Claude Code 自身的凭据变量在远程服务器的 url / headers 里会被读成空值，防止项目配置把你的凭据发给第三方。

## 步骤四：需要登录的服务器（OAuth）

```bash
claude mcp add --transport http sentry https://mcp.sentry.dev/mcp
```

然后在会话里输入 `/mcp`，选中服务器，按提示在浏览器里登录。令牌会安全保存并自动刷新；想撤销，在 `/mcp` 菜单里选「Clear authentication」。也可以不进会话直接在终端里登录：`claude mcp login sentry`（SSH 等没有浏览器的环境会打印授权链接，加 `--no-browser` 可强制这样做）。

用令牌而不是 OAuth 的服务（比如官方举例的 GitHub MCP）：

```bash
claude mcp add --transport http github https://api.githubcopilot.com/mcp/ \
  --header "Authorization: Bearer 你的GitHub令牌"
```

`claude mcp add` 不校验令牌，填错也会保存成功，要用 `/mcp` 确认状态是 connected。

如果你用 claude.ai 账号登录 Claude Code，在 claude.ai「连接器」里添加过的服务器会自动出现在 Claude Code 里。

## 常用管理命令

```bash
claude mcp list                 # 列出所有服务器及状态
claude mcp get 名字              # 查看某个服务器的详情和所在范围
claude mcp remove 名字           # 删除（同时清除保存的授权）
claude mcp reset-project-choices  # 重置对 .mcp.json 服务器的批准
```

会话里：`/mcp` 打开管理面板；`/mcp reconnect all` 重连所有失败的服务器；`/mcp disable 名字` 暂时停用而不删除。

权限上，MCP 工具名的格式是 `mcp__服务器名__工具名`，可以在权限规则里写 `mcp__github` 放行或禁止某个服务器的全部工具，详见本站《Claude Code 权限模式详解：auto、手动、plan、bypass 与权限规则配置》。

## 常见问题

**Q：`/mcp` 显示「No MCP servers configured」？**
最常见三种原因：一是你在别的项目目录里加的（local 范围只认添加时的项目，换用 `--scope user`）；二是手动改错了文件路径（只认 `~/.claude.json` 和项目根的 `.mcp.json`）；三是 `.mcp.json` 里有格式错误的条目被跳过了，`claude mcp list` 会给出解析警告。

**Q：Failed to connect 怎么查？**
先看 `claude mcp get 名字` 输出的 HTTP 状态码。远程服务器可以 `curl -I 地址` 测试（PowerShell 里要用 `curl.exe`）：返回 404 / 405 说明服务器在线（很多 MCP 端点只接受 POST）；401 / 403 说明需要登录或令牌；完全没响应就检查地址和网络。本地服务器直接在终端里运行那条启动命令，看报错缺什么（Node.js、浏览器等）。

**Q：启动时超时（Connection timed out）？**
默认启动超时是 30 秒，`npx` 第一次下载包可能更慢。用环境变量加长：`MCP_TIMEOUT=60000 claude`；PowerShell 写成 `$env:MCP_TIMEOUT = "60000"; claude`。单个工具调用的超时可以在 `.mcp.json` 条目里加 `"timeout": 600000`（毫秒）。

**Q：工具输出太长被截断？**
单次 MCP 工具输出超过 1 万 token 会警告，默认上限 2.5 万 token，可以用 `MAX_MCP_OUTPUT_TOKENS=50000` 调高。

**Q：改了 `.mcp.json` 不生效？**
`.mcp.json` 在会话启动时读取，改完要退出重开；之前拒绝过的服务器要先 `claude mcp reset-project-choices`。

**Q：提示「already exists」？**
同一范围里已经有这个名字，先 `claude mcp remove 名字`（多个范围都有时加 `--scope local` 等指定删哪个）再重新添加，或者换个名字。

## 参考资料

- Connect to MCP servers（官方快速开始）：https://code.claude.com/docs/en/mcp-quickstart
- Connect Claude Code to tools via MCP（官方）：https://code.claude.com/docs/en/mcp
- Environment variables（官方）：https://code.claude.com/docs/en/env-vars
- Configure permissions（官方）：https://code.claude.com/docs/en/permissions
