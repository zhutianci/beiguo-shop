---
title: CCD 相机风提示词：复古数码相机屏幕里的抓拍照片（gpt-image-2）
slug: ccd-camera-screen-photo
model: gpt-image-2
topics: [photography, portrait]
needsRefImage: false
useCase: 生成"用老卡片机拍、在相机屏幕上回看"的怀旧画面，适合 Y2K / CCD 风格的社交平台配图。
prompt: |
  一张真实的特写照片：昏暗的室内，一台小型数码卡片机的 LCD 屏幕正在发光。
  屏幕上显示着一张 2010 年代初风格的抓拍：[一位黑色长卷发的年轻亚洲女性]站在[塞满彩色漫画和杂志的木书架]旁。
  她穿着[黑色细吊带上衣]，外搭[宽松的白色开衫]，下身是[浅蓝色旧牛仔裤]，正在大笑，脸微微侧向一边，几缕头发落在脸颊上，表情自然、不摆拍。
  卡片机的直闪在她脸上和衣服上打出强烈高光，背景被压平，有怀旧的 CCD 数码感；带轻微运动模糊和数码噪点。
  屏幕上叠加相机界面：时间戳"[2012. 8. 1  3:15 AM]"、曝光参数"1/30 F3.4 ISO 100"、对焦框、角落里一个绿色电池图标。
  能看到屏幕的像素颗粒、轻微反光和压缩感；屏幕之外的环境渐暗、虚化，突出发光的屏幕。
  整体像 2010 年代初 CCD 卡片机拍出来的样子。
negativePrompt: null
source:
  repo: EvoLinkAI/awesome-gpt-image-2-API-and-Prompts
  url: https://x.com/Ciri_ai/status/2055876982630686956
  author: "@Ciri_ai"
  license: CC0 1.0
  licenseUrl: https://creativecommons.org/publicdomain/zero/1.0/
  changes: 英文原文译为中文；人物、场景、服装和时间戳改为变量；去掉原文中的具体相机品牌型号
images:
  - 104-ccd-camera-screen-photo-1.jpg
imageCredit:
  by: "@Ciri_ai"
  url: https://x.com/Ciri_ai/status/2055876982630686956
  license: CC0 1.0
verify:
  - 在 gpt-image-2 上实测 3 次，记录成功率与最常见的失败形式
  - 屏幕上的时间戳和参数文字是否清晰无乱码
  - 确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）
---
**怎么填变量**：人物、场景、服装三处按你想要的回忆画面改，例如"在 KTV 包厢里举着话筒的男生"。时间戳写成你想纪念的日期，格式保持"年. 月. 日 时间"，屏幕文字更容易渲染正确。想让人物像自己，可以上传一张照片并在开头加"屏幕里的人物以我上传的照片为参考"。

**常见问题**：
- 整张图都变成了屏幕里的照片：强调"画面主体是相机本身，照片只出现在屏幕里"。
- 屏幕文字糊成一团：减少界面元素，只保留时间戳和电池图标。
- 太干净不像老相机：加"屏幕边缘有指纹和细小划痕"。

**适合**：怀旧合集、毕业季、"十年前的我"类主题。

### 英文原版

```text
A realistic close-up shot of a small digital camera screen glowing brightly in a dark indoor environment. Displayed on the LCD is a candid early-2010s style photograph of a young East Asian woman with long dark wavy hair standing beside a wooden shelf packed tightly with colorful comic books and magazines.

She wears a black spaghetti-strap top with a loose white cardigan hanging casually from both shoulders and faded blue jeans. Captured mid-laugh while turning her face slightly sideways, her expression feels spontaneous and natural, with hair falling softly across part of her cheek.

The harsh direct flash from the compact camera creates strong highlights on her face and cardigan while flattening shadows in the background, producing an authentic nostalgic digicam aesthetic. Slight motion blur and digital grain enhance the candid realism.

Camera UI overlays are visible across the LCD screen, including the timestamp “8. 1. 2012 3:15 AM,” exposure data “1/30 F3.4 ISO 100,” focus indicators, and a small green battery symbol in the corner.

The image preserves visible screen pixel structure, slight glare reflections, chromatic softness, and compressed digital texture. Outside the LCD, the surrounding darkness fades smoothly into blur, emphasizing the glowing nostalgic screen.

Shot to resemble an authentic Sony Cyber-shot point-and-shoot camera from the early 2010s using a CCD sensor with vintage digital rendering and imperfect flash exposure.
```

> 改编自 [@Ciri_ai](https://x.com/Ciri_ai/status/2055876982630686956) 发布、[EvoLinkAI/awesome-gpt-image-2-API-and-Prompts](https://github.com/EvoLinkAI/awesome-gpt-image-2-API-and-Prompts) 收录的提示词，仓库许可证 CC0 1.0；示例图同样来自该仓库收录的原帖出图。
