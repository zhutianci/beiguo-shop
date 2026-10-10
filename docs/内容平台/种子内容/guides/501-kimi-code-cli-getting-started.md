---
title: Kimi Code怎么用：CLI安装、登录、常用命令与额度规则
slug: kimi-code-cli-getting-started
products: [kimi]
models: []
accountTier: OTHER
excerpt: Kimi Code 是什么、CLI 怎么安装和登录、有哪些常用命令、额度怎么算？本文按 Kimi Code 官方文档讲清三种产品形态、macOS / Linux / Windows 的安装命令、/login 两种登录方式、斜杠命令与快捷键、5 小时窗口与月额度规则和常见报错。
checkedOn: 2026-10-11
sources:
  - https://www.kimi.com/coding/docs/
  - https://www.kimi.com/coding/docs/kimi-code-cli/guides/getting-started.html
  - https://www.kimi.com/coding/docs/kimi-code/membership.html
  - https://www.kimi.com/coding/docs/kimi-code/faq.html
---

## 适用于谁

- 搜「kimi code」「kimi code cli」「kimi code 官网」「kimi code 额度」的开发者；
- 已经是 Kimi 会员，想把额度用在写代码上的人；
- 安装或登录时遇到「No models available」等报错的人。

本文根据 Kimi Code 官方文档整理，资料核对于 2026-10-11。命令均来自官方文档，执行前建议对照官方页面确认没有变化。

## 结论先说

1. **Kimi Code 是 Kimi 会员权益里面向开发者的编程服务**，有三种官方形态：桌面端（Desktop）、终端工具（CLI）和 VS Code 扩展；会员还可以创建 API Key，把模型接到 Claude Code、OpenCode、Codex 等第三方工具里。
2. **CLI 一条命令安装**，脚本安装不需要预装 Node.js；Windows 需要先装 Git for Windows。
3. **登录有两种**：用 Kimi 账号走 OAuth（消耗会员额度），或填 Kimi 开放平台的 API Key（按量计费）。两套 Key 和接口地址不通用。
4. **改文件和执行命令前默认会问你**，只读操作自动执行。
5. **额度是共享的**：CLI、VS Code、桌面端和第三方工具的请求计入同一套配额，另有 5 小时滚动窗口限流和月总额度。

## 步骤

### 1. 确认环境

- **Windows**：先安装 Git for Windows，CLI 要用其中的 Git Bash。Git Bash 不在标准路径时，把环境变量 `KIMI_SHELL_PATH` 设为 `bash.exe` 的绝对路径；
- **Node.js**：只有用 npm 或 pnpm 安装时才需要，要求 22.19.0 或更高版本（`node --version` 查看）；
- **终端**：CLI 是全交互式界面，官方建议用支持真彩色的现代终端。

### 2. 安装

**脚本安装（官方推荐）**

macOS / Linux：

```sh
curl -fsSL https://code.kimi.com/kimi-code/install.sh | bash
```

Windows（PowerShell）：

```powershell
irm https://code.kimi.com/kimi-code/install.ps1 | iex
```

**用 npm 或 pnpm 安装**

```sh
npm install -g @moonshot-ai/kimi-code
# 或
pnpm add -g @moonshot-ai/kimi-code
```

装完运行 `kimi --version`，能显示版本号就是成功了。

### 3. 启动并登录

```sh
cd your-project
kimi
```

在交互界面里输入 `/login`，从平台选择器里选一种：

- **Kimi Code（OAuth）**：按提示在任意设备上打开链接、登录 Kimi 账号并输入验证码完成授权。用的是会员里的 Kimi Code 额度；
- **Kimi Platform API 密钥**：填入在 platform.kimi.com（国内）或 platform.kimi.ai（海外）创建的 Key，按开放平台的价格按量计费。

退出登录用 `/logout`。想接入其他厂商的模型，官方说明可以编辑 `~/.kimi-code/config.toml` 配置。

### 4. 交办第一个任务

直接用自然语言说要做什么：

```
介绍一下这个项目的目录结构，重点说明入口文件和数据库相关的代码在哪里。
```

```
在 src/utils 里新增一个把日期格式化成「2026-10-11 周日」的函数，并补充单元测试。
```

CLI 会自己读取和搜索相关文件，并在过程中说明每一步在做什么。**只读操作默认自动执行；修改文件或运行 Shell 命令前，默认会先征求你的确认**——认真看一眼它要改什么、要跑什么命令再批准，尤其是删除、安装依赖、数据库相关的命令。

不想进交互界面，只执行一条指令：

```sh
kimi -p "检查这个仓库里有没有未使用的依赖，列出来但不要删除"
```

接着上一次的会话继续：`kimi -c`。

### 5. 记住这些命令和快捷键

| 斜杠命令 | 作用 |
| --- | --- |
| `/help` | 打开命令和快捷键面板 |
| `/new` | 开新会话，清空当前上下文 |
| `/sessions` | 浏览并恢复历史会话 |
| `/model` | 切换模型 |
| `/compact` | 手动压缩上下文，释放 token |
| `/fork` | 派生当前会话的独立副本 |
| `/usage` | 查看配额和会员状态 |
| `/exit` | 退出 |

快捷键：`Esc` 中断输出或关闭弹窗；`Shift-Tab` 切换 Plan 模式（先出方案再动手）；`Ctrl-S` 在输出中途插入消息；`Ctrl-O` 折叠或展开工具输出。退出也可以连按两次 `Ctrl-C`，或在输入框为空时按 `Ctrl-D`。

### 6. 选模型

官方文档列出的模型 ID（用 `/model` 切换）：

| Model ID | 说明 |
| --- | --- |
| `k3` | K3 旗舰模型，最高支持 100 万上下文，适合大型代码库和多文件重构 |
| `k3-256k` | K3 的 256K 上下文版，消耗较低，适合日常开发 |
| `kimi-for-coding` | K2.8 Preview，最高 1M 上下文 |
| `kimi-for-coding-highspeed` | K2.7 Code 高速版，推理速度快 |

不同模型对应不同的会员档位。日常开发用消耗较低的版本，遇到大范围重构再切到 `k3`。

### 7. 弄清额度规则

按官方「会员权益」文档：

- **同一套配额**：CLI、VS Code 扩展、桌面端和第三方工具的请求都计入同一额度，所有登录设备和 API Key 共享；
- **5 小时滚动窗口**：请求过于频繁会触发限流，窗口滚动后自动恢复；
- **月总额度**：用完后 Kimi Code 额度冻结，等月额度重置或升级订阅；
- **加油包**：订阅额度耗尽后可以按实际用量付费继续用，可设置每月消费上限。官方写明的充值规则是单次最低 25 元、每日最多 10 次，余额不过期，一般不可退款；
- **设备**：超过 30 天不活跃的设备会自动解绑，重新 `/login` 即可。

随时用 `/usage` 看剩余配额。官方文档里同时出现了「老套餐」和「新套餐」两套档位名称，哪个档位能用哪些模型、是否包含 1M 上下文，以官方会员权益页面当前的表格为准。

### 8. 升级和卸载

- 升级：在终端运行 `kimi upgrade`，或 `npm install -g @moonshot-ai/kimi-code@latest`；
- 卸载：脚本安装的删除 `kimi` 可执行文件；npm 安装的运行 `npm uninstall -g @moonshot-ai/kimi-code`。

## 常见问题

**Q：`/login` 后提示「No models available for the selected platform」？**
官方给的原因：API 密钥无效或过期，或者无法访问对应的接口地址；另外接口地址必须和密钥所属平台匹配。Kimi Code 国内地址是 `https://api.kimi.com/coding/`，开放平台国内地址是 `https://api.moonshot.cn/v1`，两者的 Key 不能混用。

**Q：提示会员过期或配额用尽？**
用 `/usage` 确认状态。限流等 5 小时窗口滚动；月额度用完则等重置、升级，或开启加油包。

**Q：粘贴图片失败，提示当前模型不支持图片输入？**
换一个支持图片输入的模型，并确认剪贴板里是图片本身而不是图片的文件路径。

**Q：macOS 第一次运行特别慢？**
官方说明是系统的 Gatekeeper 首次检查导致，之后会恢复正常。

**Q：可以把 Kimi Code 的 Key 用在别的工具里吗？**
可以，官方文档提供了 Claude Code、OpenCode、Codex 等工具的接入页面，接口同时兼容 OpenAI 和 Anthropic 协议。注意官方提醒：篡改客户端标识（User-Agent）可能导致会员权益被暂停，按官方文档的方式配置即可。

**Q：VS Code 扩展提示找不到 CLI 或未打开工作区？**
先在 VS Code 里打开一个文件夹；找不到 CLI 时手动安装 Kimi Code CLI，并在设置里配置 `kimi.executablePath`。可以通过命令「Kimi Code: Show Logs」查看错误日志。

**Q：它和 Claude Code 是什么关系？**
两个独立的产品，用法相似（终端里的编程 Agent）。Kimi Code 用的是 Kimi 的模型和会员额度。Claude Code 的入门见《Claude Code 中文入门教程》。

## 参考资料

- Kimi Code 文档：产品概览 — https://www.kimi.com/coding/docs/
- Kimi Code CLI：开始使用 — https://www.kimi.com/coding/docs/kimi-code-cli/guides/getting-started.html
- Kimi Code：会员权益 — https://www.kimi.com/coding/docs/kimi-code/membership.html
- Kimi Code：常见问题 — https://www.kimi.com/coding/docs/kimi-code/faq.html
