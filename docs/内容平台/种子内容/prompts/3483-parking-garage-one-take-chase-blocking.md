---
title: "ai分镜提示词：地下车库追逐戏一镜到底调度图，路线箭头 + 时间轴（gpt-image-2）"
slug: parking-garage-one-take-chase-blocking
model: gpt-image-2
topics: [comic, photography]
aspectRatio: "3:1"
needsRefImage: false
useCase: "策划一场追逐戏 / 动作戏的走位时用：一张 3:1 超宽全景把完整路线、两个人物的十来组先后姿态、盲区和障碍点都画在同一个空间里，上沿是编号节点，下沿是时间轴，像导演手里的调度预演图。"
prompt: |
  生成一张 3:1 超宽幅的电影分镜关键帧，用一个连续的全景画面规划一场地下停车场里的一镜到底追逐戏，把完整路线、人物走位、追逐关系、冲突点和最终出口全部画在同一个空间里。
  画面：横向 3:1，偏暗的写实电影剧照风格。昏暗的混凝土地下车库，柱子和墙面上有"[B2]"楼层标识，地面潮湿反光，头顶是成排的日光灯管，停着几辆黑色轿车，承重柱底部贴着黄黑警示条，地面有行车导向箭头；最右端是一条通向地面、透着白色天光的出口坡道，上方挂"出口 EXIT"指示牌。
  人物与动作：主角是[黑夹克白球鞋、背双肩包的年轻男子]，追逐者是[棕色夹克、体型更壮的中年男人]。这两个人在同一个连续空间里从左到右重复出现，用一组组先后的动作姿态表现过程，不要画成一格一格的分镜。主角从最左侧的电梯口出来，穿过车位区，绕到柱子后面，从两车之间的窄缝侧身挤过，推倒清洁车和黄色警示牌拖住对方，最后冲向最右侧明亮的出口坡道。
  调度图形：一条粗的黄色曲线箭头贴着地面从左到右贯穿全图，标出主角的路线和方向；一条蓝色虚线绕过车辆和柱子，表示另一条移动路线；柱子旁画一个斜线填充的圆形区域，标注"柱子盲区"；窄缝和障碍处各有一个小箭头，分别标注"窄缝通过""障碍阻挡"。
  顶部编号：沿上边缘从左到右均匀排列恰好 10 个黄色圆圈编号，每个配两行白色手写体小字：① 电梯开启 / 察觉异常；② 加快脚步 / 穿过车位区；③ 追逐者现身 / 开始追赶；④ 柱后堵截 / 挡住去路；⑤ 抓住背包 / 差点被抓；⑥ 贴柱急转 / 甩开追逐者；⑦ 侧身穿过 / 车辆窄缝；⑧ 追逐者被迫 / 减速绕行；⑨ 推倒障碍 / 阻挡追击；⑩ 冲向出口 / 拉开距离。
  底部时间轴：一条半透明黑色横条，细黄线加小圆点和箭头，从左到右恰好 8 个时间点：00:00 电梯开启、00:05 察觉跟踪、00:10 追逐者现身、00:16 柱后堵截、00:20 贴柱挣脱、00:26 窄缝穿过、00:32 障碍阻挡、00:42 冲向出口。
  风格：写实的电影动作预演图，冷灰色调，高对比，湿地面反光，奔跑的人物带一点动态模糊，环境细节清晰；黄色标注像导演的走位调度图，白色手写中文批注，紧张的悬疑氛围。
  限制：整张图是一个连续的宽幅空间，不是漫画分格；主角和追逐者每次出现时衣着、体型保持一致；不要 Logo、水印和无关文字。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/MrLarus/status/2076627533684936928
  author: "@MrLarus"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文并按\"画面 / 人物 / 调度图形 / 编号 / 时间轴 / 风格\"分段；主角、追逐者、楼层标识改为变量；删去原文的像素尺寸和可选的\"第三个剪影\"；原文\"7 个时间点\"与实际列出的 8 个不一致，统一为 8 个；第 5 个节点按示例图补了第二行\"差点被抓\"。"
images:
  - 3483-parking-garage-one-take-chase-blocking-1.jpg
imageCredit:
  by: "@MrLarus"
  url: https://youmind.com/gpt-image-2-prompts?id=28659
  license: CC BY 4.0
verify:
  - "示例图中人物为照片级写实的 AI 生成人物（非真人），黑色轿车车牌上有类似真实车牌格式的字样，请确认是否可接受"
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：两个人物描述换成你剧本里的角色，写清上衣颜色、体型和一件醒目的随身物（背包、帽子、雨伞），模型才能在十来次重复出现时画成同一个人；[B2] 是楼层标识。想换场景（如"夜市小巷""商场中庭""地铁换乘通道"），把第二段的环境描述、路线经过的地点和 10 个节点文字一起改，节点保持每条两行、每行不超过 6 个字。

示例图是一张 3:1 的超宽画面：冷灰色调的地下车库里，黑衣背包青年和棕夹克男人从左侧电梯口到右侧出口坡道先后出现了近十组姿态；黄色曲线箭头贴着地面贯穿全图，蓝色虚线绕过一辆黑色轿车，柱脚旁的斜线圆圈标着"柱子盲区"；上沿是 ①～⑩ 的黄圈编号和白色手写中文说明，下沿是 00:00～00:42 的黄色时间轴。

**常见问题**：
- 画成了多格分镜：重申"一个连续空间、同一机位的全景，人物多次出现"。
- 中段人物挤在一起分不清先后：把节点减到 6～8 个，或把画幅改成 4:1。
- 编号小字写错：每条压到两行、每行 4～6 个字；实在不稳就不要文字，后期自己叠字。
- 路线和人物位置对不上：按"电梯、车位、柱子、窄缝、障碍、坡道"的顺序把经过点写清楚。

**适合**：动作戏和追逐戏的走位预演、一镜到底短片策划、给图生视频模型做全程参考、剧本杀与桌游的场景路线示意。不适合需要逐镜头切换景别的常规分镜表。

### 英文原版

```text
Goal: Create an ultra-wide 3:1 cinematic storyboard keyframe for a one-take action chase sequence in an underground parking garage, showing the full route, character blocking, pursuit relationship, conflict points, and final exit in one continuous panoramic scene.

Canvas: Horizontal 3:1 aspect ratio, dark realistic film still style, approximately 1200×400 composition. Use a dim concrete basement parking lot labeled B2, wet reflective floor, fluorescent ceiling lights, parked black cars, concrete pillars with yellow-black hazard stripes, directional road markings, and a bright ramp exit at the far right.

Main action: Depict {argument name="protagonist description" default="a young man in a black jacket, black pants, white sneakers, carrying a black backpack"} being chased by {argument name="pursuer description" default="a larger middle-aged man in a brown jacket and dark pants"}. Show the same two characters repeated across the continuous space as sequential action poses, not as separate panels. The protagonist begins at the elevator on the far left, runs through the car area, dodges behind a pillar, slips past parked cars, uses an obstacle area to slow the pursuer, then sprints toward the bright exit ramp on the far right. Add a third silhouette-like runner only at the far-right exit if needed to emphasize the final escape.

Layout and movement graphics: Overlay a thick yellow curved route arrow running from left to right across the entire image, with arrowheads marking direction. Add a dashed blue path around the cars and pillars to indicate alternate movement. Add a hatched circular blind-zone mark near the pillar labeled as a blind spot. Add small annotation arrows pointing to the obstacle area near caution signs and carts.

Numbered storyboard labels: Place exactly 10 yellow circled numbers with small white handwritten-style Chinese captions along the top edge, evenly spaced from left to right. Use these exact visible step captions: ① 电梯开启 / 察觉异常; ② 加快脚步 / 穿过车位区; ③ 追逐者现身 / 开始追赶; ④ 柱后堵截 / 挡住去路; ⑤ 抓住背包; ⑥ 贴柱急转 / 甩开追逐者; ⑦ 侧身穿过 / 车辆窄缝; ⑧ 追逐者被迫 / 减速绕行; ⑨ 推倒障碍 / 阻挡追击; ⑩ 冲向出口 / 拉开距离.

Bottom timeline: Add a black semi-transparent horizontal timeline strip across the bottom. It must contain exactly 7 time markers and event labels from left to right: 00:00 电梯开启; 00:05 察觉跟踪; 00:10 追逐者现身; 00:16 柱后堵截; 00:20 贴柱挣脱; 00:26 穿缝穿过; 00:32 障碍阻挡; and at the far right 00:42 冲向出口. Use a thin yellow line with small arrowheads and dots.

Scene details: Include an elevator doorway at far left with B2 signage, several parked cars, multiple concrete support columns, a narrow gap between vehicles, trash carts or cleaning carts, yellow caution wet-floor signs, and a bright white daylight exit ramp at far right with an overhead exit sign. Use Chinese parking-garage signage where visible, such as B2 and 出口 EXIT.

Visual style: Photorealistic cinematic action storyboard, moody cool-gray color grading, high contrast, wet concrete reflections, motion-blur hints on running figures, sharp environmental details, yellow annotation graphics resembling a director's blocking plan, handwritten white Chinese notes, tense thriller atmosphere. Make it look like a finished previsualization board for {argument name="sequence title" default="Underground Parking Garage Chase"}.

Constraints: Keep the composition as one continuous wide space, not comic panels. Show exactly 10 numbered top annotations, exactly 8 bottom timeline events including the final 00:42 marker, and maintain the same protagonist and pursuer across all repeated poses. Do not add logos, watermarks, or unrelated text.
```

> 改编自 [@MrLarus](https://x.com/MrLarus/status/2076627533684936928) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
