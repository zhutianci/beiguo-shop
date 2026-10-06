---
title: 雅思作文批改提示词（按官方四项评分标准估分 + 逐段修改，评分仅供参考）
slug: ielts-writing-feedback
model: any-llm
topics: [learning]
needsRefImage: false
useCase: 备考雅思写作时用：贴上题目和自己的 Task 1 或 Task 2 作文，按 Task Achievement/Response、Coherence and Cohesion、Lexical Resource、Grammatical Range and Accuracy 四项逐项点评，指出卡分点并给出改写示范。
prompt: |
  Role: You are an experienced IELTS writing tutor who knows the public IELTS Writing Band Descriptors well. Give feedback in Chinese, keep all quoted and corrected sentences in English.

  Input
  - 考试类型：[学术类/培训类]，任务：[Task 1/Task 2]
  - 题目原文：
    [题目原文]
  - 我的作文（[字数] 词，用时 [用时] 分钟）：
    [我的作文]
  - 目标分数：[目标分数]

  Steps
  1. 字数与切题检查：Task 1 要求至少 150 词、Task 2 至少 250 词，不足要明确提醒；判断是否回答了题目的每一部分（Task 2 注意题型：观点类、讨论双方、利弊、问题与解决、双问题），有没有偏题或只答了一半。
  2. 四项逐项评估。每一项都写：估计分数（整数分）、对照评分描述说明「为什么不是高一分」、从原文中引用 1–2 句作证据：
     - Task 1 用 Task Achievement（是否有清晰的 overview、关键特征和数据是否选得准、比较是否到位）；Task 2 用 Task Response（立场是否清晰贯穿全文、论点是否展开并有支撑）；
     - Coherence and Cohesion：分段、每段中心句、指代与衔接词是否自然，有没有机械堆砌 Firstly / Moreover；
     - Lexical Resource：词汇范围与准确度、搭配错误、拼写、是否有生硬背诵的大词；
     - Grammatical Range and Accuracy：复杂句的种类与准确率、无错误句子的占比。
  3. 逐段修改：表格列为 原句 | 问题 | 改写 | 涉及评分项。只改真正有问题的句子，改写保持我原来的意思和大致难度，不要整段替换成范文。
  4. 提分优先级：如果只能改进 3 件事，按对分数的影响排序。
  5. 最后给出一个「Band 7+ 参考改写」只改写我写得最弱的一段，供对比学习。

  Rules
  - 分数只是基于公开评分标准的估计，不代表官方考官评分，开头写明这一点。
  - 不要为了鼓励而抬高分数，也不要无根据地压分；证据不足时说明不确定。
negativePrompt: null
source: null
verify:
  - 核对四项评分标准名称与官方 IELTS Writing Band Descriptors（2023 年 5 月更新的公开版本）一致
  - 核对写作总分计算方式（Task 2 权重为 Task 1 的两倍）及总分取整规则，以 IELTS 官方说明为准，本模板未写取整规则
  - 用一篇已知官方分数的范文测试，看估分偏差
---
**怎么填变量**：[题目原文] 一定要贴全，Task 2 很多人丢分是因为题目问了两个问题只答了一个，模型需要题目原文才能判断 Task Response。Task 1 是图表题的话，把图表里的关键数据也用文字写出来，或者用支持图片的模型直接上传图表截图。[用时] 填真实用时，模型会据此判断你是否需要练速度。

**常见坑**：
- AI 估分普遍有偏差，同一篇作文多问几次结果可能不同。估分只用来找问题，别拿来预测考试成绩。
- 模型很喜欢把你的作文改成满篇高级词汇，这反而可能影响 Lexical Resource 中「准确、自然」的部分。要求它「改写难度不超过我原文一级」。
- 不要用 AI 改好的版本去背诵套用，考官对模板化语言很敏感。

**迭代追问**：改完后自己重写一遍再贴回去：「这是我根据反馈重写的版本，看哪些问题解决了、哪些还在」。积累 3–5 篇后可以问「总结我这几篇作文反复出现的错误类型」。

### 示例输出

> 示例，仅供参考（Task 2，讨论双方观点题）

**说明**：以下分数是依据公开评分标准的估计，不代表官方评分。

| 评分项 | 估分 | 为什么不是高一分 |
|---|---|---|
| Task Response | 6 | 只在结尾给出自己的立场，正文两段都在复述他人观点 |
| Coherence and Cohesion | 6 | 第 3 段连用 Moreover、Furthermore、In addition，衔接机械 |

| 原句 | 问题 | 改写 | 评分项 |
|---|---|---|---|
| Nowadays, more and more people think that... | 开头套话，未进入题目 | Whether university education should be free is a divisive question. | TR / LR |
