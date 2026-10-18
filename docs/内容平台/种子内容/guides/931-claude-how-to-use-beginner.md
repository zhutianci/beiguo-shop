---
title: Claude 怎么用：新手入门，从打开聊天到写出第一个好问题
slug: claude-how-to-use-beginner
products: [claude]
models: []
accountTier: FREE
excerpt: Claude 怎么用？按官方帮助中心整理的新手路径：在网页、桌面版或手机 App 打开聊天，像对同事一样写需求，用输入框的「+」和「/」找功能，点模型名换模型，免费版有每 5 小时重置的上限。
checkedOn: 2026-10-19
sources:
  - https://support.claude.com/en/articles/8114491-get-started-with-claude
  - https://support.claude.com/en/articles/7996845-what-are-some-things-i-can-use-claude-for
  - https://support.claude.com/en/articles/8114487-what-interfaces-can-i-use-to-access-claude
  - https://support.claude.com/en/articles/8664678
verify:
  - 官方入门文章里的输入框截图显示的模型名是 Opus 4.5，只用来说明输入框位置；你看到的模型名以账号实际为准
  - 官方说 Claude 在英语上训练最充分、在许多常见语言上表现不错，对中文的具体表现官方没有单独说明，本文不下结论
  - 免费版会话限额「每 5 小时重置」是官方入门文章的写法；各套餐具体能发多少条消息官方未公开
---

> 本文根据 Claude 帮助中心《Get started with Claude》《What are some things I can use Claude for?》《What interfaces can I use to access Claude?》《Change the model, effort, and thinking settings》整理，资料核对于 2026-10-19。其中输入框图片来自官方文章，步骤图为本站整理的示意图。

## 适用于谁

- 刚拿到 Claude 账号，不知道从哪里开始的人；
- 听说 Claude 写作、编程、读文档很强，想知道第一次该问什么的人；
- 在网页、桌面版、手机 App 之间不知道选哪个的人；
- 想知道免费版和付费版区别的人。

## 结论先说

1. **Claude 是什么**：官方说，Claude 是 Anthropic 做的大语言模型，被训练成有用、诚实、无害的助手，聊天方式是对话式的。
2. **在哪用**：官方列出的入口有四类：网页版 claude.ai、iOS 和 Android 手机 App、Claude Desktop（Mac 和 Windows）、以及面向开发者的 Claude Console / API。新手用前三种就够了。
3. **怎么问**：官方建议像和同事或朋友说话一样，自然、有对话感地写需求，简单问题或复杂任务都可以。
4. **前提**：必须在官方支持的国家和地区使用，并且年满 18 岁；注册和登录的细节见 [/guides/claude-how-to-sign-up](/guides/claude-how-to-sign-up) 和 [/guides/claude-cant-login-or-use](/guides/claude-cant-login-or-use)。
5. **额度**：免费版有按会话计算、每 5 小时重置的使用上限，消息条数会随需求量变化；想要更多用量，官方有付费套餐。

![Claude 聊天输入框：左下角的 + 与模型名（官方截图）](seed:g931-claude-chat-input-official.png)
*图片来源：[Claude 帮助中心：Get started with Claude](https://support.claude.com/en/articles/8114491-get-started-with-claude)*

## 一、第一次聊天：5 步走

![第一次用 Claude 聊天的 5 步](seed:g931-claude-first-chat-steps.png)
*图：本站根据 [Claude 帮助中心：Get started with Claude](https://support.claude.com/en/articles/8114491-get-started-with-claude) 整理的示意图*

1. **打开并登录**：浏览器访问 claude.ai，或者装桌面版、手机 App。登录用「Continue with Google」或邮箱登录链接，官方说目前不能给账号单独设密码。
2. **写第一句话**：在输入框里直接写需求，然后点提交按钮。官方给的例子很朴素，比如「怎么在墙上挂相框」，也可以是多步骤的分析、写作、编程任务。
3. **找更多功能**：官方说，点输入框左下角的 **+**，或者输入 **/**，可以看到更多选项和命令。
4. **看正在用哪个模型**：网页版和桌面版显示在输入框下方，手机在屏幕顶部。点一下模型名，可以换成别的模型；点「More models」看更多。模型怎么选，见 [/guides/claude-models-compare](/guides/claude-models-compare)。
5. **不满意就追问**：官方的小建议是：先从简单问题开始，熟悉它怎么回答；请求越具体，它越能帮上忙；不要怕反复修改提示。

## 二、可以让 Claude 做什么

官方「What are some things I can use Claude for?」列了几类，对新手够用：

- **写作**：从一条短信、一封邮件，到剧本、小说，不同格式和风格都可以；
- **学习新东西**：做一道菜、用一个 Python 库、了解一段历史；
- **总结长文**：文章、新闻、文档、对话甚至整本书；
- **写代码**：官方说它最擅长 Python，也会所有主流编程语言；
- **头脑风暴 / 辩论对象**：帮你提出不同角度、给建议；
- **翻译**：官方说它最擅长英语，懂十几种语言，翻译效果因语言而异；
- **看图**：解读图片内容，比如分析图表、描述画面。

对应本站的教程：读文档见 [/guides/claude-file-upload-limits](/guides/claude-file-upload-limits)，做 PPT 见 [/guides/claude-make-ppt-slides](/guides/claude-make-ppt-slides)，联网搜索见 [/guides/claude-web-search](/guides/claude-web-search)，写代码见 [/guides/claude-code-getting-started](/guides/claude-code-getting-started)。

## 三、第一个好问题怎么写

提示词的写法，官方的原则就是「像和同事说话」。可以套一个小模板，把背景、任务、要求说清楚：

```
我是[身份，比如：刚入职的运营]，现在要[做什么事]。
请你[具体任务，比如：帮我写一份 300 字的活动通知]。
要求：[语气 / 字数 / 格式]。
如果信息不够，先问我 2 个问题再动手。
```

几个习惯：

- **一次只讲一件事**，回答不满意就在同一个对话里追问「第二段太啰嗦，改短」；
- **想要中文，直接用中文提问**，详见 [/guides/claude-set-chinese-language](/guides/claude-set-chinese-language)；
- **长任务先让它列提纲**，确认方向再展开；
- **想学更多写法**，见 [/guides/how-to-write-prompts](/guides/how-to-write-prompts)。

## 四、选哪个入口：网页、桌面、手机

- **网页版**：最简单，打开 claude.ai 就能用，适合先试用；
- **桌面版**：官方提供 Mac 和 Windows 版，适合想把 Claude 放在任务栏里随时调用的人，见 [/guides/claude-desktop-app](/guides/claude-desktop-app)；
- **手机 App**：iOS 和 Android 都有，适合随手问，见 [/guides/claude-mobile-app](/guides/claude-mobile-app)；
- **Console / API**：面向开发者，按用量单独计费，普通聊天用不到，见 [/guides/claude-api-key-console](/guides/claude-api-key-console)。

## 五、模型、思考和额度

- **换模型、调 effort**：官方说，输入框旁的模型菜单控制三件事：用哪个模型、每次回答花多少力气（effort）、是否使用思考。可以在对话中途随时改，从下一条回答开始生效。
- **日常默认即可**：官方说简单问题、基本信息、一般写作不需要额外调高；复杂任务（数学证明、复杂规划、详细文档分析等）再调高 effort 或打开思考。调高会更慢、更费额度。
- **免费版额度**：官方说，免费版有按会话计的使用上限，每 5 小时重置，能发的消息数会随需求变化，快到上限时 Claude 会提醒你。额度怎么看，见 [/guides/claude-usage-limits](/guides/claude-usage-limits)。
- **想要更多**：官方有付费套餐（Pro、Max 等），区别见 [/guides/claude-plans-free-pro-max](/guides/claude-plans-free-pro-max)；需要开通 Claude Pro 的，可以看本站的 [/chongzhi/claude-pro](/chongzhi/claude-pro)。

## 常见问题

**Q：Claude 能导入我在别家的聊天记录吗？**
官方说，目前不能导入其他 AI 的对话历史；但免费、Pro、Max 用户可以用记忆导入功能，把别家的「记忆」转过来。

**Q：Claude 记得我以前聊过什么吗？**
见 [/guides/claude-memory](/guides/claude-memory)。

**Q：Claude 的资料是最新的吗？**
官方有单独文章讲训练数据的时效，需要最新信息时可以打开联网搜索，见 [/guides/claude-web-search](/guides/claude-web-search)。

**Q：Claude 和 ChatGPT 选哪个？**
见 [/guides/chatgpt-vs-claude](/guides/chatgpt-vs-claude)。

## 参考资料

- Claude 帮助中心：Get started with Claude — https://support.claude.com/en/articles/8114491-get-started-with-claude
- Claude 帮助中心：What are some things I can use Claude for? — https://support.claude.com/en/articles/7996845-what-are-some-things-i-can-use-claude-for
- Claude 帮助中心：What interfaces can I use to access Claude? — https://support.claude.com/en/articles/8114487-what-interfaces-can-i-use-to-access-claude
- Claude 帮助中心：Change the model, effort, and thinking settings — https://support.claude.com/en/articles/8664678
