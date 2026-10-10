---
title: Kubernetes YAML 生成与排错提示词（Deployment / Service / Ingress，CrashLoopBackOff、探针、资源限制）
slug: kubernetes-yaml-troubleshoot
model: any-llm
topics: [coding]
needsRefImage: false
useCase: 要把服务部署到 Kubernetes、写不对 YAML，或者 Pod 一直 CrashLoopBackOff、Pending、ImagePullBackOff、被 OOMKilled 时用：AI 生成带探针、资源限制、优雅停止的部署清单，或者根据 describe 和日志输出逐步判断问题出在哪一层。
prompt: |
  你是一名有丰富生产经验的 Kubernetes 运维工程师。

  - 任务：[任务]（可选：生成部署清单/排查 Pod 异常）
  - 集群环境：[集群环境]（例：云厂商托管集群，版本 1.30）
  - 应用信息：[应用信息]（例：Java 服务，端口 8080，健康检查 /actuator/health）
  - 资源需求与副本数：[资源与副本]（例：2 副本，每个约 1G 内存）
  - 配置与密钥：[配置与密钥]（例：数据库地址走 ConfigMap，密码走 Secret）
  - 排查时的输出（Pod 状态、describe 事件、日志、上一次容器的日志，原样粘贴）：
    [粘贴输出]

  生成清单时：
  1. Deployment：资源请求与限制（说明请求影响调度、限制影响终止与限流，以及 Java 等运行时如何根据容器内存设置堆大小）；就绪探针、存活探针、启动探针的区别和各自的参数设置，避免存活探针过早杀掉启动慢的应用；滚动更新策略；优雅停止（停止前的等待与终止宽限期）；以非 root 用户运行。
  2. Service 与 Ingress（或 Gateway），说明端口的对应关系。
  3. 配置与密钥的挂载方式；提醒 Secret 默认只是编码而非加密，以及更安全的管理方式。
  4. 需要时提供 Pod 中断预算与水平自动扩缩容的配置。

  排查异常时：
  1. 根据状态判断方向：
     - Pending：资源不足、节点选择或污点、存储卷无法绑定；
     - ImagePullBackOff：镜像名或标签错误、私有仓库凭证；
     - CrashLoopBackOff：应用启动失败（看上一次容器的日志）、配置缺失、存活探针失败；
     - OOMKilled：内存限制过小或内存泄漏；
     - 运行中但不可访问：就绪探针失败、Service 选择器与 Pod 标签不匹配、端口不一致。
  2. 每一步告诉我执行哪条只读命令、看输出中的哪个字段，再根据结果决定下一步。
  3. 给出修复后的 YAML 片段。

  不要建议在生产环境直接删除资源或强制操作，除非说明后果并让我确认。
negativePrompt: null
source: null
verify:
  - 用一份「存活探针初始延迟过短导致 Java 服务被反复重启」的 describe 输出跑一次，检查是否建议启动探针
  - 核对探针、资源字段与 https://kubernetes.io/docs/ 当前版本一致
---
**怎么填变量**：排查时 [粘贴输出] 最有用的是三样：Pod 的状态列表、describe 输出末尾的事件、上一次崩溃容器的日志（容器重启后当前日志可能是空的，要看上一次的）。

**常见坑**：
- 存活探针的等待时间太短，启动慢的应用还没启动完就被判定为不健康并重启，于是陷入无限重启。启动慢的应用用启动探针。
- 只设置内存限制、不设置请求，调度器按零需求调度，节点被塞满后 Pod 频繁被驱逐。
- Service 的选择器和 Pod 的标签差一个字母，服务就找不到任何后端，而且不会报错。

**追问技巧**：追问「把这几个服务的清单改造成 Helm chart 或 Kustomize 结构，区分测试和生产环境的配置」。

### 示例输出

> 示例，仅供参考（排查 CrashLoopBackOff，节选）

**第 1 步**：

```bash
kubectl describe pod order-api-7c9f -n prod | tail -20
kubectl logs order-api-7c9f -n prod --previous
```

如果事件中出现「Liveness probe failed」，且上一次日志显示应用仍在启动（例如正在初始化连接池），说明是存活探针过早介入，而不是应用本身出错。

**修复**：

```yaml
startupProbe:                  # 启动阶段最多等待 30 × 5 = 150 秒
  httpGet: { path: /actuator/health, port: 8080 }
  periodSeconds: 5
  failureThreshold: 30
livenessProbe:                 # 启动探针成功后才开始执行
  httpGet: { path: /actuator/health/liveness, port: 8080 }
  periodSeconds: 10
  failureThreshold: 3
```
