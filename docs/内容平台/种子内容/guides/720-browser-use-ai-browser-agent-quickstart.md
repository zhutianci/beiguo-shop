---
title: Browser Use 使用教程：安装、第一个浏览器智能体、换模型与登录态
slug: browser-use-ai-browser-agent-quickstart
products: [ai-tools]
models: []
topics: [ai-agent]
accountTier: OTHER
excerpt: Browser Use 是什么、怎么安装使用？按官方 README 和 Quickstart 讲清它的三种用法、Python 版本与安装步骤、十几行代码让模型操作浏览器完成任务、换成 OpenAI / Gemini / Claude 模型的写法、自定义工具、复用本机 Chrome 登录态，以及验证码和费用的官方说明。
checkedOn: 2026-10-11
sources:
  - https://github.com/browser-use/browser-use
  - https://docs.browser-use.com/open-source/quickstart
verify:
  - README 写 Python 3.11 及以上，Quickstart 的示例用 3.12 创建环境
  - 云浏览器价格（0.02 美元 / 浏览器小时）与新用户赠送额度（15 美元）为官方 README 在 2026-10-11 所列，以官网为准
  - 示例里各家模型的名称取自官方 Quickstart 当天版本，以官方文档为准
  - 安装 Chromium 的那条命令官方是通过 uv 的工具运行器执行的，本文为避免排版问题改用文字描述，原样命令见官方 Quickstart
---

> 本文根据 Browser Use 官方仓库 README 和官方文档 Quickstart 整理，资料核对于 2026-10-11。文中代码取自官方页面，没有在本机运行验证。

## 适用于谁

- 搜「browser use 使用」「browser use 教程」「browser use agent」「browser use cli」的人；
- 想让大模型替你在网页上点击、填表、翻页、提取信息的人；
- 写过 Selenium 或 Playwright 脚本，被页面一改版就失效折腾过的人。

## 结论先说

1. **Browser Use 是一个开源的浏览器智能体**：让大模型在浏览器里导航网页、完成任务。你用一句话描述任务，它自己决定点哪里、输入什么。
2. **三种用法**：全托管的云服务；命令行（给 Claude Code、Codex 这类已有的智能体加上浏览器能力）；Python 库（本地运行开源的智能体，自己选模型）。本文讲 Python 库。
3. **安装**：需要 Python 3.11 及以上，装 `browser-use` 包，再装一个 Chromium。
4. **最小程序**：创建一个大模型对象，创建 `Agent(task=..., llm=...)`，然后 `await agent.run()`。
5. **Python 库本身免费（MIT 许可）**，但模型调用和托管浏览器另行计费。

## 一、安装

官方 Quickstart 的步骤：

```bash
pip install uv
uv venv --python 3.12
source .venv/bin/activate
# On Windows use `.venv\Scripts\activate`
uv pip install browser-use
```

然后安装 Chromium：官方的做法是用 uv 的工具运行器执行 `browser-use install` 这个子命令，原样命令见官方 Quickstart。

README 给的另一种起步方式是新建项目后 `uv add browser-use`。

## 二、配置 API Key

在项目目录里建一个 `.env` 文件，写入你要用的那一家的 Key。官方列出的变量名：

| 变量 | 对应 |
| --- | --- |
| `BROWSER_USE_API_KEY` | Browser Use 自家的模型（官方推荐，配合 `ChatBrowserUse`），也用于云浏览器 |
| `OPENAI_API_KEY` | OpenAI |
| `GOOGLE_API_KEY` | Google Gemini |
| `ANTHROPIC_API_KEY` | Anthropic Claude |

只需要写你用的那一个。`.env` 不要提交进代码仓库。

## 三、第一个任务

官方 Quickstart 的示例（使用 Browser Use 自家的模型）：

```python
from browser_use import Agent, ChatBrowserUse
from dotenv import load_dotenv
import asyncio

load_dotenv()

async def main():
    llm = ChatBrowserUse()
    task = "Find the number 1 post on Show HN"
    agent = Agent(task=task, llm=llm)
    await agent.run()

if __name__ == "__main__":
    asyncio.run(main())
```

运行后会打开一个浏览器，智能体自己访问页面、查找内容，直到完成任务。

- `task`：用自然语言描述要做的事。写得越具体越好：去哪个网站、要什么信息、以什么形式返回；
- `llm`：驱动智能体的大模型；
- `agent.run()`：开始执行。智能体每一步都会观察页面，再决定下一步动作。

## 四、换成其他模型

Quickstart 给了同一段脚本的几个变体，区别只在导入的类和创建 `llm` 的那一行：

| 厂商 | 写法 |
| --- | --- |
| Google | `ChatGoogle(model="gemini-flash-latest")` |
| OpenAI | `ChatOpenAI(model="gpt-4.1-mini")` |
| Anthropic | `ChatAnthropic(model='claude-sonnet-4-0', temperature=0.0)` |

这些类都从 `browser_use` 导入，并使用上表中对应的环境变量。模型名是官方页面示例里的写法，实际使用时换成你账号可用的当前模型。

各家 Key 的获取见[《OpenAI API Key 怎么获取》](/guides/openai-api-key)、[《Gemini API Key》](/guides/gemini-api-key)、[《Claude API Key》](/guides/claude-api-key-console)。

## 五、常用的进阶能力

**自定义工具。** 想让智能体在浏览器操作之外还能做别的事（查数据库、写文件、调你的接口），README 的做法是用 `Tools` 注册函数，加上 `@tools.action` 装饰器。

**复用登录态。** 很多任务需要已登录的账号。README 给了两种办法：

- 本地：`Browser.from_system_chrome()`，使用本机 Chrome 的用户配置；
- 云端：使用云浏览器的 profile ID。官方说明配置同步只复制 cookie。

**云浏览器。** 创建浏览器时写 `Browser(use_cloud=True)`，改用官方托管的浏览器，需要 `BROWSER_USE_API_KEY`。

**命令行。** README 的第二种用法是命令行工具，定位是给已有的编程智能体提供浏览器操作能力，具体子命令见官方文档。

## 六、费用（官方 README，2026-10-11 核对）

| 项目 | 说明 |
| --- | --- |
| Python 库 | MIT 许可，免费 |
| 模型调用 | 按你用的模型厂商计费，或使用 Browser Use 自家模型 |
| 云浏览器 | README 列的是 0.02 美元 / 浏览器小时 |
| 新用户额度 | README 写用 Google、GitHub 或 Microsoft 账号注册可获 15 美元云端额度 |

价格和额度会调整，以官网为准。浏览器智能体每一步都要调用一次模型，一个任务几十步很常见，测试时留意用量。

## 七、几条注意事项

- **验证码**：官方的说法是，带隐身和代理的云浏览器可以减少遇到验证码的概率，但没有任何配置能保证避开或解决验证码。遇到验证码时由人来处理；
- **登录态等于账号权限**：把自己的 Chrome 配置交给智能体，它就能以你的身份操作那些已登录的网站。只在必要时使用，任务范围写清楚，重要账号不要交出去；
- **网页内容不可信**：页面上的文字可能包含针对智能体的指令。涉及付款、发送消息、删除数据的操作，不要让它无人值守地执行；
- **遵守网站的规则**：目标网站的服务条款、访问频率限制仍然适用；
- **别指望百分之百成功**：页面复杂、步骤多时会失败。把大任务拆小，给出明确的完成标准。

## 常见问题

**Q：和 Playwright、Selenium 是什么关系？**
后两者是你写死每一步的自动化脚本；Browser Use 是让模型根据页面当前的样子决定每一步。页面经常改版、流程不固定时它更省事；流程固定、要求稳定和速度时，传统脚本仍然更合适。

**Q：必须用它自家的模型吗？**
不是。官方推荐自家模型，同时给了 OpenAI、Google、Anthropic 的写法。

**Q：能在服务器上无界面运行吗？**
官方文档里有面向生产环境的写法（`@sandbox` 装饰器配合云端 profile），属于进阶内容，见官方文档。

**Q：想让 Claude Code 直接用浏览器，要用这个吗？**
可以走它的命令行方式；也可以看 Claude 自家的浏览器扩展，见[《Claude in Chrome》](/guides/claude-in-chrome)。

## 参考资料

- browser-use/browser-use（官方仓库）：https://github.com/browser-use/browser-use
- Quickstart（官方文档）：https://docs.browser-use.com/open-source/quickstart
