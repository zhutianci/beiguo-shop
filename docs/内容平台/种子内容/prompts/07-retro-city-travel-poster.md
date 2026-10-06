---
title: AI海报提示词：复古三色城市旅行海报（gpt-image-2）
slug: retro-city-travel-poster
model: gpt-image-2
topics: [poster]
aspectRatio: "2:3"
needsRefImage: false
useCase: 为一座城市或景点做一张复古丝网印刷风的旅行海报，可用于文旅号封面、明信片、装饰画。
prompt: |
  设计一张竖版的复古中世纪现代风旅行海报，主题是[城市名]，画面展示[地标建筑]。
  严格只用三种颜色：奶油色纸张底色、黑色精细线稿，再加一种[强调色]点缀。
  画风：极简的等距俯瞰视角，非常细的交叉排线，带丝网印刷的颗粒感。
  用色规则：整片天空平涂为[强调色]；屋顶或街道细节点缀少量[强调色]；全图不允许出现渐变。
  文字：海报顶部用大号粗体无衬线字写"[城市英文名]"（奶油色），下方用较小字号写"[城市中文名]"。
negativePrompt: null
source:
  repo: EvoLinkAI/awesome-gpt-image-2-API-and-Prompts
  url: https://x.com/iamaiistudio/status/2054593748085215513
  author: "@iamaiistudio"
  license: CC0 1.0
  licenseUrl: https://creativecommons.org/publicdomain/zero/1.0/
  changes: 英文原文译为中文；原文"本地语言城市名"改为显式的中文名变量；删去原文末尾的话题标签
imageBrief: 生成 2 张：杭州 + 雷峰塔 + 强调色"砖红色"一张，成都 + 九眼桥（或其他轮廓鲜明的地标）+ 强调色"墨绿色"一张。
images:
  - 07-retro-city-travel-poster-1.jpg
imageCredit:
  by: "@iamaiistudio"
  url: https://x.com/iamaiistudio/status/2054593748085215513
  license: CC0 1.0
verify:
  - 在 gpt-image-2 上实测 3 次，记录是否真的只用了三种颜色、中文城市名是否写对
  - 地标结构是否与真实建筑明显不符（不符则在正文提醒换地标）
  - 确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）
---
**怎么填变量**：[地标建筑] 选轮廓鲜明、俯瞰时好认的，例如塔、桥、城门；[强调色] 一般选城市代表色，写成"砖红色""湖蓝色"这样具体的颜色。

**常见失败与调整**：
- 颜色超过三种或出现渐变：在结尾再加一句"再次确认：只有三种颜色，没有渐变和阴影"。
- 地标画得不像：AI 对冷门建筑掌握有限，可以上传一张自己拍的地标照片作参考，并写明"建筑结构参考上传图"。
- 中文名字形不对：标题字越大越清楚，城市中文名尽量控制在 4 个字以内。

**适合 / 不适合**：适合城市、景点、校园主题海报；不适合需要准确地理信息的地图类用途。

> 改编自 [@iamaiistudio](https://x.com/iamaiistudio/status/2054593748085215513) 发布、[EvoLinkAI/awesome-gpt-image-2-API-and-Prompts](https://github.com/EvoLinkAI/awesome-gpt-image-2-API-and-Prompts) 收录的提示词，仓库许可证 CC0 1.0。
