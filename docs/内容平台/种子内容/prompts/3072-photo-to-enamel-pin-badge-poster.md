---
title: "照片变徽章提示词：上半实拍、下半珐琅金属徽章 / 冰箱贴的旅行海报（gpt-image-2）"
slug: photo-to-enamel-pin-badge-poster
model: gpt-image-2
topics: [ecommerce, figurine]
aspectRatio: "3:4"
needsRefImage: true
useCase: "上传宠物、旅行或生活照片，上半保留原图，下半把主体做成有金属勾线和珐琅色块的徽章 / 冰箱贴，配英文小标题，适合文创周边提案、宠物纪念品和社媒创意图。"
prompt: |
  请把我上传的每一张照片分别做成一张独立的高端旅行设计海报，每张照片一张海报。整体是[3:4 竖版]，上下等高，各占画面 50%。
  上半部分：保留原照片，主体结构、真实质感、自然光线和原有色彩氛围不变，做轻微的高级摄影调色，像旅行摄影或艺术明信片；背景可以自然延展以适配画幅，但主体不能变形。
  下半部分：提取照片中最有辨识度的主体、轮廓和姿态，重构为一枚精致的[镀金珐琅旅行冰箱贴 / 金属徽章]。用简洁的几何分区和珐琅色块提炼最令人难忘的轮廓和特征，让它和上方的主体一眼就能对应上。
  徽章要有真实的珐琅上色、金属分隔线和干净的白色金属外轮廓，厚度适中、带细微反光；表面光滑饱满，保留一点工艺质感，配柔和的立体阴影。
  颜色取自照片中最鲜明的色调，放在[奶白、浅灰或柔和马卡龙色]的背景上，留出大量空白。
  文字作为徽章设计的一部分：用从地点或主体提炼出的简短英文标题，沿边缘排布或放在金属框里。
  最终效果像真实摄影与实体徽章美学结合的高端旅行周边。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/xiaoxiaodong01/status/2090799598336168140
  author: "小小东"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "原文中文说明的英文写法改写为中文；构图比例、徽章样式、背景底色改为变量"
images:
  - 3072-photo-to-enamel-pin-badge-poster-1.jpg
  - 3072-photo-to-enamel-pin-badge-poster-2.jpg
imageCredit:
  by: "小小东"
  url: https://youmind.com/gpt-image-2-prompts?id=32238
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：上传主体清晰的照片：宠物、旅行地标、有特色的人物动作都可以（不要上传他人照片）。[镀金珐琅旅行冰箱贴 / 金属徽章] 也可以写"亚克力立牌""刺绣布章"；背景色写一种即可，如"奶白"。英文标题会自动生成，想指定就加一句"徽章文字写：XXX"。

示例图两张：一只戴耳机、背着杠铃的仓鼠照片，下半变成同姿态的珐琅徽章，底部弧形写着"STRENGTH IN EVERY STEP"；一只坐在透明椅子下的黑白猫，下半是带窗户背景的猫咪异形徽章，写着"CURIOUS TRAVELER"。

**常见问题**：
- 徽章和照片不像：写"保留主体的标志性颜色和姿态"。
- 文字拼错：英文标题控制在 3～4 个单词。
- 想直接打样：生成的是效果图，打样前需要设计师整理成矢量稿和色号。

**适合**：文创周边提案、宠物纪念品、旅行冰箱贴设计、社媒创意图。

### 原版提示词

```text
Please transform each photo I upload into a standalone high-end travel design poster, one poster per photo. The overall composition should be a {argument name="composition ratio" default="3:4 vertical layout"}, divided into two sections of equal height, each occupying 50% of the frame.

The top half retains the original photo, preserving the subject's structure, authentic texture, natural light, and original color mood, with subtle high-end photographic color grading for a travel photography or art postcard quality. Backgrounds can be naturally extended to fit the frame, but the subject must not be distorted.

The bottom half extracts the most recognizable subject, silhouette, and posture to reconstruct it as a sophisticated {argument name="ornament style" default="gilt enamel travel magnet / metal badge"}. Distill the most memorable contours and features using simple geometric partitions and enamel color blocks that remain clearly identifiable as the subject above.

The badge should feature realistic enamel coloring with metal divider lines and a crisp white metal outline, showing moderate thickness and subtle reflections. The surface should be smooth and full, retaining a slight texture and authentic craftsmanship feel with soft 3D shadows. Colors should be derived from the most vibrant tones in the photo, set against a {argument name="background base color" default="creamy white, light gray, or soft pastel"} background with ample negative space.

Typography should be integrated as part of the badge design, using short English titles derived from the location or subject, arranged along edges or within the metal framework. The final result should look like high-end travel merchandise with a blend of real photography and physical badge aesthetics.
```

> 改编自 [小小东](https://x.com/xiaoxiaodong01/status/2090799598336168140) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
