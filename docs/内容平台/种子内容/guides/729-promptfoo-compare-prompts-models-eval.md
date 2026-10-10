---
title: promptfoo 使用教程：对比提示词和模型、写断言自动评测（安装与配置）
slug: promptfoo-compare-prompts-models-eval
products: [ai-tools, chatgpt]
models: []
topics: [prompt-engineering]
accountTier: OTHER
excerpt: promptfoo 是什么、怎么使用？按官方 README 和入门文档讲清它的用途、三种安装方式、用示例项目起步、promptfooconfig.yaml 里提示词、模型和测试用例三部分怎么写、常用断言类型的含义、eval 与 view 两条命令，以及把它放进日常改提示词流程的方法。
checkedOn: 2026-10-11
sources:
  - https://github.com/promptfoo/promptfoo
  - https://www.promptfoo.dev/docs/getting-started/
verify:
  - 官方 README 写明「Promptfoo is now part of OpenAI」，并说明仍然开源（MIT 许可）
  - 本文的 promptfooconfig.yaml 示例是按官方入门文档描述的结构编写的演示，不是官方文件的逐字转录；模型 ID 请换成你账号可用的
  - 评测会真实调用模型接口并产生费用，cost 断言只检查单次响应的成本，不限制总花费
---

> 本文根据 promptfoo 官方仓库 README 和官方文档《Getting started》整理，资料核对于 2026-10-11。命令取自官方页面，没有在本机运行验证。

## 适用于谁

- 搜「promptfoo 使用」「promptfoo 是什么」「promptfoo 使用教程」「promptfoo 怎么使用」的人；
- 改提示词全凭感觉，改完不知道是变好了还是只是换了一种错法的人；
- 要在两三个模型之间选型，想用自己的真实问题而不是排行榜来比较的人。

## 结论先说

1. **promptfoo 是一个评测大模型应用的命令行工具和库**，也用来做红队测试。README 写明它现在是 OpenAI 的一部分，并且仍然开源，MIT 许可。
2. **它做的事很直接**：把「几个提示词 × 几个模型 × 一批测试用例」全部跑一遍，用你写的断言自动判分，再在网页里并排展示结果。
3. **一切写在一个 `promptfooconfig.yaml` 里**：`prompts`、`providers`、`tests` 三部分。
4. **两条命令**：`promptfoo eval` 运行评测，`promptfoo view` 打开结果页面。
5. **评测在本地运行**。README 的说法是提示词留在你的机器上；当然，调用模型时内容还是会发给你所配置的模型服务商。

## 一、它解决什么问题

改提示词时最常见的情况：针对一个不满意的回答改了几句，那个问题好了，另外三个原本没问题的却坏了，而你没有发现。

评测工具的做法是把「原本没问题的」也固定下来：准备一批有代表性的输入，为每个输入写明「合格的输出应该满足什么」，每次改动后全部重跑。这和写代码时跑单元测试是一个道理。

README 列出的用途：

- 用自动化评测来测试提示词和模型；
- 并排比较不同厂商的模型（OpenAI、Anthropic、Azure、Bedrock、Ollama 等）；
- 红队测试和漏洞扫描，生成漏洞报告；
- 接入 CI/CD，自动检查；
- 审查拉取请求里与大模型相关的安全和合规问题。

## 二、安装

三种方式任选：

```sh
npm install -g promptfoo
```

```sh
brew install promptfoo
```

```sh
pip install promptfoo
```

不想安装的话，用 `npx promptfoo@latest` 加上后面的子命令即可运行。

## 三、用示例项目起步

```sh
promptfoo init --example getting-started
cd getting-started
```

这会创建一个带翻译示例的目录，里面有 `promptfooconfig.yaml` 和一个 `README.md`。

另外两种起步方式：`npx promptfoo@latest init` 通过命令行问答生成配置；`npx promptfoo@latest eval setup` 打开浏览器，在网页里填提示词、模型和测试用例。

然后设置模型厂商的 API Key，以 OpenAI 为例：

```sh
export OPENAI_API_KEY=sk-abc123
```

（`sk-abc123` 是官方文档里的占位符，换成你自己的 Key。）Key 的获取见[《OpenAI API Key 怎么获取》](/guides/openai-api-key)。

## 四、配置文件的三部分

按官方入门文档描述的结构，一份配置大致是这样（演示用，模型 ID 换成你要比较的）：

```yaml
prompts:
  - 'Convert the following English text to {{language}}: {{input}}'

providers:
  - openai:gpt-6-sol
  - openai:gpt-6-luna

tests:
  - vars:
      language: French
      input: Hello world
    assert:
      - type: icontains
        value: bonjour
  - vars:
      language: Spanish
      input: Where is the library?
    assert:
      - type: icontains
        value: biblioteca
```

- **`prompts`**：要比较的提示词，可以写多条。双花括号里的是变量；
- **`providers`**：要比较的模型，格式是 `厂商:模型`；
- **`tests`**：测试用例。每条用 `vars` 给变量赋值，用 `assert` 写合格标准。

运行时，每个提示词、每个模型、每条用例的组合都会被执行一次。

## 五、运行和查看

```sh
promptfoo eval
promptfoo view
```

- `eval`：跑完所有组合，在终端里显示汇总；
- `view`：打开网页查看器，以表格并排展示各个模型、各个提示词的输出和断言结果。

临时换一组模型来比，不用改配置文件，用 `-r`：

```sh
npx promptfoo@latest eval -r google:gemini-3.8-flash google:gemini-3.5-flash-lite
```

结果可以导出为表格、JSON、YAML 或 HTML。

## 六、常用的断言类型

| 类型 | 含义 |
| --- | --- |
| `contains` | 输出包含指定的文字 |
| `icontains` | 同上，不区分大小写 |
| `icontains-any` | 输出包含列出的几个值中的任意一个 |
| `javascript` | 用一段自定义的 JavaScript 表达式给输出打分 |
| `llm-rubric` | 让一个模型按你写的评分标准给输出打分 |
| `cost` | 检查单次响应的成本是否低于阈值 |
| `latency` | 检查单次响应的耗时（毫秒）是否低于阈值 |

官方文档对最后两个有明确的提醒：`cost` 只是逐条检查，**不会限制总花费**；`latency` 只是事后检查，**不会中止慢的请求**。

怎么选：

- **能用确定性断言就用确定性的**。「必须包含订单号」「必须是合法的 JSON」「不得出现某个词」，用 `contains` 或 `javascript`，结果稳定、不花钱；
- **确实需要判断语义时再用 `llm-rubric`**。例如「语气是否礼貌」「是否回答了用户的问题」。评分标准写具体，并抽查它的评分是否靠谱，因为评分的模型也会出错。

官方文档还提到可以用 `defaultTest` 给所有用例加上共同的断言。

## 七、放进日常流程

1. **从真实问题里攒用例**。用户实际问过的、之前出过错的，各收几条。十几条就能开始，比凭空想的五十条有用；
2. **每条用例写清合格标准**。写不出标准的用例，说明你自己也没想清楚要什么；
3. **改提示词之前先跑一遍**，记下当前结果作为基线；
4. **每次只改一处**，改完重跑，对比；
5. **发现新的失败案例就加进用例**，用例集会越来越能代表真实情况；
6. **换模型、模型升级时重跑**。同一份提示词在不同模型上的表现可能差很多。

README 提到它有实时重载和缓存，官方文档里也有接入 CI 的说明（包括一个 GitHub Action），可以让每个拉取请求自动跑评测。

提示词本身怎么写，见[《系统提示词怎么写》](/guides/system-prompt-how-to-write)和[《Few-shot 提示怎么写》](/guides/few-shot-prompting-examples)。

## 常见问题

**Q：跑一次要花多少钱？**
取决于「提示词数 × 模型数 × 用例数」和每次调用的长度，每个组合都是一次真实的接口调用。先用少量用例和便宜的模型把配置调通，再放开跑。

**Q：能测本地模型吗？**
README 列出的可比较对象里包括 Ollama。本地模型的搭建见[《Ollama 怎么用》](/guides/ollama-how-to-use-install-commands)。

**Q：我的应用不是一条提示词，而是一整条流程，能测吗？**
README 的说法是它适用于任何大模型接口和任何编程语言，可以把你自己的程序作为被测对象。具体接法见官方文档里关于自定义 provider 的部分。

**Q：评测结果每次不一样？**
模型输出本身有随机性。关键用例可以多跑几次看通过率，而不是只看一次的结果。

## 参考资料

- promptfoo/promptfoo（官方仓库）：https://github.com/promptfoo/promptfoo
- Getting started（官方文档）：https://www.promptfoo.dev/docs/getting-started/
