---
title: Trae 规则与 MCP 配置教程：.trae/rules 四种生效方式、导入 AGENTS.md、添加 MCP Server
slug: trae-rules-mcp-config
products: [ai-tools]
models: []
accountTier: FREE
excerpt: Trae rules 怎么配置、Trae 怎么用 MCP？按 TRAE 官方中文文档讲清全局规则与项目规则的位置、四种生效方式、子目录与多层嵌套、导入 AGENTS.md / CLAUDE.md、提交信息规则，以及从市场添加和手动配置 MCP Server、项目级 mcp.json。
checkedOn: 2026-10-11
sources:
  - https://docs.trae.ai/ide/rules
  - https://docs.trae.ai/ide/model-context-protocol
  - https://docs.trae.ai/ide/add-mcp-servers
verify:
  - 本文按 docs.trae.ai 的简体中文文档整理；国内版（trae.cn）与国际版的界面、可用模型和 MCP 市场内容可能不同
  - 官方文档中产品名同时出现 TRAE 与 TraeCode，菜单名称以你安装的版本为准
  - SOLO 模式、技能（Skill）、钩子（Hook）、记忆等本文未展开
---

> 本文根据 TRAE 官方文档《规则（Rule）》《MCP 概览》《添加 MCP Server》整理，资料核对于 2026-10-11。Trae 国内版与国际版怎么选、SOLO 模式是什么，见本站 AI 应用目录里的 TRAE 条目；本文只讲规则和 MCP 两项配置。

## 适用于谁

- 用 Trae 写代码，想让 AI 固定遵守代码风格和项目约定的人；
- 搜「trae rules 配置」「trae rules 最佳实践」「trae mcp 配置」「trae mcp 启动失败」的人；
- 从 Cursor、Claude Code 迁到 Trae，想复用已有规则文件和 MCP 配置的人。

## 结论先说

1. Trae 的规则分两类：**全局规则**（所有项目生效，存在用户目录的 `.trae/user_rules`）和**项目规则**（项目里的 `.trae/rules/`，Markdown 文件）。
2. 项目规则有四种生效方式：**始终生效、指定文件生效、智能生效、手动触发生效**，对应 `alwaysApply`、`globs`、`description` 三个属性。
3. Trae 能读项目根目录的 **AGENTS.md、CLAUDE.md、CLAUDE.local.md**，但要在设置里**手动打开开关**。
4. MCP Server 两种加法：**从内置的 MCP 市场添加**，或**手动填 JSON**。支持 stdio、SSE、Streamable HTTP 三种传输。
5. 想把 MCP 配置跟着项目走，先打开「启用项目级 MCP」，再在项目的 `.trae/mcp.json` 里写。
6. 官方免责声明：MCP Server 由第三方构建和维护，**TRAE 不审查也不为其行为负责**。

## 一、规则放在哪

| 类型 | 生效范围 | 位置 |
| --- | --- | --- |
| 全局规则 | 所有项目 | macOS / Linux：`~/.trae/user_rules`；Windows：`%userprofile%/.trae/user_rules` |
| 项目规则 | 仅当前项目 | 项目路径下的 `.trae/rules/` |

## 二、创建规则

**全局规则**：在 IDE 窗口进入 **设置 > 规则与记忆**，在「规则」部分点 **+ 创建**，选 **全局**，输入内容后保存。适合写个人偏好，例如官方示例里的：

```text
所有回答都使用中文表述。
如需提供代码，为关键逻辑和可能造成理解困难的部分添加简明的中文注释。
当生成的代码超过 20 行时，优先考虑是否可以进行适当的抽象或聚合。
```

**项目规则**：

1. 打开项目，进入 **设置 > 规则与记忆**；
2. 点 **+ 创建**，选 **项目**；
3. 输入规则名称并确认——系统会自动创建 `.trae/rules` 文件夹和规则文件，并在编辑器里打开；
4. 选择**生效方式**，按下表填写属性；
5. 在 `---` 下方用 Markdown 写规则内容，保存。

| 生效方式 | 含义 | 要填的属性 |
| --- | --- | --- |
| 始终生效 | 当前项目所有 AI 对话都带上 | `alwaysApply` 自动设为 `true` |
| 指定文件生效 | 对话里提及的文件匹配通配符时生效 | `alwaysApply: false`，在「文件匹配模式」里填通配符（如 `*.js`、`src/**/*.ts`，多个用逗号分隔），同步到 `globs` |
| 智能生效 | AI 根据描述判断是否相关 | `alwaysApply: false`，在「描述」里写适用场景，同步到 `description` |
| 手动触发生效 | 只有在对话里用 `#Rule` 提到时 | `alwaysApply: false` |

`#Rule` 引用的优先级最高：即使是「指定文件生效」或「智能生效」的规则，只要你在对话里用 `#Rule` 点名，这次对话就会用上它。

## 三、规则多了怎么组织

**多层嵌套**：可以在 `.trae/rules/` 下建子文件夹归类，系统会递归读取，**最多支持 3 层**，更深的不识别。

```text
.trae/rules/
├── general-rules.md            # 通用规则
├── frontend/
│   ├── react-best-practices.md
│   └── testing/
│       └── unit-test-rules.md
└── backend/
    └── api-design.md
```

**给子目录单独配规则**：Trae 会读取项目里**任意子目录下的 `.trae/rules/`**（以及该目录下的 `AGENTS.md`）。只有当你在对话中提到该目录下的文件，或 AI 执行任务时读到了该目录下的文件，这些专属规则才会带上。大型项目里，前端模块、后端模块各放各的规则，互不干扰。

## 四、复用 AGENTS.md 和 CLAUDE.md

Trae 兼容两类位于**项目根目录**的规则文件：

- **AGENTS.md**：跨工具的通用规范，需要你手动放到项目根目录；
- **CLAUDE.md 和 CLAUDE.local.md**：Claude Code 的项目规则文件，从 Claude Code 迁移项目时会随项目带入。

让它们生效的步骤：进入 **设置 > 规则与记忆**，在「导入设置」处打开 **将 AGENTS.md 包含在上下文中** 和 **将 CLAUDE.md 包含在上下文中** 两个开关。不打开开关，文件放在那里也不会被读取。跨工具共用的写法见[《AGENTS.md 怎么写》](/guides/agents-md-cross-tool-guide)。

## 五、给提交信息（Commit Message）定规则

在规则文件的 frontmatter 里加 `scene: git_message`：

```markdown
---
scene: git_message
---
提交信息使用中文，格式为「类型: 简述」，类型限 feat / fix / docs / refactor / test。
```

只要文件里有这个字段，AI 生成提交内容时就会遵循，不受 `alwaysApply`、`globs` 等其他字段影响。也可以在源代码管理面板的提交输入框右侧下拉里选「配置提交信息生成规则」，系统会在 `.trae/rules` 下生成 `git-commit-message.md`。

## 六、官方的规则最佳实践

- 控制单条规则的粒度，保持清晰、聚焦；
- 规则之间不要互相冲突或覆盖；
- 指定文件路径时用相对项目根目录的相对路径；
- **新建或修改规则后开一个新对话再用**，避免历史上下文和新规则冲突；
- 项目里已有大量不合规范的代码时，模型可能沿用旧风格。官方建议：明确告诉模型当前任务是「重构」，或在特定场景里强制要求严格遵循新规则。

## 七、添加 MCP Server

### 从 MCP 市场添加

1. 在 IDE 窗口或 Agent 窗口进入 **设置 > MCP**；
2. 点 **添加 > 从市场添加**；
3. 找到需要的 MCP Server，点右侧的 **+**；
4. 在弹窗里填配置信息，点确认。

两条官方提示：标记为「Local」的 MCP Server 需要本机先装好 **NPX 或 UVX**（也就是 Node.js 或 Python 的 uv 工具）；配置里的 `env`（API Key、Token 等）要换成你自己的真实信息。

### 手动配置

**设置 > MCP > 添加 > 手动添加**，把 JSON 填进输入框。已经在别的 IDE 里配过的，点 **原始配置（JSON）**，把原来的配置直接粘进 Trae 的 `mcp.json`。

stdio 类型（本地进程）：

```json
{
  "mcpServers": {
    "mcp_name": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": { "API_Key": "value" }
    }
  }
}
```

HTTP 类型（远程服务，SSE 或 Streamable HTTP）：

```json
{
  "mcpServers": {
    "mcp_name": {
      "url": "https://example.com/mcp",
      "headers": { "Authorization": "Bearer xxxx-xxxxxxx" }
    }
  }
}
```

`command` 必须在系统 PATH 里或写完整路径，而且**命令本身不能包含空格**，否则解析出错——参数要放进 `args`。

### 项目级 MCP

1. **设置 > MCP**，打开 **启用项目级 MCP** 开关并确认；
2. 在项目根目录的 `.trae/` 下创建 `mcp.json`，写入配置并保存。

官方在这里有一条警告：务必确保工作区内所有项目文件来源可信，避免加载恶意配置文件。配置里可以用变量 `${workspaceFolder}`（目前只支持这一个），启动时会替换成项目根目录的真实路径。

## 常见问题

**Q：MCP Server 启动失败 / 超时？**
先确认本机装了 Node.js（npx）或 uv（uvx）、`command` 没有带空格、`env` 里的密钥填对了。启动慢的可以加超时设置：stdio 类型写在 `env` 里，HTTP 类型写在 `headers` 里——

```json
"env": {
  "START_MCP_TIMEOUT_MS": "60000",
  "RUN_MCP_TIMEOUT_MS": "60000"
}
```

前者是启动超时，后者是调用工具的超时，单位毫秒。

**Q：Agent 窗口里为什么要选「本地 / 云端」？**
官方说明：本地的规则和 MCP Server 只能用于本地任务和工作树任务；云端的只能用于云端任务。两边要分别配置。

**Q：规则写了但 AI 不遵守？**
检查生效方式：「指定文件生效」要对话里真的提到了匹配的文件；「智能生效」要有清楚的描述；改完规则后开新对话。

**Q：MCP 市场里的服务器都安全吗？**
官方明确不为第三方 MCP Server 背书。怎么挑、怎么审，见[《MCP 服务器怎么选》](/guides/mcp-servers-how-to-choose-audit)。

## 参考资料

- 规则（Rule）（TRAE 官方文档）：https://docs.trae.ai/ide/rules
- MCP 概览（TRAE 官方文档）：https://docs.trae.ai/ide/model-context-protocol
- 添加 MCP Server（TRAE 官方文档）：https://docs.trae.ai/ide/add-mcp-servers
