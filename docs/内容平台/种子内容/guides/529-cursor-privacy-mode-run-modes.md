---
title: Cursor 隐私模式与 Agent 权限：Privacy Mode 怎么开、运行模式怎么选、.cursorignore 保护密钥
slug: cursor-privacy-mode-run-modes
products: [cursor]
models: []
accountTier: PLUS
excerpt: Cursor 会拿我的代码训练吗？按官方文档讲清 Privacy Mode 的含义与开启步骤、哪些情况不适用零数据保留、Agent 的三种运行模式（Auto-review / Allowlist / Run Everything）、沙箱与读取边界，以及 .cursorignore 的作用与局限。
checkedOn: 2026-10-11
sources:
  - https://cursor.com/help/security-and-privacy/privacy
  - https://cursor.com/docs/agent/security/run-modes
  - https://cursor.com/help/customization/ignore-files
  - https://cursor.com/help/models-and-usage/api-keys
  - https://cursor.com/docs/models-and-pricing
verify:
  - Read Access（读取边界）设置官方写明需要 Cursor 3.23 及以上
  - 官方文档只写了 macOS（Seatbelt）与 Linux（Landlock + seccomp）的沙箱实现，Windows 上沙箱的支持情况本文未核到
  - 个人档默认是否开启 Privacy Mode 官方帮助页未写明，请在设置里自行确认
---

> 本文根据 Cursor 官方帮助中心《Privacy and data》和文档《Run Modes》整理，资料核对于 2026-10-11。数据政策的完整条款以 cursor.com/data-use 和隐私政策为准，本文不构成合规意见。

## 适用于谁

- 在公司项目里用 Cursor，担心代码被拿去训练的人；
- 搜「cursor 隐私模式」的人；
- 想让 Agent 少弹确认框，又怕它乱执行命令的人。

## 结论先说

1. **Privacy Mode（隐私模式）**的官方含义：你的代码**不会被 Cursor 或其他模型提供方用于训练**。开启位置：Cursor Settings → General → Privacy Mode。
2. 开了隐私模式，**代码仍然会发给模型提供方**做推理——用 AI 功能时，提示词和代码上下文会发送给 OpenAI、Anthropic、Google 等，区别只在于不用于训练。
3. 三种情况要留意：**自带 API Key** 时不适用零数据保留；少数模型需要提供方保留数据（默认关闭，要显式批准）；**Grok Bot** 是独立产品，有自己的数据流。
4. Agent 能不能不问你就跑命令，由**运行模式**决定。官方认为对多数人「最安全且实用」的是 **Auto-review**；**Run Everything** 等于放弃所有检查。
5. `.cursorignore` 能让 Agent 读不到指定文件，但**挡不住终端命令和 MCP 工具**。

## 一、开启隐私模式

1. 打开 Cursor Settings：`Ctrl+Shift+J`（macOS `Cmd+Shift+J`）；
2. 点侧边栏的 **General**；
3. 打开 **Privacy Mode**。

团队账号：官方说明 Teams 的成员默认开启隐私模式，Enterprise 默认开启；管理员可以在后台强制全员开启，成员无法自行关闭。

## 二、隐私模式管什么、不管什么

| 问题 | 官方说法 |
| --- | --- |
| 代码会被用于训练吗 | 开启隐私模式后，不会被 Cursor 或模型提供方用于训练 |
| 代码会离开我的电脑吗 | 会。使用 AI 功能时，提示词和代码上下文会发给模型提供方；所有分包处理方都签有数据处理协议 |
| 对 Grok 系列模型同样生效吗 | 是，隐私模式对它们和其他模型一样 |
| 自带 API Key 呢 | **零数据保留不适用**，数据处理按你所选提供方的隐私政策 |
| 有例外的模型吗 | 有。个别模型要求提供方保留数据，不在 Cursor 的零保留协议内；这些模型默认关闭，需批准后才能用。官方模型表里对 Claude Fable 系列就有这样的标注 |
| Grok Bot 呢 | 它运行在独立的产品界面上，有自己的数据流；编辑器里的隐私模式管的是编辑器 |

如果团队依赖零数据保留，官方的建议是用 Cursor 内置模型，不要自带 Key。

## 三、Agent 运行模式：谁来批准命令

位置：**Settings → Agents → Approvals & Execution**。运行模式管三类工具调用：shell 命令、MCP 工具、Fetch（联网抓取）。

| 模式 | 不用问就能跑的 | 沙箱 | 分类器 | 适合 |
| --- | --- | --- | --- | --- |
| Auto-review | 白名单里的调用直接跑；其他 shell 命令尽量放进沙箱；进不了沙箱的交给分类器审查 | 有（shell） | 有 | 想少弹窗，又要在高风险操作前有一道审查 |
| Allowlist | 只有白名单里的动作 | 可选 | 无 | 想要完全确定的行为，只信任少数重复操作 |
| Run Everything | 所有工具调用 | 无 | 无 | 你接受风险、要零弹窗 |

关于 Auto-review，官方自己写了一句很重要的话：**它不是安全边界**。分类器会犯错——可能放行你本想拦的操作，也可能拦下你本想放行的。

### 给 Auto-review 加自己的规矩

不配置也能用。想让某类操作永远先问你，可以直接对 Agent 说「所有 AWS CLI 命令都要先经过我批准」，它会替你改 `permissions.json`；也可以手写：

```json
{
  "autoRun": {
    "allow_instructions": [],
    "block_instructions": [
      "所有 AWS CLI 命令都要先经过批准。",
      "任何修改 Kubernetes 资源的命令都要先经过批准。"
    ]
  }
}
```

文件位置：`~/.cursor/permissions.json`（对本机所有项目）或 `项目目录/.cursor/permissions.json`（只对这个项目，可提交给团队共用）；两个都有时合并生效。

## 四、沙箱与读取边界

沙箱让终端命令在受限环境里运行，默认行为：

| 访问 | 默认 |
| --- | --- |
| 工作区文件 | 可读可写；`.cursorignore` 可以对 Agent 隐藏文件 |
| 受保护路径 | `.git/config`、`.git/hooks`、`.vscode`、`.cursorignore` 及敏感的 Cursor 配置文件受保护 |
| 网络 | 默认阻断，再按网络模式和 `sandbox.json` 放开 |
| 临时目录 | 可写 |

需要完整系统权限的命令会绕过沙箱，这时 Cursor 会明确提示并请你批准。

**读取边界（Read Access）**决定 Agent 能否不经询问读工作区以外的文件：

- **System**（默认）：可以直接读工作区外的文件；
- **Workspace**：工作区内随便读，工作区外要你批准，除非路径在 Read Allowlist 里。

做公司项目或机器上有其他敏感资料时，建议改成 **Workspace**。也可以写进 `sandbox.json`：

```json
{
  "readBoundary": "workspace",
  "additionalReadPaths": ["/opt/shared/design-tokens"]
}
```

注意：Run Everything 模式下读取边界不生效。

## 五、用 .cursorignore 保护密钥

在项目根目录建 `.cursorignore`，语法同 `.gitignore`：

```text
.env*
secrets/
*.pem
dist/
```

- Cursor **默认已经忽略** `.env` 文件、`.git/` 和锁文件，也自动遵守 `.gitignore`；
- 被忽略的文件 Agent 读不到，代码库搜索和 `@` 引用里也不会出现；
- **局限**：官方明确说，终端命令和 MCP 工具运行在 Cursor 的文件访问控制之外，仍可能读到这些文件。比如 Agent 执行 `cat .env`，忽略规则管不了——这要靠运行模式和沙箱来兜。

## 一份可照做的设置清单

1. 打开 Privacy Mode；
2. 运行模式用 Auto-review，不用 Run Everything；
3. Read Access 改成 Workspace；
4. `.cursorignore` 里写上密钥、证书、客户数据所在的目录；
5. 密钥放环境变量，不写进代码和 `mcp.json`（见[《Cursor MCP 配置教程》](/guides/cursor-mcp-config-json)）；
6. 让 Agent 开工前先提交一次 Git，改完逐条看 diff。

更完整的跨工具安全清单见[《AI 编程安全注意事项》](/guides/ai-coding-security-secrets-permissions)。

## 常见问题

**Q：Auto-review 选项是灰的？**
官方说明分类器依赖小模型（当前为 Gemini 3.5 Flash Lite，回退到 Claude 4.5 Haiku）。团队后台如果把这些模型禁用了，Auto-review 会不可用；让管理员在 Team Settings → Models 里放开，再彻底重启 Cursor。

**Q：Linux 上沙箱起不来？**
官方要求内核 6.2 及以上并支持 Landlock v3、开启非特权用户命名空间；不满足时 Cursor 会退回到「每次运行前询问」。

**Q：个人档有数据处理协议（DPA）吗？**
官方说明 DPA 适用于 Teams 和 Enterprise；个人档按隐私政策处理。

## 参考资料

- Privacy and data（官方帮助中心）：https://cursor.com/help/security-and-privacy/privacy
- Run Modes（官方）：https://cursor.com/docs/agent/security/run-modes
- Ignore files（官方帮助中心）：https://cursor.com/help/customization/ignore-files
- Bring your own API key（官方帮助中心）：https://cursor.com/help/models-and-usage/api-keys
