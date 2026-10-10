---
title: 用 AI 学英语、练口语：语音模式怎么设置成陪练，以及一套每天 20 分钟的练习流程
slug: ai-english-speaking-practice
products: [chatgpt, claude]
models: []
accountTier: FREE
excerpt: AI 口语陪练怎么设置？按官方文档讲清 ChatGPT 语音对话与 Claude 语音模式的入口、每日上限和语言设置，给出可复制的「陪练指令」，以及热身、情景对话、纠错复盘、背诵巩固四段式的每日 20 分钟流程，和用学习模式、闪卡做复习的方法。
checkedOn: 2026-10-11
sources:
  - https://help.openai.com/en/articles/20001274-chatgpt-voice
  - https://help.openai.com/en/articles/11780217-using-study-mode-in-chatgpt
  - https://support.claude.com/en/articles/11101966-use-voice-mode
  - https://help.openai.com/en/articles/10169521-projects-in-chatgpt
  - https://x.ai/grok
verify:
  - ChatGPT 语音对话的每日上限沿用本站单篇教程 2026-10-07 核对的数字（Plus 3 小时等），以官方帮助为准
  - Claude 语音模式官方标注为 beta
  - AI 对发音的反馈能力各家官方没有给出明确承诺，本文不把它当作专业的发音评测
  - 文中的陪练指令与对话示例为自拟
---

> 本文是一套练习流程，语音功能的事实依据 OpenAI 与 Anthropic 官方帮助中心（沿用本站单篇教程的核对结果），资料核对于 2026-10-11。

## 适用于谁

- 想开口练英语但找不到人陪练、或者怕说错的人；
- 搜「ai 学英语口语」「ai 口语陪练」「ai 口语陪练免费」的人；
- 准备面试、出差、雅思托福口语，需要大量开口机会的人。

## 结论先说

1. **通用 AI 助手的语音模式就能当口语陪练**，不一定要下载专门的 App：ChatGPT 的语音对话和 Claude 的语音模式都能边听边说、随时打断，并留下文字记录。
2. **默认状态下它是「聊天对象」，不是「老师」**——它会顺着你说，很少主动纠错。要用一段**陪练指令**告诉它：说慢一点、每轮只纠一两个错、多让你说。
3. 练习要有结构：**热身 → 情景对话 → 纠错复盘 → 背诵巩固**，每天 20 分钟比周末突击两小时有效。
4. **文字记录是最大的优势**：练完让它把你的错误整理成表，再做成闪卡复习。
5. 它对**语法、用词、表达是否自然**的反馈比较可靠；**发音**方面不要把它当专业评测。

## 第一步：打开语音模式

**ChatGPT**

- 入口：手机 App 和网页版输入框右侧的**声波按钮**是语音对话；旁边的麦克风按钮只是听写（语音转文字）。
- 2026 年 7 月起语音对话由 GPT-Live 驱动，能边听边说、随时打断，回答同步显示文字。
- 每日上限按滚动 24 小时计：Free 有限，Plus 为 3 小时（本站教程核对时的数字）。
- 详见[《ChatGPT 语音对话怎么用》](/guides/chatgpt-voice-mode)。

**Claude**

- 入口同样是输入框里的**声波图标**；麦克风是听写。
- 语音模式目前是 beta，所有套餐（含 Free）都能用，官方说在手机上体验最好。
- 两种说话方式：默认免提（自动判断你说完了）；环境吵就切成「按住说话」——**刚开始练、需要时间组织句子的人建议用按住说话**，不会被抢话。
- **语音的语言要单独设**：Settings → General → Voice → Language，和界面语言无关。练英语要把这里设成英语。
- 语音对话照常计入用量，文字记录保存在聊天历史里。详见[《Claude 语音模式怎么用》](/guides/claude-voice-mode)。

Grok 官网也把低延迟的语音对话列为基础能力，可以用同样的方法。

## 第二步：给它一段「陪练指令」

把下面这段放进**自定义指令**或一个专门的**项目说明**里（这样每次开口就生效），按自己的情况改方括号里的内容：

```text
You are my English speaking coach. My level is [intermediate / B1].
My goal: [daily conversation / job interviews / IELTS speaking].

Rules:
1. Speak slowly and clearly. Use simple words; avoid idioms unless you explain them.
2. Keep your turns short (2–3 sentences), then ask me a question so I do most of the talking.
3. After each of my answers, correct at most TWO important mistakes:
   say what I said, the corrected version, and a one-line reason. Then continue the conversation.
4. If I get stuck, give me a sentence starter instead of the full answer.
5. If I speak Chinese, tell me how to say it in English and ask me to repeat.
6. When I say "review", stop and list all my mistakes from this session in a table:
   what I said | better version | type (grammar / word choice / naturalness).
```

要点解释：

- **每轮最多纠两个错**。一次纠太多你会不敢开口。
- **它的话要短**。很多人练了半小时，其实是在听 AI 说。
- **用英文写指令**更稳，它不容易切回中文。
- 用项目来放指令的方法见[《ChatGPT 项目功能怎么用》](/guides/chatgpt-projects)、[《ChatGPT 自定义指令怎么设置》](/guides/chatgpt-custom-instructions)。

## 第三步：每天 20 分钟的四段流程

### ① 热身（3 分钟）

```text
Let's warm up. Ask me three easy questions about my day, one at a time.
```

目的是开口，不求复杂。

### ② 情景对话（10 分钟）

每天换一个场景，让它扮演对方：

```text
Role-play: you are a hotel receptionist. I'm checking in, but my reservation can't be found.
Start the conversation. Stay in character, and correct me following the rules.
```

可用的场景：点餐、问路、看病挂号、退换货、电话会议开场、向同事解释延期、自我介绍、面试问答、雅思 Part 2 话题陈述。

想提高难度：

```text
Now make it harder: speak at natural speed and be a little impatient.
```

### ③ 纠错复盘（5 分钟）

说 `review`，它会把这次的错误列成表。然后针对最常见的一类追问：

```text
I keep making tense mistakes. Give me five short questions that force me to use the past tense, one at a time.
```

### ④ 背诵巩固（2 分钟）

```text
From today's mistakes, pick five sentences I should memorize. Say each one slowly, and I'll repeat after you.
```

## 第四步：把错误变成复习材料

练完后切回文字，把当天的表格攒起来：

```text
把今天的错误表整理成闪卡：正面是中文意思或我说错的句子，背面是正确的英文说法。
```

ChatGPT 的学习模式可以生成**交互式测验**和**闪卡**（点击翻面、标记记住或再练，自动保存到文件库），所有套餐都能用；注意学习模式不能在临时聊天、GPT 或项目里开启，要换到普通对话。见[《ChatGPT 学习模式怎么用》](/guides/chatgpt-study-mode)。

每周末做一次：

```text
这是我这一周的错误记录。归纳我最常犯的三类错误，各给一个规则说明和五个练习句。
```

## 不同目标怎么调整

| 目标 | 调整方法 |
| --- | --- |
| 日常会话 | 场景轮换；要求它用最常见的说法，不要书面语 |
| 求职面试 | 把岗位描述发给它，让它按岗位提问并追问，见[《用 AI 写简历与模拟面试》](/guides/ai-resume-mock-interview) |
| 雅思 / 托福口语 | 让它按考试的题型和时间出题、计时，结束后按官方评分维度给反馈；分数只作参考 |
| 工作会议 | 把你要讲的内容先用中文说一遍，让它给出自然的英文版本，再跟读 |
| 听力 | 让它讲一段 1 分钟的话，你复述；逐步让它加快语速 |

## 这种方法的局限

- **发音**：语音模式能听懂你，不代表你的发音标准。纠发音需要专门的工具或真人老师。
- **它太有耐心**：真实对话里对方不会等你。定期让它「不要等我、按正常语速说」。
- **它会夸你**。把「不要夸奖，直接指出问题」写进指令。
- **额度**：语音对话有每日上限或计入用量，重度练习要留意。

## 常见问题

**Q：说到一半它就开始回答？**
在 Claude 里切成「按住说话」；在指令里加一句「等我说完，如果我停顿不要打断」。

**Q：它总是切回中文？**
把语音语言设为英语，指令用英文写，并加一句「Always reply in English」。

**Q：免费版够用吗？**
入门够用：ChatGPT Free 有有限的语音额度，Claude 语音模式对 Free 开放。每天想练更久再考虑付费，开通可看 [/chongzhi/chatgpt-plus](/chongzhi/chatgpt-plus)。

**Q：有现成的陪练提示词吗？**
本站[提示词库](/prompts)的「外语学习」分类里有口语陪练、场景对话、纠错复盘等模板。

## 参考资料

- ChatGPT Voice（OpenAI 官方帮助中心）：https://help.openai.com/en/articles/20001274-chatgpt-voice
- Using Study Mode in ChatGPT（OpenAI 官方帮助中心）：https://help.openai.com/en/articles/11780217-using-study-mode-in-chatgpt
- Use voice mode（Claude 官方帮助中心）：https://support.claude.com/en/articles/11101966-use-voice-mode
