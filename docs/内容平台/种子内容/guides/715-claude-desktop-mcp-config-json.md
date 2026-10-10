---
title: Claude Desktop MCP 配置教程：claude_desktop_config.json 在哪、怎么写、不生效怎么查
slug: claude-desktop-mcp-config-json
products: [claude]
models: []
topics: [ai-agent]
accountTier: FREE
excerpt: Claude 桌面版怎么手动配置本地 MCP 服务器？按 MCP 官方教程讲清 Edit Config 入口、claude_desktop_config.json 在 macOS 和 Windows 上的路径、完整 JSON 写法、重启后在哪看工具，以及不生效时的日志位置和五步排查。
checkedOn: 2026-10-11
sources:
  - https://modelcontextprotocol.io/docs/develop/connect-local-servers
verify:
  - 菜单名称（Settings、Developer、Edit Config、Manage connectors）取自官方英文教程，界面语言不同或版本更新后以实际为准
  - 官方教程以 @modelcontextprotocol/server-filesystem 为例，其他服务器的包名和参数以各自 README 为准
  - 本文只讲手动编辑配置文件这一种方式；桌面扩展和远程连接器见文内链接的教程
---

> 本文根据 MCP 官方教程《Connect to local MCP servers》整理，资料核对于 2026-10-11。没有登录账号操作，菜单名称取自官方教程原文。Claude 桌面版的下载安装见[《Claude 桌面版》](/guides/claude-desktop-app)；一键安装的桌面扩展和远程连接器见[《Claude 连接器》](/guides/claude-connectors)。

## 适用于谁

- 搜「claude desktop mcp 配置」「claude desktop 如何配置 mcp」「claude desktop mcp config file」的人；
- 某个 MCP 服务器的 README 里只给了一段 `mcpServers` 的 JSON，不知道该粘到哪的人；
- 配置写好了，重启后 Claude 里却看不到那个服务器的人。

## 结论先说

1. **入口在菜单栏的 Claude 菜单 → Settings → Developer → Edit Config**。注意是系统菜单栏里的 Claude 菜单，不是对话窗口里的账号设置。
2. **配置文件叫 `claude_desktop_config.json`**：macOS 在 `~/Library/Application Support/Claude/`，Windows 在 `%APPDATA%\Claude\`。
3. **写法是一个 `mcpServers` 对象**，每个服务器一项，包含 `command`（用什么启动）和 `args`（参数）。
4. **改完必须完全退出再重开** Claude Desktop，不是关窗口。
5. **不生效先看日志**：macOS 在 `~/Library/Logs/Claude`，Windows 在 `%APPDATA%\Claude\logs`。

## 一、准备

- **Claude Desktop**：官方教程写的是支持 macOS 和 Windows。已经装了的话，在 Claude 菜单里选「Check for Updates...」确认是最新版；
- **Node.js**：教程用的 filesystem 服务器以及很多其他 MCP 服务器需要它。在终端里运行下面的命令确认已安装，没有的话去 nodejs.org 下载，官方建议用 LTS 版本。

```bash
node --version
```

## 二、打开配置文件

1. 点击**系统菜单栏**里的 Claude 菜单，选择「Settings...」。官方特别强调不是 Claude 窗口内部的设置；
2. 在设置窗口左侧选 **Developer** 标签；
3. 点击 **Edit Config** 按钮。

这一步会打开配置文件；文件不存在时会新建一个。位置是：

| 系统 | 路径 |
| --- | --- |
| macOS | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| Windows | `%APPDATA%\Claude\claude_desktop_config.json` |

## 三、写入服务器配置

官方教程的例子是 filesystem 服务器，让 Claude 能读写你指定的文件夹。

macOS：

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "/Users/username/Desktop",
        "/Users/username/Downloads"
      ]
    }
  }
}
```

Windows：

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "C:\\Users\\username\\Desktop",
        "C:\\Users\\username\\Downloads"
      ]
    }
  }
}
```

把 `username` 换成你电脑的用户名。各部分的含义：

| 写法 | 含义 |
| --- | --- |
| `"filesystem"` | 服务器的名称，会显示在 Claude Desktop 里，可以自己起 |
| `"command": "npx"` | 用 Node.js 自带的 npx 来运行服务器 |
| `"-y"` | 自动确认安装服务器的包 |
| `"@modelcontextprotocol/server-filesystem"` | filesystem 服务器的包名 |
| 其余参数 | 允许这个服务器访问的目录 |

三个写的时候容易出错的地方：

- **Windows 路径里的反斜杠要写两个**（`C:\\Users\\...`），这是 JSON 的转义规则；
- **路径必须是绝对路径**，不能用相对路径；
- **要加第二个服务器，是在 `mcpServers` 里再加一项**，用逗号隔开，而不是再写一个 `mcpServers`。

官方的安全提醒：只授权你愿意让 Claude 读取和修改的目录。服务器以你的用户账号权限运行，你能手动做的文件操作它都能做。不要图省事把整个主目录交出去。

## 四、重启并确认

1. 保存文件后，**完全退出** Claude Desktop 再重新打开；
2. 点击对话输入框左下角的加号按钮（官方教程里叫「Add files, connectors, and more」）；
3. 把鼠标移到 **Connectors** 上，点 **Manage connectors**；
4. 在列表里选中 `filesystem`，可以看到它提供的工具。

## 五、试着用

官方给的几个测试说法：

- 「写一首诗并保存到我的桌面」；
- 「我的下载文件夹里有哪些和工作相关的文件？」；
- 「把桌面上的所有图片整理到一个叫 Images 的新文件夹里」。

**每次操作前 Claude 都会请求你批准**。弹出的请求仔细看一眼再同意，不放心就拒绝。

## 六、服务器没出现：五步排查

官方教程的排查顺序：

1. **完全重启** Claude Desktop；
2. **检查 JSON 语法**。多一个逗号、少一个引号都会让整个文件失效；
3. **检查路径**：配置里的路径是否存在，是否为绝对路径；
4. **看日志**（位置见下一节）；
5. **在终端里手动运行一遍服务器**，看有没有报错：

```bash
npx -y @modelcontextprotocol/server-filesystem /Users/username/Desktop /Users/username/Downloads
```

Windows 上把路径换成 `C:\Users\username\Desktop` 这样的写法。手动运行都起不来的话，问题在服务器或 Node.js 环境，而不在 Claude。

## 七、日志在哪

| 系统 | 日志目录 |
| --- | --- |
| macOS | `~/Library/Logs/Claude` |
| Windows | `%APPDATA%\Claude\logs` |

- `mcp.log`：MCP 连接和连接失败的总体日志；
- `mcp-server-服务器名.log`：对应服务器的标准错误输出。官方说明 stdio 服务器可能把所有日志都写到标准错误，所以这个文件里的内容不一定都是错误。

查看最近的日志并持续跟踪（macOS / Linux）：

```bash
tail -n 20 -f ~/Library/Logs/Claude/mcp*.log
```

Windows（只显示最近的日志）：

```powershell
type "%APPDATA%\Claude\logs\mcp*.log"
```

## 八、Windows 上的 ENOENT 与 ${APPDATA} 报错

官方教程专门列了这个问题：服务器加载失败，日志里出现路径中带 `${APPDATA}` 的报错。解决办法是在该服务器的配置里加上 `env`，把 `%APPDATA%` 展开后的实际值写进去，形如：

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "C:\\Users\\username\\Desktop"],
      "env": {
        "APPDATA": "C:\\Users\\username\\AppData\\Roaming\\"
      }
    }
  }
}
```

改完重新启动 Claude Desktop。

官方还提醒：如果 npm 没有全局安装，`npx` 可能仍然失败。全局安装过的话，系统里会有 `%APPDATA%\npm` 这个目录；没有的话运行：

```bash
npm install -g npm
```

## 九、工具调用悄悄失败

Claude 尝试使用工具但没有成功时，官方给的三步：看 Claude 的日志里有没有报错；确认服务器能正常构建和运行；重启 Claude Desktop。

还不行的话，用 MCP 官方的调试工具单独连这个服务器，排除 Claude 这一侧的因素，见[《MCP Inspector 怎么用》](/guides/mcp-inspector-how-to-use-debug)。

## 常见问题

**Q：需要密钥的服务器怎么配？**
在该服务器的配置里加 `env` 对象，把密钥作为环境变量传入，变量名按那个服务器的 README 来。配置文件里有密钥时，注意不要把它同步到网盘或发给别人。

**Q：这和「连接器」「桌面扩展」是什么关系？**
三种都是让 Claude 用上 MCP 的方式。连接器是远程服务，在界面里点几下登录即可；桌面扩展是打包好的本地服务器，一键安装；手动编辑配置文件最灵活，任何提供了 `mcpServers` 写法的服务器都能配，也最需要自己把关。

**Q：这份配置能给 Claude Code 用吗？**
两者的配置文件不是同一个。Claude Code 用 `claude mcp add` 命令或项目里的 `.mcp.json`，见[《Claude Code MCP 配置教程》](/guides/claude-code-mcp-setup)。`mcpServers` 里每一项的写法是相通的。

**Q：能装哪些服务器、怎么判断靠不靠谱？**
本地 MCP 服务器是以你的身份运行的程序，先审再装，见[《MCP 服务器怎么选、装之前怎么审》](/guides/mcp-servers-how-to-choose-audit)。本地和远程的区别见[《MCP 的 stdio、SSE 和 Streamable HTTP 有什么区别》](/guides/mcp-stdio-vs-streamable-http-sse)。

## 参考资料

- Connect to local MCP servers（MCP 官方教程）：https://modelcontextprotocol.io/docs/develop/connect-local-servers
