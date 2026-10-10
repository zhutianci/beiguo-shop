---
title: ChatGPT 隐私设置：怎么关闭「改进模型」训练、数据控制与隐私中心
slug: chatgpt-data-controls-privacy
products: [chatgpt]
models: []
accountTier: FREE
excerpt: 不想让 ChatGPT 用你的对话训练模型？本文按官方帮助中心讲清「为所有人改进模型」开关在网页和手机上怎么关、关了会怎样、点赞点踩的例外、Codex 的单独设置，以及隐私中心和锁定模式是做什么的。
checkedOn: 2026-10-07
sources:
  - https://help.openai.com/en/articles/7730893-data-controls-in-chatgpt
  - https://help.openai.com/en/articles/5722486-how-your-data-is-used-to-improve-model-performance
  - https://help.openai.com/en/articles/20001488-privacy-center-in-chatgpt
  - https://help.openai.com/en/articles/20001061-lockdown-mode
  - https://privacy.openai.com/
  - https://help.openai.com/en/articles/6825453-chatgpt-release-notes
verify:
  - 「数据控制」「为所有人改进模型」「隐私中心」「安全」等中文菜单名以实际界面为准
  - 隐私中心的可用范围：发布说明写 Free / Go / Plus / Pro，帮助文章写 Free / Go / Plus / Pro / Business，正文按帮助文章
---

> 本文根据 OpenAI 帮助中心（Data controls、How your data is used、Privacy Center、Lockdown Mode）整理，资料核对于 2026-10-07；截图引用自 OpenAI 帮助中心，为英文界面。

## 适用于谁

- 担心工作内容、个人信息被拿去训练模型，想把训练关掉的人；
- 不确定「关闭训练」会不会把聊天记录也删掉的人；
- 在 ChatGPT 里看到「隐私中心」「锁定模式」，想知道是什么的人。

## 结论先说

1. **关训练只需一个开关**：**Settings（设置）→ Data controls（数据控制）→ Improve the model for everyone（为所有人改进模型）**，关掉即可。登录状态下这个设置跟着账号走，各设备同步。
2. **关了不会删记录**：普通聊天、归档聊天、项目里的聊天都照常保留，只是之后的新对话不再用于训练。
3. **例外是反馈**：即使关了训练，你点了「赞 / 踩」的那条回答，所在的**整段对话**仍可能被用于训练。
4. **Business、Enterprise、Edu 和 API** 的内容默认就不用于训练，不需要个人操作。
5. **隐私中心**只是一个「说明 + 跳转」的页面，真正的开关仍在设置里；**锁定模式**是给处理敏感数据的人用的高级安全选项，和训练无关。

## 步骤

### 1. 网页版关闭训练

1. 点左下角头像打开账号菜单；
2. 选 **Settings（设置）**；
3. 进入 **Data controls（数据控制）**；
4. 点 **Improve the model for everyone**，把开关关掉，点 **Done（完成）**。

![设置弹窗里「Improve the model for everyone」开关处于关闭状态（英文界面）](seed:g101-improve-model-off.png)
*图片来源：[OpenAI 帮助中心《Data controls in ChatGPT》](https://help.openai.com/en/articles/7730893-data-controls-in-chatgpt)*

### 2. 手机 App 关闭训练

1. 打开侧边栏；
2. 点头像进入设置；
3. 选 **Data controls**；
4. 关闭 **Improve the model for everyone**。

在一台设备上改过，登录同一账号的其他设备也会生效。

### 3. 不登录使用时

没登录也能用 ChatGPT 的话，在设置里同样可以关掉这个开关，但选择只保存在**当前浏览器**里，换浏览器或清 Cookie 后要重新设置。

### 4. 另一个办法：隐私门户

也可以去 [OpenAI 隐私门户（privacy.openai.com）](https://privacy.openai.com/) 提交「Do not train on my content（不要用我的内容训练）」请求。官方说明：在 ChatGPT 里关开关、在隐私门户提交请求，**任选其一就够**，对 ChatGPT 对话和 Codex 任务都有效，不需要两边都做。以前通过客服或隐私请求退出过的，官方会继续保留这个选择。

### 5. 用 Codex 的人多看一项

个人套餐里用 Codex，「为所有人改进模型」同样适用于 Codex 任务。但 Codex 设置里还有一个单独的 **Include environments（包含环境）** 选项，控制 Codex 环境里的额外上下文能不能用于训练。改 ChatGPT 的开关或在隐私门户退出，**不会**改到这个选项，需要去 Codex 设置页单独看一眼。

## 关掉训练之后会怎样

- **聊天记录不变**：不会被删除或隐藏。想删内容，要单独删除对话或删除账号。
- **归档不等于退出训练**：把对话归档，不改变它能否被用于训练，仍按你的开关执行。
- **反馈例外**：主动点赞 / 点踩会让对应整段对话可能被用于训练。介意的话就别点。
- **客服对话**：开关打开时，你和 OpenAI 客服的对话也可能被用于改进服务。
- **临时聊天**：只要还是临时状态，就不会用于训练、不进历史、不产生记忆，但为安全目的最多可能保留 30 天；如果你把临时聊天「保存」成普通聊天，它就会按账号设置处理。详见 [/guides/chatgpt-temporary-chat](/guides/chatgpt-temporary-chat)。
- **记忆是另一回事**：训练开关决定内容能否用于改进模型；记忆决定 ChatGPT 是否记住你的信息来个性化回答。两者互不影响。

## 隐私中心是什么

2026 年 9 月起逐步推出的 **Privacy Center（隐私中心）** 把记忆、个性化广告、位置、临时聊天、已连接应用、两步验证、模型改进、导出 / 删除数据等说明集中到一个地方，每个主题旁边有 **Manage（管理）** 按钮跳到对应设置。打开它本身不会改任何设置。

打开方式：

- **网页**：账号菜单 → **Help（帮助）→ Privacy center**；
- **iOS / Android**：设置 → **Privacy Center**；
- **桌面 App**：如果「帮助」菜单里有 Privacy center，点它会在浏览器里打开。

官方在隐私中心里还写明：OpenAI 不出售用户数据，也不把 ChatGPT 对话分享给广告商；用于改进模型的数据会尽量识别并移除个人身份信息。广告只会出现在符合条件的 Free 和 Go 账号上。

## 锁定模式（Lockdown Mode）要不要开

锁定模式是一个可选的高级安全设置，目的是降低「提示词注入」攻击把你的敏感数据外传的风险。开启后会限制联网能力：网页浏览只能用缓存内容、深度研究和 Agent 类功能被禁用、ChatGPT 不能为数据分析下载文件、一些连接外部服务的应用会被限制。

它**不会**关闭训练，也不改变记忆、文件上传和分享对话。普通用户一般不需要开；经常处理客户资料、公司机密的人可以考虑。个人账号在 **Settings → Security（安全）** 里开启（以账号是否已开放为准）。

## 常见问题

**Q：关闭训练会影响 ChatGPT 的功能吗？**
官方没有说关闭训练会限制功能，聊天记录、记忆等照常可用。

**Q：用公司的 Business 账号需要自己关吗？**
不需要。官方说明 Business、Enterprise、Edu 工作区和 API 的内容默认不用于训练；具体还要遵守公司的数据政策。

**Q：青少年账号谁来管？**
已关联家长控制的青少年账号，家长或监护人可以管理对话是否用于改进模型。

**Q：想导出或删除自己的数据怎么办？**
Free、Go、Plus、Pro 用户可以在设置里自助导出和删除账号，见 [/guides/chatgpt-export-chat-history](/guides/chatgpt-export-chat-history) 和 [/guides/chatgpt-delete-account](/guides/chatgpt-delete-account)。

## 参考资料

- OpenAI 帮助中心：Data controls in ChatGPT — https://help.openai.com/en/articles/7730893-data-controls-in-chatgpt
- OpenAI 帮助中心：How your data is used to improve model performance — https://help.openai.com/en/articles/5722486-how-your-data-is-used-to-improve-model-performance
- OpenAI 帮助中心：Privacy Center in ChatGPT — https://help.openai.com/en/articles/20001488-privacy-center-in-chatgpt
- OpenAI 帮助中心：Lockdown Mode — https://help.openai.com/en/articles/20001061-lockdown-mode
- OpenAI 隐私门户 — https://privacy.openai.com/
- 截图来源：OpenAI 帮助中心（见图下方链接）
