---
title: "漫画提示词：复古科幻漫画封面，沙漠射电望远镜与倒悬之城（gpt-image-2）"
slug: retro-manga-desert-radio-telescopes
model: gpt-image-2
topics: [comic, illustration, wallpaper]
aspectRatio: "9:16"
needsRefImage: false
useCase: "做漫画或小说封面、世界观概念图、竖屏壁纸时用：两个少女开着橙色小车穿过布满卫星天线的橙色沙漠，天上倒挂一座白色城市，细墨线配褪色印刷感的桃橙与青蓝。"
prompt: |
  画一幅竖版的复古漫画风科幻插画：纤细的手绘墨线，配低饱和的丝网印刷感色彩。
  主体：[两个]动漫少女坐在一辆方头方脑的橙色敞篷小工具车里，行驶在尘土飞扬的橙色沙漠中。左边开车的女孩是深蓝黑色长发，侧编一条麻花辫，眼神认真，穿浅色工作袍，胸口一块小布牌写着"[5]"；右边的乘客是凌乱的白金色短发，低低扎起，望向右侧，穿同款浅色袍子，胸牌写着"[4.8]"，怀里抱着一只垂耳的米色毛绒兔子。
  小车：两个圆形车灯，红色前格栅，红色轮毂，简单的棱角车身，车后在蜿蜒的浅色土路上卷起一道尘土。
  场景：一片外星般的射电望远镜沙漠，画面里大约有 14 个卫星天线：左侧前景 1 个爬满藤蔓的巨大天线占据主导，最左边缘 1 个被裁切的天线，中景 1 个中等大小的直立天线和它身后 1 个小的，地平线上右侧几个极小的，右后方 1 个大的直立天线，另有 5 个破损或倾倒的天线残片散落在前景和中景。
  天空：青绿色的天空上方，一座白色的未来城市倒挂在画面顶边，密集的方正高楼和天线般的尖塔朝下垂着；天上有恰好 2 个奶油色的圆，像太阳或月亮。
  色彩与质感：暖桃橙色的地面、青蓝色的天空、奶油色高光、细细的蓝灰色墨线、轻微的纸张颗粒，零星的石块和灌木，梦幻而安静，构图像[上世纪八九十年代的日本科幻漫画封面]。
  限制：除两块胸牌上的数字外不出现其他文字；不要水印，不要照片写实感。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/hmst_yyyy/status/2088800985355542637
  author: "@hmst_yyyy"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文并按主体、小车、场景、天空、色彩分段；人物数量、两块胸牌文字、风格参照改为变量；地平线上小天线的逐个计数合并为概括描述。"
images:
  - 3478-retro-manga-desert-radio-telescopes-1.jpg
imageCredit:
  by: "@hmst_yyyy"
  url: https://youmind.com/gpt-image-2-prompts?id=31633
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：[两个] 是人物数量，改成"一个"时要删掉其中一位的描述；胸牌上的 [5] 和 [4.8] 可以换成任意编号，或者连同胸牌一起删掉；最后的风格参照可换成"上世纪七十年代的欧洲科幻漫画"之类的时代描述。想换交通工具或场景，改"橙色敞篷小工具车"和"射电望远镜沙漠"两处即可，例如"小木船"配"被水淹没的图书馆"。

示例图是一张竖幅插画：橙色沙漠里一辆方正的橙黄色小车，开车的是深色麻花辫女孩，胸牌写着 5；旁边白金色短发的女孩抱着垂耳兔玩偶，胸牌写着 4.8；身后是爬满藤蔓的巨大卫星天线和一排向远处延伸的天线，土路蜿蜒；青绿色的天空上倒挂着一座白色城市，还有两个奶油色的圆。线条纤细，颜色像旧印刷品。

**常见问题**：
- 天线数量对不上：不必强求，删掉逐个计数的句子，只写"远近十几个"。
- 倒悬城市没出现：把它挪到提示词前面，并写"占据画面顶部四分之一"。
- 颜色太鲜艳：加"低饱和、褪色印刷感"。

**适合**：漫画或小说封面、世界观概念图、手机竖屏壁纸。

### 英文原版

```text
Create a vertical retro manga-style science-fiction illustration in a delicate hand-inked line art look with muted screen-print colors. Show {argument name="character count" default="two"} young anime girls riding in a small boxy open-top orange utility car through a dusty orange desert. The girl driving on the left has long dark navy-black hair in a side braid, serious eyes, and a pale work-robe outfit with a small chest patch reading “5”; the passenger on the right has short messy white-blond hair tied low, looks off to the right, wears a matching pale robe with a patch reading “4.8,” and holds one plush beige rabbit with floppy ears. The car has two round headlights, a red front grille, red wheel rims, simple angular panels, and a curling dust trail behind it on a winding pale road. The landscape is an alien radio-telescope desert: include exactly 14 visible satellite dish elements total, counted as 1 huge vine-covered dish dominating the left foreground, 1 partial dish cut off at the far left edge, 1 medium upright dish in the middle distance, 1 small dish just behind it, 3 tiny horizon dishes to the right of center, 1 large upright dish at the right background, 1 tiny far-right horizon dish, and 5 damaged or tilted dish fragments scattered in the foreground and midground. Above the turquoise sky, place an inverted white futuristic city skyline hanging upside down from the top edge, with dense rectilinear towers and antenna-like spires. Add exactly 2 pale cream suns/moons in the sky. Use a warm peach-orange ground, teal-blue sky, cream highlights, fine blue-gray ink outlines, subtle paper grain, sparse rocks and scrub plants, a dreamy quiet atmosphere, and a composition reminiscent of a 1980s/1990s Japanese sci-fi manga cover. No extra text besides the two chest labels “5” and “4.8,” no watermark, no photorealism.
```

> 改编自 [@hmst_yyyy](https://x.com/hmst_yyyy/status/2088800985355542637) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
