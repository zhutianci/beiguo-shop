---
title: Claude Research（研究模式）怎么用：和联网搜索有什么区别
slug: claude-research-mode
products: [claude]
models: []
accountTier: PLUS
excerpt: Claude Research（研究模式 / 深度研究）怎么开、适合什么任务、和普通联网搜索与扩展思考有什么区别，Free 能不能用、会不会更费额度，一篇讲清。
checkedOn: 2026-10-07
sources:
  - https://support.claude.com/en/articles/11088861-use-research-on-claude
  - https://support.claude.com/en/articles/11095361-when-should-i-use-web-search-extended-thinking-and-research
  - https://support.claude.com/en/articles/16761823-claude-cowork-and-chat-are-one-claude
  - https://support.claude.com/en/articles/10684626-enable-and-use-web-search
  - https://support.claude.com/en/articles/10166901-use-google-workspace-connectors
  - https://support.claude.com/en/articles/8664678-change-the-model-effort-and-thinking-settings
  - https://claude.com/pricing
verify:
  - 新版 Claude 体验里用 /deep-research 或「+」→「Research」启动，旧界面是「+」→「Research」后出现蓝色标识，界面以实际为准
  - Research 单次耗时官方只给了「几分钟 / 1–3 分钟、五次以上工具调用」的说法，没有次数上限的公开数字
  - 「Research」在中文界面里的译名（研究 / 深度研究）以实际界面为准
---

> 本文根据 Claude 帮助中心官方文章和 claude.com 定价页整理，核对日期 2026-10-07。Research 是 Claude 的「研究模式」，网上也常叫「深度研究」；按钮名称以英文界面为准。

## 适用于谁

- 搜「claude research mode」「claude research 功能」「claude 深度研究」，想让 Claude 自己查一堆资料、写成带引用的报告的人；
- 分不清 Research、联网搜索和扩展思考该用哪个的人；
- 用过 ChatGPT 深度研究、想看看 Claude 对应功能的人（ChatGPT 的用法详见本站《ChatGPT 深度研究怎么用：次数限制与用不了的排查》）。

## 结论先说

1. **Research 只在付费套餐提供**（Pro / Max / Team / Enterprise），网页版、桌面版、手机版都能用；定价页 Free 一栏标的是「No」。
2. **它是「智能体式」的多轮搜索**：Claude 自己决定下一步查什么，多次搜索互相衔接，从不同角度把问题查透，几分钟后给出带引用、方便核对的结果。
3. **必须同时开着联网搜索**，Research 才能工作。
4. **怎么开**：输入框「+」→「Research」；新版 Claude 体验里也可以直接输入 `/deep-research`。
5. **额度规则和普通对话一样**，但因为要检索很多来源、输出长报告，消耗得更快。

## Research、联网搜索、扩展思考怎么选

官方对三者的定位：

| | 联网搜索 | 扩展思考 | Research |
| --- | --- | --- | --- |
| 适合 | 一两次搜索就能答的事实问题 | 不需要新信息、但要深入推理的问题 | 需要综合多个来源的深度调研 |
| 典型例子 | 天气、某公司基本信息、最新新闻 | 数学证明、调试代码、多角度分析伦理问题 | 竞品对比、用网上新信息更新旧文档、按日历和邮件排优先级 |
| 规模 | 1–2 次工具调用 | 不联网 | 5 次以上工具调用，约 1–3 分钟 |
| 套餐 | 全部套餐 | 以模型菜单里的选项为准 | 付费套餐 |

官方还建议把**扩展思考和 Research 一起开**：先想清楚怎么查，再大规模收集信息，适合写商业提案前调研新技术、分析多篇论文这类任务，最终报告也更长。

## 步骤

### 1. 先确认联网搜索已开启

旧界面：点输入框左下角「+」，确认「Web search」旁边有对勾。新版 Claude 体验没有联网开关，Claude 会按需搜索。联网搜索的详细说明见本站《Claude 联网搜索怎么开：网页搜索开关与常见问题》。

### 2. 打开 Research

- **旧界面**：点输入框左下角「+」→「Research」，输入框底部出现**蓝色标识**表示已开启；再点一次这个标识即关闭。
- **新版 Claude 体验**：输入 `/deep-research`，或点输入框下方「+」→「Research」。

### 3. （可选）打开扩展思考

点发送按钮旁的模型名称 → 鼠标移到「Effort」→ 打开「Thinking」（部分模型叫「Extended」）。注意官方说明 Sonnet 5.5、Opus 5.5、Fable 5.1、Opus 5 在 Claude 里的思考无法关闭，本来就是开着的。

### 4. 写好研究问题

Research 的效果很依赖问题本身。建议写清楚**目的、范围、输出格式**：

```text
帮我调研 2026 年面向中小团队的项目管理工具：
1. 选出 5 款主流产品，对比价格模式、协作功能、AI 功能、数据导出能力；
2. 每个结论都附来源链接，标注信息日期；
3. 最后用一张表格总结，并给出「10 人以内设计团队」的推荐和理由。
```

发出后 Claude 会开始在网页（以及你连接的应用）里多轮检索，几分钟后给出报告，正文里的引用可以点开核对。

### 5. 让 Research 读你自己的资料

如果你连接了 Google Workspace（Gmail、Google 日历、Google Drive），Research 会同时检索这些内部资料和网页。例如「根据我这周的日历和未读邮件，排一下明天的优先级，并查一下会议里提到的那家供应商的最新消息」。

Google Workspace 连接器对所有用户开放；Team / Enterprise 需要所有者先在组织层面启用。连接的具体步骤以帮助中心《Use Google Workspace connectors》为准。

## 常见问题

**Q：Free 能用 Research 吗？**
不能。帮助中心写明 Research 面向付费套餐，定价页 Free 一栏也是「No」。Free 可以用普通联网搜索。还没有订阅的话，可以在本站开通：[/chongzhi/claude-pro](/chongzhi/claude-pro)。

**Q：开了 Research，Claude 却没有去研究？**
官方建议直接在提问里点名，例如「Claude，请用 research 工具来……」。同时检查联网搜索是否开着。

**Q：开了 Research，但它没有读我连接的 Google 文档？**
官方建议在提问里明确指出来源，例如「从我的 Google Drive 里关于××的文档中提取相关内容」。

**Q：Research 会更费额度吗？**
官方说明 Research 和普通对话用同一套额度，但因为要检索多个来源、生成完整报告，会更快用完。额度规则详见本站《Claude 使用限制与额度：用量怎么看、什么时候重置（Free / Pro / Max / Claude Code）》。

**Q：Research 报告能直接相信吗？**
Research 每个结论都带引用，目的就是方便你核对。重要数字和结论，请点开原始来源确认。

## 参考资料

- Use research on Claude（帮助中心）：https://support.claude.com/en/articles/11088861-use-research-on-claude
- When should I use web search, extended thinking, and research?（帮助中心）：https://support.claude.com/en/articles/11095361-when-should-i-use-web-search-extended-thinking-and-research
- Claude Cowork and chat are one Claude（帮助中心）：https://support.claude.com/en/articles/16761823-claude-cowork-and-chat-are-one-claude
- Enable and use web search（帮助中心）：https://support.claude.com/en/articles/10684626-enable-and-use-web-search
- Use Google Workspace connectors（帮助中心）：https://support.claude.com/en/articles/10166901-use-google-workspace-connectors
- Change the model, effort, and thinking settings（帮助中心）：https://support.claude.com/en/articles/8664678-change-the-model-effort-and-thinking-settings
- Claude 定价页（官方）：https://claude.com/pricing
