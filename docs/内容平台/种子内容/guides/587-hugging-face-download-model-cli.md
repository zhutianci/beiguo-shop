---
title: Hugging Face 怎么下载模型：hf 命令行下载单个文件、指定目录与受限模型申请
slug: hugging-face-download-model-cli
products: [ai-tools]
models: []
accountTier: FREE
excerpt: Hugging Face 怎么下载模型？本文按官方文档讲清网页下载、hf download 命令行（单个文件、整个仓库、按通配符筛选、下载到指定目录）、访问令牌怎么建、受限模型怎么申请权限，以及缓存目录和超时怎么调。
checkedOn: 2026-10-11
sources:
  - https://huggingface.co/docs/hub/models-downloading
  - https://huggingface.co/docs/huggingface_hub/guides/cli
  - https://huggingface.co/docs/hub/models-gated
  - https://huggingface.co/docs/hub/security-tokens
  - https://huggingface.co/docs/huggingface_hub/package_reference/environment_variables
---

## 适用于谁

- 搜「hugging face 下载模型」「huggingface-cli 下载模型」「huggingface cli 下载到指定目录」「下载单个文件」的人；
- 下载时遇到 401 / 403、提示需要申请权限，或者不知道文件下到哪里去了的人。

本文根据 Hugging Face 官方文档整理，资料核对于 2026-10-11。

先说明一个事实：huggingface.co 在中国大陆的网络环境下通常无法直接访问，本文不提供任何访问方法；下面的步骤以你所在的网络能正常打开官网为前提。许多国内团队发布的开源模型，发布方同时会在魔搭社区（ModelScope）等平台提供官方下载，可以到模型的官方介绍页查看。

## 结论先说

1. **命令行工具现在叫 `hf`**。旧教程里的 `huggingface-cli download` 对应现在的 `hf download`，登录命令是 `hf auth login`。
2. **最常用的三种写法**：下载整个仓库、下载指定文件、用 `--include` 按通配符筛选。
3. **默认下载到缓存目录**（`~/.cache/huggingface/hub`），不是当前文件夹。想放到指定位置，加 `--local-dir`。
4. **只想要一个 GGUF 文件，就不要下整个仓库**。一个仓库里往往有十几个量化版本，全下会占用上百 GB。
5. **受限模型（gated model）要先在网页上申请**，申请只能在浏览器里做，通过后再用令牌下载。

## 步骤

### 1. 网页直接下载（文件少时最简单）

打开模型页面，切到 **Files and versions**（文件与版本）标签，每个文件右侧有下载按钮。只需要一两个文件（比如一个 `.gguf`）时，这样最快。

### 2. 安装 hf 命令行

官方推荐的独立安装方式：

```bash
# macOS / Linux
curl -LsSf https://hf.co/cli/install.sh | bash
```

```powershell
# Windows
powershell -ExecutionPolicy ByPass -c "irm https://hf.co/cli/install.ps1 | iex"
```

也可以用 pip 或 Homebrew：

```bash
pip install -U "huggingface_hub"
brew install hf
```

装好后执行 `hf download --help` 确认可用。

### 3. 下载

**下载整个仓库**：

```bash
hf download HuggingFaceH4/zephyr-7b-beta
```

**下载指定的一个或几个文件**（仓库名后面跟文件名）：

```bash
hf download gpt2 config.json
hf download gpt2 config.json model.safetensors
```

**按通配符筛选**，例如只要 safetensors 文件、排除 fp16 版本（官方示例）：

```bash
hf download stabilityai/stable-diffusion-xl-base-1.0 --include "*.safetensors" --exclude "*.fp16.*"
```

GGUF 仓库里只要某一个量化版本时，同样用 `--include`：

```bash
hf download 用户名/某模型-GGUF --include "*Q4_K_M*.gguf" --local-dir ./models
```

**下载到指定目录**：

```bash
hf download adept/fuyu-8b model-00001-of-00002.safetensors --local-dir fuyu
```

官方说明：使用 `--local-dir` 时，目标文件夹里会生成一个 `.cache/huggingface/` 目录记录元数据，再次执行同样的命令时，已经是最新的文件不会重复下载。

**先看看要下多少**：加 `--dry-run` 只列出将要下载的文件，不真正下载。

**下载数据集或 Space**，加 `--repo-type`：

```bash
hf download HuggingFaceH4/ultrachat_200k --repo-type dataset
```

**指定版本**，加 `--revision`（分支名、标签或提交哈希）。

### 4. 登录与访问令牌

公开模型不登录也能下。私有仓库和受限模型需要令牌：

1. 登录官网，进入 Settings → Access Tokens，点 **New token**；
2. 选择令牌类型。官方文档列出三种：
   - `read`：只读，下载用这个就够；
   - `write`：在只读基础上可以推送内容；
   - `fine-grained`：可以精确到某个模型或某个组织的权限，官方建议生产环境只用这一种；
3. 在终端登录：

```bash
hf auth login
```

按提示粘贴令牌。也可以不登录，只在单条命令里用 `--token` 传入，或者设置环境变量 `HF_TOKEN`。

令牌等同于密码：不要写进代码仓库，不要发给别人。官方文档说明，令牌泄露后应立即在 Access Tokens 页面删除或刷新。

### 5. 申请受限模型的访问权限

有些模型开启了访问申请（官方称 gated model），直接下载会被拒绝。官方文档的流程：

1. 登录后在**浏览器**里打开该模型页面（申请只能在浏览器里完成）；
2. 页面会提示你同意把用户名和邮箱分享给模型作者，有的还要填写额外信息。官方建议尽量填完整，方便作者审核；
3. 点同意提交。之后有两种情况：作者设置了自动批准的，立刻就能下载；需要人工审核的，要等作者处理；
4. 通过后，用已登录的命令行或带令牌的脚本下载。

官方文档提醒：模型作者对访问权限有完全的控制权，可以随时撤销，包括已经批准过的申请。

### 6. 文件下到哪里了，怎么改

| 环境变量 | 作用 | 默认值 |
| --- | --- | --- |
| `HF_HOME` | huggingface_hub 存放数据的根目录（令牌和缓存都在里面） | `~/.cache/huggingface` |
| `HF_HUB_CACHE` | 模型、数据集、Space 的缓存目录 | `$HF_HOME/hub` |
| `HF_TOKEN` | 访问令牌，设置后覆盖本机保存的令牌 | — |
| `HF_HUB_DOWNLOAD_TIMEOUT` | 下载时等待服务器响应的秒数 | 10 |
| `HF_HUB_OFFLINE` | 设为 1 后不发任何网络请求，只读本地缓存 | 未设置 |

系统盘空间不够，把 `HF_HOME` 指到别的盘；网络慢、经常超时，把 `HF_HUB_DOWNLOAD_TIMEOUT` 调大。单次下载也可以用 `--cache-dir` 临时指定缓存目录。

## 常见问题

**Q：`huggingface-cli` 命令还能用吗？**
官方文档现在全部以 `hf` 为准。旧命令是否保留以你安装的版本为准，新写的脚本建议直接用 `hf`。

**Q：下载中断了要从头来吗？**
重新执行同一条命令即可，已完成且是最新版本的文件会被跳过。

**Q：报 401 或 403？**
401 一般是没登录或令牌无效，重新 `hf auth login`；403 常见于受限模型没有申请或还没批准，或者所在组织要求使用 fine-grained 令牌而你用的是 read / write 令牌。

**Q：怎么知道自己的下载速度正不正常？**
官方提供了测速页面 fast.hf.co，可以测到最近的边缘节点的带宽。

**Q：下载的模型怎么用？**
GGUF 文件可以导入 Ollama（见《Ollama Modelfile 怎么写》）或 LM Studio（见《LM Studio怎么用》）；safetensors 格式的模型一般配合 transformers、diffusers 等库用代码加载，模型页面上的「Use in 某个库」按钮会给出示例代码（按钮名称以页面为准）。

**Q：用 git clone 可以吗？**
可以。官方说明模型仓库是基于 Xet 存储的 Git 仓库，需要先安装 git-xet 再克隆。只是下载使用的话，`hf download` 更省事。

## 参考资料

- Hugging Face 文档：Downloading models — https://huggingface.co/docs/hub/models-downloading
- huggingface_hub 文档：Command Line Interface — https://huggingface.co/docs/huggingface_hub/guides/cli
- Gated models — https://huggingface.co/docs/hub/models-gated
- User access tokens — https://huggingface.co/docs/hub/security-tokens
- Environment variables — https://huggingface.co/docs/huggingface_hub/package_reference/environment_variables
