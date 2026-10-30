---
title: ChatGPT 不能上传图片怎么办：支持的格式、20MB 上限、上传次数与存储，官方的排查
slug: chatgpt-cannot-upload-images
products: [chatgpt]
models: []
accountTier: FREE
excerpt: ChatGPT 传不了图片，先对照官方清单：只支持 PNG、JPEG 和不带动画的 GIF，单张最多 20MB；免费用户每天文件上传次数有限，存储满了也会报错。本文按帮助中心整理格式、上限、报错和处理顺序。
checkedOn: 2026-10-30
sources:
  - https://help.openai.com/en/articles/8400551-chatgpt-image-inputs-faq
  - https://help.openai.com/en/articles/8555545-file-uploads-faq
verify:
  - 官方清单没有列出 HEIC、WebP 等格式，本文说「先转成 PNG 或 JPEG」是依据清单做的建议，官方没有写 HEIC 会怎样
  - 免费用户每天 3 次文件上传、每 3 小时 80 个文件等数字来自官方文件上传 FAQ 当天的写法，官方可能在高峰期调低
  - 官方没有写图片数量的固定上限
---

> 本文根据 OpenAI 帮助中心《ChatGPT Image Inputs FAQ》《File Uploads FAQ》整理，资料核对于 2026-10-30。配图为本站整理的示意图。这里讲的是**你上传图片给 ChatGPT**；让 ChatGPT 生成图片失败见 [/guides/chatgpt-image-failed](/guides/chatgpt-image-failed)。

## 适用于谁

- 点了上传，图片传不上去或一直失败的人；
- 不确定图片格式、大小是不是符合要求的人；
- 提示「上传次数已用完」的免费用户。

## 结论先说

1. **格式**：官方说支持 **PNG（.png）、JPEG（.jpeg 和 .jpg）和不带动画的 GIF（.gif）**。不在清单里的格式，先转成 PNG 或 JPEG 再传。
2. **大小**：**单张最多 20MB**。
3. **数量**：官方没有给固定数字，取决于图片大小和你同时输入的文字量；遇到问题就**减少数量或缩小体积**。
4. **所有模型、所有平台**（网页和 iOS、安卓）都能接收图片输入，Free 和付费套餐都可以，受各自用量限制。
5. **添加方法**：点输入框的 **+**，选 **Add photos & files**；也可以把图片拖进输入框，或粘贴剪贴板里的图片。
6. **次数与存储**：官方文件上传 FAQ 写到，**每 3 小时最多上传 80 个文件，免费用户每天 3 次文件上传**，高峰期可能调低；上传存储也有上限（每用户 25GB）。

![能上传什么图片：格式、20MB 上限、数量、套餐、免费用户上传频率、添加方式](seed:g1331-image-upload-limits-compare.png)
*图：本站根据 [OpenAI 帮助中心：ChatGPT Image Inputs FAQ](https://help.openai.com/en/articles/8400551-chatgpt-image-inputs-faq) 与 [File Uploads FAQ](https://help.openai.com/en/articles/8555545-file-uploads-faq) 整理的示意图*

## 一、传不上去时按这个顺序查

![图片传不上去：格式、20MB、数量、次数、存储、一直失败对应的做法](seed:g1331-image-upload-decide.png)
*图：本站根据 [OpenAI 帮助中心：File Uploads FAQ](https://help.openai.com/en/articles/8555545-file-uploads-faq) 整理的示意图*

官方对「提示上传次数已用完，但最近没传几次」的处理：

1. 确认登录的是**对的账号和套餐**；
2. 提示里**有重试时间**，就等到那个时间再传，**失败的上传有时也会计入次数**；
3. 网页版打开 **Settings > Storage** 看已保存文件的用量，存储和上传频率是两回事；
4. 看 [OpenAI 状态页](https://status.openai.com/) 有没有影响上传的事件；
5. 仍然不行，联系官方客服，带上账号邮箱、问题截图、带时区的时间、使用的平台或浏览器和请求 ID（如果有）。

网络问题引起的上传失败，官方建议管理员放行 `*.oaiusercontent.com`，见 [/guides/chatgpt-network-error-image-download](/guides/chatgpt-network-error-image-download)。其他文件的上传限制见 [/guides/chatgpt-file-upload-failed](/guides/chatgpt-file-upload-failed)。

## 二、传上去了但识别不好

官方列出的图片输入限制包括：**医学影像**（如 CT）不适合，也不能当医疗建议；**非拉丁文字**（如日文、韩文）表现较差；**大字**可放大但别裁掉重点；**旋转或倒置**的文字可能看错；图表里线型和颜色变化可能看不懂；需要精确空间定位的任务（如棋盘位置）不擅长；**全景、鱼眼**图片吃力；模型**不处理文件名和元数据**，图片分析前会被缩放；**数数**可能只是近似。需要强调某处时，官方建议先用修图工具在图上做标记。更多用法见 [/guides/chatgpt-image-recognition](/guides/chatgpt-image-recognition)。

PDF 里的图片也可以问：直接把 PDF 作为聊天附件发送；作为项目文件或 GPT 知识库保存的文件处理方式不同，里面的图片不一定自动包含，要问具体图表时，请直接附上 PDF 或单独上传那张图。

## 官方没说的

- **HEIC、WebP** 等格式**能不能传**，官方清单没有写；
- 一次**最多几张**图片，官方没有写；
- 免费用户的上传次数在不同国家和时间是否一致，官方说可能在高峰期调低。

## 常见问题

**Q：为什么手机相册里的视频选不了？**
官方说视频文件可以作为附件，但可用性因平台和上传方式而异；在相册里选不了，可以试着从「文件」里附加。视频附件计入文件上传限额。

**Q：想上传更多文件要开会员吗？**
文件上传的次数上限因套餐而异，想了解套餐可以看 [/chongzhi/chatgpt-plus](/chongzhi/chatgpt-plus)。具体上限以官方文件上传 FAQ 为准。

## 参考资料

- OpenAI 帮助中心：ChatGPT Image Inputs FAQ — https://help.openai.com/en/articles/8400551-chatgpt-image-inputs-faq
- OpenAI 帮助中心：File Uploads FAQ — https://help.openai.com/en/articles/8555545-file-uploads-faq
