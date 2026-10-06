---
title: seedance 提示词：双重曝光剪影视频（情侣剪影里的海边日落）
slug: seedance-double-exposure-silhouette
model: seedance
topics: [motion-graphics, cinematic]
modelLabel: Seedance 2.0
aspectRatio: "16:9"
needsRefImage: false
useCase: 生成 10 秒"人物剪影里装着一片会动的风景"的双重曝光视频，适合婚礼开场、纪念日视频、MV 片段和品牌情感广告的转场画面。
prompt: |
  电影感的[10]秒单镜头：一对情侣面对面的双重曝光剪影，两个剪影内部填充着一片会动的[海边日落]。
  太阳缓缓沉向海平面，金色的光在半透明的剪影里闪烁流动。
  温柔的海浪以柔和的慢动作涌上沙滩，温暖的倒影在水面上跳动。
  一群海鸥优雅地掠过粉蓝色的天空，飞向远方。
  沙滩上的[枫叶]在微风中轻轻颤动，其中一片被吹起，在空中打旋。
  最后几秒，两个剪影微微向彼此靠近，额头几乎相触。
  镜头缓慢梦幻地推近，柔和的粉彩色调（[蜜桃色、薰衣草紫、金色、海蓝色]），温暖的轮廓光，空灵浪漫的氛围，动作平滑轻柔，没有剪切，没有文字。
negativePrompt: 脸部扭曲，变形伪影，剪影边缘闪烁，文字，水印，快速运动，场景切换，多余的人
source:
  repo: YouMind-OpenLab/awesome-seedance-2-prompts
  url: https://x.com/churvikv/status/2102729372834639960
  author: "@churvikv"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: 英文原文译为中文并按画面元素分行；时长、填充风景、点缀物、配色改为变量；负面描述放入 negativePrompt
images:
  - 211-seedance-double-exposure-silhouette-1.jpg
imageCredit:
  by: "@churvikv"
  url: https://x.com/churvikv/status/2102729372834639960
  license: CC BY 4.0
verify:
  - 实测剪影边缘是否闪烁、剪影内的风景是否"溢出"到背景
  - 确认原帖仍可访问、作者未另行声明保留权利
---
**时长与镜头**：整条只有一个缓慢推近的镜头，没有剪切，10 秒刚好；5 秒版本删掉海鸥和枫叶两句即可。双重曝光的关键是"剪影外面干净、剪影里面在动"，所以动态元素都写在剪影内部。

**怎么填变量**：[海边日落] 可换"[樱花飘落的街道]""[极光下的雪原]""[城市夜景车流]"；做婚礼视频时，把最后一句改成"两个剪影慢慢牵起手"；做单人版，把"一对情侣"改成"一个女孩的侧脸剪影"。

**常见失败与调整**：
- 剪影变成了真实人脸：在开头加"剪影内部看不到五官，只看到风景"。
- 剪影边缘抖动、闪烁：保留负面词，并把运镜改为"固定机位"。
- 画面太灰：双重曝光容易发灰，加"高对比、剪影轮廓清晰"，配色只留 2–3 种。

> 改编自 [@churvikv](https://x.com/churvikv/status/2102729372834639960) 发布、[YouMind-OpenLab/awesome-seedance-2-prompts](https://github.com/YouMind-OpenLab/awesome-seedance-2-prompts) 收录的提示词，许可证 CC BY 4.0。

### 英文原版

```
Cinematic 10-second shot, double-exposure silhouette of a couple facing each other, their silhouettes filled with a living sunset seascape. The sun slowly descends toward the horizon, its golden light shimmering and flickering inside the translucent silhouettes. Gentle ocean waves roll onto the sandy beach in soft, slow motion, warm reflections dancing on the water. A flock of seagulls glides gracefully across the pastel pink-and-blue sky, flying away into the distance. Autumn maple leaves on the sand tremble and drift slightly in a light breeze, one leaf lifts and swirls into the air. In the final seconds the two silhouettes lean subtly toward each other, almost touching foreheads. Slow dreamy camera push-in, soft pastel color palette (peach, lavender, gold, sea-blue), warm rim light, ethereal romantic atmosphere, smooth gentle motion, no cuts, no text.

no face distortion, no morphing artifacts, no flickering silhouette edges, no text, no watermark, no fast motion, no scene change, no extra people
```
