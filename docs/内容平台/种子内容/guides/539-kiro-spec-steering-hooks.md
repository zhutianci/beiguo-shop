---
title: Kiro Spec 模式怎么用：需求、设计、任务三步工作流，Steering 规则与 Hooks 配置
slug: kiro-spec-steering-hooks
products: [ai-tools]
models: []
accountTier: FREE
excerpt: Kiro 的 Spec 模式是什么、怎么用？按官方文档讲清 requirements.md / design.md / tasks.md 三个文件、需求优先与设计优先两种流程、Quick Spec 与 Bugfix Spec、任务并行执行，以及 Steering 四种加载方式和 Hooks 的写法。
checkedOn: 2026-10-11
sources:
  - https://kiro.dev/docs/specs
  - https://kiro.dev/docs/specs/feature-specs
  - https://kiro.dev/docs/specs/quick-spec
  - https://kiro.dev/docs/specs/bugfix-specs
  - https://kiro.dev/docs/steering
  - https://kiro.dev/docs/hooks
  - https://kiro.dev/docs/getting-started/installation
verify:
  - Hooks 可用的全部触发事件以官方 Hook types 页为准，本文只用了官方示例里的 PostFileSave 与提到的 PreToolUse
  - 各功能在 IDE / CLI / Web / Mobile 上的支持范围不同，文中表格取自官方文档当天的版本
  - 收费与额度本文未涉及，见官网定价页
---

> 本文根据 Kiro 官方文档《Specs》《Steering》《Hooks》整理，资料核对于 2026-10-11。Kiro 是 AWS 出品的 AI IDE，产品介绍见本站 AI 应用目录里的 Kiro 条目。

## 适用于谁

- 觉得「一句话让 AI 直接写」越写越乱，想先把需求和设计定下来的人；
- 搜「kiro spec 模式」「kiro spec 工作流」「kiro steering 怎么用」「kiro hooks」的人；
- 团队想让需求文档、设计文档和代码一起进仓库的人。

## 结论先说

1. **Spec 是 Kiro 的规格驱动流程**：把一个想法变成三份文件——`requirements.md`（修 bug 时是 `bugfix.md`）、`design.md`、`tasks.md`，都放在 `.kiro/specs/功能名/` 下。
2. 流程三阶段：**需求 → 设计 → 任务**，每一阶段你确认了才进入下一阶段。
3. 熟悉的小功能用 **Quick Spec** 一次生成三份文件；修复杂 bug 用 **Bugfix Spec**；探索性的随手改动不必用 Spec。
4. **Steering** 是 Kiro 的项目规则：`.kiro/steering/` 下的 Markdown 文件，四种加载方式；Kiro 也读 `AGENTS.md`。
5. **Hooks** 是事件触发的自动化：智能体保存文件、调用工具时自动跑命令或追加提示。

## 安装与登录

官方系统要求（IDE）：macOS（Intel 与 Apple 芯片）、Windows 10 / 11、Linux（Ubuntu 24+、Debian 13+、Fedora 40+ 等）。到 kiro.dev 下载安装包，首次打开时用 Google、GitHub、AWS Builder ID 或组织身份登录；可以选择导入 VS Code 的设置和扩展。

## Spec 的三份文件

| 文件 | 内容 |
| --- | --- |
| `requirements.md` | 用户故事和验收标准（官方说明使用 EARS 记法） |
| `bugfix.md` | 修 bug 时代替 requirements：当前行为、期望行为、**不应改变的行为** |
| `design.md` | 技术架构、时序图、数据流、错误处理与测试策略 |
| `tasks.md` | 离散、可跟踪的实施任务清单 |

## 步骤：在 IDE 里跑一个 Feature Spec

1. 在 Kiro 面板的 **Specs** 下点 **+**，或在聊天面板里选 **Spec**；
2. Kiro 问你是做功能（Feature）还是修 bug（Bug）。选 Feature 后描述功能，并选流程：**Requirements-First** 或 **Design-First**；
3. 看它生成的第一份文件，不满意就直接编辑或在聊天里要求修改，满意了进入下一阶段；
4. 三份文件都确认后，在 `tasks.md` 的任务执行界面里逐个运行或全部运行，状态会实时更新为进行中 / 已完成。

**两种流程怎么选**：

| | Requirements-First | Design-First |
| --- | --- | --- |
| 顺序 | 需求 → 设计 → 任务 | 设计 → 需求 → 任务 |
| 适合 | 清楚系统该有什么行为、架构可以灵活设计；由用户反馈驱动的产品功能；没有技术包袱的新项目 | 心里已有架构；想从伪代码和算法入手；系统有严格的非功能要求（延迟、吞吐、合规） |

**全部运行时会自动并行**：Kiro 分析 `tasks.md` 建出依赖图，把互不依赖的任务分成一波一波——同一波内并发执行，波与波之间顺序执行。不需要额外设置。

CLI 里对应的命令是 `/spec new 名称` 开始、`/spec run 名称` 进入全屏的任务执行视图。网页版（app.kiro.dev）可以为一个 spec 选多个仓库，完成后由智能体开 pull request。官方在这里有一条警告：**只选你信任的仓库**，因为智能体会遵循仓库代码里的指示。

## Quick Spec 与 Bugfix Spec

**Quick Spec**：在开始会话的「Let's build」界面选择。Kiro 先集中问一轮澄清问题（范围、约束、边界情况），然后**不设审批关卡**地依次生成三份文件，你直接落在任务清单上。官方建议只在两种情况用：功能你很熟、信得过它的输出；或者快速做原型。需求还在摸索、评审关卡确实有价值时，用标准 Feature Spec。

**Bugfix Spec**：模仿有经验的工程师修 bug 的方式——找根因、明确要改什么、**明确写出什么不能变**。适合需要根因分析的复杂 bug、关键路径上回归代价高的 bug、之前修过却引入了回归的情况。

## Steering：让 Kiro 记住项目约定

Steering 文件是 Markdown，放两个位置：

- **工作区**：项目根目录的 `.kiro/steering/`，只对这个项目；
- **全局**：用户目录的 `~/.kiro/steering/`，对所有项目。两者冲突时**工作区优先**。

Kiro 可以一键生成三份基础文件（Steering 区域点 **Generate Steering Docs**）：`product.md`（产品目的、用户、功能）、`tech.md`（技术栈与约束）、`structure.md`（目录组织、命名、架构决定）。它们默认每次交互都会带上。

自定义文件通过文件开头的 frontmatter 决定加载方式（必须是文件最开头的内容，前面不能有空行）：

| `inclusion` | 何时加载 | 适合 |
| --- | --- | --- |
| `always`（默认） | 每次交互 | 技术栈、编码规范、安全要求 |
| `fileMatch` | 处理的文件匹配 `fileMatchPattern` 时 | 组件规范、API 规范、测试规范 |
| `manual` | 聊天里输入 `#文件名` 时；也会出现在 `/` 命令里 | 排障手册、迁移流程等偶尔才用的长文档 |
| `auto` | 请求与 `description` 匹配时 | 类似 skill，按描述自动取用 |

```markdown
---
inclusion: fileMatch
fileMatchPattern: "app/api/**/*"
---
# 接口规范
- 所有接口返回 { code, message, data } 结构
- 入参用 zod 校验
```

**AGENTS.md**：Kiro 支持这个通用标准，放在工作区根目录、子目录或 `~/.kiro/steering/` 都会自动读取；但它不支持加载方式，**始终加载**。跨工具的写法见[《AGENTS.md 怎么写》](/guides/agents-md-cross-tool-guide)。

一个容易漏掉的点：使用自定义智能体（custom agents）时，Steering 文件**不会自动带上**，要在智能体配置的 `resources` 里显式加入。

## Hooks：事件触发的自动化

Hook 配置是 `.kiro/hooks/` 下的 JSON 文件，每个文件定义一个或多个 hook：触发事件、可选的匹配模式、动作。动作有两种：

- **command**：在项目根目录跑一条 shell 命令，会话上下文以 JSON 从标准输入传入；
- **agent**：往当前对话里注入一段提示，引导智能体的行为。

官方的例子——智能体每次保存 TypeScript 文件后自动跑 ESLint：

```json
{
  "version": "v1",
  "hooks": [{
    "name": "Lint on save",
    "trigger": "PostFileSave",
    "matcher": "\\.(ts|tsx)$",
    "action": { "type": "command", "command": "npx eslint --fix" }
  }]
}
```

保存为 `.kiro/hooks/lint-on-save.json` 即自动生效。官方列举的用途：改完文件自动跑 linter / 格式化 / 类型检查；用 PreToolUse 在前置条件不满足时拦住危险操作；新增源文件时自动生成配套的测试或文档；提交前检查质量。也可以直接在聊天里让智能体帮你创建 hook。Hooks 目前只在 IDE 和 CLI 里可用。

## 常见问题

**Q：小改动也要走 Spec 吗？**
不用。官方把「没有明确目标的探索性编码」列为不适合 Spec 的场景；改一行、问个问题直接在聊天里做。

**Q：三份文件要提交进 Git 吗？**
它们就在仓库的 `.kiro/specs/` 下，是普通 Markdown。官方强调的好处之一就是产品和工程共用同一份文档，提交进仓库便于评审和追溯。

**Q：Spec 写好后需求变了？**
直接改 `requirements.md` 或在聊天里提出修改，让 Kiro 更新后续的设计和任务。官方还有 Analyze Requirements 功能，用来在进入设计前找出需求里的矛盾、歧义和缺口（IDE 与 CLI 可用）。

**Q：和 Cursor 的 Plan 模式有什么不同？**
两者都是「先规划再动手」。区别在于 Kiro 把规划拆成需求、设计、任务三份长期保留的文件并分阶段确认；Cursor 的 Plan 模式产出一份实施方案。见[《Cursor Agent 模式怎么用》](/guides/cursor-agent-mode-plan-ask)。

## 参考资料

- Specs（Kiro 官方）：https://kiro.dev/docs/specs
- Feature Specs（Kiro 官方）：https://kiro.dev/docs/specs/feature-specs
- Quick Spec（Kiro 官方）：https://kiro.dev/docs/specs/quick-spec
- Bugfix Specs（Kiro 官方）：https://kiro.dev/docs/specs/bugfix-specs
- Steering（Kiro 官方）：https://kiro.dev/docs/steering
- Hooks（Kiro 官方）：https://kiro.dev/docs/hooks
