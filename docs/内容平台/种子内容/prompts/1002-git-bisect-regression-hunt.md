---
title: 以前好好的现在坏了：git bisect 二分定位回归 Bug 提示词（附自动判定脚本）
slug: git-bisect-regression-hunt
model: any-llm
topics: [coding]
needsRefImage: false
useCase: 某个功能在旧版本正常、新版本坏了，但中间隔了几十上百个提交不知道是哪个引起的时候用：让 AI 帮你写好 git bisect 的完整步骤和「好 / 坏」自动判定脚本，几轮就能定位到出问题的那次提交。
prompt: |
  请帮我用 git bisect 找出引入问题的那次提交。

  信息：
  - 问题现象：[坏的表现]
  - 确定正常的版本：[标签或提交号]
  - 确定有问题的版本：[通常是当前分支]
  - 怎么判断好坏：[手动操作步骤或测试命令]
  - 项目的构建 / 依赖安装方式：[如 npm ci、mvn package]
  - 操作系统与 shell：[如 macOS zsh、Windows Git Bash]

  请给出：
  1. 完整命令序列：从开始、标记好坏、每轮测试，到结束后回到原分支。说明每条命令的作用。
  2. 一个可以交给 git bisect run 的判定脚本，要求：
     - 每轮先安装依赖、构建（只做必要的步骤，尽量快）；
     - 问题存在时以 1 到 127 之间、不是 125 的码退出，正常时以 0 退出；
     - 遇到构建失败等「这一版本没法判断」的情况，以 125 退出让 bisect 跳过；
     - 不修改仓库里被跟踪的文件，临时文件放到仓库外。
  3. 如果判断方式只能手动，给出每一轮我该做什么、怎么标记的简短清单。
  4. 预估大概需要几轮（按提交数量计算）。
  5. 找到可疑提交后，下一步怎么做：看这次提交改了什么、怎么确认它就是原因（比如在当前版本上单独回退这次提交再测）、修复时要注意什么。

  注意事项也要写：开始前要确保工作区干净；中间有合并提交时怎么处理；判定命令依赖的测试文件在旧版本里不存在时怎么办。
negativePrompt: null
source: null
verify:
  - 核对 git bisect run 的退出码约定（0 好、125 跳过、1–127 其余为坏）与 https://git-scm.com/docs/git-bisect 一致
---
**怎么填变量**：[怎么判断好坏] 写得越机械越好，最好是一条命令，比如「运行 `npm test -- price.test.ts`，失败就是坏」。能自动判定时，bisect 可以全自动跑完，你去喝杯咖啡就行。

**常见坑**：
- 判定用的测试文件如果是最近才加的，旧版本里没有它。解决办法是先把测试文件复制到仓库外，判定脚本每轮从外面拷进来再运行。
- 旧版本的依赖可能装不上或构建失败，这种版本应该「跳过」而不是标成坏，否则会定位错。
- 结束后一定要 `git bisect reset`，否则仓库停在某个旧提交上。

**追问技巧**：定位到提交后，把这次提交的 diff 贴回去，问「这次改动里哪一处最可能导致 [坏的表现]，给出最小修复」。

### 示例输出

> 示例，仅供参考（正常版本 v2.3.0，当前 main 有问题，约 120 个提交）

```bash
git status                       # 确认工作区干净
git bisect start
git bisect bad                   # 当前版本有问题
git bisect good v2.3.0           # 这个版本正常
cp tests/price.test.ts /tmp/     # 测试文件放到仓库外
git bisect run /tmp/check.sh     # 自动二分
git bisect reset                 # 回到原分支
```

```bash
#!/usr/bin/env bash
# /tmp/check.sh
npm ci --silent || exit 125                 # 装不上依赖：跳过这一版
cp /tmp/price.test.ts tests/price.test.ts
npx vitest run tests/price.test.ts; code=$?
git checkout -- tests/ 2>/dev/null; git clean -fdq tests/
[ $code -eq 0 ] && exit 0 || exit 1
```

约 120 个提交，二分大约需要 7 轮。
