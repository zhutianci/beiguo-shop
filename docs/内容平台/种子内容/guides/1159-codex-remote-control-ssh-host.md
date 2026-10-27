---
title: Codex 远程控制授权失败怎么办、远程 SSH 怎么用：手机配对电脑、Remote Control、连接 SSH 主机的官方步骤
slug: codex-remote-control-ssh-host
products: [codex, chatgpt]
models: []
accountTier: PLUS
excerpt: 用手机远程控制电脑上的 Codex，配对不成功或授权失败？官方 Remote connections 文档写了配对步骤和五类常见问题，也讲了怎么把桌面 App 连到 SSH 主机、怎么在主机之间交接对话。本文按官方文档整理，并给出一张排查对照图。
checkedOn: 2026-10-27
sources:
  - https://learn.chatgpt.com/docs/remote-connections
  - https://learn.chatgpt.com/docs/mobile
  - https://learn.chatgpt.com/docs/auth
verify:
  - 官方文档没有给出「授权失败」这句提示的统一原文，本文按官方 Troubleshooting 里的五种情况整理
  - 远程访问目前只支持运行在 macOS 和 Windows 上的 ChatGPT 桌面 App 主机，可用范围会随推出批次变化，以官方文档和你账号里实际显示的为准
  - 界面名称（Control this Mac or PC、Allow other devices to connect、Codex 或 Remote）来自官方文档当天的写法，实际界面以你的版本为准
  - 官方写明 2026 年 6 月 8 日之后没有用过的旧连接需要重新配对
---

> 本文根据 Codex 官方文档《Remote connections》《Codex on mobile》整理，资料核对于 2026-10-27。**官方没有统一的「授权失败」提示原文**，本文按官方文档里的配对流程和 Troubleshooting 来讲。配图为本站整理的示意图，不是软件截图。

## 适用于谁

- 想用手机查看、批准、继续电脑上的 Codex 任务，配对或授权失败的人；
- 开了远程控制，手机上却看不到电脑，或批准请求不出现的人；
- 想让桌面 App 连到远程服务器（SSH 主机）上跑 Codex 的人；
- 想把一个对话在本机和远程主机之间交接的人。

## 结论先说

1. **远程访问的主机必须是运行 ChatGPT 桌面 App 的 Mac 或 Windows 电脑**，并且醒着、联网、登录着同一个 ChatGPT 账号和工作区。官方说明，手机配对必须从桌面 App 里发起，**不能从 Codex CLI 或 IDE 插件设置**。
2. **配对流程**：电脑端 **Settings > Connections > Control this Mac or PC**，点 **Set up** 或 **Add**，批准远程访问并完成验证 → 手机扫码 → 在 ChatGPT 里确认账号和工作区并完成多重验证、SSO 或通行密钥。
3. **授权失败或被验证拦住**：先把验证流程走完；用的是工作区账号，要请管理员确认已经开启 **Remote Control** 权限。
4. **手机上没看到电脑**：确认电脑上 App 在运行、已开 **Allow other devices to connect**、两边账号和工作区相同。
5. **官方写明 2026 年 6 月 8 日之后没有用过的旧连接需要更新两边 App 并重新配对。**
6. **连 SSH 主机**是另一回事：在桌面 App 的 **Settings > Connections** 里添加 SSH 主机，主机要事先装好并登录 Codex。

![手机远程控制电脑上的 Codex：4 步](seed:g1159-mobile-pair-steps.png)
*图：本站根据 [Codex 官方文档：Remote connections](https://learn.chatgpt.com/docs/remote-connections) 整理的示意图*

## 一、配对前要准备什么

官方列的条件（本站转述）：

- 你的 ChatGPT 账号和工作区有 Codex 访问权限；
- 手机上是最新版 ChatGPT App（iOS 或 Android）。如果在 iOS 上没看到 **Codex**，或旧版里没看到 **Remote**，先更新 ChatGPT；
- 电脑上是最新版 ChatGPT 桌面 App（macOS 或 Windows），保持唤醒、联网，且登录同一个账号和工作区；
- 该账号或工作区要求的多重验证、SSO 或通行密钥配置；
- 用的是 ChatGPT 工作区的话，管理员可能需要先开启 Remote Control 权限。

官方强调：远程访问用的是**被控电脑上的**项目、对话、文件、凭据、权限、插件、Computer Use、浏览器设置和本地工具。手机只是发提示词、批准操作、发后续消息。

## 二、配对步骤

官方的四步（本站转述）：

1. **在电脑上开始**：打开主机上的 ChatGPT 桌面 App，进入 **Settings > Connections > Control this Mac or PC**，点 **Set up** 或 **Add**，批准远程访问，并完成要求的验证；
2. **扫码**：用手机扫描 App 里显示的二维码，它会打开 ChatGPT 让你完成连接；
3. **在 ChatGPT 里完成**：确认同一个账号和工作区，完成多重验证、SSO 或通行密钥；成功后，这台电脑会出现在 iOS 的 **Codex**（旧版显示 **Remote**）里；
4. **检查主机设置**：在电脑 App 的 **Settings > Connections** 管理已连接设备，还能选择是否让电脑保持唤醒、启用 Computer Use、安装 Chrome 扩展。

二维码把**一部手机和一台主机**配对。要控制多台主机，每台都要各配一次。

## 三、连不上、授权失败，对照官方 Troubleshooting

![远程控制连不上：对照官方排查](seed:g1159-remote-decide.png)
*图：本站根据 [Codex 官方文档：Remote connections](https://learn.chatgpt.com/docs/remote-connections) 整理的示意图*

官方列了五种情况：

- **手机上看不到主机**：确认主机上的桌面 App 正在运行、已开启 **Allow other devices to connect**，两台设备用同一个 ChatGPT 账号和工作区。如果你从 2026 年 6 月 8 日起没用过这个连接，要更新两个 App 并重新配对；
- **重新登录后 Remote Control 是关的**：退出 ChatGPT 会关闭 **Remote Control**，但**不会删除**已有的设备配对。重新登录后，打开 **Remote Control** 就能恢复之前的连接状态。如果打开后点 **Add** 报错，重启主机上的 ChatGPT 桌面 App 再试；
- **批准请求没出现**：在 iOS 上打开 **Codex**（旧版是 **Remote**），确认手机和主机账号、工作区一致，重新扫码，或从主机重新开始设置。用工作区的话，请管理员确认已开启 Remote Control；
- **远程会话断开**：看主机是不是睡眠了、断网了或关了 App，让它保持唤醒并联网；
- **验证拦住设置**：把设置过程中弹出的账号或工作区验证走完；组织要求 SSO、多重验证或通行密钥的，先完成。仍失败，请工作区管理员确认已开启 Remote Control。

## 四、电脑休眠怎么办

官方说：电脑睡眠、断网或关闭 App，远程访问就会停止，直到恢复。官方的建议是接通电源并在主机连接设置里选择保持唤醒（如可用）。Mac 笔记本在合盖时需要外接显示器才能保持可用，选择 **Sleep** 仍会停止远程访问。Windows 主机上，如果任务用到 Computer Use，要保持会话解锁，因为 Computer Use 在 Windows 上是在前台运行的，见 [/guides/codex-computer-use-not-found](/guides/codex-computer-use-not-found)。

## 五、连接 SSH 主机

这是另一个功能：在桌面 App 里添加 SSH 主机上的远程项目，对话在远程文件系统和 shell 里运行。官方步骤：

1. 把主机写进 SSH 配置，让 Codex 能自动发现。官方的示例：

```text
Host devbox
  HostName devbox.example.com
  User you
  IdentityFile ~/.ssh/id_ed25519
```

Codex 会读取 `~/.ssh/config` 里具体的主机别名，用 OpenSSH 解析，忽略只有通配模式的主机。

2. 先在运行 App 的这台机器上确认 `ssh devbox` 能连上；
3. 在远程主机上**安装并登录 Codex**。App 会通过 SSH、用远程用户的登录 shell 启动远程 Codex app server，所以 `codex` 命令必须在那个 shell 的 `PATH` 里；
4. 在 App 的 **Settings > Connections** 里添加或启用这台 SSH 主机，再选一个远程项目文件夹。

安全方面官方的要求：保持和日常 SSH 一样的安全预期（可信密钥、最小权限账号、没有无需认证的公网监听）；不要把 app-server 的传输端口直接暴露在共享或公共网络上；要在当前网络之外访问远程机器，用 VPN 或组网工具，而不是把它直接暴露到互联网。

### 在主机之间交接对话（Handoff）

交接会把一个已有的对话及其 Git 状态在本机和已连接的远程主机之间移动。前提：目标主机已连接，并且在目标主机上保存了同一个 Git 仓库的项目（项目是子目录的话，两边要保存同一子目录）。步骤：在 App 里打开对话，在对话底部选当前运行位置，再选目标主机（从远程交接回本机选 **This computer**），确认目标和分支后点 **Hand off**。官方说明：对话正在运行时，交接会中断当前回答；不能交接发出请求的这个对话本身；不支持交接到 Codex 云端环境。

## 常见问题

**Q：Android 和 iOS 都能用吗？**
官方写的是可以从 iOS 或 Android 上的 ChatGPT 控制主机，具体可用范围随推出批次变化。在 iOS 上入口是 **Codex**，旧版是 **Remote**。

**Q：手机能做什么？**
官方列的：在主机上的项目里新建或继续对话、发后续指令、批准命令和其他操作、查看输出、改动、测试结果、终端输出和截图、完成时收到通知、在已连接主机之间切换。更详细的手机端说明见官方《Codex on mobile》。

**Q：这和 Work 的「本地电脑访问」是一回事吗？**
不是。官方文档把「Local computer access with Work Cloud」单独写了：它适用于启用后新建的任务，已有任务保持原来的模式。Work 和 Codex 的区别见 [/guides/chatgpt-work-vs-codex](/guides/chatgpt-work-vs-codex)。

**Q：必须付费吗？**
官方 Pricing 页写明 Work 和 Codex 包含在各 ChatGPT 套餐里，是否有远程功能取决于推出范围和工作区设置。想开通 Plus 可以看 [/chongzhi/chatgpt-plus](/chongzhi/chatgpt-plus)，额度见 [/guides/codex-usage-limits](/guides/codex-usage-limits)。

**Q：登录有问题？**
见 [/guides/codex-cannot-sign-in-send-message-connect](/guides/codex-cannot-sign-in-send-message-connect)。

## 参考资料

- Codex 官方文档：Remote connections — https://learn.chatgpt.com/docs/remote-connections
- Codex 官方文档：Codex on mobile — https://learn.chatgpt.com/docs/mobile
- Codex 官方文档：Authentication — https://learn.chatgpt.com/docs/auth
