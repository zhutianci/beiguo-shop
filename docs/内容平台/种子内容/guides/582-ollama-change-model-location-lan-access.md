---
title: Ollama 修改模型存储位置与局域网访问：OLLAMA_MODELS、OLLAMA_HOST 等环境变量怎么设
slug: ollama-change-model-location-lan-access
products: [ai-tools]
models: []
accountTier: FREE
excerpt: Ollama 模型默认下在系统盘，怎么改到 D 盘？怎么让局域网其他电脑访问？本文按官方文档讲清 OLLAMA_MODELS、OLLAMA_HOST 等环境变量的含义，以及 Windows、macOS、Linux 的设置步骤。
checkedOn: 2026-10-11
sources:
  - https://docs.ollama.com/faq
  - https://docs.ollama.com/windows
  - https://docs.ollama.com/macos
  - https://docs.ollama.com/context-length
---

## 适用于谁

- 搜「ollama 修改模型存储位置」「ollama 安装在 d 盘」「windows 更改 ollama 模型存放位置」的人；
- 搜「ollama 局域网访问」，想让另一台电脑、手机或 Docker 里的程序连上本机 Ollama 的人。

本文根据 Ollama 官方 FAQ 和各系统文档整理，资料核对于 2026-10-11。

## 结论先说

1. **Ollama 的服务端配置全部通过环境变量完成**，没有图形化的「高级设置」页面可以改这些。
2. **改模型位置用 `OLLAMA_MODELS`**，指向你想放模型的文件夹。
3. **开放局域网访问用 `OLLAMA_HOST`**。默认只监听 `127.0.0.1:11434`（只有本机能访问），改成 `0.0.0.0:11434` 后同一网络的其他设备才能连。
4. **改完必须重启 Ollama 才生效**，这是最常见的「改了没用」的原因。
5. 开放到网络之后，Ollama 本身不带登录验证，只应在可信的局域网里这样用。

## 常用环境变量

| 变量 | 作用 | 默认值（官方文档） |
| --- | --- | --- |
| `OLLAMA_MODELS` | 模型文件存放目录 | macOS `~/.ollama/models`；Linux `/usr/share/ollama/.ollama/models`；Windows `C:\Users\用户名\.ollama\models` |
| `OLLAMA_HOST` | 服务监听的地址和端口 | `127.0.0.1:11434` |
| `OLLAMA_ORIGINS` | 额外允许跨域访问的来源 | 默认只允许 `127.0.0.1` 和 `0.0.0.0` |
| `OLLAMA_CONTEXT_LENGTH` | 默认上下文长度 | 按显存自动选：不足 24 GiB 为 4k，24–48 GiB 为 32k，48 GiB 及以上为 256k |
| `OLLAMA_KEEP_ALIVE` | 模型在内存里保留多久 | 5 分钟 |
| `OLLAMA_NUM_PARALLEL` | 每个模型同时处理几个请求 | 1 |
| `OLLAMA_MAX_LOADED_MODELS` | 同时加载几个模型 | GPU 数量的 3 倍；纯 CPU 时为 3 |
| `OLLAMA_MAX_QUEUE` | 忙碌时最多排队多少请求 | 512 |
| `OLLAMA_NO_CLOUD` | 设为 1 关闭云端功能，仅本地运行 | 未设置 |

`ollama serve --help` 可以列出当前版本支持的全部变量。

## 步骤

### Windows：把模型改到 D 盘

官方 Windows 文档的步骤：

1. 在任务栏右下角找到 Ollama 图标，点开后选择退出（Quit）；
2. 打开「设置」（Windows 11）或「控制面板」（Windows 10），搜索「环境变量」；
3. 点「编辑账户的环境变量」；
4. 在用户变量里新建 `OLLAMA_MODELS`，值填目标文件夹，例如 `D:\ollama\models`；
5. 点确定保存；
6. 从开始菜单重新启动 Ollama。

验证：新开一个终端执行 `ollama pull` 下载任意模型，看文件是否出现在新目录里。

已经下载过的模型不会自动搬家。可以在退出 Ollama 的状态下，把旧目录（`C:\Users\用户名\.ollama\models`）里的内容整体移动到新目录；官方文档没有专门描述迁移步骤，移动前建议先保留一份，确认 `ollama ls` 能正常列出后再删旧文件。

如果连**程序本身**也不想装在 C 盘，安装时用命令行带上目录参数：

```powershell
OllamaSetup.exe /DIR="d:\some\location"
```

### macOS

Ollama 以应用形式运行时，环境变量要用 `launchctl` 设置：

```bash
launchctl setenv OLLAMA_MODELS "/Volumes/外置盘/ollama-models"
```

然后退出并重新打开 Ollama 应用。

### Linux

用官方脚本安装的 Ollama 是一个 systemd 服务：

```bash
sudo systemctl edit ollama.service
```

在打开的编辑器里，于 `[Service]` 下面加一行（每个变量一行）：

```ini
[Service]
Environment="OLLAMA_MODELS=/data/ollama/models"
```

保存后重载并重启：

```bash
sudo systemctl daemon-reload
sudo systemctl restart ollama
```

官方特别提醒：标准安装下服务以 `ollama` 用户运行，新目录必须让这个用户可读写，否则下载会失败：

```bash
sudo chown -R ollama:ollama /data/ollama/models
```

### 开放局域网访问

把上面步骤里的变量换成 `OLLAMA_HOST`，值设为 `0.0.0.0:11434`：

- Windows：用户环境变量里新建 `OLLAMA_HOST`，值 `0.0.0.0:11434`，重启 Ollama；
- macOS：`launchctl setenv OLLAMA_HOST "0.0.0.0:11434"`，重启应用；
- Linux：在 service 里加 `Environment="OLLAMA_HOST=0.0.0.0:11434"`，重载并重启。

然后在另一台设备上访问 `http://这台电脑的局域网IP:11434`，例如：

```bash
curl http://192.168.1.20:11434/api/tags
```

能返回模型列表就说明通了。连不上时依次检查：Ollama 是否已重启；系统防火墙是否放行了 11434 端口；两台设备是否在同一个网段。

### 让网页或浏览器插件能访问

浏览器里的页面调用 Ollama 受跨域限制。官方 FAQ 的做法是设置 `OLLAMA_ORIGINS`，例如允许所有浏览器扩展：

```bash
OLLAMA_ORIGINS=chrome-extension://*,moz-extension://*,safari-web-extension://*
```

也可以只填具体的网页来源，比全部放开更稳妥。

## 常见问题

**Q：设置了环境变量但没有生效？**
九成是没有重启。Windows 上要从任务栏彻底退出再启动，而且终端窗口也要新开；macOS 要退出应用再打开；Linux 要 `daemon-reload` 加 `restart`。另外确认变量加在了**用户变量**里、名字没有拼错。

**Q：可以直接暴露到公网吗？**
不建议。Ollama 自身没有账号和鉴权，任何能访问到端口的人都能调用你的模型、占用你的显卡。官方 FAQ 提到可以放在 Nginx 这类反向代理后面，或者用隧道工具转发；真要对外提供，至少要在代理层加上访问控制。

**Q：公司网络要走代理才能下载模型怎么办？**
官方 FAQ 的说明是设置 `HTTPS_PROXY` 环境变量，让 Ollama 拉取模型的请求经过代理，并确保代理的证书已安装为系统证书。设置方法同上。

**Q：WSL 或 Docker 里连不上 Windows 上的 Ollama？**
它们和宿主机不是同一个 `localhost`。先把 `OLLAMA_HOST` 改成 `0.0.0.0:11434`，再在容器里用宿主机的地址访问（Docker Desktop 一般是 `host.docker.internal`）。

**Q：卸载 Ollama 会删掉模型吗？**
官方 Windows 文档注明：如果你改过 `OLLAMA_MODELS`，卸载程序不会删除那里的模型，需要自己手动删除。

## 参考资料

- Ollama 文档：FAQ（配置服务、模型位置、网络访问、并发）— https://docs.ollama.com/faq
- Windows — https://docs.ollama.com/windows
- macOS — https://docs.ollama.com/macos
- Context length — https://docs.ollama.com/context-length
