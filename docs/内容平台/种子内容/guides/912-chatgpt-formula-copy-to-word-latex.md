---
title: ChatGPT 公式怎么复制到 Word、公式乱码怎么办：用 Word 自带的 LaTeX 输入，什么写法会不识别
slug: chatgpt-formula-copy-to-word-latex
products: [chatgpt]
models: []
accountTier: FREE
excerpt: ChatGPT 给的公式粘进 Word 乱码？Word（Microsoft 365）支持 LaTeX 输入：Alt + = 插入公式区，格式选 LaTeX，粘贴后转成专业格式。按微软文档讲步骤、写法对照和不识别的关键词。
checkedOn: 2026-10-15
sources:
  - https://support.microsoft.com/en-us/office/linear-format-equations-using-unicodemath-and-latex-in-word-2e00618d-b1fd-49d8-8cb4-8d17f25754f8
  - https://help.openai.com/en/articles/20001246-working-with-writing-blocks-and-code-blocks-in-chatgpt
verify:
  - OpenAI 帮助中心没有讲「ChatGPT 公式怎么显示、怎么复制」的官方文章（2026-10-15 检索 help.openai.com 无结果），所以本文没有写任何 ChatGPT 界面上复制公式的具体点击方式；只写「让 ChatGPT 把公式放进代码块、以 LaTeX 源码输出」这个本站建议，代码块可以复制来自官方代码块文章
  - 微软文章说 LaTeX 输入是 Word for Microsoft 365 订阅用户的新功能，其他 Office 软件只支持 UnicodeMath 线性格式；旧版 Word 能否使用以实际为准
  - 微软文章把格式选项写在「Equations 选项卡」，配图的说明文字写作 Design 选项卡，不同版本位置可能不同，以实际界面为准
  - 微软列出的不支持关键词只有 \eqarray、\Middle、\ldiv、\dsmash 四个，并说明 \begin{} 和 \end{} 不支持；其他写法是否都能识别，微软只说「大多数常见的 LaTeX 表达式」支持
  - 示例中的 \frac、\matrix 等写法来自微软文章；ChatGPT 实际输出的写法和分隔符，本文没有核对
---

> 本文根据 Microsoft 支持文档《Linear format equations using UnicodeMath and LaTeX in Word》整理，资料核对于 2026-10-15。**OpenAI 帮助中心没有专门讲 ChatGPT 公式显示和复制的文章**，所以本文不写 ChatGPT 界面上的点击步骤，只写「拿到 LaTeX 之后，Word 里怎么放」，这一半有微软官方文档依据。配图为本站整理的示意图。

## 适用于谁

- 把 ChatGPT 回答里的公式复制进 Word，结果是一串带反斜杠的文字，或者格式不对的人；
- 写论文、做作业，想把 LaTeX 公式变成 Word 里可编辑公式的人；
- 矩阵、方程组之类复杂公式一粘贴就坏的人。

## 结论先说

1. **Word 里能直接输入 LaTeX**：微软说，Word 支持两种「线性格式」输入公式，一种是 UnicodeMath，一种是 LaTeX；LaTeX 输入是 Word for Microsoft 365 订阅用户的新功能。
2. **其他 Office 软件只支持 UnicodeMath**：微软明确写了，除 Word 外，其他 Office 应用只支持 UnicodeMath 线性格式。
3. **步骤是：Alt + = 插入公式区 → 把格式设为 LaTeX → 输入或粘贴 LaTeX → 转成专业格式**。转换用 Convert → Professional，或快捷键 Ctrl + =；想转回线性格式，按 Ctrl + Shift + =。
4. **大多数常见 LaTeX 关键词支持，但有例外**：`\eqarray`、`\Middle`、`\ldiv`、`\dsmash` 四个微软列为不支持；矩阵不能用 `\begin{matrix}` 和 `\end{matrix}`，要写成 `\matrix{...}`。
5. **让 ChatGPT 帮你改成 Word 能识别的写法**：这一条是本站建议，不是官方原话。

![公式放进 Word 的 5 步：让 ChatGPT 输出 LaTeX 源码、Alt + = 插入公式区、选 LaTeX 格式、粘贴、转成专业格式](seed:g912-word-latex-steps.png)
*图：本站根据 [Microsoft 支持文档：Linear format equations using UnicodeMath and LaTeX in Word](https://support.microsoft.com/en-us/office/linear-format-equations-using-unicodemath-and-latex-in-word-2e00618d-b1fd-49d8-8cb4-8d17f25754f8) 整理的示意图*

## 一、先说清楚：官方文档能证明什么，不能证明什么

- **能证明的**：Word 里怎么输入线性格式公式、LaTeX 支持哪些写法、哪些关键词不支持、怎么转成专业格式。这些来自微软官方文档。
- **没有官方文章的**：ChatGPT 的回答里公式是怎么渲染的、有没有「复制公式」的按钮、复制出来的是什么格式。OpenAI 帮助中心没有这方面的专门说明，所以本文不写。你在 ChatGPT 里看到什么按钮、复制出什么内容，以实际为准。

**可靠的做法**是绕开「复制渲染后的公式」这件事：让 ChatGPT 把公式以 **LaTeX 源码**写出来，放进代码块里。官方代码块文章说，代码块可以复制、编辑，见 [/guides/chatgpt-write-code-code-blocks-preview-run](/guides/chatgpt-write-code-code-blocks-preview-run)。拿到的是纯文本，就不依赖网页上的渲染了。

可以这样问（本站建议）：

> 请把上面这个公式写成 LaTeX 源码，放进代码块里，只要公式本身，不要加 $ 符号，也不要加说明文字。

## 二、在 Word 里放进 LaTeX：步骤

微软文档里的步骤如下：

1. **插入公式区**：在文档里按 **Alt + =**，插入一个公式（数学区）。
2. **选择线性格式**：微软说，可以在 **Equations** 选项卡里选格式，二选一：UnicodeMath 或 LaTeX。想用 LaTeX，就选 **LaTeX**。（微软文章的配图说明写的是 Design 选项卡；不同版本位置可能不同，以实际界面为准。）
3. **输入或粘贴 LaTeX**：在公式区里输入或粘贴，例如分式 `\frac{a}{b+c}`。
4. **转成专业格式**：选 **Convert → Professional**，或按 **Ctrl + =**，线性文字就会排成真正的数学公式。
5. **想回到线性文字再改**：按 **Ctrl + Shift + =**，或在 Convert 菜单里选线性格式的选项。

微软说，LaTeX 输入支持「大多数常见的 LaTeX 数学关键词」。

## 三、UnicodeMath 和 LaTeX 的写法对照

Word 里两种线性格式的写法不一样。微软文章给出的几组对照：

![同一个公式在 Word 里的 UnicodeMath 与 LaTeX 两种线性写法对照：分式、根号、矩阵、多重积分、向量](seed:g912-word-latex-methods.png)
*图：本站根据 [Microsoft 支持文档：Linear format equations using UnicodeMath and LaTeX in Word](https://support.microsoft.com/en-us/office/linear-format-equations-using-unicodemath-and-latex-in-word-2e00618d-b1fd-49d8-8cb4-8d17f25754f8) 整理的示意图*

| 公式 | UnicodeMath 写法 | LaTeX 写法 |
| --- | --- | --- |
| 分式 | `a/(b+c)` | `\frac{a}{b+c}` |
| 根号（5 次根） | `\sqrt(5&a^2)` | `\sqrt[5]{a^2}` |
| 矩阵 | `(\matrix(a&b@c&d))` | `\matrix{a & b \\ c & d}` |
| 多重积分 | `\iint_(a=0)^\infty a` | `\iint_{a=0}^{\infty} a` |
| 向量 | `(abc)\vec` | `\vec{abc}` |
| 括号包住分式 | `(a+b/c)` | `\left( a + \frac{b}{c} \right)` |
| 极限 | `lim_(n->\infty) n` | `\lim\below{n \rightarrow \infty} n` |

从表里能看出，**两种格式不能混着用**：把 LaTeX 的 `\frac{a}{b+c}` 粘进 UnicodeMath 格式的公式区，就不会按预期排版；反过来也一样。所以第一步一定是先确认公式的格式选项。

微软还说，如果你用 UnicodeMath，Word 的「数学自动更正」可以把以反斜杠开头的代码（如 `\circ` 加空格变成度数符号）自动转成符号，这个功能可以在「公式选项」里开关。

## 四、粘贴后公式不对，按这个顺序查

![粘贴进 Word 后公式不对的 5 种情况：反斜杠文字、没有转专业格式、begin 和 end 不支持、不支持的关键词、其他 Office 软件](seed:g912-word-latex-garbled.png)
*图：本站根据 [Microsoft 支持文档：Linear format equations using UnicodeMath and LaTeX in Word](https://support.microsoft.com/en-us/office/linear-format-equations-using-unicodemath-and-latex-in-word-2e00618d-b1fd-49d8-8cb4-8d17f25754f8) 整理的示意图*

1. **粘贴后是一串带反斜杠的普通文字**：多半是粘到了正文，不是公式区。先 Alt + = 插入公式区，格式选 LaTeX，再粘贴。
2. **还是一行线性文字，没有排成数学样式**：还没转换。**Convert → Professional**，或 **Ctrl + =**。
3. **矩阵里的 `\begin{matrix}`、`\end{matrix}` 没有转换**：微软明确说，Word 不支持 `\begin{}` 和 `\end{}`，矩阵要写成 `\matrix{a & b \\ c & d}`。
4. **用到了不支持的关键词**：微软列出 `\eqarray`、`\Middle`、`\ldiv`、`\dsmash` 四个不支持；遇到时让 ChatGPT 换一种写法（本站建议）。
5. **你用的不是 Word，而是 Excel、PowerPoint 等**：微软说，其他 Office 应用只支持 UnicodeMath 线性格式，LaTeX 格式不能用。
6. **你用的不是 Microsoft 365 订阅版的 Word**：微软说 LaTeX 输入是 Microsoft 365 订阅用户的新功能，旧版本可能没有这个选项。

### 让 ChatGPT 按 Word 的写法重写

如果矩阵、方程组一粘贴就坏，可以这样要求（本站建议，写法依据是微软文章）：

> 请把这个公式改写成 Word 能识别的 LaTeX 线性格式：不要使用 `\begin` 和 `\end`，矩阵写成 `\matrix{a & b \\ c & d}` 的形式，不要使用 `\eqarray`。

改完仍不行，把 Word 里显示的内容和你输入的 LaTeX 发回去，让它按报错调整。

## 五、其他方式

- **想直接让 ChatGPT 生成 Word 文档**：官方有生成 Word、Excel、PPT 文件的能力，见 [/guides/chatgpt-create-word-excel-ppt](/guides/chatgpt-create-word-excel-ppt)。文档里的公式会怎么显示，本文没有核对。
- **想把整段对话导出**：见 [/guides/chatgpt-export-single-chat-pdf-markdown](/guides/chatgpt-export-single-chat-pdf-markdown)。
- **需要流程图、图表而不是公式**：见 [/guides/chatgpt-flowchart-charts-how-to](/guides/chatgpt-flowchart-charts-how-to)。
- **写论文时让 ChatGPT 帮忙**：见 [/guides/chatgpt-academic-writing](/guides/chatgpt-academic-writing)；用 ChatGPT 解题、讲题，见 [/guides/chatgpt-study-mode](/guides/chatgpt-study-mode)。

## 常见问题

**Q：ChatGPT 官方有「复制公式」的功能吗？**
OpenAI 帮助中心里没有找到讲这件事的文章，所以不能断言有或没有。你可以让 ChatGPT 把公式写成 LaTeX 源码放进代码块，用代码块的复制功能拿走。

**Q：为什么粘贴后全是 $ 和反斜杠？**
说明复制到的是 LaTeX 文本。在 Word 里要放进公式区，并把格式设为 LaTeX，再转成专业格式。至于要不要去掉两端的 `$` 符号，微软文章没有说明，可以先去掉再试（本站建议）。

**Q：LaTeX 公式能直接粘进 WPS 吗？**
本文没有核对 WPS 的官方文档，不作判断。

**Q：Mac 上的 Word 一样吗？**
微软这篇文章没有区分平台，Mac 上的具体菜单以实际界面为准。

**Q：公式里的中文、单位怎么处理？**
微软文章没有专门说明，本文不写。

**Q：Word 需要订阅吗？**
微软说，LaTeX 输入是 Word for Microsoft 365 订阅用户的新功能。ChatGPT 自己的订阅与此无关；要开通 ChatGPT Plus，可看 [/chongzhi/chatgpt-plus](/chongzhi/chatgpt-plus)。

## 参考资料

- Microsoft 支持：Linear format equations using UnicodeMath and LaTeX in Word — https://support.microsoft.com/en-us/office/linear-format-equations-using-unicodemath-and-latex-in-word-2e00618d-b1fd-49d8-8cb4-8d17f25754f8
- OpenAI 帮助中心：Working with writing blocks and code blocks in ChatGPT — https://help.openai.com/en/articles/20001246-working-with-writing-blocks-and-code-blocks-in-chatgpt
