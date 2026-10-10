---
title: "ai图标生成提示词：等距 3D 安全合规图标 15 件套（gpt-image-2）"
slug: isometric-security-icon-grid
model: gpt-image-2
topics: [logo, ppt, illustration]
aspectRatio: "16:9"
needsRefImage: false
useCase: "做安全产品官网、售前 PPT 或合规培训材料时，一次生成 3 行 5 列、同一等距视角的 3D 小物件图标：挂锁、盾牌、防火墙、摄像头、服务器、合规清单等，逐个点名、可整套换主题。"
prompt: |
  画一张现代等距视角（isometric）的 3D 图标合集，主题是[网络安全与合规]。
  背景为干净的[浅灰色]，宽幅横版，图标按 3 行 5 列等间距排列，恰好 15 个互相独立的图标，没有边框、没有分隔线、没有水印。
  风格：柔和阴影、带光泽的 3D 材质、圆润边角，主色[深蓝色]，搭配白、灰，少量红色和橙色点缀；所有图标保持同一等距视角和相同的微缩模型比例，边缘清晰，有环境光遮蔽和轻微的接触阴影，整体是精致的 SaaS / 企业安全品牌风格。
  第一行：1）蓝色挂锁，银色锁梁，黑色钥匙孔；2）蓝色盾牌徽章，白色对勾，金属包边；3）斜放的银色钥匙；4）深色的指纹识别面板，上面一条发光的蓝色指纹扫描线；5）台式显示器登录界面，有锁图标、密码圆点和一个写着"LOGIN"的蓝色按钮。
  第二行：6）折角的白色文档，蓝色锁图标，标注"ENCRYPTED"；7）红砖防火墙，前面一团橙色火焰；8）白色监控摄像头，蓝色镜头，装在小墙架上；9）带夹子的工牌，上面有头像缩略图、几行文字和条形码；10）红色三角警示牌，黑色感叹号。
  第三行：11）深色服务器机柜，彩色状态灯，前面一个蓝色盾牌对勾徽章；12）标注"COMPLIANCE"的夹板清单，绿色勾选框；13）深色手机上的人脸识别界面，线框人脸、扫描框和"VERIFYING..."字样；14）标注"ALERT"的告警列表卡片，一把放大镜正在检查列表；15）灰色保险箱，圆形密码转盘，旁边一张标注"POLICY"的白色制度文件，带灰色横线和绿色对勾。
  文字只出现在上面指定的位置，尽量少、清晰可读。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/kumiko_shiraki/status/2054855832337351081
  author: "@kumiko_shiraki"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文，按三行重新分段；主题、主色、底色保留为变量；图标上的英文小字保留原样并在正文说明可改中文；删去结尾重复的自定义说明。"
images:
  - 3467-isometric-security-icon-grid-1.jpg
imageCredit:
  by: "@kumiko_shiraki"
  url: https://youmind.com/gpt-image-2-prompts?id=20347
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：[网络安全与合规] 是整套图标的主题，[深蓝色] 是主色，[浅灰色] 是底色。换主题时把三行里的 15 个物件一并换掉，按"物件 + 颜色 + 一个细节"的格式逐个写，例如电商主题写"橙色购物车，里面两个纸箱""带对勾的快递盒"。图标上的英文小字可以改成中文，如"登录""已加密""合规"，每处不超过 4 个字。

示例图是浅灰底上的三行图标：第一行是蓝色挂锁、带对勾的盾牌、银钥匙、指纹面板和登录显示器；第二行是加密文档、砖墙加火焰、监控摄像头、工牌和红色警示牌；第三行是服务器、合规清单、人脸识别手机、告警卡片，保险箱和制度文件被分开画成了两个，所以最后一行实际有 6 个物件。

**常见问题**：
- 数量或行列不对：把"3 行 5 列、恰好 15 个"放到提示词最前面，或一次只出一行 5 个。
- 视角不统一：加"所有图标都从同一个右上 45 度俯视角度绘制"。
- 要单独使用：生成后自行裁切，纯色底便于抠图。

**适合**：安全产品官网、售前 PPT、合规培训材料的配图；不适合当 App 小尺寸图标，细节太多，缩小后会糊。

### 英文原版

```text
Create a modern isometric illustration sheet on a clean light gray background, showing a seamless grid of cybersecurity, privacy, and compliance icons with soft shadows, glossy 3D materials, rounded edges, and a blue, white, gray, red, and orange accent palette. Use a wide horizontal canvas, evenly spaced rows and columns, with no border or watermark. Include exactly 15 discrete icons arranged in a 3-row by 5-column grid: top row: 1) a blue padlock with silver shackle and black keyhole, 2) a blue shield badge with a white check mark and metallic rim, 3) a silver key angled diagonally, 4) a dark smartphone-like biometric panel showing a glowing blue fingerprint scan line, 5) a desktop monitor login screen with a lock icon, password dots, and a blue button labeled “LOGIN”; middle row: 6) a white document page with folded corner, blue lock icon, and label “ENCRYPTED”, 7) a red brick firewall with an orange flame in front, 8) a white surveillance camera with blue lens mounted on a small wall bracket, 9) an ID badge with clip, portrait thumbnail, text lines, and barcode, 10) a red triangular warning sign with black exclamation mark; bottom row: 11) a dark server stack with colored status lights and a blue shield check badge in front, 12) a clipboard checklist labeled “COMPLIANCE” with green checkboxes, 13) a dark smartphone facial-recognition screen showing a wireframe face, scan brackets, and “VERIFYING...” text, 14) an alert dashboard card labeled “ALERT” with a magnifying glass inspecting the list, 15) a gray safe/vault box with round combination dial beside a white policy document labeled “POLICY” with gray lines and green check mark. Keep all icons consistent in isometric perspective, miniature object scale, polished SaaS/security branding style, crisp edges, ambient occlusion, and subtle contact shadows. Text should be minimal and legible only where specified. Theme customization: {argument name="theme" default="security and compliance"}; primary color customization: {argument name="primary color" default="deep blue"}; background customization: {argument name="background color" default="light gray"}.
```

> 改编自 [@kumiko_shiraki](https://x.com/kumiko_shiraki/status/2054855832337351081) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
