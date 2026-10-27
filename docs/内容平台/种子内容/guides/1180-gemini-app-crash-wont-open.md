---
title: Gemini App 闪退、打不开怎么办：安卓、Mac、Windows 的官方设备要求、更新方法和工作资料限制
slug: gemini-app-crash-wont-open
products: [gemini]
models: []
accountTier: FREE
excerpt: Gemini App 闪退或打不开，先对照官方设备要求：安卓需要 Android 9 以上和 2 GB 内存，Mac 需要 macOS 15 和 Apple 芯片，Windows 需要 Windows 10 以上。本文整理各端要求、更新方法和不能用的情形。
checkedOn: 2026-10-27
sources:
  - https://support.google.com/gemini/answer/14579026
  - https://support.google.com/gemini/answer/17011627
  - https://support.google.com/gemini/answer/18263854
  - https://support.google.com/gemini/answer/13278668
verify:
  - 官方没有给出「Gemini App 闪退」的专门排查页，本文把官方的设备要求、更新方法、不支持的情形整理成排查清单
  - iPhone 和 iPad 的系统版本要求在官方页面的 iPhone 标签里，本文没有核对具体数字，以官方页面为准
  - Mac 版和 Windows 版的系统、内存、空间要求是官方当天的写法，之后可能提高
---

> 本文根据 Gemini Apps 帮助中心《Gemini mobile app availability》《Use the Gemini app on Mac》《Use the Gemini app for Windows》整理，资料核对于 2026-10-27。**官方没有「闪退」的专门排查页**，本文把官方的设备要求和更新方法按排查顺序排列。配图为本站整理的示意图，不是软件截图。

## 适用于谁

- Gemini 手机 App 一打开就闪退或打不开的人；
- Mac 版、Windows 版 Gemini 打不开或功能不正常的人；
- 想先确认自己的设备够不够条件的人。

## 结论先说

1. **先对照设备要求。** 安卓：Android 9 及以上、2 GB 以上内存，**不支持 Android Go**；Mac：macOS Sequoia 15.0 及以上、Apple 芯片、8 GB 内存、至少 200 MB 空间；Windows：Windows 10 及以上、8 GB 内存、至少 200 MB 空间。
2. **安卓工作资料里不能用。** 官方写明不能在 Android Work Profile 里访问 Gemini 手机 App。
3. **先更新。** Mac：打开 App，点顶部菜单 **Gemini** → **Check for Updates**，有更新点 **Install update**；Windows：打开时右下角有更新通知，点 **Restart to update**。官方说 Mac 版过期时部分功能可能不能用。
4. **账号也要符合**：年龄、账号类型、所在地区，见下文。
5. **要求都满足仍然不行**，换网络、重启设备，再发送反馈。

![Gemini App 打不开：对照官方要求](seed:g1180-app-decide.png)
*图：本站根据 [Gemini Apps 帮助中心](https://support.google.com/gemini/answer/14579026) 整理的示意图*

## 一、各端的官方要求

![Gemini 各端官方设备要求](seed:g1180-requirements-compare.png)
*图：本站根据 Gemini Apps 帮助中心整理的示意图*

补充说明：

- **手机 App**：官方说在 150 多个国家提供，要年满 13 岁（或当地规定年龄），未满 13 岁账号需要家长批准；工作或学校账号要有包含 Gemini 的方案或许可；
- **Mac 版**：下载地址是 gemini.google/mac，下载 `.dmg` 后拖到「应用程序」文件夹，需要稳定的网络；快捷键默认 `Option + Space`；
- **Windows 版**：快捷键默认 `Alt + Space`；
- **网页版**：官方支持的浏览器是 Chrome、Safari、Firefox、Opera 和 Edge。

下载入口和各端安装步骤见 [/guides/gemini-download-app-android-iphone-windows-mac](/guides/gemini-download-app-android-iphone-windows-mac)。

## 二、更新

官方只写了桌面版的更新办法（见结论第 3 条）。手机 App 到应用商店更新，官方没有给出专门步骤。更新后仍闪退，再往下排查。

## 三、账号和地区的条件

- 个人或学校账号年满 13 岁，工作账号年满 18 岁；Family Link 管理的账号目前不能访问网页版；
- 所在国家或地区要在官方支持名单内，见 [/guides/gemini-supported-countries-regions](/guides/gemini-supported-countries-regions)；
- 能打开但提示无法使用，见 [/guides/gemini-cant-access-this-service-account](/guides/gemini-cant-access-this-service-account)。

## 四、都满足，还是不行

1. 看官方状态页，见 [/guides/gemini-down-check-status-page](/guides/gemini-down-check-status-page)；
2. 重启设备、换网络，桌面版需要稳定的网络；
3. 网页版能用而 App 不能，先改用网页版继续工作；
4. 发送反馈：网页版的 **Settings & help** → **Send feedback**，可附截图。其他报错对照见 [/guides/gemini-error-messages-table](/guides/gemini-error-messages-table)。

## 常见问题

**Q：我的手机是 Android Go，怎么办？**
官方写明 Android Go 不支持 Gemini 手机 App，可以改用网页版。

**Q：iPhone 的要求是什么？**
官方页面有单独的 iPhone 标签，本文没有核对具体版本号，请以官方页面为准。

**Q：Gemini 一直转圈？**
见 [/guides/gemini-keeps-loading-no-response](/guides/gemini-keeps-loading-no-response)。

## 参考资料

- Gemini Apps 帮助中心：Gemini mobile app availability — https://support.google.com/gemini/answer/14579026
- Gemini Apps 帮助中心：Use the Gemini app on Mac — https://support.google.com/gemini/answer/17011627
- Gemini Apps 帮助中心：Use the Gemini app for Windows — https://support.google.com/gemini/answer/18263854
- Gemini Apps 帮助中心：What you need to sign in to Gemini Apps — https://support.google.com/gemini/answer/13278668
