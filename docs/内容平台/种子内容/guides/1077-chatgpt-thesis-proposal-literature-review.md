---
title: 用 ChatGPT 做论文开题和文献综述：选题、研究问题、找文献线索、注释书目到开题提纲（遵守学术规范）
slug: chatgpt-thesis-proposal-literature-review
products: [chatgpt]
models: []
accountTier: FREE
excerpt: 怎么用 ChatGPT 辅助论文开题和文献综述？按官方研究指南：先要研究提纲，用深度研究找带引用的线索，上传论文做注释书目，让它列出还缺什么。附 6 条可复制指令和引用核对清单，写作与判断由你自己完成。
checkedOn: 2026-10-25
sources:
  - https://openai.com/academy/research
  - https://help.openai.com/en/articles/10500283-deep-research-faq
  - https://help.openai.com/en/articles/11780217-chatgpt-study-mode-faq
  - https://openai.com/academy/prompting/
verify:
  - 官方研究指南的建议：先要研究提纲（子问题、资料策略、评价标准）、对关键论断要求引用并要求资料质量检查、要求「还缺什么」一节、用上传的 PDF 做注释书目和综合；深度研究文章写报告带引用或来源链接，方便核实，可用 Sites > Manage sites 限定网站范围
  - 官方没有专门写开题报告；开题报告的结构（背景、问题、方法、计划）是通行的学术写作常识，本文只作提纲示范，具体格式以学校和导师要求为准
  - 官方学习模式文章写「有成绩的作业请遵守学校、老师或机构的 AI 使用规定」，正文据此提醒；本文不提供代写论文的用法
  - 6 条指令是本站示范，不是官方原话
---

> 本文根据 OpenAI Academy 的《ChatGPT for research》《Prompting》、官方深度研究文章和学习模式文章整理，资料核对于 2026-10-25。**本文讲的是辅助：整理思路、找线索、检查逻辑**，不是替你写论文。学校对 AI 使用有规定的，先按规定来。本站另有两篇相关文章：写作与润色见 [/guides/chatgpt-academic-writing](/guides/chatgpt-academic-writing)，读论文见 [/guides/ai-read-papers-literature-review](/guides/ai-read-papers-literature-review)。

## 适用于谁

- 要做毕业论文开题，没有头绪的人；
- 需要写文献综述，不知道怎么入手的人；
- 搜「chatgpt 写论文指令」的人；
- 担心引用出错、学术不端的人。

## 结论先说

1. **官方的研究思路：先要提纲。** 官方研究指南建议：先让 ChatGPT 给出研究提纲，包括子问题、找资料的策略和评价标准；把一个模糊的问题变成清晰的研究计划和子问题。
2. **关键论断要求引用，并检查资料质量。** 官方建议对关键论断要求引用，准确性重要时，要求做资料质量检查。
3. **要求给出「还缺什么」。** 官方建议加一节「缺失的内容」，列出未知、有争议的地方和数据局限。
4. **深度研究会先给研究计划让你确认，最后给带引用或来源链接的报告**，方便你核实。官方说可以在 **Sites > Manage sites** 里限定它只在你指定的网站里找。
5. **官方有一个文献综述的示例思路：上传多篇论文，要求生成注释书目和综合部分：主题、分歧、最重要的 5 个未解决问题。**
6. **学术规范优先。** 官方学习模式文章写：有成绩的作业请遵守学校、老师或机构的 AI 使用规定。最终稿的文字和判断应由你自己完成。
7. 想用深度研究和更多上传，可以看 [/chongzhi/chatgpt-plus](/chongzhi/chatgpt-plus)，用量见 [/guides/chatgpt-plus-usage-limits-overview](/guides/chatgpt-plus-usage-limits-overview)。

![开题和文献综述的 6 步流程：缩小选题、研究问题、找文献线索、注释书目、写综述、开题提纲](seed:g1077-thesis-steps.png)
*图：本站根据 [OpenAI Academy：ChatGPT for research](https://openai.com/academy/research) 与 [深度研究帮助文章](https://help.openai.com/en/articles/10500283-deep-research-faq) 整理的示意图*

## 一、6 条可以直接复制的指令

方括号里是要你自己填的内容。**这些指令是本站示范，不是官方原话。**

### 1. 缩小选题

> 我是 [专业] 的 [本科/硕士] 学生，对 [兴趣方向] 感兴趣，论文需要 [字数/时长] 完成，数据和资料条件是 [条件]。请给出 3 个可行的研究方向，每个写：研究问题、需要的资料、最大的风险。先不要替我选，列出你的判断依据。

### 2. 把选题拆成研究提纲

> 我的初步题目是「[题目]」。请先不要写内容，只给研究提纲：①核心研究问题；②3 到 5 个子问题；③找文献的策略（关键词、数据库类型、时间范围）；④判断一篇文献是否可靠的标准。

### 3. 做一次带引用的文献调查（深度研究）

> 请就「[研究问题]」做文献调查。优先使用学术期刊、学位论文、研究机构报告等可信来源。输出：主要研究流派、代表性观点、各自的证据、有争议的地方，以及目前研究缺口。每个关键论断后给出来源链接。最后单独列一节「资料不足或可能不可靠的地方」。

打开深度研究的方法：在提示框输入 **/Deepresearch**，或点 **+** 菜单里的 Deep research，见 [/guides/chatgpt-deep-research](/guides/chatgpt-deep-research)。

### 4. 论文 PDF 做注释书目

> 我上传了 [数量] 篇论文。请为每篇做注释书目：研究问题、方法、主要结论、局限（各一两句话）；然后做综合：共同的主题、观点的分歧、最重要的 5 个未解决问题。每条结论请标明出自哪一篇，哪一部分。

### 5. 检查我自己写的综述

> 下面是我自己写的文献综述草稿：[粘贴]。请不要改写。只做三件事：指出逻辑断裂的地方；指出缺乏文献支撑的论断；列出「还缺什么」，包括可能被忽略的重要观点。

### 6. 整理开题报告提纲

> 根据我们前面讨论的研究问题和文献缺口，帮我列出开题报告的提纲：研究背景与意义、文献综述的结构、研究问题与假设、研究方法与数据、研究计划与时间表、预期贡献与局限。每一项只写要点和我需要补充的内容，不要替我编具体的数据和结论。

## 二、第二步：引用和学术规范

![引用和学术规范核对：打开原文核对、作者年份期刊、数据一致、判断自己写、遵守学校规定、能向导师解释](seed:g1077-thesis-check.png)
*图：本站根据 [OpenAI 帮助中心：Deep research in ChatGPT](https://help.openai.com/en/articles/10500283-deep-research-faq) 与 [Using study mode in ChatGPT](https://help.openai.com/en/articles/11780217-chatgpt-study-mode-faq) 的原则整理的示意图*

- **逐条打开原文。** 官方说深度研究的报告带引用或来源链接，是为了让你核实；不要只看它的转述；
- **PDF 要自己读关键部分。** 注释书目是帮你筛选的，不是替代阅读；
- **文字自己写。** 综述和开题的最终文字应出自你自己的理解；
- **按要求说明用了 AI。** 不同学校要求不同，以学校和导师的规定为准；
- **用 AI 检测的担心：** 见 [/guides/chatgpt-writing-detected-ai-detector](/guides/chatgpt-writing-detected-ai-detector)。

## 三、其他相关用法

- **长文档读不下去：** 见 [/guides/chatgpt-summarize-pdf](/guides/chatgpt-summarize-pdf)；
- **一边学一边问：** 用学习模式，见 [/guides/chatgpt-study-mode](/guides/chatgpt-study-mode)；
- **英文文献翻译：** 见 [/guides/chatgpt-translation](/guides/chatgpt-translation)；
- **把整个课题放在一个地方：** 用项目，见 [/guides/chatgpt-projects](/guides/chatgpt-projects)。

## 常见问题

**Q：ChatGPT 给的参考文献可信吗？**
必须逐条核对。官方让你要求引用并检查资料质量，目的就是方便核实；没有打开原文核实过的，不要放进你的论文。

**Q：能让它直接写开题报告吗？**
本文不建议，也不提供这种用法。开题报告是你对研究的判断，应由你自己写；它可以帮你理提纲、查逻辑。

**Q：中文文献能用吗？**
可以让它给出检索关键词和思路，但中文文献数据库的内容，请到相应数据库里检索和核对。

**Q：和写论文润色有什么区别？**
本文讲开题和综述阶段，润色见 [/guides/chatgpt-academic-writing](/guides/chatgpt-academic-writing)。

## 参考资料

- OpenAI Academy：ChatGPT for research — https://openai.com/academy/research
- OpenAI 帮助中心：Deep research in ChatGPT — https://help.openai.com/en/articles/10500283-deep-research-faq
- OpenAI 帮助中心：Using study mode in ChatGPT — https://help.openai.com/en/articles/11780217-chatgpt-study-mode-faq
- OpenAI Academy：Prompting — https://openai.com/academy/prompting/
