---
title: 即梦提示词：儿童科学节活动海报，穿白大褂的卡通小科学家 + 望远镜烧杯机器人
slug: kids-science-fair-poster
model: jimeng
topics: [poster, illustration]
needsRefImage: false
aspectRatio: "2:3"
useCase: 做学校科技节、少儿科学营、图书馆科普活动的招募海报时，生成一张色彩明快的卡通海报：一群戴护目镜的孩子拿着冒泡的烧杯、望远镜，旁边有小机器人，上方是活泼的标题，底部是时间地点。
prompt: |
  一张有趣又有教育意义的[儿童科学节]海报。
  - 画面是色彩缤纷的卡通插画：几个穿白大褂、戴护目镜的孩子扮成小科学家，有的举着冒彩色泡泡的烧杯，有的用望远镜观察，旁边站着一个圆头的[小机器人]；
  - 孩子们表情兴奋、充满好奇，肤色和发型各不相同；
  - 顶部是活泼、适合儿童的大标题"[科学探险节]"和副标题"[探索、发现、创造！]"；
  - 底部一栏写活动信息："[10月15日 周六]"、地点、"欢迎所有小朋友"；
  - 背景是明亮的蓝天渐变，整体让科学看起来令人兴奋、容易亲近，鼓励孩子参与。
  竖版 2:3。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-seedream-4.5
  url: https://github.com/YouMind-OpenLab/awesome-seedream-4.5#no-1-fun-educational-childrens-science-fair-poster
  author: "@jaredliu_bravo"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: 译成中文并拆成要点；活动名、机器人、标题、副标题、日期设为变量；按示例图补充了护目镜、冒泡烧杯、底部活动信息栏和蓝天背景
images:
  - 3310-kids-science-fair-poster-1.jpg
imageCredit:
  by: "@jaredliu_bravo"
  url: https://cms-assets.youmind.com/media/1765359646358_zspn1j_00dc35614217759a1ac037ff108b7f90289c94d0a1d5608a917db3eb67739092-600x900.png
  license: CC BY 4.0
verify:
  - 示例图是英文版，在即梦里测中文标题和底部活动信息是否清晰、无错字
  - 正式使用前时间、地点必须换成真实信息并人工校对
---
原作者用 Seedream 4.5 生成；即梦里选用 Seedream 系列图片模型使用。

**怎么填变量**：[儿童科学节] 可换成"少儿编程营""校园科技节""自然观察夏令营"，画面道具跟着改，编程营就写"孩子们围着笔记本电脑和积木机器人"；[小机器人] 可换"小火箭模型""恐龙化石"。[科学探险节] 和 [探索、发现、创造！] 是标题文案，控制在 6～8 个字最清晰；[10月15日 周六] 换成真实日期，地点建议写短一点。示例图是英文版：顶部白色粗体三行标题和一行副标题，中间四个戴护目镜的孩子——一个举望远镜、一个指着上方、两个捧着冒彩色泡泡的烧杯，右下角站着一个大眼睛的白色小机器人，底部三栏写着日期时间、地点和欢迎语。

**常见问题与调整**：
- 底部小字乱码：只保留日期和地点两项，其他信息后期加。
- 孩子表情僵硬：加"孩子们张嘴大笑，动作夸张有活力"。
- 想用学校配色：把蓝天背景改成学校主色，如"绿色渐变配白色星星"。
- 需要横版展板：画幅改 16:9，孩子放左侧，右侧放标题和活动信息。

**适合**：学校科技节、少儿科学营招募、图书馆科普活动海报；活动信息需人工核对后再发布。

### 英文原版

```
A fun and educational poster for a children’s science fair. The design is a colorful cartoon illustration featuring kids dressed as scientists, looking at bubbling beakers, telescopes, and robots. The typography is playful and kid-friendly. The poster should make science look exciting and accessible, encouraging kids to participate. –ar 2:3
```

> 改编自 [@jaredliu_bravo](https://github.com/YouMind-OpenLab/awesome-seedream-4.5#no-1-fun-educational-childrens-science-fair-poster) 发布、[YouMind-OpenLab/awesome-seedream-4.5](https://github.com/YouMind-OpenLab/awesome-seedream-4.5) 收录的提示词，仓库许可证 CC BY 4.0。
