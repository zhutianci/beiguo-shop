---
title: ChatGPT 连接器（插件 / 已连接应用）怎么用：连接 Google Drive、Gmail、Notion 等
slug: chatgpt-plugins-connected-apps
products: [chatgpt]
models: []
accountTier: FREE
excerpt: ChatGPT 的「连接器」后来叫「应用」，2026 年 7 月起又统一放进「插件（Plugins）」。本文按官方帮助中心讲清插件和应用的关系、怎么安装插件并连接 Google Drive / Gmail / Notion 等账号、权限选项怎么选、怎么断开，以及数据和隐私规则。
checkedOn: 2026-10-07
sources:
  - https://help.openai.com/en/articles/11487775-connected-apps-in-chatgpt
  - https://help.openai.com/en/articles/20001256-plugins-in-chatgpt
  - https://help.openai.com/en/articles/20001494-connecting-and-managing-app-accounts-in-chatgpt
  - https://help.openai.com/en/articles/20001495-managing-app-permissions-in-chatgpt
  - https://help.openai.com/en/articles/20001497-troubleshooting-plugins-apps-in-chatgpt
  - https://help.openai.com/en/articles/6825453-chatgpt-release-notes
verify:
  - 「插件」「安装插件」「连接」「已连接的账号」及四个权限选项的中文界面名称以实际界面为准
  - 具体某个应用（如 Notion、Gmail）在哪些套餐可用，官方只写「取决于套餐、地区和工作区」
---

> 本文根据 OpenAI 帮助中心（Connected apps in ChatGPT、Plugins in ChatGPT and Codex、Connecting and managing app accounts、Managing app permissions）和发布说明整理，资料核对于 2026-10-07；截图引用自 OpenAI 帮助中心，为英文界面。

## 适用于谁

- 想让 ChatGPT 直接读 Google Drive 里的文档、查 Gmail 邮件、找 Notion 页面的人；
- 在网上看到「连接器（Connectors）」「Apps」「插件」几个名字，搞不清是不是一回事的人；
- 担心授权给 ChatGPT 后数据安全的人。

## 结论先说

1. **名字的变迁**：最早叫 **Connectors（连接器）**，后来叫 **Apps（应用）**，2026 年 7 月 9 日起「应用目录」换成了 **Plugin Directory（插件目录）**。现在：**应用（App）** 负责连接一个外部服务（如 Google Drive、Slack）；**插件（Plugin）** 是把一个或多个应用、技能（Skills）打包好的工作流。已经连好的应用不受影响。
2. **入口**：侧边栏的 **Plugins（插件）**，或 **Settings（设置）→ Plugins**。很旧的 App 版本里仍显示为 Apps。
3. **使用**：连接后直接描述需求，ChatGPT 会在相关时自动使用；也可以在输入框里用 **@** 点名，或从 **+** 菜单选择。
4. **权限有四档**：Always ask（总是询问）、Allow read actions（允许读取）、Allow low-risk actions（允许低风险操作）、Allow all actions（允许所有操作，风险最高）。
5. **个人套餐的数据可能被用于训练**：Free、Go、Plus、Pro 在开着「为所有人改进模型」时，通过应用读取的信息可能用于训练；Business、Enterprise、Edu 默认不会。

## 步骤

### 1. 找到插件并安装

1. 点侧边栏的 **Plugins**，进入插件目录（也可以直接打开 chatgpt.com/plugins）；
2. 可以浏览 **Popular（热门）**、**New & Noteworthy（新品推荐）**，或在 **Installed（已安装）** 里找已装的；
3. 点开一个插件，看说明：它包含哪些技能和应用、需要什么设置；标着 **Desktop only** 的只能在桌面 App 用；
4. 点 **Install plugin（安装插件）**。

![插件安装卡片：左侧是插件图标和简介，右侧是「Not now」和「Install」按钮（英文界面，示例插件使用虚构数据）](seed:g115-plugin-install-card.png)
*图片来源：[OpenAI 帮助中心《Plugins in ChatGPT and Codex》](https://help.openai.com/en/articles/20001256-plugins-in-chatgpt)*

部分插件带有 **OpenAI Verified（OpenAI 已验证）** 标志，表示经过 OpenAI 的质量审核，但不能代替你所在公司的安全审查。

### 2. 连接你的账号

安装后可能会自动进入连接流程，没有的话：

1. 打开 **Settings → Plugins**，选中对应插件或应用；
2. 点 **Connect（连接）**；
3. 在服务商的授权页面登录**真正有那些资料的账号**（例如工作文件在公司 Google 账号里，就别连个人账号）；
4. 看清要授权的服务和权限，确认。

几个常见提示：

- **All permissions are required（需要全部权限）**：点 **Reconnect（重新连接）**，把要求的权限都勾上；
- 连接 Google 时提示需要所有权限：点 **Try again**，在 Google 授权页选 **Select all**；只想连部分 Google 服务，可以在 ChatGPT 里点 **Select fewer apps**；
- 公司的 Google、Microsoft 账号可能还需要**对方系统的管理员**批准，这个管理员不一定是 ChatGPT 工作区管理员。

2026 年 9 月起，很多应用支持**连接多个账号**（比如个人和工作的 Gmail 同时连），在应用详情里点 **Connect another account（连接另一个账号）**。

### 3. 在对话里使用

连接好以后直接说需求，例如：

```
在 Google Drive 里找到「第三季度项目简介」，总结下一步要做的事，列成表格。
```

```
@Gmail 找出这周所有来自供应商的邮件，按是否需要我回复分成两组。
```

ChatGPT 在读取信息或执行操作前可能会请求你批准，看清再点。部分应用还能作为深度研究的资料来源，或者在对话里显示地图、卡片、文档等交互内容。

### 4. 设置权限：什么时候需要你确认

在应用的设置里可以选择：

| 选项 | 含义 |
| --- | --- |
| Always ask（总是询问） | 每次读取或操作前都要你确认 |
| Allow read actions（允许读取） | 读取信息不再询问，写入操作仍询问 |
| Allow low-risk actions（允许低风险操作） | 低风险操作直接执行，敏感操作仍需批准或被拒绝 |
| Allow all actions（允许所有操作） | 支持的操作可能不经确认直接执行，风险最高，仅部分应用 / 账号可选 |

注意：权限选项只决定「什么时候问你」，**不会**给应用新的访问范围。应用能碰到哪些数据，取决于你连接时的授权和工作区设置。

### 5. 断开连接

**Settings → Plugins** → 选中应用 → 在 **Connected accounts（已连接的账号）** 里打开账号的 **•••** 菜单 → **Disconnect（断开连接）**。断开后不再有新的访问，但以前用到应用数据的对话不会被删除。卸载插件可能会断开通过它连接的所有账号，确认前看清提示。

## 数据和隐私

- 开启应用后，应用可能会读取对话中的相关上下文来完成请求；开着记忆时，也可能用到相关记忆。
- 应用能看到访问网站时通常会提供的基础信息，如 IP 地址、设备和浏览器类型、语言和地区设置、大致位置（城市级别）。
- 共享给应用的数据按**该应用自己的服务条款和隐私政策**处理，启用前会显示。
- 训练：Business、Enterprise、Edu 默认不用连接器数据训练；个人套餐开着「为所有人改进模型」时可能会用，关闭方法见 [/guides/chatgpt-data-controls-privacy](/guides/chatgpt-data-controls-privacy)。
- 应用的使用可能计入套餐额度，也受应用服务商自己的限制。

## 常见问题

**Q：应用显示「Disabled by admin（已被管理员禁用）」？**
你在公司工作区里，需要请管理员在管理后台的 Plugins 里开启。个人账号遇到这个提示，先查应用要求，持续出现就联系客服。

**Q：插件和 Skills 是什么关系？**
插件可以包含技能，也可以只包含技能而不连接任何外部服务。Skills 的用法见 [/guides/chatgpt-skills](/guides/chatgpt-skills)。

**Q：能自己做一个插件吗？**
可以。在插件目录安装 **Plugin Creator**，然后在对话里 @plugin-creator 描述你想要的插件。价格页显示 Free 不能创建和分享插件，Go 及以上可以。

**Q：以前的 GPTs 怎么办？**
OpenAI 计划让自定义 GPTs 退役并迁移到插件，见 [/guides/chatgpt-gpts-retirement](/guides/chatgpt-gpts-retirement)。

## 参考资料

- OpenAI 帮助中心：Connected apps in ChatGPT — https://help.openai.com/en/articles/11487775-connected-apps-in-chatgpt
- OpenAI 帮助中心：Plugins in ChatGPT and Codex — https://help.openai.com/en/articles/20001256-plugins-in-chatgpt
- OpenAI 帮助中心：Connecting and managing app accounts in ChatGPT — https://help.openai.com/en/articles/20001494-connecting-and-managing-app-accounts-in-chatgpt
- OpenAI 帮助中心：Managing app permissions in ChatGPT — https://help.openai.com/en/articles/20001495-managing-app-permissions-in-chatgpt
- OpenAI 帮助中心：Troubleshooting plugins & apps in ChatGPT — https://help.openai.com/en/articles/20001497-troubleshooting-plugins-apps-in-chatgpt
- ChatGPT Release Notes（2026-07-09 插件目录取代应用目录、2026-09-17 多账号）— https://help.openai.com/en/articles/6825453-chatgpt-release-notes
