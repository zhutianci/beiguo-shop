---
title: 用 AI 读代码：快速看懂陌生代码库的提问顺序与 20 个可复制问题
slug: ai-read-unfamiliar-codebase
products: [ai-tools, github-copilot]
models: []
accountTier: FREE
excerpt: 接手陌生项目怎么用 AI 读代码？按 GitHub Copilot 与 Cursor 官方教程整理出从整体到细节的五轮提问：项目概览、入口与构建、数据流、定位具体功能、画架构图；讲清精确搜索与按含义搜索的区别，附 20 个可复制的问题。
checkedOn: 2026-10-11
sources:
  - https://docs.github.com/en/copilot/tutorials/explore-a-codebase
  - https://cursor.com/learn/understanding-your-codebase
  - https://cursor.com/docs/get-started/quickstart
  - https://cursor.com/help/ai-features/ask-mode
  - https://docs.cline.bot/core-workflows/plan-and-act
verify:
  - GitHub 上「直接在仓库页面向 Copilot 提问」官方标注为 public preview
  - 文中 20 个问题中标注「官方」的为官方示例的中文转述，其余为自拟
  - DeepWiki、Codemaps 等各工具的专门功能本文未展开
---

> 本文根据 GitHub 官方教程《Using GitHub Copilot to explore a codebase》和 Cursor 官方教程《Understanding your codebase》整理，资料核对于 2026-10-11。方法适用于任何能读取整个仓库的 AI 工具。

## 适用于谁

- 刚入职或刚接手一个项目，面对几千个文件不知道从哪看起的人；
- 想给开源项目提贡献，需要先摸清结构的人；
- 搜「ai 读代码」「ai 看懂代码」的人。

## 结论先说

1. **让 AI 读代码，要用能访问整个仓库的工具**，而不是把文件一个个贴进聊天框。编辑器里的智能体（Cursor、Copilot、Trae、Cline）、终端智能体（Claude Code、Codex），以及 github.com/copilot 都可以。
2. **用只读模式**：Cursor 的 Ask 模式、Cline 的 Plan 模式——它只回答、不改文件。
3. **提问从宽到窄**：整体概览 → 入口和构建 → 数据流 → 具体功能 → 具体函数。Cursor 官方的说法是：知道要找什么就问得具体，探索陌生领域就问得宽。
4. **要求给出处**。GitHub 官方的示例提示词里反复出现「Provide evidence」「Provide references」「with a link to the file」——让它每个结论都指到具体文件，你才能抽查。
5. **读懂之后再改**。没弄懂就让 AI 动手，是 Cursor 官方点名的常见失败模式。

## 准备：让 AI 拿到仓库

| 场景 | 做法 |
| --- | --- |
| 代码已经在本地 | 用编辑器或终端智能体打开项目文件夹。Cursor 官方快速上手的第一步就是让它解释代码库 |
| 代码在 GitHub 上、不想克隆 | 打开 github.com/copilot，点 **Add repositories, files, and spaces → Repositories**，搜索并选中仓库 |
| 正在浏览某个仓库 | 直接在仓库页面打开 Copilot Chat 提问，它会以该仓库为上下文（官方标注为公开预览） |
| 只想弄懂一个目录或文件 | 在 GitHub 上进入该目录或文件，点右上角的 Copilot 图标，问「解释这个目录里的文件」 |

私有仓库、公司代码，先确认所用工具的数据政策和公司规定，见[《AI 编程安全注意事项》](/guides/ai-coding-security-secrets-permissions)。

## 它是怎么找到代码的

了解这一点能帮你把问题问对。Cursor 官方把智能体的搜索分成两类：

- **精确搜索**：按确切的字符串找，比如函数名、变量名（底层是 grep 一类的工具）。你问「找出所有 import 了 PaymentService 的文件」，它就会走这条路。
- **按含义搜索**：不知道确切名字时，按意思找相关文件，再用精确搜索补细节。你问「支付失败是怎么处理的」，它会先搜语义再追引用。

所以：**记得名字就给名字**（函数名、报错原文、接口路径、界面上的文字），不记得就描述行为。把界面上看到的一句提示语原样贴给它，往往是定位功能最快的办法。

## 五轮提问

### 第一轮：整体概览

```text
概述这个仓库：它是做什么的、目录结构、关键组件、怎么运行。
每个结论都指出依据的文件。
```

### 第二轮：入口、构建、运行

```text
这个项目怎么构建和启动？应用的入口在哪些文件？
列出运行它需要的环境变量和外部依赖（数据库、缓存、第三方服务）。
```

然后**真的照着跑一遍**。能跑起来，后面的理解才有地方验证；跑不起来，把报错贴回去继续问。

### 第三轮：数据怎么流动

```text
描述一次「用户下单」从前端到数据库的完整流程：
经过哪些文件和函数、在哪做校验、在哪写库、失败时怎么返回。
```

Cursor 官方的同类示例是：我们的应用怎么处理支付失败？从结账表单到用户看到的错误信息，带我走一遍。

### 第四轮：定位具体功能

```text
登录鉴权是在哪里处理的？哪些接口需要登录、是怎么判断的？
```

```text
找出所有调用 sendEmail 的地方，按「触发场景」分组列出来。
```

### 第五轮：画出来

```text
画一张 Mermaid 图，展示支付模块的数据流：结账表单、API 路由、支付服务、第三方支付接口。
```

Cursor 官方说这类图对新人上手、写文档和设计评审都有用，还能暴露架构问题——比如某个服务依赖了太多其他服务，或者数据流走了一条意料之外的路。

## 20 个可复制的问题

**概览类**（前六条为 GitHub 官方示例的转述）

1. 根据仓库里的代码，概述代码库的架构，并给出依据。
2. 概述这个仓库：用途、结构、关键组件、怎么运行。
3. 主要入口有哪些？关键组件之间是怎么配合的？
4. 这个仓库用了哪些语言，各占多少？
5. 这个仓库实现了哪些核心算法？
6. 用了哪些设计模式？每种简要解释，并给出仓库里使用它的代码示例和文件链接。

**定位类**

7. 怎么构建这个项目？（官方）
8. 鉴权是在代码库的哪里处理的？（官方）
9. 描述这个应用里的数据流。（官方）
10. 用了哪些应用层的安全机制？给出引用。（官方）
11. 找出所有 import 了某某服务的文件，并说明它们各自怎么处理某某错误。（Cursor 官方）
12. 界面上这句提示语「……」是在哪个文件里输出的？从那里往回追到触发条件。

**理解细节类**

13. 逐段解释这个函数：输入、输出、副作用、可能抛出的异常。
14. 这个文件里哪些是历史遗留的兼容代码？依据是什么？
15. 这个配置项在哪些地方被读取？改掉它会影响什么？
16. 这两个模块之间是什么关系？谁依赖谁？

**为动手做准备类**

17. 我要给订单加一个「备注」字段，需要改哪些文件？按顺序列出，先不要改。
18. 项目里已有哪些公共工具函数和校验器？新代码应该复用哪些？
19. 这个项目的测试怎么组织的？怎么只运行某一个模块的测试？
20. 这个仓库有哪些不成文的约定（命名、目录、错误处理方式）？从现有代码里归纳，并各举一例。

## 怎么判断它说得对不对

AI 读代码会出两类错：**没读到就猜**，以及**把相似的代码混在一起**。应对办法：

- **抽查出处**。它说「在 `auth/middleware.ts` 里校验」，打开文件看一眼。给不出文件和行号的结论先存疑。
- **反过来问**。「你刚才说只有三个地方调用了这个函数，再用精确搜索确认一遍，列出全部匹配。」
- **用运行结果验证**。加一行日志、打个断点、跑一个测试，比读十遍解释更可靠。
- **留意它没读的部分**。大仓库里它不会读完所有文件。问「你读了哪些文件得出这个结论？」

## 省上下文的做法

- **让子智能体去搜**。Cursor 内置的 Explore 子智能体在自己的上下文窗口里运行、用更快的模型，可以并行做大量搜索，只把结论带回主对话；Claude Code、Devin Desktop 也有类似的子智能体机制，见[《Claude Code Subagents 怎么用》](/guides/claude-code-subagents)。
- **一个主题一个对话**。弄懂鉴权后，开新对话去看支付。
- **把结论沉淀下来**。让它把这一轮的理解写成一页项目说明，或者整理进 `AGENTS.md` / `CLAUDE.md`，以后每个会话都能直接用。见[《AGENTS.md 怎么写》](/guides/agents-md-cross-tool-guide)。

```text
把我们刚才弄清楚的内容整理成一份新人上手文档：项目用途、目录结构、
启动方式、核心流程、常见坑。控制在一页内，每一条都标注对应的文件路径。
```

## 常见问题

**Q：不会编程，也能用这个办法看懂一个项目吗？**
可以看懂「它是做什么的、大致怎么组成」。从第 2 条问题开始，再追问不懂的术语即可。

**Q：仓库太大，它总是答得很笼统？**
缩小范围：指定目录、指定功能，或者给它一个具体的入口（某个接口路径、某句界面文字）让它顺着追。

**Q：读完之后想让它直接改？**
先让它列出要改的文件和步骤（第 17 条），确认后再切到能修改的模式。之后的流程见[《用 AI 重构代码》](/guides/ai-refactor-code-safely)和[《Cursor Agent 模式怎么用》](/guides/cursor-agent-mode-plan-ask)。

## 参考资料

- Using GitHub Copilot to explore a codebase（GitHub 官方教程）：https://docs.github.com/en/copilot/tutorials/explore-a-codebase
- Understanding your codebase（Cursor 官方教程）：https://cursor.com/learn/understanding-your-codebase
- Quickstart（Cursor 官方）：https://cursor.com/docs/get-started/quickstart
- Ask mode（Cursor 官方帮助中心）：https://cursor.com/help/ai-features/ask-mode
- Plan & Act Mode（Cline 官方）：https://docs.cline.bot/core-workflows/plan-and-act
