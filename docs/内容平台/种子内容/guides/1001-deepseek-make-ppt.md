---
title: DeepSeek 能做 PPT 吗：大纲、逐页内容怎么做，.pptx 文件靠什么生成
slug: deepseek-make-ppt
products: [ai-tools]
models: [deepseek]
accountTier: OTHER
excerpt: DeepSeek 能做 PPT 吗？按官方资料（2026-10-24 查询），模型本身只输出文字，大纲和逐页内容它能写，成品 .pptx 要靠别的工具生成。本文给出四步路线、可直接用的提示词和几种做法的取舍。
checkedOn: 2026-10-24
sources:
  - https://api-docs.deepseek.com/zh-cn/news/news260424
  - https://api-docs.deepseek.com/zh-cn/api/list-models
  - https://www.deepseek.com/download/
  - https://api-docs.deepseek.com/zh-cn/prompt-library
verify:
  - 官方 2026-04-24 的 V4 预览版公告写到「在代码任务、文档生成任务等方面表现均有提升」，并展示了 V4-Pro 在某 Agent 框架下生成的 PPT 内页示例；公告没有说是哪个框架，也没有说网页版能直接导出 pptx
  - 官方下载页写 DeepSeek Harness 桌面端「支持后台运行和本地文件读写」，并注明当前版本仍在持续迭代；本文没有测试它能否生成 pptx，只说明它具备读写本地文件的前提
  - 官方文档中没有找到网页版 / App 对话页导出 PPT 的说明，本文按「没写」处理，不断言一定没有；界面功能以官方页面为准
---

> 本文根据 DeepSeek 官方新闻、API 文档和下载页整理，资料核对于 2026-10-24。DeepSeek 的网页版和客户端更新很快，功能入口以官方页面为准。图为本站整理的示意图。

## 适用于谁

- 搜「deepseek能做ppt吗」的人；
- 老板要明天汇报、想让 AI 先出一版的上班族和学生；
- 试过让 DeepSeek「做个 PPT」，结果只得到一堆文字的人。

## 结论先说

1. **能写 PPT 的内容，不一定能直接给你 .pptx 文件**。官方文档里，`deepseek-flash` 和 `deepseek-v4-pro` 的输出类型都只有文本（见 [/guides/deepseek-generate-image](/guides/deepseek-generate-image) 里对「获取模型列表」接口的说明）。大纲、每页要点、讲稿、配色建议，它都可以写；文件要靠别的软件生成。
2. **官方展示过「生成 PPT」的能力**，但是放在 Agent 场景里：2026-04-24 的 V4 预览版公告说，V4 针对 Claude Code、OpenClaw、OpenCode、CodeBuddy 等 Agent 产品做了适配，「代码任务、文档生成任务」等表现有提升，并展示了 V4-Pro 在某 Agent 框架下生成的 PPT 内页。也就是说，需要一个能写文件的外层工具，模型负责决定内容和版式。
3. **官方文档没有写对话页能直接导出 pptx**。如果你在网页版里没看到导出按钮，不必怀疑自己，按下面的路线走即可。

![用 DeepSeek 做 PPT 的 4 步路线](seed:g1001-deepseek-ppt-steps.png)
*图：本站根据 [DeepSeek 官方 V4 预览版公告](https://api-docs.deepseek.com/zh-cn/news/news260424) 整理的示意图*

## 一、第一步：让 DeepSeek 出大纲

给模型的信息越具体，大纲越能用。至少说清四件事：**主题、听众、页数、希望听众看完做什么**。

```
我要做一份 10 页的汇报 PPT：《下半年用户增长复盘》。
听众是部门负责人，每页讲一个观点，总时长 8 分钟。
请先给出大纲：每页写「页标题 + 一句话结论 + 3 个要点」。
不要编造具体数字，需要数据的地方用【待补：xxx】标出来。
```

最后一句很重要：**让它标出需要你补的数据，而不是自己编**。大模型写汇报时很容易顺手补一个「增长 35%」，这种数字没有依据，直接放进 PPT 会出事。通用的提示词写法见 [/guides/how-to-write-prompts](/guides/how-to-write-prompts)。

## 二、第二步：逐页补内容

大纲确认后，再让它逐页展开。一次一页或几页，比一次生成 10 页更容易控制：

```
按大纲写第 3 页的页面文字：标题不超过 15 个字，正文 3 条，每条不超过 25 个字。
另外写一段 40 秒的讲稿，以及一句话说明这页适合配什么图表。
```

如果有自己的数据，把原始数据贴给它，让它只做归纳，不做补充。长表格怎么分段喂给模型，见 [/guides/long-document-prompting-tips](/guides/long-document-prompting-tips)。

## 三、第三步：选一个生成文件的工具

文字有了，下一步是把它变成 .pptx。常见的三种做法：

| 做法 | 适合谁 | 说明 |
| --- | --- | --- |
| 复制进 PowerPoint / WPS 自己排版 | 页数不多、要求精细的人 | 最稳，版式完全自己控制 |
| 用专门的 AI 做 PPT 产品 | 想一键出版式的人 | 把大纲粘进去生成模板，本站有 [/guides/kimi-ppt-assistant](/guides/kimi-ppt-assistant) 和各路线对比 [/guides/ai-make-ppt-routes-compare](/guides/ai-make-ppt-routes-compare) |
| 用带本地文件读写的 Agent 工具 | 会用命令行 / 桌面工具的人 | 官方下载页写明 DeepSeek Harness 桌面端支持后台运行和本地文件读写，当前版本仍在迭代 |

官方文档里有教程的 Agent 工具接入方法，Claude Code 见 [/guides/deepseek-claude-code-setup](/guides/deepseek-claude-code-setup)。用这类工具生成 pptx，本质上是让它写脚本调用 PPT 库来生成文件，生成后务必自己打开检查。

![做 PPT 的需求，对应哪种做法](seed:g1001-deepseek-ppt-decide.png)
*图：本站根据 [DeepSeek 官方下载页](https://www.deepseek.com/download/) 与公告整理的示意图*

## 四、第四步：人工检查

不管用哪种方式，导出后都要过一遍：

- **数据和引用**：每个数字能追到原始来源吗？「待补」是否都补上了？
- **事实**：模型可能把相似的事物混淆，专有名词、日期、公司名要自己核对；
- **版式**：文字有没有溢出、字体有没有缺失、图表是否清晰；
- **逻辑**：每页的结论连起来能不能讲完一个故事。

## 常见问题

**Q：网页版上传一份文档，能让它直接做成 PPT 吗？**
上传文件后它可以读文档内容、写出每页文字（上传的格式与限制见 [/guides/deepseek-upload-file-image](/guides/deepseek-upload-file-image)），但官方没有写它会返回 pptx 文件，请用上面第三步的方法生成文件。

**Q：做出来的 PPT 配图怎么办？**
DeepSeek 不能生成图片。可以让它写每页的配图说明或生图提示词，再到生图工具里出图；图表用表格软件做更准确。

**Q：想用 ChatGPT 或 Claude 做 PPT 呢？**
本站有对应教程：[/guides/chatgpt-make-ppt-prompts](/guides/chatgpt-make-ppt-prompts)、[/guides/claude-make-ppt-slides](/guides/claude-make-ppt-slides)。需要开通 ChatGPT 会员可看 [/chongzhi/chatgpt-plus](/chongzhi/chatgpt-plus)。

**Q：DeepSeek 网页版怎么用？**
见 [/guides/deepseek-how-to-use](/guides/deepseek-how-to-use)。

## 参考资料

- DeepSeek API 文档：DeepSeek-V4 预览版发布（2026-04-24）— https://api-docs.deepseek.com/zh-cn/news/news260424
- DeepSeek API 文档：获取模型列表 — https://api-docs.deepseek.com/zh-cn/api/list-models
- DeepSeek 官网：应用下载（Harness 桌面端）— https://www.deepseek.com/download/
- DeepSeek API 文档：提示库 — https://api-docs.deepseek.com/zh-cn/prompt-library
