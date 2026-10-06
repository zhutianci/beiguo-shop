---
title: Dockerfile 怎么写：多阶段构建 Dockerfile + docker compose 编写提示词（体积小、非 root、可缓存）
slug: dockerfile-compose
model: any-llm
topics: [coding]
needsRefImage: false
useCase: 要把项目容器化、或者现有镜像太大、构建太慢、启动顺序老出问题时用：生成多阶段构建的 Dockerfile、.dockerignore 和 docker-compose.yml，并逐行说明每个选择的理由与安全检查项。
prompt: |
  你是一名负责公司容器平台的 DevOps 工程师。请帮我把下面的项目容器化，目标是：镜像小、构建可缓存、以非 root 运行、不把密钥打进镜像。

  ## 项目情况
  - 语言、框架与版本：[语言框架与版本]
  - 依赖与锁文件：[如 package-lock.json/poetry.lock]
  - 构建命令与产物：[构建命令与产物目录]
  - 启动命令与监听端口：[启动命令与端口]
  - 需要的外部服务：[如 PostgreSQL、Redis]
  - 部署目标：[本机开发/单台服务器/K8s]
  - 现有 Dockerfile 或构建报错（没有就写无）：
    [现有文件或报错]

  ## 交付物
  1. Dockerfile（多阶段）：依赖安装阶段 → 构建阶段 → 运行阶段。要求：
     - 基础镜像固定到具体版本标签，说明 slim 与 alpine 的取舍（alpine 用 musl，部分 Python 包和原生扩展可能需要重新编译）；
     - 先只复制锁文件再安装依赖，让依赖层可以被缓存；
     - 运行阶段只保留运行所需文件，用 USER 切换到非 root 用户；
     - CMD 用 exec 形式（JSON 数组），让应用直接接收停止信号，并说明应用作为 PID 1 时如何优雅退出（自行处理 SIGTERM 或使用 init）；
     - 构建期需要的密钥用 BuildKit 的 secret 挂载，不写进 ARG 或 ENV；
     - 合适时加 HEALTHCHECK。
  2. .dockerignore：至少排除 .git、本地依赖目录、构建产物、.env 和日志。
  3. docker-compose.yml：应用 + 外部服务；数据库数据用具名卷持久化；用 healthcheck 加 depends_on 的 condition: service_healthy 控制启动顺序；配置通过 env_file 或 secrets 注入；写上重启策略。按现行 Compose 规范，不写已废弃的 version 字段。
  4. 常用命令：构建、启动、看日志、进入容器、清理。

  ## 要求
  - 每个关键指令后面用注释说明为什么这样写。
  - 不确定的信息（如产物目录、端口）在文件里用 TODO 标出，并在最后汇总，不要猜。
  - 最后给一张自查表：镜像大小预估、是否非 root、是否有密钥泄露风险、缓存是否生效、时区与字符集是否需要设置。
negativePrompt: null
source: null
verify:
  - 用一个 Node.js 项目和一个 Python 项目分别实测构建，检查镜像能否正常启动
---
**怎么填变量**：[构建命令与产物] 和 [启动命令与端口] 是最容易写错的地方，从 package.json、Makefile 或现有启动脚本里原样抄过来。[部署目标] 选 K8s 时，健康检查一般交给 K8s 的探针，compose 部分可以只用于本地开发。

**常见坑**：
- 把 `COPY . .` 放在安装依赖之前，任何源码改动都会让依赖层缓存失效，构建变得很慢。
- `depends_on` 默认只保证容器启动顺序，不保证数据库已经可以连接，需要配合 healthcheck 和 `condition: service_healthy`。
- 用 shell 形式写 CMD（`CMD node server.js`），应用收不到 SIGTERM，`docker stop` 要等超时后强杀；用 exec 形式时应用成为 PID 1，也要自己处理 SIGTERM（或启用 `init: true`）。

**追问技巧**：构建失败时把完整报错贴回去；镜像太大时贴 `docker history <镜像名>` 的输出，问「哪一层最大、怎么瘦身」。

### 示例输出

> 示例，仅供参考（Node.js 应用，节选）

```dockerfile
# syntax=docker/dockerfile:1
FROM node:22-slim AS deps
WORKDIR /app
# 先只复制锁文件：源码改动不会让依赖层缓存失效
COPY package.json package-lock.json ./
RUN npm ci

FROM deps AS build
COPY . .
RUN npm run build && npm prune --omit=dev

FROM node:22-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
# 官方 node 镜像自带非 root 用户 node
USER node
EXPOSE 3000
# exec 形式：node 直接收到 SIGTERM；PID 1 不会执行默认退出动作，
# 所以应用里要监听 SIGTERM 优雅退出，或在 compose 里设 init: true
CMD ["node", "dist/server.js"]
```
