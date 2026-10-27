---
title: ChatGPT 生图怎么做透明背景：官方怎么说、提示怎么写、没做出来怎么排查，以及 API 的 png 与 webp 要求
slug: chatgpt-image-transparent-background
products: [chatgpt]
models: []
accountTier: FREE
excerpt: ChatGPT 生图能做透明背景吗？官方帮助中心写明 ChatGPT Images 可以按指令让背景透明。本文整理官方步骤、局部编辑方法、提示写法，以及开发者用 API 时必须设置 background 为 transparent 并用 png 或 webp。
checkedOn: 2026-10-28
sources:
  - https://help.openai.com/en/articles/11084440-images-in-chatgpt
  - https://developers.openai.com/api/docs/guides/image-generation
  - https://learn.chatgpt.com/docs/image-generation
verify:
  - 官方帮助中心只写了「可以按指令让背景透明」，没有说明聊天里导出的文件格式，也没有保证每次都成功，本文不断言导出格式
  - 提示怎么写的例句是本站的使用建议，不是官方原文
  - 透明背景的 API 设置来自 OpenAI API 图像生成指南当天的写法，不同模型可能有不同限制，以官方文档为准
---

> 本文根据 OpenAI 帮助中心《Images in ChatGPT》、Codex 官方文档《Image generation》和 OpenAI API 图像生成指南整理，资料核对于 2026-10-28。官方对透明背景只写了一句话，本文把相关的官方说明和通用做法分开写。配图为本站整理的示意图，不是软件截图。

## 适用于谁

- 想做 Logo、贴纸、图标、素材，需要透明背景图的人；
- 生成的图背景是白色或有颜色，想去掉的人；
- 开发者想通过 API 批量生成透明图的人。

## 结论先说

1. **官方说可以。** 帮助中心写明：ChatGPT Images 可以按指令添加文字、添加图中细节，或让背景透明；也可以上传已有图片，描述想要的修改。
2. **做法**：在对话里描述想要的图，并明确写「透明背景」；或点 **More** 再选 **Images**。生成可能要几分钟，生成期间可以继续使用 ChatGPT。
3. **不满意就在同一个对话里改。** 官方建议先抓住核心想法，再做小的、有针对性的修改，一次只改一个元素，避免整体构图跑偏。
4. **改局部**：选中图片，用选择工具框出要改的区域再描述，满意后点 **Save**；也可以不用选择工具，直接在对话里说明。
5. **官方没有写聊天里下载的文件格式。** 透明背景需要支持透明的格式；API 里官方明确要求用 png 或 webp。

![让 ChatGPT 生成透明背景图](seed:g1229-transparent-steps.png)
*图：本站根据 [OpenAI 帮助中心：Images in ChatGPT](https://help.openai.com/en/articles/11084440-images-in-chatgpt) 整理的示意图*

## 一、提示怎么写

官方《Image generation》给的写法：一个好的生图提示通常只有一到三句清楚的话，说明图的用途或受众、主体和正在发生的事、场景、构图和风格，必要时加画面比例、光线、颜色、材质，并写明限制条件，包括图里不能出现什么。多用具体的视觉语言，必须保持不变的要求要重复说。

按这个思路写透明背景的提示，例如（本站示例，不是官方原文）：

```text
为手账贴纸包设计一个可爱的橘猫贴纸，卡通扁平风格，粗描边，主体居中。背景透明，不要任何底色、阴影底板或渐变，不要出现文字。
```

要点：一次只要一个主体；写清「背景透明」并说明不要底色；风格和构图写具体。

## 二、没做出来怎么办

![透明背景没做出来：对照排查](seed:g1229-transparent-decide.png)
*图：本站根据官方帮助中心和 API 指南整理的示意图*

- **背景还是有颜色**：在提示里更明确地说透明背景、不要底色，或在对话里直接说「请把背景改成透明」；
- **边缘有残留**：官方建议用选择工具框出背景区域或描述只改背景，其余保持不变；官方也提示选区不一定精确，修改可能超出所选区域；
- **图在看图软件里是白底**：这和查看软件有关，换一个支持透明的软件打开；是否真的透明，要看你保存下来的文件格式；
- **想重新比例**：用 **Aspect ratio** 选择器，或在提示里写画面比例；官方说可以生成任意比例的图；
- **额度用完了**：生图有单独的额度，见 [/guides/chatgpt-image-limits](/guides/chatgpt-image-limits)；失败原因见 [/guides/chatgpt-image-failed](/guides/chatgpt-image-failed)。

## 三、开发者用 API 怎么做透明背景

官方 API 图像生成指南写明：输出选项里有 **Background**（透明、不透明或自动）；**要透明背景，设置 `background: "transparent"`，并使用 `output_format: "png"` 或 `"webp"`**。官方还写明 `size`、`quality`、`background` 都支持 `auto`，由模型按提示自动选。输出格式默认是 png，也可以要求 jpeg 或 webp；jpeg 更快，但不能保存透明。API 按用量单独计费，和 ChatGPT 订阅额度是两套体系。

在 Codex 里生图时，官方说内置生图用 `gpt-image-2`，计入 Codex 的通用用量，每次生图消耗额度的速度平均比类似的无图任务快 3 到 5 倍；大批量时可以设置 `OPENAI_API_KEY`，让它通过 API 生成，按 API 价格计费。

## 四、相关

- 生图工具的新版本和用法：[/guides/gpt-image-2-how-to](/guides/gpt-image-2-how-to)；
- 用图片提问和识别：[/guides/chatgpt-image-recognition](/guides/chatgpt-image-recognition)；
- 想要更高额度可以看 [/chongzhi/chatgpt-plus](/chongzhi/chatgpt-plus)。

## 常见问题

**Q：所有套餐都能做透明背景吗？**
官方说 ChatGPT Images 在所有套餐可用，额度不同；「带思考的生图」在 Plus、Pro、Business 提供。

**Q：下载出来是什么格式？**
官方没有写，以界面为准。需要确定透明格式时，可以用 API 指定 png 或 webp。

**Q：可以用来做商标图吗？**
本文不涉及版权和商标问题，使用前请自己确认素材的使用范围。

## 参考资料

- OpenAI 帮助中心：Images in ChatGPT — https://help.openai.com/en/articles/11084440-images-in-chatgpt
- OpenAI API 文档：Image generation — https://developers.openai.com/api/docs/guides/image-generation
- Codex 官方文档：Image generation — https://learn.chatgpt.com/docs/image-generation
