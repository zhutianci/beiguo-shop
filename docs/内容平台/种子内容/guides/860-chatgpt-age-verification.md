---
title: ChatGPT 年龄验证怎么回事：为什么要验证、被判成青少年怎么解除、要准备什么证件
slug: chatgpt-age-verification
products: [chatgpt]
models: []
accountTier: FREE
excerpt: ChatGPT 突然要求年龄验证，或者成年人被划进「ChatGPT for Teens」青少年体验？本文按 OpenAI 帮助中心讲清年龄预测是怎么判断的、在设置的哪里看自己的年龄类别、满 18 岁怎么通过 Persona 验证解除限制、需要什么证件、几条报错的含义，以及官方对证件和自拍数据的处理方式。
checkedOn: 2026-10-13
sources:
  - https://help.openai.com/en/articles/12652064-age-prediction-in-chatgpt
  - https://help.openai.com/en/articles/8411987-why-am-i-being-asked-to-verify-my-age
  - https://help.openai.com/en/articles/9047784-my-account-was-deactivated-because-i-didnt-verify-my-age-in-time
  - https://help.openai.com/en/articles/8958977-troubleshooting-deleted-or-deactivated-account-errors
verify:
  - Persona 接受的证件类型因国家而异，官方只给了常见示例；中国大陆证件是否在可选范围内官方未说明
  - 强制年龄验证目前官方文章点名的只有意大利，其他地区是否有类似要求以账号内的通知为准
---

> 本文根据 OpenAI 帮助中心《Age prediction in ChatGPT》《Why am I being asked to verify my age?》等文章整理，资料核对于 2026-10-13。本文只说明官方的验证流程；未成年人请按官方规则使用，不要尝试冒用他人证件。配图为本站整理的示意图。

## 适用于谁

- ChatGPT 弹出年龄验证通知，不知道为什么、要不要做的人；
- 明明已经成年，却发现回答变得保守、部分功能受限，怀疑被判成未成年的人；
- 想知道年龄验证要交什么材料、数据会不会被 OpenAI 留存的人；
- 错过验证期限、账号进不去的人。

## 结论先说

1. ChatGPT 里和年龄有关的其实是**两件事**：一是**年龄预测**——系统根据使用信号判断账号可能属于未满 18 岁的人，自动开启「ChatGPT for Teens（青少年体验）」；二是**强制年龄验证**——部分地区依法要求，官方文章点名的是意大利。
2. **被预测为未成年，账号不会被停用**，只是多了一层保护、少了部分功能。你不验证也能继续用。
3. **成年人被误判**：到 **Settings（设置）→ Account（账号）→ Age（年龄）** 查看年龄类别；如果有 **Verify age（验证年龄）** 选项，点它，按第三方机构 **Persona** 的流程用实时自拍或政府签发的证件完成验证。
4. **不是每个账号都有 Verify age**：已被识别为 18 岁以上、或已经验证过的账号，不会显示这个选项。
5. **OpenAI 拿不到你的证件和自拍**，只收到出生日期或年龄判断结果；Persona 在验证后 7 天内删除你上传的证件和自拍。

![ChatGPT 年龄预测与强制年龄验证的区别对照图](seed:g860-prediction-vs-verification.png)
*图：本站根据 [OpenAI 帮助中心：Age prediction in ChatGPT](https://help.openai.com/en/articles/12652064-age-prediction-in-chatgpt) 与 [Why am I being asked to verify my age?](https://help.openai.com/en/articles/8411987-why-am-i-being-asked-to-verify-my-age) 整理的示意图*

## 一、年龄预测是怎么判断的

官方说明，系统会参考与账号相关的多种信号，例如：

- 你谈论的大致话题；
- 使用 ChatGPT 的时间段；
- 账号的使用方式和时间规律；
- 账号存在了多久。

并且特别说明：**即使注册时填过出生日期**，年龄预测作为额外的安全检查，仍然可能把账号判定为适用青少年体验。官方也承认「没有系统是完美的」，会有误判。

被划入青少年体验后的变化：

- 对敏感或不适龄的内容更谨慎，比如血腥暴力画面、可能诱导危险行为的网络挑战、某些类型的角色扮演、宣扬极端身材标准的内容等；
- 部分功能有限制；
- **账号保持正常可用**，照常可以学习、创作、提问；
- 官方说明不会在这类账号里展示广告。

## 二、查看自己的年龄类别

1. 打开 **Settings（设置）**；
2. 选择 **Account（账号）**；
3. 查看 **Age（年龄）** 一项。

这里显示的是**年龄类别**（未满 18 岁 / 18 岁及以上），不能在这里修改出生日期。

## 三、成年人解除青少年体验：验证步骤

![成年用户通过 Persona 验证年龄的步骤示意图](seed:g860-verify-age-steps.png)
*图：本站根据 [OpenAI 帮助中心：Age prediction in ChatGPT](https://help.openai.com/en/articles/12652064-age-prediction-in-chatgpt) 整理的示意图*

1. 在网页版、iOS 或安卓 App 登录 ChatGPT；
2. 打开 **Settings → Account**；
3. 查看 **Age**，如果有 **Verify age**，点它（官方也给了直达地址 `chatgpt.com/verify_age`）；
4. 按 **Persona** 的指引完成验证。

Persona 可能要求以下一种或两种（因国家而异）：

- **实时自拍**：用手机或电脑摄像头当场拍一张脸部照片。电脑没有摄像头可以换设备；完全无法自拍的，可以改用证件；
- **政府签发的证件**：常见的有护照、驾照、身份证、居留许可、工作许可卡等，可选项会在验证过程中显示。

证件要满足：政府签发、在有效期内且清晰可读、能看到**全名、出生日期和本人照片**。官方说明**不需要露出证件号码**，上传前可以把号码遮住。

验证通过后，ChatGPT 会移除青少年保护，生效可能需要一点时间。如果验证结果显示账号应当留在青少年体验里，保护会保持或恢复。

## 四、强制年龄验证与账号被停用

部分地区依法要求用户验证年龄后才能继续使用。官方目前写明的是**意大利**：账号正常时通过 Persona 验证；如果通知里给了期限而你错过了，访问可能受限，直到完成验证。

因为错过期限被停用的账号：

- 尝试登录，在停用页面点 **Verify your age**；
- 使用账号对应的邮箱（Apple 登录选了隐藏邮件地址的，用那个中转地址）；
- 18 岁以上本人验证；13–17 岁需要家长或监护人用该用户的邮箱完成；
- 提交后处理可能需要几天，不一定马上收到确认邮件；页面或上传失败时，稍后再试或换一份有效的未过期证件。

账号停用的其他原因和申诉方式见 [/guides/chatgpt-account-deactivated-appeal](/guides/chatgpt-account-deactivated-appeal)。

## 五、验证失败的几条提示

![ChatGPT 年龄验证常见提示与对应做法对照图](seed:g860-verification-messages.png)
*图：本站根据 [OpenAI 帮助中心：Why am I being asked to verify my age?](https://help.openai.com/en/articles/8411987-why-am-i-being-asked-to-verify-my-age) 整理的示意图*

- **「Unfortunately, your age could not be verified. Please try again later.」**：官方解释是开始了验证但中途取消。按页面提示重新做一遍；
- **「Unfortunately, your age could not be verified. Please contact support.」**：可能已经达到失败次数上限，账号可能因此受限。联系客服，见 [/guides/chatgpt-contact-support](/guides/chatgpt-contact-support)；
- **设置里没有 Verify age**：账号已被识别为 18 岁以上或已验证过，不需要再验证。

## 六、隐私：证件和自拍去哪了

- 验证由第三方机构 Persona 处理，**OpenAI 不会收到你的证件或自拍**；
- OpenAI 只收到确定账号体验所需的年龄相关信息，例如是否已验证满 18 岁、出生日期；
- Persona 在验证完成后 **7 天内**删除你上传的证件或自拍；
- 验证过年龄之后，OpenAI **不再对该账号运行年龄预测**；
- 对年龄预测有疑问或想提出异议，官方给的联系邮箱是 `privacy@openai.com`。

## 常见问题

**Q：我成年了，不想交证件，可以不验证吗？**
可以。官方说明年龄预测**不要求**你验证才能继续使用，只是会保留青少年保护。只有收到单独的「强制年龄验证」通知时，才需要按期限完成。

**Q：注册时填错了生日，能改吗？**
设置里的 Age 只显示类别，不能编辑出生日期。官方文章没有给出自助修改生日的入口；需要的话走年龄验证或联系客服。

**Q：家长能看到孩子的聊天内容吗？**
官方说明：通过家长控制关联的家长或监护人可以管理部分设置，但**不能查看孩子的对话**。

**Q：孩子满 18 岁后会怎样？**
系统判定已满 18 岁，或经验证的出生日期显示已满 18 岁后，账号会自动移出青少年体验。

## 参考资料

- OpenAI 帮助中心：Age prediction in ChatGPT — https://help.openai.com/en/articles/12652064-age-prediction-in-chatgpt
- OpenAI 帮助中心：Why am I being asked to verify my age? — https://help.openai.com/en/articles/8411987-why-am-i-being-asked-to-verify-my-age
- OpenAI 帮助中心：My account was deactivated because I didn't verify my age in time — https://help.openai.com/en/articles/9047784-my-account-was-deactivated-because-i-didnt-verify-my-age-in-time
- OpenAI 帮助中心：Troubleshooting "deleted or deactivated" account errors — https://help.openai.com/en/articles/8958977-troubleshooting-deleted-or-deactivated-account-errors
