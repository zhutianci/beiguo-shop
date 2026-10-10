---
title: E2B 是什么：给 AI 智能体用的代码沙箱，安装与第一段代码
slug: e2b-sandbox-what-is-quickstart
products: [ai-tools]
models: []
topics: [ai-agent]
accountTier: OTHER
excerpt: E2B 沙箱是什么、为什么智能体需要它？按 E2B 官方文档讲清沙箱、模板、暂停与恢复三个概念，JavaScript 和 Python SDK 的安装命令，创建沙箱并在里面执行命令的最小示例，以及让模型生成的代码在沙箱里跑的基本思路和注意事项。
checkedOn: 2026-10-11
sources:
  - https://docs.e2b.dev/
verify:
  - 官方文档首页没有写沙箱的默认存活时间、启动速度和价格，本文未写，以官方文档和定价页为准
  - API Key 的获取入口官方首页未说明，以 E2B 控制台实际界面为准
  - 本文只覆盖文档首页给出的最小示例；文件上传下载、自定义模板、桌面沙箱的具体接口见官方对应章节
---

> 本文根据 E2B 官方文档首页整理，资料核对于 2026-10-11。文中代码取自官方页面，没有在本机运行验证。

## 适用于谁

- 搜「e2b 是什么」「e2b 沙箱」「e2b sandbox」「e2b sdk」的人；
- 在做能写代码、跑代码的智能体，发愁「模型生成的代码到底在哪执行」的人；
- 看到别人的智能体项目依赖里有 `e2b`，想知道它是干什么的人。

## 结论先说

1. **E2B 提供隔离的沙箱**，让智能体可以安全地执行代码、处理数据、运行工具。
2. **一个沙箱就是一台按需创建的 Linux 虚拟机**，官方的描述是快速、安全，并且可以暂停和恢复。
3. **用起来就三步**：拿到 API Key 并设成环境变量 `E2B_API_KEY` → 装 SDK（`npm i e2b` 或 `pip install e2b`）→ `Sandbox.create()` 之后在里面执行命令。
4. **它解决的问题是隔离**：模型写的代码不在你的服务器或电脑上跑，出了问题影响不到你的环境。

## 一、为什么智能体需要沙箱

让模型「写一段代码分析这个 CSV 并画图」，写出来的代码总得有地方执行。几种做法的差别：

| 在哪执行 | 问题 |
| --- | --- |
| 你的应用服务器上 | 模型生成的代码能读到服务器上的密钥、文件，能访问内网，一段有问题的代码就可能造成事故 |
| 用户的电脑上 | 同样的风险落到用户头上，而且环境各不相同 |
| 一次性的隔离环境里 | 代码能碰到的只有沙箱里的东西，用完销毁 |

模型生成的代码应当被当作**不可信的代码**对待：它可能写错，也可能因为读到了恶意内容而被带偏。沙箱就是第三种做法的现成实现。不少智能体框架的示例里，执行命令的工具背后都是某种沙箱，例如[《Vercel AI SDK 是什么》](/guides/vercel-ai-sdk-getting-started)里引用的官方示例。

## 二、三个核心概念

官方文档首页列的概念：

| 概念 | 官方的说明 |
| --- | --- |
| Sandbox（沙箱） | 为你的智能体按需创建的、快速且安全的 Linux 虚拟机，可以按需暂停和恢复 |
| Template（模板） | 定义沙箱启动时的环境 |
| Persistence（持久化） | 暂停沙箱会保存它的文件系统和内存；暂停的沙箱会一直保留，直到你把它终止 |

模板的用途：你的任务总是需要某些软件包时，把它们做进模板，新沙箱启动时就已经装好，不必每次现装。

暂停与恢复的用途：一个要持续很久、中间有等待的任务（比如等用户确认），可以先把沙箱暂停，回来再接着用，文件和内存状态都在。

## 三、安装 SDK

JavaScript / TypeScript：

```bash
npm i e2b
```

Python：

```bash
pip install e2b
```

创建沙箱需要 API Key，SDK 从环境变量 `E2B_API_KEY` 读取。在 E2B 的控制台拿到 Key 后设置环境变量（macOS / Linux 用 `export E2B_API_KEY=...`，Windows PowerShell 用 `$env:E2B_API_KEY = "..."`）。

## 四、第一段代码

官方的最小示例，创建一个沙箱并在里面执行一条命令。

Python：

```python
from e2b import Sandbox

sandbox = Sandbox.create()  # Needs E2B_API_KEY environment variable
result = sandbox.commands.run('echo "Hello from E2B Sandbox!"')
print(result.stdout)
```

JavaScript / TypeScript：

```javascript
import { Sandbox } from 'e2b'

const sandbox = await Sandbox.create() // Needs E2B_API_KEY environment variable
const result = await sandbox.commands.run('echo "Hello from E2B Sandbox!"')
console.log(result.stdout)
```

- `Sandbox.create()`：创建一台新的沙箱虚拟机；
- `sandbox.commands.run(...)`：在沙箱里执行一条终端命令；
- `result.stdout`：命令的标准输出。

这条 `echo` 是在远端的沙箱里执行的，不是在你的电脑上。

## 五、接到智能体里：基本思路

把沙箱做成智能体的一个工具：

1. 定义一个「执行命令」或「运行代码」的工具，参数是模型给出的命令或代码；
2. 工具的实现里，把这段内容交给沙箱执行；
3. 把标准输出和报错原样返回给模型；
4. 模型根据结果决定下一步：修正代码重试，或者给出最终答案。

官方文档里有专门的章节讲怎么把大模型接到沙箱上、让它运行 AI 生成的代码。工具调用的机制见[《Claude 工具调用入门》](/guides/claude-tool-use-basics)；用框架来组织这个循环，可以看[《OpenAI Agents SDK 教程》](/guides/openai-agents-sdk-python-quickstart)或[《Pydantic AI 是什么》](/guides/pydantic-ai-agent-getting-started)。

## 六、还能做什么

官方文档首页提到的其他能力：

- 向沙箱上传文件、从沙箱下载文件，比如把用户的数据文件传进去、把生成的图表取出来；
- 安装自定义的第三方软件包；
- **桌面沙箱**：给「电脑操作」类智能体用的虚拟 Linux 桌面，智能体可以看到并控制它；
- 在 GitHub Actions 的 CI/CD 里使用，用于测试、校验和 AI 代码审查。

每一项的具体接口见官方文档的对应章节。

## 七、注意事项

- **沙箱隔离的是执行环境，不是你传进去的数据**。传进沙箱的文件和密钥，沙箱里的代码都能读到。只传任务需要的东西，不要把生产环境的凭据放进去；
- **用完要清理**。按官方说明，暂停的沙箱会一直保留到你终止它。长期不用的沙箱及时终止，避免不必要的占用；
- **API Key 只放在服务端**，不要写进前端代码或提交进仓库；
- **费用**：按官方定价页为准，本文不列数字。

## 常见问题

**Q：和 Docker 容器有什么区别？**
按官方的说法，E2B 的沙箱是虚拟机，并且是托管服务：你通过 SDK 按需创建，不用自己维护宿主机。自己用 Docker 搭隔离环境也是常见做法，隔离强度和运维工作由你自己负责。

**Q：只能跑 Python 吗？**
沙箱是一台 Linux 虚拟机，上面的最小示例执行的是终端命令。能运行什么取决于沙箱环境里装了什么，可以通过模板定制。

**Q：ChatGPT、Claude 自带的代码执行和它是一回事吗？**
思路相同，都是把模型写的代码放到隔离环境里跑。区别在于那些是产品内置的功能，而 E2B 是给开发者在自己的应用里用的基础设施。

**Q：必须用 E2B 才能做会跑代码的智能体吗？**
不是。它是这类沙箱服务中的一个，一些模型厂商的 API 也自带代码执行工具。关键是原则：模型生成的代码不要直接在有权限、有数据的环境里执行。

## 参考资料

- E2B Documentation（官方文档）：https://docs.e2b.dev/
