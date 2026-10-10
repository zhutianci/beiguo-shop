---
title: Cursor Rules 怎么写：.cursor/rules 配置、四种生效方式、范例与最佳实践
slug: cursor-rules-project-rules-mdc
products: [cursor]
models: []
accountTier: FREE
excerpt: Cursor Rules 配置教程：项目规则放在 .cursor/rules 且必须是 .mdc 文件，alwaysApply / description / globs 三个字段决定何时生效；附四种规则范例、官方最佳实践、与 User Rules、Team Rules、AGENTS.md 的关系和不生效的排查。
checkedOn: 2026-10-11
sources:
  - https://cursor.com/docs/rules
  - https://cursor.com/help/troubleshooting/agent-issues
verify:
  - Customize 侧边栏与 /create-rule 命令的中文界面名称未核对
  - Team Rules 需要 Teams 或 Enterprise 档，个人档看不到该入口
---

> 本文根据 Cursor 官方文档《Rules》整理，资料核对于 2026-10-11。文中的规则范例是照官方格式重新写的中文示例，不是官方原文。

## 适用于谁

- 每次开新对话都要重复交代「用 TypeScript」「别动 dist 目录」的人；
- 搜「cursor rules 配置」「cursor rules 最佳实践」「cursor rules 范例」的人；
- 把规则写成了 `.md` 文件，发现完全不生效的人。

## 结论先说

1. Cursor 有四种规则：**Project Rules**（项目里的 `.cursor/rules`）、**User Rules**（你个人的全局偏好）、**Team Rules**（团队后台统一下发）、**AGENTS.md**（项目根目录的纯 Markdown 说明）。
2. 项目规则**必须是 `.mdc` 后缀**。放在 `.cursor/rules` 里的普通 `.md` 文件会被规则系统忽略——这是「写了不生效」最常见的原因。
3. 每条规则靠 frontmatter 的三个字段决定何时进入上下文：`alwaysApply`、`description`、`globs`。
4. 官方建议：单条规则不超过 500 行、拆成多个小规则、**引用文件而不是把内容抄进规则**；Agent 反复犯同一个错时再加规则，不要一开始就写一大堆。
5. 规则只影响 **Agent（聊天）**，不影响 Tab 补全；User Rules 也不作用于行内编辑（Ctrl+K）。

## 规则是怎么起作用的

大模型在两次回答之间没有记忆。规则的作用就是把一段固定的说明，在需要的时候放到模型上下文的最前面。所以规则写得越长、越多条同时生效，占用的上下文就越多——这也是官方强调「聚焦、可执行、有范围」的原因。

## 文件放哪、叫什么

```bash
.cursor/rules/
  react-patterns.mdc       # 会被识别
  api-guidelines.md        # 被忽略（后缀不对）
  frontend/                # 可以用文件夹分类
    components.mdc
```

文件名随意。创建方式有两种：在 Agent 里输入 `/create-rule` 并描述你要的规则，它会生成带 frontmatter 的文件；或者在侧边栏 **Customize → Rules → Add Rule** 里新建，那里也能看到所有规则和它们的状态。

## 四种生效方式

界面上的类型下拉对应 frontmatter 里三个字段的组合：

| 类型 | alwaysApply | description | globs | 什么时候生效 |
| --- | --- | --- | --- | --- |
| Always Apply | `true` | — | — | 每次对话都带上 |
| Apply to Specific Files | `false` | — | 填写 | 上下文里出现匹配的文件时自动带上 |
| Apply Intelligently | `false` | 填写 | 不填 | Agent 读描述，觉得相关就取用 |
| Apply Manually | `false` | 不填 | 不填 | 只有在聊天里 `@规则名` 时 |

### 范例一：始终生效（项目总则）

```md
---
alwaysApply: true
---
- 本项目用 pnpm，不要用 npm 或 yarn 安装依赖
- 不要修改 dist/ 和 build/ 里的生成文件
- 拿不准实现细节时，先读相关源码再提方案
```

### 范例二：按文件路径自动附加

```md
---
globs: src/components/**/*.tsx
alwaysApply: false
---
- 组件用具名导出，不用默认导出
- 单个组件不超过 200 行，超了就在同目录拆子组件
- 新组件先读 @component-template.tsx，照它的结构写
```

### 范例三：由 Agent 按描述判断

```md
---
description: 后端 RPC 服务的约定与写法
alwaysApply: false
---
- 每个服务单独放在 src/services/ 下的一个文件里
- 入参在服务边界处校验
- 返回带 code 和 message 的错误对象，不要直接抛字符串
```

### 范例四：只在 @ 提到时生效

```md
---
alwaysApply: false
---
- 每个数据库迁移必须同时有 up 和 down
- 不要原地修改列类型：新增列、回填、再在另一次迁移里删旧列
```

`globs` 的写法：`**/*.ts` 匹配任意目录下的 ts 文件，`src/**` 匹配 src 下所有文件，多个模式用逗号分隔，如 `docs/**/*.md, docs/**/*.mdx`。

## 规则里引用文件

在规则里写 `@migration-template.sql` 这样的路径，是告诉 Agent「去哪看」。官方说明：文件内容**不会被塞进提示词**，而是 Agent 需要时用工具去读；编辑器、命令行和云端 Agent 都是这样。所以**必须始终在上下文里的东西，要直接写在规则正文里**。

## 官方最佳实践

该做的：

- 规则保持在 500 行以内，大规则拆成几条可组合的小规则；
- 给具体例子，或指向项目里的标准写法；
- 像写内部文档一样写清楚，避免空泛的要求；
- 把规则提交进 Git，让全队共用；发现 Agent 犯错就更新规则。

别做的：

- **照抄整份代码规范**——交给 linter，常见规范 Agent 本来就懂；
- **罗列所有命令**——npm、git、pytest 这些它都会；
- **为很少出现的边角情况写规则**；
- **把代码库里已有的东西再抄一遍**——指向那份代码就行。

## 和 User Rules、Team Rules、AGENTS.md 的关系

- **User Rules**：在 Customize → Rules 里填，对你所有项目生效，适合写「用中文简洁回答」这类个人偏好。
- **Team Rules**：Teams / Enterprise 管理员在后台创建，可设为强制（成员无法关闭）。
- **AGENTS.md**：放在项目根目录的纯 Markdown，没有 frontmatter，适合规则不多的项目；子目录里也可以放，处理该目录下的文件时自动生效，越具体的越优先。跨工具共用的写法见[《AGENTS.md 怎么写》](/guides/agents-md-cross-tool-guide)。
- **优先级**：Team Rules → Project Rules → User Rules，全部合并，冲突时前者优先。

## 常见问题

**Q：规则为什么没生效？**
先看后缀是不是 `.mdc`；再看类型：Apply Intelligently 必须有 description，Apply to Specific Files 要确认 glob 真的匹配到了当前涉及的文件。

**Q：能从别人的仓库导入规则吗？**
规则不能单独导入。官方的做法是把规则打包成插件（plugin），通过 marketplace 发布后安装，规则随插件一起到位。

**Q：规则能当安全措施用吗？**
不能只靠它。官方原话的意思是：有团队把强制规则纳入合规流程，这可以，但 AI 指引不应是唯一的安全控制。

## 参考资料

- Rules（官方）：https://cursor.com/docs/rules
- Agent troubleshooting（官方帮助中心）：https://cursor.com/help/troubleshooting/agent-issues
