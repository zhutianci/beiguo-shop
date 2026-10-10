---
title: MCP 的 stdio、SSE 和 Streamable HTTP 有什么区别：本地与远程 MCP 怎么选
slug: mcp-stdio-vs-streamable-http-sse
products: [ai-tools, claude]
models: []
topics: [ai-agent]
accountTier: FREE
excerpt: MCP 配置里的 stdio、sse、http 到底差在哪？按 MCP 官方规范讲清两种标准传输方式的工作原理、Streamable HTTP 与旧的 HTTP+SSE 的关系、会话与断线续传、规范对安全的硬性要求，以及本地服务器和远程服务器各适合什么场景。
checkedOn: 2026-10-11
sources:
  - https://modelcontextprotocol.io/specification/2025-11-25/basic/transports
  - https://github.com/modelcontextprotocol/inspector/blob/main/docs/v1-to-v2-migration.md
  - https://modelcontextprotocol.io/docs/develop/connect-local-servers
verify:
  - 本文按协议版本 2025-11-25 的 Transports 一章编写；MCP 文档站已有 2026-07-28 版本的文档，更新的版本如有调整以官方规范为准
  - 各客户端配置里对传输方式的叫法不同（http、streamable-http、streamableHttp、sse），以各自文档为准
---

> 本文根据 MCP 官方规范《Transports》（协议版本 2025-11-25）整理，资料核对于 2026-10-11。MCP 的基本概念见[《MCP 是什么》](/guides/mcp-model-context-protocol)。

## 适用于谁

- 搜「mcp stdio sse 区别」「mcp streamable http 和 sse 的区别」「mcp streamable http 协议」的人；
- 配 MCP 时看到 `command` 和 `url` 两种写法、`sse` 和 `http` 两种类型，不知道该用哪个的人；
- 自己写 MCP 服务器，要决定用哪种方式对外提供的人。

## 结论先说

1. **规范只定义了两种标准传输方式：stdio 和 Streamable HTTP。**
2. **stdio = 本地子进程**。客户端启动服务器程序，通过标准输入输出传消息。配置里写的是 `command` 和 `args`。
3. **Streamable HTTP = 网络服务**。服务器独立运行，提供一个 HTTP 端点，客户端用网址连接。配置里写的是 `url`。
4. **SSE 有两个意思，别混了**：一是旧版协议（2024-11-05）里的「HTTP+SSE」传输方式，已被 Streamable HTTP 取代；二是 Streamable HTTP 内部仍然可以用 SSE 这种流式响应格式。看到配置里的 `sse` 类型，指的是前者。
5. **怎么选**：需要访问你本机文件和程序的，用 stdio；只是调用某个云服务的，优先用厂商提供的远程服务器。

## 一、stdio：把服务器当子进程

规范描述的工作方式：

- 客户端把 MCP 服务器作为**子进程**启动；
- 服务器从标准输入读取 JSON-RPC 消息，把消息写到标准输出；
- 消息之间用换行分隔，消息内部不得包含换行；
- 服务器可以向标准错误写日志；客户端不应把标准错误里有输出当作出错的证据；
- 服务器**不得**向标准输出写入任何不是合法 MCP 消息的内容。

最后一条是写服务器的人最容易违反的：一句调试用的打印语句就会让通信出错。

规范还有一句：客户端在可能的情况下**应当**支持 stdio。所以几乎所有 MCP 客户端都能配本地服务器。

典型配置长这样（Claude 桌面版的官方示例）：

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/Users/username/Desktop"]
    }
  }
}
```

## 二、Streamable HTTP：一个端点，两种响应

规范描述的工作方式：

- 服务器提供**一个** MCP 端点，同时接受 POST 和 GET；
- 客户端发的每条消息都是一次新的 POST，请求头 `Accept` 里要同时列出 `application/json` 和 `text/event-stream`；
- 对于请求，服务器可以直接回一个 JSON，也可以打开一条 SSE 流陆续返回，客户端两种都必须能处理；
- 客户端可以用 GET 打开一条 SSE 流，用来接收服务器主动发来的消息；服务器不支持时返回 405。

「Streamable」指的就是这一点：简单的调用一问一答，耗时的调用可以流式返回进度和结果，用的是同一个端点。

**会话**

- 服务器可以在初始化响应里通过 `MCP-Session-Id` 响应头分配一个会话 ID；
- 之后客户端的所有请求都必须带上它；
- 服务器可以随时结束会话，此后对该会话的请求返回 404，客户端必须重新初始化；
- 客户端不再需要会话时，应当发一个 HTTP DELETE 来结束它。

**断线续传**

- 服务器可以给 SSE 事件加上事件 ID；
- 连接断开后，客户端用带 `Last-Event-ID` 请求头的 GET 请求续上；
- 规范特别说明：连接断开**不等于**取消。要取消一个请求，客户端应当显式发送取消通知。

**协议版本头**：初始化之后，客户端的所有请求都要带 `MCP-Protocol-Version` 请求头，例如 `2025-11-25`。

## 三、旧的 HTTP+SSE 是怎么回事

协议版本 2024-11-05 里的 HTTP 传输方式叫 HTTP+SSE，它用两个端点：一个 SSE 端点用来收，一个 POST 端点用来发。Streamable HTTP 把它们合并成了一个端点，并取代了它。

规范给出的兼容办法：

- **服务器**想照顾老客户端，可以在新的 MCP 端点之外继续保留旧的 SSE 和 POST 端点；
- **客户端**先向网址 POST 一个初始化请求，成功就说明是 Streamable HTTP；如果返回 400、404 或 405，再发一个 GET，如果收到的第一个事件是 `endpoint`，说明对方是旧的 HTTP+SSE 服务器。

落到日常使用上：

| 你看到的 | 含义 | 怎么办 |
| --- | --- | --- |
| 服务文档给的网址以 `/mcp` 结尾 | 多半是 Streamable HTTP | 类型选 http |
| 服务文档给的网址以 `/sse` 结尾 | 多半是旧的 HTTP+SSE | 类型选 sse；留意服务方是否已提供新端点 |
| 两个都给了 | 服务方在做兼容 | 优先用 `/mcp` |

这个按结尾判断的办法，MCP 官方调试工具 Inspector 自己也在用：它的文档写明，不指定传输方式时，网址必须以 `/mcp` 或 `/sse` 结尾才能自动判断。Claude Code 里连接远程服务器的具体命令见[《Claude Code MCP 配置教程》](/guides/claude-code-mcp-setup)。

## 四、对比

| | stdio | Streamable HTTP |
| --- | --- | --- |
| 服务器在哪运行 | 你的电脑上，由客户端启动 | 任意位置，独立运行 |
| 配置里写什么 | `command`、`args`、`env` | `url`，可能还有请求头 |
| 谁能用 | 只有启动它的那个客户端 | 多个客户端、多个用户 |
| 鉴权 | 靠环境变量把密钥传给进程 | 走 HTTP 的鉴权，常见是 OAuth 登录 |
| 能碰到什么 | 你的账号能读写的文件、环境变量、网络 | 只有服务方那一端的数据 |
| 更新 | 你自己更新包 | 服务方更新，你不用管 |
| 断网可用 | 可以（服务本身不需要联网时） | 不可以 |

## 五、本地还是远程，怎么选

先问一个问题：**它真的需要跑在我的电脑上吗？**

- **需要本机资源的，用 stdio**：读写本地文件、操作本地浏览器、连只在内网或本机的数据库、调用本机的命令行工具；
- **只是调用云服务的，用远程服务器**：GitHub、Notion、Sentry 这类服务，厂商提供官方远程端点的，用远程的。不用在本机跑一个第三方进程，授权也可以随时在服务方撤销。

本地 MCP 服务器是以你的身份运行的程序。MCP 官方的本地服务器教程里就有这样的提醒：服务器以你的用户账号权限运行，你能手动做的文件操作它都能做。所以本地服务器装得越少越好，安装前的检查见[《MCP 服务器怎么选、装之前怎么审》](/guides/mcp-servers-how-to-choose-audit)。

## 六、自己提供 HTTP 服务时的安全要求

规范在 Streamable HTTP 一节有一段安全警告，三条要求：

1. 服务器**必须**校验所有传入连接的 `Origin` 请求头，不合法的返回 403，用来防止 DNS 重绑定攻击；
2. 在本机运行时，服务器**应当**只绑定到 127.0.0.1，而不是所有网卡；
3. 服务器**应当**为所有连接实现适当的鉴权。

规范解释，不做这些防护的话，攻击者可以通过恶意网页去访问你本机上的 MCP 服务器。用官方 SDK 写服务器时，核对一下这三条是否已经满足。

## 常见问题

**Q：同一个服务器可以两种方式都支持吗？**
可以。很多服务器同时提供本地安装和远程端点两种用法；官方 Python SDK 写的服务器也可以通过参数切换传输方式，见[《MCP Server 开发入门（Python）》](/guides/mcp-server-python-sdk-build-quickstart)。

**Q：SSE 是不是被废弃了？**
被取代的是旧的「HTTP+SSE 传输方式」。SSE 作为一种流式响应格式，仍然是 Streamable HTTP 的组成部分。

**Q：远程服务器连不上怎么查？**
先确认网址和类型对得上（`/mcp` 配 http、`/sse` 配 sse）；再看是否需要登录授权；最后用 MCP Inspector 直接连一下，排除客户端配置的因素，见[《MCP Inspector 怎么用》](/guides/mcp-inspector-how-to-use-debug)。

**Q：还有别的传输方式吗？**
规范允许自定义传输方式，只要保持 JSON-RPC 消息格式和 MCP 的生命周期要求。日常使用碰到的基本只有上面两种。

## 参考资料

- Transports（MCP 规范 2025-11-25）：https://modelcontextprotocol.io/specification/2025-11-25/basic/transports
- Inspector v1 → v2 migration（MCP 官方仓库）：https://github.com/modelcontextprotocol/inspector/blob/main/docs/v1-to-v2-migration.md
- Connect to local MCP servers（MCP 官方）：https://modelcontextprotocol.io/docs/develop/connect-local-servers
