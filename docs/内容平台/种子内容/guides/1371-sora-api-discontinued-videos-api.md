---
title: Sora API 现在还能用吗：Videos API 与 sora-2 系列模型已于 2026-09-24 移除，代码里怎么处理
slug: sora-api-discontinued-videos-api
products: [chatgpt]
models: [sora]
accountTier: OTHER
excerpt: Sora API 已停用。OpenAI API 弃用页写明，Videos API 和 sora-2、sora-2-pro 等模型别名在 2026-09-24 移除，替代一栏为空。本文列出受影响的模型、给开发者的检查清单，并说明官方没有给出迁移目标。
checkedOn: 2026-10-30
sources:
  - https://developers.openai.com/api/docs/deprecations
  - https://help.openai.com/en/articles/20001152-what-to-know-about-the-sora-discontinuation
verify:
  - 弃用页只写了 Videos API 和五个 sora-2 系列别名，没有逐个列出受影响的接口路径；本文不推断具体接口
  - 弃用页替代一栏全部为空，帮助中心也没有给出替代产品，本文不替 OpenAI 推荐替代方案
  - 帮助中心写 API 已于 2026-09-24 停用，弃用页写 2026-09-24 移除，二者一致
---

> 本文根据 OpenAI API 弃用页面和帮助中心的 Sora 停用说明整理，资料核对于 2026-10-30。配图为本站整理的示意图，不是软件截图。

## 适用于谁

- 代码、脚本里调用过 Sora API（Videos API、sora-2 模型）的开发者；
- 搜「Sora API」想接入的人；
- 在第三方工具里配置了 Sora 的人。

## 结论先说

1. **Sora API 已停用，不能再接入。** 帮助中心写明「The Sora API was discontinued on September 24, 2026」；
2. API 弃用页对应条目是 **「2026-03-24: Sora 2 video generation models and Videos API」**：官方在 2026-03-24 通知了使用 Videos API 和 Sora 2 模型别名的开发者，**2026-09-24 从 API 移除**；
3. **官方没有给替代模型**：弃用页里每一行的替代一栏都是「—」；
4. 代码里的调用现在应当会失败，需要自己换视频生成服务，或者去掉这个功能；
5. Sora 网页和 App 更早在 2026-04-26 停用，见 [/guides/sora-official-website-status-export](/guides/sora-official-website-status-export)。

![Sora API 弃用的模型](seed:g1371-models-compare.png)
*图：本站根据 [OpenAI API 弃用页面](https://developers.openai.com/api/docs/deprecations) 整理的示意图*

## 一、哪些模型受影响

弃用页列出的模型别名，关闭日期都是 2026-09-24：

- `sora-2`
- `sora-2-pro`
- `sora-2-2025-10-06`
- `sora-2-2025-12-08`
- `sora-2-pro-2025-10-06`

弃用页没有列出具体的接口路径，只写了「Videos API」。所以排查时，**凡是调用 Videos API 或用到上面这些模型名的地方，都要检查**。

## 二、给开发者的检查清单

![代码里还在调 Sora API 怎么办](seed:g1371-migrate-steps.png)
*图：本站根据 [OpenAI API 弃用页面](https://developers.openai.com/api/docs/deprecations) 整理的示意图*

1. **全局搜一遍**：搜索 `sora-2`、`sora-2-pro`、`videos` 相关调用，包括后台任务、定时脚本、第三方插件里的配置；
2. **确认失效**：移除日期是 2026-09-24，之后的调用不应再指望成功；
3. **别指望官方替代**：弃用页没有给目标模型，也不要把别人博客里的「替代方案」当成官方建议；
4. **保存已有成果**：之前生成并下载的视频文件自行备份；
5. **重新评估供应商**：另选视频生成服务时，按它自己的官方 API 文档、价格和使用条款核对。OpenAI API 的计费方式见 [/guides/openai-api-pricing-billing](/guides/openai-api-pricing-billing)；错误码里的 429 等通用问题见 [/guides/openai-api-429-error](/guides/openai-api-429-error)。

## 三、产品使用者要注意什么

- 如果你只是用 Sora 网页或 App 生成过内容，和 API 无关，导出作品见 [/guides/sora-official-website-status-export](/guides/sora-official-website-status-export)；
- 如果你的第三方工具（剪辑、工作流）里选了 Sora 模型，工具里会失败，应改选该工具支持的其他模型；
- 没有官方的「Sora 兼容接口」。听到「Sora API 中转」「Sora 接口低价」的说法，官方已经移除这个接口，这类服务无法成立，不要付款。

## 四、想继续用 AI 生成视频

OpenAI 没有给替代。想对比其他厂商官方的视频工具，可看 [/guides/ai-video-tools-which-to-choose](/guides/ai-video-tools-which-to-choose)；Gemini 的视频生成见 [/guides/gemini-video-generation](/guides/gemini-video-generation)，Gemini API 价格见 [/guides/gemini-api-price-official](/guides/gemini-api-price-official)。

## 常见问题

**Q：我是 ChatGPT Plus 用户，能调 Sora API 吗？**
不能。ChatGPT 订阅和 API 是两套东西，见 [/guides/chatgpt-subscription-vs-openai-api](/guides/chatgpt-subscription-vs-openai-api)，而且 Sora API 已移除。

**Q：Sora 会开放权重吗？**
官方文档没有这样的说法，本文不作猜测。

**Q：官方通知过吗？**
弃用页写明，官方在 2026-03-24 通知了使用 Videos API 和 Sora 2 模型别名的开发者。

## 参考资料

- OpenAI API 弃用页面 — https://developers.openai.com/api/docs/deprecations
- OpenAI 帮助中心：What to know about the Sora discontinuation — https://help.openai.com/en/articles/20001152-what-to-know-about-the-sora-discontinuation
