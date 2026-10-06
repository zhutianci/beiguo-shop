---
title: Gemini 使用技巧：Gems 改为 Skills、Deep Research 与上传文件怎么用
slug: gemini-tips-gems-deep-research
products: [gemini]
models: [gemini-llm]
accountTier: FREE
excerpt: Gemini 的 Gems 要下架了吗？2026 年 Gems 正在换成 Skills（技能），本文讲清时间表和迁移方法，以及 Deep Research 的入口、次数限制、上传文件的数量和大小限制。
checkedOn: 2026-10-07
sources:
  - https://support.google.com/gemini/answer/18560919
  - https://support.google.com/gemini/answer/17094296
  - https://support.google.com/gemini/answer/15146780
  - https://support.google.com/gemini/answer/15719111
  - https://support.google.com/gemini/answer/14903178
  - https://support.google.com/gemini/answer/16275805
  - https://support.google.com/gemini/answer/13575153
  - https://blog.google/products-and-platforms/products/gemini/automate-tasks-with-skills/
  - https://knowledge.workspace.google.com/admin/generative-ai/gemini-app/about-the-transition-to-skills
  - https://blog.google/products/gemini/visual-reports/
  - https://blog.google/products-and-platforms/products/gemini/deep-research-workspace-app-integration/
verify:
  - 个人账号 Gems 下线的具体日期：帮助中心只写「2026 年 11 月」，Workspace 管理员文档写 11 月 17 日 Gems 移到设置里，以官方通知为准
  - 免费账号能否使用 Skills：帮助中心写「18 岁以上个人账号」，Google 博客脚注写「所有 Google AI 订阅档位」，两处表述不同，需用免费账号确认
  - Deep Research 每天能用几次：官方只说有每日上限和同时进行数上限、付费更高，未公开具体数字
  - Deep Research 入口：帮助中心写在输入框「+（添加文件）」菜单里，2025 年的官方配图在「工具」菜单里，以实际界面为准
  - 帮助中心部分页面把 NotebookLM 笔记本写作「Gemini Notebook」，名称以实际界面为准
---

> 本文根据 Google 官方 Gemini 帮助中心、Google Workspace 管理员文档和 Google 官方博客整理，核对日期 2026-10-07。截图引用自 Google 官方博客配图，图下注明出处，部分为 2025 年的早期界面。Gemini 功能更新很快，以帮助中心为准。

## 适用于谁

- 搜「gemini 使用技巧」「gemini gem 是什么」，看到「Gems 下架 / 退场」的说法，想知道还要不要学 Gems 的人；
- 找不到 Deep Research 入口、想知道每天能用几次的人；
- 想让 Gemini 读 PDF、表格、视频、代码，但不清楚上传限制的人。

## 结论先说

1. **Gems 正在被 Skills（技能）取代**：个人 Google 账号从 **2026 年 11 月**起不再支持 Gems，届时会自动转成 Skills；工作和学校账号在 2027 年。现在新建可复用指令，建议直接用 Skills。
2. **Skills 比 Gems 更灵活**：不用单独打开某个 Gem，在任意对话里输入 `/`（之后会改为 `@`）加技能名就能调用，还能多个技能叠加，Gemini 也会在相关时自动套用。
3. **Deep Research 入口**：网页版输入框的「+（添加文件）」菜单里选「Deep Research」。每天有次数上限，Google AI Pro / Ultra 更高，官方未公开具体数字。
4. **上传文件**：一次最多 10 个文件；视频每个最大 2 GB，其他文件每个最大 100 MB；免费账号视频总时长 5 分钟、音频 10 分钟，Pro / Ultra 分别提高到 1 小时和 3 小时。

## 一、Gems 怎么了：时间表

Gems 是 Gemini 里的「自定义助手」：写好名字、指令，再挂上参考文件，就能反复使用。按 Google 帮助中心和官方博客（2026-09-30），Gems 会分批停止支持：

| 账号类型 | Gems 停止支持时间 |
| --- | --- |
| 个人 Google 账号 | 2026 年 11 月 |
| Workspace 企业、商业、非营利账号 | 2027 年 3 月（管理员文档写「不早于 3 月 1 日」） |
| Workspace 教育账号 | 2027 年 6 月（「不早于 6 月 1 日」） |

- 到期时 Google 会**自动把你的 Gems（连同支持的文件）转成 Skills**，不会丢失；
- Google Labs 的实验项目 Opal，以及「Gems by Google Labs」会在 11 月一起下线，后者**不会**迁移成 Skills；
- 在下线之前，Gems 仍可以在网页版「侧边栏 → Gems」里新建、编辑和使用。

所以网上「Gems 下架」「Gems 退场」的说法基本属实，但不是马上消失，也不需要手动备份才能保住。

## 二、Skills（技能）怎么用

**使用条件**（帮助中心）：年满 18 岁、用个人 Google 账号登录、开启「保留活动记录（Keep Activity）」；目前可在 Gemini 网页版、Mac 版和手机 App 中使用，工作和学校账号稍后开放。Google 正在逐步推送，你的账号可能暂时还看不到。

![Google 官方配图：在 Gemini 输入框里让它「创建一个演示准备技能」，下方显示调用了名为 presentation-prep 的技能](seed:g21-skills-in-gemini.png)
*图片来源：[Google 官方博客《Let skills in Gemini tackle your most repetitive tasks》](https://blog.google/products-and-platforms/products/gemini/automate-tasks-with-skills/)*

**创建技能的四种方式**（网页版：侧边栏「设置 → 技能（Skills）」）：

1. **和 Gemini 一起创建（Create with Gemini）**：按对话提示描述需求；
2. **用推荐模板**：在「推荐」里点一个模板，改名称、说明和指令后点「创建」；
3. **手动创建（Create manually）**：填写名称、描述和指令；
4. **上传**：上传一个 SKILL.md 文件，或一个根目录带 SKILL.md 的文件夹 / .zip。技能名必须是全小写、用连字符分隔，例如 `weekly-report`。

也可以直接在对话里说「根据以下要求创建一个技能：……」，Gemini 会把它保存到技能页。

**调用技能**：在对话里输入 `/`（更新后为 `@`）再选技能；已启用的技能，Gemini 会在判断相关时自动使用；一个任务里可以叠加多个技能，比如「写作风格」+「品牌规范」。

**写好一个技能的三条官方建议**：写清楚**什么情况下该用**它；只写这个任务**特有**的要求，保持简短；给出**期望输出的具体示例**。

**目前的限制**：

- 最多同时启用 100 个技能，超出要先停用一些；
- 参考文件只支持纯文本类（.txt、.md、.csv、.json、.py 等）以及 PDF 和图片，不支持 .docx、.xlsx 等二进制格式，总大小不超过 100 MB；需要联网的脚本不支持；
- 技能暂时**不能**和 Canvas、Deep Research、生成视频、生成音乐、引导式学习一起用；GitHub 文件暂不支持；
- 分享技能、从 Google Drive 添加文件等 Gems 原有的功能，官方说「未来几周」会补上。

**想提前把 Gem 手动迁成技能**（帮助中心步骤简化版）：

1. 打开要迁移的 Gem，点编辑，把「知识（Knowledge）」里的文件逐个下载，放进一个和技能同名（全小写、连字符）的文件夹；
2. 新开标签页，进入「设置 → 技能 → 手动创建」，把 Gem 的名称、描述和指令复制过去，点「创建」；
3. 有文件的：在技能页点该技能的「⋮ → 下载」，把解压得到的 SKILL.md 放进第 1 步的文件夹，再用「⋮ → 替换技能」上传整个文件夹。

## 三、Deep Research 怎么用

Deep Research 会先列研究计划，再搜索和阅读大量来源，最后生成带引用的研究报告。使用条件：年满 18 岁并登录 Gemini。

1. 打开 gemini.google.com，在输入框点「+（添加文件）」→「Deep Research」；
2. （可选）再点「+」上传文件或图片作为资料；
3. （可选）点「来源（Sources）」选择资料范围：默认包含 Google 搜索，也可以加入 Gmail、Drive 等（需要先把 Google Workspace 连接到 Gemini）；只想查自己的资料，就取消勾选 Google 搜索；
4. 输入研究问题并发送，Gemini 会先给出研究计划，可以点「修改计划（Edit plan）」调整，确认后点「开始研究（Start research）」；
5. 通常需要 5–10 分钟，复杂的更久；期间可以离开，完成后网页版会在对话旁提示、手机上会推送通知，点「打开（Open）」查看报告。

![2025 年 12 月官方配图：当时 Deep Research 位于输入框「工具（Tools）」菜单中，和 Canvas、生成图片并列（早期界面，现在入口以帮助中心描述的「+」菜单为准）](seed:g21-deep-research-tools-menu.jpg)
*图片来源：[Google 官方博客：Deep Research 可视化报告](https://blog.google/products/gemini/visual-reports/)（视频封面帧）*

![官方配图：选中 Deep Research 后，在「来源」里勾选 Google 搜索、Gmail、Drive、Chat（早期界面）](seed:g21-deep-research-sources.png)
*图片来源：[Google 官方博客：Deep Research 连接 Gmail、Drive 和 Chat](https://blog.google/products-and-platforms/products/gemini/deep-research-workspace-app-integration/)*

**报告生成之后还能做什么**：在右侧 Canvas 面板里点「创建 → 音频概览（Audio Overview）」生成播客式讲解；输入描述生成自定义可视化；点「分享与导出」可以分享、**导出到 Google 文档**或复制全文。Google AI Ultra 用户的报告里还可能直接包含图表、示意图和交互模拟（选了 Gmail、Drive 等来源时不支持）。以后想找回报告，需要开着「保留活动记录」，在侧边栏「最近」里找。

**次数和模型**：帮助中心说明有「每日研究次数」和「同时进行的研究数」两种上限，接近上限时会提示当天还剩几次；Google AI Pro / Ultra 次数更高，也可以用 Pro 模型生成报告，所有用户都能用 Thinking 模型。没有订阅的用户在高峰期可能暂时用不了 Deep Research。

## 四、上传文件的限制

| 项目 | 限制（帮助中心） |
| --- | --- |
| 每条消息文件数 | 最多 10 个（视情况而定），上传文件夹时里面每个文件都算 |
| 单个文件大小 | 视频最大 2 GB，其他文件最大 100 MB |
| 视频总时长 | 5 分钟；Google AI Pro / Ultra 为 1 小时 |
| 音频总时长 | 10 分钟；Google AI Pro / Ultra 为 3 小时 |
| 代码 | 每个对话可加 1 个代码文件夹或 1 个 GitHub 仓库，最多 5000 个文件、100 MB |
| ZIP 压缩包 | 最多 10 个文件、100 MB，不能包含音视频 |
| 上下文窗口 | 无订阅 32k token；AI Plus 128k；AI Pro / Ultra 100 万 token（Deep Think 为 19.2 万） |

上传入口：网页版输入框「+（添加文件）」→「上传文件」；Drive 文件选「从云端硬盘添加」（需开启活动记录并连接 Workspace）；代码选「更多上传 → 导入代码」。上传表格后还可以让 Gemini 直接画图表。

几个常见报错：

- **「Delete data to upload file」**：Gemini 自己的存储空间满了（和 Google Drive 空间无关），到「设置与帮助 → 活动」删除一些旧的 Gemini 活动记录，等几分钟再传；
- **「You've reached your limit for chats with files」**：短时间内上传分析文件的次数到上限了，过一段时间会自动恢复；
- **「Your uploads may be too large for the best results」**：文件太大，回答可能漏掉细节，可以拆成小文件分别上传。

## 五、更多实用技巧

- **看清自己的额度**：Gemini 的用量按计算量算，和提示复杂度、所用模型与功能、对话长度有关，**每 5 小时刷新一次，直到用完每周上限**。在网页版左下角「设置 → 用量限制（Usage Limits）」可以查看。官方给的倍数：AI Plus 是无订阅的 2 倍，AI Pro 是 4 倍，AI Ultra 是 AI Pro 的 5 倍或 20 倍。
- **省额度**：高级模型和更高的思考档位（Extended、Deep Think）消耗更多，日常问题用默认的 Standard 即可；有订阅的用户用完额度后可以继续用 Flash-Lite。
- **能用的地区**：Gemini 网页版的支持国家和地区以 [官方列表](https://support.google.com/gemini/answer/13575153) 为准，列表中「中国大陆」仅标注为 Workspace 可用；手机 App 的可用地区另有说明。请遵守所在地法律和服务条款。

## 常见问题

**Q：Gems 现在还能新建吗？**
截至本文核对日，帮助中心的 Gems 创建步骤仍然有效，个人账号要到 2026 年 11 月才停止支持。但既然很快会转成技能，新的需求建议直接建技能。

**Q：我的 Gems 会丢吗？**
不会。官方说明下线时会自动把 Gems 及其支持的文件转成技能；只有「Gems by Google Labs」不会迁移。

**Q：Deep Research 不见了？**
先看输入框的「+」菜单（帮助中心描述的当前入口）；再确认账号已满 18 岁、已登录。没有订阅的用户在高峰期可能暂时用不了。另外技能目前不能和 Deep Research 一起用。

**Q：Deep Research 每天能用几次？免费能用吗？**
免费用户也能用（帮助中心的功能对比表里所有档位都标注可用），但次数有上限，具体数字官方没有公开；Google AI Pro / Ultra 次数更高。快到上限时 Gemini 会提示当天剩余次数。

## 参考资料

- About the transition from Gems to skills（Gemini 帮助中心）：https://support.google.com/gemini/answer/18560919
- Create & manage skills for Gemini Apps（Gemini 帮助中心）：https://support.google.com/gemini/answer/17094296
- Use Gems in Gemini Apps（Gemini 帮助中心）：https://support.google.com/gemini/answer/15146780
- Use Deep Research in Gemini Apps（Gemini 帮助中心）：https://support.google.com/gemini/answer/15719111
- Upload & analyze files in Gemini Apps（Gemini 帮助中心）：https://support.google.com/gemini/answer/14903178
- Gemini Apps limits & upgrades（Gemini 帮助中心）：https://support.google.com/gemini/answer/16275805
- Gemini 支持的语言和地区（Gemini 帮助中心）：https://support.google.com/gemini/answer/13575153
- Google 博客：Let skills in Gemini tackle your most repetitive tasks（2026-09-30）：https://blog.google/products-and-platforms/products/gemini/automate-tasks-with-skills/
- Google Workspace 管理员文档：About the transition from Gems to skills：https://knowledge.workspace.google.com/admin/generative-ai/gemini-app/about-the-transition-to-skills
- 截图来源：Google 官方博客（Skills 发布、Deep Research 可视化报告、Deep Research 连接 Workspace）
