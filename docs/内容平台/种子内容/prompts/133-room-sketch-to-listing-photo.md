---
title: 手绘草图转实景提示词：按房间布局草图生成出租房实拍图（gpt-image-2）
slug: room-sketch-to-listing-photo
model: gpt-image-2
topics: [interior, photography]
aspectRatio: "4:3"
needsRefImage: true
useCase: 随手画一张房间布局草图上传，生成像手机拍的真实房间照片，适合转租 / 出租展示布局、装修前预览摆放效果。
prompt: |
  根据我上传的房间布局草图，生成一张真实的房间宣传照，用来向潜在租客展示这个房间。
  布局主题：左侧是一扇大落地窗，阳光和采光都很好；窗边有一个猫窝，上面躺着一只[橘猫]。房间里有一张大书桌，放着电脑、键盘、鼠标、手机等日常物品；[一位年轻人]坐在人体工学椅上用电脑。书桌右侧是一张[单人床]。
  整体空间关系严格按照草图。光线和质感要像用手机拍的卧室照片。
  硬性要求：草图里画出的所有物品都必须出现，包括窗外的太阳。
  需要避免：不要出现任何违背日常生活常识的元素或现象。
  其他比例和房间细节由你决定，保证自然、真实、不刻意。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/AnXin_37/status/2097554757506539972
  author: 安伈XinAn
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: 英文译文还原为中文并略作润色；宠物、人物和床型改为变量
images:
  - 133-room-sketch-to-listing-photo-1.jpg
imageCredit:
  by: 安伈XinAn
  url: https://youmind.com/gpt-image-2-prompts?id=33954
  license: CC BY 4.0
verify:
  - 在 gpt-image-2 上实测 3 次，记录成功率与最常见的失败形式
  - 草图中的每件物品是否都出现在结果里
  - 家具相对位置是否与草图一致
  - 确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）
---
**怎么用**：在纸上或手机备忘录里画出房间俯视或正视草图，标出窗、门、床、桌、柜的位置，拍照上传。提示词里的"布局主题"要和你的草图一一对应：草图画了什么，这里就写什么。

**常见问题**：
- 漏画物品：把"硬性要求"那句保留，并在里面逐一列出物品名。
- 空间比例失真（床比门还宽）：在草图上直接写尺寸，如"床 1.2m"，并在提示词里加"按草图标注的尺寸比例"。
- 用于真实出租：AI 图只能展示"布局示意"，挂出租信息时请使用房间实拍照片，或明确标注"效果示意图"，避免误导租客。

**迭代**：换成"晚上开着台灯的同一房间"，就能得到白天 / 夜晚两版展示。

### 英文原版

```text
Create a real-life room promotional image to market my room to potential tenants. The theme is room layout: a large floor-to-ceiling window on the left with excellent sunlight and lighting. Beside the window is a cat bed with a {argument name="pet" default="orange cat"} lying on it. Inside the bedroom is a large desk with daily items like a computer, keyboard, mouse, and phone. A young Chinese male is sitting on an ergonomic chair operating the computer. To the right of the desk is a single bed. The overall spatial relationship follows the sketch. Lighting and textures should look like a bedroom photo taken with a phone. Hard requirements: all items drawn in the sketch must appear, including the sun outside the window. Problems to avoid: do not include any elements or phenomena that contradict real daily life. Other proportions and room details are up to you to ensure a natural, realistic, and unforced effect.
```

> 改编自 [安伈XinAn](https://x.com/AnXin_37/status/2097554757506539972) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
