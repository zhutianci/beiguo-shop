---
title: Docker 容器起不来怎么办提示词（容器立即退出、退出码含义、端口与网络不通、挂载目录权限报错）
slug: docker-container-debug
model: any-llm
topics: [coding]
needsRefImage: false
useCase: 容器启动后马上退出、一直重启、访问不到端口、挂载的目录没有权限、容器之间互相连不上时用：把 docker ps、logs、inspect 的输出贴给 AI，它根据退出码和日志判断原因，给出逐步验证的命令和修复方法。
prompt: |
  你是一名熟悉 Docker 和容器网络的运维工程师。请帮我排查容器问题，按「先看证据、再下结论」的方式进行。

  - 现象：[现象]（例：容器启动几秒后退出，状态为 Exited 1）
  - 运行方式：[运行方式]（例：docker compose，或 docker run 的完整命令）
  - 宿主机系统：[宿主机系统]（例：Ubuntu、Windows 上的 Docker Desktop）
  - 已有输出（容器列表与状态、容器日志、inspect 中的关键部分、compose 文件）：
    [粘贴输出]
  - Dockerfile（如果是自己构建的镜像）：
    [粘贴 Dockerfile]

  分析步骤：
  1. 根据退出码判断方向：0（主进程正常结束，常见于前台进程写成了后台运行）、1（应用自身报错）、126 与 127（命令不可执行或找不到，常见于脚本换行符或路径问题）、137（被强制终止，常见于内存超限）、139（段错误）、143（收到终止信号）。
  2. 看日志：容器已经退出时如何查看最后的日志；日志为空时如何用交互方式启动同一个镜像进去排查（覆盖入口命令）。
  3. 常见原因逐项检查：
     - 主进程不在前台运行，执行完就退出；
     - 环境变量或配置文件缺失；
     - Windows 编辑的脚本带有回车换行符，导致「找不到文件」；
     - 挂载目录的属主与容器内运行用户不一致，导致没有权限；
     - 端口映射写反、应用只监听了容器内的本地回环地址导致外部无法访问；
     - 容器之间用 localhost 互相访问（应该用服务名）、不在同一个网络；
     - 依赖的服务（如数据库）还没就绪，应用就启动并失败退出；
     - 内存限制过小被终止。
  4. 每个判断给出验证命令，等我贴回结果再继续。
  5. 给出修复方法：修改 Dockerfile、compose 文件或启动命令的具体内容。

  不要建议用特权模式或关闭安全设置来解决权限问题。
negativePrompt: null
source: null
verify:
  - 用一个「入口脚本在 Windows 上编辑、带 CRLF 换行导致 exec format error / no such file」的场景跑一次，检查是否识别换行符问题
---
**怎么填变量**：[已有输出] 最关键的是容器状态里的退出码和容器日志的最后几十行。用 compose 时把整个 compose 文件贴上，很多网络和依赖顺序问题出在这里。

**常见坑**：
- 应用只监听了 127.0.0.1，在容器内一切正常，从宿主机访问映射端口却连不上。要监听 0.0.0.0。
- 在 compose 中，一个容器用 `localhost` 去连数据库容器，其实连的是自己。要用数据库服务的名字作为主机名。
- 「依赖启动顺序」只保证容器启动的先后，不保证数据库已经可以接受连接。需要健康检查加依赖条件，或者在应用中重试连接。

**追问技巧**：解决后追问「这个镜像还有哪些可以优化的地方（体积、构建缓存、以非 root 运行）」，可以配合 418 号 Dockerfile 提示词使用。

### 示例输出

> 示例，仅供参考（现象：容器启动后立即退出，退出码 127）

**判断**：127 表示「命令找不到」。结合日志 `exec /app/entrypoint.sh: no such file or directory`，而文件确实存在，最常见的原因是脚本在 Windows 上编辑过，行尾带有回车符，导致首行的解释器路径被识别成带回车的路径。

**验证**：

```bash
docker run --rm --entrypoint sh myapp:latest -c "head -1 /app/entrypoint.sh | od -c | head -2"
```

如果输出中出现 `\r`，即可确认。

**修复**：在仓库中为脚本统一使用 LF 换行（例如通过 .gitattributes 设置），或在 Dockerfile 中转换：

```dockerfile
COPY entrypoint.sh /app/entrypoint.sh
RUN sed -i 's/\r$//' /app/entrypoint.sh && chmod +x /app/entrypoint.sh
```
