---
title: CLAUDE.md 怎么写：让 Claude Code 读完仓库生成项目 CLAUDE.md / AGENTS.md 提示词
slug: claude-md-agents-md
model: claude-llm
topics: [coding]
needsRefImage: false
useCase: 在项目里开始用 Claude Code（或 Codex 等编程智能体）时用：让它先读仓库里的配置、脚本和 CI，再生成一份精简的项目说明文件，只写智能体无法自己推断、但每次都要遵守的内容（常用命令、架构要点、团队约定、禁区），并提醒哪些规则应该改用钩子强制执行。
prompt: |
  请为当前仓库编写一份给编程智能体看的项目说明文件：[CLAUDE.md/AGENTS.md/两者都要]。这份文件会在每次会话开始时被读入上下文，所以每一行都要有用。

  补充背景（仓库里看不出来的信息）：
  - 项目用途与使用者：[项目用途]
  - 团队约定（分支、提交信息格式、代码审查要求等）：[团队约定]
  - 过去智能体犯过的错或容易踩的坑：[踩过的坑]
  - 绝对不能做的操作：[禁止操作]

  工作步骤：
  1. 先调查，不要急着写。阅读并总结：README 与 docs 目录、依赖清单与锁文件、package.json scripts / Makefile / justfile 等任务脚本、CI 配置、lint 与格式化配置、测试配置、目录结构、已有的 CLAUDE.md 或 AGENTS.md。
  2. 把你的发现列成清单给我确认，特别是：构建、测试、单个测试文件的运行方式、lint 命令；以及你从代码中推断出来、但不确定的约定。等我确认后再写文件。
  3. 文件内容只包含这几类：
     - 项目一句话概述与技术栈；
     - 常用命令（每条一行，注明用途；运行单个测试的方式要单独写出）；
     - 架构地图：关键目录与模块的职责，数据或请求的主要流向；
     - 不能从 linter 和代码里直接看出的约定，例如「金额一律用整数分」「新接口必须经过某个鉴权中间件」；
     - 已知的坑与禁区，每条写清原因；
     - 完成任务的标准，例如「提交前必须跑通测试和类型检查」。
  4. 不要写：通用编程常识（如「写清晰的代码」）、可以直接从代码推断的信息、会很快过时的细节（具体行号、临时任务）、任何密钥或内部地址。
  5. 篇幅控制在 200 行以内。只在某个子目录才需要的规则，建议放到该子目录自己的说明文件中，不要堆在根目录。
  6. 如果仓库已有说明文件，在原文件基础上提出修改建议并标注增删，不要整体覆盖。

  最后另外列出：
  - 哪些规则属于「必须百分之百执行」的（如禁止修改某个目录、提交前必须格式化），这类规则写在说明文件里只是提示，建议改为钩子或 CI 检查来强制执行，并说明怎么做；
  - 只能由我补充的信息清单。
negativePrompt: null
source: null
verify:
  - 在一个真实仓库里用 Claude Code 运行一次，检查是否先列调查结果等待确认、生成文件是否在 200 行以内
  - 核对 Claude Code 官方文档中 CLAUDE.md 与 AGENTS.md 的读取规则是否有更新（https://code.claude.com/docs/en/memory）
---
**怎么用**：在项目根目录打开 Claude Code，直接粘贴这段提示词（[踩过的坑] 这类信息只有你知道，尽量填写）。Claude Code 自带的 `/init` 也能生成初稿；这条提示词的区别是先调查、再确认、最后才写，并严格控制篇幅。

**几个事实**（据 Claude Code 官方文档，2026-10 核对）：
- 项目级 CLAUDE.md 放在仓库根目录或 .claude/ 下；个人偏好放在不提交的 CLAUDE.local.md 或 ~/.claude/CLAUDE.md。
- CLAUDE.md 可以用 `@路径` 导入其他文件；官方建议每个文件 200 行以内。
- 仓库已有 AGENTS.md（Codex 等工具使用）且没有 CLAUDE.md 时，新版 Claude Code 会直接读取 AGENTS.md；两者都有时默认只读 CLAUDE.md，可以在 CLAUDE.md 里写一行 `@AGENTS.md` 共用一份内容。
- 说明文件是「上下文」而不是强制配置，必须拦住的操作要用钩子（hooks）。

**追问技巧**：用一段时间后，把智能体又犯的错告诉它：「把这次的教训用一行写进 CLAUDE.md 的『已知的坑』，并检查有没有可以删掉的过时条目」。

### 示例输出

> 示例，仅供参考（节选）

```markdown
# 订单服务

Node.js 22 + Fastify + Prisma（PostgreSQL）。对外提供下单、支付回调、退款接口。

## 常用命令
- pnpm dev：本地启动（需先 docker compose up -d db）
- pnpm test：全部测试；单个文件用 pnpm vitest run src/orders/refund.test.ts
- pnpm lint && pnpm typecheck：提交前必须通过

## 约定
- 金额一律用整数「分」存储与计算，不用浮点数
- 支付回调必须先验签再处理，验签逻辑只在 src/payments/verify.ts

## 已知的坑
- 修改 prisma/schema.prisma 后要运行 pnpm prisma generate，否则类型不会更新
```
