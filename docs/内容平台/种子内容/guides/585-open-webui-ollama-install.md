---
title: Open WebUI 安装教程：搭配 Ollama 用浏览器聊天（Docker / pip 两种装法与连不上的排查）
slug: open-webui-ollama-install
products: [ai-tools]
models: []
accountTier: FREE
excerpt: Open WebUI 怎么安装、怎么连 Ollama？本文按官方文档给出 Docker 和 pip 两种装法、每个参数的作用、第一次打开时创建管理员账号、在界面里下载模型，以及「连不上 Ollama」最常见的两个原因和修法。
checkedOn: 2026-10-11
sources:
  - https://docs.openwebui.com/getting-started/quick-start/
  - https://docs.openwebui.com/getting-started/quick-start/connect-a-provider/starting-with-ollama
  - https://docs.openwebui.com/troubleshooting/connection-error
  - https://github.com/open-webui/docs
---

## 适用于谁

- 搜「open webui 安装」「open webui ollama」「open webui docker 安装」的人；
- 已经装好 Ollama，想要一个类似 ChatGPT 的网页界面，或者想让家里、团队里的其他人通过浏览器一起用的人。

本文根据 Open WebUI 官方文档整理，资料核对于 2026-10-11。还没装 Ollama 的话先看《Ollama怎么用》。

## 结论先说

1. **Open WebUI 是一个自己部署的聊天网页**，本身不带模型，需要连接 Ollama 或其他模型服务。
2. **官方推荐用 Docker 安装**，一条命令；不想装 Docker 可以用 `pip install open-webui`，另外还有桌面应用。
3. **Docker 装好后访问 `http://localhost:3000`，pip 装的是 `http://localhost:8080`**。
4. **第一个注册的账号就是管理员**，之后注册入口自动关闭，要让别人加入需要管理员手动开启。
5. **连不上 Ollama 基本就两个原因**：容器里的 `localhost` 不是你的电脑；或者 Ollama 只监听了 `127.0.0.1`。

## 步骤

### 方法一：Docker（官方推荐）

先安装 Docker，然后执行官方给出的命令（把 `your-secret-key` 换成一串随机字符，官方建议用 `openssl rand -hex 32` 生成）：

```bash
docker run -d -p 3000:8080 \
  --add-host=host.docker.internal:host-gateway \
  -v open-webui:/app/backend/data \
  -e WEBUI_SECRET_KEY=your-secret-key \
  --name open-webui --restart always \
  ghcr.io/open-webui/open-webui:main
```

每个参数的作用（官方说明）：

| 参数 | 作用 |
| --- | --- |
| `-p 3000:8080` | 界面开在本机 3000 端口。3000 被占用就改左边的数字 |
| `-v open-webui:/app/backend/data` | 聊天记录、用户和设置都存在这个数据卷里，升级不会丢。**不要省略** |
| `--add-host=host.docker.internal:host-gateway` | 让容器能访问到宿主机上运行的 Ollama |
| `--restart always` | 电脑重启后自动恢复 |
| `-e WEBUI_SECRET_KEY=...` | 设一次并保持不变。不固定的话，每次重建容器所有人都会被登出 |

启动后浏览器打开 `http://localhost:3000`。

**镜像标签怎么选**（官方列出的几种）：

- `:main`：标准镜像，功能齐全，内置语音识别和嵌入模型；
- `:slim`：只保留聊天所需的部分。官方给出的下载体积是约 176 MB，对比标准镜像的 1.66 GB（Linux/amd64 压缩体积，官方注明核对于 2026-09-28）。知识库、PDF 解析、语音这些功能需要另外接外部服务；
- `:cuda`：支持 NVIDIA 显卡，运行时加 `--gpus all`；
- `:ollama`：把 Ollama 一起打包在容器里，适合一步到位。

只是想给本机 Ollama 配个界面，用 `:main`；下载慢、只需要聊天，用 `:slim`。

### 方法二：pip

```bash
pip install open-webui
open-webui serve
```

启动后访问 `http://localhost:8080`。几个官方提示：

- 用 `DATA_DIR` 指定数据存放位置，例如 `DATA_DIR=~/.open-webui open-webui serve`；
- `--port` 改端口，例如 `open-webui serve --port 3000`；
- 提示找不到 `open-webui` 命令，说明没有激活安装时用的 Python 环境；
- 支持的 Python 版本以官方文档的说明为准，建议放在单独的虚拟环境里装。

### 创建管理员账号

第一次打开会看到创建管理员账号的页面。官方说明的规则：

- **第一个账号是管理员**，管理所有用户和全局设置；账号信息保存在你自己的机器上；
- 管理员建好后**注册会自动关闭**。要让其他人加入，点头像 → Settings → Admin → Authentication，打开 New Sign Ups；新账号默认是待审核（Pending）状态，需要管理员批准；
- 头像 → Settings 里的内容（主题、语言）只影响你自己；其中的 Admin 部分才是全局设置。界面语言可以在这里切换成中文。

### 连接 Ollama 并下载模型

Open WebUI 启动后会自动尝试连接 Ollama：Docker 方式默认找 `http://host.docker.internal:11434`，pip 方式默认找 `http://localhost:11434`。连接正常的话，对话页顶部的模型选择器里会直接出现你已下载的模型。

想在界面里管理模型：

1. 头像 → Settings → Admin → Connections；
2. 在「Manage Ollama API Connections」下找到你的 Ollama，点 Manage（下载图标）；
3. 在这里可以拉取新模型、更新全部模型、删除模型。

更快的办法：直接在**模型选择器**里输入模型名，本机没有的话会提示从 Ollama 下载。

官方文档还提到，可以在拉取模型的输入框里用 `hf.co/用户名/仓库名:量化版本` 的写法，直接下载 Hugging Face 上的 GGUF 模型。

## 连不上 Ollama 怎么办

### 情况一：Open WebUI 在 Docker 里，Ollama 在宿主机上

容器里的 `localhost` 指的是容器自己，不是你的电脑。检查两点：

- 启动命令里有没有 `--add-host=host.docker.internal:host-gateway`；
- Connections 里 Ollama 的地址是不是 `http://host.docker.internal:11434`。

还不行，官方给的另一个办法是让容器直接使用宿主机网络：

```bash
docker run -d --network=host \
  -v open-webui:/app/backend/data \
  -e OLLAMA_BASE_URL=http://127.0.0.1:11434 \
  --name open-webui --restart always \
  ghcr.io/open-webui/open-webui:main
```

注意这种方式下访问地址变成 `http://localhost:8080`。

### 情况二：Ollama 只监听了本机

官方排查文档写明：连不上时，很可能是 Ollama 只监听 `127.0.0.1`。把环境变量 `OLLAMA_HOST` 设为 `0.0.0.0`，然后**重启 Ollama**。各系统的设置步骤见《Ollama 修改模型存储位置与局域网访问》。

### 情况三：界面很慢、模型列表一直转圈

官方的解释是配置里存在连不上的地址，每次加载模型列表都在等它超时。到 Connections 里删掉失效的连接；或者用环境变量 `AIOHTTP_CLIENT_TIMEOUT_MODEL_LIST` 把超时调短（默认 10 秒）。

## 常见问题

**Q：怎么升级？**
Docker 方式：删除旧容器（`docker rm -f open-webui`）、拉取新镜像，再用同样的命令启动。只要 `-v open-webui:/app/backend/data` 不变，数据都在。官方文档也介绍了用 Watchtower 自动更新。pip 方式重新 `pip install -U open-webui`。

**Q：`:latest` 是稳定版吗？**
官方特别说明：`:main` 和 `:latest` 是同一个滚动更新的镜像，都指向 `main` 分支的最新构建，并不等于「最新稳定发布版」。

**Q：除了 Ollama 还能连什么？**
OpenAI、Anthropic 以及任何 OpenAI 兼容的服务（如 LM Studio、llama.cpp、vLLM），同样在 Admin → Connections 里添加，官方文档各有一篇对应的接入说明。

**Q：让局域网里的人访问要注意什么？**
其他设备用 `http://你的电脑IP:3000` 访问。记得保持注册关闭或开启审核，不要把没有访问控制的实例直接暴露到公网。

## 参考资料

- Open WebUI 文档：Quick Start — https://docs.openwebui.com/getting-started/quick-start/
- Starting with Ollama — https://docs.openwebui.com/getting-started/quick-start/connect-a-provider/starting-with-ollama
- Connection Errors — https://docs.openwebui.com/troubleshooting/connection-error
- 文档源码仓库 — https://github.com/open-webui/docs
