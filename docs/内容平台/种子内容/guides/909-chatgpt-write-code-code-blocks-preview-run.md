---
title: 用 ChatGPT 写代码怎么用：代码块的复制、编辑、预览、运行 Python，报错了怎么办
slug: chatgpt-write-code-code-blocks-preview-run
products: [chatgpt, codex]
models: []
accountTier: FREE
excerpt: 用 ChatGPT 写代码：代码放进代码块，可复制、编辑；HTML、React、SVG、Mermaid 点 Preview 预览，支持的 Python 点 Run 运行。讲各按钮用法、没有按钮怎么办、何时换 Codex。
checkedOn: 2026-10-15
sources:
  - https://help.openai.com/en/articles/20001246-working-with-writing-blocks-and-code-blocks-in-chatgpt
  - https://help.openai.com/en/articles/8437071-data-analysis-with-chatgpt
  - https://help.openai.com/en/articles/11145903-connecting-github-to-chatgpt
verify:
  - 官方说代码块的各项操作因套餐、设备、工作区设置、模型和推送进度而异，不是每个对话都有；本文没有逐一核对各个套餐和 App 里分别有哪些按钮
  - 官方只说「支持的 Python 代码块」有 Run，没有列出具体支持哪些库、运行多久、有没有资源上限；本文不写这些细节
  - 官方文章没有界面截图，Code、Preview、Run 等按钮在手机 App 和网页里的位置以实际界面为准
  - 「怎么把需求说清楚」「出错后把完整报错贴回去」是本站的使用建议，不是官方文章原文；已在正文标注
  - 官方没有说 Codex 和聊天里的代码块「分工」的具体标准，「大项目改用 Codex」依据的是官方 GitHub 连接文章里「生成、修改并推送代码请用 Codex」那一句
---

> 本文根据 OpenAI 帮助中心《Working with writing blocks and code blocks in ChatGPT》《Data analysis with ChatGPT》《Connecting GitHub to ChatGPT》整理，资料核对于 2026-10-15。这几篇官方文章没有界面截图，配图为本站整理的示意图。ChatGPT 的整体用法见 [/guides/chatgpt-how-to-use-beginner](/guides/chatgpt-how-to-use-beginner)，本文只讲「写代码」这件事。

## 适用于谁

- 想让 ChatGPT 帮忙写脚本、网页、小工具，但不知道代码怎么复制、怎么跑起来的人；
- 看到别人的对话里有「Preview」「Run」按钮，自己这里却没有的人；
- 分不清「在聊天里写代码」「上传表格做数据分析」「用 Codex」该用哪个的人；
- 代码运行报错，不知道该怎么让 ChatGPT 接着改的人。

## 结论先说

1. **ChatGPT 通常把代码放进「代码块」**：官方说，代码块把代码和回答的其余部分分开，方便你读、复制、编辑、预览或运行。
2. **代码块上能做什么，因情况而异**：官方列的是「可以」而不是「一定有」，包括复制代码、看语言标签（Python、JavaScript、HTML 等）、直接编辑、让 ChatGPT 改、全屏打开、在 Code 和 Preview 之间切换、运行支持的 Python。具体有哪些，取决于代码块类型、设备、套餐、工作区设置、模型和推送进度。
3. **能预览的有五类**：HTML 页面、React 组件、SVG 图片、Mermaid 图、Vega 或 Vega-Lite 图表，点 **Preview**。没出现 Preview，说明这个代码块不支持预览。
4. **能运行的是「支持的 Python」**：点 **Run**，打开代码工作区，在控制台看输出或报错，运行中的代码可以停止。
5. **预览和运行都在沙盒里**：如果预览需要外部资源，ChatGPT 会先征求许可；工作区管理员也可以限制代码执行和联网。
6. **要改整个项目、直接推送到 GitHub，用 Codex**：官方说，ChatGPT 里的 GitHub 应用只能读取仓库，生成、修改并直接推送代码要用 Codex。

![用 ChatGPT 写代码从提问到运行的 5 步：说清需求、代码块、预览、运行 Python、把完整报错贴回去](seed:g909-code-steps.png)
*图：本站根据 [OpenAI 帮助中心：Working with writing blocks and code blocks in ChatGPT](https://help.openai.com/en/articles/20001246-working-with-writing-blocks-and-code-blocks-in-chatgpt) 整理的示意图*

## 一、先把需求说具体（本站建议）

官方文章讲的是代码块怎么用，没有讲怎么提需求。下面是本站的使用建议，不是官方原文，但对结果影响很大：

- **说清语言和运行环境**：比如「用 Python 3 写」「只用标准库」「做成一个单文件 HTML」。
- **给输入输出的样例**：「输入是一个 CSV，第一列是日期，输出按月汇总」，比「帮我处理数据」有用得多。
- **写明限制条件**：不能联网、不能装第三方库、要兼容某个版本，一次写清楚，省得来回改。
- **一次只要一件事**：先让它写出能跑的最小版本，再一轮一轮加功能。

想要能直接看到效果的小东西（一个网页、一张图表），在需求里明确说「做成 HTML」或「用 Mermaid 画」，就更容易得到可以点 Preview 的代码块。

## 二、代码块上的按钮怎么用

官方列出的可用操作如下（再次强调，不一定每个都有）：

| 你想做的事 | 官方说的操作 |
| --- | --- |
| 把代码拿去用 | 点复制 |
| 看这是什么语言 | 代码块上有语言标签，如 Python、JavaScript、HTML |
| 改几个地方 | 对支持的代码块，直接在块里编辑 |
| 让它帮你改 | 告诉 ChatGPT 怎么改，它来修改代码 |
| 看得清楚些 | 对支持的代码块，全屏打开 |
| 看效果 | 对支持预览的块，在 **Code** 和 **Preview** 之间切换 |
| 跑一下 | 对支持的 Python 块，点 **Run**，看控制台输出 |

### 保存编辑

官方说，对支持的代码块所做的编辑，会**过一小会儿**随对话一起保存，这样你接着提问时，ChatGPT 能用你改过的最新版本。**临时对话（Temporary Chat）里，对话结束后编辑可能不会保留**，临时对话的说明见 [/guides/chatgpt-temporary-chat](/guides/chatgpt-temporary-chat)。

## 三、预览：HTML、React、SVG、Mermaid、Vega 图表

官方说，对支持的代码块点 **Preview**，结果就显示在 ChatGPT 里面。可能支持预览的内容有：

- HTML 页面；
- React 组件；
- SVG 图片；
- Mermaid 图（流程图、思维导图这类文本画图的写法）；
- Vega 或 Vega-Lite 图表。

没有 Preview 按钮，就是这个代码块不支持预览，比如一段普通的 Java 或 C 代码。这时代码仍然可以复制，拿到自己的电脑上运行。

想用文字生成流程图、思维导图，可以看 [/guides/chatgpt-mind-map-mermaid](/guides/chatgpt-mind-map-mermaid) 和 [/guides/chatgpt-flowchart-charts-how-to](/guides/chatgpt-flowchart-charts-how-to)。需要预览里加载外部资源时，官方说 ChatGPT 可能先问你的许可再连接。

## 四、运行：支持的 Python 代码

官方说，对支持的 Python 代码块，点 **Run** 会打开一个**代码工作区**，输出和报错都显示在**控制台**里；代码还在运行时，你可以**停止**它。

几点要留意：

- **只有「支持的」Python 块有 Run**。其他语言官方没有说在聊天里能运行，需要运行就复制出去自己跑。
- **沙盒环境**：官方说代码预览和执行都在沙盒环境里进行，管理员还可以控制工作区里能不能执行代码、能不能联网。
- **上传文件做数据分析是另一条路**：官方说对一些数据分析任务，ChatGPT 会在一个有状态的 Jupyter 笔记本环境里写并运行 Python，可以用会话里提供的文件，并在合适时把 pandas 表格显示成可交互表格。这个环境**不能发起外部网络请求或 API 调用**，要用外部数据，请先上传文件或连接可用的数据源。更多见 [/guides/chatgpt-excel-data-analysis](/guides/chatgpt-excel-data-analysis)。
- **用到 Python 做分析时，要自己审查**：官方说，依赖结果之前，先检查生成的代码、输出和假设；结果取决于具体方法时，让 ChatGPT 展示或调整那个方法。

## 五、报错了怎么办

官方文章没有专门写调试流程，下面是本站的通用做法（本站建议）：

1. **把完整的报错信息原样贴回去**，而不是只说「运行不了」。如果在 Run 的控制台里出了错，复制控制台里的内容。
2. **说明你是怎么运行的**：什么系统、什么版本、命令是什么。
3. **让它在原来的代码基础上改**，并说明哪些地方不要动，避免每次都重写一遍。
4. **改完再跑一遍**，仍然出错就再贴新的报错，不要自己在几个版本之间来回拼。
5. **输出结果和预期不一样但没有报错**，就给一个具体的反例：「输入 A，我期望 B，实际得到 C」。

如果聊天越拉越长、回答变慢，可以新开一个对话，把当前最新的代码贴进去再继续，见 [/guides/chatgpt-slow-laggy-stuck-long-chat](/guides/chatgpt-slow-laggy-stuck-long-chat)。

## 六、几种写代码的方式怎么选

![写代码的几种方式怎么选：聊天里的代码块、上传文件做数据分析、GitHub 应用、Codex](seed:g909-code-which-way.png)
*图：本站根据 [OpenAI 帮助中心：Working with writing blocks and code blocks in ChatGPT](https://help.openai.com/en/articles/20001246-working-with-writing-blocks-and-code-blocks-in-chatgpt)、[Data analysis with ChatGPT](https://help.openai.com/en/articles/8437071-data-analysis-with-chatgpt) 与 [Connecting GitHub to ChatGPT](https://help.openai.com/en/articles/11145903-connecting-github-to-chatgpt) 整理的示意图*

- **几十行的小脚本、一个网页、一张图表**：直接在聊天里用代码块，复制、编辑、预览，Python 可以点 Run。
- **手头有表格，要计算或画图**：上传文件，让 ChatGPT 做数据分析，它会写并运行 Python，你再审查代码。
- **想让它看你的 GitHub 仓库**：连接 GitHub 应用，只能读取和分析，不能推送，步骤见 [/guides/chatgpt-github-connect](/guides/chatgpt-github-connect)。
- **要改整个项目、跑测试、提交修改**：用 Codex，官方说生成、修改并直接推送代码要用它，入门见 [/guides/codex-getting-started](/guides/codex-getting-started)；它和 ChatGPT 工作模式的关系见 [/guides/chatgpt-work-vs-codex](/guides/chatgpt-work-vs-codex)。

## 七、为什么我没有 Preview 和 Run 按钮

按官方的说法，可以逐项排查：

1. **代码块类型不支持**：只有 HTML、React、SVG、Mermaid、Vega 这几类可能有 Preview；只有支持的 Python 才有 Run。
2. **你的设备、套餐或模型暂时没有**：官方说可用的操作随套餐、设备、模型和推送进度而不同。可以换网页版或更新 App 再看，套餐区别见 [/guides/chatgpt-plans-comparison](/guides/chatgpt-plans-comparison)。
3. **工作区设置**：工作区账号里，管理员可能关了代码执行或联网，去问管理员。
4. **新功能还没推到你的账号**：看一眼发布说明，见 [/guides/chatgpt-release-notes-latest-model](/guides/chatgpt-release-notes-latest-model)。

## 常见问题

**Q：ChatGPT 写的代码一定能直接运行吗？**
不一定。官方在数据分析文章里就提醒：依赖结果前要审查生成的代码、输出和假设。重要的代码自己看一遍、先在测试数据上跑。

**Q：我在代码块里直接改了代码，ChatGPT 知道吗？**
官方说，对支持的代码块，编辑会过一小会儿随对话保存，之后你追问时 ChatGPT 能用最新版本。临时对话里可能不保留。

**Q：Run 能联网下载东西吗？**
官方说预览和执行在沙盒里，需要外部资源时 ChatGPT 可能先问你许可，管理员也能限制联网；对数据分析环境，官方明确说不能发起外部网络请求。需要外部数据就先上传。

**Q：写代码要用哪个模型？**
本文不推荐具体模型。可选的模型和思考档位见 [/guides/chatgpt-model-picker-thinking](/guides/chatgpt-model-picker-thinking)，Codex 的用量见 [/guides/codex-usage-limits](/guides/codex-usage-limits)。

**Q：Canvas 和代码块是一回事吗？**
官方的发布说明里提到过 canvas 与代码块相关的调整，但两者的关系本文没有逐条核对，Canvas 本身的用法见 [/guides/chatgpt-canvas](/guides/chatgpt-canvas)。

**Q：免费账号能用吗？**
官方只说可用操作因套餐而异，没有逐个套餐列出。免费版的限制见 [/guides/chatgpt-free-plan-limits](/guides/chatgpt-free-plan-limits)；想开通 ChatGPT Plus，可以看 [/chongzhi/chatgpt-plus](/chongzhi/chatgpt-plus)。

## 参考资料

- OpenAI 帮助中心：Working with writing blocks and code blocks in ChatGPT — https://help.openai.com/en/articles/20001246-working-with-writing-blocks-and-code-blocks-in-chatgpt
- OpenAI 帮助中心：Data analysis with ChatGPT — https://help.openai.com/en/articles/8437071-data-analysis-with-chatgpt
- OpenAI 帮助中心：Connecting GitHub to ChatGPT — https://help.openai.com/en/articles/11145903-connecting-github-to-chatgpt
