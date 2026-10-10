---
title: AI 使用隐私与数据安全清单：哪些不能输入、训练开关在哪关、连接器与文件怎么管
slug: ai-privacy-data-safety-checklist
products: [chatgpt, claude]
models: []
accountTier: FREE
excerpt: 用 ChatGPT、Claude、Grok、Cursor 会泄露隐私吗？一页清单讲清：六类不该输入的信息、各产品「用于训练」开关的位置、临时聊天与无痕对话的真实效果、连接器和上传文件的风险、账号安全，以及公司场景下的注意事项，全部对应官方文档。
checkedOn: 2026-10-11
sources:
  - https://help.openai.com/en/articles/7730893-data-controls-in-chatgpt
  - https://help.openai.com/en/articles/8914046-temporary-chat-in-chatgpt
  - https://privacy.claude.com/en/articles/12109829-how-do-i-change-my-model-improvement-privacy-settings
  - https://privacy.claude.com/en/articles/10023548-how-long-do-you-store-my-data
  - https://cursor.com/help/security-and-privacy/privacy
  - https://docs.x.ai/grok/faq
  - https://support.claude.com/en/articles/12111783-create-and-edit-files-with-claude
verify:
  - 各产品设置项的名称与位置沿用本站单篇教程 2026-10-07 核对的结果，界面可能已调整
  - Gemini、豆包、Kimi 等其他产品的数据设置本文未核对，原则相同，具体以各自的隐私设置页为准
  - 本文是面向个人用户的通用清单，不构成法律或合规意见；公司场景以公司制度和所签协议为准
---

> 本文根据 OpenAI、Anthropic、Cursor、xAI 的官方帮助与隐私文档整理（沿用本站各单篇教程的核对结果），资料核对于 2026-10-11。各产品的详细步骤见文中链接。

## 适用于谁

- 把工作文档、聊天记录、体检报告往 AI 里贴之前会犹豫一下的人；
- 搜「ai 隐私」「ai 数据安全」的人；
- 要给团队定一个 AI 使用规范的人。

## 结论先说

1. **默认假设：你输入的内容会离开你的设备，被服务方存储一段时间**。这是所有云端 AI 的共同点。差别在于是否用于训练、保存多久、谁能看到。
2. **「用于训练」的开关各家都有，而且要你自己去关**（个人账号）。企业版、团队版和 API 的内容通常默认不用于训练。
3. **临时聊天 / 无痕对话不等于零保存**。它们不进历史、不用于训练，但服务方出于安全目的仍可能短期保留。
4. **有些信息无论开关怎么设都不该输入**：密码与密钥、证件号与银行卡号、他人的隐私、公司的保密信息。
5. **连接器、上传的文件、联网和代码执行**都会扩大 AI 能接触到的范围，也带来新的风险（包括提示注入）。
6. **账号本身要保护好**：聊天记录里可能有你全部的工作和生活细节。

## 一、六类不该输入的信息

| 类别 | 例子 | 替代做法 |
| --- | --- | --- |
| 凭据 | 密码、API Key、验证码、私钥 | 永远不贴；需要举例时用占位符 |
| 身份与金融信息 | 身份证号、护照号、银行卡号、完整住址 | 删掉或打码，AI 完成任务并不需要它们 |
| 他人的隐私 | 同事的绩效、客户的联系方式、别人的聊天记录、病历 | 匿名化：用「客户 A」「同事甲」 |
| 公司保密信息 | 未公开的财务数据、源代码、客户名单、合同条款 | 先看公司制度；用公司批准的企业版工具 |
| 受法律特别保护的数据 | 健康、生物识别、未成年人信息 | 不上传；确需处理时走合规流程 |
| 尚未公开的作品与研究 | 未发表的论文、专利交底书、未上线的方案 | 关闭训练开关，或不上传 |

**脱敏的简单办法**：把敏感字段替换成占位符（[姓名]、[金额]、[公司]），让 AI 处理结构和文字，拿到结果后再自己填回去。

## 二、关掉「用于训练」

| 产品 | 位置 | 要点 |
| --- | --- | --- |
| ChatGPT | Settings → Data controls → **Improve the model for everyone** | 关掉后新对话不再用于训练，历史记录照常保留；例外：你点了赞 / 踩的那条回答，所在的整段对话仍可能被用于训练。详见[《ChatGPT 隐私设置》](/guides/chatgpt-data-controls-privacy) |
| Claude | Settings → Privacy →「Help improve our AI models」 | 可随时开关；关掉后新旧对话都不再用于以后的训练。被安全系统标记为违规的对话仍可能用于改进安全模型。详见[《Claude 隐私设置》](/guides/claude-privacy-delete-account) |
| Cursor | Cursor Settings → General → **Privacy Mode** | 开启后代码不会被 Cursor 或模型提供方用于训练；自带 API Key 时不适用零数据保留。详见[《Cursor 隐私模式与 Agent 权限》](/guides/cursor-privacy-mode-run-modes) |
| 企业版 / 团队版 / API | — | OpenAI 说明 Business、Enterprise、Edu 和 API 的内容默认不用于训练；Cursor 的 Teams 默认开启隐私模式 |

其他产品（Gemini、Grok、豆包、Kimi 等）也都有类似的数据设置，在各自的隐私或数据控制页里找。

**关了训练不等于不保存**。对话仍然存在你的账号里，直到你删除。

## 三、临时聊天与无痕对话

- **ChatGPT 临时聊天**：不出现在历史、不新建也不更新记忆、不用于训练。但官方说明为安全目的可能保留一份副本**最长 30 天**；关掉就找不回；临时聊天里生成的文件不会保存。见[《ChatGPT 临时聊天是什么》](/guides/chatgpt-temporary-chat)。
- **Claude 无痕对话（Incognito）**：不会用于训练，即使你开着训练开关。

适合用来问一次性的、不想留在历史里的问题。**不适合**用来处理真正敏感的数据——那类数据根本不该输入。

## 四、删除与导出

- **删除对话**：Claude 官方说明删除后立刻从历史消失，30 天内从后端系统删除。ChatGPT 也可以删除单条或全部对话。
- **记忆**：ChatGPT 和 Claude 都有记忆功能，会跨对话记住关于你的信息。定期看一眼它记了什么，删掉不想保留的。见[《ChatGPT 记忆已满怎么办》](/guides/chatgpt-memory-full)、[《Claude 记忆功能怎么用》](/guides/claude-memory)。
- **分享链接**：分享出去的对话链接，拿到链接的人都能看。分享前检查内容，不用了及时撤销。见[《ChatGPT 分享对话怎么用》](/guides/chatgpt-share-chat-link)。
- **导出数据**：换工具或销号前先导出。见[《ChatGPT 聊天记录怎么导出》](/guides/chatgpt-export-chat-history)、[《Claude 导出聊天记录》](/guides/claude-export-chat-data)。
- **删除账号**：ChatGPT、Claude 的账号删除是永久的、不可恢复；Grok 官方说明删除后 30 天内重新登录并确认可以恢复。见[《ChatGPT 删除账号怎么操作》](/guides/chatgpt-delete-account)。

## 五、连接器、文件、联网与代码执行

**连接器**（把 AI 接到网盘、邮箱、日历）

- 连接之后，AI 能读到的不再只是你贴进去的内容，而是授权范围内的全部资料；
- 只连需要的，授权范围选最小的；不用了及时断开；
- 公司账号连接前确认制度是否允许。

**上传的文件**

- 文件会保存在服务方：ChatGPT 的文件库、Claude 的项目知识库等。用完可以删除；
- 上传前看一眼文件里有没有与任务无关的敏感内容（比如表格里多出来的身份证号一列）。

**联网与代码执行**

- AI 读到的网页、文件里可能藏着给 AI 的指令（提示注入）。Claude 官方在文件创建功能的说明里就提到：开了网络访问时存在提示注入导致数据外泄的风险，处理敏感数据时要盯着它在做什么；
- 让 AI 自己操作浏览器、电脑时风险更高，重要账号不要在同一环境里保持登录。

编程场景的专门做法见[《AI 编程安全注意事项》](/guides/ai-coding-security-secrets-permissions)。

## 六、账号安全

- **开启两步验证**，见[《ChatGPT 两步验证怎么开》](/guides/chatgpt-account-security-mfa)；
- 密码不与其他网站共用；
- **不与他人共用账号**：共用意味着对方能看到你的全部历史、记忆和上传的文件；
- 定期检查已登录的设备，发现异常立刻登出所有设备并改密码；
- 只在官方网站和官方 App 里输入账号密码，警惕仿冒页面。

## 七、公司场景

1. **先问有没有规定**。很多公司明确列了允许使用的工具和禁止输入的数据类型。
2. **优先用公司提供的企业版**。企业版通常默认不训练，并有管理员控制、数据处理协议等保障；个人账号没有这些。
3. **客户数据看合同**。你和客户签的保密条款，可能禁止把资料交给第三方处理。
4. **会议录音、面试记录**涉及他人，要告知并按规定处理，见[《用 AI 做会议纪要的流程》](/guides/ai-meeting-minutes-workflow)。
5. **产出也要管**：AI 生成的内容里如果带着敏感信息，存放和转发同样按原有密级。

## 一页清单

**输入前**

- [ ] 没有密码、密钥、验证码
- [ ] 证件号、银行卡号、住址已删除或打码
- [ ] 涉及他人的信息已匿名化
- [ ] 公司保密内容：制度允许，且用的是批准的工具
- [ ] 上传的文件里没有多余的敏感字段

**账号设置（做一次）**

- [ ] 已关闭「用于训练」的开关
- [ ] 已开启两步验证
- [ ] 看过记忆里存了什么
- [ ] 连接器只保留在用的

**定期**

- [ ] 清理不再需要的对话和文件
- [ ] 撤销不再需要的分享链接
- [ ] 检查登录设备

## 常见问题

**Q：付费版是不是更安全？**
个人付费版和免费版在数据使用上的默认设置通常相同，训练开关都要自己关。数据保障更强的是企业版和团队版。

**Q：关了训练，官方员工还能看到我的对话吗？**
训练开关管的是「是否用于改进模型」。出于安全和合规目的的有限访问与短期保留，各家隐私政策里都有说明，以官方政策原文为准。

**Q：国内的 AI 产品也是这样吗？**
原则相同：都要看隐私政策和数据设置。具体的开关位置和保存期限以各产品为准。

## 参考资料

- Data controls in ChatGPT（OpenAI 官方帮助中心）：https://help.openai.com/en/articles/7730893-data-controls-in-chatgpt
- Temporary Chat in ChatGPT（OpenAI 官方帮助中心）：https://help.openai.com/en/articles/8914046-temporary-chat-in-chatgpt
- How do I change my model improvement privacy settings?（Anthropic 隐私中心）：https://privacy.claude.com/en/articles/12109829-how-do-i-change-my-model-improvement-privacy-settings
- How long do you store my data?（Anthropic 隐私中心）：https://privacy.claude.com/en/articles/10023548-how-long-do-you-store-my-data
- Privacy and data（Cursor 官方帮助中心）：https://cursor.com/help/security-and-privacy/privacy
- FAQ - Grok Website / Apps（官方文档）：https://docs.x.ai/grok/faq
