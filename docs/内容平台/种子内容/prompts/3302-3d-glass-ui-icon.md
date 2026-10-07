---
title: 即梦提示词：3D 玻璃质感 UI 图标，半透明钱包装满金币（可换任意物件做图标）
slug: 3d-glass-ui-icon
model: jimeng
topics: [logo, ecommerce]
needsRefImage: false
aspectRatio: "1:1"
useCase: 做 App 图标、活动页金刚位、理财 / 红包 / 优惠券入口图时，生成一枚 3D 半透明玻璃材质的图标：柔和金色渐变、通透有光晕，背景干净留白。
prompt: |
  UI 图标：一个装满金币的[钱包]，钱包里外堆着一叠金币，金币上印着[人民币]符号。
  - 3D 效果，钱包是半透明的[彩虹玻璃]质感，能透过外壳看到里面的金币；
  - 柔和的金色渐变，半透明材质边缘带光晕；
  - 浅色背景，与主体形成色彩流动的对比；
  - 3D 渲染风格，主体居中，四周留白充足，画面有呼吸感。
  画幅 1:1。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-seedream-4.5
  url: https://jimeng.jianying.com/ai-tool/work-detail/7569196092471004454?workDetailType=Image&itemType=9
  author: "即梦用户 Jackie Chan"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: 译成中文并拆成要点；图标物件、货币符号、外壳材质设为变量；补充"透过外壳看到金币、主体居中留白"的描述
images:
  - 3302-3d-glass-ui-icon-1.jpg
imageCredit:
  by: "即梦用户 Jackie Chan"
  url: https://cms-assets.youmind.com/media/1765360359275_0kx2gu_1765339517519-f89k34-0217653395048557b67bbc2a2a9a26108e071e40bb0b084742913_0-600x600.jpg
  license: CC BY 4.0
verify:
  - 作者署名是仓库记录的即梦用户名，与一位知名演员同名，页面展示时注明"即梦用户"以免误解为名人
  - 原始出处是即梦作品页，核对页面仍可访问
  - 换成"礼物盒""优惠券"各测一次，看玻璃质感是否稳定
---
原作者用 Seedream 4.5 生成；即梦里选用 Seedream 系列图片模型使用。

**怎么填变量**：[钱包] 是图标主体，换成任何物件都能做成一套风格统一的图标，比如"礼物盒""购物袋""日历""盾牌"，配套内容也跟着改（礼物盒里冒出彩带、盾牌上印对勾）。[人民币] 可换"美元""积分星星"；[彩虹玻璃] 可换"磨砂玻璃""蓝色亚克力"。示例图里一个半透明的钱包，外壳泛着粉、橙、黄的彩虹光，能看到里面压着的金币，上方冒出六七枚印着 ¥ 符号的金币，右侧有一个金色按扣搭扣，背景是很浅的米白色。

**常见问题与调整**：
- 做一套图标风格不一致：每张都保留"同样的玻璃材质、同样的金色渐变、同样的光源方向"这一句。
- 玻璃不够透：加"外壳高透明度，边缘有折射和高光"。
- 背景需要透明：模型无法直接出透明底，生成纯白背景后再抠图。
- 金币符号变形：符号写得越简单越稳，或改成"金币表面光滑无图案"。

**适合**：App 图标、活动页金刚位、理财 / 会员 / 红包入口图；不适合需要严格品牌规范的官方图标。

### 英文原版

```
UI icon, a wallet filled with gold coins, a pile of gold coins, on the gold coins is the {argument name="currency type" default="RMB"} symbol, 3D effect, glass texture, soft golden gradient, translucent material halo effect, light background contrasting color flow, 3D rendering style, the image is full of breathing sense.
```

> 改编自 [即梦用户 Jackie Chan](https://jimeng.jianying.com/ai-tool/work-detail/7569196092471004454?workDetailType=Image&itemType=9) 发布、[YouMind-OpenLab/awesome-seedream-4.5](https://github.com/YouMind-OpenLab/awesome-seedream-4.5) 收录的提示词，仓库许可证 CC BY 4.0。
