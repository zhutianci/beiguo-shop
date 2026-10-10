---
title: Ollama怎么用：安装、下载模型与常用命令（Windows / macOS / Linux）
slug: ollama-how-to-use-install-commands
products: [ai-tools]
models: []
accountTier: FREE
excerpt: Ollama怎么用？本文按 Ollama 官方文档讲清三个系统的安装方式和系统要求、第一条 ollama run 命令、pull / ls / ps / stop / rm 等常用命令的作用，以及怎么看模型是否跑在显卡上、怎么升级和卸载。
checkedOn: 2026-10-11
sources:
  - https://docs.ollama.com/quickstart
  - https://docs.ollama.com/cli
  - https://docs.ollama.com/windows
  - https://docs.ollama.com/macos
  - https://docs.ollama.com/linux
  - https://docs.ollama.com/faq
  - https://docs.ollama.com/context-length
---

## 适用于谁

- 搜「ollama怎么用」「ollama 安装」「ollama 常用命令」，想在自己电脑上跑开源大模型的人；
- 装好了但只会 `ollama run`，想知道其他命令是干什么的人。

本文根据 Ollama 官方文档整理，资料核对于 2026-10-11。文中的模型名（如 `gemma4`）沿用官方文档示例，换成你想跑的模型即可。只想跑 DeepSeek 的话，可以直接看《DeepSeek本地部署教程》。

## 结论先说

1. **Ollama 是在本机下载和运行开源模型的工具**，装完后后台常驻，命令行里用 `ollama` 操作，同时在 `http://localhost:11434` 提供本地 API。
2. **一条命令就能开始**：`ollama run 模型名`，没下载过会自动下载，然后进入对话，输入 `/bye` 退出。
3. **常用命令不到十个**：`run`、`pull`、`ls`、`ps`、`stop`、`rm`、`create`、`serve`。
4. **跑得快不快先看 `ollama ps`**：`PROCESSOR` 一列显示 `100% GPU` 才是完全跑在显卡上。
5. 官方说明本地运行时不会看到你的提示词和数据；云端模型是另一回事，见文末。

## 步骤

### 1. 安装

到 ollama.com/download 下载对应系统的安装包。官方文档列出的要求：

| 系统 | 要求 | 安装方式 |
| --- | --- | --- |
| Windows | Windows 10 22H2 或更新（家庭版、专业版均可）；NVIDIA 显卡需要 551.61 或更新的驱动 | 运行 `OllamaSetup.exe`，不需要管理员权限，默认装在用户目录 |
| macOS | macOS Sonoma（14）或更新；Apple M 系列芯片支持 CPU 和 GPU，Intel 机型只用 CPU | 打开 `ollama.dmg`，把应用拖进「应用程序」 |
| Linux | — | 终端执行 `curl -fsSL https://ollama.com/install.sh \| sh` |

Windows 版的程序本身至少需要 4GB 空间，模型另算。官方提醒模型体积从几十 GB 到上百 GB 不等，系统盘不够的话先看《Ollama 修改模型存储位置》。

装好后验证：

```bash
ollama -v
```

### 2. 跑第一个模型

```bash
ollama run gemma4
```

第一次会先下载模型，完成后出现 `>>>` 提示符，直接打字提问。几个交互技巧：

- 输入 `/bye` 退出对话；
- 多行输入用三个双引号包起来：先输入 `"""`，写完再输入 `"""` 结束；
- 支持图片的模型，可以把图片路径写进问题里，例如 `ollama run gemma4 "这张图里有什么？ /path/to/图片.png"`。

模型名后面可以带标签选规格，写法是 `模型名:标签`，例如官方快速开始里的 `gemma4:e2b`。有哪些模型和标签，到 ollama.com/search 查。

### 3. 常用命令

| 命令 | 作用 |
| --- | --- |
| `ollama run 模型名` | 运行模型并进入对话（没有就先下载） |
| `ollama pull 模型名` | 只下载或更新模型，不进入对话 |
| `ollama ls` | 列出本机已下载的模型 |
| `ollama ps` | 列出当前加载在内存里的模型 |
| `ollama stop 模型名` | 立刻把模型从内存里卸载 |
| `ollama rm 模型名` | 删除本机的模型文件 |
| `ollama show --modelfile 模型名` | 查看模型的 Modelfile（模板、参数） |
| `ollama create 名字 -f Modelfile` | 用 Modelfile 创建自定义模型 |
| `ollama serve` | 手动启动服务（桌面应用会自动启动，一般用不到） |
| `ollama signin` / `ollama signout` | 登录、退出 Ollama 账号（用云端模型时才需要） |

`ollama serve --help` 可以看到所有可设置的环境变量。

### 4. 看模型是不是跑在显卡上

```bash
ollama ps
```

官方文档给出的输出示例：

```
NAME             ID              SIZE      PROCESSOR    CONTEXT    UNTIL
gemma4:latest    c6eb396dbd59    9.6 GB    100% GPU     131072     2 minutes from now
```

`PROCESSOR` 一列的含义：

- `100% GPU`：模型完整加载到显存；
- `100% CPU`：完全在内存里跑，速度会慢很多；
- `48%/52% CPU/GPU`：显存不够，一部分放在内存。出现这种情况说明模型对你的显卡来说偏大，换小一档的规格更实际。

`UNTIL` 是模型自动卸载的时间：默认在内存里保留 5 分钟，方便连续提问。

### 5. 调上下文长度

上下文长度决定模型一次能「记住」多少内容。官方文档写明，默认值按显存大小自动选：不足 24 GiB 用 4k，24–48 GiB 用 32k，48 GiB 及以上用 256k。并建议联网搜索、智能体、编程工具这类任务至少设到 64000。

两种改法：

- 桌面应用：在设置里拖动上下文长度的滑块；
- 命令行启动服务时指定：`OLLAMA_CONTEXT_LENGTH=64000 ollama serve`。

上下文越大占用显存越多，改完用 `ollama ps` 看 `CONTEXT` 和 `PROCESSOR` 两列确认。

### 6. 升级与卸载

- **升级**：macOS 和 Windows 会自动下载更新，点任务栏或菜单栏图标里的「Restart to update」生效；Linux 重新执行一次安装脚本。
- **卸载**：Windows 在「添加或删除程序」里卸载。注意如果你改过模型存放位置，卸载程序不会删除那里的模型，需要手动清理。macOS 要删除的文件夹清单见官方 macOS 文档。

## 常见问题

**Q：模型下载到哪里了？**
官方 FAQ 给出的默认位置：macOS 在 `~/.ollama/models`，Linux 在 `/usr/share/ollama/.ollama/models`，Windows 在 `C:\Users\用户名\.ollama\models`。

**Q：Ollama 会把我的对话传回去吗？**
官方 FAQ 的回答是：本地运行时看不到你的提示词和数据。使用云端模型时会处理提示词和回复以提供服务，但称不存储、不记录这些内容，也不用于训练。想完全只在本地用，可以设置环境变量 `OLLAMA_NO_CLOUD=1` 关闭云端功能（同时会失去云端模型和联网搜索）。

**Q：没有独立显卡能用吗？**
能，只是会用 CPU 和内存跑，速度慢。选参数量小的模型，见《本地大模型怎么选》。

**Q：Windows 终端里进度条显示成方块？**
官方说明是旧终端字体不支持进度条用到的 Unicode 字符，换一个终端字体即可，不影响下载。

**Q：日志在哪里看？**
Windows 在 `%LOCALAPPDATA%\Ollama`（`server.log` 是服务日志），macOS 在 `~/.ollama/logs`。

**Q：怎么接到 Claude Code、Codex 这类编程工具？**
官方提供了 `ollama launch` 命令，例如 `ollama launch claude`，按提示选择模型即可，支持的工具列表见官方 CLI 文档。

## 参考资料

- Ollama 文档：Quickstart — https://docs.ollama.com/quickstart
- CLI Reference — https://docs.ollama.com/cli
- Windows — https://docs.ollama.com/windows
- macOS — https://docs.ollama.com/macos
- Linux — https://docs.ollama.com/linux
- FAQ — https://docs.ollama.com/faq
- Context length — https://docs.ollama.com/context-length
