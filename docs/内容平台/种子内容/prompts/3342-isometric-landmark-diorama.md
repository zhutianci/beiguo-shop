---
title: 建筑效果图提示词：45 度等距微缩地标模型（底座街景 + 小人 + 国家名标题，可换任意地标）
slug: isometric-landmark-diorama
model: gpt-image-2
topics: [illustration, poster]
needsRefImage: false
aspectRatio: "16:9"
useCase: 做旅行攻略封面、文旅宣传、地理课件或"世界地标"系列海报时用，填一个国家和地标，就能得到纯色背景上的等距微缩沙盘模型，上方自带国家名和地标名标题。
prompt: |
  生成一张[国家名]标志性地标[地标名称]的等距微缩 3D 沙盘模型，45 度俯视角。
  - 材质干净柔和，使用写实的 PBR 材质，光线自然均衡；
  - 抬高的底座上有周边街道、景观元素和这座建筑特有的文化细节；
  - 加入当地居民和游客的小人，造型风格化但五官细节清楚；
  - 背景是纯色的[背景色]；
  - 画面上方居中用粗体字写"[国家名]"，下一行写"[地标名称]"，再下面放一个极简的建筑小图标；
  - 文字颜色根据背景自动调整，保证对比清晰；
  - 横版画幅[16:9]。
negativePrompt: null
source:
  repo: EvoLinkAI/awesome-gpt-image-2-API-and-Prompts
  url: https://x.com/iamaiistudio/status/2065737739589615987
  author: "@iamaiistudio"
  license: CC0 1.0
  licenseUrl: https://creativecommons.org/publicdomain/zero/1.0/
  changes: 译成中文并拆成要点；保留原文的国家、地标、背景色变量并改为中文，合并重复的地标名变量；补充画幅
images:
  - 3342-isometric-landmark-diorama-1.jpg
imageCredit:
  by: "@iamaiistudio"
  url: https://github.com/EvoLinkAI/awesome-gpt-image-2-API-and-Prompts/blob/main/images/poster_case402/output.jpg
  license: CC0 1.0
verify:
  - 换成国内地标（如"中国 / 天坛""中国 / 黄鹤楼"）出一次，看建筑还原度和中文标题是否正确
  - 检查小人数量过多时是否出现畸形
  - 确认原帖仍可访问、作者未另行声明保留权利
---
**怎么填变量**：[国家名] 和 [地标名称] 是一对，例如"中国 / 天坛""日本 / 清水寺""法国 / 埃菲尔铁塔""埃及 / 金字塔"；[背景色] 建议选和建筑色调相近的浅色，比如石质建筑配"沙黄色"，红墙古建配"米白色"。示例图是沙黄色背景上的罗马斗兽场微缩模型：八边形底座上是残缺的环形竞技场，周围有石板路、柏树、小神庙和许多游客小人，上方是英文"ITALY"大字、"Colosseum"小字和一个拱门图标。

**常见问题与调整**：
- 建筑长得不对：加一句地标的关键特征，比如"三层圆形攒尖顶、蓝色琉璃瓦、汉白玉台基"。
- 中文标题错字：标题改短，或先出英文版再后期换字。
- 想做系列图：固定"同样的底座形状、同样的光线和字体"，只换国家和地标，保证系列统一。
- 想做竖版：画幅改 3:4，标题放在模型上方，底座更紧凑。

**适合**：旅行 / 文旅宣传图、地理或历史课件、"世界地标"系列海报和壁纸；不适合需要精确建筑比例的专业用途。

### 英文原版

```
Generate an isometric miniature 3D diorama of [COUNTRY NAME]'s iconic [FAMOUS STRUCTURE] landmark from a 45-degree top-down perspective.

Use clean soft textures and realistic PBR materials with balanced, natural lighting. The elevated base features surrounding streets, landscape elements, and cultural details unique to the structure. Include tiny stylized figures of locals and tourists with detailed facial features.

Set the background to solid [BACKGROUND COLOR]. Display [COUNTRY NAME] in bold text at the top center with [STRUCTURE NAME] on the next line, followed by a minimal architecture icon below. Adjust text color to ensure contrast.
```

> 改编自 [@iamaiistudio](https://x.com/iamaiistudio/status/2065737739589615987) 发布、[EvoLinkAI/awesome-gpt-image-2-API-and-Prompts](https://github.com/EvoLinkAI/awesome-gpt-image-2-API-and-Prompts) 收录的提示词，仓库许可证 CC0 1.0。
