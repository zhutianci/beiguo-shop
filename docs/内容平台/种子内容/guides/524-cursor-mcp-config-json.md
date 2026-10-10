---
title: Cursor MCP 配置教程：mcp.json 写法、项目与全局位置、OAuth 与连接失败排查
slug: cursor-mcp-config-json
products: [cursor]
models: []
accountTier: PLUS
excerpt: Cursor 怎么配置 MCP？按官方文档讲清一键安装与手写 mcp.json 两条路、本地 stdio 与远程 HTTP 的写法、.cursor/mcp.json 和 ~/.cursor/mcp.json 的区别、用变量保护密钥、工具审批，以及看 MCP Logs 排查。
checkedOn: 2026-10-11
sources:
  - https://cursor.com/docs/mcp
  - https://cursor.com/docs/agent/security/run-modes
  - https://cursor.com/help/customization/ignore-files
  - https://modelcontextprotocol.io/introduction
verify:
  - Customize 页面与 Marketplace 入口的中文界面名称未核对
  - 示例里的服务器名、包名是占位写法，第三方 MCP 的真实地址与授权方式以各服务自己的文档为准
---

> 本文根据 Cursor 官方文档《Model Context Protocol (MCP)》整理，资料核对于 2026-10-11。MCP 本身是什么，见本站[《MCP 是什么》](/guides/mcp-model-context-protocol)。

## 适用于谁

- 想让 Cursor 直接查数据库、读 Linear / Notion / Figma 的人；
- 搜「cursor mcp 配置」「cursor mcp 设定」「cursor mcp 使用」的人；
- 照着网上的 JSON 抄了一段，服务器却不出现或一直报错的人。

## 结论先说

1. 两条路：在 **Cursor Marketplace** 里点「Add to Cursor」**一键安装**（走 OAuth 登录）；或者**手写 `mcp.json`**。
2. 配置文件两个位置：项目里的 **`.cursor/mcp.json`**（只对这个项目）和用户目录下的 **`~/.cursor/mcp.json`**（所有项目）。
3. 本地服务器写 `command` + `args`；远程服务器写 `url`。密钥**不要写死**，用 `${env:变量名}` 引用环境变量。
4. 默认每次调用 MCP 工具前 Cursor 都会**先问你**；是否自动运行跟着运行模式（Run Mode）走。
5. 出问题先看日志：输出面板里选 **MCP Logs**。
6. 用不到的服务器在 Customize 里关掉——官方说关闭后它不会加载，也能减少工具列表的干扰。

## 方式一：从 Marketplace 一键安装

打开侧边栏的 **Customize**，或访问 Cursor Marketplace，找到需要的官方插件，点 **Add to Cursor**，按提示在浏览器里完成 OAuth 登录即可。官方说明 Marketplace 里是官方插件；社区的插件和 MCP 服务器可以在 cursor.directory 浏览——**社区来源的要自己把关**，见文末的安全提示。

## 方式二：手写 mcp.json

### 本地（stdio）服务器

由 Cursor 在你电脑上启动一个进程：

```json
{
  "mcpServers": {
    "my-server": {
      "command": "npx",
      "args": ["-y", "mcp-server"],
      "env": {
        "API_KEY": "${env:MY_API_KEY}"
      }
    }
  }
}
```

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `type` | 是 | 连接类型，写 `"stdio"` |
| `command` | 是 | 启动命令，要在系统 PATH 里或写完整路径（`npx`、`node`、`python`、`docker` 等） |
| `args` | 否 | 传给命令的参数数组 |
| `env` | 否 | 传给服务器的环境变量 |
| `envFile` | 否 | 额外加载的环境变量文件，如 `"${workspaceFolder}/.env"`；**只有 stdio 支持** |

Python 写的服务器把 `command` 换成 `python`、`args` 写脚本路径即可。

### 远程（HTTP / SSE）服务器

```json
{
  "mcpServers": {
    "remote-server": {
      "url": "https://api.example.com/mcp",
      "headers": {
        "Authorization": "Bearer ${env:MY_SERVICE_TOKEN}"
      }
    }
  }
}
```

Cursor 支持三种传输方式：`stdio`（本地、单人）、`SSE` 和 `Streamable HTTP`（本地或远程、可多人、支持 OAuth）。

### 能用哪些变量

`command`、`args`、`env`、`url`、`headers` 里都可以用：

- `${env:NAME}`：环境变量；
- `${userHome}`：用户主目录；
- `${workspaceFolder}`：项目根目录（即包含 `.cursor/mcp.json` 的那个文件夹）；
- `${workspaceFolderBasename}`：项目文件夹名；
- `${pathSeparator}` 或 `${/}`：系统路径分隔符。

## 项目配置还是全局配置

| 位置 | 作用范围 | 适合 |
| --- | --- | --- |
| `.cursor/mcp.json`（项目内） | 只在这个项目 | 项目专用的数据库、内部工具；可以提交进仓库和同事共用 |
| `~/.cursor/mcp.json`（用户目录） | 所有项目 | 你到哪都用的服务，如文档搜索 |

Windows 上 `~` 指 `C:\Users\你的用户名`。要提交进仓库的项目配置，更要坚持用 `${env:...}`，不要把密钥提交上去。

## 需要 OAuth 的服务器

大多数远程服务器装好后会自动引导你在浏览器登录。少数服务不支持动态注册客户端，或者要求把回调地址加白（官方举例 Figma、Linear），这时在条目里加 `auth`：

```json
{
  "mcpServers": {
    "oauth-server": {
      "url": "https://api.example.com/mcp",
      "auth": {
        "CLIENT_ID": "${env:MCP_CLIENT_ID}",
        "CLIENT_SECRET": "${env:MCP_CLIENT_SECRET}",
        "scopes": ["read", "write"]
      }
    }
  }
}
```

在对方平台登记回调地址时，桌面端填 `http://localhost:8787/callback`，网页端和云端 Agent 填 `https://www.cursor.com/agents/mcp/oauth/callback`；两边都用就两个都登记。

## 在对话里使用

配置好的工具会出现在 Available Tools 里，Agent 觉得相关就会自动调用（Plan 模式里也会）；你也可以直接点名「用 xx 工具查一下」。

默认情况下，每次调用前会弹出确认，点工具名旁的箭头可以先看参数：

![Cursor 对话里调用 MCP 工具前的确认框：显示「Calling list_schemas」和参数，右下角有 Cancel 与 Run tool 按钮](seed:g524-cursor-mcp-tool-confirm.png)
*图片来源：[Cursor 官方文档《Model Context Protocol (MCP)》](https://cursor.com/docs/mcp)*

MCP 工具和终端命令共用同一套运行模式。比如在 Auto-review 模式下，白名单里的工具直接运行，其他的交给分类器审查。详见[《Cursor 隐私模式与 Agent 权限》](/guides/cursor-privacy-mode-run-modes)。

## 常见问题

**Q：怎么排查连不上？**
`Ctrl+Shift+U`（macOS `Cmd+Shift+U`）打开输出面板，下拉选 **MCP Logs**，里面有初始化、工具调用和报错信息。常见原因是 `command` 不在 PATH 里（装了 Node.js / Python 吗）、环境变量没设、JSON 少了逗号或引号。

**Q：一个服务器崩了会影响别的吗？**
不会。官方说明各服务器互相隔离：出错的那次工具调用标记为失败，可以重试或看日志，其他服务器照常工作。

**Q：怎么更新 npm 装的服务器？**
官方步骤：在 Customize 里移除 → 运行 `npm cache clean --force` → 重新添加。自己写的服务器更新文件后重启 Cursor。

**Q：`.cursorignore` 能挡住 MCP 读文件吗？**
挡不住。官方提醒：终端命令和 MCP 工具运行在 Cursor 的文件访问控制之外，仍可能读到被忽略的文件。

**Q：能连敏感数据吗？**
可以，但官方要求：密钥用环境变量；敏感的服务器用 `stdio` 在本地跑；API Key 只给最小权限；接入重要系统前读一遍服务器源码。MCP 服务器能代你访问外部服务、执行代码，装之前要弄清它做什么。怎么挑和审，见[《MCP 服务器怎么选》](/guides/mcp-servers-how-to-choose-audit)。

## 参考资料

- Model Context Protocol (MCP)（Cursor 官方）：https://cursor.com/docs/mcp
- Run Modes（Cursor 官方）：https://cursor.com/docs/agent/security/run-modes
- Ignore files（Cursor 官方帮助中心）：https://cursor.com/help/customization/ignore-files
- MCP 协议介绍（官方）：https://modelcontextprotocol.io/introduction
