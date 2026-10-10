---
title: DeepSeek本地部署教程：用Ollama运行DeepSeek-R1（硬件要求、命令与常见问题）
slug: deepseek-local-deploy-ollama
products: [ai-tools]
models: [deepseek]
accountTier: FREE
excerpt: DeepSeek 本地部署怎么做、要什么配置？本文按 Ollama 官方模型页讲清 DeepSeek-R1 各尺寸的体积与选择、安装和运行命令、上下文长度设置、本地 API 调用，以及本地版和官方在线版的差别。
checkedOn: 2026-10-11
sources:
  - https://ollama.com/library/deepseek-r1
  - https://ollama.com/search?q=deepseek
  - https://docs.ollama.com/quickstart
  - https://docs.ollama.com/context-length
  - https://api-docs.deepseek.com/zh-cn/news/news260910
---

## 适用于谁

- 搜「deepseek 本地部署」「deepseek本地部署教程」「deepseek 本地部署硬件要求」「deepseek ollama 本地部署」的人；
- 想离线使用、或者不想把内部资料发到云端，愿意接受效果打折的人。

本文根据 Ollama 官方模型库页面、Ollama 官方文档和 DeepSeek 官方公告整理，资料核对于 2026-10-11。

## 结论先说

1. **个人电脑上能跑的是「蒸馏小模型」，不是官方在线版**。Ollama 模型库里 `deepseek-r1` 提供 1.5b 到 671b 多个尺寸，小尺寸是用 DeepSeek-R1 的推理数据在其他开源小模型上蒸馏出来的，能力和网页版差距明显。
2. **选尺寸先看体积**：模型文件从 1.1GB 到 404GB 不等，内存或显存要装得下模型还得留余量。
3. **三步就能跑起来**：装 Ollama → `ollama run deepseek-r1` → 在终端里对话。
4. **本地部署只解决「离线、不排队、数据不出本机」**，不会带来联网搜索，也不会比在线版更聪明。

## 先弄清：你下载的是什么

Ollama 模型页（2026-10-11 核对）列出的 `deepseek-r1` 各标签：

| 标签 | 文件体积 | 上下文窗口 | 说明 |
| --- | --- | --- | --- |
| deepseek-r1:1.5b | 1.1GB | 128K | 最小，能跑但能力有限 |
| deepseek-r1:7b | 4.7GB | 128K | |
| deepseek-r1:8b | 5.2GB | 128K | 默认标签（latest） |
| deepseek-r1:14b | 9.0GB | 128K | |
| deepseek-r1:32b | 20GB | 128K | |
| deepseek-r1:70b | 43GB | 128K | |
| deepseek-r1:671b | 404GB | 160K | 完整版，个人设备基本无法运行 |

模型页说明，默认的 8b 是 DeepSeek-R1-0528-Qwen3-8B，即在 Qwen3 8B 上蒸馏的版本；只有 671b 才是完整的 DeepSeek-R1。

另外两点容易混淆：

- Ollama 上还能搜到 `deepseek-v4.1-flash`、`deepseek-v4-pro`，它们带的是 **cloud** 标记，是通过 Ollama 云端调用的在线模型，不会下载到你的电脑上运行；
- DeepSeek 官方 2026-09-10 的公告说 V4.1 Flash 的权重已在 Hugging Face 开源，但那是一个 552B 参数的大模型，面向有大规模算力的机构，不是个人电脑的选项。

## 硬件怎么估

Ollama 的模型页只给了文件体积，没有给每个尺寸的最低配置表。可以按这个思路估算：

- **模型要整个装进内存或显存**，所以可用显存（或没有独显时的内存）要大于文件体积，并给上下文留出余量；
- **有独立显卡时看显存**：比如 8GB 显存适合 7b / 8b 这一档，24GB 显存可以试 32b（20GB）；
- **装不进显存就会分一部分到 CPU 跑**，能用但明显变慢。运行 `ollama ps` 可以看到 `PROCESSOR` 一列，显示「100% GPU」说明完全在显卡上；
- **硬盘**至少留出模型体积的空间。

拿不准就从默认的 8b 开始，够快再往上换。

## 步骤

### 1. 安装 Ollama

到 Ollama 官网下载页下载 macOS、Windows 或 Linux 版本并安装。安装后可以直接打开桌面应用，也可以在终端里使用 `ollama` 命令。

### 2. 下载并运行模型

```bash
ollama run deepseek-r1          # 默认 8b，约 5.2GB
ollama run deepseek-r1:14b      # 指定尺寸
```

第一次运行会自动下载，完成后出现输入提示符，直接打字提问。输入 `/bye` 退出。以后想更新到新版本，运行 `ollama pull deepseek-r1`。

R1 是推理模型，回答前会先输出一段思考过程，这是正常现象。

### 3. 调整上下文长度

Ollama 文档说明，默认上下文长度按显存自动决定：显存小于 24GiB 时是 4k，24–48GiB 时 32k，48GiB 以上 256k。4k 很容易不够用——长文档读一半就「忘了前面」，多半是这个原因。

调整方法：在 Ollama 桌面应用的设置里拖动上下文长度滑块，或者启动服务时设置环境变量：

```bash
OLLAMA_CONTEXT_LENGTH=32000 ollama serve
```

上下文越大占用显存越多。官方建议联网搜索、Agent、编程工具这类任务至少设到 64000，前提是硬件撑得住。

### 4. 用本地 API 接到其他工具

Ollama 运行后会在本机 11434 端口提供接口，模型页给的调用示例：

```bash
curl http://localhost:11434/api/chat \
  -d '{
    "model": "deepseek-r1",
    "messages": [{"role": "user", "content": "你好"}]
  }'
```

支持自定义接口地址的聊天客户端、笔记插件、编程工具，把地址指向本机这个端口即可。

## 常见问题

**Q：本地版和网页版 DeepSeek 一样吗？**
不一样。网页版 / App 用的是官方在线的最新模型，还带联网搜索和文件解析；本地小尺寸是蒸馏模型，适合简单问答、改写、离线场景，复杂推理和长文写作差距明显。

**Q：没有独立显卡能跑吗？**
能，用 CPU 和内存跑，速度慢。选 1.5b 或 7b / 8b，并确保内存明显大于模型体积。

**Q：下载很慢或中断怎么办？**
重新执行同一条 `ollama run` 或 `ollama pull` 命令继续即可；换个时间段或网络再试。

**Q：本地部署能联网搜索吗？**
模型本身不能联网。需要搜索能力得靠外层工具（带搜索功能的客户端或 Agent 框架）调用，具体看所用工具的说明。

**Q：本地模型是不是「没有限制」？**
不是。模型的安全训练在权重里，本地运行不会改变这一点；本文也不提供任何规避内容安全机制的方法。

**Q：公司想私有化部署完整版怎么办？**
完整尺寸的模型需要服务器级的多卡算力，属于工程项目。先评估是否直接用官方 API 更划算，见《DeepSeek API 怎么用》。

## 参考资料

- Ollama 模型库：deepseek-r1 — https://ollama.com/library/deepseek-r1
- Ollama 模型搜索：deepseek — https://ollama.com/search?q=deepseek
- Ollama 文档：Quickstart — https://docs.ollama.com/quickstart
- Ollama 文档：Context length — https://docs.ollama.com/context-length
- DeepSeek 新闻：DeepSeek-V4.1-Flash 发布（2026-09-10）— https://api-docs.deepseek.com/zh-cn/news/news260910
