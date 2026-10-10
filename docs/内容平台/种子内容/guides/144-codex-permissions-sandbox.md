---
title: Codex 权限与沙箱设置：审批模式怎么选、权限全开的风险、沙箱启动失败怎么办
slug: codex-permissions-sandbox
products: [codex]
models: []
accountTier: PLUS
excerpt: Codex 权限由沙箱和审批两部分组成。按官方文档讲清三种权限模式与 config.toml 写法、权限全开（--yolo）的风险，以及 Windows / Linux 沙箱启动失败、联网被拦、untrusted 报错怎么处理。
checkedOn: 2026-10-07
sources:
  - https://learn.chatgpt.com/docs/permission-modes
  - https://learn.chatgpt.com/docs/sandboxing
  - https://learn.chatgpt.com/docs/agent-approvals-security
  - https://learn.chatgpt.com/docs/sandboxing/auto-review
  - https://learn.chatgpt.com/docs/windows/windows-sandbox
  - https://learn.chatgpt.com/docs/agent-configuration/rules
  - https://learn.chatgpt.com/docs/config-file/config-basic
  - https://learn.chatgpt.com/docs/developer-commands
  - https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan
verify:
  - 自动审查（Auto-review）是否计入额度两处说法不一致：帮助中心写「用 ChatGPT 账号登录时免费、不计入额度」，开发者文档写「会额外调用模型、可能增加用量」，正文按帮助中心并注明
  - 桌面 App 的「Ask for approval / Approve for me / Full access」三种模式和「Settings → General → Permissions」的中文界面名称未核实
---

> 本文根据 OpenAI 官方 Codex 文档（learn.chatgpt.com）的《Permissions》《Sandbox》《Agent approvals & security》《Auto-review》《Windows sandbox》和帮助中心整理，资料核对于 2026-10-07。适用于 ChatGPT 桌面 App 里的 Codex、Codex CLI 和 IDE 插件这些**本地**运行方式。

## 适用于谁

- 不知道 Codex 为什么老是弹窗问「能不能运行这个命令」，想调整的人；
- 想「权限全开」让 Codex 自己跑完，又担心出事的人；
- 遇到「沙箱启动失败」「Windows 错误 1385」「approval_policy = untrusted 不再支持」这类报错的人。

## 结论先说

1. **两个开关一起决定 Codex 能做什么**：**沙箱（sandbox）** 管它在技术上能碰哪些文件、能不能联网；**审批（approval）** 管它什么时候必须停下来问你。改审批的人选不会扩大沙箱。
2. **默认就够用**：大多数工作用 **Ask for approval（请求批准）**——在当前工作区里自由读写、跑命令，越界（改工作区外的文件、联网）才问你。对应配置是 `sandbox_mode = "workspace-write"` + `approval_policy = "on-request"`。
3. **嫌弹窗多**：开 **Approve for me**（设置里叫 Auto-review），由另一个审查智能体替你判断要不要放行，沙箱边界不变。
4. **权限全开（Full access / `--yolo`）= 没有沙箱 + 从不询问**。官方标为「不推荐」，只建议在专门的沙箱虚拟机里用。需要更多权限时，优先用「加可写目录」「规则（rules）」这种精确放行。
5. **沙箱起不来**：Linux 先装 `bubblewrap`；Windows 优先用 `elevated` 沙箱，起不来时临时改 `unelevated`。

## 一、三种权限模式

| 模式 | 沙箱 | 何时询问 | 适合 |
|---|---|---|---|
| **Ask for approval** | 工作区可写 | 越过工作区边界时问你 | 大多数日常开发（默认） |
| **Approve for me**（Auto-review） | 同上，不变 | 越界请求交给审查智能体判断 | 长任务、不想一直盯着 |
| **Full access** | 无沙箱 | 从不询问 | 一次性的隔离环境、专用虚拟机 |

**在哪改**：

- **桌面 App / IDE 插件**：输入框下方的权限控件。第一次用桌面 App 时，**Approve for me** 和 **Full access** 默认不在菜单里，需要到 **Settings → General → Permissions** 把它们打开；打开只是让它出现在菜单里，不会自动切换。
- **CLI**：会话里输入 `/permissions`，在 **Auto**、**Read Only** 等预设之间切换；如果配置了自定义权限配置（permission profiles），也会出现在这里。
- 公司管理的设备上，被管理员禁止的模式会显示为灰色。

**Codex 第一次打开一个文件夹时**：如果是 Git 管理的文件夹，推荐 Auto（工作区可写 + 按需询问）；不是 Git 文件夹则推荐只读。有时会先以只读启动，直到你明确信任这个目录。输入 `/status` 可以看到当前哪些目录算「工作区」。

## 二、用 config.toml 设默认值

配置文件在 `~/.codex/config.toml`（桌面 App、CLI、IDE 共用）。三个关键项：

**沙箱模式 `sandbox_mode`**

- `read-only`：只能看文件，改文件、跑命令都要先批准；
- `workspace-write`：可以读、在工作区内修改、跑常规命令（默认的低打扰模式）；
- `danger-full-access`：没有沙箱，取消文件和网络边界。

**审批策略 `approval_policy`**

- `on-request`：在沙箱里自由干活，要越界时询问；
- `never`：从不询问（配合什么沙箱由你决定）。

**谁来审批 `approvals_reviewer`**：`user`（你，默认）或 `auto_review`（审查智能体）。

常用组合（来自官方文档）：

| 意图 | 命令行参数 / 配置 | 效果 |
|---|---|---|
| Auto（默认预设） | 不加参数，或 `--sandbox workspace-write --ask-for-approval on-request` | 工作区内读写、跑命令；工作区外改动和联网要批准 |
| 只读浏览 | `--sandbox read-only --ask-for-approval on-request` | 只读，越界可询问 |
| 只读、无人值守（CI） | `--sandbox read-only --ask-for-approval never` | 只读，从不询问 |
| 自动审查 | 在 Auto 基础上加 `-c approvals_reviewer=auto_review` | 边界同 Auto，越界请求交审查智能体 |
| 危险的完全访问 | `--dangerously-bypass-approvals-and-sandbox`（别名 `--yolo`） | 无沙箱、无审批（**不推荐**） |

推荐的默认配置：

```toml
sandbox_mode = "workspace-write"
approval_policy = "on-request"
approvals_reviewer = "user"      # 想少弹窗可改成 "auto_review"

[sandbox_workspace_write]
network_access = false           # 默认不联网，确实需要再改成 true
writable_roots = ["/Users/YOU/.pyenv/shims"]   # 额外允许写入的目录（示例）
```

几点细节：

- **默认不联网**：`workspace-write` 下命令默认没有网络，要联网就把 `network_access` 设为 `true`。还可以开 `network_proxy` 功能，只放行指定域名。
- **受保护路径**：即使在可写的工作区里，`.git`、`.agents`、`.codex` 目录也是只读的。
- **非交互运行**：`codex exec --sandbox workspace-write`；旧的 `codex exec --full-auto` 写法仍兼容但已弃用，会打印警告。
- 可以把一套设置存成 profile 文件，用 `codex --profile 名字` 调用。

## 三、权限全开的风险，先看这一节

把 `sandbox_mode = "danger-full-access"` 和 `approval_policy = "never"` 放在一起，或者加 `--yolo`，就是「完全访问」。官方文档对它的提醒可以归纳为：

- **不再局限于项目目录**，Codex 可能执行意料之外的破坏性操作，导致**数据丢失**；
- **网络边界也没了**；而且在完全访问下，网页搜索默认改为实时抓取网页，被网页里的「提示注入」诱导去执行不可信指令的风险更高；
- 官方 CLI 建议：除非你在专门的沙箱虚拟机里，否则不要用 `--dangerously-bypass-approvals-and-sandbox`。

更稳妥的替代做法：

1. 需要写别的目录 → 用 `--add-dir` 或 `writable_roots` 加可写目录，而不是直接 `danger-full-access`；
2. 某个命令总要越界（比如 `gh pr view`）→ 写一条**规则（rules）**，对这个命令前缀单独设「允许 / 询问 / 禁止」，规则文件放在 `~/.codex/rules/default.rules`（规则功能目前为实验性）；
3. 不想被打扰 → 用 **Approve for me**，或在沙箱内把审批设为 `never`，让 Codex 在边界内自己想办法；
4. 不管哪种模式，**开工前先 Git 提交一次**，出问题能回退。

关于自动审查：它只审查本来就需要批准的动作（越界命令、被拦的网络请求、有副作用的 MCP / 应用工具调用等），会拦截外传隐私数据和密钥、试探凭据、长期削弱安全设置、高风险不可逆操作这类行为；审查失败时默认不放行。帮助中心写明用 ChatGPT 账号登录时，自动审查的安全检查**免费、不计入额度**（开发者文档另提到它会额外调用模型，以实际用量页面为准）。

## 四、沙箱报错与启动失败

### Linux / WSL2：提示缺少 bwrap 或无法创建用户命名空间

先用包管理器装 `bubblewrap`（Ubuntu / Debian：`sudo apt install bubblewrap`；Fedora：`sudo dnf install bubblewrap`）。Ubuntu 24.04 装完仍提示无法创建用户命名空间时，官方给出的办法是加载 `bwrap-userns-restrict` 这个 AppArmor 配置；Ubuntu 25.04 直接装包一般就行。macOS 用系统自带的 Seatbelt，开箱即用。

### Windows：elevated 沙箱设置失败

Windows 原生（PowerShell）有两种沙箱：

```toml
[windows]
sandbox = "elevated"     # 推荐，更强
# sandbox = "unelevated" # 备用：没有管理员权限或 elevated 设置失败时
```

`elevated` 设置失败的常见原因：UAC / 管理员弹窗被拒绝、机器不允许创建本地用户或组、不允许改防火墙规则、组策略不给沙箱用户登录权限。处理顺序：

1. 重新执行 elevated 设置并同意管理员弹窗（CLI 里可以用 `/setup-default-sandbox`）；
2. 公司电脑被策略拦住的，请 IT 确认是否允许上面几项；
3. 还不行就先改 `unelevated` 继续工作——它仍有文件边界，但网络隔离更弱，不是长期方案。

其他 Windows 报错：

- **错误 1385**：Windows 拒绝了沙箱用户需要的登录类型，通常是组策略问题；找 IT，临时可用 `unelevated`，并提供 `CODEX_HOME/.sandbox/sandbox.log`（**不要**发 `.sandbox-secrets` 目录里的内容）。
- **提示有文件夹对 Everyone 可写**：这些文件夹权限太宽，沙箱保护不全，去掉 Everyone 的写权限后重启 Codex。
- **命令读不到某个目录**：在会话里输入 `/sandbox-add-read-dir C:\绝对路径`，本次会话内就能读。
- **以前好好的，突然不行**：常见于挪动了仓库、改了系统权限或组策略之后；重启 Codex → 重新执行 elevated 设置 → 临时用 unelevated。
- **系统版本**：官方推荐 Windows 11；较新的、更新齐全的 Windows 10（1809 及以上）尽力支持。需要 Linux 工具链时可以改用 WSL2。

### 命令联网失败

先确认当前模式本来就不允许联网（`workspace-write` 默认不联网）。确实需要就在配置里开 `network_access`，或者在弹窗里批准这次联网。

### 启动报错「approval_policy = "untrusted" is no longer supported」

`untrusted` 审批策略已被移除（CLI 0.149.0、桌面 App 和 VS Code 插件 26.818.31338 起）。打开 `config.toml`（Windows 在 `%USERPROFILE%\.codex\config.toml`）删掉这一行，也检查 profile 文件、启动脚本里的 `--ask-for-approval untrusted`。想保持严格，可改成：

```toml
sandbox_mode = "read-only"
approval_policy = "on-request"
```

注意：项目级的 `trust_level = "untrusted"` 是另一个设置，仍然支持。

## 常见问题

**Q：ChatGPT 网页版的 Work 也有这些权限模式吗？**
没有。网页版 Work 在托管的隔离环境里运行代码，不提供本地沙箱和审批模式选择；可用时在 **Settings → Data controls → Work network access** 里管理代码和命令的联网权限。

**Q：Approve for me 会不会比 Full access 更危险？**
不会。它不扩大沙箱，只是换成审查智能体来批准越界请求；Full access 则是直接拆掉沙箱。

**Q：为什么改了 config.toml 某个模式还是用不了？**
公司设备可能有管理员下发的 `requirements.toml`，例如禁止 `approval_policy = "never"` 或 `danger-full-access`，这种限制优先级高于个人配置。

**Q：MCP 工具的审批在哪设？**
在每个 MCP 服务器的 `default_tools_approval_mode` 和单个工具的 `approval_mode` 里设，见 [Codex 怎么配置 MCP](/guides/codex-mcp-config)。

## 参考资料

- 官方文档：Permissions（权限模式）— https://learn.chatgpt.com/docs/permission-modes
- 官方文档：Sandbox — https://learn.chatgpt.com/docs/sandboxing
- 官方文档：Agent approvals & security — https://learn.chatgpt.com/docs/agent-approvals-security
- 官方文档：Auto-review — https://learn.chatgpt.com/docs/sandboxing/auto-review
- 官方文档：Windows sandbox — https://learn.chatgpt.com/docs/windows/windows-sandbox
- 官方文档：Rules — https://learn.chatgpt.com/docs/agent-configuration/rules
- 官方文档：Config basics — https://learn.chatgpt.com/docs/config-file/config-basic
- 官方文档：命令行参考 — https://learn.chatgpt.com/docs/developer-commands
- OpenAI 帮助中心：Using Codex with your ChatGPT plan（Auto-review、untrusted 报错）— https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan
