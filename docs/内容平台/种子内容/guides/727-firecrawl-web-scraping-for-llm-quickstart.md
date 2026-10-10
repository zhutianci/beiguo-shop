---
title: Firecrawl 是什么、怎么用：把网页抓成 Markdown 给大模型（API、SDK 与 MCP）
slug: firecrawl-web-scraping-for-llm-quickstart
products: [ai-tools]
models: []
topics: [ai-agent]
accountTier: OTHER
excerpt: Firecrawl 是什么、怎么上手？按官方 README 讲清它的定位、scrape / crawl / map / search 等接口各做什么、API Key 格式、Python 与 Node SDK 的最小示例、curl 调用、作为 MCP 服务器接进智能体的配置，以及开源版与云端版的区别和合规提醒。
checkedOn: 2026-10-11
sources:
  - https://github.com/firecrawl/firecrawl
verify:
  - 官方 README 没有列价格和免费额度，本文未写，以 firecrawl.dev 定价页为准
  - 云端版比开源版多出的功能 README 用图表展示，本文未逐项列出
  - 示例里的 API 路径为 v2（https://api.firecrawl.dev/v2/scrape），取自官方 README 当天版本
---

> 本文根据 Firecrawl 官方仓库 README 整理，资料核对于 2026-10-11。文中代码和命令取自官方 README，没有在本机运行验证，也没有注册账号。

## 适用于谁

- 搜「firecrawl 是什么」「firecrawl api」「firecrawl mcp」「firecrawl api key」的人；
- 要把网页内容喂给大模型，自己写爬虫又被动态渲染、正文提取、格式清洗折腾过的人；
- 想让智能体具备「打开网页读内容」能力的人。

## 结论先说

1. **Firecrawl 是一个开源的网页数据平台**：把网站变成干净的、适合大模型使用的内容，供智能体和应用使用。
2. **最常用的是 scrape**：给一个网址，返回 Markdown、HTML、截图或结构化 JSON。
3. **有云端服务也可以自己部署**。开源部分是 AGPL-3.0 许可；云端版在 firecrawl.dev，功能更多。
4. **调用方式多**：HTTP API、Python 和 Node 的 SDK、命令行、MCP 服务器。
5. **抓取要守规矩**。官方说明默认遵守 robots.txt，同时明确：遵守目标网站的政策、隐私政策和使用条款是使用者的责任。

## 一、几个接口各做什么

| 接口 | 作用 |
| --- | --- |
| Scrape | 把一个网址转成 Markdown、HTML、截图或结构化 JSON |
| Crawl | 一次请求抓取一个网站的所有页面 |
| Map | 发现一个网站上有哪些网址 |
| Search | 搜索网页，并返回结果页面的完整内容 |
| Agent（原 `/extract`） | 按一段描述从网上收集数据，不需要你提供网址 |
| Interact | 抓取页面后，用 AI 提示词或代码在页面上继续操作 |
| Actions | 在提取内容之前先点击、滚动、输入、等待、按键 |
| Batch Scrape | 异步抓取很多个网址 |

怎么选：

- 已经知道要哪个页面：**Scrape**；
- 要一整个文档站、一个博客的全部文章：先 **Map** 看看有哪些网址，再决定是 **Crawl** 全部还是挑着 **Batch Scrape**；
- 不知道答案在哪个网站：**Search**；
- 内容要点一下、滚动一下才出来：**Actions**。

## 二、拿到 API Key

在 firecrawl.dev 注册后获取。Key 以 `fc-` 开头，下面示例里写作 `fc-YOUR_API_KEY`。

实际使用时把 Key 放在环境变量里，不要写进代码。

## 三、Python

安装：

```bash
pip install firecrawl-py
```

最小示例：

```python
from firecrawl import Firecrawl

app = Firecrawl(api_key="fc-YOUR_API_KEY")

result = app.scrape('firecrawl.dev')
```

## 四、Node.js

安装：

```bash
npm install firecrawl
```

最小示例：

```javascript
import { Firecrawl } from 'firecrawl';

const app = new Firecrawl({ apiKey: "fc-YOUR_API_KEY" });

app.scrape('firecrawl.dev')
```

## 五、直接调 HTTP API

```bash
curl -X POST 'https://api.firecrawl.dev/v2/scrape' \
-H 'Authorization: Bearer fc-YOUR_API_KEY' \
-H 'Content-Type: application/json' \
-d '{
  "url": "firecrawl.dev"
}'
```

任何能发 HTTP 请求的语言都可以这样用。注意路径里的版本号，旧教程里的 v1 路径和参数与现在不一定相同。

## 六、命令行

```bash
firecrawl scrape https://firecrawl.dev
```

## 七、接进智能体

**作为 MCP 服务器**。README 给的客户端配置：

```json
{
  "mcpServers": {
    "firecrawl-mcp": {
      "command": "npx",
      "args": ["-y", "firecrawl-mcp"],
      "env": {
        "FIRECRAWL_API_KEY": "fc-YOUR_API_KEY"
      }
    }
  }
}
```

这段配置放在哪，因客户端而异：Claude 桌面版见[《Claude Desktop MCP 配置教程》](/guides/claude-desktop-mcp-config-json)，Claude Code 见[《Claude Code MCP 配置教程》](/guides/claude-code-mcp-setup)，Cursor 见[《Cursor MCP 配置教程》](/guides/cursor-mcp-config-json)。

**作为 Skill**。README 给了一条初始化命令，为你的编程智能体安装 Firecrawl 的技能，装完需要重启智能体：

```bash
npx -y firecrawl-cli@latest init --all --browser
```

这条命令带 `--all` 和 `--browser` 两个参数，具体会安装和配置什么，以官方说明为准。运行前想先看清楚它会装什么，参考[《Skill 安全吗：安装前检查什么》](/guides/agent-skills-security-audit-before-install)里的检查顺序。

## 八、开源版和云端版

| | 开源自部署 | 云端版 |
| --- | --- | --- |
| 许可 | AGPL-3.0（SDK 和部分界面组件是 MIT） | 托管服务 |
| 功能 | 核心功能 | README 说明有额外功能 |
| 运维 | 自己负责 | 官方负责 |
| 入口 | 官方的 Self-Hosting Guide | firecrawl.dev |

AGPL-3.0 对「修改后以网络服务形式提供」有开源义务的要求。要把它集成进自己的商业产品并做修改时，先让懂许可证的人看一下。

## 九、合规与使用边界

README 的表述是两句话：Firecrawl 默认遵守 robots.txt；使用者有责任遵守目标网站的政策、隐私政策和使用条款。

落到实际使用上：

- **先看目标网站允不允许**。服务条款明确禁止自动化抓取的，不要抓；
- **不要抓需要登录才能看的、涉及个人信息的内容**；
- **控制频率**。Crawl 一整个站之前，先用 Map 看看规模；
- **抓来的内容有版权**。用来给模型做参考和原样转载发布是两回事；
- **网页内容不可信**。页面上可能有专门写给 AI 看的指令。智能体读了网页之后要执行有副作用的操作时，保留人工确认。

## 常见问题

**Q：和自己用 requests 加解析库写有什么区别？**
简单的静态页面自己写完全可以。Firecrawl 省掉的是动态渲染、正文提取、转成干净 Markdown、批量与重试这些重复劳动。

**Q：ChatGPT、Claude 自带联网搜索，还需要它吗？**
聊天产品里的搜索够日常使用，见[《Claude 联网搜索》](/guides/claude-web-search)。需要它的是开发场景：你自己的程序或智能体要按你的规则抓指定的页面、要结构化的结果、要批量处理。

**Q：抓下来的内容怎么用？**
典型流程是：抓成 Markdown → 分段 → 存进向量库 → 检索后交给模型。向量库见[《ChromaDB 是什么》](/guides/chromadb-vector-database-quickstart)。

**Q：免费吗？**
开源版可以自己部署。云端版的价格和免费额度 README 没有写，以官网定价页为准。

## 参考资料

- firecrawl/firecrawl（官方仓库与 README）：https://github.com/firecrawl/firecrawl
