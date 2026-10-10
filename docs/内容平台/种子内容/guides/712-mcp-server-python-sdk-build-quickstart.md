---
title: MCP Server 开发入门（Python）：用官方 SDK 写第一个 MCP 服务器并调试
slug: mcp-server-python-sdk-build-quickstart
products: [ai-tools, claude]
models: []
topics: [ai-agent]
accountTier: FREE
excerpt: 想自己写一个 MCP 服务器？按 MCP 官方 Python SDK 文档讲清安装命令、十几行代码定义一个工具和一个资源、用 mcp dev 打开 Inspector 调试、切换到 Streamable HTTP 运行，以及 v2 把 FastMCP 改名为 MCPServer 后旧教程要改的地方。
checkedOn: 2026-10-11
sources:
  - https://github.com/modelcontextprotocol/python-sdk
  - https://github.com/modelcontextprotocol/python-sdk/blob/main/docs/index.md
  - https://github.com/modelcontextprotocol/python-sdk/blob/main/docs/migration.md
  - https://pypi.org/project/mcp/
  - https://modelcontextprotocol.io/specification/2025-11-25/basic/transports
verify:
  - PyPI 上 mcp 包的最新版本在 2026-10-11 为 2.3.0，官方文档称 v2 是当前稳定版本线；示例代码取自官方 README（main 分支）
  - 官方 README 的客户端示例连接的是 http://localhost:8000/mcp，页面没有把它明确写成服务端默认地址，以实际启动时打印的地址为准
  - 本文没有覆盖鉴权、部署和 TypeScript SDK
---

> 本文根据 MCP 官方 Python SDK 仓库的 README、文档首页和《Migration Guide》整理，资料核对于 2026-10-11。MCP 是什么见[《MCP 是什么》](/guides/mcp-model-context-protocol)。文中代码取自官方 README，没有在本机运行验证。

## 适用于谁

- 搜「mcp server 开发」「mcp server 开发 python」「mcp server 开发教程」「fastmcp 教程」的人；
- 已经会给 Claude Code、Cursor 配别人的 MCP 服务器，想把公司内部的接口或脚本也接进来的人；
- 照着旧教程写 `from mcp.server.fastmcp import FastMCP`，升级后发现对不上的人。

## 结论先说

1. **官方 Python SDK 的包名是 `mcp`**，安装时带上 `cli` 附加项：`pip install "mcp[cli]"`，需要 Python 3.10 及以上。
2. **十几行代码就是一个服务器**：创建一个 `MCPServer` 实例，用 `@mcp.tool()` 装饰函数就是工具，用 `@mcp.resource(...)` 就是资源。函数的类型标注和文档字符串会成为给模型看的参数定义和说明。
3. **调试用 `mcp dev server.py`**，它会启动服务器并打开 MCP Inspector。
4. **v2 改了类名**：`FastMCP` 已改名为 `MCPServer`，导入路径也变了。装饰器的用法和 v1 相同。
5. **stdio 服务器绝不能往标准输出打印东西**，日志要写到标准错误。这是协议规定，也是新手最常见的故障原因。

## 一、三个基本概念

一个 MCP 服务器可以向客户端提供三类东西：

| 类型 | 是什么 | 例子 |
| --- | --- | --- |
| 工具（Tools） | 模型可以调用的函数 | 查订单、发消息、跑一段计算 |
| 资源（Resources） | 客户端可以按 URI 读取的只读内容 | 某个文件、某条记录 |
| 提示（Prompts） | 服务器提供的可复用提示模板 | 一套固定的代码审查提问 |

入门阶段只需要工具。

## 二、安装

官方给出两种方式：

```bash
uv add "mcp[cli]"
```

```bash
pip install "mcp[cli]"
```

`cli` 附加项提供 `mcp` 命令行；不需要命令行时装普通的 `mcp` 即可。

另外，调试用的 Inspector 是一个 Node.js 程序，官方文档提醒需要 `npx` 在你的 `PATH` 里，也就是要先装好 Node.js。

## 三、写第一个服务器

新建 `server.py`，下面是官方 README 的快速上手示例：

```python
from mcp.server import MCPServer

mcp = MCPServer("Demo")


@mcp.tool()
def add(a: int, b: int) -> int:
    """Add two numbers."""
    return a + b


@mcp.resource("greeting://{name}")
def greeting(name: str) -> str:
    """Greet someone by name."""
    return f"Hello, {name}!"
```

逐行看：

- `MCPServer("Demo")`：创建服务器，`Demo` 是它的名称；
- `@mcp.tool()`：把下面的函数注册为工具。`a: int, b: int` 这些类型标注决定了工具的参数定义，三引号里的文档字符串是给模型看的工具说明；
- `@mcp.resource("greeting://{name}")`：注册一个带模板的资源，`{name}` 会作为参数传给函数。

**工具说明要写给模型看**。模型只凭名称和说明决定何时调用、怎么填参数，「Add two numbers.」这种一句话对简单工具够用；实际业务里的工具要写清它做什么、参数的含义和取值范围。

## 四、调试

```bash
uv run mcp dev server.py
```

这条命令启动服务器并打开 MCP Inspector，一个在浏览器里运行的调试界面。打开终端里打印出来的地址，官方文档给的验证步骤是：

- 在 **Tools** 里调用 `add`，填 `a=1`、`b=2`，应当得到 `3`；
- 在 **Resources** 里读取 `greeting://World`，应当得到 `Hello, World!`。

先在 Inspector 里把工具调通，再接进真正的客户端。这样出问题时能分清是服务器的问题还是客户端配置的问题。Inspector 的详细用法见[《MCP Inspector 怎么用》](/guides/mcp-inspector-how-to-use-debug)。

## 五、两种运行方式

MCP 定义了两种标准传输方式，区别见[《MCP 的 stdio、SSE 和 Streamable HTTP 有什么区别》](/guides/mcp-stdio-vs-streamable-http-sse)。简单说：

- **stdio**：客户端把你的服务器当作子进程启动，通过标准输入输出通信。本机自用的服务器用这种；
- **Streamable HTTP**：服务器作为独立的 HTTP 服务运行，客户端通过网址连接。要给多人用、或部署在别的机器上时用这种。

用 Streamable HTTP 运行的官方命令：

```bash
uv run mcp run server.py --transport streamable-http
```

官方 README 接着给了一个客户端示例，用来验证服务器可以被调用：

```python
import asyncio

from mcp import Client


async def main() -> None:
    async with Client("http://localhost:8000/mcp") as client:
        result = await client.call_tool("add", {"a": 1, "b": 2})
        print(result.structured_content)  # {'result': 3}


asyncio.run(main())
```

官方说明：给 `Client` 传一个网址就表示用 Streamable HTTP；它也可以启动本地的 stdio 子进程。

## 六、接进客户端

- **Claude Code**：远程服务用 `claude mcp add --transport http`，本地 stdio 服务把启动命令放在 `--` 后面，写法见[《Claude Code MCP 配置教程》](/guides/claude-code-mcp-setup)；
- **Claude 桌面版**：在 `claude_desktop_config.json` 的 `mcpServers` 里加一项，见[《Claude Desktop MCP 配置》](/guides/claude-desktop-mcp-config-json)；
- **Cursor、Codex、Trae**：见[《Cursor MCP 配置教程》](/guides/cursor-mcp-config-json)、[《Codex 怎么配置 MCP》](/guides/codex-mcp-config)、[《Trae 规则与 MCP 配置教程》](/guides/trae-rules-mcp-config)。

SDK 的命令行还有一个 `mcp install` 子命令，具体用法以官方文档为准。

## 七、从 v1 升级：FastMCP 改名了

网上大量教程是按 v1 写的。官方《Migration Guide》里和入门相关的几条：

| 项目 | v1 | v2 |
| --- | --- | --- |
| 类名 | `FastMCP` | `MCPServer` |
| 导入 | `from mcp.server.fastmcp import FastMCP` | `from mcp.server.mcpserver import MCPServer, Context` |
| 装饰器 | `@mcp.tool()`、`@mcp.resource()`、`@mcp.prompt()` | 相同，官方说明参数和处理函数的签名与 v1 一致 |
| 传输方式的取值 | | `"stdio"`、`"sse"`、`"streamable-http"` |

迁移指南列了全部不兼容的改动，升级已有项目前通读一遍。v1.x 的文档官方另行保留。

## 八、写服务器时的几条规矩

**1. stdio 服务器不要 print。** 协议规定：服务器**不得**向标准输出写入任何不是合法 MCP 消息的内容；日志可以写到标准错误。在工具函数里随手 `print()` 一句调试信息，就会破坏通信，表现为客户端连不上或者莫名断开。

**2. 工具要小而明确。** 一个工具做一件事，参数用明确的类型；可选值有限时用枚举，而不是让模型自由填字符串。

**3. 报错信息写给模型看。** 工具失败时返回「哪里不对、期望什么」，模型才能自己修正后重试。

**4. 密钥走环境变量。** 不要写进代码，客户端配置里用各自的 `env` 传入。

**5. HTTP 服务要考虑安全。** 协议对 Streamable HTTP 的要求包括：校验 `Origin` 请求头、本地服务绑定到 127.0.0.1 而不是所有网卡、为连接实现鉴权。要对外提供服务时，这三条都要落实。

## 常见问题

**Q：必须用 uv 吗？**
不是。官方同时给了 `pip install` 的写法；文档里的命令以 `uv run` 开头，是因为它用 uv 管理项目环境。用 pip 时在已激活的虚拟环境里直接运行 `mcp dev server.py`。

**Q：FastMCP 还能用吗？**
官方 SDK 的 v2 里这个类已改名为 `MCPServer`。继续用 v1 的写法就要把依赖固定在 v1.x 版本。

**Q：用 TypeScript 可以吗？**
可以，MCP 官方也有 TypeScript 等语言的 SDK，本文没有覆盖。

**Q：客户端里看不到我的工具？**
先用 Inspector 确认服务器本身正常；再看客户端的日志。stdio 服务器重点查两件事：启动命令和路径是否是绝对路径、代码里有没有往标准输出打印内容。

## 参考资料

- MCP Python SDK（官方仓库）：https://github.com/modelcontextprotocol/python-sdk
- SDK 文档首页：https://github.com/modelcontextprotocol/python-sdk/blob/main/docs/index.md
- Migration Guide（v1 → v2）：https://github.com/modelcontextprotocol/python-sdk/blob/main/docs/migration.md
- mcp（PyPI）：https://pypi.org/project/mcp/
- Transports（MCP 规范）：https://modelcontextprotocol.io/specification/2025-11-25/basic/transports
