---
title: 本地大模型怎么选：参数量、量化（Q4 / Q8）、GGUF 与显存怎么对应
slug: local-llm-how-to-choose-vram-quantization
products: [ai-tools]
models: []
accountTier: FREE
excerpt: 8G、16G 显存能跑多大的本地大模型？本文不列道听途说的跑分，只用官方文档讲清三个概念：参数量、量化位数、GGUF 格式，并给出「看文件体积选模型」的判断方法，以及用 ollama ps 验证是否放进显存的办法。
checkedOn: 2026-10-11
sources:
  - https://lmstudio.ai/docs/app/basics/download-model
  - https://lmstudio.ai/docs/app/system-requirements
  - https://huggingface.co/docs/hub/gguf
  - https://docs.ollama.com/context-length
  - https://docs.ollama.com/faq
  - https://ollama.com/library/gemma4/tags
---

## 适用于谁

- 搜「本地大模型显存要求」「8g 显存本地大模型」「本地大模型显存不够怎么办」的人；
- 在 Ollama、LM Studio 里看到 `12b`、`Q4_K_M`、`GGUF` 这些字样，不知道该下哪个的人。

本文根据 LM Studio、Hugging Face、Ollama 的官方文档和模型页面整理，资料核对于 2026-10-11。各家都没有发布统一的「某显卡能跑某模型」对照表，本文给的是判断方法；文中的体积数字是 Ollama 模型库页面当天显示的数值，仅作举例。

## 结论先说

1. **先看文件体积，再看你的显存**。模型文件要整个装进显存（或内存）才能跑，这是最硬的约束。
2. **文件体积主要由两件事决定**：参数量（`4b`、`12b`、`31b` 里的 b 是十亿）和量化位数（Q4、Q8）。
3. **量化是「压缩」**：位数越低文件越小、质量损失越大。LM Studio 官方的建议是机器带得动就选 4-bit 或更高。
4. **显存要留余量**。除了模型本身，上下文也占显存，上下文设得越长占得越多。
5. **装不下不会报错，只会变慢**：放不进显存的部分会落到内存里用 CPU 算。用 `ollama ps` 可以直接看到比例。

## 三个概念

### 参数量：模型有多「大」

模型名后面的 `e2b`、`12b`、`26b`、`31b` 指参数量规格，b 代表十亿（billion）。同一系列里，参数量越大通常能力越强，文件也越大、对硬件要求越高。

以 Ollama 模型库的 gemma4 页面为例（2026-10-11 页面显示）：

| 标签 | 页面标注的体积 | 页面标注的上下文窗口 |
| --- | --- | --- |
| `gemma4:e2b` | 4.6GB – 7.5GB | 128K |
| `gemma4:12b` | 7.7GB – 8.0GB | 256K |
| `gemma4:26b` | 16GB – 19GB | 256K |
| `gemma4:31b` | 19GB – 20GB | 256K |

可以看到，从小规格到大规格，体积差了四倍左右。

### 量化：同一个模型的不同压缩档

LM Studio 官方文档的解释很直白：`Q3_K_S`、`Q8_0` 这类名字是同一个模型在不同保真度下的拷贝；Q 代表量化（Quantization），大致就是压缩模型文件的体积，同时放弃一部分质量。

Hugging Face 的 GGUF 文档列出了这些类型的含义，常见的几种：

| 名称 | 含义（依据 Hugging Face 文档） |
| --- | --- |
| `F16` | 16 位半精度浮点，基本就是未量化的原始精度 |
| `Q8_0` | 8 位量化 |
| `Q6_K`、`Q5_K` | 6 位、5 位量化 |
| `Q4_K`（常见写法 `Q4_K_M`） | 4 位量化 |
| `Q3_K`、`Q2_K` | 3 位、2 位量化 |

名字末尾的 `_S`、`_M`、`_L` 是 llama.cpp 的命名惯例，表示同一位数下的小、中、大变体。

同一规格、不同量化的体积差别，还是用 gemma4 页面的数字举例：`gemma4:e2b-it-q4_K_M` 标注 4.6GB，`gemma4:e2b-it-q8_0` 标注 6.0GB。

**怎么选**：按 LM Studio 的官方建议，从 4-bit 起步；显存还有富余再往上选 Q5、Q6、Q8。低于 4-bit 的版本只在实在装不下时考虑。

### GGUF：本地运行最常见的文件格式

Hugging Face 文档对 GGUF 的定义是：一种为快速加载和保存而优化的二进制格式，适合推理使用；和只存张量的 safetensors 不同，GGUF 同时保存张量和一组标准化的元数据。Ollama、LM Studio、llama.cpp 都能直接使用 GGUF 文件。

在 Hugging Face 上找 GGUF 模型，可以按 GGUF 标签筛选；模型页面上还有查看器，可以看每个文件的元数据和张量信息。

## 步骤：按显存选模型

### 1. 确认自己有多少显存

- Windows：任务管理器 → 性能 → GPU，看「专用 GPU 内存」；
- macOS（Apple Silicon）：显存和内存是统一的，看「关于本机」里的内存大小；
- NVIDIA 显卡也可以在终端执行 `nvidia-smi`。

LM Studio 官方的最低建议可以作为参考线：Windows 建议至少 16GB 内存、至少 4GB 独立显存；Mac 建议 16GB 以上内存，8GB 的机器只适合小模型和较小的上下文。

### 2. 用「文件体积 < 显存」初筛

到 Ollama 模型库的 Tags 页，或 LM Studio 的下载选项里，看每个版本的体积。挑一个**体积明显小于你显存**的版本，差额就是留给上下文和系统的余量。

这是一个经验做法而不是官方公式：Ollama 和 LM Studio 都没有给出「需要多少余量」的精确数字，因为它取决于上下文长度。保守起见，先选小一档，跑起来再看。

### 3. 跑起来验证

用 Ollama 的话：

```bash
ollama run gemma4:12b
# 另开一个终端
ollama ps
```

看 `PROCESSOR` 一列（含义来自 Ollama 官方 FAQ）：

- `100% GPU`：完全在显存里，这个选择没问题；
- `48%/52% CPU/GPU` 这种比例：一部分落到了内存，会明显变慢，换小一档；
- `100% CPU`：完全没用上显卡，检查驱动，或者模型远超显存。

### 4. 再考虑上下文长度

Ollama 官方文档写明，默认上下文按显存自动选择（不足 24 GiB 为 4k，24–48 GiB 为 32k，48 GiB 及以上为 256k），并提醒「调大上下文会增加运行模型所需的内存」。所以：

- 只是聊天问答，默认值够用；
- 要读长文档、接编程工具或智能体，官方建议至少 64000，这时要为上下文多留显存，往往需要把模型降一档。

## 显存不够怎么办

按影响从小到大排：

1. **换低一档的量化**，例如 Q8 换 Q4，体积能明显下降；
2. **换小一档的参数量**，例如 26b 换 12b；
3. **调小上下文长度**；
4. **接受一部分跑在 CPU 上**，能用但慢；
5. 偶尔才需要大模型的话，直接用云端 API 更省事，没必要为此升级硬件。

「小参数量 + 高位量化」和「大参数量 + 低位量化」哪个更好，没有一个通用的官方结论，取决于具体模型和任务，自己用同一批问题各试一次最可靠。

## 常见问题

**Q：没有独立显卡能跑吗？**
能。模型会完全加载到内存，用 CPU 计算，速度慢很多。选参数量最小的规格，并保证内存大于模型体积。

**Q：Mac 怎么估？**
Apple Silicon 的显存就是统一内存，但系统和其他应用也要占用，不能把全部内存都算作可用。Ollama 支持 M 系列芯片的 GPU 加速，Intel 芯片的 Mac 只能用 CPU；LM Studio 目前不支持 Intel 芯片的 Mac。

**Q：模型页面上的 128K、256K 上下文是不是一定能用满？**
那是模型支持的上限。实际能用多少取决于你的显存和设置，以 `ollama ps` 的 `CONTEXT` 一列为准。

**Q：两块显卡能加起来用吗？**
Ollama 官方 FAQ 有多显卡加载的说明：能放进单卡时优先放在一块卡上，放不下再分到多块卡。具体表现以官方文档为准。

**Q：有没有官方的性能排行可以参考？**
各模型的发布方会在自己的模型卡（model card）里给出评测结果，那是最直接的来源。本文不转述第三方跑分。

## 参考资料

- LM Studio 文档：Download an LLM（量化版本怎么选）— https://lmstudio.ai/docs/app/basics/download-model
- LM Studio 文档：System Requirements — https://lmstudio.ai/docs/app/system-requirements
- Hugging Face 文档：GGUF — https://huggingface.co/docs/hub/gguf
- Ollama 文档：Context length — https://docs.ollama.com/context-length
- Ollama 文档：FAQ（如何判断模型是否加载到 GPU）— https://docs.ollama.com/faq
- Ollama 模型库：gemma4 Tags — https://ollama.com/library/gemma4/tags
