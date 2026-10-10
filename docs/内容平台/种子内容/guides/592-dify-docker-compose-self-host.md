---
title: Dify 本地部署教程：Docker Compose 安装、初始化管理员、改配置与升级
slug: dify-docker-compose-self-host
products: [ai-tools]
models: []
accountTier: FREE
excerpt: Dify 怎么本地部署？本文按官方自部署文档给出最低配置、三条命令启动 Docker Compose、各容器应有的状态、从 /install 初始化管理员，以及改端口、升级和克隆报错的处理。
checkedOn: 2026-10-11
sources:
  - https://docs.dify.ai/zh/self-host/deploy/quick-start/docker-compose
  - https://docs.dify.ai/zh/self-host/deploy/quick-start/faqs
  - https://docs.dify.ai/zh/self-host/deploy/configuration/environments
  - https://github.com/langgenius/dify/releases
---

## 适用于谁

- 搜「dify 本地部署」「dify docker 部署教程」「dify docker 部署升级」「dify windows docker 部署」的人；
- 出于数据不出内网、想接本地模型等原因，要把 Dify 装在自己电脑或服务器上的人。

本文根据 Dify 官方自部署文档整理，资料核对于 2026-10-11。只是想试试 Dify 的话，直接用云端版更快，见《Dify怎么用》。

## 结论先说

1. **官方推荐用 Docker Compose 部署**，核心就三步：克隆代码、复制 `.env`、`docker compose up -d`。
2. **最低配置**：CPU 2 核、内存 4 GiB；Docker Compose 需要 2.24.0 或更高。
3. **启动后先访问 `/install` 创建管理员**，再从首页登录。
4. **改配置改的是 `docker/.env`**，改完要重启容器。
5. **升级没有一条通用命令**，官方要求按目标版本的发布说明操作。

## 部署前准备

### 硬件

官方给出的最低要求：CPU ≥ 2 核，内存 ≥ 4 GiB。这只是让 Dify 自己跑起来的要求，不包含本地模型。

### 软件

| 操作系统 | 所需软件 | 官方备注 |
| --- | --- | --- |
| macOS 10.14 或更高 | Docker Desktop（含 Docker Compose 2.24.0+） | Docker 虚拟机至少分配 2 个虚拟 CPU 和 8 GiB 内存 |
| Linux | Docker 19.03+、Docker Compose 2.24.0+ | — |
| Windows（启用 WSL 2） | Docker Desktop（含 Docker Compose 2.24.0+） | 源代码和挂载给容器的数据建议放在 Linux 文件系统里，而不是 Windows 盘 |

先确认版本：

```bash
docker compose version
```

## 步骤

### 1. 克隆代码

官方命令会自动取最新的发布版本：

```bash
git clone --branch "$(curl -s https://api.github.com/repos/langgenius/dify/releases/latest | jq -r .tag_name)" https://github.com/langgenius/dify.git
```

这条命令依赖 `git`、`curl`、`jq` 三个工具，缺哪个装哪个。

### 2. 准备配置并启动

```bash
cd dify/docker
cp .env.example .env
docker compose up -d
```

官方文档列出会启动的容器：

- 7 个核心服务：`api`、`api_websocket`、`worker`、`worker_beat`、`web`、`plugin_daemon`、`agent_backend`；
- 8 个依赖组件：`weaviate`、`db_postgres`、`redis`、`nginx`、`ssrf_proxy`、`agent_ssrf_proxy`、`sandbox`、`local_sandbox`；
- 1 个一次性任务 `init_permissions`，用来设置存储文件的权限，跑完自动退出。

第一次启动要拉取所有镜像，耗时取决于网络。

### 3. 检查容器状态

```bash
docker compose ps
```

每个容器的状态应该是 `Up` 或 `healthy`。`init_permissions` 显示 `Exited` 是正常的，不用管。

### 4. 初始化管理员并登录

1. 浏览器打开初始化页面，设置管理员账号：
   - 本机：`http://localhost/install`
   - 服务器：`http://服务器IP/install`
2. 设置完成后从首页登录：`http://localhost` 或 `http://服务器IP`。

登录之后的使用方式和云端版一样：先到模型供应商里接入模型，再创建应用。

## 修改配置

官方文档对配置文件的说明：

- **必要的启动配置**在 `docker/.env` 里（就是你从 `.env.example` 复制出来的那个文件），直接编辑；
- **可选的、特定组件的配置**在 `docker/envs/` 下有模板。要覆盖默认值，把对应模板复制一份并去掉 `.example` 后缀再编辑，例如：

```bash
cd dify/docker
cp envs/vectorstores/milvus.env.example envs/vectorstores/milvus.env
```

- `docker/.env` 里的值优先级高于 `docker/envs/*.env`。

改完之后重启才生效：

```bash
docker compose down
docker compose up -d
```

**80 端口被占用**是最常见的启动失败原因（Dify 自带的 nginx 默认对外用 80 端口）。官方「环境变量」文档里对应的变量是 `EXPOSE_NGINX_PORT`（默认 `80`，含义是映射到 Nginx HTTP 的宿主机端口）。在 `docker/.env` 里把它改成别的端口再重启；改了之后访问地址也要带上端口号，例如 `http://localhost:8080/install`。

## 升级

官方的说法是：不同版本的升级步骤可能不同，要看 GitHub Releases 页面里**目标版本**的升级指南。另外两条提醒：

- 升级后对照新的 `.env.example` 检查自己的 `.env`，看有没有新增或变更的变量；
- 如果你改过 `docker-compose.yaml`，要把改动重新应用到新版本的文件上，不要沿用旧文件，因为新版本可能增加了运行必需的服务。

升级前务必备份。官方 FAQ 给的做法是把整个 `dify` 目录复制一份并带上时间戳：

```bash
cp -r dify "dify.bak.$(date +%Y%m%d%H%M%S)"
```

## 常见问题

**Q：克隆时报 `fatal: Remote branch null not found in upstream origin`？**
官方 FAQ 的解释：克隆命令通过 GitHub API 获取最新版本号，这个请求失败时（文档里写的常见原因是 GitHub 对匿名请求的频率限制）就会得到 null。到 Dify 的 Releases 页面查到最新版本号，改用显式版本号克隆：

```bash
git clone --branch 版本号 https://github.com/langgenius/dify.git
```

官方还说明，不加 `--branch` 直接克隆也可以运行，`main` 分支的 Compose 文件指向的仍是最新发布版镜像。

**Q：服务器上不方便用 git 怎么办？**
官方 FAQ 提供了 ZIP 方式：用 `wget` 下载最新发布版的压缩包再解压；或者在另一台设备上下载 ZIP 后手动传过去。

**Q：想装指定的旧版本？**
`git clone https://github.com/langgenius/dify.git --branch 版本号`，其余步骤相同。

**Q：怎么接本机的 Ollama？**
Dify 跑在容器里，容器里的 `localhost` 不是宿主机。在 Dify 的模型供应商里添加 Ollama 时，地址要填宿主机可达的地址（Docker Desktop 上一般是 `http://host.docker.internal:11434`），同时把 Ollama 的 `OLLAMA_HOST` 设为 `0.0.0.0`。设置方法见《Ollama 修改模型存储位置与局域网访问》。

**Q：Windows 上很慢？**
对照官方的备注检查：是否启用了 WSL 2；代码目录是否放在了 Windows 盘上。官方建议把源代码和挂载数据放在 Linux 文件系统里。

**Q：容器起不来怎么看原因？**
`docker compose ps` 找到状态不对的容器，再用 `docker compose logs 容器名` 看日志。官方文档另有「Docker 问题」和「常见问题」两篇排查文章。

## 参考资料

- Dify 文档：使用 Docker Compose 部署 Dify — https://docs.dify.ai/zh/self-host/deploy/quick-start/docker-compose
- 自部署常见问题 — https://docs.dify.ai/zh/self-host/deploy/quick-start/faqs
- 环境变量 — https://docs.dify.ai/zh/self-host/deploy/configuration/environments
- Dify Releases — https://github.com/langgenius/dify/releases
