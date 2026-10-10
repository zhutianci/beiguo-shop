---
title: Gemini Deep Research 不见了怎么办：入口在哪、次数限制、免费能用吗、报告怎么导出
slug: gemini-deep-research-missing-limits
products: [gemini]
models: [gemini-llm]
accountTier: FREE
excerpt: 找不到 Gemini 的 Deep Research？本文按官方帮助中心逐条排查：当前入口位置、年龄和登录要求、免费账号高峰期可能暂停、每日次数与并行数上限、和技能不能同用等原因，并讲清怎么只查自己的资料、怎么找回旧报告、怎么导出到文档和生成音频概览。
checkedOn: 2026-10-10
sources:
  - https://support.google.com/gemini/answer/15719111
  - https://support.google.com/gemini/answer/16275805
  - https://support.google.com/gemini/answer/18560919
  - https://support.google.com/gemini/answer/16345172
verify:
  - Deep Research 每天几次、可同时进行几个：官方只说存在这两种上限、付费更高，未公布数字
  - 入口位置：帮助中心写「输入框 → Add Files → Deep Research」，早期界面在「工具」菜单，以实际为准
  - 「可用 Pro 模型生成报告」限 AI Pro / Ultra；「所有用户都可用 Thinking」中的 Thinking 与现在的思考等级命名关系官方未解释
---

> 本文根据 Google 官方 Gemini 帮助中心整理，核对日期 2026-10-10。Deep Research 的基础用法本站《Gemini 使用技巧：Gems 改为 Skills、Deep Research 与上传文件怎么用》已有介绍，本文侧重「找不到、用不了、次数不够」的排查，以及报告的后续处理。

## 适用于谁

- 搜「gemini deep research 不见了」「gemini deep research 功能不见了」「gemini deep research 次数」「gemini deep research 免费」的人；
- 以前用过，现在在界面上找不到入口的人；
- 报告生成了，想导出或找回旧报告的人。

## 结论先说

1. **当前入口**：网页版输入框点「添加文件（Add Files）」→「Deep Research」。它不再是一个单独的模型选项，所以在模型下拉里找不到。
2. **硬性条件只有两个**：年满 18 岁、已登录。免费账号也能用。
3. **免费账号高峰期可能暂时没有**：官方写明，需要大量算力的功能（点名了 Deep Research）在需求高峰时，对没有 Google AI 方案的用户可能不可用。
4. **有两种次数上限**：每日研究次数、同时进行的研究数。快用完时 Gemini 会提示当天还剩几次；具体数字官方未公开，Google AI Pro / Ultra 更高。
5. **旧报告找不到**多半是因为「保留活动记录」没开。

## 一、按顺序排查「Deep Research 不见了」

| 检查项 | 说明 |
| --- | --- |
| ① 找对入口 | 网页版：输入框里点「添加文件」，在弹出的菜单中选「Deep Research」。不要在模型名下拉里找 |
| ② 是否登录 | 未登录状态只能做基础的文字问答 |
| ③ 年龄 | 帮助中心写明须年满 18 岁；未成年人账号、受监管账号没有这个功能 |
| ④ 高峰期 | 无订阅用户在高需求时段可能暂时用不了，过一段时间再试 |
| ⑤ 当天次数用完 | 到达每日上限后要等刷新；同时进行的研究数到上限时，等前面的跑完 |
| ⑥ 整体额度用完 | Deep Research 比普通对话更费额度；账号的 5 小时 / 每周用量到上限时也会受影响，见本站《Gemini 怎么看额度》 |
| ⑦ 正在用技能 | 技能（Skills）目前不能和 Deep Research 一起用 |
| ⑧ 是不是在别的入口 | 帮助中心的步骤针对 Gemini 网页版和手机 App；Chrome 侧边栏、Google Messages 等入口的功能不完全相同 |
| ⑨ 工作 / 学校账号 | 能否使用取决于组织的 Workspace 版本和管理员设置 |

如果都排除了仍然没有，官方的渠道是通过「设置与帮助 → 发送反馈」报告问题。

## 二、次数和模型

帮助中心对限制的说明：

- **两种上限**：每天可以发起的研究次数；可以同时运行的研究数量；
- **提醒机制**：接近上限时，Gemini 会告诉你当天还剩多少次；
- **订阅差别**：Google AI Pro 和 Ultra 能创建的报告更多；
- **模型**：AI Pro / Ultra 用户可以用 **Pro 模型**生成报告，质量更高；所有用户都可以用带思考的模型生成；
- **Ultra 专属**：报告里可以直接包含图表、示意图、交互式模拟等可视化内容——但如果把 Gmail、云端硬盘等 Workspace 服务选作了来源，暂时不支持这项。

官方没有公布「免费几次、Pro 几次」的具体数字；网上流传的数字版本很多，以你账号里的提示为准。

**省次数的做法**：发起前把问题一次写清楚（范围、时间段、地区、要对比的对象、想要的输出结构）；Gemini 给出研究计划后先点「修改计划（Edit plan）」把方向调对，再点「开始研究」，避免跑完才发现方向偏了。

## 三、只研究自己的资料

Deep Research 默认把 Google 搜索作为来源，你可以在发起前调整：

1. 选中 Deep Research 后，点「来源（Sources）」；
2. 勾选想用的来源：Gmail、云端硬盘等（需要先把 Google Workspace 连接到 Gemini，见本站《Gemini 关联应用怎么设置》）；也可以通过「添加文件」上传文件、添加 Gemini Notebook（原 NotebookLM）的笔记本；
3. **只想用自己的资料**：取消勾选「Google 搜索」。

这样可以做「基于公司内部文档的调研」「基于我收藏的一批论文的综述」这类任务。

## 四、等待和通知

- 一般需要 **5～10 分钟**，复杂的更久；
- 等待期间可以离开这个对话去做别的；
- 完成后：网页版会在对应对话旁显示提示；手机 App 会推送通知（是否在锁屏显示取决于设置）；
- 报告准备好后点「打开（Open）」，在右侧 Canvas 面板里阅读。

## 五、找回以前的报告

1. 打开 gemini.google.com，侧边栏被收起的话点「菜单」；
2. 在「最近」里找到当时的研究对话。

**前提是「保留活动记录」开着**——帮助中心写明，只有开启该设置才能找到过去的研究报告。关闭期间做的研究离开后就找不回了；被手动删除或到期自动删除的对话也一样（见本站《Gemini 删除的对话怎么恢复》）。

## 六、报告的后续处理

在报告对话的 Canvas 面板里：

| 想做的事 | 操作 |
| --- | --- |
| 导出成可编辑文档 | 「分享与导出（Share & export）→ 导出到文档（Export to Docs）」 |
| 复制全文 | 「分享与导出 → 复制内容（Copy Contents）」 |
| 发给别人看 | 「分享与导出 → 分享 Canvas（Share Canvas）」，生成公开链接 |
| 听而不是读 | 「创建（Create）→ 音频概览（Audio Overview）」 |
| 做成图表或可视化 | 「创建」里输入描述，生成自定义可视化 |
| 做成测验、信息图、网页 | 「创建」菜单里的对应选项，见本站《Gemini Canvas 怎么用》 |

报告里的结论仍然需要核对：点开引用的来源，确认它说的和原文一致，尤其是数字、日期和引语。

## 常见问题

**Q：Deep Research 和 Deep Think 是一回事吗？**
不是。Deep Research 是联网（或读你的资料）做调研、输出带引用的报告；Deep Think 是 Pro 模型的最高思考等级，只有 Google AI Ultra 能用，用于解特别难的题。

**Q：免费账号到底能不能用？**
能。帮助中心的功能对比表里 Deep Research 对四个档位都标了可用，只是免费账号额度最低、高峰期可能暂停。

**Q：手机上有吗？**
有。帮助中心说明手机 App 完成研究后会以系统通知提醒你；入口位置以 App 实际界面为准。

**Q：Gemini API 里也有 Deep Research 吗？**
开发者接口是另一套体系，是否提供、怎么计量以 ai.google.dev 的文档为准，和 App 里的次数不通用。

## 参考资料

- Use Deep Research in Gemini Apps（Gemini 帮助中心）：https://support.google.com/gemini/answer/15719111
- Gemini Apps limits & upgrades for Google AI subscribers：https://support.google.com/gemini/answer/16275805
- About the transition from Gems to skills（技能暂不支持的功能）：https://support.google.com/gemini/answer/18560919
- Use Deep Think in Gemini Apps：https://support.google.com/gemini/answer/16345172
