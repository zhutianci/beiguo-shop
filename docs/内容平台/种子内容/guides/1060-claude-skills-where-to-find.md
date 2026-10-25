---
title: Claude Skills 去哪找、怎么装：官方目录、GitHub 仓库和本站 Skill 库
slug: claude-skills-where-to-find
products: [claude]
models: []
accountTier: FREE
excerpt: Claude Skills 去哪里找、怎么安装？按官方帮助中心和官方仓库讲清：claude.ai 的 Customize 目录怎么浏览添加，Claude Code 怎么从 anthropics/skills 安装，自己的技能怎么上传，以及第三方技能的安全提醒，附本站 Skill 库入口。
checkedOn: 2026-10-24
sources:
  - https://support.claude.com/en/articles/14328846-browse-skills-connectors-and-plugins-in-one-directory
  - https://support.claude.com/en/articles/12512180-using-skills-in-claude
  - https://github.com/anthropics/skills
verify:
  - 目录入口（Customize > Skills > + > Browse skills）、上传步骤、安全提醒取自 2026-10-24 官方帮助中心；界面名称随版本调整
  - anthropics/skills 仓库的安装命令取自仓库首页；官方说仓库里的示例技能仅用于演示和教育，行为可能与示例不同，使用前自行测试
  - 官方目录文章没有写 Pro、Max 是否有目录限制，也没有写 Anthropic 对目录的审核流程，本文不作推断
---

> 本文根据 Claude 帮助中心《Browse skills, connectors, and plugins in one directory》《Using skills in Claude》和官方仓库 anthropics/skills 整理，资料核对于 2026-10-24。图为本站整理的示意图。界面和命令可能调整，**以官方页面为准**。

## 适用于谁

- 搜「claude skills 市场」「claude skills 网站」，想知道去哪找技能的人；
- 不知道 Claude 里的技能目录在哪、怎么添加的人；
- 在 Claude Code 里想装官方技能的人。

技能是什么、写法和推荐，见 [/guides/claude-skills](/guides/claude-skills)；Claude Code 里技能存放在哪见 [/guides/claude-code-skills-directory-location-priority](/guides/claude-code-skills-directory-location-priority)。

## 结论先说

1. **最省事的入口是 Claude 里自带的官方目录**：官方说它把技能、连接器和插件放在同一个地方浏览和安装。路径是：左侧栏点 **Customize** → 选 **Skills**、**Connectors** 或 **Plugins** 标签 → 打开 **Discover**；技能还可以从 **Customize > Skills** 点 **+**，选 **Browse skills**。
2. **官方的开源仓库是 GitHub 上的 `anthropics/skills`**：里面有官方整理的示例技能和文档技能（docx、pdf、pptx、xlsx），Claude Code 可以把它当成插件市场添加。
3. **本站也整理了 Skill 库目录**：按适用平台（Claude Code、claude.ai、Codex 等）列出各个库的介绍、安装命令和注意事项，见 [/skills](/skills)。
4. **用技能要先开代码执行**：官方说技能需要代码执行环境，免费版、Pro、Max 在 **Settings > Capabilities** 打开 **Code execution and file creation**（新版叫 **Create and edit files**）。
5. **第三方技能要先审再装**：官方明确提醒有提示注入和数据外泄的风险，只装可信来源的技能。需要更高用量用技能和 Claude Code 的，可以看本站的 [/chongzhi/claude-pro](/chongzhi/claude-pro)。

![Claude Skills 去哪找](seed:g1060-where-to-find-skills.png)
*图：本站根据 [Claude 帮助中心](https://support.claude.com/en/articles/14328846-browse-skills-connectors-and-plugins-in-one-directory) 与 [anthropics/skills 仓库](https://github.com/anthropics/skills) 整理的示意图*

## 一、官方目录：在 Claude 里浏览和添加

![在 Claude 里浏览并添加 Skill](seed:g1060-browse-skills-steps.png)
*图：本站根据 [Claude 帮助中心：Browse skills, connectors, and plugins in one directory](https://support.claude.com/en/articles/14328846-browse-skills-connectors-and-plugins-in-one-directory) 整理的示意图*

官方步骤：

1. 打开 Claude 或 Claude 桌面版（桌面版见 [/guides/claude-desktop-app](/guides/claude-desktop-app)）；
2. 点左侧栏的 **Customize**；
3. 选 **Skills**、**Connectors** 或 **Plugins** 标签，再打开 **Discover**；
4. 想看技能：**Customize > Skills**，点 **+**，选 **Browse skills**；
5. 在想要的技能上点 **Add**，它会被加到你的技能列表，**默认开启**，Claude 在用得上时会自动调用；
6. 想暂停就关掉开关，技能还在目录里，可以再打开。

连接器点 **Connect** 开始授权，见 [/guides/claude-connectors](/guides/claude-connectors)。插件在 **Discover** 里点 **Add**，插件里的技能和命令会出现在网页对话、Cowork，以及用同一账号登录的 Claude Code 会话里；移除时打开插件点 **Remove**。

几点官方说明：

- **目录里的技能是只读的**：只能使用、不能编辑；想改，要下载一份副本，改完后作为你自己的技能上传；
- 同事直接分享给你的技能和插件，**不会出现在目录里**，而是在你的技能列表或 **Customize > Plugins** 的 **Shared with you** 里；
- Team 和 Enterprise 有 **Your organization** 标签，列出管理员配置或同事发布给全组织的技能；组织所有者可以在 **Organization settings > Plugins & skills** 的 **Policy** 标签里设置发布方式（**Open** 或 **Requires review**）。

## 二、自己的技能怎么上传

官方《Using skills in Claude》给出的步骤：

1. 按要求的结构做好技能文件夹，文件夹名要和技能名一致，里面必须有技能说明文件；
2. 打包成 ZIP；
3. 进入 **Customize > Skills**，点 **+**，再点 **+ Create skill**，选 **Upload a skill**，上传 ZIP；
4. 技能出现在列表里，可以开关。

自定义技能在你分享之前是私有的；Team 和 Enterprise 可以分享给指定的人或组，或发布到组织。如果没有上传选项，可能是组织所有者关闭了用户创建技能，或你的自定义角色缺少 **Create skills** 权限。ZIP 的大小上限，官方文章没有写。

## 三、Claude Code：从官方仓库安装

`anthropics/skills` 是 Anthropic 的公开仓库，里面有三个顶层文件夹：`skills`（示例技能，分创意设计、开发技术、企业沟通和文档技能几类）、`spec`（Agent Skills 规范）和 `template`（技能模板）。许可方面，仓库首页写明很多技能是 Apache 2.0 开源，而 docx、pdf、pptx、xlsx 这四个文档技能是「源码可见」而不是开源。

在 Claude Code 里（仓库首页的写法）：

```
/plugin marketplace add anthropics/skills
/plugin install document-skills@anthropic-agent-skills
/plugin install example-skills@anthropic-agent-skills
```

也可以交互式安装：选 **Browse and install plugins**，再选 **anthropic-agent-skills**，选 **document-skills** 或 **example-skills**，点 **Install now**。装好后，在对话里直接提到技能即可，例如「用 PDF 技能提取这个文件里的表单字段」。插件和市场的更多用法见 [/guides/claude-code-plugins-marketplace](/guides/claude-code-plugins-marketplace)。

仓库首页还写明：官方示例技能在付费的 claude.ai 套餐里已经可用；通过 API 也可以使用预置技能和自定义技能。

## 四、安全提醒

官方《Using skills in Claude》写得很直接：

- 主要风险是**提示注入**（诱导 Claude 做你不想做的事）和**数据外泄**（通过恶意的代码包或被注入的数据）；
- **只从可信来源安装技能**，别人分享给你的技能也要在启用前审阅；
- 要读技能附带的所有文件，尤其是代码依赖、图片和脚本；留意任何让 Claude 去连接不可信外部网络的指示；
- 技能可能包含或指示 Claude 安装第三方软件包；
- 官方仓库首页的免责声明：示例技能只用于演示和教育，Claude 的实际行为可能不同，用于重要任务前要在自己的环境里充分测试。

本站 [/skills](/skills) 里的介绍是站方根据各库的官方仓库和文档整理的，不替你审查代码；第三方技能能运行脚本、读取文件，安装前请自己看清来源和内容。

## 常见问题

**Q：技能市场要付费吗？**
官方说明技能适用于 Free、Pro、Max、Team 和 Enterprise 套餐，需要开启代码执行；目录本身没有单独收费的说明。

**Q：为什么在目录里看不到同事分享的技能？**
官方说直接分享的技能不在目录里，在你的技能列表或 Shared with you 里。

**Q：我装了技能，Claude 没用上？**
技能默认开启，由 Claude 判断何时调用。可以在对话里直接点名要用哪个技能，也可以去 **Customize > Skills** 检查开关。

**Q：技能和插件、MCP 有什么区别？**
官方的说法：技能是 Claude 可自动使用的指示；插件是可以包含技能和命令的包；连接器是可以连接的服务。MCP 见 [/guides/claude-code-mcp-setup](/guides/claude-code-mcp-setup)。

## 参考资料

- Claude 帮助中心：Browse skills, connectors, and plugins in one directory — https://support.claude.com/en/articles/14328846-browse-skills-connectors-and-plugins-in-one-directory
- Claude 帮助中心：Using skills in Claude — https://support.claude.com/en/articles/12512180-using-skills-in-claude
- GitHub：anthropics/skills — https://github.com/anthropics/skills
