---
title: Gemini 怎么生成视频：Gemini Omni 用法、时长与限制（已取代 Veo）
slug: gemini-video-generation
products: [gemini]
models: [veo]
accountTier: PRO
excerpt: Gemini 里生成视频现在用的是 Gemini Omni，不再是 Veo。本文按 Google 官方帮助中心讲清谁能用、在哪里点、文字 / 图片 / 视频怎么生成和改视频、时长和比例、下载与 SynthID 水印，以及常见报错原因。
checkedOn: 2026-10-07
sources:
  - https://support.google.com/gemini/answer/16126339?hl=en&co=GENIE.Platform%3DDesktop
  - https://gemini.google/overview/video-generation/
  - https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-omni/
  - https://support.google.com/gemini/answer/16275805?hl=en
  - https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/video/best-practice
---

## 适用于谁

- 搜「Gemini 视频生成教程」「Gemini 生成视频时长」「Gemini 视频生成限制」「Gemini Omni 怎么用」的人；
- 以前用 Gemini 里的 Veo 做视频，发现名字变成了 Omni 的人；
- 想用照片做动态视频、或者让 AI 帮忙改一段视频的人。

本文根据 Google 官方帮助中心、Gemini 官网和官方博客整理，资料核对于 2026-10-07；功能随套餐和地区不同，界面以你实际看到的为准。

## 结论先说

1. **Gemini App 里的视频模型已换成 Gemini Omni**。官方说明 Gemini Omni 取代了 Gemini App 中的 Veo，当前型号是 **Gemini Omni 1.1 Flash**；Veo 仍在 Google Flow 和开发者 API 中提供（见《Google Flow 怎么用》）。
2. **需要付费套餐**：个人账号必须订阅 Google AI 套餐（官方功能表显示 Plus、Pro、Ultra 可用，免费用户不可用）；目前不对 18 岁以下用户开放。
3. **能做什么**：文字生成约 10 秒带原生音频的视频；最多用 **5 张图片**做参考；上传 **1 段视频**让它按指令改（部分地区不可用）；在同一对话里多轮修改、延长场景。
4. **不是按张数限额**：Gemini App 的用量按计算量折算，每 5 小时刷新一次直到周上限，视频生成比普通聊天更耗额度。

## 步骤

### 1. 打开视频生成入口

1. 在电脑上打开 gemini.google.com；
2. 点左上角打开侧边栏，选择 **Create video（创建视频）**；
3. （可选）先选一个模板，套用现成风格。

也可以先在普通对话里和 Gemini 讨论、打磨视频提示词，官方说明这种情况下不必再点视频入口，直接让它生成即可。

### 2. 写提示词，添加图片或视频

- 在输入框描述你想要的视频；
- 要用图片或视频做素材，点 **Add image（添加图片）** 或 **Add video（添加视频）**：**最多 1 段视频 + 5 张图片**；
- 想把自己的数字分身放进视频，在提示词里输入 @ 加你的 Google 用户名（需要先创建 avatar）；
- 点提交。

官方提醒：**只上传你有权使用的照片**；违反 Google 生成式 AI 禁止使用政策或侵犯他人权利可能导致账号被终止。

一个结构清楚的提示词示例：

> 中景，镜头缓慢推进。清晨的老街面包店里，一位系着围裙的年轻店员把刚出炉的可颂摆上木架，蒸汽在逆光里升起。暖色调，柔和的窗边自然光。背景音：烤箱的嗡嗡声和远处的自行车铃声。

### 3. 比例、时长与等待

- **比例**：生成前可选画幅；纯文字提示默认**横屏**，上传了参考图或视频时，比例会跟随你上传的素材。
- **时长**：Gemini 官网写明可生成 10 秒视频；之后可以让 Gemini「接着发生什么」来延长场景（Scene extensions）。
- **等待**：生成可能要几分钟，期间同一个对话不能继续操作，可以新开对话，稍后回来看结果。
- **声音**：可以在提示词里要求生成音频（音效、环境声、对白）。

### 4. 用对话改视频

生成之后直接用一句话提修改，例如：

- 删除或替换画面里的物体、角色；
- 换机位、换角度；
- 修改场景、光线，或者让画面更稳定。

官方介绍 Omni 支持**多轮修改**，每一轮都可以再附图片或视频参考，并会记住之前的修改。

上传自己的视频来改（Video to Video）在欧洲经济区、瑞士、英国和美国部分州暂不可用。

### 5. 下载与分享

在视频下方点 **Share（分享）**，选择 **Share on YouTube** 或 **Download video（下载视频）**。

## 用量与套餐

| 项目 | 官方说明 |
| --- | --- |
| 免费用户 | 功能表显示视频生成不可用 |
| Google AI Plus / Pro / Ultra | 可用；功能随套餐和地区不同 |
| 用量规则 | 按计算量折算，每 5 小时刷新，直到周上限；Plus 为标准额度 2 倍、Pro 4 倍，Ultra 为 Pro 的 5 倍或 20 倍（视套餐） |
| 查看剩余额度 | 网页左下角 **设置 → Usage Limits（用量限制）** |

官方没有公布「每天能生成几条视频」这样的固定数字，额度也可能随负载调整。

## 写好视频提示词的三个要点

按 Google 官方视频最佳实践整理：

1. **一条视频只讲一个场景**：短视频里塞「先在图书馆找线索，再开车穿城，再到仓库对峙」往往会乱，拆成三条分别生成。
2. **对白不要加引号**：用冒号表示说话，例如「她说：我叫小林」，避免模型把引号里的字当成画面文字渲染出来。
3. **图生视频只写动作**：参考图已经给出人物、场景和风格，提示词专注于镜头运动、主体动作和环境变化，提到人物用「她」「这位男士」这类泛称即可。

更多写法见《Veo 3.1 提示词怎么写》和《AI视频运镜提示词》。

## 常见问题

**Q：为什么我的 Gemini 里找不到视频生成？**
常见原因：没有订阅 Google AI 套餐；账号未满 18 岁或年龄未验证；所在国家 / 地区不支持；工作或学校账号的管理员没有开通相应许可。

**Q：视频为什么被删除或者生成失败？**
官方说明，系统检测到可能违反 Google 服务条款或禁止使用政策时，会移除或不生成视频。涉及真实人物（尤其是未成年人）、暴力、色情、冒充他人等内容最容易被拦。

**Q：Gemini 生成的视频有水印吗？**
所有在 Gemini App 生成的视频都嵌入了 Google 的不可见水印 **SynthID**；你可以把文件上传给 Gemini 询问是否由 Google AI 生成。详见《Gemini 生成的图片有水印吗》。

**Q：以前用 Veo 生成的视频还在吗？**
官方只说明 Omni 将取代 Gemini App 中的 Veo，没有说明删除历史记录。重要作品建议及时下载保存。

**Q：Gemini 生成的视频能商用吗？**
Google 服务条款写明不会主张对你生成的原创内容的所有权，但你需要遵守条款和禁止使用政策、不得侵犯他人权利；在国内平台发布还要按《人工智能生成合成内容标识办法》声明 AI 生成。

## 参考资料

- Gemini Apps Help：Generate videos with Gemini Apps — https://support.google.com/gemini/answer/16126339?hl=en&co=GENIE.Platform%3DDesktop
- Gemini 官网：Gemini Omni 视频生成 — https://gemini.google/overview/video-generation/
- Google 官方博客：Introducing Gemini Omni — https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-omni/
- Gemini Apps Help：Gemini Apps limits & upgrades — https://support.google.com/gemini/answer/16275805?hl=en
- Google Cloud 文档：Best practices for generating videos — https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/video/best-practice
