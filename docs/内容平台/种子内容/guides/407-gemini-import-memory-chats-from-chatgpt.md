---
title: ChatGPT 记忆和聊天记录怎么导入 Gemini：官方「导入记忆」功能步骤与限制
slug: gemini-import-memory-chats-from-chatgpt
products: [gemini, chatgpt]
models: [gemini-llm]
accountTier: FREE
excerpt: Gemini 官方提供从其他 AI 平台迁移的功能：用一段提示词把 ChatGPT、Claude 里的记忆搬过来，或上传导出的 .zip 文件导入完整聊天记录。本文讲使用条件、两种导入的步骤、5 GB 与每天 5 个文件的限制、怎么删除，以及数据如何处理。
checkedOn: 2026-10-10
sources:
  - https://support.google.com/gemini/answer/16868299
  - https://support.google.com/gemini/answer/16598469
  - https://support.google.com/gemini/answer/13278892
verify:
  - 「Import memory to Gemini」入口的中文名称以实际界面为准
  - 帮助中心只写了 ChatGPT 和 Claude 的导出步骤，其他平台的导出文件是否能识别官方未说明
  - 导入功能不在欧洲经济区、瑞士、英国提供；其他地区是否都已开放以实际界面为准
---

> 本文根据 Google 官方 Gemini 帮助中心整理，核对日期 2026-10-10。ChatGPT、Claude 一侧的导出入口以各自官方界面为准，本文引用的是 Gemini 帮助中心给出的步骤。

## 适用于谁

- 搜「gemini 导入 chatgpt」「chatgpt 导入 gemini 记忆」「gemini 记忆转移」的人；
- 打算从 ChatGPT 或 Claude 换到 Gemini，不想从头再介绍一遍自己的人；
- 想把以前的对话搬到 Gemini 里接着聊的人。

## 结论先说

1. **Gemini 有官方的导入功能**，入口在网页版「设置与帮助 → Import memory to Gemini（导入记忆）」。
2. **两种导入**：① 导入「记忆」——复制 Gemini 给的提示词去问原平台，再把回答贴回来；② 导入「完整聊天记录」——上传原平台导出的 .zip 文件。
3. **条件**：个人 Google 账号、年满 18 岁；工作、学校和受监管账号不行；欧洲经济区、瑞士、英国暂不提供。
4. **限制**：聊天记录文件只支持 .zip，单个最大 5 GB，每天最多上传 5 个；处理时间取决于来源平台，最长可能要一天。
5. **导入的内容会进入你的 Gemini 活动记录**，按 Google 的规则用于改进服务，可以随时删除。

## 一、使用条件

| 条件 | 说明 |
| --- | --- |
| 账号 | 自己管理的个人 Google 账号 |
| 年龄 | 18 岁及以上 |
| 原平台 | 你还能登录原来的 AI 平台，并且那边保存着聊天记录和记忆 |
| 不支持的地区 | 欧洲经济区、瑞士、英国 |
| 不支持的入口 | Google Messages 里的 Gemini、Chrome 中的 Gemini、Android XR 上的 Gemini |

## 二、方法一：导入记忆（几分钟）

这里的「记忆」指你的偏好、原平台记住的关于你的事实和背景信息。

1. 打开 gemini.google.com；
2. 点左下角「设置与帮助（Settings & help）」→「Import memory to Gemini」；
3. **复制** Gemini 提供的那段提示词；
4. 打开原来的 AI 平台（比如 ChatGPT），把提示词粘贴进对话框发送；
5. 把对方回复的、包含你个人记忆的内容**整段复制**；
6. 回到 Gemini，粘贴到指定的文本框，点「添加记忆（Add memory）」。

完成后，Gemini 会新建一个对话，把这些内容整合进去，之后的对话里就能「记得」这些信息。

粘贴之前建议自己先读一遍对方的回复：里面如果有过时的、不想带过来的内容，直接删掉再贴。

## 三、方法二：导入完整聊天记录（最长约一天）

**第一步：从原平台导出**。Gemini 帮助中心给的路径：

- **ChatGPT**：左下角用户名 →「Settings」→「Data controls」→「Export data」旁点「Export」→「Confirm Export」；
- **Claude**：左下角用户名 →「Settings」→「Privacy」→「Export data」旁点「Export」→ 选择要导出的时间范围 →「Export」。

导出后，原平台会把下载链接发到你在那个平台注册的邮箱。更详细的导出说明见本站《ChatGPT 聊天记录怎么导出》和《Claude 导出聊天记录》。

**第二步：上传到 Gemini**

1. 打开 gemini.google.com；
2. 左下角「设置与帮助 → Import memory to Gemini」；
3. 在「Import chats（导入对话）」下点「添加（Add）」；
4. 选择导出的 .zip 文件开始上传。

| 项目 | 限制 |
| --- | --- |
| 文件类型 | 只支持 .zip |
| 单个文件大小 | 最大 5 GB |
| 每天上传数量 | 最多 5 个 .zip |
| 处理时间 | 取决于来源平台，可能长达一天 |

**第三步：查看导入的对话**。导入完成后，在左上角「菜单」的「对话（Chats）」列表里，导入的对话带有专门的「导入」图标；也可以用搜索找某一条。打开后可以直接接着聊。

## 四、删除和重新导入

- **删单条**：在对话列表里找到那条导入的对话，点「更多 → 删除」；
- **删整批**：在导入页面找到那一次导入的条目，点旁边的「删除」，这个 .zip 里导入的所有对话都会被删掉；
- **重新上传同一份导出**：会补上新增的对话，并**覆盖**之前导入过的同名对话；
- **导入中断**：系统会通知你，部分对话可能只导入了一半。官方建议删掉这次导入条目，重新导入。

## 五、数据怎么处理

帮助中心的说明很直接：

- 导入的对话和之后接着聊的内容，都保存在你的 **Gemini 活动记录**里；
- 这些数据会被用于改进 Google 的服务（包括训练生成式 AI 模型），并用于保护 Google、用户和公众；
- 你可以随时管理或删除活动记录；
- 所有导入的信息都适用 Google 隐私权政策。

所以导入之前要想清楚：旧对话里如果有不愿意交给另一家公司的内容（证件、合同、客户资料等），先不要整包导入，或者改用「导入记忆」只带过去必要的信息。活动记录的设置见本站《Gemini 隐私设置》。

## 六、导入后怎么用起来

- 记忆要生效，需要「保留活动记录」和 Memory 都处于开启状态（入口：设置与帮助 → Personal Intelligence）；
- 可以新开对话问一句「你现在了解我哪些信息？」来检查导入效果，有错就当场纠正；
- 固定的格式和语气要求，更适合写进「给 Gemini 的指令」，见本站《Gemini 记忆功能怎么用》。

## 常见问题

**Q：ChatGPT 的 GPTs、项目、生成的图片能一起搬过来吗？**
帮助中心只说可以导入「偏好、记住的事实与背景信息」和「完整聊天记录」，没有提到 GPTs、项目设置等内容能迁移。

**Q：导入后原平台的数据还在吗？**
导入只是把内容复制到 Gemini，不会改动原平台上的数据。要不要在原平台删除，需要你自己去那边操作。

**Q：Gemini 的对话能反过来导出吗？**
可以，见本站《Gemini 聊天记录怎么导出》。

**Q：免费账号能导入吗？**
帮助中心列出的条件里没有订阅要求，只要求个人账号、满 18 岁和所在地区支持。

## 参考资料

- Import from other AI platforms to Gemini Apps（Gemini 帮助中心）：https://support.google.com/gemini/answer/16868299
- Get personalization with memory of your past Gemini chats：https://support.google.com/gemini/answer/16598469
- Manage & delete your activity in Gemini Apps：https://support.google.com/gemini/answer/13278892
