---
title: Claude Artifacts 是什么、怎么用：创建、分享与导出（2026 新版）
slug: claude-artifacts
products: [claude]
models: []
accountTier: PLUS
excerpt: Claude Artifacts（作品）是什么？2026 年 9 月改版后怎么在对话里做文档、幻灯片、设计和小工具，怎么分享链接、导出成 Word / PPT / PDF / HTML，旧版 Artifacts 还能不能用，一篇讲清。
checkedOn: 2026-10-07
sources:
  - https://support.claude.com/en/articles/17153992-what-are-artifacts-and-how-do-i-use-them
  - https://support.claude.com/en/articles/9547008-share-artifacts
  - https://support.claude.com/en/articles/16923645-get-started-with-claude-docs
  - https://support.claude.com/en/articles/17274727-artifact-usage-promotion
  - https://support.claude.com/en/articles/12138966-release-notes
  - https://claude.com/features/artifacts
  - https://claude.com/pricing
  - https://code.claude.com/docs/en/artifacts
  - https://www.anthropic.com/news/claude-design-anthropic-labs
verify:
  - Free 能否使用 Docs / Slides / Design 模板：帮助中心正文和定价页都写「模板为付费套餐 beta」，但 2026-09-16 发布说明写「包括 Free 在内所有套餐可用」，两处不一致，站长用 Free 账号确认
  - 中文界面里「Output / Artifacts 标签 / Share / Export」等按钮的中文名称，以实际界面为准
  - 「Artifacts 用量减半」活动只到 2026-10-15，过期后删除对应段落
---

> 本文根据 Anthropic 官方帮助中心、发布说明、产品页和 Claude Code 官方文档整理，核对日期 2026-10-07。截图引用自 Claude Code 官方文档和 Anthropic 官方公告配图，图下注明出处。Artifacts 在 2026 年 9 月刚改版，网上较早的教程（「右侧弹出代码窗口」「Publish 发布」）说的多是旧版。

## 适用于谁

- 搜「claude artifacts 是什么」「claude artifacts 怎么用」，第一次在 Claude 右侧看到弹出窗口的人；
- 想让 Claude 直接做一份能分享的文档、幻灯片、网页小工具或数据看板的人；
- 想把 Claude 做出来的东西导出成 Word、PPT、PDF、HTML 的人（「claude artifacts export」）。

## 结论先说

1. **Artifact 是 Claude 做出来、可以直接拿给别人看的成品**：设计稿、幻灯片、文档、仪表盘、小型交互工具等。它在对话旁边打开，可以继续编辑、以后再回来改、分享给别人。
2. **2026 年 9 月 16 日改版**：现在在任何对话里都能直接要一份设计、幻灯片或文档，也可以从「Artifacts」标签页的模板开始；这天之前在聊天里做的叫「旧版 Artifacts」，还能打开和分享，但不能再新建。
3. **要先开开关**：在「设置 → 功能（Capabilities）」里打开「云端代码执行与文件创建」，否则不会生成 Artifact。
4. **默认只有自己能看**，点「分享（Share）」才会给出链接；模板做的作品可以一键导出成常用格式。

## 套餐差异（官方帮助中心）

| 功能 | Free | Pro | Max | Team | Enterprise |
| --- | --- | --- | --- | --- | --- |
| 在聊天里创建 Artifact | ✅ | ✅ | ✅ | ✅ | ✅ |
| 从模板开始（Design / Slides / Docs） | — | ✅ | ✅ | ✅ | ✅（需管理员开启） |
| 连接你的应用（Asana、Google 日历、Slack 等） | — | ✅ | ✅ | ✅ | ✅ |
| 在 Artifact 里存储数据 | — | ✅ | ✅ | ✅ | ✅ |

模板目前是付费套餐上的 beta 功能，Pro、Max、Team 默认开启；Claude Code 里的 Artifacts 在所有包含 Claude Code 的套餐上可用。在本站开通 Pro 可前往 [/chongzhi/claude-pro](/chongzhi/claude-pro)。

## 步骤

### 1. 打开功能开关

个人套餐：「设置 → 功能（Settings → Capabilities）」，打开「云端代码执行与文件创建（Cloud code execution and file creation）」。Team / Enterprise 由管理员在「组织设置 → 功能」里统一控制。

### 2. 让 Claude 做一个 Artifact

三种入口：

- **直接在对话里说**：例如「把我们刚才讨论的方案整理成一份可以发给团队的产品需求文档」「做一个可以输入身高体重、自动算 BMI 的小网页」。
- **在输入框选「输出（Output）」**，再选文档（Docs）、幻灯片（Slides）或设计（Design）模板；文档也可以用 `/docs` 开头。
- **去侧边栏的「Artifacts」标签页**，从模板库里挑一个开始。

Claude 什么时候会自动做成 Artifact？官方给的标准：内容比较完整、通常超过 15 行，独立成篇、不依赖对话上下文也能看懂，而且你很可能要修改、反复用或以后再看。

三类模板的区别：

- **Docs（文档）**：和 Claude、同事实时协作的「活文档」，支持标题、表格、多个标签页；Claude 动笔前会先问几个问题，并在文档里留批注说明它的取舍。
- **Slides（幻灯片）**：根据笔记、报告或对话内容生成演示稿，可以直接改某一页、在 Claude 里直接演示。
- **Design（设计）**：视觉稿、原型、单页介绍、落地页，可以导入你的设计系统（颜色、字体、组件）。

![Claude Design 的画布界面：顶部是评论（Comment）、编辑（Edit）和微调（Tweaks）开关，右侧面板可以调主题、断点和各项参数（2026 年 4 月 Claude Design 发布时的官方配图，现已并入对话，界面以实际为准）](seed:g20-claude-design-canvas.jpg)
*图片来源：[Anthropic 官方公告《Introducing Claude Design by Anthropic Labs》](https://www.anthropic.com/news/claude-design-anthropic-labs)*

### 3. 编辑和迭代

- 直接告诉 Claude 要改什么，Artifact 会实时更新；
- 模板做的作品可以直接上手改：在文档里打字、改某一页幻灯片、在设计画布上拖动元素；
- 文档或 Markdown 里**选中一段文字 → 点「用 Claude 编辑（Edit with Claude）」**再写要求，Claude 就只改你标出的那一段，不用再描述是哪一段；
- 想换个方向又不丢掉当前版本：编辑之前的某条消息，会生成一个新的对话分支，各自有各自的 Artifact；
- Artifact 报错时，点错误信息附近的「Try fixing with Claude」，把错误详情交给 Claude 修复（官方说明不保证一定成功）。

### 4. 找回以前做的

你做过的所有 Artifact 都会保存在侧边栏的「Artifacts」标签页，在任何对话里都能找到，也可以从这里整理和新建。手机 App 上可以在对话里要求生成，并在 Artifacts 标签查看；但从模板开始、编辑和修改分享设置要用网页版或桌面版。

### 5. 分享

1. 打开 Artifact，点「分享（Share）」；
2. Pro / Max 在「谁可以访问」里选「仅自己」或「拥有链接的任何人」；也可以输入邮箱邀请指定的人（beta，每个 Artifact 最多邀请 50 位组织外的人，邀请 30 天未接受会过期）；
3. 复制链接发出去。

注意几点：

- **打开分享链接的人也需要登录 Claude 账号**，唯一例外是旧版公开发布的 Artifact；
- 权限分三档：可查看、可评论（还能下载 Artifact 提供的文件）、可编辑；
- 会调用 Claude 或连接了你应用的 Artifact，不能设成「拥有链接的任何人」；
- 取消分享：同一菜单里改回「仅自己」。

### 6. 导出

- **文档**：可导出 Word、PDF、Markdown、Google 文档；
- **幻灯片**：PowerPoint、PDF；
- **设计**：.zip、PDF、PowerPoint、独立 HTML，或直接发送到其他工具；
- **旧版 Artifact**：用面板顶部的按钮查看代码、复制内容或下载。

## 会「调用 Claude」的 Artifact：做成小应用

你可以让 Claude 做一个**本身会调用 Claude 的 Artifact**，比如问答机器人、写作教练、小游戏。别人打开后用自己的 Claude 账号登录使用，消耗的是**使用者自己的套餐额度**，不是你的；不需要 API Key，分享也不收费。新建的这类 Artifact 第一次调用 Claude 前会征求同意。注意新版里这类作品不能设成「拥有链接的任何人」，通过邮箱邀请的组织外成员也用不了其中调用 Claude 的部分；面向公开分享的，是旧版里「发布」出去的 Artifact。

付费套餐还可以：

- **连接应用**：让 Artifact 读写 Asana、Google 日历、Slack 等你已连接的应用，第一次使用时会列出要用的工具请你确认；每个使用者连接的都是自己的账号。
- **存储数据**：做日记、打卡表、排行榜之类会保存数据的工具。分「个人存储」（每人只看到自己的）和「共享存储」（所有人看到同一份），每个 Artifact 上限 20 MB、只能存文本。官方提醒：录入敏感信息前先确认它用的是不是共享存储。

## Claude Code 里的 Artifacts

在 Claude Code 里（Pro、Max、Team、Enterprise，需用 `/login` 登录订阅账号），可以让 Claude 把会话成果发布成一个 Artifact：一张实时更新的网页，地址在 claude.ai 上，默认私有。适合做带批注的 PR 讲解、根据会话数据生成的看板、几种方案并排对比、长任务的进度时间线等。

```text
做一个 artifact，按服务统计上周的部署失败次数，排查过程中持续更新
```

- 发布后浏览器会自动打开；每次重新发布都是一个新版本，可以在「分享」里选择给别人看哪个版本；
- 运行 `/artifacts` 列出你拥有和别人分享给你的所有 Artifact，按 `o` 在浏览器打开、`c` 复制链接；`Ctrl+]` 重新打开本会话最近的一个；
- 它只是一个独立页面，没有后端，不能替代真正部署的内部系统。

![Claude Code 发布的 Artifact 在浏览器中打开：右上角「分享」菜单里可以选择分享的版本、可见范围（示例为「Acme 的所有人」，团队版界面）并复制链接](seed:g20-claude-code-artifact-share.jpg)
*图片来源：[Claude Code 官方文档《Share session output as artifacts》](https://code.claude.com/docs/en/artifacts)*

## 常见问题

**Q：我以前做的 Artifact 还在吗？**
在。2026 年 9 月 16 日之前在聊天里做的是「旧版 Artifacts」，可以继续打开、发布和分享，只是不能再新建这种类型。旧版在 Free / Pro / Max 上显示的是「发布（Publish）」按钮，发布后任何拿到链接的人不登录也能看，还可以生成嵌入代码放到其他网站。**注意：取消发布后不能再次发布，并且会永久删除它存储的数据。**

**Q：为什么我的对话里不出现 Artifact？**
先检查「设置 → 功能」里的云端代码执行与文件创建是否打开；团队账号要看管理员是否允许。内容太短、和对话强相关时，Claude 也可能直接在回复里给出，这时可以明确说「做成一个 Artifact」。

**Q：Free 能用吗？**
能在聊天里创建 Artifact；从模板开始、连接应用、存储数据这些按帮助中心说明属于付费套餐功能。

**Q：做 Artifact 会更费额度吗？**
帮助中心把「生成和使用 Artifacts」列为影响用量的因素之一。另有一个限时活动：2026 年 10 月 1 日至 15 日，Pro、Max、Team 在聊天或 Cowork 里创建或编辑 Artifact 后，接下来 10 条消息只按一半计入 5 小时会话额度（不影响每周额度，不适用于 Claude Code 和旧版 Artifacts）。额度规则详见本站《Claude 使用限制与额度》。

**Q：打开别人分享的 Artifact 安全吗？**
官方提醒只打开信任的人分享的 Artifact，把它当作陌生人发来的文件看待；基于别人发布的 Artifact 二次创作时同样如此。

## 参考资料

- What are artifacts and how do I use them?（官方）：https://support.claude.com/en/articles/17153992-what-are-artifacts-and-how-do-i-use-them
- Share artifacts（官方）：https://support.claude.com/en/articles/9547008-share-artifacts
- Get started with Claude Docs（官方）：https://support.claude.com/en/articles/16923645-get-started-with-claude-docs
- Artifact usage promotion（官方）：https://support.claude.com/en/articles/17274727-artifact-usage-promotion
- Claude 发布说明（2026-09-16 条目）：https://support.claude.com/en/articles/12138966-release-notes
- Artifacts 产品页：https://claude.com/features/artifacts
- 套餐对比：https://claude.com/pricing
- Claude Code：Share session output as artifacts（官方）：https://code.claude.com/docs/en/artifacts
- Anthropic：Introducing Claude Design by Anthropic Labs：https://www.anthropic.com/news/claude-design-anthropic-labs
