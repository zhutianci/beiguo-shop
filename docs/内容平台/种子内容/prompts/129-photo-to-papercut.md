---
title: 照片转剪纸风提示词：旅行照变成立体纸艺插画（gpt-image-2）
slug: photo-to-papercut
model: gpt-image-2
topics: [illustration, photo-edit]
aspectRatio: "3:4"
needsRefImage: true
useCase: 上传一张旅行照或生活照，保持构图不变，转成层层叠叠的立体剪纸插画，适合旅行合集封面、手账素材。
prompt: |
  先上传一张参考图。
  把上传的图片转换成柔和的手工立体剪纸插画，同时保留原图的构图、主体位置、姿势、比例、透视和可辨认的特征。
  画幅：竖版 3:4，保留原图的取景、机位、裁切和视觉层级。
  风格：柔和的纸艺立体模型风，圆润光滑的造型，简化可爱的比例，极少的五官细节，豆豆眼，淡淡的腮红，温暖的绘本角色感。整个场景用一层层叠起来的纸片重建，有明显的立体层次、层与层之间有细微阴影，切口干净，像精心制作的卡纸作品。
  人物：主要人物保持可辨认，同时简化成可爱的剪纸小人。每个主要人物外面加一圈明显的厚白纸边，像贴纸一样把人物和背景分开；白边必须看起来是一层真实的卡纸，不是发光或光效。
  纸张材质：哑光、有触感，像厚美术纸或手工泡沫纸；能看到细微纸纹、层叠的边缘、轻微厚度、干净切口、小小的手工瑕疵和层与层之间真实的接触阴影。
  配色：柔和的粉彩，[低饱和的蓝、温柔的绿、暖中性色、奶油色]，加少量和谐的互补色点缀；平衡、安静、温馨。
  光线：柔和漫射的均匀光，轻柔的环境光，细微的层间阴影，不要强烈反差，强化纸层的立体感，同时保持手作氛围。
  构图：保留原图的场景结构和视觉层级，人物、物体和重要环境元素都留在原位，全部转成同一种剪纸视觉语言；前景、中景、背景层次分明。
  输出风格：温馨的手作纸艺立体模型，现代儿童绘本插画，装饰性剪纸艺术，温暖、有爱、俏皮、精致、有触感、高级。
  避免：照片写实、CG、光滑表面、塑料感、霓虹色、强光、细节过多、写实的人脸、漂浮的人物、发光的白边、扁平数字插画、毛糙边缘、阴影过重、身体变形、改变构图、文字、Logo、水印、低质量。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/visualaiclub/status/2100638045103853684
  author: Visual AI Club
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: 英文原文译为中文；主色调改为变量；其余结构完整保留
images:
  - 129-photo-to-papercut-1.jpg
imageCredit:
  by: Visual AI Club
  url: https://youmind.com/gpt-image-2-prompts?id=34932
  license: CC BY 4.0
verify:
  - 在 gpt-image-2 上实测 3 次，记录成功率与最常见的失败形式
  - 构图与原照片是否一致
  - 原图中的地标或招牌文字是否被保留成可读文字（含他人商标时需注意）
  - 确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）
---
**怎么用**：上传一张主体清楚、背景不太杂乱的照片（旅行打卡照、合照、宠物照都行）。[低饱和的蓝、温柔的绿……] 是整体色调，可改成"秋天的橙黄与棕"或"冬天的蓝白"。

**常见问题**：
- 人物外面的白边变成了发光：保留"白边是一层真实的卡纸，不是光效"。
- 背景太复杂、剪成一团：先裁掉照片里不重要的部分再上传。
- 原图里有商场、乐园的大型品牌标志：转换后标志可能依然清晰可读，用于公开发布时请注意他人商标。

**迭代**：同一张照片换"毛毡风""黏土风"的描述再出一版，就是一组"同一场景不同材质"的对比图。

### 英文原版

```text
Upload one reference image before generating.

MAIN PROMPT
Transform the uploaded image into a soft handcrafted paper-cut layered illustration while preserving the original composition, subject placement, pose, proportions, perspective, and recognizable features.

FORMAT LOCK
Vertical 3:4 composition. Preserve the original framing, camera angle, crop, and overall visual hierarchy.

STYLE
Soft papercraft diorama aesthetic with smooth rounded shapes, simplified cute proportions, minimal facial details, dot eyes, soft blush cheeks, and a warm storybook character design. Recreate the entire scene using stacked paper layers with visible dimensional depth, subtle shadows between layers, and clean cut edges resembling carefully crafted cardstock.

CHARACTER DESIGN
Keep the main characters recognizable while simplifying their forms into charming paper-cut figures. Add a distinct thick white outer paper layer around each main character, creating a clean sticker-like cut-paper border that physically separates them from the background. The white border must look like an intentional cardstock layer, not a glow or lighting effect.

PAPER MATERIAL
Use matte tactile materials resembling thick art paper or craft foam. Show subtle paper grain, layered edges, slight thickness, clean cuts, tiny handmade imperfections, and realistic contact shadows between overlapping layers.

COLOR PALETTE
Soft pastel colors with muted blues, gentle greens, warm neutrals, cream, and subtle complementary accents. Keep the palette balanced, calming, cozy, and harmonious.

LIGHTING
Soft diffused even lighting. Gentle ambient illumination. Subtle layer shadows. No harsh contrast. Enhance the physical depth of the paper layers while maintaining a soft handcrafted atmosphere.

COMPOSITION
Preserve the original scene structure and visual hierarchy. Keep characters, objects, and important environmental elements in their original positions while translating everything into the same paper-cut visual language. Maintain clear separation between foreground, midground, and background.

OUTPUT STYLE
Cozy handcrafted papercraft diorama. Modern children’s-book illustration. Decorative paper-cut artwork. Warm storybook aesthetic. Wholesome, gentle, playful, polished, tactile, and premium.

NEGATIVE PROMPT
Avoid photorealism, CGI, glossy surfaces, plastic appearance, neon colors, harsh lighting, excessive detail, realistic facial rendering, floating characters, glowing white outlines, flat digital illustration, messy edges, excessive shadows, distorted anatomy, changed composition, text, logos, watermarks, or low-quality rendering.
```

> 改编自 [Visual AI Club](https://x.com/visualaiclub/status/2100638045103853684) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
