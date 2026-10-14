---
title: iPhone 上 Siri 怎么用 ChatGPT：Apple Intelligence 里设置 ChatGPT 扩展、登录账号、关闭确认和关掉它
slug: chatgpt-siri-apple-intelligence-setup
products: [chatgpt]
models: []
accountTier: FREE
excerpt: iPhone 的 Siri 和写作工具可以调用 ChatGPT。按 OpenAI 帮助中心：设置 → Apple Intelligence 与 Siri → ChatGPT → Set Up，不登录账号也能用；登录后才保存聊天。本文讲设置步骤、看不到选项怎么办、怎么不再每次确认、怎么关闭，附官方截图。
checkedOn: 2026-10-14
sources:
  - https://help.openai.com/en/articles/10269382-setting-up-chatgpt-with-apple-intelligence
  - https://help.openai.com/en/articles/10263313-what-is-apple-intelligence
verify:
  - Apple Intelligence 能否使用、支持哪些设备、语言和地区，由苹果决定，官方文章让你查 Apple 的 apple.co/ai-support；本文不判断你的设备或地区是否支持
  - 两张官方截图是 iOS 设置里的英文界面，官方也提示截图可能与当前界面不同；菜单的中文名称（Apple 智能与 Siri 等）以你手机上实际显示为准
  - 官方文章没有写 iPad 以外的更多设备细节；Mac 的步骤来自《What is Apple Intelligence?》
  - 登录 ChatGPT 账号后「更强模型」的具体额度，官方文章没有给数字，以设置页里的 Daily Limit 显示为准
---

> 本文根据 OpenAI 帮助中心《Setting up ChatGPT with Apple Intelligence》《What is Apple Intelligence?》整理，资料核对于 2026-10-14。两张截图引自官方文章，为 iOS 设置里的英文界面，可能与你手机上的界面略有不同。Apple Intelligence 本身能不能用，由苹果决定，请以 Apple 官方说明为准。

## 适用于谁

- 搜「ChatGPT Siri」，想让 Siri 遇到复杂问题时去问 ChatGPT 的 iPhone 用户；
- 在设置里找不到 ChatGPT 选项的人；
- 不想每次都弹确认，或者想把它关掉的人。

## 结论先说

1. **这是苹果系统里的一个扩展**：官方说，你可以通过设置 ChatGPT 扩展，把 ChatGPT 连到 Apple Intelligence 的功能上，比如**写作工具（Writing Tools）和 Siri**。
2. **设置路径**：**设置（Settings）→ Apple Intelligence 与 Siri（Apple Intelligence & Siri）→ ChatGPT → Set Up**。
3. **不登录账号也能用**：官方说，你可以不登录 ChatGPT 账号，通过苹果的集成提问、帮忙写消息、分析图片或文档；想要更多的功能，比如更多使用 OpenAI 最强模型的机会，或保存对话，才需要连接账号。**聊天要保存到你的 ChatGPT 历史，必须登录账号。**
4. **Siri 会先问你**：官方说，Siri 在把问题发给 ChatGPT 之前会先询问你，发送文档或照片也一样。
5. **看不到 ChatGPT 选项，先查语言**：官方说，确认你的 **Siri 语言**和**设备语言**设成了同一种、且是受支持的语言，支持情况看 Apple 的 apple.co/ai-support。
6. **可以随时关掉**：同一个设置页里把 ChatGPT 关闭即可。

## 一、怎么设置

按官方步骤：

1. 打开**设置**；
2. 点 **Apple Intelligence 与 Siri**；
3. 点 **ChatGPT**，再点 **Set Up**；
4. 二选一：
   - **不用账号**：点 **Enable ChatGPT**。之后如果想登录，到 **设置 → Apple Intelligence 与 Siri → ChatGPT → Sign In**；
   - **用已有账号**：点 **Use ChatGPT with an Account**，按屏幕提示操作。

![官方截图：iOS 设置里的「ChatGPT Extension」页面，Use ChatGPT 旁有 Set Up 按钮，下方有 Siri 的 Setup Prompts 开关（英文界面）](seed:g899-siri-extension-setup.jpg)
*图片来源：[OpenAI 帮助中心：Setting up ChatGPT with Apple Intelligence](https://help.openai.com/en/articles/10269382-setting-up-chatgpt-with-apple-intelligence)*

**在 Mac 上**：官方说在 **系统设置（System Settings）→ Apple Intelligence 与 Siri → ChatGPT → Set Up**，点 **Next**，再点 **Use ChatGPT with an Account**（用账号的话），按提示完成。

**支持哪些账号**：官方说免费和付费的 ChatGPT 账号都可以连到苹果的集成，包括 Plus、Pro、Team、Enterprise 和 Edu。如果你用 Enterprise 或 Team 账号登录不了，联系你的 ChatGPT 工作区管理员。

### 怎么确认账号已连上

官方的做法：登录 ChatGPT，点头像选 **Settings → Security → Secure sign in with ChatGPT**。官方特别说明，这张说明里的截图可能与当前界面不同；在 iPhone 和 iPad 上，ChatGPT 现在使用的是「安全与登录」设置页，里面有会话、多重验证、安全密钥和通行密钥的控制。账号安全相关设置见 [/guides/chatgpt-account-security-mfa](/guides/chatgpt-account-security-mfa)。

## 二、登录账号之后

![官方截图：登录前后的 ChatGPT Extension 页面：Use ChatGPT 开关、ChatGPT Account 的 Sign In、Advanced Capabilities 的 Daily Limit、Confirm ChatGPT Requests（英文界面）](seed:g899-siri-extension-signin.jpg)
*图片来源：[OpenAI 帮助中心：Setting up ChatGPT with Apple Intelligence](https://help.openai.com/en/articles/10269382-setting-up-chatgpt-with-apple-intelligence)*

从官方截图能看到，设置页里这几块：

- **Use ChatGPT**：总开关；
- **ChatGPT Account**：**Sign In**，页面说明写的是登录后 ChatGPT 可以保留你的请求记录；
- **Advanced Capabilities**：**Daily Limit**（截图里显示 Under Limit），页面说明写的是，在达到每日上限之前可以使用 ChatGPT 的高级功能，之后的请求会使用基础版本，**最长 24 小时**；下方还有升级到 ChatGPT Plus 的入口；
- **Siri → Confirm ChatGPT Requests**：页面说明写的是，如果 ChatGPT 能帮上忙，Siri 会在向 ChatGPT 发送任何信息之前问你；**Siri 在向 ChatGPT 发送文件之前一定会请求许可**。

具体的每日额度，官方文章没有给数字，以你手机设置页里的显示为准。要了解 ChatGPT 本身的套餐和额度，见 [/guides/chatgpt-plans-comparison](/guides/chatgpt-plans-comparison)；要开通 ChatGPT Plus，可以看 [/chongzhi/chatgpt-plus](/chongzhi/chatgpt-plus)。

## 三、能让 Siri 和系统功能做什么

官方对 Apple Intelligence 里 ChatGPT 的说明：

- **Siri**：Siri 在合适的时候可以调用 ChatGPT 的能力；向 ChatGPT 发送任何问题、文档或照片前都会征求你的同意，之后 Siri 会直接把回答展示出来；
- **视觉智能（visual intelligence）**：用 ChatGPT 配合视觉智能，快速了解你周围的地点和物体；
- **写作工具**：ChatGPT 会出现在苹果系统范围的写作工具里，帮你为任何正在写的东西生成内容；用 **Compose**，还可以使用 ChatGPT 的图片工具生成各种风格的图片来配你的文字。

## 四、不想每次都确认

官方给的做法：

1. **设置 → Apple Intelligence 与 Siri**；
2. 点 **ChatGPT**；
3. 把 **Confirm ChatGPT Requests** 关掉。

也可以只在某次请求里跳过确认：让 Siri 的问题**以「Ask ChatGPT…」开头**。注意官方强调：**Siri 在向 ChatGPT 发送任何文件之前，一定会先征求你的许可**，这条不管怎么设置都不变。

## 五、怎么关掉

官方步骤：

1. 打开**设置**；
2. 点 **Apple Intelligence 与 Siri**；
3. 点 **ChatGPT**；
4. 把 ChatGPT 关掉。

如果还想**阻止 Siri 向你推荐 ChatGPT**，关掉 ChatGPT 之后，再把 **Setup Prompts** 关掉。

## 六、看不到 ChatGPT 选项怎么办

1. **检查语言**：Siri 语言和设备语言必须设成同一种、受支持的语言；支持名单看 Apple 的 apple.co/ai-support；
2. **确认 Apple Intelligence 本身可用**：官方说 Apple Intelligence 的要求和可用情况，要看 Apple 的支持页面，这部分由苹果决定；
3. **工作区和数据驻留**：官方文章还注明，Apple Intelligence 和 Xcode「Code Intelligence」**不适用于启用了数据驻留的 Enterprise 和 Edu 工作区**；
4. 仍然找不到，以 Apple 的官方说明为准，或联系苹果支持。

## 常见问题

**Q：不登录 ChatGPT 账号，能用 Siri 问 ChatGPT 吗？**
可以。官方说可以不登录账号，通过苹果的集成提问、写消息、分析图片或文档；但对话不会保存到你的 ChatGPT 历史。

**Q：怎么让对话保存到 ChatGPT 里？**
登录账号：**设置 → Apple Intelligence 与 Siri → ChatGPT → Sign In**。官方说，要把聊天保存到 ChatGPT 历史，必须登录账号。聊天记录管理见 [/guides/chatgpt-export-chat-history](/guides/chatgpt-export-chat-history)。

**Q：Siri 会不会没问我就把照片发给 ChatGPT？**
不会。官方说，Siri 会在向 ChatGPT 发送任何文件之前先请求你的许可，这一点即使关了「确认 ChatGPT 请求」也不变。

**Q：我已经装了 ChatGPT App，还要设置这个吗？**
这是两个不同的东西：ChatGPT App 是独立的应用，这里设置的是系统层面的 ChatGPT 扩展，让 Siri 和写作工具能调用它。手机 App 的使用见 [/guides/chatgpt-mobile-app-tips](/guides/chatgpt-mobile-app-tips)。

**Q：iPad 和 Mac 能用吗？**
官方说 iPhone 和 iPad 都在「设置」里设置，Mac 在「系统设置」里设置；Apple Intelligence 本身的设备要求，看 Apple 的支持页面。

**Q：不想用了怎么办？**
设置 → Apple Intelligence 与 Siri → ChatGPT，关掉它；不想让 Siri 再建议，关掉 Setup Prompts。

## 参考资料

- OpenAI 帮助中心：Setting up ChatGPT with Apple Intelligence — https://help.openai.com/en/articles/10269382-setting-up-chatgpt-with-apple-intelligence
- OpenAI 帮助中心：What is Apple Intelligence? — https://help.openai.com/en/articles/10263313-what-is-apple-intelligence
