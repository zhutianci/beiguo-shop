---
title: ComfyUI 模型放哪里、节点怎么安装：models 文件夹、共用模型路径与自定义节点
slug: comfyui-models-folder-custom-nodes
products: [ai-tools]
models: []
accountTier: FREE
excerpt: ComfyUI 模型放哪个文件夹？怎么和 WebUI 共用模型？自定义节点怎么装、装不上怎么办？本文按官方中文文档讲清 models 目录结构、extra_model_paths.yaml 的写法、三种节点安装方式和官方的安全提醒。
checkedOn: 2026-10-11
sources:
  - https://docs.comfy.org/zh-CN/development/core-concepts/models
  - https://docs.comfy.org/zh-CN/installation/comfyui_portable_windows
  - https://docs.comfy.org/zh-CN/installation/install_custom_node
  - https://docs.comfy.org/zh-CN/get_started/first_generation
---

## 适用于谁

- 搜「comfyui 模型放哪里」「comfyui安装模型」「comfyui 节点安装」「comfyui 安装缺失节点」的人；
- 下载了模型但在节点里选不到，或者导入别人的工作流后一片红色报错的人。

本文根据 ComfyUI 官方中文文档整理，资料核对于 2026-10-11。还没装 ComfyUI 的话先看《ComfyUI 安装教程》。

## 结论先说

1. **模型按类型放进 `ComfyUI/models/` 下的对应子文件夹**：大模型放 `checkpoints`，LoRA、VAE、ControlNet 各有各的文件夹。放错文件夹，对应的加载节点里就看不到。
2. **放好之后要刷新**：在界面里按 **R** 键，或重启 ComfyUI。
3. **想和别的软件共用模型，不用复制文件**：用 `extra_model_paths.yaml` 把外部目录登记进来（桌面版在「存储」标签页里添加）。
4. **自定义节点优先用 ComfyUI Manager 装**，它会自动处理依赖。
5. **自定义节点是别人写的代码，有安全风险**。官方明确提醒只安装来自可信作者、社区常用的节点。

## 模型放哪里

### 默认目录

官方文档说明：模型默认存放在 `ComfyUI/models/` 下，按用途分成子文件夹，ComfyUI 启动时会检测这些文件夹。常见的几类：

| 模型类型 | 文件夹 | 作用 |
| --- | --- | --- |
| Checkpoint（主模型） | `models/checkpoints` | 负责生成画面的主扩散模型 |
| LoRA | `models/loras` | 针对某种风格、角色或概念训练的轻量附加权重 |
| VAE | `models/vae` | 图像与潜空间之间的编解码 |
| ControlNet | `models/controlnet` | 用线稿、深度、姿态等引导构图 |
| 放大模型 | `models/upscale_models` | 提高分辨率 |
| Embedding | `models/embeddings` | 文本嵌入 |

不同安装方式下 `models` 的实际位置：

- **便携版**：`ComfyUI_windows_portable/ComfyUI/models/`；
- **桌面版**：点应用顶部的胶囊菜单，打开 **存储（Storage）** 标签页可以看到模型目录，点文件夹图标直接在文件管理器里打开。官方注明这个菜单只在桌面应用里有，用浏览器访问的网页版没有。

有些较新的模型不是一个文件，而是拆成扩散模型、文本编码器、VAE 几个文件，各自放在不同的子文件夹。这种情况以该模型的官方工作流模板或说明页里写的路径为准。

### 使用模型的四步

官方文档的顺序：

1. 把文件放到正确的位置；
2. 在工作流里添加对应的加载器节点。这类节点名称里通常带 **Load**（如 Load Checkpoint、Load LoRA）；
3. 在加载器节点的下拉菜单里选择文件；
4. 把加载器连进工作流的其余部分。

ComfyUI 开着的时候放进去的文件，需要按 **R** 刷新或重启才会出现在列表里。

### 删除模型

官方说明目前界面里没有统一的「卸载」入口，要移除某个模型，到 `ComfyUI/models/` 下找到对应文件手动删除。

## 和其他软件共用模型

如果你已经有一批模型放在别处（比如另一个 ComfyUI 实例，或者 WebUI 的模型目录），不需要再复制一份。

### 便携版和手动安装

1. 在 ComfyUI 根目录找到示例文件 `extra_model_paths.yaml.example`；
2. 复制一份并改名为 `extra_model_paths.yaml`，仍放在 ComfyUI 根目录；
3. 按你的实际目录填写。官方给的示例：假设外部模型在 `YOUR_PATH/models/` 下，分 `loras`、`checkpoints`、`vae`、`controlnet` 几个子文件夹，配置写成：

```yaml
my_custom_config:
    base_path: YOUR_PATH
    loras: models/loras/
    checkpoints: models/checkpoints/
    vae: models/vae/
    controlnet: models/controlnet/
```

`base_path` 是外部目录的根路径，下面每一行是「模型类型: 相对路径」。第一行的名字可以自己取。

4. 保存后重启 ComfyUI。

### 桌面版

点顶部的胶囊菜单 → **存储（Storage）** 标签页，在里面添加模型目录即可，不需要手写配置文件。

## 自定义节点怎么安装

### 先了解风险

自定义节点是社区开发的扩展，能增加大量功能，但它们是在你电脑上运行的代码。官方文档的三条提醒：

1. 只安装来自可信作者、社区常用的自定义节点；
2. 安装前了解插件的功能，避开来源不明的；
3. 不要安装冷门或可疑的插件，未经审核的插件可能带来安全风险。

### 三种安装方式

| 方式 | 优点 | 缺点 |
| --- | --- | --- |
| ComfyUI Manager（官方推荐） | 自动安装、自动处理依赖、图形界面 | 搜不到没有在注册表里登记的节点 |
| Git Clone | 能装注册表里没有的节点、能指定版本 | 要会用 Git，依赖要自己装 |
| 下载 ZIP | 不需要 Git | 依赖要自己装，没有版本管理 |

**方法一：ComfyUI Manager**

官方说明 ComfyUI Manager 已经内置在当前大多数 ComfyUI 发行版中，桌面版用户默认启用新版的节点管理界面。打开 Manager，搜索节点名称，点安装，完成后按提示重启。

导入别人的工作流后出现红色的缺失节点，也是在 Manager 里处理：它提供安装缺失节点的入口，会列出当前工作流缺少的节点供你一键安装（具体按钮名称以你的版本界面为准）。

**方法二：Git Clone**

```bash
cd /path/to/ComfyUI/custom_nodes
git clone [仓库地址]
```

然后安装依赖。官方特别强调：依赖必须装进 **ComfyUI 自己的 Python 环境**，不要装到系统环境里。Windows 便携版的写法是：

```bash
python_embeded\python.exe -m pip install -r ComfyUI\custom_nodes\[节点目录]\requirements.txt
```

手动安装的环境则是先激活 ComfyUI 的虚拟环境，再在节点目录里执行 `pip install -r requirements.txt`。

**方法三：下载 ZIP**

在节点的 GitHub 页面下载 ZIP，解压到 `ComfyUI/custom_nodes` 下，再按方法二安装依赖。

三种方式装完都要**重启 ComfyUI 并刷新浏览器**。

## 常见问题

**Q：节点安装失败、装完不显示？**
官方的排查方法是看启动日志里有没有 `import failed`。出现这个提示，多半是依赖没装上，或者装到了错误的 Python 环境里。先读该节点 README 里的安装说明和依赖要求，再按上面的命令在 ComfyUI 的环境里重装依赖。

**Q：模型放进去了，节点里还是没有？**
按顺序检查：文件夹对不对（LoRA 放进了 checkpoints 是最常见的错误）；有没有按 R 刷新或重启；文件是否下载完整；用了 `extra_model_paths.yaml` 的话，文件名、缩进和路径是否正确。

**Q：自动下载模型一直不动？**
官方文档说明，自动下载通常从 Hugging Face 拉取，需要网络能正常访问。不动的话，从缺失模型的提示里复制下载链接，自己下载后放进对应文件夹。

**Q：所有模型都能在 ComfyUI 里直接用吗？**
不是。官方的说法是：原生支持的模型数量有限但在持续增加；另一部分模型依赖社区的自定义节点才能用，不同作者的模型路径和用法可能不一致，要读各项目自己的说明。

**Q：工作流文件放哪里？**
工作流是 JSON 文件，也可以从带元数据的图片里读取。用菜单的 工作流 → 打开 加载即可，不要求放在固定的文件夹。

## 参考资料

- ComfyUI 文档：模型 — https://docs.comfy.org/zh-CN/development/core-concepts/models
- 适用于 Windows 的 ComfyUI 便携版（添加外部模型路径）— https://docs.comfy.org/zh-CN/installation/comfyui_portable_windows
- 如何在 ComfyUI 中安装自定义节点 — https://docs.comfy.org/zh-CN/installation/install_custom_node
- 开始 ComfyUI 的 AI 绘图之旅 — https://docs.comfy.org/zh-CN/get_started/first_generation
