---
title: GitHub Copilot 学生认证怎么申请：GitHub Education 条件、材料、激活 Copilot Student 与常见卡点
slug: github-copilot-student-verification
products: [github-copilot]
models: []
accountTier: FREE
excerpt: GitHub Copilot 学生认证官方流程：谁有资格、要准备什么证明材料、学校邮箱的三种情况、在 Education benefits 页提交申请、通过后怎么激活 Copilot Student、它和 Pro 的区别，以及通过了却仍显示 Free 或付费页时怎么办。
checkedOn: 2026-10-11
sources:
  - https://docs.github.com/en/copilot/how-tos/copilot-on-github/set-up-copilot/enable-copilot/set-up-for-students
  - https://docs.github.com/en/education/about-github-education/github-education-for-students/apply-to-github-education-as-a-student
  - https://docs.github.com/en/copilot/get-started/plans
  - https://docs.github.com/en/copilot/concepts/billing-and-usage/individuals/billing
verify:
  - Copilot Student 每月 AI credits 的具体数量官方文档未给数字，只写「an allowance」
  - 审核需要多久官方未承诺；文档只说通过后权益可能要「几天」才生效
  - 申请表单的具体字段与是否要求定位、拍照，以申请页当时显示的为准
---

> 本文根据 GitHub 官方文档《Access GitHub Copilot for free as a student》《Apply to GitHub Education as a student》整理，资料核对于 2026-10-11。本文只讲官方流程；学生权益只属于在读学生本人，请用真实材料申请。

## 适用于谁

- 在读学生，想通过官方渠道免费使用 GitHub Copilot 的人；
- 搜「github copilot 学生认证」「github copilot pro 学生」的人；
- 认证通过了，但 Copilot 页面仍显示 Free 或让你付费的人。

## 结论先说

1. 学生免费用 Copilot 走的是 **GitHub Education** 认证；通过后激活的是 **Copilot Student** 这个专门的档位。
2. **认证通过 ≠ Copilot 已开通**。官方明确说这是两步：通过之后还要去激活，而且权益可能要过几天才到账。
3. 资格四条：在读于能授予学位或文凭的项目、能提供当前在读证明、有 GitHub 个人账号、年满 13 岁。
4. 如果激活时只看到付费选项，**不要付款**，等几天再试。
5. GitHub **每个月重新评估**一次你的资格，毕业后权益会终止。

## 第一步：确认资格与材料

**资格**（官方原文的四条）：

- 就读于授予学位或文凭的项目——高中、学院、大学、在家教育（homeschool）都算；
- 能提供证明你**当前**学生身份的文件；
- 拥有一个 GitHub 个人账号；
- 至少 13 岁。

**可以用的证明材料**：

- 带有当前在读日期的学生证照片；
- 课程表；
- 成绩单；
- 学校出具的在读 / 隶属证明信。

官方强调的是「当前」在读：材料上要能看出现在仍在读的日期，拍照要清晰完整。

## 第二步：处理学校邮箱

官方说明它的验证流程是因校而异的：系统发现你学校最近的申请者都是用学校邮箱通过的，之后同校申请者也会被要求用学校邮箱。

| 情况 | 官方做法 |
| --- | --- |
| 申请时要求学校邮箱 | 先在 GitHub 账号里**添加并验证**学校邮箱，再申请 |
| 学校不发学校邮箱 | 提供能说明这一政策的官方文件（学校网页、带校方抬头的信函），然后重新申请 |
| 学校邮箱域名不被识别 | 联系 GitHub Education Support，提供学校全称、官网地址和你要用的邮箱域名 |

## 第三步：提交申请

1. 登录 GitHub，打开 Education benefits 设置页：github.com/settings/education/benefits；
2. 在「GitHub Education」下点 **Start an application**；
3. 填写表单，上传材料，点 **Submit application**。

通过后可以在 GitHub Education 门户（github.com/education）使用各项学生权益。

## 第四步：激活 Copilot Student

1. 回到 github.com/settings/education/benefits；
2. 在「Free GitHub developer resources for students and teachers」下点 **Learn more**；
3. 按提示激活 Copilot Student，并按自己的需要配置 Copilot 的使用策略。

然后在 VS Code 或 JetBrains 里用这个 GitHub 账号登录即可，步骤见[《GitHub Copilot VS Code 使用教程》](/guides/github-copilot-vscode-setup)。

## Copilot Student 包含什么

按官方套餐页和计费说明（核对当天）：

| 项目 | Copilot Free | Copilot Student | Copilot Pro |
| --- | --- | --- | --- |
| 价格 | 免费 | 免费（需通过认证） | 付费 |
| 代码补全 | 每月 2000 次 | 不限量 | 不限量 |
| AI credits | 有一定额度 | 有一定额度 | 每月 1,500（基础 1,000 + 弹性 500） |
| 模型 | 只能自动选模型 | 只能自动选模型 | 可选一批模型 |
| Agents | 有限 | 包含，但不含第三方智能体 | 包含 |

也就是说，Student 档的优势主要是**补全不限量**和可以用 Agent；想自己挑模型、要更多 credits，仍需要付费档。各档详情见[《GitHub Copilot 免费版与 Pro 区别》](/guides/github-copilot-free-pro-ai-credits)。

## 常见卡点

**Q：认证通过了，Copilot 还是显示 Free、试用或付费结账页？**
这是官方文档专门写的一条排查。原因是「通过审核」和「Copilot 激活」是分开的两步，学生权益在通过后可能要**几天**才完全生效。等待期间可以试试：

- 打开 Copilot 设置页（github.com/settings/copilot）按提示操作；
- 直接访问 github.com/github-copilot/free_signup。

**如果只出现付费选项，不要完成购买**，过几天再试；几天后仍然不行，联系 GitHub Support。

**Q：申请被拒怎么办？**
对照上面的材料要求重新提交：证件要清晰、带当前在读日期；被要求学校邮箱时先把邮箱加到账号里并验证。官方另有《Solving problems with your GitHub Education access》页面。

**Q：权益能用多久？**
官方的说法是每月重新评估资格。毕业或不再符合条件后会失去 Student 档，可以改用 Free 或自行订阅。

**Q：老师和开源维护者呢？**
官方另有通道：教师和符合条件的开源项目维护者可能获得免费的 Copilot Pro，流程在《Access Copilot Pro for free as a teacher or open source maintainer》里。

**Q：网上卖的「学生认证」「学生包账号」能买吗？**
不建议。GitHub Education 权益绑定在通过认证的本人账号上，官方每月复核；用他人身份或伪造材料申请违反 GitHub 的条款，账号随时可能被收回权益或处置。

## 参考资料

- Access GitHub Copilot for free as a student（GitHub 官方）：https://docs.github.com/en/copilot/how-tos/copilot-on-github/set-up-copilot/enable-copilot/set-up-for-students
- Apply to GitHub Education as a student（GitHub 官方）：https://docs.github.com/en/education/about-github-education/github-education-for-students/apply-to-github-education-as-a-student
- Plans for GitHub Copilot（GitHub 官方）：https://docs.github.com/en/copilot/get-started/plans
- Usage-based billing for individuals（GitHub 官方）：https://docs.github.com/en/copilot/concepts/billing-and-usage/individuals/billing
