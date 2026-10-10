---
title: Hugging Face Spaces 是什么、怎么用：免费试用 AI 应用、ZeroGPU 额度与复制一个自己的 Space
slug: hugging-face-spaces-how-to-use
products: [ai-tools]
models: []
accountTier: FREE
excerpt: Hugging Face Spaces 是什么、免费吗？本文按官方文档讲清怎么试用别人的 Space、ZeroGPU 每日免费额度、怎么复制一个 Space、创建 Space 需要什么账号，以及硬件、休眠和密钥管理规则。
checkedOn: 2026-10-11
sources:
  - https://huggingface.co/docs/hub/spaces-overview
  - https://huggingface.co/docs/hub/spaces-zerogpu
  - https://huggingface.co/docs/hub/spaces-gpus
  - https://huggingface.co/docs/hub/spaces-sdks-gradio
---

## 适用于谁

- 搜「hugging face spaces 是什么」「hugging face spaces 教学」「hugging face spaces free」的人；
- 看到别人分享的 `xxx.hf.space` 或 huggingface.co/spaces 链接，想知道这是什么、怎么用、要不要钱的人；
- 想把自己的小模型或小工具做成一个能在线试用的页面的人。

本文根据 Hugging Face 官方文档整理，资料核对于 2026-10-11。价格和额度来自官方文档当天的内容，会随时调整，以官网为准。另外说明：huggingface.co 在中国大陆的网络环境下通常无法直接访问，本文不涉及访问方法。

## 结论先说

1. **Spaces 是 Hugging Face 上托管 AI 应用演示的地方**。别人把模型包装成一个网页，你打开就能试，不用自己装环境。
2. **试用别人的 Space 不需要自己付费**，但用到共享显卡（ZeroGPU）的 Space 有每日额度：官方文档写的是未登录 2 分钟、免费账号 5 分钟、PRO 账号 40 分钟。
3. **自己创建 Space 的规则变了**：官方文档现在写明，静态（Static）Space 对所有人免费；Gradio 和 Docker 这类需要运行计算的 Space，创建需要付费方案（个人 PRO，组织 Team 或 Enterprise）；信誉良好的免费个人账号仍可以托管最多 2 个跑在 ZeroGPU 上的 Gradio Space。
4. **每个 Space 本质上是一个 Git 仓库**，代码可以看、可以复制（Duplicate）到自己名下再改。

## 步骤

### 1. 找到并试用一个 Space

1. 打开 huggingface.co/spaces，用搜索框找你想要的功能（例如图片放大、语音转文字、某个模型的名字）；
2. 点进去，页面中间就是应用界面，按它的提示上传文件或输入文字，点运行；
3. 第一次打开可能要等它启动。官方说明：免费硬件上的 Space 长时间没人用会进入休眠，被访问时再启动。

页面上方的 **Files** 标签可以看到这个应用的全部源码，**Community** 是讨论区，遇到问题先看看别人有没有提过。

### 2. 看懂 ZeroGPU 的额度

很多热门 Space 标着 ZeroGPU。官方的解释是：这是一套共享的显卡基础设施，只在函数被调用时临时分配显卡，用完立即释放，所以能免费提供给大家用。

每日额度（官方文档，2026-10-11 核对）：

| 账号类型 | 每日包含的 GPU 时长 | 排队优先级 |
| --- | --- | --- |
| 未登录 | 2 分钟 | 低 |
| 免费账号 | 5 分钟 | 中 |
| PRO 账号 | 40 分钟（可扩展） | 最高 |
| Team 组织成员 | 40 分钟（可扩展） | 最高 |
| Enterprise 组织成员 | 60 分钟（可扩展） | 最高 |

几条规则：

- 额度在你**当天第一次使用 GPU 之后正好 24 小时**重置，不是按自然日；
- 剩余额度会直接影响排队的优先级；
- PRO、Team、Enterprise 用户用完每日额度后，可以用预付的额度继续，官方标价是每 10 分钟 GPU 时间 1 美元。

所以提示额度不足时，先确认自己登录了没有（登录后从 2 分钟变成 5 分钟），其次是等重置。

### 3. 复制一个 Space 到自己名下

排队太久或想改点东西时，可以把公开的 Space 复制一份：

1. 点 Space 右上角的三个点，选择 **Duplicate this Space**；
2. 设置所有者（你自己或你有写权限的组织）、名称、可见性和硬件；
3. 如果原 Space 用到了环境变量：公开的变量（Variables）会自动带过来，密钥（Secrets）不会，页面会提示你自己补上。

官方说明，复制出来的 Space 默认使用 CPU Basic 硬件。需要显卡的应用在 CPU 上可能跑不动，这时要么升级硬件（按小时计费），要么确认自己的账号是否符合托管 ZeroGPU Space 的条件。

### 4. 创建自己的 Space

1. 在 Spaces 主页点 **Create new Space**；
2. 填名称，选许可证（可选）和可见性；
3. 选 SDK：Gradio、Docker 或 Static（静态页面）；
4. 创建后，这个 Space 就是一个 Git 仓库，往里面提交文件即可。

用 Gradio 做一个最小的应用，只需要两个文件。`requirements.txt` 写依赖，`app.py` 写界面：

```python
import gradio as gr

def greet(name):
    return f"你好，{name}！"

demo = gr.Interface(fn=greet, inputs="text", outputs="text")
demo.launch()
```

提交之后，Spaces 运行环境会自动安装依赖并启动应用。

**关于费用的前提**（官方文档原意）：静态 Space 人人免费；Gradio 和 Docker Space 运行在计算资源上，创建需要付费方案。免费个人账号如果状态良好（文档举的条件是邮箱已验证、账号注册超过 30 天），可以免费托管最多 2 个 ZeroGPU Space；PRO 账号最多 10 个。ZeroGPU 目前只兼容 Gradio SDK。

### 5. 硬件与计费

官方文档给出的默认规格：每个 Space 环境默认限制为 16GB 内存、2 个 CPU 核心、50GB 非持久化磁盘。部分硬件的小时价格（美元，官方文档 2026-10-11 所列，完整价格见官网定价页）：

| 硬件 | CPU | 内存 | 显存 | 每小时 |
| --- | --- | --- | --- | --- |
| CPU Basic | 2 vCPU | 16 GB | — | 免费 |
| CPU Upgrade | 8 vCPU | 32 GB | — | $0.03 |
| Nvidia T4 - small | 4 vCPU | 15 GB | 16 GB | $0.40 |
| 1x Nvidia L4 | 8 vCPU | 30 GB | 24 GB | $0.80 |
| Nvidia A10G - small | 4 vCPU | 15 GB | 24 GB | $1.00 |
| Nvidia A100 - large | 12 vCPU | 142 GB | 80 GB | $2.50 |

两条和钱有关的规则：

- 免费硬件上的 Space 长时间不用会自动休眠（官方举例是两天左右）；升级过硬件的 Space 默认一直运行、一直计费，可以在设置里自定义休眠时间；
- 在 Settings 里手动暂停（Pause）的时间不计费。

### 6. 可见性与密钥

可见性有三档：

| | Public 公开 | Protected 受保护 | Private 私有 |
| --- | --- | --- | --- |
| 源码 | 所有人可见 | 仅所有者和协作者 | 仅所有者和协作者 |
| 应用能否通过嵌入地址访问 | 能 | 能 | 不能 |
| 别人能否克隆 | 能 | 不能 | 不能 |

Protected 属于 PRO 或 Team、Enterprise 方案的功能，适合「想公开应用、不想公开代码」的情况。

应用里用到的 API Key **不要写进代码**。官方的做法是在 Space 的 Settings 里添加：

- **Variables**：非敏感配置，公开可见，会随复制带走；
- **Secrets**：令牌、密钥等敏感值，设置后无法再从设置页读出，也不会随复制带走。

在 Gradio 等 Space 里，两者都以环境变量的形式提供，Python 里用 `os.getenv("变量名")` 读取。

## 常见问题

**Q：上传到别人 Space 里的文件安全吗？**
Space 是第三方开发者写的应用，代码怎么处理你的输入由作者决定。公开 Space 的源码可以在 Files 标签里查看；涉及隐私或保密内容的文件，不要上传到不了解的 Space。

**Q：Space 打不开、一直在 Building 或报错？**
可能是作者的代码或依赖有问题，也可能是休眠后正在重启。稍等再刷新；长期不可用可以在 Community 里反馈，或者找功能相同的其他 Space。

**Q：能通过 API 调用 Space 吗？**
Gradio 应用自带 API 入口，一般在页面底部有「Use via API」之类的链接，给出调用示例；具体以该 Space 的页面为准。

**Q：申请免费显卡？**
官方文档提到，有创新性的 Space 可以在 Settings 里申请社区 GPU 资助（community GPU grant），是否通过由官方决定。

## 参考资料

- Hugging Face 文档：Spaces Overview — https://huggingface.co/docs/hub/spaces-overview
- Spaces ZeroGPU — https://huggingface.co/docs/hub/spaces-zerogpu
- Using GPU Spaces — https://huggingface.co/docs/hub/spaces-gpus
- Gradio Spaces — https://huggingface.co/docs/hub/spaces-sdks-gradio
