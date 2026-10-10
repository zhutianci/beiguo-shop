---
title: ComfyUI Manager 安装与使用：在哪里打开、不显示怎么办、一键安装缺失节点
slug: comfyui-manager-install-missing-nodes
products: [ai-tools]
models: []
accountTier: FREE
excerpt: ComfyUI Manager 在哪、为什么不显示？本文按官方中文文档讲清桌面版、便携版、手动安装怎么启用 Manager，新版界面怎么安装、更新、卸载节点，怎么一键补齐缺失节点，以及常见报错的处理。
checkedOn: 2026-10-11
sources:
  - https://docs.comfy.org/zh-CN/manager/overview
  - https://docs.comfy.org/zh-CN/manager/install
  - https://docs.comfy.org/zh-CN/manager/pack-management
  - https://docs.comfy.org/zh-CN/manager/troubleshooting
  - https://docs.comfy.org/zh-CN/installation/install_custom_node
---

## 适用于谁

- 搜「comfyui manager 安装」「comfyui manager 在哪」「comfyui manager 不显示」「comfyui 安装缺失节点」的人；
- 导入别人分享的工作流后，画布上一片红色节点、不知道该装什么的人。

本文根据 ComfyUI 官方中文文档整理，资料核对于 2026-10-11。ComfyUI 更新很快，命令和界面以你安装的版本和官方文档为准。还没装 ComfyUI 的话先看《ComfyUI 安装教程》。

## 结论先说

1. **ComfyUI Manager 是管理自定义节点的扩展**，官方列出的四项主要功能：自定义节点管理（安装、更新、删除、禁用）、模型管理、快照管理、缺失节点检测。
2. **新版 Manager 已经内置在 ComfyUI 核心里**，但便携版和手动安装的版本需要**自己启用**：安装依赖，并在启动命令里加上 `--enable-manager`。旧教程里「克隆到 custom_nodes」的装法已经不是首选。
3. **桌面版不用装**。官方说明 Comfy Desktop 每次安装 ComfyUI 时都会一并装好 Manager 并启用。
4. **「不显示」最常见的原因就是没加 `--enable-manager`**，或者依赖没装进 ComfyUI 自己的 Python 环境。
5. **导入工作流缺节点时会弹窗提示**，点「安装全部」即可；装完要重启 ComfyUI。
6. **新版界面只能安装注册表里登记过的节点**，也不再支持通过 git 地址安装。没登记的节点要手动装。

## 步骤

### 1. 启用 Manager

**桌面版（Comfy Desktop）**

不需要任何操作。想调整相关设置：在 Comfy Desktop 里打开对应的安装实例，进入 **Manage panel**，切到 **Startup Args** 选项卡。这里有两个和 Manager 有关的选项：

- **Manager Security Level**：决定 Manager 可以安装哪些节点包，分 Strict、Standard（官方推荐）、Relaxed、Permissive 四档。官方提醒，当 ComfyUI 用 `--listen` 暴露到网络时，更严格的级别尤其重要；
- **Manager Network Mode**：决定 Manager 怎么访问节点注册表，分 Public（默认）、Private、Offline、Personal cloud。

两项都在下次启动该实例时生效。

**Windows 便携版**

在便携版的根目录（`ComfyUI_windows_portable`）打开终端：

```bash
.\python_embeded\python.exe -m pip install -r ComfyUI\manager_requirements.txt
.\python_embeded\python.exe -s ComfyUI\main.py --windows-standalone-build --enable-manager
```

第一行安装 Manager 的依赖，第二行带着 `--enable-manager` 启动。想以后双击就带上 Manager，可以把第二行的参数加进你平时用的启动脚本（如 `run_nvidia_gpu.bat`）里。

**手动安装**

```bash
# 先激活 ComfyUI 的虚拟环境
# Windows:  venv\Scripts\activate
# Linux / macOS:  source venv/bin/activate

pip install -r manager_requirements.txt
python main.py --enable-manager
```

相关的启动参数：

| 参数 | 作用 |
| --- | --- |
| `--enable-manager` | 启用 ComfyUI-Manager |
| `--enable-manager-legacy-ui` | 使用旧版 Manager 界面（需同时带 `--enable-manager`） |
| `--disable-manager-ui` | 关闭 Manager 的界面和接口，但保留后台功能（需同时带 `--enable-manager`） |

### 2. 认识新版界面

官方对新版界面的三个区域的说明：

- **左侧筛选器**：按已安装、当前工作流中的节点、缺失节点、可更新节点等筛选；
- **顶部搜索栏**：搜索节点包（Node Pack）或单个节点（Node），用 Filter 切换搜索类型；
- **右侧详情面板**：点某个节点后显示介绍、启用状态、版本信息等。Description 标签页是仓库信息，Nodes 标签页可以预览这个包里的全部节点。

「节点包」和「单个节点」的区别：一个节点包里通常有很多个节点。只知道工作流里缺的那个节点叫什么时，把搜索类型切到单个节点来找它属于哪个包。

### 3. 安装、更新、卸载节点

**安装**

1. 在列表里选中节点卡片；
2. 在展开的信息里点 **安装（Install）**；
3. 需要特定版本时，在 **版本（version）** 里选好再安装。

**更新**

1. 左侧选「有可用更新」筛选器，可更新的节点带有箭头标志；
2. 在 version 里选择版本；
3. 点 **Update**。

**卸载**

选中节点，在详情里点 **卸载（Uninstall）**。

每次安装、更新、卸载之后，重启 ComfyUI 并刷新浏览器页面。

### 4. 一键补齐工作流缺失的节点

官方说明：Manager 正确安装的情况下，加载工作流时如果有节点缺失，会**弹窗提示**缺失节点的信息。两个选择：

- **安装全部（Install All）**：一次装齐；
- **打开管理器（Open Manager）**：进 Manager 看清楚每个节点包是什么，再决定装哪些。

也可以在 Manager 里用左侧的缺失节点筛选器，或者点 **查找缺失节点（Missing）** 按钮来查。

建议先看再装。别人的工作流可能依赖一些很冷门的节点包，官方对自定义节点的安全提醒同样适用于这里：只安装来自可信作者、社区常用的节点，避免来源不明的插件。

### 5. 新版界面里找不到的节点怎么办

官方常见问题里的两条：

- **搜不到需要的节点**：新版 Manager 目前只支持从注册表（registry）安装节点，没有在注册表登记的节点搜不到；
- **找不到「通过 git 安装」的选项**：官方的解释是，出于用户系统的安全性和稳定性考虑，新版界面不支持通过 git 安装节点。

这两种情况都要手动安装：把节点仓库克隆到 `ComfyUI/custom_nodes`，再在 ComfyUI 的 Python 环境里安装它的依赖。具体步骤见《ComfyUI 模型放哪里、节点怎么安装》。也可以用 `--enable-manager-legacy-ui` 切回旧版界面。

## Manager 不显示怎么办

按下面的顺序查：

1. **启动命令里有没有 `--enable-manager`**。便携版和手动安装的版本，不带这个参数 Manager 不会启用；
2. **依赖装对地方了吗**。便携版必须用 `python_embeded\python.exe -m pip` 来装，直接敲 `pip install` 会装到系统的 Python 里；
3. **是不是带了 `--disable-manager-ui`**。这个参数会隐藏界面；
4. **更新 ComfyUI 之后消失了**。官方说明：Manager 是和 ComfyUI 本体分开的 Python 包，更新 ComfyUI 后已安装的 Manager 包可能不会跟着更新。重新执行一遍「安装依赖 + 带 `--enable-manager` 启动」；
5. **用旧方式克隆安装的**：检查文件夹是否正好是 `ComfyUI/custom_nodes/comfyui-manager`。官方列出的常见错误有：文件直接散放在 `custom_nodes` 里、双重嵌套（`ComfyUI-Manager/ComfyUI-Manager`）、文件夹名带 `-main` 后缀、压缩包没有正确解压。官方的说法是这样装「看起来可以工作」，但不会被识别为可更新，还可能造成重复安装，应当删除后用 `git clone` 重新装；
6. 看启动日志里有没有与 manager 相关的报错。

## 官方故障排除里的几个报错

以下设置都写在 Manager 的 `config.ini` 里（位置见官方故障排除文档）：

| 现象 | 官方给的处理 |
| --- | --- |
| `git.exe` 不在系统默认位置，Manager 找不到 git | 在 `config.ini` 的 `git_exe =` 后填上包含文件名的完整路径 |
| Windows 上加载时出现 `Overlapped Object has pending operation at deallocation` | 在 `config.ini` 里加一行 `windows_selector_event_loop_policy = True` |
| `SSL: CERTIFICATE_VERIFY_FAILED` | 在 `config.ini` 里加一行 `bypass_ssl = True`。这会跳过证书校验，只应在你清楚原因的受信任网络里使用 |

网络访问受限导致节点列表或模型下载不下来时，官方故障排除文档提供了 `GITHUB_ENDPOINT`、`HF_ENDPOINT` 两个环境变量的配置说明，以官方文档为准。

## 常见问题

**Q：桌面版的 Manager 怎么更新？**
官方说明桌面版内置 Manager，随 Comfy Desktop 的更新保持最新。

**Q：节点装完后工作流还是红的？**
先确认已经重启 ComfyUI 并刷新了页面。仍然不行，看启动日志里有没有 `import failed`，多半是该节点的依赖没装上，按节点 README 的说明处理。

**Q：装了一个节点之后 ComfyUI 起不来了？**
到 `ComfyUI/custom_nodes` 里把刚装的那个节点文件夹移走，再启动。能起来就说明是它的问题。Manager 的快照功能可以保存和恢复安装状态，大改动之前先存一个快照。

**Q：Manager 能下载模型吗？**
能，模型管理是官方列出的主要功能之一。模型下到哪个文件夹、怎么和其他软件共用，见《ComfyUI 模型放哪里》。

**Q：把 ComfyUI 开给局域网里的其他人用，要注意什么？**
带 `--listen` 对外开放时，把 Manager Security Level 调到更严格的档位，避免别人通过界面在你的机器上安装任意节点。

## 参考资料

- ComfyUI 文档：ComfyUI Manager 简介 — https://docs.comfy.org/zh-CN/manager/overview
- ComfyUI-Manager 安装 — https://docs.comfy.org/zh-CN/manager/install
- 自定义节点（新版 UI）管理 — https://docs.comfy.org/zh-CN/manager/pack-management
- ComfyUI Manager 故障排除 — https://docs.comfy.org/zh-CN/manager/troubleshooting
- 如何在 ComfyUI 中安装自定义节点 — https://docs.comfy.org/zh-CN/installation/install_custom_node
