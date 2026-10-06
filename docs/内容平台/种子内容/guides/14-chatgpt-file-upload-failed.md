---
title: ChatGPT 上传文件失败怎么办：文件大小限制、支持格式与常见报错
slug: chatgpt-file-upload-failed
products: [chatgpt]
models: []
accountTier: FREE
excerpt: ChatGPT 上传文件失败、卡住、提示未知错误或「上传已达上限」？本文按官方帮助中心整理文件大小与次数限制、支持的格式、PDF 读不出来的原因，以及一步步的排查顺序。
checkedOn: 2026-10-07
sources:
  - https://help.openai.com/en/articles/8555545-file-uploads-faq
  - https://help.openai.com/en/articles/20001052-file-storage-and-library-in-chatgpt
  - https://help.openai.com/en/articles/7996703-troubleshooting-chatgpt-error-messages
  - https://help.openai.com/en/articles/8437071-data-analysis-with-chatgpt
  - https://help.openai.com/en/articles/9275245-chatgpt-free-tier-faq
  - https://help.openai.com/en/articles/6825453-chatgpt-release-notes
  - https://openai.com/academy/working-with-files
  - https://chatgpt.com/pricing
  - https://status.openai.com/
  - https://www.pcworld.com/article/3097976/chatgpt-just-added-a-locker-for-file-uploads.html
verify:
  - File Uploads FAQ 写「Free 每天 3 次上传、所有用户每 3 小时最多 80 个文件」，但 Free 套餐 FAQ 只写「有单独限额」；以 FAQ 原文为准，上线前再看一次是否更新
  - 存储上限两处写法不同：File Uploads FAQ 写每位用户 25GB，Library 文章写 Free 500MB / Go 4GB / Plus 20GB / Pro 100GB（2026-05 起的新规则），正文以 Library 文章为主
  - PDF 里的图片：FAQ 称除 Enterprise 的「视觉检索」外只提取文字、丢弃图片，需确认对当前个人套餐是否仍成立
  - 「发生未知错误」等中文报错文案以实际界面为准
---

> 本文根据 OpenAI 帮助中心（File Uploads FAQ、Library、错误排查等文章）和发布说明整理，核对日期 2026-10-07；截图引用自 OpenAI 官方教程和 PCWorld 并注明出处。限制数字只列官方写明的，官方会调整，以帮助中心为准。

## 适用于谁

- 在 ChatGPT 里上传 PDF、Word、Excel、图片时，遇到「上传失败」「发生未知错误」「上传已达上限」或进度条一直卡住的人；
- 想知道 ChatGPT 能不能读 PDF、文件最大能传多大、一次能传几个的人；
- Free 用户和 Plus 用户都适用，限额不同的地方会单独说明。

## 结论先说

1. **先看是不是超限。** 单个文件硬上限 512MB；文本和文档类每个文件最多 200 万 token；表格约 50MB；图片每张 20MB。上传次数也有限：Free 每天 3 次，所有用户每 3 小时最多 80 个文件（高峰期可能下调）。
2. **再看文件本身。** 扫描版 PDF、带密码的文件、整页是图片的表格，经常「传上去了但读不出来」。
3. **最后排查环境。** 刷新、换无痕窗口、停用浏览器扩展、换网络，并去 status.openai.com 看有没有故障。

## 一、官方限制一览

下表数字来自 OpenAI 帮助中心 File Uploads FAQ 和 Library 文章（2026-10 版本）：

| 项目 | 官方限制 |
| --- | --- |
| 单个文件 | 512MB（硬上限） |
| 文本 / 文档类 | 每个文件最多 200 万 token（表格不受此限） |
| CSV / 表格 | 约 50MB，视每行大小而定 |
| 图片 | 每张 20MB |
| 上传频率 | 每 3 小时最多 80 个文件；Free 每天 3 次；高峰期可能调低 |
| 一条消息 | 网页版最多 20 个文件（2026 年 2 月起，之前是 10 个） |
| 项目文件 | Free 5 个 / Go、Plus 25 个 / Pro、Business、Enterprise、Edu 40 个 |
| 文件库存储 | Free 500MB / Go 4GB / Plus、Business 20GB / Pro 100GB |

几个容易误会的点：

- **「上传频率」和「存储空间」是两种限制。** 前者是滚动计算的次数，后者是文件库（Library）里累计占用的空间。官方说明：ChatGPT 目前**不显示**滚动上传次数还剩多少；存储用量可以在 **设置 → 存储** 里查看。
- **上传失败也可能计入次数。** 官方在「upload limit reached」排查里提到，失败的上传尝试有时会算进上传频率。
- 价格页上 Free 的文件上传标注为「有限（Limited）」，Go、Plus、Pro 为「有」；具体额度以帮助中心为准。如需更高的上传额度，可以了解 Plus：[/chongzhi/chatgpt-plus](/chongzhi/chatgpt-plus)。

## 二、支持哪些格式

官方 FAQ 的说法是：支持文本、表格、演示文稿和文档类的常见扩展名。OpenAI 官方教程列举了 CSV、XLSX、PDF、DOCX、JPEG、PNG、TXT 等；数据分析文章还列了 .xls、.json、.xml、.yaml、.md。2026 年 2 月的更新又扩充了代码、日志、配置文件等文本格式。具体可用格式会因模型、套餐和工作区设置而不同。

上传方法：点输入框左侧的 **「+」→「添加照片和文件」**（官方截图中 Mac 网页版的快捷键是 ⌘U），也可以直接把文件拖进对话框。

![ChatGPT 输入框的「+」菜单，第一项是「Add photos & files（添加照片和文件）」，下面还有创建图片、深度研究、网页搜索等（英文界面）](seed:g14-add-files-menu.png)
*图片来源：[OpenAI 官方教程《Working with files in ChatGPT》](https://openai.com/academy/working-with-files)*

## 三、ChatGPT 能读 PDF 吗？为什么读不出来

能读，但要分情况。按官方 FAQ：

- **普通（有文字层的）PDF**：ChatGPT 会提取其中的数字文字来理解。
- **PDF 里的图片**：除 ChatGPT Enterprise 支持 PDF「视觉检索」外，其他套餐只做文字检索，会**提取文字、丢弃图片**。
- **扫描件、拍照转的 PDF、版式复杂的文件**：数据分析文章写明，ChatGPT 可能无法可靠提取图片型表格和扫描文件里的准确数值；需要精确数字时，改传表格或文字版文件。

所以遇到「ChatGPT 无法读取 PDF」「读出来是空的 / 乱的」，先确认这个 PDF 能不能在电脑上选中复制文字。不能的话，就是图片型 PDF。可以先用自己的软件转成文字版，或把关键页截图单独发送（图片按图片处理）。

另外，文件上传成功也不代表整份都被分析了。官方说明文件可能过大、过于复杂、图片过多或结构混乱，导致分析不完整；这时可以指定要看的页、表、列，或者把文件拆小。

## 四、按顺序排查

### 1. 看提示文字

- **「upload limit reached / 已达上传上限」**：按官方建议，先确认登录的是对的账号和套餐；记住滚动频率（每 3 小时 80 个）和存储空间是两种限制；失败的尝试也可能算次数。等一段时间再试，或在 设置 → 存储 / 文件库 里删掉不需要的旧文件释放空间。
- **文件太大**：对照上表压缩、拆分，或把 Excel 另存为 CSV、删掉无关的工作表。
- **「Something went wrong / 出错了」、未知错误**：这是通用错误，可能是服务器临时问题，也可能是本地环境问题，继续往下排查。

### 2. 换个干净环境

OpenAI 错误排查文章给出的通用步骤：

1. 刷新页面或新开一个对话再传；
2. 打开 [status.openai.com](https://status.openai.com/) 看有没有正在发生的故障；
3. 清除浏览器缓存和 Cookie，或用无痕 / 隐私窗口；
4. 停用浏览器扩展，尤其是隐私、安全、广告拦截类；
5. 换一个浏览器、设备或网络。

### 3. 上传卡住不动

官方针对「一直转圈、卡住」的顺序是：等 30–60 秒 → 停止生成后重新生成 → 新开对话重发 → 强制刷新（Ctrl/Cmd + Shift + R）→ 退出再登录 → 无痕窗口且关闭扩展。

### 4. 还是不行就联系客服

官方建议反馈时附上：账号邮箱、截图、发生时间和时区、使用的平台 / App / 浏览器，以及请求 ID（如果有）。从 [help.openai.com](https://help.openai.com/) 右下角的对话入口提交。

## 五、上传过的文件去哪了

2026 年 3 月起（Free 和 Go 于 5 月开放），上传和 ChatGPT 生成的文件会自动保存到侧边栏的 **文件库（Library）**，可以搜索、下载、删除，也能通过「+」→「从文件库添加」重复使用，不用再传一次。删除对话不会删除文件库里的文件；临时聊天里上传的文件不会保存到文件库。

![ChatGPT 网页版侧边栏，「Library（文件库）」位于「搜索聊天」下方（屏幕翻拍图，英文界面）](seed:g14-library-sidebar.jpg)
*图片来源：[PCWorld](https://www.pcworld.com/article/3097976/chatgpt-just-added-a-locker-for-file-uploads.html)（Credit: Ben Patterson/Foundry）*

## 常见问题

**Q：Free 账号能上传文件吗？**
能，但有更严格的限额。官方 FAQ 写的是 Free 每天 3 次上传，额度用完 ChatGPT 会提示。

**Q：为什么同一个文件，别人能传我传不了？**
可能是你的上传次数或存储已用完（这两项不会直接显示剩余次数），也可能是浏览器扩展、网络环境不同。按上面第四节逐项排查。

**Q：上传的文件会被拿去训练吗？**
个人套餐取决于 设置 → 数据控制 里的「为所有人改进模型」开关；官方说明 API 和企业版内容默认不用于训练。

**Q：手机上能传吗？**
能，网页版和官方 App 都支持文件上传。2026 年 10 月 1 日起 iOS 版逐步推出「扫描」：在 ChatGPT 相机里点「⋯」→「扫描」，可以连续拍多页纸质文档，自动合成一个 PDF 再上传。

## 参考资料

- OpenAI 帮助中心：File Uploads FAQ — https://help.openai.com/en/articles/8555545-file-uploads-faq
- OpenAI 帮助中心：Using Library to manage files in ChatGPT — https://help.openai.com/en/articles/20001052-file-storage-and-library-in-chatgpt
- OpenAI 帮助中心：Troubleshooting ChatGPT Error Messages — https://help.openai.com/en/articles/7996703-troubleshooting-chatgpt-error-messages
- OpenAI 帮助中心：Data analysis with ChatGPT — https://help.openai.com/en/articles/8437071-data-analysis-with-chatgpt
- ChatGPT Release Notes（2026-02 单条消息 20 个文件、2026-05 文件库存储）— https://help.openai.com/en/articles/6825453-chatgpt-release-notes
- OpenAI 官方教程：Working with files in ChatGPT — https://openai.com/academy/working-with-files
- OpenAI 服务状态 — https://status.openai.com/
- 截图来源：OpenAI 官方教程、PCWorld（见各图下方链接）
