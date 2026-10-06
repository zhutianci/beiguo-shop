---
title: seedance 提示词：水墨风武侠特效视频（刀光墨迹 · 五段旋转运镜）
slug: seedance-ink-wash-wuxia-vfx
model: seedance
topics: [motion-graphics, cinematic]
modelLabel: Seedance 2.0
aspectRatio: "16:9"
needsRefImage: false
useCase: 生成 15 秒黑白水墨风的武侠刀光特效片：刀锋特写、360° 环绕挥刀、墨迹拖尾、慢动作定格。适合做武侠 / 国风账号的片头、AI 武侠视频的转场素材，也是学习"每段写清镜头、画面、特效"三栏写法的样例。
prompt: |
  水墨风武侠特效短片，15 秒，16:9。整体是黑白水墨，只有迸散的火星带一点红色。主角是一位头戴[斗笠]、手持[长刀]的侠客。
  [0–3 秒] 镜头：从刀锋反光的特写快速推进，同时顺时针快速旋转（约每秒 180°），切入斗笠的剪影。画面：水墨刀光特写，火星粒子向外迸散，斗笠剪影从翻涌的墨云里浮现。特效：运动模糊、墨笔拖尾、粒子。
  [3–6 秒] 镜头：以人物为中心高速 360° 环绕（约每秒 270°），跟着挥刀的轨迹走。画面：中景挥刀，衣袍翻飞，墨迹随动作流淌。特效：动态墨烟、衣袍运动模糊、旋转带来的拖影。
  [6–9 秒] 镜头：从左到右高速横移跟拍，同时逆时针倾斜旋转（约每秒 90°），锁定刀的路径。画面：刀光轨迹线、迸散的火星、墨笔拖尾。特效：运动模糊、粒子、墨色残影。
  [9–12 秒] 镜头：低角度仰拍，快速升起并螺旋上升（约每秒 225°），从地面的墨痕一路升到人物上半身。画面：地上的墨痕、挥刀中的上半身、背景翻滚的墨云。特效：动态墨云、上升时的运动模糊、旋转形成的墨色漩涡。
  [12–15 秒] 镜头：慢动作特写，镜头缓慢顺时针旋转（约每秒 15°），刀光定格。画面：清晰的刀光和粒子，斗笠阴影下露出侠客的眼神（可选）。特效：慢动作、粒子渐渐消散、轻微镜头震动。
  声音：刀锋破风声、墨迹炸开的闷响、最后一刀定格时一声清脆的金属颤音。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-seedance-2-prompts
  url: https://x.com/liluocheng13/status/2106931613427028260
  author: "@liluocheng13（Zidan 子丹）"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: 原帖为中文、仓库收录的是英文译本；本站据英文版回译为中文，补充开头的整体风格、主角描述（斗笠、长刀改为变量）和声音一段
images:
  - 534-seedance-ink-wash-wuxia-vfx-1.jpg
imageCredit:
  by: "@liluocheng13（Zidan 子丹）"
  url: https://x.com/liluocheng13/status/2106931613427028260
  license: CC BY 4.0
verify:
  - 在 Seedance 2.0 实测 3 次：模型是否理解"每秒 180°"这类旋转速度，删掉数字只写"快速 / 缓慢旋转"效果是否差不多
  - 高速环绕时人物和刀是否变形、刀是否变成两把
  - 示例图是原帖视频封面（刀光与墨迹交叉的特写），站长实测后可替换
  - 确认原帖仍可访问、作者未另行声明保留权利
---
**时长与镜头**：五段各 3 秒，运镜从"推 → 环绕 → 横移 → 升 → 慢转"一路变化，最后一段放慢收住，这是特效片的标准收尾。如果平台单条时长不够，可以只保留第 1、2、5 段，开头刀光、中间环绕、结尾定格依然完整。

**怎么填变量**：[斗笠] 可以换成"[白色面纱]""[狐狸面具]"，[长刀] 换成"[细剑]""[油纸伞]"；整体色调也可以改成"青绿山水"或"朱砂红与墨黑"，只改第一句即可。

**常见失败与调整**：
- 画面变成彩色写实：在第一句后加"所有元素都像宣纸上的水墨笔触，没有写实材质"。
- 旋转太快人物糊成一团：把环绕速度去掉数字，改成"中速环绕半圈"。
- 墨迹像黑烟或血：写明"墨迹是干净的毛笔笔触，边缘有飞白"。

> 改编自 [@liluocheng13（Zidan 子丹）](https://x.com/liluocheng13/status/2106931613427028260) 发布、[YouMind-OpenLab/awesome-seedance-2-prompts](https://github.com/YouMind-OpenLab/awesome-seedance-2-prompts) 收录的提示词，许可证 CC BY 4.0。

### 英文原版

```
[0–3s] Camera: Rapid push-in from a close-up of the blade's glint, while the camera rotates clockwise at 180°/s, cutting into the silhouette of a bamboo hat (douli). Visuals: Close-up of ink-wash blade light, particle sparks bursting outward; the douli silhouette emerges from billowing ink clouds. Effects: Motion blur, ink brushstroke trails, particle effects.
[3–6s] Camera: High-speed 360° orbit centered on the character (270°/s), following the trajectory of the sword swing. Visuals: Medium shot of the character swinging the blade, robes billowing, ink brushstrokes flowing with the motion. Effects: Dynamic ink smoke, motion blur on the robes, visual drag caused by the rotation.
[6–9s] Camera: High-speed lateral tracking shot (left → right), while the camera tilts and rotates counterclockwise at 90°/s, locked onto the blade's path. Visuals: The blade's trajectory line, particle sparks bursting outward, ink brushstroke trails. Effects: Motion blur, particle effects, ink ghosting trails.
[9–12s] Camera: Low-angle upward shot with a fast crane-up, while the camera spirals at 225°/s, rising from the ink marks on the ground to the character's upper body. Visuals: Ink marks on the ground, the character mid-swing (upper body), rolling ink clouds in the background. Effects: Dynamic ink clouds, motion blur during the rise, ink-colored vortex created by the rotation.
[12–15s] Camera: Slow-motion close-up, with the camera rotating slowly clockwise at 15°/s as the blade light freezes in place. Visuals: Close-up of the blade light, crisp and clear particle effects, the character's gaze beneath the shadow of the douli (optional). Effects: Slow motion, particles dissipating, subtle camera shake.
```
