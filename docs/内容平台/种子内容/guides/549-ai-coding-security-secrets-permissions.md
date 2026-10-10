---
title: AI 编程安全注意事项：密钥保护、权限模式怎么选、提示注入防范清单
slug: ai-coding-security-secrets-permissions
products: [ai-tools, claude]
models: []
accountTier: FREE
excerpt: 用 Cursor、Claude Code、Codex、Copilot 写代码有哪些安全风险？按各家官方安全文档整理：密钥别进上下文和仓库、各工具权限模式对照与推荐档位、提示注入是什么与五条防范、不可信仓库怎么开、MCP 与规则文件的风险，附一页自查清单。
checkedOn: 2026-10-11
sources:
  - https://code.claude.com/docs/en/security
  - https://cursor.com/docs/agent/security
  - https://cursor.com/docs/agent/security/run-modes
  - https://cursor.com/help/customization/ignore-files
  - https://docs.github.com/en/copilot/how-tos/copilot-cli/use-copilot-cli/allowing-tools
  - https://docs.cline.bot/features/auto-approve
  - https://docs.cline.bot/customization/clineignore
  - https://modelcontextprotocol.io/docs/2026-07-28/tutorials/security/local-server-security
  - https://kiro.dev/docs/mcp/security
verify:
  - 各工具权限模式的名称、默认值更新频繁，表格内容取自官方文档 2026-10-11 的版本
  - 本文是面向个人开发者和小团队的通用建议，不构成安全审计或合规意见
  - Codex 的沙箱与审批模式细节见本站单篇教程，本文未重新核对
---

> 本文根据 Claude Code、Cursor、GitHub Copilot CLI、Cline、Kiro 的官方安全文档和 MCP 官方《Local Server Security》整理，资料核对于 2026-10-11。本文讲的是保护你自己的代码、密钥和电脑的做法。

## 适用于谁

- 开始让 AI 智能体直接改文件、跑命令，心里没底的人；
- 搜「ai 编程 安全」「提示注入」「mcp 安全风险」的人；
- 团队里要给 AI 编程工具定使用规范的人。

## 结论先说

1. **智能体有手有脚**：能读文件、改文件、跑命令、联网。几家官方都承认 AI 会因为提示注入、幻觉等原因做出意外行为，所以才有权限和沙箱这些护栏——Cursor 明确说它们是「尽力而为的护栏，不是硬性安全边界」。
2. **密钥三不**：不写进代码、不贴进对话、不放进会被提交或被智能体读到的文件。
3. **权限选中间档**：既不要每一步都手动点（会点麻木），也不要全部放开。各工具都有「自动审查 + 沙箱」这类中间模式。
4. **凡是智能体读到的东西都可能带指令**：网页、issue、PR 评论、依赖包的 README、MCP 工具描述、别人仓库里的规则文件。这就是提示注入。
5. **最后一道防线是你**：Claude Code 官方的原话是，用户有责任在批准前审查代码和命令的安全性。
6. 一切操作都在 **Git 管理**下进行，随时能回退。

## 一、密钥

**常见的泄露路径**

| 路径 | 怎么发生 | 怎么防 |
| --- | --- | --- |
| 写死在代码里 | 让 AI「帮我接一下某某 API」，它把 Key 直接写进源码 | 指令里写明「密钥从环境变量读取」；提交前搜一遍 |
| 贴进对话 | 调试时把带 Key 的配置、报错、curl 命令整段粘贴 | 粘贴前把 Key 换成占位符 |
| 被智能体读到 | 它为了排查问题读了 `.env` 或配置文件 | 忽略文件 + 权限规则（见下） |
| 写进 MCP 配置并提交 | `mcp.json` 里直接填了 token | 用变量引用环境变量；带密钥的配置不进仓库 |
| 前端代码 | vibe coding 生成的应用把 Key 放在浏览器可见的代码里 | 密钥只在服务器端读取 |
| 截图和录屏 | 发帖求助时截到了 Key | 发之前打码 |

**忽略文件能挡多少**

- Cursor 默认忽略 `.env`、`.git/` 和锁文件，可用 `.cursorignore` 追加。但官方说明：终端命令和 MCP 工具运行在这套文件访问控制之外，**仍可能读到被忽略的文件**。
- Cline 的 `.clineignore` 官方已标注即将弃用，并明说它**不是安全或访问控制边界**，推荐改用 `PreToolUse` hook 做真正的拦截。
- 结论：忽略文件只能减少「不小心读到」，要真正拦住，得靠**权限规则里的 deny** 和**沙箱**。例如 Devin Desktop 可以写 `Read(**/*.pem)` 的拒绝规则；Claude Code 可以在 `permissions.deny` 里禁止读取某些路径。

**万一泄露了**：立刻到发放方作废并重新生成这把 Key。从对话或提交历史里删掉并不够——它可能已经进入日志或被推送。

**给 Key 最小权限**。Kiro 官方举的例子：GitHub 用细粒度个人访问令牌而不是经典令牌，只授权需要的仓库，并定期轮换。

## 二、权限模式怎么选

| 工具 | 最严格 | 推荐的中间档 | 全部放开（慎用） |
| --- | --- | --- | --- |
| Claude Code | Manual：先只读，改文件和跑命令都问你 | Auto：由单独的分类器模型代你审查并拦截它判断为不安全的操作；或开启沙箱 | bypass 权限 |
| Cursor | Allowlist：只有白名单里的动作自动运行 | Auto-review：白名单直接跑，其余 shell 命令尽量进沙箱，进不了的交给分类器 | Run Everything |
| GitHub Copilot CLI | 默认：只读操作自动放行，会改东西的逐次询问 | 用 `--allow-tool` 精确放行、`--deny-tool` 精确禁止 | `--allow-all` |
| Cline | 关闭全部 Auto Approve | 只开「读项目文件、编辑项目文件、执行安全命令」 | Execute all commands / YOLO 模式 |
| Codex | 见单篇教程 | 见单篇教程 | 见单篇教程 |

对应教程：[《Claude Code 权限模式详解》](/guides/claude-code-permission-modes)、[《Cursor 隐私模式与 Agent 权限》](/guides/cursor-privacy-mode-run-modes)、[《Codex 权限与沙箱设置》](/guides/codex-permissions-sandbox)、[《GitHub Copilot CLI 安装与使用》](/guides/github-copilot-cli-install-usage)。

**选档位的三条原则**

1. **日常用中间档**。纯手动模式下每一步都弹窗，人很快就会不看内容直接点同意，反而不安全。Claude Code 官方把允许常用安全命令加白名单称为缓解「提示疲劳」。
2. **deny 规则写死红线**。不管哪个档位，都把绝不允许的操作写成拒绝规则：`git push`、删除类命令、读密钥目录、访问生产环境的命令。Copilot CLI 官方明确 deny 永远优先于 allow。
3. **全部放开只用在可丢弃的环境**：容器、虚拟机、没有任何凭据的云端沙箱。在装着 SSH 密钥和云凭据的工作电脑上不要开。

**分类器不是保险**。Cursor 官方直说 Auto-review 的分类器会出错——可能放行你本想拦的，也可能拦下你本想放的。Cline 的「安全命令」是模型自己根据命令内容标记的，没有固定白名单，官方说给出的例子不是保证。

## 三、提示注入

**是什么**。Claude Code 官方的定义：攻击者通过插入恶意文本，试图覆盖或操纵 AI 助手的指令。对编程智能体来说，危险在于它**分不清「数据」和「命令」**：它读到的任何文字都可能被当成要执行的指示。

**可能藏在哪**

- 让它「读一下这个网页 / 这篇文档」——页面里藏着给 AI 的指令；
- issue、PR 评论、提交信息——尤其是开源仓库里陌生人写的；
- 依赖包的 README、代码注释；
- MCP 服务器的工具名称和描述（MCP 官方称为「被投毒的工具目录」）；
- 别人仓库里的 `AGENTS.md`、规则文件、`.mcp.json`、hooks 配置。Kiro 文档提醒：只选你信任的仓库，因为智能体会遵循仓库代码里的指示。

**它想让智能体做什么**：读取密钥并通过网络请求发出去；执行下载并运行脚本的命令；偷偷修改 CI 配置或依赖。

**五条防范**（前四条来自 Claude Code 官方的「处理不可信内容的最佳实践」）

1. **批准前看清建议的命令**，尤其是带 `curl`、`wget`、管道到 shell、base64 的；
2. **不要把不可信的内容直接管道喂给智能体**；
3. **核对对关键文件的改动**：CI 配置、依赖清单、部署脚本、权限配置；
4. **在虚拟机里跑脚本和工具调用**，特别是要和外部网络服务交互时；
5. **限制出网**。智能体拿到了数据也发不出去，注入就成功不了一半。Cursor 默认设置下智能体不能发起任意网络请求；Claude Code 默认不自动批准 `curl`、`wget` 这类联网命令；沙箱模式都可以配置域名白名单。

官方也都承认：这些保护能显著降低风险，但没有任何系统对所有攻击免疫。

## 四、打开不认识的仓库

别人的仓库不只是代码，还可能带着会自动生效的配置。

- **用工作区信任机制**。Claude Code 在你没信任过的文件夹里启动时会弹信任确认；项目 `.mcp.json` 里的服务器另有单独的批准提示。Devin Desktop 的 Restricted Mode 会禁用所有智能体和 hooks。Cursor 支持 workspace trust 但**默认关闭**，可在 `settings.json` 里设 `"security.workspace.trust.enabled": true`；Cursor 官方甚至建议：不可信的仓库干脆用普通文本编辑器看。
- **先看这些文件**：`AGENTS.md`、`CLAUDE.md`、`.cursor/`、`.claude/`、`.kiro/`、`.trae/`、`.mcp.json`、任何 hooks 配置。
- **Trae 的项目级 MCP、Kiro 的多仓库任务**，官方都附了「确保来源可信」的警告。
- **非交互模式要格外小心**。Claude Code 官方注明 `-p` 会话不显示信任确认。

## 五、MCP、插件与规则文件

- 本地 MCP 服务器是以你的身份运行的普通进程，能读环境变量和文件、能联网。装之前按[《MCP 服务器怎么选》](/guides/mcp-servers-how-to-choose-audit)里的七步检查过一遍。
- 少装、用完就关、版本锁定。
- 新装的服务器先别开自动批准，每次调用看一眼参数。
- 从网上抄来的规则、skills、hooks 先读内容再用——它们本质上是直接写给智能体的指令。本站 [Skill 库](/skills) 里的条目都标了来源仓库，使用前同样建议自己读一遍。

## 六、代码与数据去哪了

- 用 AI 功能时，提示词和相关代码会发给模型提供方做推理，这是所有云端工具的共同点。差别在**是否用于训练、保留多久**。
- 各家都有开关：Cursor 的 Privacy Mode；Claude 消费者账号可在隐私设置里更改训练偏好；ChatGPT 有数据控制设置。见[《Cursor 隐私模式与 Agent 权限》](/guides/cursor-privacy-mode-run-modes)、[《Claude 隐私设置》](/guides/claude-privacy-delete-account)、[《ChatGPT 隐私设置》](/guides/chatgpt-data-controls-privacy)。
- 自带 API Key、使用第三方模型时，数据政策跟着模型提供方走。
- 公司代码先看公司规定；客户数据、个人信息不要进对话。

## 一页自查清单

**每个项目做一次**

- [ ] 密钥全部走环境变量，`.env*`、证书目录在 `.gitignore` 和工具的忽略文件里
- [ ] 权限规则里有 deny：推送、删除、读密钥路径、生产环境命令
- [ ] 权限模式是中间档，没有开「全部放开」
- [ ] 读取范围限制在工作区内
- [ ] MCP 配置里没有写死的密钥，每个服务器都知道来源
- [ ] 仓库里有 CI 的测试、类型检查、lint，AI 的改动要过这些检查

**每次任务**

- [ ] 开工前 Git 工作区是干净的
- [ ] 批准命令前读过命令内容
- [ ] 合并前看过完整 diff，重点看 CI、依赖、部署、权限相关文件
- [ ] 让它读外部内容（网页、issue）之后，留意它有没有提出不相干的操作

**出事之后**

- [ ] 泄露的 Key 立刻作废重发
- [ ] 回退到已知良好的提交
- [ ] 查一遍 MCP 配置和 hooks 有没有被改
- [ ] 可疑行为向工具官方反馈（Claude Code 用 `/feedback`，Cursor 有安全报告邮箱）

## 参考资料

- Security（Claude Code 官方）：https://code.claude.com/docs/en/security
- Agent Security（Cursor 官方）：https://cursor.com/docs/agent/security
- Run Modes（Cursor 官方）：https://cursor.com/docs/agent/security/run-modes
- Allowing and denying tool use（GitHub Copilot CLI 官方）：https://docs.github.com/en/copilot/how-tos/copilot-cli/use-copilot-cli/allowing-tools
- Auto Approve & YOLO Mode（Cline 官方）：https://docs.cline.bot/features/auto-approve
- Local Server Security（MCP 官方）：https://modelcontextprotocol.io/docs/2026-07-28/tutorials/security/local-server-security
- MCP Best practices（Kiro 官方）：https://kiro.dev/docs/mcp/security
