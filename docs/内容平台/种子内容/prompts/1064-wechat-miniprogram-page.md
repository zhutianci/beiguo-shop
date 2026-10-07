---
title: 微信小程序开发提示词（页面 WXML / WXSS / JS / JSON 分文件生成、生命周期、登录与分包）
slug: wechat-miniprogram-page
model: any-llm
topics: [coding]
needsRefImage: false
useCase: 用原生框架开发微信小程序页面时用：描述页面功能，得到按小程序目录规范拆分的四个文件代码，正确使用生命周期与数据绑定、封装网络请求、处理登录态与授权，并提醒包体积、分包和审核相关的注意事项。
prompt: |
  你是一名有多个上线项目经验的微信小程序开发工程师。请帮我实现一个页面。

  - 页面路径与功能：[页面路径与功能]（例：pages/order/list 订单列表，下拉刷新、上拉加载、按状态切换）
  - 开发方式：[原生小程序/Taro/uni-app]
  - 后端接口：[接口地址、参数、返回格式]
  - 登录方式：[如 wx.login 换取后端登录态]
  - 需要用到的能力：[如下拉刷新、分享、订阅消息、扫码]

  要求：
  1. 按页面目录输出四个文件：页面配置、结构、样式、逻辑，各自职责清楚；需要的话补充公共组件和全局配置中需要增加的内容。
  2. 生命周期：说明在页面加载、显示、下拉刷新、触底等生命周期中分别做什么；避免在显示时每次都重复请求不需要刷新的数据。
  3. 数据绑定：只把界面需要的数据放进页面数据；修改数据时只更新变化的部分（例如按路径更新列表中的某一项），避免一次性传输大量数据导致卡顿。
  4. 网络请求：封装统一的请求方法，处理登录态过期后自动重新登录并重试一次、统一错误提示、加载状态；服务器域名需要在后台配置。
  5. 列表：分页加载、到底提示、空状态、加载失败重试，防止快速滚动时重复请求同一页。
  6. 登录与授权：按当前平台规则处理，不在用户进入页面时就强制索要个人信息；获取手机号等能力按官方要求通过按钮由用户主动触发。
  7. 性能与包体积：图片放到服务器或使用合适的压缩格式；主包体积受平台限制，说明何时需要分包以及分包的配置方式。
  8. 审核提醒：与这个页面功能相关的常见审核要求（如隐私协议、用户主动触发授权）。

  涉及平台限制（包体积上限、接口权限、授权规则）的数字和规则，注明「以微信官方文档当前说明为准」。
negativePrompt: null
source: null
verify:
  - 核对主包与分包体积上限、getPhoneNumber 按钮用法与隐私协议要求（https://developers.weixin.qq.com/miniprogram/dev/framework/）
---
**怎么填变量**：[开发方式] 一定要写清楚：原生小程序、Taro、uni-app 的写法完全不同。[需要用到的能力] 里提到的分享、订阅消息、获取手机号等能力，各有平台规则和权限要求，AI 会一并提醒。

**常见坑**：
- 每次更新数据都把整个列表重新传给页面，列表一长就明显卡顿。只更新变化的那一项。
- 用户一进页面就弹出授权或索要个人信息，体验差，也容易在审核时被拒。按需、由用户主动触发。
- 登录态过期的处理分散在各个页面里，到处重复。在统一的请求方法里集中处理。

**追问技巧**：追问「把这个页面的请求方法封装成可以在全部页面复用的模块，并加上请求去重」，或「主包快超出限制了，帮我规划分包方案」。

### 示例输出

> 示例，仅供参考（逻辑文件节选）

```js
// pages/order/list/list.js
const { request } = require('../../../utils/request')

Page({
  data: { status: 'all', list: [], page: 1, loading: false, finished: false },

  onLoad() { this.loadPage(true) },

  onPullDownRefresh() {
    this.loadPage(true).finally(() => wx.stopPullDownRefresh())
  },

  onReachBottom() { this.loadPage(false) },

  async loadPage(reset) {
    if (this.data.loading || (!reset && this.data.finished)) return   // 防止重复请求
    const page = reset ? 1 : this.data.page
    this.setData({ loading: true })
    try {
      const res = await request({ url: '/api/orders', data: { status: this.data.status, page } })
      this.setData({
        list: reset ? res.items : this.data.list.concat(res.items),
        page: page + 1,
        finished: res.items.length < 20,
      })
    } catch (e) {
      wx.showToast({ title: '加载失败，下拉重试', icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  },
})
```
