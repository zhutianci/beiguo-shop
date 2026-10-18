---
title: Nano Banana 官网入口在哪、免费能用吗：Google 官方入口、Nano Banana 2 与 2.1 的免费和付费区别
slug: nano-banana-official-entry-free-use
products: [gemini]
models: [nano-banana, gemini-llm]
accountTier: FREE
excerpt: Nano Banana 官网地址是什么、免费能用多少？Nano Banana 是 Google Gemini 的图像模型，官方入口是 gemini.google.com 和官方介绍页。按官方页面核对：免费版用 Nano Banana 2，2.1 需要 Google AI 套餐，API 没有免费层。
checkedOn: 2026-10-19
sources:
  - https://gemini.google/overview/image-generation/
  - https://support.google.com/gemini/answer/14286560?hl=en
  - https://support.google.com/gemini/answer/16275805?hl=en
  - https://ai.google.dev/gemini-api/docs/models/gemini-nano-banana-2.1
  - https://ai.google.dev/gemini-api/docs/pricing
verify:
  - 官方介绍页写「免费版用 Nano Banana 2、升级 Google AI 套餐解锁 2.1」；官方帮助中心「Generate & edit images」页仍写默认是 Nano Banana 2、订阅用户可用 Pro 重做，没有提到 2.1，两处新旧程度不一致，以你账号里实际显示的为准
  - 官方没有公布免费版每天能生成的具体张数（限额按计算量折算，每 5 小时刷新、有每周上限）；具体见 /guides/gemini-image-limits
  - API 价格取自 ai.google.dev/gemini-api/docs/pricing 2026-10-19 的页面：2.1 免费层「Not available」，付费层图片输出按每百万 token 30 美元折算，1K 图约 0.0336 美元；价格可能调整
  - 「Create images」是官方介绍页 FAQ 的写法；帮助中心电脑端步骤写的是侧边栏 Images，两者是同一功能的不同入口说法
---

> 本文根据 Google 官方 Gemini 图像生成介绍页、Gemini 帮助中心和 Gemini API 文档整理，资料核对于 2026-10-19。**只给 Google 官方入口**；Nano Banana 是 Google Gemini 里的图像模型，官方页面里它的入口就是下面这几个。图为本站整理的示意图。

## 适用于谁

- 搜「nano banana 官网 地址」「nano banana 免费 使用」的人；
- 想知道 Nano Banana 在哪里用、要不要付费的人；
- 分不清 Nano Banana 2、2.1、Pro 的人；
- 想知道开发者怎么调用它的人。

## 结论先说

1. **Nano Banana 是什么**：Google 的图像生成与编辑模型，用在 Gemini 里。官方介绍页就叫 Nano Banana，页面是 [gemini.google/overview/image-generation/](https://gemini.google/overview/image-generation/)。
2. **官方入口有三处**：Gemini 网页版和 App（gemini.google.com）；官方介绍页上的 Try 按钮；开发者用 Google AI Studio 和 Gemini API。
3. **免费能用吗**：官方介绍页写明，Nano Banana 「免费可用」；**免费版用的是 Nano Banana 2**，想用最新的 **Nano Banana 2.1**，需要升级 Google AI 套餐。
4. **免费能用多少**：官方不再公布「每天 X 张」的固定数字，限额按计算量折算，每 5 小时刷新，直到每周上限，详见 [/guides/gemini-image-limits](/guides/gemini-image-limits)。
5. **API**：官方 API 价格页写明，Nano Banana 2.1 **没有免费层**，付费层按量计费。

![Nano Banana 的官方入口与免费情况](seed:g938-nano-banana-entry-free.png)
*图：本站根据 [Gemini 官方图像生成介绍页](https://gemini.google/overview/image-generation/) 与 [Gemini API 价格页](https://ai.google.dev/gemini-api/docs/pricing) 整理的示意图*

## 一、官方入口

### 1. Gemini 网页版和 App

打开 gemini.google.com（或 Gemini App），登录 Google 账号。官方介绍页 FAQ 的说法是：从工具菜单里选 **Create images**，然后输入提示词，或上传一张图来编辑。官方帮助中心写的电脑端步骤是：打开左上角的侧边栏，点 **Images**。两种说法对应同一个功能，界面会随版本调整，以你实际看到的为准。

官方说，图片生成在**所有 Gemini 应用可用的语言和国家**都可使用；功能是否可用还取决于账号年龄、登录状态等，见 [/guides/gemini-cant-generate-images](/guides/gemini-cant-generate-images)。

### 2. 官方介绍页

[gemini.google/overview/image-generation/](https://gemini.google/overview/image-generation/) 是官方的产品介绍页，页面顶部有 **Try Nano Banana 2.1** 按钮，下方有示例、模型对比和常见问题。里面写明：免费版是 Nano Banana 2，升级 Google AI 套餐可以解锁 Nano Banana 2.1。

### 3. 开发者：Google AI Studio 和 Gemini API

官方 API 文档里，Nano Banana 2.1 的模型代码是 `gemini-nano-banana-2.1`，文档页提供「Try in Google AI Studio」入口。官方说它是 Nano Banana 2 的更新版，保持 Flash 级速度和成本，同时提升画质、遵循提示的能力、多轮角色一致性和文字渲染，支持 1K、2K、4K 输出（默认 1K），多图融合最多 14 张参考图。API 的使用方法见 [/guides/gemini-api-key](/guides/gemini-api-key)。

## 二、免费和付费有什么区别

官方介绍页的「选择适合你的模型」对比如下：

| 模型 | 定位 | 使用条件 |
| --- | --- | --- |
| Nano Banana 2 | 图像生成与编辑，支持角色一致性、文字渲染、合并照片、精确编辑、2K 分辨率、世界知识 | 免费 |
| Nano Banana 2.1 | 官方称最佳图像生成与编辑模型，另有更高的生成额度 | 需要 Google AI 套餐 |

补充几条官方帮助中心的信息：

- **下载分辨率**：官方说，有 Google AI 套餐可以下载 2K 分辨率的图，没有套餐是 1K；
- **Nano Banana Pro**：有 Google AI 套餐时，生成图片后可以点三点菜单，选 **Redo with Pro**，用 Pro 重做，适合带文字的图和信息图；
- **额度用完**：官方说，当天 Nano Banana 2 的额度用完后，也不能再用 Pro 重做；
- **更多额度**：官方介绍页写，付费套餐有更高的生成上限。

所以「免费能用多少」的准确答案是：**免费版能用 Nano Banana 2，数量有上限，但官方不给固定数字**；想要 2.1、2K 下载和更高上限，要订阅 Google AI 套餐。套餐的区别见 [/guides/gemini-plans-free-plus-pro-ultra](/guides/gemini-plans-free-plus-pro-ultra)；谷歌账号相关服务可以看本站的 [/chongzhi/google-zhanghao](/chongzhi/google-zhanghao)。

## 三、第一次怎么用

![在 Gemini 里使用 Nano Banana 的 4 步](seed:g938-nano-banana-gemini-steps.png)
*图：本站根据 [Gemini 官方图像生成介绍页](https://gemini.google/overview/image-generation/) 与 [Gemini 帮助中心](https://support.google.com/gemini/answer/14286560?hl=en) 整理的示意图*

官方介绍页给的提示词公式很简单：**「创建 / 生成一张……的图」+ 主体 + 动作 + 场景**，然后逐步加细节。官方例子：「创建一张猫在窗台阳光下打盹的图片」。再往上可以补：

- **构图、风格、画质、比例**：比如「生成一只模糊的豪猪在太空中飞行，油画风格，2:3 比例」；
- **越具体越好**：与其写「红裙子的女人」，不如写「一位穿红裙的年轻女子在公园里奔跑」；
- **不满意就直接说**：让它换背景、替换物体、加元素，同时保留你喜欢的细节。

更多写法见 [/guides/nano-banana-prompt-guide](/guides/nano-banana-prompt-guide)，基本用法见 [/guides/nano-banana-how-to](/guides/nano-banana-how-to)，模型之间的区别见 [/guides/nano-banana-pro-vs-nano-banana-2](/guides/nano-banana-pro-vs-nano-banana-2)。

## 四、API 价格（官方价格页）

官方 API 价格页（2026-10-19）对 Nano Banana 2.1 写明：

- **免费层**：输入、输出价格均为「不可用」；
- **付费层（标准）**：输入每百万 token 1.5 美元；输出文字和思考每百万 token 7.5 美元，输出图片每百万 token 30 美元，折合 1K 图约 0.0336 美元、2K 图约 0.0504 美元、4K 图约 0.113 美元；
- 批处理（Batch）价格约为标准价的一半。

价格可能调整，请以官方价格页为准。

## 五、关于水印和 AI 标识

官方介绍页说，Gemini 生成的图片会带有**不可见的 SynthID 水印**，以及一个**可见的水印**，用来表明是 AI 生成。你可以把图片上传到 Gemini App，问它是否由 Google AI 生成，验证由 SynthID 支持。详细见 [/guides/gemini-image-watermark-synthid](/guides/gemini-image-watermark-synthid)。

## 常见问题

**Q：「nano banana 官网」是不是只有这一个？**
官方页面里 Nano Banana 的入口就是 Gemini（gemini.google.com、官方介绍页）和开发者用的 Google AI Studio、Gemini API。官方没有提到其他网站；遇到别的自称「Nano Banana 官网」的站点，不要在上面输入账号或付款信息。

**Q：免费版一天能画几张？**
官方没有给固定数字，限额按计算量折算，见 [/guides/gemini-image-limits](/guides/gemini-image-limits)。

**Q：2.1 和 Pro 哪个好？**
官方介绍页把 2.1 称作最先进的图像模型；Pro 是订阅用户用来「重做」图片的选项，擅长细节和带文字的图。具体效果以你实际生成为准。

**Q：生成的图能商用吗？**
见 [/guides/ai-image-copyright-commercial](/guides/ai-image-copyright-commercial)。

## 参考资料

- Gemini：Nano Banana 官方介绍页 — https://gemini.google/overview/image-generation/
- Gemini 帮助中心：Generate & edit images with Gemini Apps — https://support.google.com/gemini/answer/14286560?hl=en
- Gemini 帮助中心：Gemini Apps limits & feature availability — https://support.google.com/gemini/answer/16275805?hl=en
- Gemini API 文档：Gemini Nano Banana 2.1 — https://ai.google.dev/gemini-api/docs/models/gemini-nano-banana-2.1
- Gemini API 文档：Pricing — https://ai.google.dev/gemini-api/docs/pricing
