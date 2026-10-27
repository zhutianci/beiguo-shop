---
title: Codex 沙箱初始化失败怎么办（Windows）：沙箱设置失败、错误 1385、Everyone 可写警告与 MXC、elevated、unelevated 怎么选
slug: codex-windows-sandbox-setup-failed
products: [codex, chatgpt]
models: []
accountTier: PLUS
excerpt: Windows 上 Codex 沙箱设置失败、命令跑不起来、提示错误 1385 或 Everyone 可写？官方文档列了常见原因和处理，本文逐项整理，并说明 mxc、elevated、unelevated 三种实现的区别。
checkedOn: 2026-10-27
sources:
  - https://learn.chatgpt.com/docs/windows/windows-sandbox
  - https://learn.chatgpt.com/docs/windows/windows-app
  - https://learn.chatgpt.com/docs/windows/wsl
  - https://learn.chatgpt.com/docs/agent-approvals-security
verify:
  - 官方文档没有给出「沙箱初始化失败」这句中文提示的原文，本文用官方 Troubleshooting 一节里的标题和原因来对应，界面上实际显示的文字以你的版本为准
  - MXC 需要的 Windows 版本号（24H2 build 26100.9278、25H2 build 26200.9278）和检测命令（要求 Codex CLI 0.162.0 及以上）来自官方文档当天的写法，之后会随更新变化
  - 官方说桌面 App 会为个人账号在设备支持时自动优先使用 MXC，没有写个人用户如何手动切换，企业和命令行的配置项见正文
---

> 本文根据 Codex 官方文档《Windows sandbox》《ChatGPT desktop app for Windows》《WSL》整理，资料核对于 2026-10-27。官方没有给出「沙箱初始化失败」的统一报错原文，本文按官方 Troubleshooting 里的几类情况来讲。配图为本站整理的示意图，不是软件截图。

## 适用于谁

- 在 Windows 上用 ChatGPT 桌面 App（Codex 模式）、Codex CLI 或 IDE 插件，沙箱设置过程失败，或设置完命令仍跑不起来的人；
- 看到 Windows 错误 `1385`，或「某些文件夹 Everyone 可写」警告的人；
- 在公司电脑上使用，设置被策略拦住的人；
- 想弄懂 `mxc`、`elevated`、`unelevated` 区别的人。

Linux 和 WSL2 里沙箱启动失败（缺少 bwrap、无法创建用户命名空间）的处理，见 [/guides/codex-permissions-sandbox](/guides/codex-permissions-sandbox)，本文只讲 Windows 原生沙箱。

## 结论先说

1. **先弄清楚自己用的是哪种沙箱。** 官方说 Codex 在 Windows 上有三种实现：`mxc`（在兼容的设备上推荐）、`elevated`（MXC 不可用时的首选后备，需要管理员批准的设置）、`unelevated`（更弱的后备）。
2. **设置失败，最常见的原因官方列了五条**：管理员或 UAC 提示被拒绝；电脑不允许创建本地用户或组；不允许修改防火墙规则；系统阻止沙箱用户需要的登录权限；公司的其他策略拦住了设置流程。
3. **个人电脑**：重新运行 `elevated` 沙箱设置，并批准管理员提示。
4. **公司电脑**：把官方文档发给 IT，问清楚是否允许「创建本地用户和组、配置防火墙、授予沙箱用户登录权限」。
5. **需要先继续工作**：如果管理策略允许，官方说可以临时用 `unelevated`，但它的隔离更弱。
6. **要给官方反馈**：发 `CODEX_HOME/.sandbox/sandbox.log`，不要发 `CODEX_HOME/.sandbox-secrets/` 的内容。

![Windows 沙箱出问题：对照官方排查](seed:g1158-sandbox-decide.png)
*图：本站根据 [Codex 官方文档：Windows sandbox](https://learn.chatgpt.com/docs/windows/windows-sandbox) 整理的示意图*

## 一、三种沙箱实现的区别

官方的描述（本站转述）：

- **mxc**：兼容 Windows 设备上推荐的沙箱。用原生进程隔离，不需要管理员批准的设置、额外的 Windows 账户或本地防火墙规则；
- **elevated**：MXC 不可用或被禁用时的首选后备。需要管理员批准的设置，沙箱里的命令不以管理员权限运行；它使用专用的低权限沙箱用户、文件系统权限边界、防火墙规则和本地策略修改；
- **unelevated**：elevated 设置不可用且组织策略允许时的后备。用你当前用户派生的受限令牌和基于 ACL 的文件系统边界；网络隔离比 elevated 弱，不支持「禁止读取路径」。

官方的选择建议：设备和策略支持就用 MXC；否则优先 elevated，unelevated 作为次选。

![Windows 三种沙箱实现怎么选](seed:g1158-sandbox-compare.png)
*图：本站根据 [Codex 官方文档：Windows sandbox](https://learn.chatgpt.com/docs/windows/windows-sandbox) 整理的示意图*

### MXC 要什么条件

官方写明，桌面 App 会为个人账号在设备支持时自动优先使用 MXC；企业部署或单独使用命令行时，可以在 `config.toml` 里设置：

```toml
[features]
prefer_mxc = true
```

设备需要已具备微软的「Microsoft Execution Containers（MXC）」能力，微软在 Windows 11 24H2（build 26100.9278）和 25H2（build 26200.9278）引入了 MXC 进程隔离。Codex CLI 0.162.0 及以上，官方给了一条不改变已保存沙箱选择的检测命令：

```powershell
codex -c windows.sandbox=mxc sandbox --include-managed-config --permission-profile :workspace -- cmd.exe /d /c echo MXC_OK
$LASTEXITCODE
```

期望输出是 `MXC_OK` 且退出码为 `0`。官方还提醒：显式选择 `windows.sandbox = "mxc"` 时，如果缺少必要的原生能力或被策略阻止，会失败。

## 二、设置失败怎么办

官方 Troubleshooting 里「My legacy sandbox setup failed」一节，列的常见原因：Windows 的 UAC 或管理员提示被拒绝；机器不允许创建本地用户或组；机器不允许修改防火墙规则；机器阻止沙箱用户需要的登录权限；其他企业策略拦住了设置流程。官方给的做法：

1. 重新做一次 `elevated` 沙箱设置，环境允许的话批准管理员提示；
2. 公司笔记本上被拦住，问 IT 是否允许管理员批准的设置（创建本地用户或组、配置防火墙、授予沙箱用户需要的登录权限）；
3. 仍失败且管理策略允许，可以在问题排查期间用 `unelevated`。

IT 部门可以在没有本地管理员权限的员工使用前，从提升权限的部署流程里预先配置 elevated 沙箱，官方给的命令是：

```powershell
codex sandbox setup --elevated --user 'DOMAIN\alice' --codex-home 'C:\Users\alice\.codex'
```

这条命令是写给 IT 的，需要把身份和路径换成对应员工的，个人用户不用执行。

## 三、其他几种常见提示

### 提示「被切换到了 unelevated 沙箱」

官方解释：`unelevated` 可能是配置里选的，也可能是 elevated 设置不可用时的后备。它仍然是沙箱模式，仍有基于 ACL 的文件系统边界，但没有独立的沙箱用户边界，网络隔离更弱。官方说这是有用的后备，不是企业长期的首选配置；受管的公司电脑先查 MXC 兼容性，不行再请 IT 配置 elevated。

### Windows 错误 1385

官方说明：沙箱里的命令报错 `1385`，是 Windows 拒绝了沙箱用户启动命令所需的登录类型。通常意味着 Codex 已经成功创建了沙箱用户，但 Windows 策略仍阻止这些用户启动命令。官方的处理：问 IT 设备策略是否给了 Codex 创建的沙箱用户需要的登录权限；如果只有部分机器或团队有问题，对比组策略或 OU 的差异；需要马上干活可以临时用 `unelevated`；并把 `CODEX_HOME/.sandbox/sandbox.log`、Windows 版本和问题描述发给官方。

### 提示某些文件夹 Everyone 可写

官方说明：Windows 权限对这些文件夹太宽，沙箱没法完整保护它们。处理：看警告里列出的文件夹；在你的环境合适的情况下，移除 `Everyone` 的写权限；然后重启 Codex 或重新运行沙箱设置。不确定怎么改权限的，请 IT 帮忙。

### 沙箱里的命令连不上网

官方说明：有些 Codex 对话是故意在没有外网访问的情况下运行的，取决于权限模式。先确认这次任务是不是本来就应该禁网；预期有网却没有，重启 Codex 再试；反复出现时收集沙箱日志给官方。权限模式怎么选见 [/guides/codex-permissions-sandbox](/guides/codex-permissions-sandbox)。

### 以前正常，后来不行了

官方列的触发情形：移动了仓库或工作区、改了机器权限、改了 Windows 策略等系统配置。官方的处理：重启 Codex；用 MXC 的话重新跑上面的兼容检测并检查有效的网络策略；用 legacy elevated 的话重新做沙箱设置；需要时临时用 `unelevated`；并收集日志。

## 四、IDE 插件装好了没反应

官方 Troubleshooting 还有一条：IDE 插件装好但没反应，可能是系统缺少 C++ 开发工具（Visual Studio Build Tools 的 C++ 工作负载、Microsoft Visual C++ Redistributable x64）。官方给的 winget 命令是 `winget install --id Microsoft.VisualStudio.2022.BuildTools -e`，装完要**完全重启 VS Code**。

## 五、不想用原生沙箱：用 WSL2

官方说，需要 Linux 原生工具链、工作流本来就在 WSL2 里，或原生 Windows 的实现满足不了需求时，可以选 WSL2。在桌面 App 里打开设置，把代理从 Windows 原生切到 WSL，并**重启应用**才生效。WSL1 只支持到 Codex 0.114，从 0.115 起 Linux 沙箱改用 bubblewrap，不再支持 WSL1。Windows 版 App 的下载和安装见 [/guides/codex-windows-app-download-install](/guides/codex-windows-app-download-install)。

## 六、反馈时带什么

官方列的：`CODEX_HOME/.sandbox/sandbox.log`；一句话说明你想做什么；选的是 `mxc`、`elevated` 还是 `unelevated`；App 里显示的错误信息；是否看到 `1385` 或其他 Windows、PowerShell 错误；Windows 的 build 号；是 Windows 11 还是 Windows 10。**不要发**的是 `CODEX_HOME/.sandbox-secrets/` 里的内容。

## 常见问题

**Q：我用的是 Windows 10，行吗？**
官方的版本表写的是：Windows 11 是推荐；「最新且完全更新的 Windows 10」是尽力而为，实际需要 1809 或更新版本；更老的 Windows 10 不推荐。MXC 另需对应的原生能力，这张表不能说明某台设备是否支持。

**Q：不开沙箱，直接全权限运行行不行？**
官方明确警告：完全访问模式下 Codex 不限于项目目录，可能做出非预期的破坏性操作导致数据丢失。官方建议保留沙箱边界，用规则做有针对性的例外，见 [/guides/codex-permissions-sandbox](/guides/codex-permissions-sandbox)。

**Q：PowerShell 提示「running scripts is disabled on this system」？**
这是 PowerShell 执行策略问题，不是沙箱。官方在 Windows 应用文档里写了，常见做法是把执行策略设成 `RemoteSigned`，修改前先看微软的执行策略说明。

**Q：用到 Codex 需要什么套餐？**
Codex 包含在 ChatGPT 各套餐里，额度不同，见 [/guides/codex-usage-limits](/guides/codex-usage-limits)；想开通 Plus 可以看 [/chongzhi/chatgpt-plus](/chongzhi/chatgpt-plus)。

## 参考资料

- Codex 官方文档：Windows sandbox — https://learn.chatgpt.com/docs/windows/windows-sandbox
- Codex 官方文档：ChatGPT desktop app for Windows — https://learn.chatgpt.com/docs/windows/windows-app
- Codex 官方文档：WSL — https://learn.chatgpt.com/docs/windows/wsl
- Codex 官方文档：Agent approvals and security — https://learn.chatgpt.com/docs/agent-approvals-security
