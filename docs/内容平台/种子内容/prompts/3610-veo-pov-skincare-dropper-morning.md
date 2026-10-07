---
title: veo 3 提示词：第一视角护肤视频（POV 拧开滴管 · 晨光棱镜 · 竖屏 6 秒）
slug: veo-pov-skincare-dropper-morning
model: veo
topics: [product-video]
modelLabel: Veo 3.1
aspectRatio: "9:16"
needsRefImage: false
useCase: 社交平台流行的"POV 第一视角"格式：观众像是自己举着手机在晨光浴室里护肤，拧开滴管、看液滴落下、点在脸颊上，适合精华、精油、眼药水外观类产品的沉浸式短视频。
prompt: |
  竖屏第一人称 POV，手机举在一臂远，阳光洒满的浴室，画面轻微手持晃动，约 6 秒。
  0–2 秒：双手从画面底部伸进来，拧开一支[磨砂玻璃滴管瓶]；水波纹般的光斑在白色地铁砖上滑动，一颗水珠沿着镜子滚落。
  2–4 秒：梦幻的半速慢动作——一颗[琥珀色]液滴在滴管尖端鼓起、脱落、坠下，把晨光折射成一道小小的彩虹。
  4–6 秒：同一双手把它按在颧骨上，一层水润光泽向四周晕开；镜头向上一抬，扫到起雾镜子里一个放松的浅笑。
  画面：玻璃和皮肤的近距离微距，约 5200K 的温暖窗光，浅景深。
  声音：滴管"咔哒"一声的轻微 ASMR，和一声安静的呼气。
  瓶子在整段视频里形状、标签位置和磨砂质感保持一致：不变形、不漂移、不融化、文字不重复。
negativePrompt: 瓶子变形，手指畸形，多余的手，镜中人脸变形，乱码标签，水印
source:
  repo: LichAmnesia/awesome-ad-video-prompts
  url: https://github.com/LichAmnesia/awesome-ad-video-prompts#pov-morning-skincare-drop
  author: "awesome-ad-video-prompts contributors"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文；产品外观、液体颜色改为变量；负面提示词写成名词短语"
images:
  - 3610-veo-pov-skincare-dropper-morning-1.jpg
imageCredit:
  by: "LichAmnesia/awesome-ad-video-prompts"
  url: https://github.com/LichAmnesia/awesome-ad-video-prompts/blob/main/images/pov-morning-skincare-drop.png
  license: CC BY 4.0
verify:
  - Veo 3.1 实测 3 次，记录第一视角下双手的数量和形态是否正确
  - 示例图是仓库提供的 AI 关键帧图（虚构人物，已转 JPG 压缩）
---
**时长与镜头**：6 秒三拍：开瓶 → 液滴慢动作 → 点涂抬镜。POV 的关键是"相机就是眼睛"：手从画面下方进入、轻微手持晃动、结尾镜头上抬露一点脸，这些细节让观众代入。Veo 3.1 可选 4 / 6 / 8 秒（以官方说明为准），选 8 秒时把慢动作液滴拉长到 3 秒，或结尾加"把瓶子放回洗手台"。

**怎么填变量**：[磨砂玻璃滴管瓶] 换成"喷雾瓶""精油滚珠瓶"，动作改成"对着光喷一下，细雾里出现彩虹""在手腕上滚一下"。如果不想出现人脸，把最后一句改成"镜头向上一抬，扫到窗外的晨光"。

**常见失败与调整**：
- 出现第三只手：把"双手"改成"一只手拿瓶、另一只手只露出指尖"。
- 彩虹折射变成一大片彩光：写"一道很小的彩虹光点"。
- 镜子里的人和手对不上：删掉镜子，结尾停在脸颊特写。

> 改编自 [LichAmnesia/awesome-ad-video-prompts](https://github.com/LichAmnesia/awesome-ad-video-prompts)（awesome-ad-video-prompts contributors），许可证 CC BY 4.0。

### 英文原版

```
Vertical first-person POV, phone held at arm's length in a sun-washed bathroom, gentle handheld sway. 0-2s: hands enter low from the bottom of frame and twist open a frosted-glass [product] serum dropper; rippling caustic light slides across white subway tile, a single bead of water rolls down the mirror. 2-4s: slow squeeze in dreamy half-speed — one amber drop swells on the pipette tip, detaches, and falls, splitting the morning light into a tiny prism. 4-6s: the same hands press it into a cheekbone, a dewy sheen blooming outward across the pores, then the camera tilts up to catch a relaxed half-smile in the fogged mirror. Tight macro on glass and skin texture, warm 5200K window light, shallow focus, faint ASMR of the dropper click and one quiet exhale. The bottle holds a single consistent shape, label position, and frosted finish for the entire clip — no deformation, drift, melting, duplicated text, or warping.
```
