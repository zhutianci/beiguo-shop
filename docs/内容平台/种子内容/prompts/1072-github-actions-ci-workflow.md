---
title: GitHub Actions 工作流怎么写提示词（CI 测试、依赖缓存、矩阵构建、密钥管理、按路径触发）
slug: github-actions-ci-workflow
model: any-llm
topics: [coding]
needsRefImage: false
useCase: 想给 GitHub 仓库加自动化测试、构建、发布流程，或者现有工作流太慢、经常出错时用：描述项目和需求，得到结构清晰的工作流 YAML，带依赖缓存、并发取消、最小权限、密钥安全使用，并解释每一段的作用和常见报错。
prompt: |
  你是一名熟悉 GitHub Actions 的 DevOps 工程师。请帮我编写或优化工作流。

  - 项目技术栈：[技术栈]（例：Node.js 22 + pnpm 的 monorepo）
  - 需要的流程：[流程]（例：PR 时跑 lint 和测试，合并到 main 后构建镜像）
  - 运行环境需求：[运行环境]（例：测试需要 PostgreSQL）
  - 需要的密钥或外部服务：[密钥]（例：镜像仓库凭证）
  - 现有工作流（如果要优化）：
    [粘贴现有 YAML，没有就写无]

  要求：
  1. 触发条件：区分推送和拉取请求；需要时按路径过滤（只改文档时不跑测试）；说明来自复刻仓库的拉取请求默认无法使用仓库密钥。
  2. 权限：在工作流或任务级别声明最小权限，默认只读，需要写入时单独授予。
  3. 依赖缓存：使用官方 setup 动作自带的缓存功能或缓存动作，缓存键基于锁文件的哈希。
  4. 并发：同一分支上新的提交触发时，取消仍在运行的旧任务。
  5. 矩阵：需要多版本测试时使用矩阵，并说明失败时是否立即取消其他组合。
  6. 服务容器：测试需要的数据库用服务容器提供，并等待其健康检查通过。
  7. 密钥：只通过密钥上下文引用，不打印到日志；部署类任务使用环境并配合审批（如果需要）。
  8. 第三方动作：说明固定版本的方式（标签与提交哈希的取舍）。
  9. 拆分任务与依赖关系，让互不相关的任务并行运行；必要时复用工作流或组合动作，避免重复。

  输出：完整的 YAML（每段带中文注释）、需要在仓库设置中配置的内容（密钥、环境、分支保护）、常见报错与排查方法。动作的版本号写当前主版本，并注明「以动作仓库的最新说明为准」。
negativePrompt: null
source: null
verify:
  - 在测试仓库中运行生成的工作流，检查缓存是否命中、并发取消是否生效
  - 核对 permissions、concurrency、services 语法与 https://docs.github.com/en/actions 当前文档一致
---
**怎么填变量**：[需要的流程] 按「什么时候触发、做什么」写，例如「拉取请求时跑检查和测试；合并到 main 后构建并推送镜像；打标签时发布」。[现有工作流] 贴上后，AI 会指出慢在哪里、哪些写法有安全隐患。

**常见坑**：
- 不声明权限，工作流使用的令牌可能拥有不必要的写权限；如果某个第三方动作被篡改，风险更大。
- 缓存键写死或不包含锁文件哈希，依赖更新后还在用旧缓存，或者缓存永远不命中。
- 把密钥直接拼进命令行参数并开启调试输出，可能泄露到日志中。

**追问技巧**：追问「把这几个仓库共用的步骤抽成可复用工作流」，或「工作流跑一次要 15 分钟，帮我分析哪几步可以并行或缓存」。

### 示例输出

> 示例，仅供参考（节选）

```yaml
name: CI
on:
  pull_request:
    paths-ignore: ['docs/**', '**.md']
  push:
    branches: [main]

permissions:
  contents: read            # 默认只读

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true  # 同一分支有新提交时取消旧任务

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: postgres
        ports: ['5432:5432']
        options: >-
          --health-cmd "pg_isready" --health-interval 5s --health-retries 10
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm        # 基于 pnpm-lock.yaml 的缓存
      - run: pnpm install --frozen-lockfile
      - run: pnpm test
        env:
          DATABASE_URL: postgres://postgres:postgres@localhost:5432/postgres
```
