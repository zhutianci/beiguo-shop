---
title: ChatGPT 报错 401 怎么办：先分清网页、Codex 还是 API，官方列出的四种 401 含义
slug: chatgpt-error-401
products: [chatgpt]
models: []
accountTier: FREE
excerpt: 看到 401，先分清是在 ChatGPT 网页、Codex 还是调用 API 时遇到的。官方只给 API 的 401 写了说明：认证无效、Key 不对、不在组织里、IP 不在白名单。网页版 ChatGPT 的 401 官方没有单独说明。本文按官方文档整理。
checkedOn: 2026-10-30
sources:
  - https://platform.openai.com/docs/guides/error-codes
  - https://help.openai.com/en/articles/7996703-troubleshooting-chatgpt-error-messages
verify:
  - 官方帮助中心没有收录网页版 ChatGPT 的 401 报错说明，本文对网页版只能给通用的登录与网络排查，是推断
  - 四种 401 的含义来自官方开发者文档 Error codes 页当天的写法
  - 官方没有说明 401 是否和订阅套餐有关
---

> 本文根据 OpenAI 开发者文档《Error codes》与帮助中心《Troubleshooting ChatGPT Error Messages》整理，资料核对于 2026-10-30。**官方只对 API 的 401 写了说明；网页版 ChatGPT 的 401 官方没有收录。**配图为本站整理的示意图。

## 适用于谁

- 在 chatgpt.com 或手机 App 里看到 401 的人；
- 在 Codex 里看到 401，或调用 OpenAI API 返回 401 的人。

## 结论先说

1. **401 是「认证没通过」的 HTTP 状态码。** 先看你是在哪里遇到的，处理完全不同。
2. **网页或手机版 ChatGPT**：官方没有对应说明。按登录和网络排查处理：退出重登、清缓存、关扩展、关 VPN、换网络，见 [/guides/chatgpt-login-problems](/guides/chatgpt-login-problems) 与 [/guides/chatgpt-network-error](/guides/chatgpt-network-error)。
3. **Codex**：见 [/guides/codex-401-unauthorized-error](/guides/codex-401-unauthorized-error)。
4. **调用 API**：官方列了四种 401（见下表）。
5. 官方对 API 的通用提醒：**确认用的是正确的 Key 和请求所属的组织**。

![官方列出的四种 401：Invalid Authentication、Incorrect API key provided、必须是组织成员、IP not authorized](seed:g1324-401-compare.png)
*图：本站根据 [OpenAI 开发者文档：Error codes](https://platform.openai.com/docs/guides/error-codes) 整理的示意图*

## 一、四种 API 401

- **Invalid Authentication**：认证无效。确认用的是正确的 API Key，以及发请求的组织是对的；
- **Incorrect API key provided**：Key 不正确。确认 Key 正确、清除浏览器缓存，或**新生成一个**；
- **You must be a member of an organization to use the API**：你的账号不在任何组织里。联系官方客服，或请组织管理者邀请你；
- **IP not authorized**：请求的 IP 与项目或组织配置的 **IP 白名单**不匹配。从正确的 IP 发请求，或更新白名单设置。

API Key 怎么拿、怎么用，见 [/guides/openai-api-key](/guides/openai-api-key)。其他状态码（429、500、503）的含义，官方在同一页也有说明，429 见 [/guides/openai-api-429-error](/guides/openai-api-429-error)。

## 二、按位置选做法

![看到 401：网页、Codex、API、IP 白名单、Key 丢了对应的做法](seed:g1324-401-decide.png)
*图：本站根据 [OpenAI 开发者文档：Error codes](https://platform.openai.com/docs/guides/error-codes) 整理的示意图*

Key 相当于密码，不要发给别人；怀疑泄露或不确定对不对，就新生成一个，旧的废弃（本段是常规做法，不是这页官方文档的原话）。

## 三、仍然不行

联系官方客服，附上：报错的完整原文和状态码、出现的位置（网页、Codex 还是 API）、发生时间、你已经试过的步骤。联系方式见 [/guides/chatgpt-contact-support](/guides/chatgpt-contact-support)。

## 官方没说的

- 网页版 ChatGPT 的 401，**官方没有说明**；
- 401 和**套餐、地区**的关系，官方没有说；
- 官方的 403 有专门的「国家、地区或领土不受支持」一类，那是另一种问题，见 [/guides/chatgpt-request-failed-status-403](/guides/chatgpt-request-failed-status-403)。

## 常见问题

**Q：401 是不是账号被封了？**
官方对 401 的解释都是认证、Key、组织、IP 四类，没有写账号被停用。账号被停用有单独的提示，见 [/guides/chatgpt-account-deactivated-appeal](/guides/chatgpt-account-deactivated-appeal)。

**Q：重新登录就好了，需要联系客服吗？**
不需要。

## 参考资料

- OpenAI 开发者文档：Error codes — https://platform.openai.com/docs/guides/error-codes
- OpenAI 帮助中心：Troubleshooting ChatGPT Error Messages — https://help.openai.com/en/articles/7996703-troubleshooting-chatgpt-error-messages
