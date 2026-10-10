---
title: "漫画提示词：仓鼠太鼓祭典彩色漫画大场面，拟声词满屏（gpt-image-2）"
slug: hamster-taiko-festival-manga
model: gpt-image-2
topics: [comic, illustration]
aspectRatio: "1:1"
needsRefImage: false
useCase: "做活动预热、节日祝福或社群气氛图时用：一群穿法被的仓鼠在夜晚庙会上敲太鼓，金色放射线背景、满天纸屑、五个大号拟声字和一个竖排旁白框，热闹的彩色漫画大场面。"
prompt: |
  画一幅色彩浓烈的方形漫画风祭典插画：夜晚的庙会上，一群[可爱的仓鼠]在敲日式太鼓。
  构图饱满、充满动感，前景三只大鼓手是焦点：中间那只最大，穿[红色法被]、扎蓝白相间的拧绳头巾，张嘴大笑，把鼓槌高高举过头顶，面前是一面棕色大太鼓；左边那只穿蓝色法被，眨着一只眼，敲着同款太鼓；右边那只穿深藏青法被，闭眼笑着，敲另一面同款太鼓。前景恰好能看到 5 面太鼓：正面 3 面完整的大鼓，最左和最右边缘各 1 面被裁切的鼓。
  背景：密密麻麻欢呼的小鼓手，头扎祭典头巾、身穿红蓝法被、手举鼓槌；两侧有成串的灯笼和写着"祭"字的旗帜。
  氛围效果：金色的放射状爆发背景，黑色速度线向上汇聚，飘落的彩色纸屑和小星星，暖橙色的祭典灯光。
  拟声词：画面上半部分排布恰好 5 个大号漫画拟声字"[咚]"，红到黑的渐变字，带粗白描边，大小和角度错落。
  旁白框：右上角一个黑边白底的长方形旁白框，里面竖排写着"[那场宴会持续了三天三夜]"。
  风格：高完成度的可爱动漫插画，水亮的眼睛、粉红脸颊、粗墨线勾边、夸张的喜悦表情，鼓绳和木纹画得细致，漫画式的动感，色彩饱和；不要照片写实感，不要水印。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/hmst_yyyy/status/2087048367386001801
  author: "@hmst_yyyy"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文并按构图、背景、效果、文字分段；主角动物、主角服装颜色、拟声字、旁白文字改为变量；日文拟声词\"ドン\"换成中文\"咚\"，日文旁白换成中文；旗帜上的\"祭\"字中日文写法相同，保留。"
images:
  - 3479-hamster-taiko-festival-manga-1.jpg
imageCredit:
  by: "@hmst_yyyy"
  url: https://youmind.com/gpt-image-2-prompts?id=31137
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：[可爱的仓鼠] 可以换成"柴犬""小熊猫""企鹅"；[红色法被] 是中间主角的衣服；拟声字默认 [咚]，也可以保留日文原版的"ドン"；旁白框里换成自己的一句话，10 个字左右，如"那年的年会一直开到天亮"。想改成别的热闹场面，把太鼓换成"舞狮""龙舟鼓"，其余结构不变。

示例图是原作者的日文版：金黄色放射线背景前，三只戴拧绳头巾的仓鼠分别穿蓝、红、深蓝法被，敲着带巴纹的棕色太鼓，中间那只高举鼓槌大笑；身后挤满了举着鼓槌的小仓鼠，两侧是红灯笼和写着"祭"的旗子，彩色纸屑满天飞；上方是五个红黑渐变的大字"ドン"，右上角旁白框里竖排写着一句日文。

**常见问题**：
- 拟声字数量不对或变形：改成"3 个"，并写明"每个字完整、不被裁切"。
- 后排角色糊成一团：加"后排角色简化，但轮廓清楚"。
- 画面太满、看不清主角：写"中间主角占画面高度的一半"。

**适合**：活动预热海报、节日祝福图、社群里的气氛图、漫画彩页练习。

### 英文原版

```text
Create a vibrant square manga-style festival illustration of {argument name="animal performers" default="cute hamsters"} performing Japanese taiko drums at night during a matsuri. The composition is packed and energetic, with three large foreground hamster drummers as the focus: the center hamster is largest, wearing a red happi coat and blue-and-white twisted headband, smiling with mouth open and holding two drumsticks high over a large brown taiko; the left hamster wears a blue happi coat, winks, and plays a matching taiko; the right hamster wears a dark navy happi coat, smiles with eyes closed, and plays another matching taiko. Include exactly five visible foreground taiko drums: three main full drums across the front and two partial cropped drums at the far left and far right edges. Behind them, show a dense cheering crowd of smaller hamster drummers in festival headbands and red/blue coats, holding drumsticks, with lantern strings and festival banners reading 「祭」 on both sides. Use a dramatic golden radial burst background with black speed lines converging upward, falling multicolored confetti, small star shapes, and warm orange festival lighting. Add large bold manga sound effects in Japanese, exactly five visible instances of 「ドン」 in red-to-black gradient letters with thick white outlines, arranged across the upper half. In the top-right corner, place a white rectangular narration box with black border containing vertical Japanese text: {argument name="narration box text" default="その宴は三日三晩続いた"}. Style should be highly polished cute-anime illustration, glossy eyes, rosy cheeks, thick ink outlines, exaggerated joy, detailed drum ropes and wood texture, dynamic comic-book motion, saturated colors, no photorealism, no watermark.
```

> 改编自 [@hmst_yyyy](https://x.com/hmst_yyyy/status/2087048367386001801) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
