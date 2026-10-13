---
title: ChatGPT 文件库（Library）怎么用：上传和生成的文件在哪、图库图片怎么删除、存储空间多大
slug: chatgpt-library-files
products: [chatgpt]
models: []
accountTier: FREE
excerpt: 在 ChatGPT 里上传过的文档、让它生成的表格和图片，过几天想再用却找不到？它们都存在文件库（Library）里。本文按官方帮助中心讲清文件库在哪打开、哪些文件会自动保存、怎么把旧文件加回对话、怎么删除文件和图库图片，以及各套餐的存储空间。
checkedOn: 2026-10-13
sources:
  - https://help.openai.com/en/articles/20001052-using-library-to-manage-files-in-chatgpt
  - https://help.openai.com/en/articles/11084440-images-in-chatgpt
  - https://help.openai.com/en/articles/8983778-chat-and-file-retention-in-chatgpt
  - https://help.openai.com/en/articles/10056348-finding-your-chats-projects-and-files-in-chatgpt
  - https://help.openai.com/en/articles/20001549-getting-started-with-space-in-chatgpt
verify:
  - 中文界面里 Library 的译名（文件库 / 资料库 / 库）以实际界面为准，本文统一写「文件库（Library）」
  - Recently deleted（最近删除）是否出现，官方写的是「如果你的 Library 包含它」，并非所有账号都有
  - 文件库官方写明在网页端可用；手机 App 上的入口以实际界面为准
---

> 本文根据 OpenAI 帮助中心《Using Library to manage files in ChatGPT》《Images in ChatGPT》等文章整理，资料核对于 2026-10-13。官方这几篇文章没有配界面截图，文中配图为本站整理的示意图。

## 适用于谁

- 上传过的 PDF、表格想再问一次，却不记得在哪条对话里的人；
- 想找回 ChatGPT 生成的 Word、Excel、PPT 或图片的人；
- 搜「ChatGPT 图库怎么删除」——想清掉生成过的图片的人；
- 收到「存储空间已满」之类提示，想知道上限是多少的人。

## 结论先说

1. **文件库（Library）在左侧边栏**。你在 ChatGPT 里上传的、让它生成的文件会**自动保存**到这里，方便以后查找和复用。官方说明它在网页端可用，Free、Go、Plus、Pro、Business 以及企业、教育工作区都有。
2. **再次使用**：在输入框点加号（附件按钮）→ **Add from library（从文件库添加）**，不用重新上传。
3. **删对话不等于删文件**：文件库里的文件要到文件库里单独删。
4. **生成的图片**在 **Images（图片）** 标签下。要从「My images（我的图片）」里删掉一张图，官方的做法是**删除生成它的那条对话**。
5. **存储空间**（2026-10 查询）：Free 500 MB、Go 4 GB、Plus 和 Business 20 GB、Pro 100 GB。
6. **侧边栏里没有 Library、只有 Space？** 官方说明：对有 Space 的账号（目前是 Pro、Business、Enterprise），Space 取代了文件库，文件到 Space 里找，见 [/guides/chatgpt-space-pages](/guides/chatgpt-space-pages)。

## 文件库里有什么

![ChatGPT 文件库里有什么、没有什么](seed:g803-library-what-saved.png)
*图：本站根据 [OpenAI 帮助中心：Using Library to manage files in ChatGPT](https://help.openai.com/en/articles/20001052-using-library-to-manage-files-in-chatgpt) 整理的示意图*

- **自动保存的**：聊天里上传的文件（文档、表格、演示文稿、图片等），以及 ChatGPT 创建的文件。官方说它们存放在一个专门的位置，和每天的附件 / 聊天额度是分开算的；
- **生成的图片**：仍然显示在 **Images** 标签里；
- **收藏（Favorites）**：点商品或地点上的书签图标，就会存进文件库的 Favorites；文件（包括生成的图片）也可以收藏。网页上点书签后会弹出文件夹菜单，选不选文件夹都行；之后想换文件夹，在文件库里用 **Move（移动）**；
- **不会保存的**：**临时聊天**里上传的文件；在提供 ChatGPT Health 的地区，使用 Health 时上传的文件也不会存进账号。

## 步骤

### 1. 打开文件库、找文件

1. 在左侧边栏点 **Library（文件库）**；
2. 上传的和生成的文件都在这里，可以直接浏览；
3. 用顶部的搜索栏找文件，结果可以按这些条件筛选：
   - **Uploaded（上传的）** 或 **Generated（生成的）**；
   - 文件类型：Images（图片）、Documents（文档）、Spreadsheets（表格）、Presentations（演示文稿）、PDFs；
   - **Show all file types（显示所有类型）**（出现时可用）。

也可以直接往文件库里放文件：点 **Upload（上传）**，或把文件拖进文件库。

侧边栏的全局搜索（网页版 Ctrl+K / Cmd+K）同样能搜到文件库里的图片和文档，用法见 [/guides/chatgpt-archived-chats-missing](/guides/chatgpt-archived-chats-missing)。

### 2. 把文件库里的文件加进对话

1. 在输入框点加号（附件 / 添加按钮）；
2. 选 **Add from library（从文件库添加）**；
3. 选中要用的文件。

这样旧文件不用再传一遍，就能接着总结、分析或改写。读长文档的方法见 [/guides/chatgpt-summarize-pdf](/guides/chatgpt-summarize-pdf)，分析表格见 [/guides/chatgpt-excel-data-analysis](/guides/chatgpt-excel-data-analysis)。

### 3. 下载文件

在文件库里选中一个或多个文件，点 **Download（下载）**。

生成的文件点了没反应、下载不下来的排查，见 [/guides/chatgpt-create-word-excel-ppt](/guides/chatgpt-create-word-excel-ppt)。

### 4. 删除文件

![删除 ChatGPT 文件库里的文件的 4 步](seed:g803-library-delete.png)
*图：本站根据 [OpenAI 帮助中心：Using Library to manage files in ChatGPT](https://help.openai.com/en/articles/20001052-using-library-to-manage-files-in-chatgpt) 整理的示意图*

官方说明：文件会一直保存在账号里，**直到你手动删除**；删除包含文件的对话，**不会**删除存进文件库的那份。

1. 在 Library 里选中文件；
2. 点 **Delete（删除）**，或点文件旁边的垃圾桶图标。

删除后文件立刻从文件库主视图消失。如果你的文件库里有 **Recently deleted（最近删除）**，在彻底清除之前可以从那里恢复，也可以用 **Delete forever（永久删除）** 或 **Delete all（全部删除）** 提前清掉。被删除的文件会排期在 30 天内从 OpenAI 系统中永久删除（已去标识化、或因安全与法律义务需保留的除外）。

### 5. 删除图库里生成的图片

ChatGPT 生成的所有图片都会自动保存在 **Images（图片）** 下，方便浏览和再次使用。官方《Images in ChatGPT》给的删除办法是：

> 要从 My images 里删除一张图片，就删除生成这张图片的那条对话。

- 网页：把鼠标移到对话标题上，点「•••」→ **Delete**；
- iOS / 安卓：长按对话标题，在菜单里点 **Delete**。

删除对话的完整说明见 [/guides/chatgpt-delete-chats-bulk](/guides/chatgpt-delete-chats-bulk)。想保留图片再删对话，先在图片上点 **Save（保存）** 下载到本机。生图本身怎么用，见 [/guides/gpt-image-2-how-to](/guides/gpt-image-2-how-to)。

## 存储空间和文件大小

![ChatGPT 各套餐文件库存储空间](seed:g803-library-storage.png)
*图：本站根据 [OpenAI 帮助中心：Using Library to manage files in ChatGPT](https://help.openai.com/en/articles/20001052-using-library-to-manage-files-in-chatgpt) 整理的示意图*

- **看用了多少**：文件库里的 **Storage（存储）** 按钮会显示总用量、剩余空间，以及是否已经超限；
- **单个文件的限制**（官方同一篇文章）：每个文件最大 512 MB；文本和文档类文件每个最多 200 万 token（表格不受这条限制）；CSV 和电子表格约 50 MB 以内，取决于每行的大小；图片每张 20 MB。

上传报错的更多情况见 [/guides/chatgpt-file-upload-failed](/guides/chatgpt-file-upload-failed)。

## 文件库里的 Google Drive

连接了 Google Drive 应用后，Drive 里的文件和文件夹可以直接在文件库里浏览和搜索，再从输入框或用 @ 提到它，不必重新上传；也可以选中一个文件夹，让 ChatGPT 处理里面的所有文件。

官方说明的几点限制：

- 这项功能正在向 Plus、Pro、Business、Enterprise、Edu、Healthcare 用户的**网页端**推出，手机端稍后支持；
- 目前能看到「我的云端硬盘」里的内容和直接分享给你的项目，**共享云端硬盘暂不包含**；
- 文件库里显示的 Drive 文件仍然连着 Drive 里的原件，**不能在 ChatGPT 里删除**，要到 Google Drive 里处理。

连接应用的步骤见 [/guides/chatgpt-plugins-connected-apps](/guides/chatgpt-plugins-connected-apps)。

## 常见问题

**Q：我把对话删了，文件还在吗？**
还在文件库里。官方原话：删除对话不会删除单独保存在 Library 的文件，想连那份也去掉，要到 Library 里删。

**Q：文件库满了怎么办？**
先用 Storage 按钮看用量，删掉不再需要的文件；有 Recently deleted 的话，里面的文件用 Delete forever 清掉。各套餐上限见上图，需要更大空间可以考虑升级，开通 Plus 可前往 [/chongzhi/chatgpt-plus](/chongzhi/chatgpt-plus)。

**Q：ChatGPT 会拿文件库里的文件训练模型吗？**
官方说明：如果你开着 **Improve the model for everyone（为所有人改进模型）**，提交给 ChatGPT 的内容（包括上传的文件）可能用于改进模型；可以随时在 **Settings → Data Controls** 里关掉，步骤见 [/guides/chatgpt-data-controls-privacy](/guides/chatgpt-data-controls-privacy)。另外，开着记忆时，文件和聊天也可能被用来帮 ChatGPT 记住关于你的有用信息。

**Q：临时聊天里传的文件会进文件库吗？**
不会。临时聊天中上传的文件不会保存到账号或文件库，见 [/guides/chatgpt-temporary-chat](/guides/chatgpt-temporary-chat)。

**Q：文件库里的文件能分享给别人吗？**
官方写的是「在提供 Library 分享的地方」，可以把文件和文件夹分享给指定的人或整个工作区，并选择 Viewer（查看者）或 Editor（编辑者）权限；对方在 **Shared with me（与我共享）** 里找到。你的账号有没有这个功能，以实际界面为准。

## 参考资料

- OpenAI 帮助中心：Using Library to manage files in ChatGPT — https://help.openai.com/en/articles/20001052-using-library-to-manage-files-in-chatgpt
- OpenAI 帮助中心：Images in ChatGPT — https://help.openai.com/en/articles/11084440-images-in-chatgpt
- OpenAI 帮助中心：Chat and file retention in ChatGPT — https://help.openai.com/en/articles/8983778-chat-and-file-retention-in-chatgpt
- OpenAI 帮助中心：Finding your chats, projects, and files in ChatGPT — https://help.openai.com/en/articles/10056348-finding-your-chats-projects-and-files-in-chatgpt
- OpenAI 帮助中心：Getting started with Space in ChatGPT — https://help.openai.com/en/articles/20001549-getting-started-with-space-in-chatgpt
