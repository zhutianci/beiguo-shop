---
title: Claude Connectors（连接器）怎么用：连接 Google Drive、Gmail 等与推荐
slug: claude-connectors
products: [claude]
models: []
accountTier: FREE
excerpt: Claude 连接器（Connectors）是什么、在哪里找目录、怎么连接 Google Drive / Gmail / 日历、怎么控制权限，以及和插件、技能的区别。
checkedOn: 2026-10-07
sources:
  - https://support.claude.com/en/articles/11176164-use-connectors-to-extend-claude-s-capabilities
  - https://support.claude.com/en/articles/10166901-use-google-workspace-connectors
  - https://support.claude.com/en/articles/11725091-when-to-use-desktop-and-web-connectors
  - https://support.claude.com/en/articles/14328846-browse-skills-connectors-and-plugins-in-one-directory
  - https://claude.com/docs/connectors/getting-started
  - https://claude.com/docs/connectors/directory
  - https://claude.com/docs/connectors/verification
  - https://claude.com/docs/connectors/custom/add-unlisted
  - https://claude.com/docs/connectors/google/drive
  - https://claude.com/docs/connectors/google/gmail
  - https://claude.com/docs/extend/overview
  - https://claude.com/connectors
  - https://claude.com/pricing
verify:
  - Gmail 连接器的套餐与能力两处说法不一致：Claude Docs 的 Gmail 页写「Pro / Max / Team / Enterprise 可用、只读，不能发送或修改邮件」；帮助中心《Use Google Workspace connectors》写「所有用户可用」，并列出起草、发送、回复、转发（默认每次需确认）。站长用 Free 账号实际确认
  - 进入目录的入口两处写法略有不同：帮助中心写「Customize > Connectors 点 + 号」，Claude Docs 写「Customize > Connectors 点 Discover」；中文界面里的菜单名以实际为准
  - claude.com/connectors 目录页显示的连接器总数（核对时为 912 个）会随时变化
---

> 本文根据 Anthropic 官方帮助中心、Claude Docs 连接器文档和 claude.com 连接器目录页整理，核对日期 2026-10-07。菜单名称以英文界面为准，中文界面里的叫法可能略有不同。

## 适用于谁

- 想让 Claude 直接读自己 Google Drive 里的文件、搜 Gmail 邮件、查日历的人；
- 搜「claude connectors 推荐」「claude connectors 列表 / directory」，想知道有哪些连接器可用的人；
- 分不清「连接器（Connector）」「插件（Plugin）」「技能（Skill）」有什么区别的人。

## 结论先说

1. **连接器让 Claude 访问你的应用和服务**：读取你的数据、在这些服务里执行操作，比如在 Google Drive 里搜文件、在 Linear 里建工单、在 Slack 里发消息。它背后用的是 MCP（Model Context Protocol）协议。
2. **Free 也能用**：定价页把「Connectors」列为 Free / Pro / Max 都有；自定义连接器 Free 最多加 1 个。
3. **权限跟着你的账号走**：你在原服务里看不到的文件，Claude 通过连接器也看不到。
4. **每个对话单独开关**：连好以后，在输入框的 **+ → Connectors** 里打开对应开关，Claude 才会在这个对话里用它。
5. **一次连接，到处可用**：在网页版或桌面版连接的远程连接器，手机 App、Cowork、用同一账号登录的 Claude Code 也能用。

## 连接器、技能、插件有什么区别

官方 Claude Docs 的说法可以概括成一句话：**连接器给 Claude「能接触到什么」，技能教 Claude「怎么做」，插件把两者打包成一次安装。**

| | 作用 | 举例 |
| --- | --- | --- |
| 连接器（MCP connector） | 连接外部服务，读取数据、执行操作 | 你的文件、日历、工单系统、内部 API |
| 技能（Skill） | 一份书面说明（可带脚本和参考文件），任务需要时 Claude 才读取 | 你的发布说明格式、合同检查清单、周报模板 |
| 插件（Plugin） | 安装包，可以同时包含技能、连接器、命令和子代理 | 某个产品的连接器 + 配套技能 |

三者都在 claude.ai 或桌面版的 **Customize（自定义）** 页面里添加。技能的详细用法详见本站《Claude Skills 是什么、怎么装、推荐哪些》。

## 步骤

### 1. 打开连接器目录

- 网页版：进入 **Customize → Connectors**（地址是 claude.ai/customize/connectors），点 **Discover** 浏览目录；
- 桌面版：侧边栏点 **Customize**，再点 **Connectors**；
- 也可以在对话里点输入框左下角的 **+**（或输入 `/`），悬停到 **Connectors**，选 **Manage connectors**。

目录可以按分类浏览，也可以在 **Search connectors** 里直接搜服务名。每个连接器有自己的页面，写明能做什么、是只读还是能写入、在哪些平台可用。

### 2. 连接一个服务

1. 点开想要的连接器，看清它的说明和权限；
2. 点 **Connect to Claude**（有些连接器会先让你填服务器地址或账号所在区域）；
3. 跳到对方服务的登录页：网页版在同一个标签页打开，桌面版会在你的浏览器里打开；
4. 登录、查看 Claude 申请的权限、同意授权；
5. 回到 Connectors 页面，看到它出现在 **Your connectors** 下、状态是 **Connected**，就连好了。

官方提醒：连接一个服务，就等于授权 Claude 按你的账号权限去读取、甚至修改那个服务里的数据，只连接你信任且确实需要的服务。

### 3. 在对话里使用

1. 在对话输入框点 **+ → Connectors**，确认对应连接器的开关是打开的；
2. 直接提需要这个服务的问题，例如「明天下午我日历上有什么安排？」「总结一下分配给我的未关闭工单」；
3. Claude 调用连接器工具前可能会请你确认：选 **Allow once**（仅这一次）或 **Always allow**（以后这个工具不再问）。

连好的应用 Claude 也会在合适的时候主动调用，不用每次点名。想让某个对话不用它，关掉这个对话里的开关就行，连接本身不受影响。

**连接器很多时**：在 **+ → Connectors → Tool access** 里可以选加载方式。默认的 Auto 适合大多数人；官方建议同时开了 10 个以上连接器时改成 **On demand**，给对话留出更多空间。

### 4. 管理、断开和删除

进入 **Customize → Connectors**，在 **Your connectors** 下点开某个连接器：

- **Tool permissions**：给每组工具或单个工具设置 **Always allow（总是允许）/ Needs approval（需要确认）/ Blocked（禁止）**，比如只允许读、不允许写；
- **Disconnect**：让 Claude 退出该服务的登录，连接器仍留在列表里，以后可以重新连；
- **Remove**：在三个点菜单里把连接器从账号中移除；
- 如果 Claude 失去了访问权限，那一行会显示 **Reconnect**，点它重新登录即可。

## 常用连接器：Google Drive、Gmail、Google 日历

claude.com/connectors 目录页的「Top connectors」里排在前面的有：Google Drive、Gmail、Google Calendar、Canva、Microsoft 365、Notion、Figma、Slack、HubSpot、Asana、Linear、monday.com，都带「Anthropic verified」标记。下面说最常用的三个 Google 连接器。

### Google Drive

- **能读什么**：Google 文档 / 表格 / 幻灯片、PDF、Word / Excel / PowerPoint、OpenDocument 文件、PNG 和 JPEG 图片；读不到文件里的批注和修改建议，超大文件的内容可能不完整。
- **两种用法**：一是开着连接器让 Claude 自己搜；二是点 **+ → Add from Google Drive** 手动挑文件附到对话里，Claude 每次发消息都会读取最新内容。
- **加到项目**：只能加到**私有项目**的知识库里，共享项目里这个选项是灰的。
- **转换规则**：手动添加时，Google 文档转成 Markdown（不含图片）、表格转成 CSV（包含所有工作表）、幻灯片转成纯文本；单个文件导出上限约 10 MB，超过就只能拿到文件名和信息。
- 帮助中心还写到：在开启「代码执行与文件创建」后，可以把 Claude 生成的文件直接存进 Drive。

### Gmail

- 用自然语言搜邮件、按内容回答问题，回答里带引用，可以点回原邮件核对；
- 看不到邮件里嵌入的图片，附件只能看到元信息、看不到内容；
- 能不能起草和发送邮件，官方两处说法不一致：Claude Docs 写「只读，不能创建、发送或修改邮件」，帮助中心写「可以发送、回复、转发，默认每次都会先征求你同意」。以你账号里实际显示的工具为准。

### Google Calendar

查看日程和共享日历、创建 / 修改 / 删除日程、找几位参会人的共同空闲时间、回复邀请、设置周期会议。

## 远程连接器 vs 桌面扩展

| 你的工具是…… | 用什么 | 在哪能用 |
| --- | --- | --- |
| 云服务 / SaaS，或目录里有的 | 远程连接器 | 所有平台 |
| 你自己搭的、有公网地址的 MCP 服务器 | 远程连接器（按自定义添加） | 所有平台 |
| 跑在你电脑上的程序、本地文件夹、localhost 数据库 | 桌面扩展 | 桌面版、Claude Code |

**添加自定义连接器（远程）**：**Customize → Connectors → Add custom connector**（部分界面是 **Add → Custom → Web**），填名称和远程 MCP 服务器地址（例如 `https://mcp.example.com/mcp`），按提示选择登录方式。注意自定义连接器是**从 Anthropic 的云端**去连你的服务器，所以服务器必须能从公网访问。

**安装桌面扩展（本地）**：在桌面版进入 **Settings → Extensions**，把 `.mcpb` 文件拖进页面，点 **Install** 确认。

## 安全提示

- 目录里的标签：**Verified**（Anthropic 测试过工具质量和兼容性，带对勾）、**Community**（第三方开发，只做过初步筛查）、**Custom**（你自己加的，未经审核）。官方特别说明：Verified 也**不是安全审计**，开发者之后仍可能修改工具。
- 只连接可信开发者的服务，授权时看清申请的权限范围；
- 警惕提示词注入：连接器读到的网页、邮件、文档里可能藏着恶意指令；
- 不用的连接器及时断开。

## 常见问题

**Q：Free 账号能用连接器吗？**
能。定价页把 Connectors 列为 Free 可用，帮助中心写网页连接器对所有用户开放；自定义连接器 Free 限 1 个。个别连接器（如 Gmail）的套餐要求两处说法不一致，以实际界面为准。

**Q：Team / Enterprise 账号为什么在列表里找不到某个连接器？**
团队版需要 Owner 先在 **Organization settings → Connectors** 里把它加给组织，成员再用自己的账号登录连接。Team 成员没有权限时会看到 **Request** 按钮，点了会通知 Owner。

**Q：在网页版连好的连接器，手机上能用吗？**
能。官方说明在网页版或桌面版连好的服务，下次在 iOS / Android App 登录时即可使用；在手机上新增连接器目前是 beta。

**Q：自定义连接器一直连不上、超时？**
最常见的原因是服务器在内网或防火墙后面。自定义连接器从 Anthropic 云端访问，即使你用的是桌面版也一样。需要把服务器放到公网，或按官方文档放行 Anthropic 的 IP 段。

**Q：Claude Code 里能用这些连接器吗？**
能。用同一个 Claude 账号登录 Claude Code 时，会带上你在 claude.ai 添加的连接器。在 Claude Code 里自己配 MCP 详见本站《Claude Code MCP 配置教程：claude mcp add、配置文件位置与常用 MCP》。

## 参考资料

- Use connectors to extend Claude's capabilities（官方）：https://support.claude.com/en/articles/11176164-use-connectors-to-extend-claude-s-capabilities
- Use Google Workspace connectors（官方）：https://support.claude.com/en/articles/10166901-use-google-workspace-connectors
- When to use desktop and web connectors（官方）：https://support.claude.com/en/articles/11725091-when-to-use-desktop-and-web-connectors
- Browse skills, connectors, and plugins in one directory（官方）：https://support.claude.com/en/articles/14328846-browse-skills-connectors-and-plugins-in-one-directory
- Get started with connectors（官方）：https://claude.com/docs/connectors/getting-started
- Connectors directory（官方）：https://claude.com/docs/connectors/directory
- Connector verification（官方）：https://claude.com/docs/connectors/verification
- Add a connector that isn't in the directory（官方）：https://claude.com/docs/connectors/custom/add-unlisted
- Google Drive / Gmail 连接器（官方）：https://claude.com/docs/connectors/google/drive 、https://claude.com/docs/connectors/google/gmail
- Connectors, skills, and plugins（官方）：https://claude.com/docs/extend/overview
- 连接器与插件目录（官方）：https://claude.com/connectors
- 套餐对比（官方）：https://claude.com/pricing
