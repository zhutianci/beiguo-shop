---
title: 复古照片提示词：60 年代褪色胶片老照片质感（漏光、灰尘、暖调）
slug: vintage-1960s-film-photo
model: gpt-image-2
topics: [old-photo, photography]
aspectRatio: "4:5"
needsRefImage: false
useCase: 想要"翻出一张几十年前的老照片"的年代感时，生成 1950–60 年代彩色胶片风的街头人像：褪色暖调、漏光、灰尘斑点和老街场景，适合怀旧主题海报、短视频封面和年代故事配图。
prompt: |
  一张[1950–60 年代]的复古彩色胶片照片：一位[年轻女性]站在[日本传统小镇]狭窄的街道上。
  人物：[黑色短卷发]，正对镜头温柔地微笑，双手举到头上整理头发；穿[奶油色连帽卫衣]和[红蓝米色格纹裙]，斜挎一只棕色皮质小包。
  背景：[木结构老房子和瓦片屋顶]、电线杆、路边停着一辆旧自行车，远处有路人在干活。
  照片质感：明显的褪色和怀旧感，边缘有漏光、表面有灰尘斑点和细小划痕，偏暖的色调和柔和的颗粒，像在旧相册里放了几十年的胶片冲印照片。
  构图自然随意，像家人随手拍下的日常瞬间，竖构图。
  不要现代物品、不要文字、不要水印。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/Kmsbdd0GXBOcrXQ/status/2107373735057752349
  author: 拓斗（@Kmsbdd0GXBOcrXQ）
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: 英文原文译为中文；年代、人物、地点、发型、服装、背景改为变量；补充"像旧相册里的胶片冲印""不要现代物品、文字、水印"的约束；画幅明确为竖构图
images:
  - 513-vintage-1960s-film-photo-1.jpg
imageCredit:
  by: 拓斗（@Kmsbdd0GXBOcrXQ）
  url: https://youmind.com/gpt-image-2-prompts?id=36035
  license: CC BY 4.0
verify:
  - 换成"80 年代中国小城""70 年代上海弄堂"时，服装和街景的年代细节是否靠谱
  - 示例图人物为模型生成，确认不像任何真实公众人物
  - 确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）
---
**怎么填变量**：年代和地点决定整张图的味道：[1980 年代]+[中国南方小城]、[1970 年代]+[上海弄堂]、[1990 年代]+[北方工厂大院]。服装要配合年代写，例如 80 年代写"的确良衬衫、喇叭裤"，90 年代写"牛仔外套、高腰牛仔裤"，模型才不会混搭出现代感。

**用自己的照片**：上传本人照片，在开头加"使用上传照片中的人物，保持五官和脸型不变"，就能做一张"自己的年代照"。只用自己或已获同意的人的照片。

**常见问题**：
- 太干净不像老照片：把"漏光、灰尘斑点"写重一点，再加"轻微偏色、边角暗角"。
- 变成黑白：如果想要彩色，保留"彩色胶片""偏暖色调"两处描述。
- 和"老照片修复"相反：这条是把新画面"做旧"；要把真实老照片修清晰，请用老照片修复类提示词。

示例图为原作者生成，仅供参考。

### 英文原版

```text
A vintage-style photograph of a young woman standing on a narrow street in a traditional Japanese town, likely from the 1950s or 60s. She has short, curly dark brown hair and is smiling gently at the camera while holding both hands up to her head, adjusting her hair. She wears a cream-colored hooded sweatshirt with drawstrings and a plaid skirt featuring red, blue, and beige tones. A brown leather shoulder bag hangs across her body. The background includes wooden buildings with tiled roofs, utility poles, and an old bicycle parked nearby. The image has a faded, nostalgic quality with light leaks, dust spots, and warm color tones typical of aged film photography.
```

> 改编自 [拓斗](https://x.com/Kmsbdd0GXBOcrXQ/status/2107373735057752349) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
