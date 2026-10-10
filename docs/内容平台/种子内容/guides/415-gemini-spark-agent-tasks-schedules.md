---
title: Gemini Spark 是什么、怎么用：任务、日程与技能，让 Gemini 代你跑流程的 AI 代理
slug: gemini-spark-agent-tasks-schedules
products: [gemini]
models: [gemini-llm]
accountTier: PRO
excerpt: Gemini Spark 是 Gemini App 里的个人 AI 代理：你交代目标和时间，它调用 Gmail、云端硬盘、浏览器等自动完成多步骤任务。本文按官方帮助中心讲清使用条件、任务 / 日程 / 技能三件套、创建和接管任务的步骤、15 个任务上限，以及官方反复强调的安全注意事项。
checkedOn: 2026-10-10
sources:
  - https://support.google.com/gemini/answer/17094507
  - https://support.google.com/gemini/answer/17094710
  - https://support.google.com/gemini/answer/17094196
  - https://support.google.com/gemini/answer/17171264
  - https://support.google.com/gemini/answer/16275805
  - https://support.google.com/googleone/answer/14534406
verify:
  - 可用地区三处官方说法不同：Spark 帮助页写「Gemini 支持的地区都可用，欧洲经济区、尼日利亚、瑞士、英国除外」；更新日志写 7 月 16 日起向美国的 AI Pro 用户开放（英语），Ultra 用户为全部语言；Google One 帮助页仍写「仅美国、仅英语」
  - 「Switch to Spark」「Tasks」「Schedules」的中文界面名称以实际为准
  - 官方把 Spark 标注为处于早期开发阶段的实验性功能，条件和入口可能变化
---

> 本文根据 Google 官方 Gemini 帮助中心整理，核对日期 2026-10-10。Gemini Spark 于 2026 年 5 月 19 日开始推出，官方称其为「早期开发阶段的实验性功能」，变化很快，以帮助中心最新说明为准。

## 适用于谁

- 搜「gemini spark 是什么」「gemini spark 怎么用」「gemini spark 能做什么」的人；
- 想让 Gemini 不只是回答问题，而是真的去整理收件箱、定期盯某个主题的人；
- 分不清 Spark 的「日程」和普通对话里的「定时任务」的人。

## 结论先说

1. **Gemini Spark 是一个 AI 代理（agent）**：你说清目标和时间，它自己拆步骤，调用关联应用、技能、甚至浏览器去完成，并在需要你确认或接手时停下来等你。
2. **需要 Google AI Pro 或 Ultra**，年满 18 岁、个人 Google 账号、开启「保留活动记录」；工作 / 学校账号暂不支持。
3. **三件套**：任务（Task，做什么）、日程（Schedule，什么时候做）、技能（Skill，怎么做）。
4. **入口**：网页版侧边栏「切换到 Spark（Switch to Spark）」；也可以在手机 App 和 Mac 版 Gemini 里用。
5. **上限**：同时最多 **15 个**任务在运行；Spark 消耗的是账号的整体用量额度。
6. **它会犯错**：官方反复强调要自己盯着，不要把登录信息、支付信息直接打在任务对话里，敏感的事不要交给日程自动跑。

## 一、使用条件

| 条件 | 说明 |
| --- | --- |
| 订阅 | Google AI Pro 或 Ultra |
| 年龄与账号 | 满 18 岁；个人 Google 账号 |
| 设置 | 「保留活动记录」开启 |
| 可用入口 | Gemini 手机 App、Mac 版 Gemini、网页版 gemini.google.com |
| 地区 | 帮助页写：Gemini 支持的地区均可，欧洲经济区、尼日利亚、瑞士、英国除外；不同订阅档的开放范围和语言见文首说明 |

取消订阅或降到不含 Spark 的档位后：进行中的任务会跑完但不删除，日程会被暂停而不是删除；重新订阅后恢复。技能不需要订阅，在普通对话里照样能用。

## 二、任务、日程、技能分别是什么

帮助中心用「做什么、什么时候做、怎么做」来解释：

- **任务（Task）**：一个完整的目标。例：「规划并管理我去伦敦的出差。」
- **日程（Schedule）**：让任务在后台自动触发的条件。例：「每天早上 8 点，给我一份 AI 新闻更新」「航班延误时通知我，并提出行程调整方案」。
- **技能（Skill）**：一套可复用的指令和背景资料，教 Gemini 某类事情该怎么做、用什么工具。可以手动指定，Gemini 也会在相关时自动使用。技能的创建方法见本站《Gemini Skills 怎么用》。

**日程有三种触发方式**：

| 类型 | 说明 | 官方示例 |
| --- | --- | --- |
| 按时间 | 一次性，或每小时、每天、每周、每月、每年 | 「每天早上 7 点，查看我的邮件、日历和云端硬盘，告诉我今天该优先处理什么」 |
| Gmail 监控 | 收到符合条件的邮件时触发 | 「每当经理发来带有我的待办事项的邮件，帮我处理并起草回复」 |
| 主题监控 | 监控新闻、财经、体育、本地活动等，事件发生时触发 | 「我所在城市有新的美食快闪活动公布时，把详情发邮件给我，并在日历上建议一个时间」 |

官方提醒：监控类日程不适合追踪快速变化的数据，也不适合分秒必争的事（比如抢票）。

**注意**：这里的日程和普通对话里的「定时任务（Scheduled actions）」是两个独立的功能，后者见本站《Gemini 定时任务怎么用》。

## 三、创建第一个任务

**网页版**：

1. 侧边栏点「切换到 Spark（Switch to Spark）」；
2. 在输入框里描述要交给 Gemini 的任务；可以同时说明什么时候执行（某个时间，或某个事件之后）；
3. 想指定技能：输入 `/` 选择；也可以让它使用某个自定义的关联应用；
4. 需要文件：点「上传与工具」，可以上传文件、从云端硬盘添加、或添加笔记本；
5. 提交。之后**定期回来看**，Gemini 可能需要你补充信息或接手操作。

不知道从哪开始的话，在 Spark 里输入「set up」「get started」或「interview me」，它会用对话的方式带你设置第一批技能和任务。Spark 首页还有「Trending」区域，列着可以直接改来用的推荐任务。

**Mac 版**：打开 Gemini → 侧边栏「Spark → Tasks」，其余相同（指定技能用 `/` 或 `@`）。Mac 上设置好 Spark 后，还可以从别的设备远程让它在这台 Mac 上执行操作。

官方给的入门任务：清理收件箱（总结或归档各种订阅邮件、退订邮件列表）、定制新闻摘要（持续跟踪你关心的事）、专题研究（按你的目标整理资料并附引用来源）。

## 四、查看进度、接管和停止

打开任务的对话线程，再展开它的**工作面板**，可以看到：

- **进度（Progress）**：已完成、进行中、计划中的步骤；
- **文件（Files）**：Gemini 读过或改过的文件，点开可查看；
- **日程（Schedules）**：这个任务下的所有日程，可以在这里暂停和恢复；
- **技能与应用（Skills & apps）**：用到的技能、关联应用和浏览器。

**浏览器任务**：Spark 能在浏览器里替你操作网页（比如把商品加入购物车）。它有两种浏览器——

- **本地 Chrome**（目前仅桌面版 Chrome 的自动浏览）：能访问你已登录的所有网站；需要保持电脑和 Chrome 处于运行状态；
- **远程浏览器**：一个独立的云端浏览器实例，关掉电脑任务也能继续，但遇到需要登录的页面会停下来等你。

遇到登录页时，Spark 会请你确认用「使用 Google 账号登录」，否则请你接手手动登录。接管远程浏览器：工作面板「技能与应用 → 远程浏览器」→ 把鼠标移到画面上点「接管任务（Take over task）」，做完后点顶部「交还给 Gemini」。

**停止**：在任务输入框点「停止」可以彻底取消当前任务。

## 五、Spark 能用到哪些东西

- **关联应用与 Google 服务**：通讯录、Gemini Notebook、Google 相册、Google Workspace（日历、文档、云端硬盘、Gmail、Keep、表格、幻灯片、Tasks）、搜索类服务（搜索、财经、航班、酒店、地图）、YouTube，以及若干第三方应用。更新日志提到已陆续支持 Canva、Instacart、OpenTable、Dropbox、Zillow；
- **自定义应用**：通过 MCP 服务器地址接入；
- **个人智能**：过往对话记忆、你给 Gemini 的指令、已连接的 Google 应用；
- **远程浏览器和远程电脑**（可运行代码）；
- **Canvas 和 Nano Banana**：可以在 Canvas 面板里编辑 Spark 创建的 Google 文档，也能生成和编辑图片。

## 六、限制

- 同一时间最多 **15 个**任务在运行，满了要等前面的完成；已有 15 个任务在跑时，日程不会触发；
- Spark 用的是 Gemini 的整体用量额度，消耗取决于每天的请求数量和复杂度，订阅档位越高额度越高，快到上限时会提示；
- 关闭 Spark 期间日程不会运行；用本地浏览器时电脑关机也会影响执行。

## 七、官方强调的安全事项

帮助中心用了很大篇幅讲风险，摘要如下：

1. **不要把登录信息、支付信息或敏感内容直接打在任务对话里**。需要输入时，接管浏览器，在网页上自己填；
2. **敏感的事不要交给日程**。日程在你离线时也会运行，你可能来不及阻止一次错误操作；
3. **警惕提示注入**：网页、邮件、文档里可能藏着你看不见、但 AI 读得到的恶意指令，诱导它泄露你的邮件或文件内容、执行恶意命令；
4. **它会把必要信息分享给网站**：代你办事时，可能把姓名、联系方式、文件、偏好等交给第三方网站；
5. **内置的保护**：发送消息、修改数据、购买、提交表单、用 Google 账号登录之前会请你确认；会展示计划和进度；会把浏览范围限制在与任务相关的网站；遇到密码、支付等信息会停下来请你接管。但官方明说这些「不能保证防住所有风险」，**你的监督才是最重要的保护**；
6. **用完清理**：「设置与帮助 → Gemini Spark 设置」里可以删除远程浏览器数据（含保存的网站登录状态）和远程代码执行数据。

## 八、关闭 Spark

「设置与帮助 → Gemini Spark 设置 → 关闭 Gemini Spark」。关闭后：远程浏览器和远程代码执行数据被删除；任务、对话、日程和相关文件不会删除，只是暂停；重新开启后，暂停的任务和日程会自动恢复。本地 Chrome 的浏览数据不受影响。

## 常见问题

**Q：Spark 和 ChatGPT、Claude 的代理功能是一类东西吗？**
定位相近：都是把多步骤的事交给 AI 自己执行。各家的能力边界和条件不同，本站另有《ChatGPT Work 和 Codex 有什么区别》《Claude Cowork 怎么用》可以对照。

**Q：免费或 AI Plus 能用吗？**
不能。帮助中心写明需要 Google AI Pro 或 Ultra。

**Q：Spark 做的事可以撤销吗？**
帮助中心没有给出统一的撤销机制，而是强调关键操作前会请你确认。已经发出的邮件、提交的表单按各自应用的规则处理。

## 参考资料

- Use Gemini Spark to manage your tasks & workflows in Gemini Apps（Gemini 帮助中心）：https://support.google.com/gemini/answer/17094507
- Create & manage schedules for tasks in Gemini Spark：https://support.google.com/gemini/answer/17094710
- Find & manage your Gemini Spark tasks：https://support.google.com/gemini/answer/17094196
- What's new for Gemini Spark（更新日志）：https://support.google.com/gemini/answer/17171264
- Gemini Apps limits & upgrades for Google AI subscribers：https://support.google.com/gemini/answer/16275805
- Use Google AI Pro benefits（Google One 帮助中心）：https://support.google.com/googleone/answer/14534406
