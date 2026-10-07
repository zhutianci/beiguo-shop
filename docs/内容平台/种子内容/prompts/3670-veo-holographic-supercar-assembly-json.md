---
title: veo 3 JSON 提示词：全息线框组装跑车（发动机零件依次就位 · 360 度环绕产品展示）
slug: veo-holographic-supercar-assembly-json
model: veo
topics: [product-video, motion-graphics]
modelLabel: Veo 3
aspectRatio: "16:9"
needsRefImage: false
useCase: 科技感产品揭晓片：在反光的极简展台上，全息发动机、变速箱、电子元件依次闪光就位，车身面板无缝成形，车轮对齐、仪表亮起，最后 360 度环绕展示整车。适合汽车、电动车、高端数码产品的发布宣传。
prompt: |
  {
    "shot": {
      "composition": "动感的产品展示，特写与全景交替，结尾是围绕车辆的完整 360 度环绕",
      "lens": "50mm",
      "camera_movement": "360 度旋转揭示"
    },
    "subject": {
      "description": "一辆黑色的[高性能跑车]，从全息的内部组件一步步组装成完整、流线型的整车",
      "props": "发动机零件、变速箱、内部电子元件、车身面板、车轮、数字仪表盘"
    },
    "scene": {
      "location": "反光的极简展台环境",
      "time_of_day": "抽象的数字空间",
      "environment": "超干净的产品展示美学，高光泽表面，精确控制的灯光"
    },
    "visual_details": {
      "action": "全息的发动机、变速箱和电子元件随着一阵阵闪光卡入到位；车身面板无缝成形；车轮对齐，仪表盘亮起",
      "special_effects": "发光的全息影像，光爆，电火花，数字界面动画"
    },
    "cinematography": {
      "lighting": "高反差的聚光，突出车身轮廓和质感，强调反射与光影",
      "color_palette": "冷色调，黑色与金属色点缀，明亮的电子高光",
      "tone": "紧张、流畅、未来感"
    },
    "audio": {
      "music": "电影感电子配乐，深沉低音和未来感合成器",
      "ambient": "丰富的氛围铺底",
      "sound_effects": "金属咔嗒声，高频嗡鸣，机械低吼，液体般的呼啸，电火花点火声，车轮转动声，快速的界面提示音"
    }
  }
negativePrompt: 真实汽车品牌标志，车轮数量错误，车身扭曲，界面乱码文字，水印
source:
  repo: liu-kaining/Awesome-Veo3-Prompts
  url: https://github.com/liu-kaining/Awesome-Veo3-Prompts/blob/main/prompts/ferrari_holographic_assembly.md
  author: "liu-kaining"
  license: MIT
  licenseUrl: https://github.com/liu-kaining/Awesome-Veo3-Prompts/blob/main/LICENSE
  changes: "JSON 的值译为中文、键名保留英文；去掉了原文中的汽车品牌名，车型改为通用变量；删去帧率与空字段"
imageBrief: 仓库没有示例图。站长生成 1 条，截取"全息发动机就位""车身成形""360 度环绕"三帧。
verify:
  - Veo 实测 3 次：组装过程是否有逻辑（零件从内到外）、环绕时车身是否变形
  - 是否生成了类似真实品牌的车标
---
**时长与镜头**：8 秒内完成"零件就位 → 车身成形 → 仪表亮起 → 环绕"四步，节奏很满。如果组装过程显得混乱，可以拆成两条：第一条只做"全息零件依次就位"，第二条用第一条结尾作首帧做"360 度环绕整车"。

**怎么用**：做电动车、扫地机器人、手机等"内部有科技感"的产品时，这个"由内而外组装"的叙事特别合适——先给观众看核心部件（电池、芯片、电机），再看完整外观。把 props 换成你的核心部件清单即可。

**怎么填变量**：[高性能跑车] 换成"电动 SUV""折叠屏手机""无人机"；仪表盘亮起相应改为"屏幕点亮""螺旋桨转动"。

**常见失败与调整**：
- 零件乱飞没有组装感：action 写"零件按从内到外的顺序：发动机 → 底盘 → 车身 → 车轮"。
- 环绕后车身扭曲：环绕改成"半圈"，或最后用实拍产品素材。
- 界面动画出现乱码：写"界面只有线条和光点，没有文字"。

> 改编自 [liu-kaining/Awesome-Veo3-Prompts](https://github.com/liu-kaining/Awesome-Veo3-Prompts)（Copyright (c) 2025 liu-kaining，MIT License）。英文原版以真实品牌为主体，本站已改为通用写法，原文请见来源链接。
