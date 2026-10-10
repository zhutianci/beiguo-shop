---
title: "ai角色设定图提示词：绘本风动物角色设定表，转面+表情+动作+色卡（gpt-image-2）"
slug: storybook-animal-character-reference-sheet
model: gpt-image-2
topics: [character, illustration]
aspectRatio: "2:1"
needsRefImage: true
useCase: "已经有一张动物角色或吉祥物的图，想扩成完整的造型规范：上传参考图，生成保持原画风的横版设定表，含转面、表情、动作、配件、细节特写和色卡。"
prompt: |
  请以我上传的这张角色图为唯一依据，排一张给绘本和动画团队用的造型规范表。画风要跟原图对得上：写实程度、渲染方式、笔触质感、配色处理和整体气质都不能变。
  底色用[干净的暖米色纯色背景]。
  整张表是横版，各栏这样安排：
  - 左上角：角色名大标题"[小狐狸]"，下面一行性格关键词"[机灵 · 好奇 · 爱玩]"，再配两三行角色简介，以及"性格、喜欢、不喜欢"三个小条目；
  - 转面一排：同一角色的正面、四分之三侧、侧面、背面等全身站姿，姿势放松，各视图大小一致、头顶高度对齐，旁边标出头身比；
  - 表情一排：[8]个头部表情，如开心、眨眼、大笑、得意、疑惑、害羞、惊讶；
  - 动作一排：5 个全身小动作，如行走、奔跑、坐下、挥手、趴下；
  - 配件栏：把角色身上的标志性物件单独画出来，各配一行说明；
  - 细节栏：两三个圆形放大特写（耳朵、尾巴、毛发或衣物质感），各配一行说明；
  - 色卡栏：五六个色块，旁边写色号。
  每一栏里的角色都得是同一只：外形、头身比、配色和配件一样不差；栏与栏之间留匀称的空隙，用细虚线加小标题隔开，取景保持统一。
  打光也要统一，各栏的方向、强弱和柔和度相同，阴影淡而自然，别出现戏剧化的明暗对比。
  图上的字一律写[简体中文]，要认得清。最后的效果是一张拿去就能印的设定稿，细节锐利。画幅[2:1]。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/JohnBan36920009/status/2064376663412977808
  author: "@JohnBan36920009"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文；原文的版式变量默认是\"上排四个全身、下排三个头像\"，三张示例图实际用的是带标题、表情、动作、配件和色卡的绘本式版面，因此按示例图重写了版式段，并把背景、角色名、性格关键词、表情数量、文字语言、画幅设为变量；保留原文关于画风一致、比例对齐、光线统一的要求。"
images:
  - 3565-storybook-animal-character-reference-sheet-1.jpg
  - 3565-storybook-animal-character-reference-sheet-2.jpg
imageCredit:
  by: "@JohnBan36920009"
  url: https://youmind.com/gpt-image-2-prompts?id=24897
  license: CC BY 4.0
verify:
  - "原文默认版式（4 个全身 + 3 个头像）与示例图不同，本条版式按示例图改写，请确认可接受"
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：先上传一张角色参考图，单个角色、背景干净的效果最好。[干净的暖米色纯色背景] 可换成纯白或浅灰；[小狐狸] 是标题里的角色名；[机灵 · 好奇 · 爱玩] 是三个性格关键词；[8] 是表情数量，嫌挤可以改成 5；[简体中文] 决定图上文字的语言。版面里的各栏可以按需要删减，例如只留转面、表情和色卡。

示例图是英文版的绘本风设定表：米色底上一只围灰围巾的橘色小狐狸，左上是"THE FOX"标题和性格简介，右上八个表情，中间一排行走、奔跑、坐下的动作，下面六个角度的转面并标着三头身，另有围巾和挎包两件配件、耳朵尾巴的圆形特写和六色色卡。第二张是同一类版式的青蛙角色，右下角多了一小幅池塘场景。

**常见问题**：
- 画风跑成别的风格：把"画风必须和参考图完全一致"在结尾再写一遍。
- 小字说明乱码：把各栏说明压缩到一行、不超过 10 个字，或者只留小标题。
- 围巾、领结在转面里时有时无：加"配件在所有视图中都出现且位置相同"。

**适合**：绘本和儿童动画的动物角色定稿、吉祥物提案页、周边开发前的造型规范。

### 英文原版

```text
Create a professional character reference sheet based strictly on the uploaded reference image. Use a {argument name="background" default="clean, neutral plain background"} and present the sheet as a technical model turnaround while matching the exact visual style of the reference (same realism level, rendering approach, texture, color treatment, and overall aesthetic). Arrange the {argument name="layout" default="composition into two horizontal rows. Top row: four full-body standing views. Bottom row: three highly detailed close-up portraits"}. Maintain perfect identity consistency across every panel. Keep the subject in a relaxed A-pose and with consistent scale and alignment between views, accurate anatomy, and clear silhouette; ensure even spacing and clean panel separation, with uniform framing and consistent head height across the full-body lineup and consistent facial scale across the portraits. {argument name="lighting" default="Lighting should be consistent across all panels (same direction, intensity, and softness)"}, with natural, controlled shadows that preserve detail without dramatic mood shifts. Output a crisp, print-ready reference sheet look, sharp details.
```

> 改编自 [@JohnBan36920009](https://x.com/JohnBan36920009/status/2064376663412977808) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
