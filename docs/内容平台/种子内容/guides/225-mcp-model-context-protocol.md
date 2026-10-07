---
title: MCP 是什么：Model Context Protocol 入门，以及在 Claude 里怎么用
slug: mcp-model-context-protocol
products: [claude]
models: []
accountTier: FREE
excerpt: MCP（模型上下文协议）是 Anthropic 发起的开放标准，让 AI 应用统一连接文件、数据库和各种工具。本文讲清它的结构、两种传输方式，以及在 claude.ai、桌面版、Claude Code、API 里怎么用。
checkedOn: 2026-10-07
sources:
  - https://modelcontextprotocol.io/docs/2026-07-28/getting-started/intro
  - https://modelcontextprotocol.io/docs/2026-07-28/learn/architecture
  - https://www.anthropic.com/news/model-context-protocol
  - https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp
  - https://support.claude.com/en/articles/10949351-getting-started-with-local-mcp-servers-on-claude-desktop
  - https://code.claude.com/docs/en/mcp
  - https://platform.claude.com/docs/en/agents-and-tools/mcp-connector
verify:
  - 协议版本以 modelcontextprotocol.io 当前文档（2026-07-28 版）为准；Free 用户自定义连接器数量限制取自帮助中心
---

> 本文根据 MCP 官方网站（modelcontextprotocol.io）、Anthropic 官方公告与 Claude 帮助中心、开发者文档整理，核对日期 2026-10-07；示意图引用自 MCP 官方文档。

## 适用于谁

- 经常听到「MCP」「MCP 服务器」，想搞清楚它到底是什么的人（「mcp 是什么意思」）；
- 想让 Claude 读写 Notion、GitHub、数据库、公司内部系统的人；
- 准备自己做一个 MCP 服务器、接入 Claude 的开发者。

## 结论先说

1. **MCP（Model Context Protocol，模型上下文协议）是一个开源标准**，用来把 AI 应用和外部系统连接起来。Anthropic 于 2024 年 11 月 25 日开源发布，现在 Claude、ChatGPT、VS Code、Cursor 等都支持。
2. 官方的比喻：**MCP 就像 AI 应用的 USB-C 接口**——以前每接一个数据源都要单独开发一次，现在按统一协议做一次，就能在支持 MCP 的各种 AI 应用里用。
3. 结构很简单：**AI 应用（主机）← MCP 客户端 → MCP 服务器**。服务器向 AI 提供三种东西：**工具**（可执行的操作）、**资源**（上下文数据）、**提示词**（可复用模板）。
4. 两种连接方式：**本地 stdio**（服务器在你电脑上作为进程运行）和**远程 Streamable HTTP**（服务器在网上，通常用 OAuth 登录）。
5. 在 Claude 里：claude.ai / 桌面版 / 手机上叫「**连接器（Connectors）**」，可添加远程 MCP 作为自定义连接器（Free 限 1 个）；桌面版还能装本地 MCP「扩展」；Claude Code 用 `claude mcp add`；API 有「MCP connector」功能。

![MCP 示意图：左边是 AI 应用（聊天界面如 Claude Desktop、IDE 如 Claude Code 等），右边是数据源和工具（数据库、开发工具、办公工具），中间通过统一的 MCP 协议双向连接](seed:g225-mcp-diagram.png)
*图片来源：[MCP 官方文档《What is the Model Context Protocol》](https://modelcontextprotocol.io/docs/2026-07-28/getting-started/intro)*

## 一、为什么需要 MCP

Anthropic 在发布公告里讲的问题是：模型能力再强，也被「数据孤岛」困住——每接一个新的数据源都要写一套定制集成，系统越多越难维护。MCP 用一个通用的开放标准取代零散的集成。

按官方网站的说法，它对不同的人有不同好处：

- **开发者**：做或接入 AI 应用时更省时省事；
- **AI 应用 / 智能体**：能用上整个生态里的数据源和工具；
- **普通用户**：AI 能访问你的数据、在需要时替你执行操作。

官方举的例子：智能体可以访问你的 Google 日历和 Notion，做更懂你的助手；Claude Code 可以根据 Figma 设计稿生成整个网页应用；企业聊天机器人可以连上组织内多个数据库，让员工用聊天来分析数据。

## 二、MCP 的结构（看懂这三个角色就够了）

| 角色 | 是什么 | 例子 |
| --- | --- | --- |
| MCP 主机（Host） | 使用 MCP 的 AI 应用 | Claude Code、Claude 桌面版、VS Code |
| MCP 客户端（Client） | 主机里负责和某个服务器保持连接的组件，**每个服务器一个客户端** | — |
| MCP 服务器（Server） | 向客户端提供上下文和能力的程序，可以在本地或远程运行 | 文件系统服务器、Sentry 服务器、GitHub 服务器 |

**服务器能提供的三种「原语」：**

| 原语 | 作用 | 举例 |
| --- | --- | --- |
| 工具（Tools） | AI 可以调用的可执行函数 | 查询数据库、调用 API、写文件 |
| 资源（Resources） | 给 AI 提供上下文的数据 | 文件内容、数据库表结构、API 返回的数据 |
| 提示词（Prompts） | 可复用的交互模板 | 系统提示、少样本示例 |

客户端会先用 `tools/list` 之类的方法发现服务器有哪些能力，再按需调用；服务器的能力变化时可以发通知让客户端更新。客户端一侧也可以向服务器提供「征询（Elicitation）」能力，让服务器在需要时向用户要更多信息或请求确认。

**底层协议**：基于 JSON-RPC 2.0。**两种传输方式：**

- **stdio**：通过标准输入输出和本机进程通信，没有网络开销，适合本地服务器；
- **Streamable HTTP**：用 HTTP 通信，适合远程服务器，支持 Bearer token、API Key 等认证，协议推荐用 OAuth 获取令牌。

## 三、在 Claude 里怎么用

### 1. claude.ai / 桌面版 / 手机：连接器

Claude 里把 MCP 服务器叫作**连接器**。除了官方目录里的现成连接器，还可以添加**自定义连接器**（远程 MCP）：

- 帮助中心说明自定义连接器在 Free、Pro、Max、Team、Enterprise 上都可用，**Free 用户限 1 个**；
- 个人 Pro / Max：进入 **Customize → Connectors**，点 **+ Add → Add custom connector**，填入远程 MCP 服务器地址；
- Team / Enterprise：由 Owner 等管理员先添加到组织，成员再各自连接、授权。

注意：远程连接器是**从 Anthropic 的云端**去连接你的 MCP 服务器，而不是从你的电脑连接，所以服务器必须能从公网访问；放在公司内网、VPN 后面的服务器需要把 Anthropic 的 IP 加入防火墙白名单。

连接器的详细用法详见本站《Claude Connectors（连接器）怎么用：连接 Google Drive、Gmail 等与推荐》。

### 2. Claude 桌面版：本地 MCP（桌面扩展）

本地 MCP 服务器跑在你自己的电脑上，可以访问本地文件和程序。现在官方推荐用**桌面扩展（Desktop Extensions）**一键安装：在桌面版进入 **Settings → Extensions → Browse extensions**，选择经过 Anthropic 审核的扩展点 Install；自己做的 `.mcpb` 扩展包可以在 Advanced settings 里安装。也可以按 MCP 官方教程手动编辑 `claude_desktop_config.json`（macOS 在 `~/Library/Application Support/Claude/`，Windows 在 `%APPDATA%\Claude\`）。

本地 MCP 只在桌面版可用，Cowork 和 claude.ai 网页版里用不了。

### 3. Claude Code

在终端里一行命令添加：

```bash
claude mcp add --transport http notion https://mcp.notion.com/mcp
```

会话里用 `/mcp` 查看状态、登录授权。完整配置方法详见本站《Claude Code MCP 配置教程：claude mcp add、配置文件位置与常用 MCP》。

### 4. Claude API：MCP connector

开发者在调用 Messages API 时，可以直接在请求里声明远程 MCP 服务器，由 API 帮你连接并调用其中的工具，不用自己实现 MCP 客户端。该功能目前是 beta（需要特定的 beta 请求头），支持白名单 / 黑名单方式选择要启用的工具，也支持 OAuth Bearer 令牌。具体写法见官方《MCP connector》文档。

## 四、安全须知

- **只连接你信任的服务器**：帮助中心提醒，自定义连接器可以连接未经 Anthropic 验证的服务，连接后 Claude 能按你的权限访问、甚至修改那些服务里的数据；
- 授权通常走 OAuth，Claude 不会看到你的密码；随时可以在 Claude 设置或对方服务的安全设置里断开、撤销授权；
- 团队里使用共享 API Key 的连接器时，所有使用者都会拿到这个 Key 的权限，要用权限最小的 Key；
- MCP 服务器返回的内容可能来自网页、邮件等不可信来源，存在提示词注入风险；本地服务器能执行程序，安装前确认来源可靠。

## 五、想自己做一个 MCP 服务器？

MCP 官方提供多种语言的 SDK、服务器 / 客户端开发教程、调试工具 MCP Inspector，以及一批参考服务器实现（GitHub：modelcontextprotocol/servers）。做好的远程服务器可以作为自定义连接器接入 Claude，本地服务器可以打包成桌面扩展。想把它提交到 Anthropic 的连接器目录，见帮助中心的提交说明。

## 常见问题

**Q：MCP 和 Function Calling（工具调用）有什么区别？**
工具调用是某个模型 API 的功能：你在请求里定义工具，自己执行。MCP 是一个**跨应用的连接标准**：把工具、数据按统一协议做成服务器，任何支持 MCP 的 AI 应用都能接入。在 Claude 里，MCP 服务器提供的工具最终也是以工具调用的方式被模型使用。工具调用详见本站《Claude Tool Use（工具调用 / Function Calling）入门：定义工具与返回 tool_result》。

**Q：MCP 和 Skills（技能）是一回事吗？**
不是。MCP 让 Claude **能连上**外部系统；技能是一份告诉 Claude **怎么做**某类工作的说明书（可附带脚本）。两者常常搭配使用。技能详见本站《Claude Skills 是什么、怎么装、推荐哪些》。

**Q：用 MCP 要付费吗？**
协议本身开源免费。在 claude.ai 上，Free 用户也能添加 1 个自定义连接器；第三方服务本身是否收费取决于该服务。

**Q：MCP 只能用在 Claude 上吗？**
不是。官方网站列出 ChatGPT、VS Code、Cursor 等都支持 MCP，「做一次、到处用」正是它的意义。

## 参考资料

- What is the Model Context Protocol（MCP 官方）：https://modelcontextprotocol.io/docs/2026-07-28/getting-started/intro
- Architecture overview（MCP 官方）：https://modelcontextprotocol.io/docs/2026-07-28/learn/architecture
- Introducing the Model Context Protocol（Anthropic 公告，2024-11-25）：https://www.anthropic.com/news/model-context-protocol
- Get started with custom connectors using remote MCP（帮助中心）：https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp
- Getting started with local MCP servers on Claude Desktop（帮助中心）：https://support.claude.com/en/articles/10949351-getting-started-with-local-mcp-servers-on-claude-desktop
- Connect Claude Code to tools via MCP（官方）：https://code.claude.com/docs/en/mcp
- MCP connector（Claude API 官方）：https://platform.claude.com/docs/en/agents-and-tools/mcp-connector
