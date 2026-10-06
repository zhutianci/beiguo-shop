---
title: nano banana 数据可视化海报提示词：把手表睡眠数据做成"睡眠地质层"3D 海报
slug: sleep-strata-poster
model: nano-banana
topics: [infographic, poster]
modelLabel: Nano Banana Pro
needsRefImage: true
aspectRatio: "3:4"
useCase: 用智能手表 / 手环记录睡眠的人，上传一张睡眠数据截图，生成一张可爱的 3D 数据海报：清醒、REM、核心、深睡按时长比例堆成玻璃瓶里的四层"地质层"，适合每日打卡分享。
prompt: |
  可爱的睡眠报告海报（Sleep Report Poster）。
  第一步：分析我上传的[手表睡眠数据截图]，提取清醒、REM、核心睡眠、深睡四个阶段的时长和比例，以及总时长和睡眠评分。
  画面主体：一个竖直的长方体透明玻璃容器（像精致的地质采样管），放在深色纯色背景中。容器内部由四种颜色的微缩景观层层堆叠，每层的厚度严格按对应阶段的时长比例生成：
  - 顶层·清醒（橙色）：干燥的沙漠地表，象征活跃纷乱的意识；
  - 第二层·REM（浅蓝）：漂浮着云朵和气泡的梦幻天空层，通透轻盈；
  - 第三层·核心睡眠（深蓝）：柔软的海洋球或层叠羽绒，平稳安定；
  - 底层·深睡（紫罗兰）：坚硬厚重、微微发光的水晶矿层，越厚代表睡得越好。
  容器顶部瓶口边缘坐着一个 Q 版 3D 小人（[我的形象]），双腿自然垂下，手腕戴着迷你智能手表；评分高时头顶有满格的绿色电池、表情惬意，评分低时垂头丧气抱着咖啡。
  渲染：C4D / Blender 风格 3D 渲染，突出玻璃折射和沙子、云朵、海洋球、水晶的材质，背景为[深夜蓝]，光线突出容器内部的通透感和底层微光。
  底部排版：主标题"[昨晚的睡眠地质层]"，核心数据"总睡眠时长 | 睡眠评分"，用四个对应颜色的小圆点做图例，标注每层名称和时长。
negativePrompt: null
source:
  repo: PicoTrex/Awesome-Nano-Banana-images
  url: https://x.com/op7418/status/1997274785232101723
  author: "@op7418"
  license: Apache-2.0
  licenseUrl: https://www.apache.org/licenses/LICENSE-2.0
  changes: 在仓库收录的原文基础上精简措辞、合并重复描述；把数据来源、小人形象、背景色、主标题设为变量；去掉了原文中的具体手表品牌名
images:
  - 183-sleep-strata-poster-1.jpg
imageCredit:
  by: "@op7418"
  url: https://github.com/PicoTrex/Awesome-Nano-Banana-images/tree/main/images/pro_case52
  license: Apache-2.0
verify:
  - 用两张不同的睡眠截图实测，检查各层厚度是否真的随数据变化
  - 检查海报底部的数字是否与截图一致
  - 确认原帖仍可访问、作者未另行声明保留权利
---
**怎么用**：上传手表 / 手环 App 里的睡眠详情截图（要能看到各阶段时长）。想让小人像自己，可以再上传一张自拍，把 [我的形象] 改成"参考第二张图中的人物"。示例图是两张不同数据生成的海报，可以看到各层厚度不同。

**常见问题**：
- 层厚和数据对不上：先追问"列出你从截图里读到的四个阶段时长"，确认后再出图。
- 数字写错：底部数据可以只保留总时长和评分，减少出错。
- 别的数据也能这么玩：把四层换成"步数 / 消耗 / 运动时长"或"本月支出分类"，就是一张个人数据海报。

**适合**：每日打卡、健康类账号内容、数据可视化创意练习。

### 原版提示词

原帖为中文，仓库收录的原文较长（约 700 字），结构与上方改编版一致：任务说明 → 数据提取 → 玻璃容器与四层景观 → Q 版小人状态 → 渲染与光影 → 底部排版。完整原文见[仓库条目](https://github.com/PicoTrex/Awesome-Nano-Banana-images)「例 52：睡眠报告海报」。

> 改编自 [@op7418](https://x.com/op7418/status/1997274785232101723) 发布、[PicoTrex/Awesome-Nano-Banana-images](https://github.com/PicoTrex/Awesome-Nano-Banana-images) 收录的提示词，仓库许可证 Apache-2.0。
