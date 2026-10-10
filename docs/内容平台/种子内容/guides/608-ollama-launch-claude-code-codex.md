---
title: Ollama 接入 Claude Code 与 Codex 教程：ollama launch 一条命令、手动配置与上下文设置
slug: ollama-launch-claude-code-codex
products: [ai-tools]
models: []
accountTier: FREE
excerpt: 怎么让 Claude Code、Codex 用上 Ollama 的本地或云端模型？本文按 Ollama 官方文档讲清 ollama launch 的用法、手动设置环境变量、上下文为什么至少要 64k，以及报错时先查什么。
checkedOn: 2026-10-11
sources:
  - https://docs.ollama.com/integrations/claude-code
  - https://docs.ollama.com/integrations/codex
  - https://docs.ollama.com/cli
  - https://docs.ollama.com/context-length
  - https://docs.ollama.com/cloud
---

## 适用于谁

- 搜「ollama claude code」「ollama launch claude」「ollama launch codex」的人；
- 已经在用 Claude Code 或 Codex，想试试让它们跑在本地模型或 Ollama 云端模型上的人。

本文根据 Ollama 官方文档整理，资料核对于 2026-10-11。前提是已经装好 Ollama，见《Ollama怎么用》。Claude Code 和 Codex 本身的用法见站内对应的入门教程。

需要先说明一点：这是 Ollama 官方提供的接入方式，让这两个工具改用 Ollama 提供的模型，效果取决于你选的模型。开源模型在复杂的编程任务上与原厂模型有差距，本文不做效果承诺。

## 结论先说

1. **最快的方式是一条命令**：在项目目录里执行 `ollama launch claude` 或 `ollama launch codex`，按提示选模型。
2. **原理是兼容接口**：Ollama 官方说明它通过 Anthropic 兼容的 API，把 Claude Code 连接到本地模型和云端模型。
3. **上下文长度要够**。官方要求：选择上下文足够容纳你的代码仓库的模型；较大的仓库把上下文设到 64k 或更高。Codex 文档写的是至少 64k。
4. **本地显存不够，可以用 Ollama 的云端模型**（模型名带 `:cloud`），不用下载，但需要登录 Ollama 账号。
5. **报错先查两样**：模型是否支持工具调用；上下文长度是否太小。

## 步骤

### 1. 用 ollama launch 启动 Claude Code

在你的项目目录里：

```bash
ollama launch claude
```

官方说明，没有安装 Claude Code 时 Ollama 会询问是否安装；然后让你选择模型。进入之后可以先试一句：

```
Explain how this repository is organized.
```

常用的变体：

```bash
ollama launch claude --model 模型名     # 直接指定模型
ollama launch claude --config           # 只配置，不启动
ollama launch                           # 交互式选择要启动的工具
```

官方文档列出通过 Ollama 使用 Claude Code 时可用的能力：对话、执行命令（沿用 Claude Code 的权限确认流程）、工具调用、读写项目文件、子智能体、通过 Ollama 进行网页搜索和网页抓取、发送图片和截图、思考控制。其中工具调用和思考需要模型本身支持。

### 2. 选模型

官方给了两条路：

- **云端模型**：不用下载就能用更大的模型，模型名以 `:cloud` 结尾。需要先 `ollama signin` 登录；
- **本地模型**：选一个模型，并把上下文窗口设到 64k 以上。

本地模型能选多大，取决于显存，判断方法见《本地大模型怎么选》。要特别注意的是，上下文设到 64k 会明显增加显存占用，原来刚好能装下的模型可能就装不下了。

### 3. 把上下文长度调到 64k

Ollama 的默认上下文按显存自动选择，显存不足 24 GiB 时默认只有 4k，对编程工具来说远远不够。官方文档明确写着：联网搜索、智能体和编程工具这类需要大上下文的任务，应当设置到至少 64000。

两种改法：

- 桌面应用：在设置里拖动上下文长度滑块；
- 启动服务时指定：

```bash
OLLAMA_CONTEXT_LENGTH=64000 ollama serve
```

改完用 `ollama ps` 确认 `CONTEXT` 一列的数值，同时看 `PROCESSOR` 是否还是 `100% GPU`。

### 4. 手动配置 Claude Code（不用 launch）

想自己掌控配置，或者 Claude Code 已经装好了，可以手动设置三个环境变量：

```bash
export ANTHROPIC_AUTH_TOKEN=ollama
export ANTHROPIC_API_KEY=""
export ANTHROPIC_BASE_URL=http://localhost:11434
claude --model 模型名
```

也可以写成一行，只对这一次启动生效：

```bash
ANTHROPIC_AUTH_TOKEN=ollama ANTHROPIC_BASE_URL=http://localhost:11434 ANTHROPIC_API_KEY="" claude --model 模型名
```

Windows PowerShell 里用 `$env:变量名 = "值"` 的写法逐个设置。

官方提醒：Claude Code 的设置文件可能覆盖终端里的环境变量。如果连不上，检查设置里是否写了别的 base URL 或凭据，然后在 Claude Code 里执行 `/status` 查看当前连接。

想恢复成使用 Anthropic 官方服务，去掉这几个环境变量（并检查设置文件）重新启动即可。

### 5. 不装 Ollama，直连 Ollama 云端

官方文档还给了不经过本机 Ollama 的写法。先在 ollama.com 创建 API Key 并放进 `OLLAMA_API_KEY`：

```bash
ANTHROPIC_BASE_URL=https://ollama.com \
ANTHROPIC_AUTH_TOKEN="$OLLAMA_API_KEY" \
ANTHROPIC_API_KEY="" \
claude --model 云端模型名
```

官方说明要选支持工具调用的云端模型；基本的对话和文件编辑在兼容的模型上可用，但托管的 WebSearch 和高级的工具控制没有被完整支持。

### 6. 启动 Codex

先安装 Codex CLI：

```bash
npm install -g @openai/codex
```

然后：

```bash
ollama launch codex
```

官方说明，通过这条命令启动时，Ollama 会刷新模型目录，并为这次会话使用一个专用的 Codex 配置。相关命令：

```bash
ollama launch codex --config     # 只配置不启动
ollama launch codex --restore    # 移除 Ollama 生成的配置和模型目录
```

手动方式是用 Codex 的 `--oss` 参数：

```bash
codex --oss                 # 使用 Ollama
codex --oss -m 模型名       # 指定模型（云端模型同样用带 :cloud 的名字）
```

需要长期固定的配置时，官方文档给出了在 `~/.codex/` 下创建专用配置文件的写法，字段以官方文档为准。

### 7. 在脚本和 CI 里无交互运行

```bash
ollama launch claude --model 模型名 --yes -- -p "how does this repository work?"
```

官方对这条命令的解释：`--yes` 会跳过所有选择界面、在需要时自动拉取模型，并且**必须同时指定 `--model`**；`--` 之后的参数原样传给 Claude Code。

## 常见问题

**Q：报错或者模型不调用工具、不改文件？**
先确认所选模型支持工具调用（在 Ollama 模型库页面上带有 tools 标记）。不支持工具调用的模型只能聊天，没法读写文件和执行命令。

**Q：回答到一半开始胡言乱语，或者忘了前面的内容？**
多半是上下文太小。按第 3 步调到 64k 以上，并用 `ollama ps` 确认生效。

**Q：速度很慢？**
看 `ollama ps` 的 `PROCESSOR` 一列。出现 CPU 和 GPU 的比例说明显存不够，一部分在用内存跑。换小一档的模型，或者改用云端模型。

**Q：用云端模型，代码会被上传吗？**
会发送到 Ollama 的云端处理。Ollama 官方 FAQ 的说法是：使用云端模型时会处理提示词和回复以提供服务，但不存储、不记录这些内容，也不用于训练。公司代码是否允许这样用，按你们自己的规定判断。完全不想出本机，就只用本地模型，并可以设置 `OLLAMA_NO_CLOUD=1`。

**Q：Claude Code 的权限确认还在吗？**
在。官方文档说明执行命令仍然走 Claude Code 的权限流程。不要为了省事在自己的电脑上使用跳过权限确认的参数，官方文档提到这个参数时限定的是「隔离环境」。

**Q：除了这两个，还能接什么？**
官方 CLI 文档列出的 `ollama launch` 支持的工具包括 OpenCode、Claude Code、Codex、VS Code、Droid 等，以你安装的版本为准。

## 参考资料

- Ollama 文档：Claude Code — https://docs.ollama.com/integrations/claude-code
- Ollama 文档：Codex CLI — https://docs.ollama.com/integrations/codex
- CLI Reference（ollama launch）— https://docs.ollama.com/cli
- Context length — https://docs.ollama.com/context-length
- Cloud — https://docs.ollama.com/cloud
