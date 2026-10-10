---
title: MCP Inspector 怎么用：安装、启动命令、调试 MCP 服务器与 v2 的变化
slug: mcp-inspector-how-to-use-debug
products: [ai-tools, claude]
models: []
topics: [ai-agent]
accountTier: FREE
excerpt: MCP Inspector 是什么、怎么安装和使用？按 MCP 官方文档讲清网页、命令行、终端界面三种模式的启动命令，怎么连本地和远程服务器、怎么传环境变量，密钥存在哪，以及 v2 相比旧教程在端口、令牌变量名和 Node 版本上的变化。
checkedOn: 2026-10-11
sources:
  - https://modelcontextprotocol.io/docs/tools/inspector
  - https://github.com/modelcontextprotocol/inspector
  - https://github.com/modelcontextprotocol/inspector/blob/main/docs/v1-to-v2-migration.md
verify:
  - 本文按 Inspector v2 编写；官方说明 v1 只接收安全修复，可用 @v1-latest 标签继续使用
  - 网页界面各标签页的具体布局没有逐项核对，以官方 Web client 文档和实际界面为准
  - 端口号（6274、6275、6278）取自官方迁移文档
---

> 本文根据 MCP 官方文档《MCP Inspector》、Inspector 仓库 README 和《v1 → v2 migration》整理，资料核对于 2026-10-11。没有在本机运行，界面细节以官方文档为准。

## 适用于谁

- 搜「mcp inspector 使用」「mcp inspector 怎么用」「mcp inspector 安装」「mcp inspector 是什么」的人；
- 自己写了 MCP 服务器，想在接进 Claude 或 Cursor 之前先单独测一下的人；
- 别人的 MCP 服务器在客户端里连不上，想弄清是服务器的问题还是配置的问题的人；
- 照着旧教程敲命令，发现端口和参数对不上的人。

## 结论先说

1. **MCP Inspector 是 MCP 官方的调试工具**，用来测试和调试 MCP 服务器：连上去，看它提供了哪些工具、资源和提示，手动调用并查看往来的消息。
2. **不用安装**，一条 `npx @modelcontextprotocol/inspector` 就能运行。要求 **Node 22.19.0 或更高**。
3. **一个包、三种界面**：默认是浏览器里的网页界面；加 `--cli` 是可以写进脚本的命令行；加 `--tui` 是终端里的交互界面。
4. **启动后打印的地址里带着一次性的访问令牌**，要用那个完整地址打开。
5. **现在是 v2**。旧教程里的代理端口 6277 已经没有了，令牌的环境变量也改了名。

## 一、三种模式

| 模式 | 启动方式 | 用途 |
| --- | --- | --- |
| 网页 | `npx @modelcontextprotocol/inspector` | 浏览器里的完整图形界面，默认模式，功能最全 |
| 命令行 | `npx @modelcontextprotocol/inspector --cli` | 可脚本化、输出机器可读，适合 CI、管道和给编程智能体用 |
| 终端界面 | `npx @modelcontextprotocol/inspector --tui` | 终端里的交互界面，没有浏览器或不想开浏览器时用 |

官方说明三者基于同一套内核：同样的传输方式、同样的配置文件、同样的 OAuth 状态，连接行为一致。

模式参数必须放在命令的**最前面**，并且最多只能有一个。

## 二、网页模式：连一个本地服务器

把启动服务器的命令原样跟在 Inspector 后面：

```bash
# 启动网页界面，连接一个本地的 stdio 服务器
npx @modelcontextprotocol/inspector node path/to/server/index.js

# 或者不带目标启动，在界面里添加服务器
npx @modelcontextprotocol/inspector
```

命令会打印一个带有本次启动专用令牌的地址，并自动在浏览器里打开。不想自动打开时，设置环境变量 `MCP_AUTO_OPEN_ENABLED=false`。

**连接已发布的服务器**，同样是把它的启动命令跟在后面。官方的 npm 包示例：

```bash
npx -y @modelcontextprotocol/inspector npx @modelcontextprotocol/server-filesystem ~/Desktop
```

Python 包发布的服务器也是一样的做法，把它的启动命令（例如通过 uv 的工具运行器启动）接在后面即可。官方提醒：每个服务器需要的命令和参数都不同，先读它自己的 README。

**连接远程服务器**，用 `--server-url`：

```bash
npx @modelcontextprotocol/inspector --server-url https://api.example.com/mcp --transport http
```

迁移文档补充：不写 `--transport` 时，网址必须以 `/mcp` 或 `/sse` 结尾，工具才能判断传输方式；否则要显式写 `--transport http` 或 `--transport sse`。

**给 stdio 服务器传环境变量**，用 `-e`：

```bash
npx @modelcontextprotocol/inspector -e KEY=value -- node build/index.js
```

## 三、在网页界面里做什么

连接成功后，典型的检查顺序：

1. **看工具列表**：名称、说明和参数定义是不是你期望的。模型只看得到这些，说明写得含糊，模型就用不对；
2. **手动调用工具**：填参数，执行，看返回的结果和报错；
3. **看资源和提示**：服务器有提供的话，逐个读取确认；
4. **看消息往来**：界面里可以查看 JSON-RPC 的请求和响应，定位是请求格式不对还是服务器处理出错。

官方文档有一页专门逐个标签页介绍网页界面，界面随版本变化，细节以那一页为准。

## 四、命令行模式

适合写进脚本或 CI。官方示例：

```bash
# 列出服务器的工具然后退出
npx @modelcontextprotocol/inspector --cli node path/to/server/index.js --method tools/list

# 调用一个工具，把结果交给 jq
npx @modelcontextprotocol/inspector --cli https://api.example.com/mcp --transport http \
  --method tools/call --tool-name get_weather --tool-arg city=Boston --format json | jq .result
```

两条容易出错的规则（来自迁移文档）：

- `--cli` 模式下，**目标必须写在所有参数之前**，否则会被悄悄丢掉；
- 退出码从 v1 的 0 / 1 变成了 0 到 5，工具调用失败（结果里 `isError: true`）现在以 5 退出。以前失败后仍继续执行的 CI 流程可能因此中断。

## 五、密钥存在哪

官方的警告：Inspector 会保存一些敏感信息，包括 OAuth 令牌、OAuth 客户端密钥，以及 stdio 服务器 `env:` 里的值。

- 系统有钥匙串时，存进操作系统的钥匙串；
- 没有钥匙串的机器（官方列举了缺少相应组件的 Linux、无界面和 SSH 会话、容器等）会存到 `~/.mcp-inspector/secrets.json`，**除非你提供密钥，否则是不加密的**。

在服务器、容器或共享机器上用 Inspector 调试带密钥的服务时，要留意这个文件。

## 六、服务器列表：config 与 catalog

| 参数 | 行为 |
| --- | --- |
| `--config` | 只读：读取一个文件，永远不写入；文件不存在会报错 |
| `--catalog` | 可写：文件不存在时会创建，可以在网页界面里编辑 |
| 都不写 | 使用 `~/.mcp-inspector/mcp.json`，或环境变量 `MCP_CATALOG_PATH` 指定的路径 |

两者不能同时使用。官方说明 v1 时期的 `mcpServers` 格式文件可以原样使用，也就是说，客户端里那份 MCP 配置可以直接拿来给 Inspector 读。

## 七、旧教程对不上：v1 到 v2 改了什么

| 项目 | v1 | v2 |
| --- | --- | --- |
| Node 版本 | 22.7.5 及以上 | 22.19.0 及以上 |
| npm 包 | 四个包 | 只有 `@modelcontextprotocol/inspector` 一个 |
| 端口 | 网页 6274，代理 6277 | 没有代理了，6277 不再使用；界面只需要 6274。另有 MCP Apps 沙箱用的 6275 等端口 |
| 令牌环境变量 | `MCP_PROXY_AUTH_TOKEN` | `MCP_INSPECTOR_API_TOKEN`（旧名在新名未设置时仍作为过渡可用） |
| 地址里的令牌参数 | `?MCP_PROXY_AUTH_TOKEN=` | `?MCP_INSPECTOR_API_TOKEN=`，旧写法不再有效 |
| `DANGEROUSLY_OMIT_AUTH` | 任何非空值都会关闭鉴权 | 只有 `true` 或 `1` 才关闭 |
| 监听所有网卡 | | `HOST=0.0.0.0` 会被拒绝，除非另设 `DANGEROUSLY_BIND_ALL_INTERFACES=true` |

想继续用旧版：

```bash
npx @modelcontextprotocol/inspector@v1-latest
```

官方说明 v1 这条线只接收安全修复。

## 八、安全提醒

- **不要关闭鉴权**。带 `DANGEROUSLY_` 前缀的变量名字已经说明了风险：Inspector 能启动本机进程，关掉令牌校验等于让能访问那个端口的任何页面或程序都能借它执行命令；
- **不要监听到所有网卡**，除非你清楚网络环境并且做了访问控制；
- **调试第三方服务器等于运行它**。Inspector 只是帮你启动并连接，服务器进程照样以你的身份运行。来源不明的服务器先审再跑，见[《MCP 服务器怎么选、装之前怎么审》](/guides/mcp-servers-how-to-choose-audit)。

## 常见问题

**Q：提示 Node 版本不满足？**
v2 要求 22.19.0 及以上。迁移文档说明 npm 默认只是警告，除非你设了 `engine-strict=true`。升级 Node，或者改用 `@v1-latest`。

**Q：打开页面提示未授权？**
用启动时终端里打印的那个完整地址，它带着本次启动的令牌。手动输入不带令牌的地址会被拒绝。

**Q：写 Python 服务器时怎么用？**
官方 Python SDK 的 `mcp dev server.py` 会直接启动服务器并打开 Inspector，见[《MCP Server 开发入门（Python）》](/guides/mcp-server-python-sdk-build-quickstart)。

**Q：Inspector 里正常，客户端里不正常？**
说明服务器没问题，问题在客户端配置：启动命令的路径是否为绝对路径、环境变量有没有传进去、配置文件的 JSON 是否合法。各客户端的配置见[《Claude Code MCP 配置教程》](/guides/claude-code-mcp-setup)和[《Claude Desktop MCP 配置》](/guides/claude-desktop-mcp-config-json)。

## 参考资料

- MCP Inspector（MCP 官方文档）：https://modelcontextprotocol.io/docs/tools/inspector
- modelcontextprotocol/inspector（官方仓库）：https://github.com/modelcontextprotocol/inspector
- v1 → v2 migration：https://github.com/modelcontextprotocol/inspector/blob/main/docs/v1-to-v2-migration.md
