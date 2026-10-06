---
title: veo 3 JSON 提示词：仓鼠在博物馆狂奔（低机位追拍长镜头）
slug: veo-hamster-museum-chase
model: veo
topics: [cinematic]
modelLabel: Veo 3
aspectRatio: "16:9"
needsRefImage: false
useCase: 生成"一只气鼓鼓的仓鼠在宏伟博物馆走廊里全速狂奔、镜头贴地紧追"的萌宠喜剧镜头，带拨弦配乐和小脚步声，适合萌宠号、品牌趣味短片；也是练习"低机位追拍 + 喜剧音效"写法的样例。
prompt: |
  {
    "shot": {
      "composition": "紧贴地面的追拍镜头，跟在一只[仓鼠]身后，穿过宏伟的[博物馆]走廊",
      "lens": "14mm 广角低机位追逐镜头",
      "frame_rate": "脚步用高速摄影带出动态模糊，其余正常速度连续奔跑",
      "camera_movement": "长时间不间断的推轨跟拍，带轻微摇晃；躲避展品时快速甩镜"
    },
    "subject": {
      "description": "一只气呼呼的[仓鼠]全速狂奔，腮帮子鼓鼓的，小尾巴甩动，耳朵一扇一扇",
      "props": "大理石地面的倒影，身后飞起的小碎屑，散落的博物馆导览纸"
    },
    "scene": {
      "location": "装饰华丽的艺术博物馆，挑高的天花板，有回声的展厅",
      "time_of_day": "正午，天窗投下戏剧性的光",
      "environment": "宏伟的大厅，两侧排列雕塑的走廊，红色天鹅绒隔离绳从旁边掠过"
    },
    "visual_details": {
      "action": "[仓鼠]从展台底下钻过，绕开雕像，跳过地上的电线，镜头始终紧贴在它身后",
      "special_effects": "动态模糊拖影，越过障碍时的慢动作弹跳，踩到大理石时镜头轻微一震"
    },
    "cinematography": {
      "lighting": "自然光束配合展厅的反射光，仓鼠毛发上闪着暖光",
      "color_palette": "抛光石材、暖米色、红丝绒、金色光线",
      "tone": "史诗感、速度感、可爱的混乱"
    },
    "audio": {
      "music": "快节奏的[拨弦乐]配俏皮的鼓点",
      "ambient": "细碎的小脚步声，远处的警报声，呼啸的风声",
      "sound_effects": "急刹的吱吱声，跳跃时的噗噗声，小爪子拍地声，隔离绳甩过的嗖嗖声",
      "mix_level": "紧凑的混音，速度感清晰，喜剧节奏卡点"
    },
    "dialogue": {
      "line": "",
      "subtitles": false
    }
  }
negativePrompt: null
source:
  repo: liu-kaining/Awesome-Veo3-Prompts
  url: https://github.com/liu-kaining/Awesome-Veo3-Prompts/blob/main/prompts/hamster_museum_sprint_adventure.md
  author: liu-kaining
  license: MIT
  licenseUrl: https://github.com/liu-kaining/Awesome-Veo3-Prompts/blob/main/LICENSE
  changes: JSON 的值译为中文、键名保留英文；删去空字段；帧率数字改为文字描述；主角、场景、配乐改为变量
imageBrief: 仓库没有示例图。生成 1 条，截取"钻过展台""跳过电线"两帧作展示图。
verify:
  - 在 Veo 3 实测 3 次，记录仓鼠是否出现多余的腿、长相前后是否一致
  - 博物馆里的画作和雕塑是否被画成真实的知名艺术品（如是，在提示词中加"虚构的展品"）
  - 确认原仓库文件仍可访问
---
**时长与镜头**：整条是一个不间断的贴地追拍长镜头，8 秒刚好。14mm 广角 + 低机位会把小动物衬得很"史诗"，这是萌宠喜剧最常用的反差手法。

**怎么填变量**：[仓鼠] 换成"[柯基]""[小鸭子]""[一只发条玩具车]"；[博物馆] 换成"[超市货架通道]""[图书馆]""[机场航站楼]"，并把 environment 里的东西换成对应场景的物件。配乐 [拨弦乐] 换成"[马戏团风格的手风琴]"会更搞笑。

**常见失败与调整**：
- 跑起来腿数不对、动作抽搐：把 frame_rate 改成"正常速度"，减少高速摄影的描述。
- 镜头跟丢主角：在 camera_movement 里加"主角始终位于画面下方中央"。
- 展品像真实名画：在 scene 里写"展品都是虚构的雕塑和抽象画"。

> 改编自 [liu-kaining/Awesome-Veo3-Prompts](https://github.com/liu-kaining/Awesome-Veo3-Prompts)（Copyright (c) 2025 liu-kaining，MIT License）。

### 英文原版

```json
{
  "shot": {
    "composition": "tight ground-level tracking shot behind a hamster sprinting through grand museum corridors",
    "lens": "14mm wide low-angle chase lens",
    "frame_rate": "120fps for foot blur, 60fps continuous run",
    "camera_movement": "long uninterrupted dolly with subtle sway, rapid whip-pans as it dodges exhibits"
  },
  "subject": {
    "description": "furious hamster sprinting full speed with cheeks puffed, tail flicking, ears flapping",
    "wardrobe": "",
    "props": "marble floor reflections, tiny crumbs flying behind, scattered museum papers"
  },
  "scene": {
    "location": "ornate art museum with high ceilings and echoing chambers",
    "time_of_day": "midday with dramatic skylight",
    "environment": "grand halls, sculpture-lined corridors, red velvet ropes whipping past"
  },
  "visual_details": {
    "action": "hamster runs under pedestals, swerves around statues, leaps over cables, camera sticks tight to rear",
    "special_effects": "motion blur trails, slow-mo bounce over obstacle, camera shake on marble tap",
    "hair_clothing_motion": ""
  },
  "cinematography": {
    "lighting": "natural sun shafts with art gallery bounce, warm glints on hamster fur",
    "color_palette": "polished stone, warm beige, red velvet, golden light",
    "tone": "epic, fast, charming chaos"
  },
  "audio": {
    "music": "fast-paced pizzicato strings + whimsical drums",
    "ambient": "tiny foot patters, distant alarm, air rush",
    "sound_effects": "skid squeaks, hop puffs, soft slap feet, display rope swish",
    "mix_level": "tight mix with high-speed clarity and comedic timing"
  },
  "dialogue": {
    "character": "",
    "line": "",
    "subtitles": false
  }
}
```
