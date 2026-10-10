---
title: Cline 怎么用：安装、配置 API 与自定义模型、Plan / Act 模式、规则与 MCP 配置
slug: cline-setup-api-plan-act
products: [ai-tools]
models: []
accountTier: OTHER
excerpt: Cline 配置教程：在 VS Code / JetBrains 安装扩展、三种接入方式（Cline Provider、ClinePass、自带 Key）、用 OpenAI 兼容接口配置 DeepSeek 等自定义模型、Plan 与 Act 模式、.clinerules 规则、自动批准与 MCP 设置，按官方文档整理。
checkedOn: 2026-10-11
sources:
  - https://docs.cline.bot/getting-started/installing-cline
  - https://docs.cline.bot/getting-started/config
  - https://docs.cline.bot/core-workflows/plan-and-act
  - https://docs.cline.bot/customization/cline-rules
  - https://docs.cline.bot/features/auto-approve
  - https://docs.cline.bot/mcp/mcp-overview
  - https://docs.cline.bot/provider-config/openai-compatible
  - https://docs.cline.bot/provider-config/deepseek
  - https://docs.cline.bot/customization/clineignore
verify:
  - Cline Provider 与 ClinePass 的价格、额度本文未涉及，以官网定价页为准
  - 各模型提供方的 Base URL 与模型 ID 以提供方自己的文档为准，本文不列具体数值
  - Cline Desktop 的 Windows 版官方标注为 beta；Kanban 为 preview
---

> 本文根据 Cline 官方文档整理，资料核对于 2026-10-11。Cline 是开源的编程智能体，产品介绍见本站 AI 应用目录里的 Cline 条目。

## 适用于谁

- 想在 VS Code 或 JetBrains 里装一个开源、能自己选模型的编程智能体的人；
- 搜「cline 怎么用」「cline 配置 api」「cline 配置自定义模型」「cline mcp 配置」的人；
- 手里有某家模型的 API Key，想接进编辑器里用的人。

## 结论先说

1. Cline 有五种形态：**桌面 App**、**IDE 扩展**（VS Code、Cursor、JetBrains、Windsurf、VSCodium、Antigravity）、**CLI**、Kanban（预览）、SDK。多数人从 IDE 扩展开始。
2. 模型接入三选一：**Cline Provider**（按量付费）、**ClinePass**（包月）、**自带提供方的 API Key**。
3. 接「自定义模型」的关键是三项：**Base URL、API Key、Model ID**，在设置里选 **OpenAI Compatible**。
4. 两种模式：**Plan**（只读，只讨论不动手）和 **Act**（按计划改文件、跑命令）。官方强烈建议先 Plan 再 Act。
5. 规则放在 `.clinerules/` 或 `.cline/rules/`；Cline 还会**自动识别** `.cursorrules`、`.windsurfrules` 和 `AGENTS.md`。
6. 是否每一步都问你，由 **Auto Approve** 的开关决定；「YOLO 模式」等于全部放行，慎用。

## 步骤一：安装

**VS Code 及同类编辑器**：`Ctrl/Cmd+Shift+X` 打开扩展面板 → 搜索 `Cline` → **Install** → 在侧边栏找到 Cline 图标。Windsurf 和 VSCodium 走 Open VSX，流程相同。

**JetBrains**：**Settings → Plugins → Marketplace** 搜索 `Cline` → **Install** → 重启 IDE → **View → Tool Windows → Cline**。

**CLI**：需要 Node.js 20 及以上（官方推荐 22）：

```bash
npm install -g cline
cline auth
```

**桌面 App**：从 cline.bot/desktop 下载，支持 macOS 和 Windows（Windows 目前为 beta）。官方说明 Cline Desktop 是面向开放权重模型的开源应用，需要你自己提供模型访问。

## 步骤二：配置模型

装好后在 Cline 设置里（面板上的 ⚙️ 图标）完成提供方设置。

### 用官方直连的提供方（以 DeepSeek 为例）

1. 到 DeepSeek 开放平台注册登录，在 API keys 页点「Create new API key」；
2. **立刻复制**密钥——官方提醒之后无法再次查看，要妥善保存；
3. 在 Cline 设置的 **API Provider** 下拉里选 **DeepSeek**；
4. 把密钥粘到 **DeepSeek API Key** 一栏，选择模型。

官方文档为 Anthropic、OpenAI、Google Gemini、OpenRouter、AWS Bedrock、Qwen、MiniMax、Z.ai 等都写了同样格式的配置页，另有「30+ 其他提供方」的汇总。

### 用 OpenAI 兼容接口接「自定义模型」

任何提供 OpenAI 兼容接口的服务都可以这样接：

| 设置项 | 填什么 |
| --- | --- |
| API Provider | 选 **OpenAI Compatible** |
| Base URL | 提供方给的接口地址。官方强调这是关键一步，而且**不会是** `https://api.openai.com/v1`（那是 OpenAI 官方的） |
| API Key | 提供方给你的密钥 |
| Model | 选择或手动输入模型 ID，以提供方文档为准 |
| Model Configuration | 可选的高级项：最大输出 token、上下文窗口大小、是否支持图片、输入 / 输出单价等 |

本地模型（Ollama、LM Studio）也走这条路，官方有单独的《Running Models Locally》说明。

**关于密钥**：按官方的配置目录说明，提供方配置和 API Key 保存在本机的 `~/.cline/data/settings/providers.json`。这个文件不要提交进仓库，也不要在截图里露出来。只使用模型提供方官方发放的 Key。

## 步骤三：Plan 与 Act

**Plan 模式**：Cline 可以读代码库、搜索、和你讨论方案，但**不能改任何文件、不能执行命令**。官方说这个限制是有意的——让对话专注在理解和规划上。

**Act 模式**：带着规划阶段的完整上下文，开始改文件、跑命令。切换模式时对话历史会保留，不用重讲一遍。

官方的典型流程：

1. 在 Plan 模式描述你要做什么；
2. 让 Cline 探索相关文件、理解代码库；
3. 讨论方案，想清边界情况和潜在问题；
4. 有把握了，切到 Act；
5. Cline 按规划实施。

| 场景 | 建议模式 |
| --- | --- |
| 做法还不明朗的新功能、影响多个文件的架构决定 | Plan |
| 不确定哪里出了问题的棘手 bug | Plan |
| 代码审查、安全分析、熟悉新代码库 | Plan |
| 实施已经规划好的方案、照着已有模式做的例行修改 | Act |
| 跑测试并做调整、方案显而易见的小修 | Act |

复杂项目可以来回切：实施中遇到没预料到的复杂情况，就回 Plan 重新想。两种模式还可以分别指定不同的模型。

## 步骤四：写规则

规则是 Markdown 文件，为所有对话提供常驻指令。

| 规则类型 | 位置 | 说明 |
| --- | --- | --- |
| Cline 规则 | `.clinerules/`、`.cline/rules/` | 工作区规则目录，两个都支持，不必两边各放一份 |
| Cursor 规则 | `.cursorrules` | 自动识别 |
| Windsurf 规则 | `.windsurfrules` | 自动识别 |
| AGENTS.md | `AGENTS.md`、`~/.agents/AGENTS.md` | 跨工具的通用格式 |

**新建**：点 Cline 面板底部、模型选择器左边的天平图标 → **New rule file...** → 输入文件名（会自动加 `.md`）。也可以用 `/newrule` 让 Cline 交互式地帮你写。

**全局规则**的默认目录：Windows 为 `Documents\Cline\Rules`，macOS / Linux 为 `~/Documents/Cline/Rules`。工作区规则和全局规则会合并，**冲突时工作区优先**。

每条规则都有独立开关——比如做原型时临时关掉严格的测试规则，而不用删文件。建议一个文件只管一件事（编码规范、测试要求、架构决定各一个）。

## 步骤五：Auto Approve 怎么开

Auto Approve 按每次工具调用判断，分类授权：

| 开关 | 允许什么 |
| --- | --- |
| Read project files | 读、列、搜工作区内的文件 |
| Read all files | 读工作区以外的文件（需先开上一项） |
| Edit project files | 在工作区内创建和编辑文件 |
| Edit all files | 编辑工作区以外的文件（需先开上一项） |
| Execute safe commands | 运行被标为安全的终端命令 |
| Execute all commands | 运行需要批准的命令（需先开上一项） |
| Use the browser | 浏览器工具 |
| Use MCP servers | MCP 工具和资源 |

要特别注意官方的一句话：Cline **没有固定的命令白名单**，每条命令是「安全」还是「需要批准」，是**模型自己根据命令和参数标记的**——官方给的例子是示例而非保证：`npm test`、`git status`、`ls` 通常算安全，`npm install`、`rm -rf` 通常需要批准。

所以比较稳妥的组合是：开「读项目文件」「编辑项目文件」「执行安全命令」，其余保持关闭；不要开 Execute all commands 和 YOLO 模式，除非是在可以随时丢弃的环境里。

## 步骤六：配置 MCP

1. 在 Cline 面板顶部点 **MCP Servers** 图标；
2. **Configure** 标签页 → **Configure MCP Servers**，会打开扩展使用的 MCP 设置 JSON，在 `mcpServers` 下增改条目；
3. 接远程托管的服务器更简单：在 **Remote Servers** 标签页填 **Server Name**、**Server URL**，传输方式选 **Streamable HTTP**（推荐）或 SSE（旧），点 **Add Server**；
4. 配好凭据后，确认工具出现在列表里，并试调一次。

配置结构和其他工具一致：本地服务器用 `command` + `args`，远程服务器用 `url`。CLI 的 MCP 配置文件在 `~/.cline/data/settings/cline_mcp_settings.json`。挑选与审查见[《MCP 服务器怎么选》](/guides/mcp-servers-how-to-choose-audit)。

## 常见问题

**Q：`.clineignore` 能保护敏感文件吗？**
不能当安全措施用。官方已标注它即将弃用，并明确说它只是过滤「自动加载」的内容，**不是安全或访问控制边界**——被忽略的文件仍可通过 `@` 引用或 shell 命令读到。官方给的替代方案是用 `PreToolUse` hook 真正拦截工具调用。

**Q：改错了能回退吗？**
Cline 有 Checkpoints（检查点）功能可以回到之前的状态；同时仍建议在 Git 管理下使用。

**Q：全局配置和项目配置分别在哪？**
全局在 `~/.cline/`（对 IDE、CLI、SDK 都生效），项目在仓库根目录的 `.cline/`。

**Q：Cline 和 Cursor、Claude Code 怎么选？**
Cline 的特点是开源、模型自选、装进现有编辑器。它们的定位差异见[《Cursor、Claude Code、Codex 有什么区别》](/guides/cursor-vs-claude-code-vs-codex)。

## 参考资料

- Installing Cline（官方）：https://docs.cline.bot/getting-started/installing-cline
- Config（官方）：https://docs.cline.bot/getting-started/config
- Plan & Act Mode（官方）：https://docs.cline.bot/core-workflows/plan-and-act
- Rules（官方）：https://docs.cline.bot/customization/cline-rules
- Auto Approve & YOLO Mode（官方）：https://docs.cline.bot/features/auto-approve
- MCP（官方）：https://docs.cline.bot/mcp/mcp-overview
- OpenAI Compatible（官方）：https://docs.cline.bot/provider-config/openai-compatible
