---
title: Skill 和 MCP 的区别是什么：再加上子代理、Hook、CLAUDE.md，到底该选哪个
slug: skill-vs-mcp-vs-subagent-vs-hook
products: [claude, ai-tools]
models: []
topics: [ai-agent]
accountTier: FREE
excerpt: Skill 和 MCP 有什么区别、Skill 和 subagent 又怎么分？按 Claude Code 官方文档《Extend Claude Code》讲清每种扩展解决什么问题、各自的上下文开销、六组容易混的对比，以及「遇到什么情况就加什么」的判断表。
checkedOn: 2026-10-11
sources:
  - https://code.claude.com/docs/en/features-overview
  - https://code.claude.com/docs/en/skills
verify:
  - 本文的对比以 Claude Code 为准；其他工具（Codex、Cursor 等）的同名概念大体一致，但加载时机和优先级各有不同
  - 官方文档里还有 Output style、Dynamic workflow、Code intelligence 等扩展，本文只挑了最常被混淆的几种
---

> 本文根据 Claude Code 官方文档《Extend Claude Code》整理，资料核对于 2026-10-11。各项功能的具体配置见文末的站内教程链接。

## 适用于谁

- 搜「skill 和 mcp 区别」「agent skills mcp 区别」「skill 和 subagent 的区别」的人；
- 听说了 Skill、MCP、子代理、Hook、插件一堆名词，不知道自己的需求该用哪个的人；
- 把所有规矩都塞进 CLAUDE.md，文件越来越长的人。

## 结论先说

一句话区分：

| 扩展 | 一句话 | 典型例子 |
| --- | --- | --- |
| CLAUDE.md | 每次会话都加载的常驻说明 | 「用 pnpm 不用 npm；提交前跑测试」 |
| Skill | 需要时才加载的知识和流程 | `/deploy` 部署清单；接口风格指南 |
| MCP | 连接外部服务，提供工具和数据 | 查数据库、发 Slack、操作浏览器 |
| 子代理 | 在独立上下文里干活，只把总结带回来 | 读几十个文件的调研任务 |
| Hook | 到某个事件就必定执行的自动化 | 每次改文件后跑 ESLint |
| 插件 | 把上面这些打包分发 | 一个包里带 Skill、Hook、子代理和 MCP |

最常被问的那一组，官方的说法是：**MCP 把 Claude 连到外部服务；Skill 扩展 Claude 知道的东西，包括怎么把那些服务用好。** 两者解决的是不同的问题，可以一起用。

## 一、Skill 和 MCP

| | MCP | Skill |
| --- | --- | --- |
| 是什么 | 连接外部服务的协议 | 知识、流程和参考资料 |
| 提供 | 工具和数据访问 | 做事的方法 |
| 例子 | Slack 集成、数据库查询、浏览器控制 | 代码审查清单、部署流程、接口风格指南 |

判断方法：

- Claude **够不着**某个系统（看不到你的工单、查不了你的库），需要的是 **MCP**；
- Claude 够得着，但**不知道你们怎么做**（表结构是什么、消息要按什么格式发），需要的是 **Skill**。

官方举的组合例子：MCP 负责连上数据库，Skill 里写你们团队的表结构和常用查询写法；或者做一个 `/post-to-slack` 流程，里面是团队的消息格式规定。

MCP 的入门见[《MCP 是什么》](/guides/mcp-model-context-protocol)，配置见[《Claude Code MCP 配置教程》](/guides/claude-code-mcp-setup)。

## 二、Skill 和子代理

| | Skill | 子代理 |
| --- | --- | --- |
| 是什么 | 可复用的说明、知识或流程 | 有自己上下文的独立工作者 |
| 主要好处 | 同一份内容可以在不同场合加载 | 上下文隔离：过程在别处发生，只返回总结 |
| 对上下文的影响 | 加进你的主对话 | 用单独的窗口，有自己的输入输出 |
| 适合 | 参考资料、可调用的流程 | 要读很多文件的任务、并行工作、专门角色 |

官方把 Skill 分成两种：**参考型**（整个会话里随时参考的知识，如接口规范）和**动作型**（让 Claude 做一件具体的事，如 `/deploy`）。

什么时候用子代理：需要隔离上下文，或者主对话的上下文快满了。子代理可能读了几十个文件、做了大量搜索，主对话只收到一段总结。

两者可以互相嵌套：

- 子代理的 `skills:` 字段可以预加载指定的 Skill；
- Skill 的 frontmatter 写 `context: fork`，就会在隔离的子代理里运行。官方提醒这只适合带明确任务的 Skill，纯粹是规范说明的 Skill 分出去运行得不到有用的结果。

子代理的写法见[《Claude Code 子代理》](/guides/claude-code-subagents)。

## 三、Skill 和 CLAUDE.md

| | CLAUDE.md | Skill |
| --- | --- | --- |
| 何时加载 | 每次会话，自动 | 按需 |
| 能否触发流程 | 不能 | 能，用 `/名称` |
| 适合 | 「总是这样做」的规则 | 参考资料、可调用的流程 |

- Claude **任何时候都该知道**的，放 CLAUDE.md：编码规范、构建命令、项目结构、「绝不要做某事」；
- **有时才需要**的参考资料，或者要用命令触发的流程，放 Skill。

官方的经验值：**CLAUDE.md 保持在 200 行以内**。超了就把参考性的内容挪进 Skill，或者拆到 `.claude/rules/` 里。rules 可以用 `paths` 限定只在处理匹配的文件时才加载。

CLAUDE.md 的写法见[《CLAUDE.md 与 AGENTS.md 怎么写》](/guides/claude-md-agents-md)。

## 四、Skill 和 Hook

| | Hook | Skill |
| --- | --- | --- |
| 运行的是 | 脚本、HTTP 请求、MCP 工具调用、提示词或子代理 | Claude 读了之后照做的说明 |
| 由什么触发 | 生命周期事件，如 `PostToolUse`、`SessionStart` | 你输入 `/名称`，或 Claude 把描述和任务对上了 |
| 确定性 | 事件发生就一定执行 | Claude 来理解和执行，结果可能有出入 |
| 上下文开销 | 零，除非 Hook 返回了输出 | 描述每次会话都在，全文用时加载 |
| 适合 | 改完自动格式化、拦截危险命令、日志、通知 | 需要推理的流程、参考资料、多步任务 |

官方有一句很关键的话：写在 CLAUDE.md 或 Skill 里的「绝不要改 `.env`」是一个**请求**，不是保证；用 `PreToolUse` Hook 把这次修改拦下来，才是**强制**。必须每次都成立的规则，做成 Hook。

Hook 的写法见[《Claude Code Hooks》](/guides/claude-code-hooks)。

## 五、插件是什么关系

插件是**打包层**：把 Skill、Hook、子代理和 MCP 服务器装进一个可以安装的单元。插件里的 Skill 带命名空间（如 `/my-plugin:review`），多个插件可以并存。

什么时候需要：同一套配置要在多个仓库里复用，或者要通过市场分发给别人。只在一个项目里自己用，直接放 `.claude/` 目录就够了。详见[《Claude Code 插件与插件市场》](/guides/claude-code-plugins-marketplace)。

## 六、各自占多少上下文

装得越多，占的上下文越多；官方提醒过量不仅占空间，还会带来噪声，让 Skill 触发不准、让 Claude 记不住你的约定。

| 扩展 | 何时加载 | 加载什么 | 上下文开销 |
| --- | --- | --- | --- |
| CLAUDE.md | 会话开始 | 全文 | 每次请求都在 |
| Skill | 会话开始 + 使用时 | 开始时只有描述，使用时加载全文 | 低（描述每次请求都在） |
| MCP 服务器 | 会话开始 | 工具名称；完整的参数定义用到时才加载 | 工具被使用前很低 |
| 子代理 | 被派出时 | 全新的独立上下文 | 与主会话隔离 |
| Hook | 触发时 | 默认不加载任何内容 | 零，除非返回了额外内容 |

两个省上下文的官方提示：

- 有副作用的 Skill 设 `disable-model-invocation: true`，它的描述就不进上下文，只在你点名时运行；
- 输入 `/mcp` 看各服务器的连接状态，暂时不用的可以断开。

## 七、遇到什么情况，加什么

官方给了一张「触发条件」表，意思是不必一开始就全配上，出现对应的信号再加：

| 你遇到的情况 | 该加的 |
| --- | --- |
| 同一个约定或命令，Claude 弄错了两次 | 写进 CLAUDE.md |
| 每次开始某类任务都在敲同一段提示词 | 存成可以手动调用的 Skill |
| 同一套多步流程，第三次往对话里粘贴了 | 做成 Skill |
| 总是从 Claude 看不到的浏览器标签页里复制数据 | 把那个系统接成 MCP 服务器 |
| 一个旁支任务的输出淹没了对话，之后也不会再看 | 交给子代理 |
| 希望某件事每次都发生、不用开口 | 写 Hook |
| 第二个仓库也需要同一套配置 | 打包成插件 |

官方补充：同样的信号也告诉你何时**更新**已有的配置。反复出现的错误应该改 CLAUDE.md，而不是在对话里纠正一次了事；一个总要手动微调的流程，说明那个 Skill 该改版了。

## 八、同一种扩展放在多处时，谁生效

- **CLAUDE.md 是叠加的**：各级文件的内容同时进入上下文，有冲突时由 Claude 判断；
- **Skill 和子代理按名称覆盖**：Skill 是托管 > 个人 > 项目；子代理是托管 > 命令行参数 > 项目 > 个人 > 插件；
- **MCP 服务器按名称覆盖**：local > project > user；
- **Hook 是合并的**：所有来源注册的 Hook 都会在匹配的事件上执行。

注意 Skill 和子代理的优先级方向并不一样，Skill 的细节见[《Claude Code Skills 安装在哪里》](/guides/claude-code-skills-directory-location-priority)。

## 常见问题

**Q：有了 Skill 还需要 MCP 吗？**
要看 Claude 是否需要访问外部系统。Skill 只是说明和脚本，它让 Claude「知道怎么做」；需要登录授权、调用某个服务的专用接口时，还是要靠 MCP 提供工具。

**Q：有了 MCP 还需要 Skill 吗？**
MCP 给的是工具，不包含你们团队的用法。工具接上了但 Claude 总是用得不对（查错表、格式不合要求），就该补一个 Skill。

**Q：斜杠命令和 Skill 是什么关系？**
在 Claude Code 里，自定义斜杠命令已经并入 Skill：`.claude/commands/` 下的文件和 Skill 都会生成 `/名称`，旧文件继续可用。

**Q：别的工具也这么分吗？**
概念大体相通：常驻说明文件（AGENTS.md、规则文件）、按需加载的 Skill、连接外部服务的 MCP。具体的加载规则以各工具的官方文档为准。

## 参考资料

- Extend Claude Code（Claude Code 官方）：https://code.claude.com/docs/en/features-overview
- Extend Claude with skills（Claude Code 官方）：https://code.claude.com/docs/en/skills
