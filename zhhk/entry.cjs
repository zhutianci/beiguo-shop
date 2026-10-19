'use strict'
/**
 * 生产容器入口（Dockerfile 的 CMD）：先起繁体转换代理（3001），再加载 Next standalone 的 server.js（3000）。
 *
 * ZHHK_ENABLED≠'1' 时不起代理，行为与原来的 `node server.js` 完全相同——这是繁体版的总开关之一
 * （另一个是 nginx 有没有把 /zh-hk 送到 3001，见 docs/繁体香港版/部署说明.md）。
 * 代理起不来（词典坏了、端口被占）只打日志，**绝不影响 Next 启动**。
 */
const path = require('path')

if (process.env.ZHHK_ENABLED === '1') {
  try {
    require('./proxy.cjs').start({
      upstream: `http://127.0.0.1:${process.env.PORT || 3000}`,
      port: Number(process.env.ZHHK_PORT || 3001),
      host: '0.0.0.0',
    })
  } catch (e) {
    console.error('[zhhk] 繁体转换代理启动失败（简体站不受影响）：', e && e.stack)
  }
}

require(path.join(__dirname, '..', 'server.js'))
