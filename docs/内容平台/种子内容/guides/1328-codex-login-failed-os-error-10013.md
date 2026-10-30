---
title: Codex 登录失败「Failed to start login server」「os error 10013」怎么办：官方的设备码登录与其他备选
slug: codex-login-failed-os-error-10013
products: [codex, chatgpt]
models: []
accountTier: PLUS
excerpt: Codex 命令行用 ChatGPT 账号登录时报 Failed to start login server、os error 10013？官方文档没有收录这两句，但写明：本机回调被拦截或在远程、无界面环境时，应改用设备码登录（codex login --device-auth）。本文按官方顺序整理。
checkedOn: 2026-10-30
sources:
  - https://developers.openai.com/codex/auth
  - https://developers.openai.com/codex/cli/reference
verify:
  - 官方文档没有收录「Failed to start login server」「os error 10013」这两句报错，本文把它们归入官方说的「本机网络配置拦截了本地回调」这一类，是推断
  - 设备码登录官方标注为 beta（测试版），可用性取决于账号和工作空间设置
  - 官方文档写的默认本地回调地址是 localhost:1455，具体占用情况以你的系统为准，本文没有核实 10013 在不同系统上的确切含义
---

> 本文根据 OpenAI Codex 官方文档的认证页与命令行参考整理，资料核对于 2026-10-30。**官方文档没有收录「Failed to start login server」和「os error 10013」**，只写了本地回调被拦截时怎么登录。配图为本站整理的示意图。

## 适用于谁

- 在 Windows 等环境里运行 `codex login`，浏览器登录这一步就失败的人；
- 在远程服务器、WSL 或没有桌面的环境里登录 Codex 的人；
- 公司网络里登录 Codex 失败的人。

## 结论先说

1. **官方对这类问题的表述**：用 ChatGPT 账号登录 Codex CLI 时，有两种情况浏览器登录界面可能不能用：**在远程或无界面环境中运行**，或**本机的网络配置拦截了 Codex 用来把登录令牌传回命令行的本地回调**。
2. **首选办法：设备码登录（beta）。** 在交互登录界面选 **Sign in with Device Code**，或直接运行 `codex login --device-auth`，在浏览器里打开给出的链接并登录，再输入一次性验证码。
3. **前提**：要先**开启设备码登录**，个人账号在 ChatGPT 的**安全设置**里开，工作空间由管理员在权限里开。
4. **备选**：在有浏览器的机器上完成登录，把缓存的凭据文件复制到无界面的机器上；或者用 SSH 把 Codex 的本地回调端口转发出去（官方文档写的默认地址是 localhost:1455）。
5. **公司网络用了自己的根证书**：官方提供环境变量 `CODEX_CA_CERTIFICATE` 来指定根证书文件。

![Codex 浏览器登录失败：开启设备码、选择设备码、codex login --device-auth、打开链接、输入验证码](seed:g1328-codex-device-auth-steps.png)
*图：本站根据 [OpenAI Codex 文档：Authentication](https://developers.openai.com/codex/auth) 整理的示意图*

## 一、按场景选办法

![Codex 登录不了：报错、远程环境、SSH 转发、设备码不可用、公司根证书、联系客服](seed:g1328-codex-login-decide.png)
*图：本站根据 [OpenAI Codex 文档：Authentication](https://developers.openai.com/codex/auth) 整理的示意图*

- **远程或无界面**：先试设备码；设备码不可用，再用「复制缓存凭据」：在能打开浏览器的机器上执行 `codex login`，把 `~/.codex/auth.json` 复制到无界面机器的同一路径；
- **能做端口转发**：用 `ssh -L 1455:localhost:1455 user@remote`，把本机的 1455 端口转发到远程，再用标准的浏览器登录；
- **设备码选项不见了**：说明账号或工作空间没有开启，去 ChatGPT 的安全设置或让管理员开；
- **命令行参考里的补充**：`codex login` 可以用 ChatGPT OAuth、设备码、API 密钥或标准输入传入的访问令牌来认证，其中 `--device-auth` 的意思是使用设备码流程，而不是弹出浏览器窗口。

凭据文件含有登录凭据，复制和保存时要当密码对待，不要发给别人。

## 二、相关的其他登录问题

- 令牌交换失败：见 [/guides/codex-token-exchange-failed-login-error](/guides/codex-token-exchange-failed-login-error)；
- 登录后发不出消息或连不上：见 [/guides/codex-cannot-sign-in-send-message-connect](/guides/codex-cannot-sign-in-send-message-connect)；
- 返回 401：见 [/guides/codex-401-unauthorized-error](/guides/codex-401-unauthorized-error)；
- 命令行的安装与更新：见 [/guides/codex-cli-install-update](/guides/codex-cli-install-update)，入门见 [/guides/codex-getting-started](/guides/codex-getting-started)。

在桌面应用里用 Codex 时，官方说可能还会要求验证手机号，见 [/guides/chatgpt-sign-up-need-phone-number](/guides/chatgpt-sign-up-need-phone-number)。

## 三、仍然不行

联系官方客服，附上完整的报错原文、系统和 Codex 版本、你已经试过的办法。联系方式见 [/guides/chatgpt-contact-support](/guides/chatgpt-contact-support)。想了解会员，可以看 [/chongzhi/chatgpt-plus](/chongzhi/chatgpt-plus)，但登录失败和套餐无关。

## 官方没说的

- 「os error 10013」**是什么原因**，官方文档没有写；
- **哪些软件**会拦截本地回调，官方只说「本机的网络配置」；
- 设备码登录何时**结束测试**，官方没有说。

## 常见问题

**Q：换端口行不行？**
官方文档只写了默认的本地回调地址，没有写怎么改端口；官方给的办法是设备码、复制缓存和 SSH 转发。

**Q：设备码登录安全吗？**
官方把它列为这类场景的首选办法，具体的安全说明以官方认证文档为准。

## 参考资料

- OpenAI Codex 文档：Authentication — https://developers.openai.com/codex/auth
- OpenAI Codex 文档：CLI reference — https://developers.openai.com/codex/cli/reference
