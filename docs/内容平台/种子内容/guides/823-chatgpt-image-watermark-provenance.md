---
title: ChatGPT 生成的图片有水印吗？怎么识别是不是 AI 生成：内容凭证（C2PA）、SynthID 和 openai.com/verify
slug: chatgpt-image-watermark-provenance
products: [chatgpt]
models: []
accountTier: FREE
excerpt: ChatGPT 生成的图片有水印吗？按 OpenAI 帮助中心：图片带内容凭证（C2PA）和看不见的 SynthID 水印，音频、文本、视频各有标识。本文讲清这些标识是什么、怎么用 openai.com/verify 检测、查不到代表什么，以及它们能证明什么、不能证明什么。
checkedOn: 2026-10-14
sources:
  - https://help.openai.com/en/articles/8912793-provenance-signals-in-openai-generated-content
  - https://help.openai.com/en/articles/12677804-what-is-chatgpt-faq
  - https://help.openai.com/en/articles/11084440-images-in-chatgpt
verify:
  - 官方文章没有写 ChatGPT 生成的图片上有肉眼可见的水印，只写了内容凭证和不可见的 SynthID 水印；实际下载的图片上有没有可见标记，以你拿到的文件为准
  - openai.com/verify 支持哪些文件类型和大小，官方文章写「受支持的图片或音频文件」，具体以该页面为准
  - 本文不讨论、也不提供移除这些标识的方法
---

> 本文根据 OpenAI 帮助中心《Provenance signals in OpenAI-generated content》《What is ChatGPT: FAQ》《Images in ChatGPT》整理，资料核对于 2026-10-14。官方文章没有配可用的界面截图（文中的两张图是 API 后台设置，与图片检测无关，未引用），配图为本站整理的示意图。

## 适用于谁

- 搜「ChatGPT 生成的图片有水印吗」「ChatGPT 图片水印」，想知道图片会不会带标记的人；
- 搜「ChatGPT 图片检测」，想判断一张图是不是 OpenAI 生成的人；
- 想在发布 AI 生成的图片前，弄清楚平台会不会识别出来的人。

怎么用 ChatGPT 生图见 [/guides/gpt-image-2-how-to](/guides/gpt-image-2-how-to)，生图额度见 [/guides/chatgpt-image-limits](/guides/chatgpt-image-limits)。

## 结论先说

1. **有，但主要是「看不见」的标识**。官方说明：用 ChatGPT、Codex 或 OpenAI API 生成的图片，同时包含两种标识：**Content Credentials（内容凭证，也叫 C2PA 元数据）**和 **SynthID 水印**。官方《What is ChatGPT: FAQ》也写了：ChatGPT 生成的图片包含 C2PA 来源元数据。
2. **官方文章没有提到肉眼可见的水印**。官方说的是前面这两种看不见的信号。
3. **两种标识有分工**：内容凭证是附在文件里的信息，能写明用什么工具、什么时候生成，但截图、转换文件格式这类日常操作就可能丢掉；SynthID 水印直接嵌在图像本身里，可能撑得住一些修改。官方把两者结合用，是为了让来源信息更可能保留下来。
4. **怎么检测**：官方提供 **openai.com/verify**，上传受支持的图片或音频文件，它会查找 OpenAI 的标识（SynthID 水印，或与 OpenAI 相关的可信 C2PA 清单）。
5. **检测结果有边界**：查到了，说明内容「很可能」由 OpenAI 模型生成或处理；没查到，**不等于不是**。它不能证明内容准确、没改过、有合法所有权，也不能说明是谁创作的。
6. **它只认 OpenAI 的标识**，不能检测其他 AI 工具生成的内容。

## 一、官方给不同内容加了什么标识

![OpenAI 生成内容带哪些标识：图片、音频、文本、视频](seed:g823-provenance-signals.png)
*图：本站根据 [OpenAI 帮助中心：Provenance signals in OpenAI-generated content](https://help.openai.com/en/articles/8912793-provenance-signals-in-openai-generated-content) 整理的示意图*

要点：

- **图片**：内容凭证 + SynthID 水印；
- **音频**：ChatGPT 或 API 生成的音频带有听不见的 SynthID 水印；
- **文本**：欧盟地区的 ChatGPT 生成的文字会带 textGrain 水印（为了符合欧盟《人工智能法案》），它是在用词的随机性上做看不见的调整，不添加隐藏字符或特殊标点；全球范围的 API 客户可以在项目或组织设置里自己开启文本水印；
- **视频**：内容凭证；官方在这一行注明 Sora 已停用（见 [/guides/chatgpt-video-generate-upload](/guides/chatgpt-video-generate-upload)）。

官方也提醒：覆盖范围会因产品、模型、导出方式、文件类型、内容生成时间而不同。

## 二、两种图片标识分别是什么

- **Content Credentials（内容凭证）**：由内容来源与真实性联盟（C2PA）制定的开放标准，把「哪个工具、什么时候创建」等来源和历史信息附在文件上，因此也叫 C2PA 元数据。它不只用于 AI 内容，相机厂商、新闻机构也用它证明媒体来源。官方说，平台、编辑工具和文件转换都可能把它去掉；截图或转换文件也会让它丢失。
- **SynthID**：由 Google DeepMind 开发的不可见水印技术，把信号嵌进生成的媒体本身。官方说它被设计成能撑住一些常见改动，比如轻度编辑、复制粘贴、裁剪、截图；但大幅裁剪、文件压缩、大幅改写（针对文本）、翻译等更大的改动，可能让水印检测不到。

## 三、怎么检测一张图

1. 打开 **openai.com/verify**；
2. 上传受支持的图片或音频文件；
3. 查看结果：工具会找 SynthID 水印或与 OpenAI 相关的可信 C2PA 清单。

官方给的让结果更可靠的做法：

- **一次传一个受支持的文件**；
- 尽量用**原始导出的文件**；
- **图片检测前不要裁剪或转换格式**；
- 音频片段 10 到 60 秒通常效果最好。

关于隐私：官方说，标识里**不含用户、组织或提示词的详细信息**；上传到 openai.com/verify 或内容溯源 API 的内容只用于检查标识，除非法律要求否则不保存，也不用于训练 OpenAI 的模型。

开发者和机构还可以用官方的 Content Provenance API 检查图片和音频；官方说目前检查免费，有使用限制。

## 四、检测结果怎么读

![在 openai.com/verify 查完怎么理解：检测到、没检测到、被截图、其他 AI](seed:g823-verify-results.png)
*图：本站根据 [OpenAI 帮助中心：Provenance signals in OpenAI-generated content](https://help.openai.com/en/articles/8912793-provenance-signals-in-openai-generated-content) 整理的示意图*

官方列出「没检测到」时，内容仍可能是 OpenAI 生成或导出的几种情况：

- 内容是在这些标识出现之前创建的；
- 来自不受支持的产品、模型、导出方式或文件类型；
- 上传、下载、编辑、转换或分享过程中元数据被去掉；
- 水印被压缩、裁剪、噪点、编辑或格式转换削弱；
- 音频太短，或改动太大。

而「检测到」只表示文件里有与 OpenAI 相关的受支持标识：它**不能证明**内容准确、未经编辑、拥有合法所有权或语境正确；也不能说明是谁创作的、为什么创作。官方还强调：水印本身不能确定作者、所有权或法律责任，也不显示 OpenAI 模型参与了多少。

## 常见问题

**Q：我下载的 ChatGPT 图片，角落里没有水印，是被去掉了吗？**
官方文章没有说 ChatGPT 图片有可见水印。官方说的标识是看不见的内容凭证和 SynthID，需要用检测工具才能查。

**Q：我把图截图后再发，标识还在吗？**
官方说内容凭证会因为截图、转换格式等日常操作丢失；SynthID 水印被设计成可能撑住截图、裁剪等一些改动，但改动越大越可能检测不到。

**Q：用这个工具能查别人的作业、论文是不是 AI 写的吗？**
不行。官方说工具不能检测其他 AI 工具生成的内容；文本检测只面向符合条件的研究、学术机构申请，并且明确把「检查学生作业是否用 AI」排除在项目范围之外。

**Q：文字回答里也有水印吗？**
官方说明只有欧盟地区的 ChatGPT 文字输出带 textGrain 水印；其他地区的 ChatGPT 文字没有写。文字水印不增加可见字符。

**Q：我发布 AI 生成的图片要不要标注？**
这取决于你所在地区的法律和发布平台的规则；官方明确水印本身不能说明是否需要披露，请以平台规则和法律要求为准。

## 参考资料

- OpenAI 帮助中心：Provenance signals in OpenAI-generated content — https://help.openai.com/en/articles/8912793-provenance-signals-in-openai-generated-content
- OpenAI 帮助中心：What is ChatGPT: FAQ — https://help.openai.com/en/articles/12677804-what-is-chatgpt-faq
- OpenAI 帮助中心：Images in ChatGPT — https://help.openai.com/en/articles/11084440-images-in-chatgpt
