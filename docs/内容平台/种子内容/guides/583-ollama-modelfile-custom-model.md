---
title: Ollama Modelfile 怎么写：自定义系统提示词、参数与导入 GGUF 模型
slug: ollama-modelfile-custom-model
products: [ai-tools]
models: []
accountTier: FREE
excerpt: Ollama Modelfile 怎么写？本文按官方文档讲清 FROM、PARAMETER、SYSTEM、MESSAGE 等指令的用法，给出「固定系统提示词」「调大上下文」「导入本地 GGUF 文件」三个可直接照抄的例子，以及常见报错的原因。
checkedOn: 2026-10-11
sources:
  - https://docs.ollama.com/modelfile
  - https://docs.ollama.com/cli
  - https://docs.ollama.com/api/openai-compatibility
---

## 适用于谁

- 搜「ollama modelfile 怎么写」「ollama modelfile example」「ollama modelfile num_ctx」的人；
- 想给本地模型固定一个角色或系统提示词、调大上下文，或者把从别处下载的 GGUF 文件导入 Ollama 的人。

本文根据 Ollama 官方 Modelfile 文档整理，资料核对于 2026-10-11。

## 结论先说

1. **Modelfile 是一份「配方」**：指定用哪个基础模型，再叠加参数、系统提示词和示例对话，最后用 `ollama create` 生成一个有新名字的模型。
2. **只有 `FROM` 是必须的**，其余指令按需添加，顺序不限，指令名不区分大小写。
3. **不会重新下载或训练模型**。基于已有模型创建时，新模型复用原来的权重文件，只是多了一层配置。
4. 想看现成的写法，执行 `ollama show --modelfile 模型名`，把任意已下载模型的 Modelfile 打印出来参考。

## 指令一览

| 指令 | 作用 |
| --- | --- |
| `FROM`（必须） | 指定基础模型：已有模型名、GGUF 文件路径或 Safetensors 模型目录 |
| `PARAMETER` | 设置运行参数，如温度、上下文长度 |
| `SYSTEM` | 设置系统提示词 |
| `MESSAGE` | 预置几轮对话历史，用来示范回答方式 |
| `TEMPLATE` | 完整的提示词模板（一般不用自己写） |
| `LICENSE` | 声明许可证 |
| `REQUIRES` | 声明需要的最低 Ollama 版本 |

格式很简单，每行一条「指令 参数」，`#` 开头是注释。

## 步骤

### 例一：给模型固定一个系统提示词

新建一个名为 `Modelfile` 的文本文件（没有扩展名）：

```
FROM gemma4

# 温度低一些，回答更稳定
PARAMETER temperature 0.3

SYSTEM """你是一名中文技术文档编辑。
回答一律使用简体中文；先给结论，再分点说明；
不确定的内容直接说不确定，不要编造。"""
```

多行文本用三个双引号包起来。然后创建并运行：

```bash
ollama create doc-editor -f ./Modelfile
ollama run doc-editor
```

`ollama ls` 里会多出一个 `doc-editor`，之后在命令行、API 和第三方客户端里都可以直接用这个名字。

### 例二：调大上下文长度

```
FROM gemma4
PARAMETER num_ctx 32768
```

```bash
ollama create gemma4-32k -f ./Modelfile
```

这个写法对接 OpenAI 兼容接口时特别有用：官方兼容文档说明，OpenAI 接口没有设置上下文长度的参数，需要用 Modelfile 把 `num_ctx` 固定在模型里，再用新模型名调用。上下文越大占用显存越多，创建后用 `ollama ps` 看一眼是否还是 `100% GPU`。

### 例三：导入本地的 GGUF 文件

从 Hugging Face 等地方下载的 `.gguf` 文件，可以直接作为基础模型：

```
FROM ./my-model.Q4_K_M.gguf
```

路径可以写绝对路径，也可以相对于 Modelfile 所在位置。分卷的 GGUF 要保留原始的分卷文件名，用通配符匹配全部分卷：

```
FROM ./model-*.gguf
```

```bash
ollama create my-model -f ./Modelfile
ollama run my-model
```

如果导入后回答格式混乱、停不下来，多半是缺少对话模板或停止符。到该模型的官方说明页找到对应的模板，用 `TEMPLATE` 和 `PARAMETER stop` 补上；或者找一个 Ollama 模型库里同系列的模型，用 `ollama show --modelfile` 把它的模板抄过来。

### 用 MESSAGE 预置示例对话

`MESSAGE` 可以写入几轮「用户问、助手答」的例子，引导模型照着这个风格回答，相当于把少样本示例固定在模型里：

```
FROM gemma4
SYSTEM 你只回答「是」或「否」。
MESSAGE user 多伦多在加拿大吗？
MESSAGE assistant 是
MESSAGE user 萨克拉门托在加拿大吗？
MESSAGE assistant 否
```

可用的角色有 `system`、`user`、`assistant` 三种。

## 常用参数

以下默认值来自官方 Modelfile 文档的参数表：

| 参数 | 含义 | 默认值 |
| --- | --- | --- |
| `num_ctx` | 上下文窗口大小（token 数） | 2048 |
| `temperature` | 温度，越高越发散，越低越稳定 | 0.8 |
| `top_k` | 取值越大回答越多样，越小越保守 | 40 |
| `top_p` | 与 top_k 配合，越大越多样 | 0.9 |
| `repeat_penalty` | 重复惩罚，越大越不容易重复 | 1.0（关闭） |
| `repeat_last_n` | 往回看多少 token 来判断重复 | 64 |
| `seed` | 随机种子，固定后同样的输入得到同样的输出 | 0 |
| `num_predict` | 最多生成多少 token | -1（不限制） |
| `stop` | 停止符，遇到就停止生成，可以写多行设置多个 | — |

需要注意的是，参数表里 `num_ctx` 写的默认值是 2048，而官方「Context length」文档又说明服务会按显存大小自动选择默认上下文（4k / 32k / 256k）。两处说法并存，实际分配了多少以 `ollama ps` 的 `CONTEXT` 一列为准。

## 常见问题

**Q：改了 Modelfile 之后怎么生效？**
重新执行一次 `ollama create 同一个名字 -f Modelfile`，会覆盖原来的配置。正在运行的对话要退出重进。

**Q：创建的自定义模型会占用双倍硬盘吗？**
基于已有模型（`FROM 模型名`）创建时不会，新模型引用的是同一份权重文件。从 `ollama show --modelfile` 的输出里能看到，`FROM` 实际指向的是模型目录里的一个 blob 文件。

**Q：TEMPLATE 需要自己写吗？**
基于 Ollama 模型库里的模型创建时不需要，会继承原模型的模板。只有导入外部 GGUF 且模板缺失时才要处理。模板里用到的变量有 `{{ .System }}`、`{{ .Prompt }}`、`{{ .Response }}`。

**Q：怎么关掉模型的思考过程？**
这取决于具体模型，不是 Modelfile 的通用指令。先看该模型在 Ollama 模型库页面上的说明，以官方文档为准。

**Q：创建时报找不到文件？**
检查 `-f` 后面的路径，以及 `FROM` 里的相对路径是不是相对于 Modelfile 所在的文件夹。Windows 上路径里有空格时用引号包起来。

## 延伸阅读

系统提示词写什么更有效，可以参考站内《系统提示词怎么写》，或到提示词库（/prompts）挑一条合适的放进 `SYSTEM`。

## 参考资料

- Ollama 文档：Modelfile Reference — https://docs.ollama.com/modelfile
- CLI Reference — https://docs.ollama.com/cli
- OpenAI compatibility（设置本地上下文长度）— https://docs.ollama.com/api/openai-compatibility
