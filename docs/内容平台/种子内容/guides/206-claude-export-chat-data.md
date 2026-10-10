---
title: Claude 导出聊天记录：导出数据步骤与导出文件怎么看
slug: claude-export-chat-data
products: [claude]
models: []
accountTier: FREE
excerpt: Claude 聊天记录怎么导出？在 Settings → Privacy 点 Export data，邮件里下载。本文讲导出步骤、下载链接有效期、导出文件怎么看，并附一个把 JSON 转成 Markdown 的示例脚本。
checkedOn: 2026-10-07
sources:
  - https://support.claude.com/en/articles/9450526-export-your-claude-data
  - https://support.claude.com/en/articles/13346720-export-your-organization-s-data
  - https://support.claude.com/en/articles/11817273-use-claude-s-chat-search-and-memory-to-build-on-previous-context
  - https://support.claude.com/en/articles/12123587-import-and-export-your-memory-from-claude
  - https://support.claude.com/en/articles/10593882-share-and-unshare-chats
  - https://privacy.claude.com/en/articles/9450526-export-your-claude-data
verify:
  - 官方帮助中心没有说明导出文件的格式和字段结构；文中「压缩包、JSON 文件」的描述和示例脚本里的字段名不是官方说明，请站长导出一次核对后再上线
  - 截图为帮助中心 2026 年 1 月的配图，设置页布局可能已调整
  - 「Export data」按钮的中文译名以实际界面为准
---

> 本文根据 Claude 帮助中心和 Anthropic 隐私中心的官方文章整理，核对日期 2026-10-07；截图引用自 Claude 帮助中心并注明出处。**官方没有公开导出文件的格式说明**，文中关于文件内容的部分和示例脚本仅供参考，字段名可能变化。

## 适用于谁

- 搜「claude 导出聊天记录」「claude 导出对话」，想把和 Claude 的对话备份到本地的人；
- 准备删除账号或换账号，想先留一份数据的人；
- 已经拿到导出文件，但不知道怎么看（「claude 导出的数据怎么看」）的人。

## 结论先说

1. **个人用户（Free / Pro / Max）可以自助导出**：网页版或桌面版 → Settings → Privacy →「Export data」。手机 App 不能发起导出。
2. **下载链接通过邮件发送**到账号邮箱，**24 小时后失效**，下载时必须登录该账号；过期了重新导出即可。
3. 导出内容包括**对话数据和账号的用户数据**，记忆数据也包含在内。
4. **导出的数据不能导入另一个个人 Claude 账号**，官方也不支持个人账号之间迁移数据。
5. Team / Enterprise 成员不能自己导出，只有组织的 Primary Owner 能导出整个组织的数据。

## 步骤

### 1. 发起导出（网页版 / 桌面版）

1. 点左下角你的姓名首字母（头像）；
2. 在菜单里选「Settings」；
3. 进入「Privacy」；
4. 在「Privacy settings」下点「Export data」。

![Claude 设置里的 Privacy 页面，Privacy settings 下方有 Export data 按钮，以及 Shared chats 的 Manage 入口](seed:g206-privacy-export.png)
*图片来源：[Claude 帮助中心《Share and unshare chats》](https://support.claude.com/en/articles/10593882-share-and-unshare-chats)*

### 2. 去邮箱下载

- 导出需要一点时间生成，处理完成后会给账号绑定的邮箱发一封带下载链接的邮件；
- 点链接时**必须已登录这个 Claude 账号**；
- 链接 **24 小时后过期**，过期就回到第 1 步再导出一次。

收不到邮件时，先查垃圾邮件文件夹，并确认你看的是注册 Claude 用的那个邮箱。

### 3. Team / Enterprise 组织导出

只有组织的 Primary Owner 能操作：左下角头像 →「Organization settings」→「Data and privacy」→「Export Data」，同样通过邮件发链接、24 小时有效。官方特别说明：在导出之前已被用户手动删除、或被企业数据保留策略删掉的消息、文件和项目，**不会出现在导出里**。

## 导出文件怎么看

官方只说明导出内容包括对话数据和账号用户数据（含记忆），**没有公开文件格式和字段结构**。下载下来一般是一个压缩包，解压后可以先看看里面有哪些文件（以你实际拿到的为准）：

- 用记事本、VS Code 等文本编辑器直接打开，`.json` 文件可以用编辑器的「格式化」功能整理缩进后再看；
- 文件很大时，编辑器可能卡顿，可以用下面的脚本转换成按对话分开的 Markdown 文件，再用任意 Markdown 阅读器打开；
- 导出文件里有你全部的对话内容，**不要上传到不信任的网站做「在线转换」**。

### 示例：把导出的 JSON 转成 Markdown（Python）

下面是本站写的**示例脚本**，不是官方工具。由于官方没有公开字段说明，脚本没有写死字段名，而是对常见的「对话列表 → 每个对话里有消息列表 → 每条消息有发送方和文字」这种结构做了容错。如果输出为空，请打开你的 JSON 看一下实际字段名，改脚本开头的候选列表即可。

```python
# 示例脚本：把 Claude 导出的对话 JSON 转成 Markdown（字段名可能随官方调整而变化）
# 用法：python claude_export_to_md.py conversations.json 输出目录
import json, os, re, sys

TITLE_KEYS = ["name", "title"]                       # 对话标题的候选字段
MSG_LIST_KEYS = ["chat_messages", "messages"]        # 消息列表的候选字段
ROLE_KEYS = ["sender", "role", "author"]             # 发送方的候选字段
TEXT_KEYS = ["text", "content"]                      # 消息文字的候选字段
TIME_KEYS = ["created_at", "create_time", "updated_at"]

def pick(d, keys, default=None):
    for k in keys:
        if isinstance(d, dict) and d.get(k) not in (None, ""):
            return d[k]
    return default

def to_text(value):
    """content 可能是字符串，也可能是分段列表，统一拼成文字。"""
    if isinstance(value, str):
        return value
    if isinstance(value, list):
        parts = []
        for part in value:
            if isinstance(part, str):
                parts.append(part)
            elif isinstance(part, dict):
                parts.append(str(pick(part, ["text", "content"], "")))
        return "\n".join(p for p in parts if p)
    return "" if value is None else str(value)

def main(src, out_dir):
    with open(src, encoding="utf-8") as f:
        data = json.load(f)
    conversations = data if isinstance(data, list) else pick(data, ["conversations"], [])
    os.makedirs(out_dir, exist_ok=True)
    count = 0
    for i, conv in enumerate(conversations, 1):
        title = str(pick(conv, TITLE_KEYS, f"未命名对话-{i}"))
        messages = pick(conv, MSG_LIST_KEYS, [])
        lines = [f"# {title}", ""]
        when = pick(conv, TIME_KEYS)
        if when:
            lines += [f"> 时间：{when}", ""]
        for msg in messages:
            role = str(pick(msg, ROLE_KEYS, "unknown"))
            text = to_text(pick(msg, TEXT_KEYS, ""))
            if text.strip():
                lines += [f"**{role}**：", "", text, "", "---", ""]
        safe = re.sub(r'[\\/:*?"<>|]', "_", title)[:60] or f"conversation-{i}"
        with open(os.path.join(out_dir, f"{i:04d}-{safe}.md"), "w", encoding="utf-8") as f:
            f.write("\n".join(lines))
        count += 1
    print(f"已转换 {count} 个对话到 {out_dir}")

if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else "claude_md")
```

运行方法：把脚本存为 `claude_export_to_md.py`，和解压出来的对话 JSON 文件放在同一目录，执行：

```bash
python claude_export_to_md.py conversations.json claude_md
```

文件名请换成你解压后实际看到的对话文件名。

## 只想保存一两个对话？

不一定要导出整个账号：

- **分享链接**：在对话右上角点「Share」→ 再点「Share」生成链接，任何拿到链接的人都能看到分享那一刻的对话快照。注意上传的附件不会包含在分享里。不需要时回到「Share」菜单把可见性改回「Private」，或在 Settings → Privacy →「Shared chats」旁的「Manage」里批量取消分享；
- **只导出记忆**：在对话里让 Claude 逐字写出它关于你的记忆，复制保存，详见本站《Claude 记忆功能怎么用：开启、查看、导入与导出记忆》。

## 常见问题

**Q：手机 App 里找不到导出按钮？**
官方说明 iOS 和 Android 的 Claude App 不能发起导出，请在网页版或桌面版操作。

**Q：下载链接打不开 / 提示过期？**
链接只有 24 小时有效，并且要在已登录该账号的浏览器里打开。过期后重新点一次「Export data」即可。

**Q：能把导出的记录导入新账号吗？**
不能。官方明确说导出数据不能导入另一个个人 Claude 账号，也不支持个人账号之间迁移。如果是加入 Team / Enterprise 组织，官方提供把个人账号直接并入组织工作区的方式，不需要导出。

**Q：删除账号前要不要先导出？**
建议导出。删除账号是永久的，对话、项目都无法恢复。删除步骤见本站《Claude 隐私设置：模型训练开关、删除对话与删除账号》。

**Q：无痕对话会出现在导出里吗？**
个人账号的无痕对话不保存到历史记录。Team / Enterprise 的无痕对话会包含在组织数据导出里。

## 参考资料

- Export your Claude data（帮助中心）：https://support.claude.com/en/articles/9450526-export-your-claude-data
- Export your organization's data（帮助中心）：https://support.claude.com/en/articles/13346720-export-your-organization-s-data
- Use Claude's chat search and memory（帮助中心）：https://support.claude.com/en/articles/11817273-use-claude-s-chat-search-and-memory-to-build-on-previous-context
- Import and export your memory from Claude（帮助中心）：https://support.claude.com/en/articles/12123587-import-and-export-your-memory-from-claude
- Share and unshare chats（帮助中心）：https://support.claude.com/en/articles/10593882-share-and-unshare-chats
- Export your Claude data（Anthropic 隐私中心，官方）：https://privacy.claude.com/en/articles/9450526-export-your-claude-data
