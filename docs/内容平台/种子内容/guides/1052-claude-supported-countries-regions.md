---
title: Claude 支持哪些国家和地区：官方名单、香港和台湾在不在、「不支持」指什么
slug: claude-supported-countries-regions
products: [claude]
models: []
accountTier: FREE
excerpt: Claude 支持哪些国家和地区？按 Anthropic 官方 Supported Regions Policy 核对：中国大陆、香港、澳门不在名单里，台湾在；官方说的「不支持」包括所在地、机构注册地和控股方三种情形；名单变化时去哪看最新版本。
checkedOn: 2026-10-24
sources:
  - https://www.anthropic.com/supported-countries
  - https://support.claude.com/en/articles/8461763-where-can-i-access-claude
verify:
  - 2026-10-24 核对的官方名单里，中国大陆、香港、澳门没有列出，Taiwan 列出；官方页面标注的生效日期是 2026-11-12，而本站 10-19 的另两篇文章核对的是当时的版本，名单随时可能调整，务必以官方页面为准
  - 帮助中心《Where can I access Claude》页在 2026-10-24 抓取时，只返回国家列表，没有写到旅行、账号处理等细节，本文不对这些作推断
  - 本文只列官方名单和官方对「不支持」的定义，不写任何绕过办法
---

> 本文根据 Anthropic 官方《Supported Regions Policy》（anthropic.com/supported-countries）与帮助中心《Where can I access Claude?》整理，资料核对于 2026-10-24。名单会更新，**请以官方页面为准**；本文只引用官方名单，不涉及也不建议任何绕过地区限制的做法。图为本站整理的示意图。

## 适用于谁

- 搜「claude 为什么不支持中国」「claude 能在香港用吗」，想先弄清官方规则的人；
- 想知道自己所在地区、或公司注册地是否在官方名单里的人；
- 登录或注册时被提示「不可用」，想核对官方依据的人。

登录、注册遇到问题时的逐条排查，见 [/guides/claude-cant-login-or-use](/guides/claude-cant-login-or-use) 和 [/guides/claude-how-to-sign-up](/guides/claude-how-to-sign-up)。

## 结论先说

1. **官方的规则是「名单制」**：官方页面写明，**没有列出的地区一律不支持**。判断你能不能用，看名单，而不是看某个网站打得开打不开。
2. **2026-10-24 核对的名单里**：中国大陆、香港、澳门**没有**列出；台湾（Taiwan）**列出**。新加坡、日本、韩国、马来西亚、泰国、越南、美国、英国、加拿大、澳大利亚等也在名单里。名单一共列有一百多个国家和地区（官方页面按字母顺序从 Albania 排到 Zimbabwe）。
3. **覆盖范围很广**：官方说明这份政策适用于 Anthropic 自家的应用（Claude.ai、Claude Code、Cowork）、API 和开发者平台，以及通过云平台和授权经销商提供的 Claude 模型。
4. **「不支持」不只是看人在哪**：官方还把「机构注册地 / 总部所在地」和「谁控股」纳入了规则，见下文第二节。
5. **名单会变，也有生效日期**：官方页面在 2026-10-24 显示的生效日期是 2026-11-12，具体哪些内容是新增、哪些是沿用，以官方页面的说明为准。我们建议用到时再查一次。

![几个常被问到的地区：在不在官方名单](seed:g1052-region-list-highlights.png)
*图：本站根据 [Anthropic Supported Regions Policy](https://www.anthropic.com/supported-countries) 整理的示意图（只摘部分地区，完整名单见官方页面）*

## 一、官方名单怎么看

官方名单页的做法是：把支持的国家和地区按英文字母顺序列出来，没有列在里面的，就是不支持。名单里还有一条通则：**某个受支持国家的属地和附属领土也一并支持**，官方举的例子是美国的波多黎各。名单里也有个别带限定条件的条目，例如乌克兰，官方写明克里米亚以及顿涅茨克、赫尔松、卢甘斯克、扎波罗热地区除外。

帮助中心的《Where can I access Claude?》也有一份列表，2026-10-24 抓取到的内容同样是按字母顺序列出的国家和地区，没有额外说明。要核对自己的地区，最稳的办法是**打开官方名单页，在页面里搜索你所在国家或地区的英文名**。

以下是中文读者常问到的几项，来自上述名单（2026-10 查询）：

| 地区 | 是否在名单里 |
| --- | --- |
| 中国大陆 | 不在 |
| 香港 | 不在 |
| 澳门 | 不在 |
| 台湾 | 在 |
| 新加坡、日本、韩国 | 在 |
| 马来西亚、泰国、越南 | 在 |
| 美国、英国、加拿大、澳大利亚 | 在 |

## 二、官方说的「不支持」，包括哪几种情况

![官方说「不支持」，指的是哪几种情况](seed:g1052-unsupported-cases.png)
*图：本站根据 [Anthropic Supported Regions Policy](https://www.anthropic.com/supported-countries) 整理的示意图*

官方页面对名单之外的地区，写了三类情形，都属于不支持：

1. **人当时在名单外的地区**：包括原本属于受支持机构的用户和人员，只要使用时人在不支持的地区，就属于不支持；
2. **机构的注册地或总部在名单外**：这类机构及其用户、人员不受支持，**即使这些人身处名单内的地区**；
3. **机构由名单外地区的主体多数持股或控制**：不管是直接还是间接，同样不支持，其用户和人员也一样，即使人身处名单内的地区。

所以对个人来说，第一类最直接；对公司、团队来说，第二、三类同样重要：公司注册在哪里、由谁控股，也会影响能不能使用，而不仅仅是员工当时坐在哪个城市。官方对这些条文的具体适用方式没有在页面里展开，如果你的情况比较特殊（比如跨境团队、控股结构复杂），应该直接向官方确认，而不是自己判断。

## 三、如果我所在的地区不在名单里

本文不提供、也不建议任何绕过地区限制的办法。官方的立场很明确：名单外的地区不能使用，创建账号时就会被拦住（注册要求见 [/guides/claude-how-to-sign-up](/guides/claude-how-to-sign-up)）。合规的选择包括：

- 以官方名单为准，确认自己所在地区的情况；
- 如果是机构使用，向 Anthropic 官方或授权经销商咨询；
- 在名单内的地区生活、工作时，用官方支持的方式注册和使用；
- 如果只是想了解 AI 工具，也可以看看其他模型的本站教程，例如 [/guides/chatgpt-vs-claude](/guides/chatgpt-vs-claude) 里的对比。

## 常见问题

**Q：香港能用 Claude 吗？**
按 2026-10-24 核对的官方名单，香港没有列出，属于不支持的地区。名单可能变化，请看官方页面。

**Q：台湾能用吗？**
台湾（Taiwan）在 2026-10-24 的官方名单里。

**Q：名单里有，但网页提示不可用怎么办？**
先看 [/guides/claude-cant-login-or-use](/guides/claude-cant-login-or-use) 的排查步骤。官方帮助中心也写明了账号被停用的申诉渠道，见 [/guides/claude-account-disabled-appeal](/guides/claude-account-disabled-appeal)。

**Q：名单多久更新一次？**
官方没有给出固定频率，页面上写有生效日期，用到时去看一眼最稳妥。

**Q：Claude Code、API 也受这个名单限制吗？**
官方说明政策覆盖 Claude.ai、Claude Code、Cowork、API 和开发者平台，以及云平台和授权经销商提供的 Claude 模型。

**Q：想开通 Claude 会员，需要注意什么？**
先确认自己所在地区在官方名单里。符合条件、需要开通的，可以看本站的 [/chongzhi/claude-pro](/chongzhi/claude-pro)。

## 参考资料

- Anthropic：Supported Regions Policy — https://www.anthropic.com/supported-countries
- Claude 帮助中心：Where can I access Claude? — https://support.claude.com/en/articles/8461763-where-can-i-access-claude
