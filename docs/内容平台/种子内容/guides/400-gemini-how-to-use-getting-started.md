---
title: Gemini 怎么用：网页版入门教程（登录、提问、选模型、传文件、生成文档）
slug: gemini-how-to-use-getting-started
products: [gemini]
models: [gemini-llm]
accountTier: FREE
excerpt: 第一次用 Google Gemini 的入门教程：需要什么账号和浏览器、不登录能用什么、怎么提问和改提问、怎么切换模型、上传文件、让它直接生成 Word / Excel / PDF 文件，以及新手最常遇到的几个问题。
checkedOn: 2026-10-10
sources:
  - https://support.google.com/gemini/answer/13275745
  - https://support.google.com/gemini/answer/13278668
  - https://support.google.com/gemini/answer/18648722
  - https://support.google.com/gemini/answer/13575153
  - https://support.google.com/gemini/answer/14262426
  - https://support.google.com/gemini/answer/16279220
verify:
  - 不登录时具体能用哪些功能：帮助中心只说「一般可以进行文字类对话，功能可能变化」，且取决于地区和设备
  - 「查看其他草稿（View other drafts）」是否对所有回答都出现：帮助中心说只对部分提示、且只对最新一条回答提供
  - 免费账号能否手动切换模型：「About Gemini models」写手动切换需要 Google AI 方案，「Use Gemini Apps」写登录即可切换，两处表述不同
---

> 本文根据 Google 官方 Gemini 帮助中心整理，核对日期 2026-10-10。Gemini 的界面和功能更新很快，入口名称以你实际看到的界面为准。

## 适用于谁

- 搜「gemini 怎么用」「gemini 官网」，第一次打开 Gemini、不知道从哪下手的人；
- 用过 ChatGPT，想快速弄清 Gemini 的基本操作有什么不同的人；
- 想知道 Gemini 要不要登录、要什么账号的人。

## 结论先说

1. **官网是 gemini.google.com**，用 Chrome、Safari、Firefox、Opera 或 Edge 打开即可；手机有 Gemini App，电脑也有 Mac / Windows 客户端。
2. **不登录也能问一些文字问题**，但历史记录、上传文件、生成图片、连接 Gmail 等应用、个性化这些都需要登录 Google 账号。
3. **基本操作四步**：在底部输入框写问题 → 需要的话点「添加文件」带上图片或文档 → 发送 → 对回答不满意就编辑提问或重新生成。
4. **模型**：Gemini 现在有 Flash-Lite、Flash、Pro 三档，默认由「自动选择模型」替你挑；输入框里的模型名可以点开手动切换。
5. **可以直接要文件**：对它说「整理成一份文档 / 表格」，能生成 Google 文档、Google 表格、PDF、.docx、.xlsx、.csv、Markdown 等格式，下载或存到云端硬盘。

## 一、开始之前：账号和浏览器

按帮助中心的说明，登录 Gemini 需要以下三种账号之一：

| 账号类型 | 条件 |
| --- | --- |
| 个人 Google 账号 | 自己管理的账号；年龄须满 13 岁（或所在国家规定的年龄） |
| 工作账号（Google Workspace） | 所在组织的版本包含 Gemini，且本人年满 18 岁 |
| 学校账号 | 学校管理员已开启该服务 |

- 浏览器：Chrome、Safari、Firefox、Opera、Edge 都支持；
- 语言和地区：Gemini 网页版支持 70 多种语言（包括简体、繁体和香港中文），覆盖 230 多个国家和地区，完整名单见官方「可用地区」页面；手机 App 的可用范围另有一份名单。请遵守所在地法律和服务条款。

**登录**：打开 gemini.google.com，点右上角「登录（Sign in）」，用 Google 账号登录。**退出**：左侧菜单 → 头像 →「退出」。

## 二、不登录能做什么

帮助中心的说法是：在部分设备和地区，不登录也可以使用一部分功能，一般是**文字类的问答和简单的文字生成**，具体范围可能变化。以下这些必须登录：

- 查看以前的对话（不登录没有历史记录）；
- 个性化回答（根据过往对话和你的偏好调整）；
- 关联应用（Google Workspace、Google 相册等）；
- 生成图片、Gems / 技能、上传文件等需要验证账号的功能；
- 安卓手机上的 Gemini App 本身也必须登录。

所以如果只是临时问一句，不登录也行；想认真用，建议登录。

## 三、发出第一条提问

1. 打开 gemini.google.com；
2. 在页面底部的输入框里写问题或需求；
3. （可选）点「添加文件（Add files）」，按提示加上图片或文件；
4. 点「提交（Submit）」。

想开一个全新的话题，点左上角的「发起新对话（New chat）」；看不到的话先点「菜单（Menu）」展开侧边栏。旁边还有一个「临时对话（Temporary chat）」按钮，适合不想留记录的提问，详见本站《Gemini 临时对话怎么用》。

官方给的几类示例，可以照着试：

- 写作：「帮我列一份周末钓鱼露营的行李清单」；
- 学习：「我想学 Python，该怎么开始？给我做一份学习计划」；
- 排错：把报错信息原样贴进去，让它解释原因；
- 图表：「把我的月度开支画成饼图：房租 1200、买菜 300、油费 60、电费 80、网费 50」。

## 四、改提问、看其他版本、处理回答

以下功能需要登录：

- **编辑提问**：在自己那条提问右边点「修改文字（Edit text）」，改完点「更新（Update）」，Gemini 会重新回答；
- **查看其他草稿**：对部分提问，回答上方会出现「查看其他草稿（View other drafts / Show drafts）」，可以挑一个更合适的版本；只对最新一条回答有效，调用了关联应用的回答没有这个选项；
- **重新生成**：回答下方点「重新生成（Regenerate）」换一个版本，再用箭头在几个版本之间切换；只能重新生成对话里最新的那条回答。想改长度、语气或让它说得更简单，直接接着对话提要求即可；
- **复制代码**：代码块下方有「复制」按钮；
- **追问出图表**：回答里有表格数据时，接着说「把每个类别的金额画成柱状图」。

Gemini 会出错，帮助中心明确提醒：重要信息要自己核对，不要把回答当作专业意见。

## 五、选模型

输入框底部显示当前的模型名，点开可以切换（需要登录）。按帮助中心「About Gemini models」页面，目前的三档是：

| 模型 | 官方定位 |
| --- | --- |
| Gemini Flash-Lite | 主打速度的高效模型，适合摘要、头脑风暴等日常任务 |
| Gemini Flash | 兼顾速度和推理，从简单到复杂的问题都能处理 |
| Gemini Pro | 最强的模型，擅长复杂数学和编程，对文本、文件、图片、视频的理解更深；回答通常更慢 |

默认开启「自动选择模型（auto model selection）」：Gemini 会按问题难度自动挑模型和思考档位，帮你省额度。想知道某条回答用了哪个模型，在回答底部点「更多」→「显示思考步骤（Show thinking steps）」，拉到最下面能看到。模型、思考档位和额度的细节见本站《Gemini 模型有哪些、有什么区别》和《Gemini 怎么看额度》。

## 六、让 Gemini 直接生成文件

可以在提问里直接要文件，比如「调研一下某个品种的狗，整理成一份文档」「给我做一张记录学生每周数学成绩的表格」；有时 Gemini 也会主动问你要不要输出成文件。官方列出的支持格式：

- Google 文档、Google 表格；
- .pdf、.docx、.xlsx、.csv；
- LaTeX、纯文本（TXT）、富文本（RTF）、Markdown。

大多数格式可以直接下载，或导出到 Google 云端硬盘。

## 七、位置信息

Gemini 可能用你的位置让回答更贴近本地（比如天气、附近的店）。默认用大致位置；如果你允许，也会用设备的精确位置。网页版在「菜单 → 设置与帮助」底部能看到当前位置旁的小圆点：蓝色表示正在使用精确位置，灰色表示没有；点「更新位置」可以授权精确位置。

## 常见问题

**Q：Gemini 是免费的吗？**
基础功能可以免费用，付费的 Google AI Plus / Pro / Ultra 方案提供更高的额度和更多功能。各档区别见本站《Gemini 会员有什么区别》。

**Q：登录时提示「Can't access this service」或「Something went wrong」？**
帮助中心解释：前者通常是账号类型或年龄不符合条件（例如由 Family Link 管理的账号、管理员没开通的工作账号）；后者表示账号暂时无法访问，原因可能与所在地、年龄或账号类型有关，可以稍后再试。详见本站《Gemini 出了点问题怎么办》。

**Q：Gemini 支持中文吗？**
支持。帮助中心的语言列表里有简体中文、繁体中文和香港中文。界面语言怎么改见本站《Gemini 怎么设置中文》。

**Q：手机上怎么用？**
安卓和 iPhone 都有 Gemini App，安卓上还可以把它设成手机的默认助理。详见本站《Gemini 手机版和电脑版怎么下载》。

## 参考资料

- Use Gemini Apps（Gemini 帮助中心）：https://support.google.com/gemini/answer/13275745
- What you need to sign in to Gemini Apps：https://support.google.com/gemini/answer/13278668
- About Gemini models：https://support.google.com/gemini/answer/18648722
- Where you can use the Gemini web app（支持的语言和地区）：https://support.google.com/gemini/answer/13575153
- Regenerate or modify responses from Gemini Apps：https://support.google.com/gemini/answer/14262426
- Learn about responses from Gemini Apps：https://support.google.com/gemini/answer/16279220
