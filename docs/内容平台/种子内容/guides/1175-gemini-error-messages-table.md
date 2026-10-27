---
title: Gemini 常见报错原文对照表：Can't access this service、Something went wrong、Delete data to upload file 等一次看清
slug: gemini-error-messages-table
products: [gemini]
models: []
accountTier: FREE
excerpt: Gemini 报错的原文各不相同，处理方向也不同。本文把官方帮助中心写明的提示原文汇成对照表：账号访问、上传文件、限额，各说明含义并链到详细文章。官方没有逐条解释的地方也会写明。
checkedOn: 2026-10-27
sources:
  - https://support.google.com/gemini/answer/13278668
  - https://support.google.com/gemini/answer/14903178
  - https://support.google.com/gemini/answer/16275805
  - https://support.google.com/gemini/answer/13275746
verify:
  - 官方帮助中心只公布了少数几条提示的含义，括号里的数字（例如出了点问题后面的编号）没有公布含义，本文不猜测
  - 对照表是本站按官方页面整理的索引，不是官方统一的报错大全
  - 提示原文的英文以帮助中心当天的写法为准，中文界面显示的文字可能略有不同
---

> 本文根据 Gemini Apps 帮助中心整理，资料核对于 2026-10-27。**官方没有一份统一的 Gemini 报错大全**，只在登录、上传文件、用量限制几个页面里写明了少数提示的含义，本文把它们汇成一张表。官方没写的，本文也没有编。配图为本站整理的示意图，不是网页截图。

## 适用于谁

- Gemini 弹出一条提示，想知道它是什么意思、该读哪篇的人；
- 想先对照一遍，再决定从哪里排查的人。

## 结论先说

1. **先分时机**：打开或登录时就报错，多半是账号资格；能进去、发消息才报错，看状态页、额度和浏览器；只在上传时报错，看上传限制和存储。
2. **官方明确写了含义的提示只有几条**：`Can't access this service`、`Something went wrong`（登录阶段）、`Delete data to upload file`、`You've reached your limit for chats with files`、`Your uploads may be too large for the best results`。
3. **括号里的数字没有公布含义。** 例如「出了点问题 (1152)」，官方没有解释，别信网上的各种说法。
4. **都排除了就发送反馈**：在网页版点 **Settings & help**，再点 **Send feedback**，输入问题，可以附截图，最后点 **Send**。

![Gemini 常见提示原文对照](seed:g1175-error-compare.png)
*图：本站根据 [Gemini Apps 帮助中心](https://support.google.com/gemini/answer/13278668) 整理的示意图*

## 一、登录或访问阶段

帮助中心《What you need to sign in to Gemini Apps》写了两条：

- **Can't access this service**：目前可以用的是自己管理的个人谷歌账号，或管理员已开通 Gemini 的工作、学校账号。个人或学校账号须年满 13 岁（或所在国家规定的年龄），工作账号须年满 18 岁。由 Family Link 管理的账号仍不能访问网页版。详见 [/guides/gemini-cant-access-this-service-account](/guides/gemini-cant-access-this-service-account)。
- **Something went wrong**：在访问或登录网页版时看到它，说明账号此刻无法访问，原因可能包括所在地、年龄、账号类型等，可以稍后再试。官方还说明，会用信号和数据核实账号是否有持续的无滥用记录。详见 [/guides/gemini-something-went-wrong-error](/guides/gemini-something-went-wrong-error)。

## 二、上传文件时

帮助中心《Upload & analyze files in Gemini Apps》的三条：

- **Delete data to upload file**：Gemini 对聊天和上传文件有自己的存储上限，与云端硬盘或 Workspace 的存储无关，满了就不能再传，要先清理；
- **You've reached your limit for chats with files**：上传和分析文件有滚动限额，过一段时间会重置；
- **Your uploads may be too large for the best results**：文件太大时回答可能漏掉前后的联系或细节。

完整说明见 [/guides/gemini-cannot-upload-files-images](/guides/gemini-cannot-upload-files-images)。

## 三、额度和长对话

官方说明：使用限额按计算量计，会考虑提示的复杂度、所用模型和功能，以及对话长度，每 5 小时刷新，另有每周上限。有 Google AI 方案的用户用完限额后，对话会继续用 Flash-Lite。额度怎么看见 [/guides/gemini-usage-limits-check-reset](/guides/gemini-usage-limits-check-reset)；回答中途断开见 [/guides/gemini-response-stopped-interrupted](/guides/gemini-response-stopped-interrupted)。

## 四、对照：看到什么，先做什么

![Gemini 报错先看这张表](seed:g1175-error-decide.png)
*图：本站根据 Gemini Apps 帮助中心整理的示意图*

## 常见问题

**Q：官方状态页有没有 Gemini 的故障信息？**
有，Workspace 状态页列有 Gemini，开发者另看 AI Studio 状态页，见 [/guides/gemini-down-check-status-page](/guides/gemini-down-check-status-page)。

**Q：一直转圈没有报错怎么办？**
见 [/guides/gemini-keeps-loading-no-response](/guides/gemini-keeps-loading-no-response)。

**Q：想要更高的额度？**
套餐区别见 [/guides/gemini-plans-free-plus-pro-ultra](/guides/gemini-plans-free-plus-pro-ultra)。

## 参考资料

- Gemini Apps 帮助中心：What you need to sign in to Gemini Apps — https://support.google.com/gemini/answer/13278668
- Gemini Apps 帮助中心：Upload & analyze files in Gemini Apps — https://support.google.com/gemini/answer/14903178
- Gemini Apps 帮助中心：Gemini Apps limits & feature availability — https://support.google.com/gemini/answer/16275805
- Gemini Apps 帮助中心：Send feedback or report a problem — https://support.google.com/gemini/answer/13275746
