---
title: 用 AI 读论文、做文献综述的流程：单篇精读、多篇对比、综述提纲与引文核对
slug: ai-read-papers-literature-review
products: [chatgpt, claude]
models: []
accountTier: FREE
excerpt: AI 读论文怎么用才靠谱？给出四阶段流程：检索与筛选、单篇三遍阅读法、多篇对比矩阵、综述提纲；按官方文档说明 ChatGPT / Claude / Gemini 读 PDF 的限制（页数、图表能不能看），附可复制提示词，并强调参考文献必须逐条核实。
checkedOn: 2026-10-11
sources:
  - https://help.openai.com/en/articles/8555545-file-uploads-faq
  - https://help.openai.com/en/articles/8313428-does-chatgpt-tell-the-truth
  - https://help.openai.com/en/articles/10500283-deep-research-in-chatgpt
  - https://support.claude.com/en/articles/8241126-upload-files-to-claude
  - https://support.claude.com/en/articles/11088861-use-research-on-claude
  - https://support.claude.com/en/articles/9517075-what-are-projects
verify:
  - 各产品的文件大小、页数、数量上限沿用本站单篇教程 2026-10-07 核对的数字，可能已调整
  - 学校、导师、期刊对 AI 使用的规定各不相同，使用前务必查清
  - 文中提示词为自拟
---

> 本文是一套阅读与综述的工作流程，产品限制部分依据 OpenAI 与 Anthropic 官方帮助中心，资料核对于 2026-10-11。AI 在这里的角色是「帮你读得更快、整理得更清楚」，论文的观点、判断和文字要由你自己完成。

## 适用于谁

- 研究生、科研人员，要在短时间内读完几十篇文献的人；
- 搜「ai 读论文」「ai 读论文提示词」「ai 文献综述」的人；
- 让 AI 写过综述，结果参考文献是编的的人。

## 结论先说

1. **AI 最可靠的用法是「读你给它的 PDF」**，而不是凭记忆介绍某个领域——后者最容易编造论文和结论。
2. **参考文献必须逐条核实**。OpenAI 官方明确说 ChatGPT 可能编造引文、研究和不存在的参考文献，而且说得很自信。
3. 单篇用「三遍法」：先定位值不值得读，再抽结构，最后带着问题精读。
4. 多篇用**对比矩阵**：让 AI 按统一的字段抽取每篇的信息，你来判断异同。
5. 综述的**论证线索你来定**，AI 帮你检查覆盖面和逻辑漏洞。
6. 先查清学校、导师和期刊对使用 AI 的规定。

## 读 PDF 前要知道的限制

| | ChatGPT | Claude | Gemini |
| --- | --- | --- | --- |
| 能读的格式 | PDF、DOCX、TXT、PPTX、XLSX/CSV 等，Free 也能上传（有次数限制） | PDF、DOCX、CSV、TXT、HTML、EPUB 等 | 一次最多 10 个文件 |
| 图表能看吗 | 除企业版的 PDF 视觉检索外，读 PDF 时只提取文字，**不看嵌入的图片** | **100 页以内**同时看文字和图表；101–1000 页只读文字；超过 1000 页无法上传 | 以官方说明为准 |
| 单文件上限 | 以官方 FAQ 为准 | 聊天上传每个文件最大 500MB，每个对话最多 20 个文件 | 非视频文件每个最大 100 MB |
| 扫描件 | 没有文字层的扫描 PDF 往往读不准 | 同样依赖可提取的内容 | — |

实用结论：**需要读图表、公式的论文，注意工具是否真的「看得见」图**；扫描版先做文字识别；先确认 PDF 里的文字能被选中复制。详细见[《ChatGPT 读 PDF、总结长文档》](/guides/chatgpt-summarize-pdf)、[《Claude 上传文件限制》](/guides/claude-file-upload-limits)。

## 阶段一：检索与筛选

AI 的联网搜索和深度研究功能可以帮你**找线索**，但文献检索的主力仍然是学术数据库。

```text
我在研究「[课题]」。请联网检索近五年的综述和高被引论文，
每条给出：标题、作者、年份、期刊或会议、DOI 或可访问的链接、一句话说明为什么相关。
找不到确切出处的不要列。
```

拿到列表后**逐条去数据库里核对**：标题、作者、年份、DOI 是否对得上。对不上的直接删掉。深度研究功能的用法见[《ChatGPT 深度研究怎么用》](/guides/chatgpt-deep-research)和[《Claude Research 怎么用》](/guides/claude-research-mode)（Claude 的 Research 只在付费套餐提供）。

## 阶段二：单篇「三遍法」

**第一遍：值不值得读（2 分钟）**

```text
只根据这篇论文回答，不要补充论文之外的内容：
1. 它要解决什么问题？
2. 核心方法用一句话概括；
3. 主要结论是什么，证据强度如何（样本量、实验设置）；
4. 作者自己承认的局限；
5. 它和「[我的课题]」的相关程度：高 / 中 / 低，理由。
```

**第二遍：抽结构（10 分钟）**

```text
按下面的字段整理这篇论文，每一项后面标注所在的章节或页码：
研究问题 | 理论或假设 | 数据来源与样本 | 方法 | 关键结果（含具体数字） | 局限 | 未来工作
原文没有写的字段填「未说明」，不要推测。
```

要求标页码，是为了让你能**抽查**。随机挑三四项翻回原文对一下。

**第三遍：带着问题精读**

```text
我不理解第 [X] 节的 [某个公式 / 某个实验设计]。
请分步解释它在做什么、为什么这样设计、如果换成 [另一种做法] 会有什么不同。
```

```text
假设你是审稿人，这篇论文最可能被质疑的三个地方是什么？依据原文的哪些部分？
```

想被「教会」而不是被「告知」，可以用 ChatGPT 的学习模式，它会先问你已经懂什么再分层讲解，见[《ChatGPT 学习模式怎么用》](/guides/chatgpt-study-mode)。

## 阶段三：多篇对比矩阵

把同一主题的若干篇论文传进同一个项目（ChatGPT 项目或 Claude Projects），让它按统一字段抽取：

```text
对项目里的每一篇论文，输出一行表格：
作者(年份) | 研究问题 | 数据 / 样本 | 方法 | 主要发现 | 局限
然后回答：
1. 哪些论文的结论相互支持？哪些相互矛盾？矛盾可能来自什么差异（样本、方法、定义）？
2. 这些论文共同没有回答的问题是什么？
每个判断后面注明依据的是哪几篇。
```

注意容量：Claude 项目的文件总内容要装得进上下文窗口（付费套餐接近上限时会切到检索模式）；篇数多时分批做，每批 5–8 篇，再合并表格。项目的用法见[《Claude Projects 怎么用》](/guides/claude-projects-guide)、[《ChatGPT 项目功能怎么用》](/guides/chatgpt-projects)。

## 阶段四：综述提纲

综述不是摘要的堆砌，而是**按一条论证线索组织文献**。线索你来定：

```text
基于上面的对比矩阵，我打算按「[时间演进 / 方法流派 / 争议焦点]」来组织综述。
请给出三级提纲，每个小节写明：要论证的观点、支撑它的论文（只能从矩阵里选）、
目前证据不足的地方。不要引入矩阵之外的文献。
```

然后让它挑毛病：

```text
检查这份提纲：有没有重要的流派或反方观点没覆盖？
哪些小节只有一两篇文献支撑？哪些论断超出了文献实际能支持的范围？
```

**正文自己写**。可以让 AI 帮忙检查语法、统一术语、压缩冗长的句子，见[《ChatGPT 写论文与润色》](/guides/chatgpt-academic-writing)。

## 引文核对清单

- [ ] 每一条参考文献都在数据库里查到了原文
- [ ] 作者、年份、期刊、卷期页码与原文一致
- [ ] 我引用的结论，原文里确实这么写（而不是 AI 的转述）
- [ ] 引用的数字翻回原文核对过
- [ ] 没有一条文献是「AI 说有、我没见过原文」的

## 学术规范

- **先查规定**。不同学校、导师、期刊对 AI 的使用要求不同，有的要求声明，有的禁止。
- **保留过程记录**。OpenAI 官方建议可以分享对话链接作为使用 AI 的过程记录；你也可以主动留存，在需要时说明 AI 参与了哪些环节。
- **不要依赖 AI 检测工具自证**。官方说其研究表明 AI 检测器不够可靠。
- **未发表的稿件、涉密数据**不要上传到外部工具；必要时关闭训练开关，见[《AI 使用隐私与数据安全清单》](/guides/ai-privacy-data-safety-checklist)。

## 常见问题

**Q：英文论文让它直接翻译成中文读可以吗？**
可以，但术语要统一。方法见[《AI 翻译 PDF 和长文档》](/guides/ai-translate-pdf-long-documents)。关键段落建议对照原文。

**Q：它总结得和摘要差不多，没有新信息？**
问题问得太宽。换成具体的问题：样本怎么选的、对照组是什么、效应量多大、和某篇论文的结论为什么不同。

**Q：有读论文的提示词模板吗？**
本站[提示词库](/prompts)的「文献阅读」「论文写作」分类里有精读、对比、审稿人视角等模板。

## 参考资料

- File uploads FAQ（OpenAI 官方帮助中心）：https://help.openai.com/en/articles/8555545-file-uploads-faq
- Does ChatGPT tell the truth?（OpenAI 官方帮助中心）：https://help.openai.com/en/articles/8313428-does-chatgpt-tell-the-truth
- Upload files to Claude（Claude 官方帮助中心）：https://support.claude.com/en/articles/8241126-upload-files-to-claude
- Use Research on Claude（Claude 官方帮助中心）：https://support.claude.com/en/articles/11088861-use-research-on-claude
