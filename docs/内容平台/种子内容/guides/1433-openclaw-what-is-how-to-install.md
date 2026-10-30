---
title: OpenClaw 是什么、怎么安装：把聊天软件连到 AI 智能体的开源网关，官方安装步骤、Node 版本和常见排查
slug: openclaw-what-is-how-to-install
products: [ai-tools]
models: []
accountTier: FREE
excerpt: "OpenClaw 是自托管的开源网关，把 Telegram、Slack、WhatsApp 等聊天软件连到 AI 智能体。本文按官方文档（2026-10-31 核对）讲它是什么、需要什么环境、安装和 onboarding 怎么做、怎么装成后台服务和打开面板，以及出问题时官方的排查命令。"
checkedOn: 2026-10-31
sources:
  - https://docs.openclaw.ai/
  - https://docs.openclaw.ai/start/getting-started
verify:
  - 官方文档首页和 Getting started 页对 Node 版本的写法不完全一致（首页写 24.22.1 及以上或 26.12.1 及以上，Getting started 页写 24.16.0 及以上或 26.1.0 及以上，两页都推荐 Node 26），本文两处都列出，以安装页当天显示为准
  - 命令、端口和配置文件路径是 2026-10-31 当天读到的官方文档，官方随时可能调整
  - 本文没有安装过，不代表任何实际运行结果；官方没有写费用，模型调用费用取决于你选的模型提供方
---

> 本文根据 OpenClaw 官方文档整理，资料核对于 2026-10-31。本文只整理官方写明的内容，不是亲自安装的记录。配图为本站整理的示意图，不是软件截图。本站不是 OpenClaw 官方。

## 适用于谁

- 听说过 OpenClaw，想先弄清楚它是什么的人；
- 想在自己电脑或服务器上装一个，用聊天软件遥控 AI 智能体的人；
- 装了之后不知道下一步做什么、出问题不知道怎么查的人。

## 结论先说

1. **OpenClaw 是一个自托管的开源网关**：你在自己的电脑或服务器上运行一个 Gateway 进程，它把 Discord、Signal、Slack、Telegram、WhatsApp 等聊天软件，接到 AI 编程智能体上。官方说明它采用 MIT 协议。
2. **官方支持的聊天渠道**：Discord、Google Chat、iMessage、Matrix、Microsoft Teams、Signal、Slack、Telegram、WhatsApp 和 Zalo，另外支持 WebChat；Nostr、Twitch 等通过插件提供。
3. **需要什么**：Node.js（官方推荐 Node 26）和一个模型提供方的 API Key。官方还写到，onboarding 可以复用你已有的 Claude Code 或 Codex CLI 登录。
4. **安装是一条命令**：macOS、Linux、WSL2 用 `curl -fsSL https://openclaw.ai/install.sh | bash`；Windows PowerShell 用 `iwr -useb https://openclaw.ai/install.ps1 | iex`。脚本会识别系统、必要时安装 Node、安装 OpenClaw，并启动 onboarding。
5. 装好后用 `openclaw gateway status` 看状态，用 `openclaw dashboard` 打开本地网页面板，默认地址 `http://127.0.0.1:18789/`。

![OpenClaw 安装到能用](seed:g1433-install-steps.png)
*图：本站根据 [OpenClaw 官方文档](https://docs.openclaw.ai/start/getting-started) 整理的示意图*

## 一、它到底是什么

按官方首页的说法，你运行**一个 Gateway 进程**，它连接你的聊天软件和一个「随时在线」的助手。也就是说：

- 它本身不是一个模型，模型由你选的提供方（需要 API Key）提供，官方说明支持多个模型提供方，也提到可以配置故障切换和本地模型服务；
- 它运行在**你自己的机器**上，配置文件在 `~/.openclaw/openclaw.json`；
- 官方说明遥测只有版本检查，并且可以关闭。

如果你想先了解同类的编程智能体，可看 [/guides/claude-code-getting-started](/guides/claude-code-getting-started) 和 [/guides/codex-getting-started](/guides/codex-getting-started)。

## 二、安装前准备

| 项目 | 官方要求 |
| --- | --- |
| Node.js | 推荐 Node 26；官方还写了 24.x 的较新补丁版本也可以，具体最低版本两页写法略有不同，见上面的 verify |
| AI 访问 | 模型提供方的 API Key，或已有的 Claude Code、Codex CLI 登录 |
| 系统 | macOS、Linux、Windows；Windows 可用 PowerShell 安装脚本，也支持 WSL2，官方还提到原生 Windows 桌面应用是最简单的桌面路径 |

用 `node --version` 看你的版本。安装脚本在需要时会帮你装 Node，所以版本不对也不一定要先手动处理。

## 三、安装和 onboarding

1. 运行对应系统的安装命令。**来源只认官方文档里给出的 openclaw.ai**，不要从别处复制脚本来运行。这种「下载脚本直接运行」的方式本身有风险，运行前可以先在浏览器里打开链接读一遍内容；
2. 安装脚本会**自动启动 onboarding 向导**。官方写的两条路：
   - **Quick start**：复用检测到的 AI 访问，用一次真实的请求验证，保存配置并打开网页面板，Gateway 在终端前台运行，按 Ctrl+C 停止；
   - **Custom setup**：走完整的引导流程。
   想用逐步的老式向导，运行 `openclaw onboard --classic`；以后想改设置，运行 `openclaw configure`。
3. 想快速试一下而不装，官方给了 `npx openclaw@latest`。

其他安装方式（npm、pnpm、bun、Docker、Nix、源码）在官方 Install 页。

## 四、装成后台服务、验证和打开面板

Quick start 让 Gateway 留在前台。想让它在后台一直运行：

1. 按 Ctrl+C 停止；
2. 运行 `openclaw gateway install`。官方说明，这会在 macOS 创建 LaunchAgent，在 Linux 和 WSL2 创建 systemd 用户单元，在原生 Windows 创建计划任务；Windows 上如果创建任务被拒，会退回成当前用户的启动项；
3. 运行 `openclaw gateway status`，输出应该显示 Gateway 在 **18789 端口**监听；
4. 运行 `openclaw dashboard`，在浏览器里打开控制面板。能打开，就说明装好了，在聊天框里发一句话，应该能收到 AI 的回复。

## 五、出问题怎么查

![OpenClaw 装完不工作怎么查](seed:g1433-troubleshoot-decide.png)
*图：本站根据 [OpenClaw 官方文档](https://docs.openclaw.ai/start/getting-started) 整理的示意图*

官方 Getting started 页给了两个命令：

- **`openclaw triage`**：运行只读的健康检查，生成一份**脱敏的诊断提示**，再让你选择交给检测到的编程智能体（Claude Code、Codex CLI 或内置的 OpenClaw 智能体），或者只打印命令。官方写明，你选定智能体之前不会有任何内容离开你的机器，密钥、令牌、原始聊天内容和原始日志不会被包含；
- **`openclaw doctor`**：自己查看检查结果。

按症状的排查在官方 Troubleshooting 页。

## 六、安全方面要注意什么

官方首页的安全说明提到：

- 限制谁可以给机器人发消息：例如 WhatsApp 的 `channels.whatsapp.allowFrom`，以及群聊里需要被提及才响应的规则；
- 令牌、允许名单和安全控制记录在官方的 Gateway security 部分；
- 远程访问在官方的 Web surfaces 和 Tailscale 部分有说明。

因为它能替你执行任务，**别把机器人接到陌生人也能发消息的群里**。给智能体装技能或插件之前，也建议先看看本站 [/guides/agent-skills-security-audit-before-install](/guides/agent-skills-security-audit-before-install)。

## 常见问题

**Q：OpenClaw 收费吗？**
官方文档只说它是开源的、MIT 协议，没有写价格。模型调用另外计费，取决于你用的模型提供方。想了解 Claude 的价格见 [/guides/claude-pricing-free-or-paid](/guides/claude-pricing-free-or-paid)。

**Q：需要开通 ChatGPT 或 Claude 会员吗？**
官方写的是要有模型提供方的 API Key，或者复用已有的 Claude Code、Codex CLI 登录。是否要订阅取决于你选哪条路，本站 [充值页](/chongzhi) 提供 ChatGPT、Claude 等服务。

**Q：Windows 怎么装？**
PowerShell 运行官方给的 `iwr` 命令；也可以走 WSL2，在 WSL2 里的做法和 Linux 一样。

## 参考资料

- OpenClaw 官方文档首页 — https://docs.openclaw.ai/
- OpenClaw Getting started — https://docs.openclaw.ai/start/getting-started
