---
title: "ai像素画生成提示词：6 只小机器人在沙洲小岛办公的团队横幅（gpt-image-2）"
slug: pixel-robot-team-sandbank-banner
model: gpt-image-2
topics: [wallpaper, game-art]
aspectRatio: "16:9"
needsRefImage: false
useCase: "给开发者工具、AI 代理项目或技术团队做一张轻松的宣传横幅：一座海中小沙洲上，6 只 Q 版机器人一边度假一边干活，各自拿着看板、笔记本、终端和冲浪板，16 位像素游戏画风。"
prompt: |
  为[一个 AI 开发者工具项目]画一张可爱的 16:9 横版像素风宣传插画：明亮的碧蓝大海中央有一座小小的热带沙洲，晴朗的蓝天。复古 16 位像素画，方块像素清晰，高饱和，讨喜的游戏美术风格，画面里不放任何标题文字和水印。
  - 场景：椭圆形的小沙岛，四周是[明亮的青绿色]浅水和一圈圈白色浪花，水下看得见珊瑚和礁石；右侧远处海平线上有一座绿色小岛；大朵蓬松的像素云、几只白色小鸟、海面闪光；
  - 主角：恰好 6 只 Q 版小机器人，圆润的白色身体、黑色玻璃屏幕脸、[青色]发光的眼睛、头顶小天线，从左到右排在沙滩上：
    1. 坐在[橙白相间]的大遮阳伞下，戴墨镜、穿青绿色花衬衫，旁边一杯椰子饮料和一块画着彩色节点连线的计划板；
    2. 趴在条纹沙滩巾上用笔记本电脑，穿蓝色热带花纹短裤，旁边一杯椰子饮料；
    3. 站在中间，穿橙黄色探险外套、戴黄色安全帽，一手拿写字板，一手提着带绿色命令行符号的黑色小终端方块；
    4. 坐在一只深色大装备箱后面，戴绿色渔夫帽，箱子正面有三个彩色的文件图标；
    5. 躺在木质沙滩椅上，戴橙色墨镜，用一台屏幕上有绿色命令行符号的黑色笔记本，旁边小桌上一杯绿色饮料；
    6. 站在最右边，戴蓝色鸭舌帽，抱着一块印有电路板纹路的青绿色冲浪板；
  - 沙滩细节：靠近前景中央恰好 1 只橙色海星，几枚贝壳和小石子，装备箱旁一个小沙堡，每个物体下面都有柔和的影子；
  - 氛围：欢快、可爱、协作感，"在海边度假顺便写代码"；所有元素缩小后仍然清楚，轮廓干净、间距均衡。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/turingou/status/2062410109763064040
  author: "@turingou"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文，把 6 只机器人的描述整理成逐条清单；项目主题、屏幕发光色、海水颜色、遮阳伞配色设为变量；删去原文里的项目名，改为通用描述；精简了重复的风格词"
images:
  - 3581-pixel-robot-team-sandbank-banner-1.jpg
imageCredit:
  by: "@turingou"
  url: https://youmind.com/gpt-image-2-prompts?id=24204
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：[一个 AI 开发者工具项目] 写你的项目或团队类型，只影响道具倾向，不会变成画面文字，例如"一个数据分析小组""一家独立游戏工作室"；[青色] 是机器人屏幕脸的发光色，可换成品牌主色；[明亮的青绿色] 是海水颜色；[橙白相间] 是遮阳伞配色。6 只机器人的道具可以逐条替换成自己团队的分工，比如把冲浪板换成"画板"、把装备箱换成"服务器机箱"。

示例图是一张宽幅像素画：碧蓝海面中间一座米黄色沙洲，六只白色小机器人排成一排——伞下戴墨镜的、趴着敲电脑的、戴安全帽拿清单的、守着装备箱的、躺椅上抱笔记本的、抱冲浪板的；沙滩上有海星、贝壳和小沙堡，天上是大朵白云和几只海鸟，画面没有标题字。

**常见问题**：
- 机器人数量不对或长相不统一：保留"恰好 6 只"，并加"所有机器人是同一型号，只有帽子和衣服不同"。
- 像素感不够：加"低分辨率像素画按整数倍放大，不要平滑渐变"。
- 想加项目名：另起一行写"顶部居中用像素字体写某某名称"，名称控制在 12 个字符以内。

**适合**：开源项目 README 头图、团队介绍页横幅、技术分享的片头图。和库里那条单只像素机器人吉祥物不同，这条是多角色的团队场景。

### 英文原版

```text
Create a cute wide pixel-art promotional illustration for {argument name="project name" default="Sandbank Agent"}, showing a tiny tropical sandbank island in the middle of bright turquoise ocean under a sunny blue sky. Canvas: 16:9 landscape, retro 16-bit pixel art, crisp blocky pixels, high saturation, charming game-art aesthetic, no text overlays or watermark. Scene: a small oval sandy island surrounded by shallow aqua water, white surf rings, coral and rocks visible below the water, distant green island on the far right horizon, huge puffy pixel clouds, tiny white birds, sparkling sea highlights. Main subjects: exactly 6 adorable chibi robots with rounded white bodies, black glass screen faces, cyan glowing eyes, small antennas, and beach/workspace accessories, arranged left to right across the sand. Robot 1 sits under a large orange-and-white beach umbrella wearing sunglasses and a turquoise Hawaiian shirt, next to a coconut drink and a standing planning board showing connected colored nodes. Robot 2 lies on a striped beach towel using an open laptop, wearing blue tropical swim shorts, with a coconut drink beside the towel. Robot 3 stands in the center wearing a yellow-orange explorer jacket and yellow hardhat, holding a clipboard in one hand and a small black terminal cube with a green command prompt symbol in the other. Robot 4 sits behind a large dark equipment chest, wearing a green bucket hat and green outfit; the chest has three colorful file/app icons on the front. Robot 5 lounges in a wooden beach chair wearing orange sunglasses and red swimwear, using a black laptop with a green command prompt symbol; a small side table holds a green drink and a vertical board or paddle rests behind the chair. Robot 6 stands at the far right wearing a blue cap and holding a turquoise surfboard decorated with circuit-board lines, suggesting playful developer infrastructure. Add small beach details: exactly 1 orange starfish near the center foreground, several small shells and pebbles, a small sandcastle mound near the equipment chest, and soft shadows under every object. Mood: cheerful, cute, collaborative, techy beach-vacation workspace harness vibe. Use {argument name="robot face glow color" default="cyan"} screen glows, {argument name="ocean color" default="bright turquoise"} water, {argument name="umbrella color" default="orange and white"}, and {argument name="pixel art style" default="16-bit retro game art"}. Keep all elements clearly readable at small size, with clean silhouettes and balanced spacing.
```

> 改编自 [@turingou](https://x.com/turingou/status/2062410109763064040) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
