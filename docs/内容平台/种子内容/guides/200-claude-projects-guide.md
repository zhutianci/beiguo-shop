---
title: Claude Projects 怎么用：项目知识库、项目指令与新版项目（beta）
slug: claude-projects-guide
products: [claude]
models: []
accountTier: FREE
excerpt: Claude Projects（项目）是什么、怎么建？项目知识库能传多大的文件、项目指令怎么写、Free 能建几个，以及 Claude Code 里的新版项目（beta）有什么不同。
checkedOn: 2026-10-07
sources:
  - https://support.claude.com/en/articles/9517075-what-are-projects
  - https://support.claude.com/en/articles/9519177-how-can-i-create-and-manage-projects
  - https://support.claude.com/en/articles/11473015-retrieval-augmented-generation-rag-for-projects
  - https://support.claude.com/en/articles/9519189-manage-project-visibility-and-sharing
  - https://support.claude.com/en/articles/8241126-upload-files-to-claude
  - https://support.claude.com/en/articles/10185728-understanding-claude-s-personalization-features
  - https://support.claude.com/en/articles/11817273-use-claude-s-chat-search-and-memory-to-build-on-previous-context
  - https://code.claude.com/docs/en/claude-projects
  - https://claude.com/pricing
verify:
  - 帮助中心《Understanding Claude's personalization features》末尾写项目指令「仅付费套餐（paid plans only）」，但同文和《What are projects》都写 Free 可建最多 5 个项目、定价页也标 Free「Up to 5」，两处不一致，请用 Free 账号确认能否设置项目指令
  - 项目文件单个 30MB、聊天上传单个 500MB，以帮助中心《Upload files to Claude》为准，可能调整
  - 新版项目（beta）目前只在 claude.ai/code 和桌面版 Code 标签页逐步开放，聊天和 Cowork 何时升级官方未给日期
  - 中文界面里「New Project / Set project instructions / Add to project」等按钮的中文译名以实际界面为准
---

> 本文根据 Claude 帮助中心、Claude Code 官方文档和 claude.com 定价页整理，核对日期 2026-10-07；截图引用自 Claude 帮助中心并注明出处。按钮名称以英文界面为准，中文界面译名可能不同。

## 适用于谁

- 搜「claude projects 教学」「claude project 是什么」，想把一个长期任务的资料和要求固定下来，不用每次开新对话都重新交代的人；
- 想知道项目里能放多少文件（「claude projects file limit」）、Free 能不能用的人；
- 在 Claude Code 侧边栏看到新的「Projects」入口，搞不清和聊天里的项目是什么关系的人。

## 结论先说

1. **项目 = 一个独立的工作区**：有自己的对话列表、知识库（Project knowledge）和项目指令（Project instructions）。放进知识库的文件、写好的指令，会用于这个项目里的**每一个**对话。
2. **所有用户都能用，Free 最多建 5 个项目**；付费套餐（Pro / Max / Team / Enterprise）在知识库接近上下文上限时会自动切到 RAG 模式，容量最多扩大约 10 倍。
3. **项目文件限制**：单个文件 30MB；文件数量不限，但总内容要装得进 Claude 的上下文窗口（付费套餐有 RAG 兜底）；除多模态 PDF 外只提取文字。
4. **同一项目里的对话之间默认不共享上下文**，想让所有对话都知道的东西，要放进知识库或项目指令。
5. **新版项目（beta）** 是另一回事：一个项目就是一个长对话，Claude 把工作拆成并行的云端线程去跑。目前只对部分 Pro / Max 的 Claude Code 用户开放。

## 步骤

### 1. 新建项目

1. 把鼠标移到左侧边栏，点「Projects」，或直接打开 claude.ai/projects；
2. 点右上角「+ New Project」；
3. 填项目名称和描述。注意：**官方说明 Claude 看不到名称和描述**，它们只是给你自己看的，要交代给 Claude 的内容请写进项目指令；
4. Team / Enterprise 用户还要选可见范围：仅自己和受邀成员（private），或全组织可见（需管理员开启）。

建好后就可以在项目里开新对话。

### 2. 往知识库里放资料

项目主页右侧就是知识库：

1. 点「+」按钮；
2. 上传文档、文本文件或代码片段；
3. Claude 会处理这些内容，在本项目所有对话里当作背景资料使用。

**项目文件和聊天附件的限制不一样（官方数字）：**

| | 聊天里直接上传 | 项目知识库 |
| --- | --- | --- |
| 单个文件大小 | 500MB | 30MB |
| 文件数量 | 每个对话最多 20 个 | 不限，但总内容要在上下文窗口内 |
| 内容处理 | PDF 可分析图文 | 只提取文字（多模态 PDF 除外） |

支持的格式和 PDF 页数规则，详见本站《Claude 上传文件限制：支持格式、大小与 PDF 分析》。

**RAG 模式（付费套餐）**：知识库内容接近上下文上限时，Claude 会自动启用 RAG（检索增强生成），不再一次性把全部文件塞进上下文，而是用「项目知识搜索」工具按需检索相关片段。你会在项目里看到 RAG 已启用的标识，对话中也会看到 Claude 调用这个搜索工具。不需要手动开启，也不能手动控制；知识量降回阈值以下，还可能自动切回普通模式。

官方给的 RAG 项目建议：

- 一开始就把相关资料尽量传全；
- 文件名起得清楚、有描述性，方便检索命中；
- 相关资料放在同一个项目里；
- 提问时直接点名某个文件，例如「根据《2026 年产品路线图.pdf》回答」。

### 3. 写项目指令

1. 在项目页点「Set project instructions」；
2. 写下你希望 Claude 在这个项目里怎么表现，点「Save instructions」；
3. 之后这个项目里的所有对话都会遵守。

项目指令适合写**只属于这个项目**的要求，例如角色、语气、固定流程、输出格式。示例：

```text
你是我的跨境电商文案助手。
- 所有商品文案先给中文版，再给英文版。
- 标题不超过 60 个字符，卖点用 3 条短句。
- 参考知识库里的《品牌语气指南》，不要使用夸大宣传用语。
- 不确定的参数直接说不知道，不要编造。
```

如果某条要求对**所有对话**都适用（比如「回答一律用简体中文」），应该写在账号级的个人指令里：左下角头像 → Settings →「Instructions for Claude」。官方把两者分得很清楚：个人指令作用于全部对话，项目指令只作用于本项目。

### 4. 把已有对话移进项目

单独开的对话也能归到项目里：点对话名称旁的下拉箭头 →「Add to project」，在弹出的窗口里搜索或选择目标项目。

![对话标题下拉菜单里的「Add to project」选项，用来把单独的对话移入项目](seed:g200-add-to-project.png)
*图片来源：[Claude 帮助中心《How can I create and manage projects?》](https://support.claude.com/en/articles/9519177-how-can-i-create-and-manage-projects)*

已经在项目里的对话，用同一个下拉菜单可以「Change project」（换到别的项目）或「Remove from project」（移出项目）。

![项目内对话的下拉菜单：Change project 和 Remove from project](seed:g200-chat-menu.png)
*图片来源：[Claude 帮助中心《How can I create and manage projects?》](https://support.claude.com/en/articles/9519177-how-can-i-create-and-manage-projects)*

移动对话还会影响记忆：每个项目有独立的记忆空间，和项目外的对话分开。误把无关对话开在项目里，移出项目后它就归入项目外的记忆。记忆功能详见本站《Claude 记忆功能怎么用：开启、查看、导入与导出记忆》。

### 5. 收藏、归档和删除

- **收藏（Star）**：在 Projects 页点项目右上角「...」→「Star」，或在项目里点星标图标，项目会出现在左侧栏收藏区；
- **归档（Archive）**：项目里点「...」→ 确认归档。归档项目排在项目列表底部，对话仍可查看；
- **删除**：Projects 页或项目内点「...」→「Delete」→「Yes, delete」。**归档状态的项目不能直接删除**，要先「Unarchive」再删。

### 6. 团队共享（仅 Team / Enterprise）

Team 和 Enterprise 用户可以点项目名右侧的「Share project」，按姓名或邮箱邀请成员（也能粘贴一串邮箱批量添加），权限分两种：

- **Can view**：能看项目内容、知识库和指令，能在项目里聊天，不能修改；
- **Can edit**：能改指令和知识库、管理成员。

共享的是项目和知识库，**你在项目里的对话默认仍是私有的**，要单独点对话右上角的 Share 才会分享。Free、Pro、Max 没有项目共享功能。

## 新版项目（beta）是什么

Anthropic 正在分阶段推出新版项目，**先从 Claude Code 开始**：

- 一个项目就是一个持续的对话。你随时把任务丢进来，Claude 把工作拆成多个**并行的线程**在云端运行，关掉电脑也会继续；
- 每个线程启动时都带着项目的文件、代码仓库、指令和记忆；项目的 **Library** 收集你加的文件和 Claude 产出的文件；
- 目前是 Pro、Max 部分 Claude Code 用户的公开 beta：在 claude.ai/code 或桌面版 Code 标签页的侧边栏看到「Projects」就是有了，没有可以加入候补名单；Team、Enterprise 暂未开放；
- 新版项目的项目指令最长 16,000 个字符，项目记忆在「Project settings > Memory」里查看和编辑；
- 聊天和 Cowork 里的**现有项目照常使用**，官方说会随推进逐步把 Pro / Max 的项目升级到新版；
- 多个线程同时跑会更快消耗套餐用量。

如果你只是想在聊天里整理资料、固定要求，用本文前面讲的「当前版本项目」即可。Claude Code 的使用详见本站《Claude Code 网页版（claude.ai/code）怎么用：在云端跑任务》。

## 常见问题

**Q：Free 能用 Projects 吗？能建几个？**
能。帮助中心和定价页都写明所有用户可用，Free 最多 5 个项目。但 RAG 扩容只在付费套餐上提供，Free 的知识库容量受上下文窗口限制。还没有订阅的话，可以在本站开通：[/chongzhi/claude-pro](/chongzhi/claude-pro)。

**Q：知识库提示「满了」或传不上去怎么办？**
Free 账号只能精简内容：删掉不需要的文件、把大文档拆成相关部分。付费套餐会自动切 RAG。另外检查单个文件是否超过 30MB。

**Q：我在项目 A 的一个对话里讲过的事，另一个对话里 Claude 不知道？**
正常。官方说明同一项目内的对话默认不共享上下文，除非你把信息加进知识库。要长期生效的内容，放进知识库或项目指令。

**Q：项目指令和 Skills、个人指令有什么区别？**
个人指令影响所有对话；项目指令只影响本项目；Skills 是可按需调用的能力或固定流程。Skills 详见本站《Claude Skills 是什么、怎么装、推荐哪些》。

**Q：降级或取消订阅后项目会消失吗？**
定价页说明取消订阅不会删除数据，对话、项目和文件都保留在账号里，但部分功能在 Free 上不可用。

## 参考资料

- What are projects?（帮助中心）：https://support.claude.com/en/articles/9517075-what-are-projects
- How can I create and manage projects?（帮助中心）：https://support.claude.com/en/articles/9519177-how-can-i-create-and-manage-projects
- Retrieval augmented generation (RAG) for projects（帮助中心）：https://support.claude.com/en/articles/11473015-retrieval-augmented-generation-rag-for-projects
- Manage project visibility and sharing（帮助中心）：https://support.claude.com/en/articles/9519189-manage-project-visibility-and-sharing
- Upload files to Claude（帮助中心）：https://support.claude.com/en/articles/8241126-upload-files-to-claude
- Understanding Claude's personalization features（帮助中心）：https://support.claude.com/en/articles/10185728-understanding-claude-s-personalization-features
- Let Claude coordinate ongoing work with Projects（官方，Claude Code 文档）：https://code.claude.com/docs/en/claude-projects
- Claude 定价页（官方）：https://claude.com/pricing
