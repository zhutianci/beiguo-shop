---
title: Python 爬虫提示词（合规版：先查 robots 与服务条款、限速、只采公开数据、断点续爬与数据清洗）
slug: python-scraper-compliant
model: any-llm
topics: [coding, data-analysis]
needsRefImage: false
useCase: 需要从公开网页批量整理数据（公开的政策文件列表、自己网站的页面、允许抓取的公开目录）做研究或分析时用：AI 先帮你检查是否允许抓取、有没有官方接口或数据下载，再写出限速、可续爬、带解析和清洗的爬虫，避开登录、验证码和个人信息。
prompt: |
  你是一名重视合规的数据工程师。请帮我写一个抓取公开网页数据的 Python 程序，同时确保这件事本身是合规的。

  - 目标网站与页面：[网站与页面说明]
  - 需要的数据字段：[如标题、发布日期、正文链接]
  - 用途：[如个人研究、内部分析]
  - 数据量：[如约 2000 个页面]
  - 页面特点：[页面特点]（例：静态 HTML、需要执行 JavaScript 才显示内容、分页方式）
  - 页面 HTML 片段（列表项和详情页各一段）：
    [粘贴 HTML 片段]

  第一步：合规检查（先回答，再写代码）
  1. 提醒我查看该网站的 robots.txt 和服务条款，说明怎么解读 robots.txt 中与目标路径相关的规则。
  2. 先确认有没有官方 API、数据下载或订阅源，有的话优先使用。
  3. 明确不做的事：不绕过登录、付费墙、验证码或任何访问控制；不采集个人信息（姓名、手机号、邮箱、头像等）；不高频访问影响对方服务。
  4. 如果用途是商用或要公开发布数据，提醒我注意版权和数据权利，需要时咨询法务。

  第二步：编写程序
  1. 请求：设置能说明身份的 User-Agent（可附联系方式）；请求间隔不低于 1 秒并带随机抖动；遇到 429 或 503 时退避并降低频率；设置超时。
  2. 解析：根据我给的 HTML 片段写选择器，字段缺失时记录而不是崩溃；说明页面结构变化时如何快速发现（例如统计字段为空的比例）。
  3. 断点续爬：记录已完成的地址，中断后从断点继续，不重复请求。
  4. 存储：结果保存为 CSV 或 SQLite，原始 HTML 可选缓存到本地，便于修改解析逻辑后重新解析而不必重新请求。
  5. 清洗：去除空白、统一日期格式、去重。
  6. 需要执行 JavaScript 的页面：先检查浏览器开发者工具中页面数据是否来自某个公开的数据请求，能直接用就不需要浏览器自动化。

  输出：合规检查清单、完整代码（中文注释，requests + BeautifulSoup 或 lxml 实现）、运行方法、参数（间隔、并发）怎么调。
negativePrompt: null
source: null
verify:
  - 拿一个允许抓取的公开静态页面测试，检查程序是否读取并遵守 robots.txt、请求间隔是否不少于 1 秒
---
**怎么填变量**：[页面 HTML 片段] 从浏览器开发者工具里复制列表中的一项和详情页的主要区域即可，AI 会根据它写选择器。[用途] 要如实写，商用、公开发布和个人研究面临的合规要求不同。

**常见坑**：
- 不看 robots.txt 和服务条款就开始抓，或者为了「快」把间隔设为零，可能给对方服务器造成压力，也可能违反对方条款。这条提示词把合规检查放在第一步。
- 很多网站其实提供官方接口或数据下载，比解析网页稳定得多，先找一找。
- 只保存解析后的结果，不缓存原始页面。一旦发现解析规则写错了，只能重新请求一遍所有页面。

**追问技巧**：页面改版导致解析失败时，把新的 HTML 片段贴回去，问「对比旧选择器，需要改哪些地方」。

### 示例输出

> 示例，仅供参考（节选）

**合规检查**：
1. 打开 `https://目标网站/robots.txt`，确认目标路径（如 `/notices/`）没有被 Disallow；如果写了 Crawl-delay，按其要求设置间隔。
2. 该网站提供 RSS 订阅源，列表数据可以直接从订阅源获取，只需对详情页做少量请求。
3. 只采集标题、日期和链接，不采集评论区的用户信息。

```python
import random, time, urllib.robotparser
import requests

UA = "research-bot/0.1 (contact: your-email@example.com)"
rp = urllib.robotparser.RobotFileParser("https://example.org/robots.txt")
rp.read()

def polite_get(session: requests.Session, url: str) -> requests.Response | None:
    if not rp.can_fetch(UA, url):
        print(f"robots.txt 不允许：{url}")
        return None
    time.sleep(1 + random.random())          # 至少 1 秒，带随机抖动
    r = session.get(url, headers={"User-Agent": UA}, timeout=15)
    if r.status_code in (429, 503):
        time.sleep(60)                        # 对方要求放慢时，等待更久
    return r
```
